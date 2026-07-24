import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common'
import {
  AnalyticsFreshness,
  Prisma,
  Role,
  UsageImportStatus,
} from '@lokocontent/db'
import { PrismaService } from '../prisma'
import { MuxService, type MuxEngagementCounts } from '../mux'

type UsagePeriod = 'day' | 'week' | 'month' | 'year'

type NormalizedMuxView = {
  muxViewId: string
  contentId: string | null
  creatorId: string | null
  playbackId: string | null
  muxAssetId: string | null
  viewerUserId: string | null
  muxViewerId: string | null
  viewStart: Date | null
  viewEnd: Date
  watchTimeMs: number
  playingTimeMs: number
  videoDurationMs: number | null
  maxPlayheadTimeMs: number | null
  countryCode: string | null
  deviceCategory: string | null
  osFamily: string | null
  browser: string | null
  playerName: string | null
  playbackFailure: boolean
  errorTypeId: number | null
  isQualified: boolean
  raw: Prisma.InputJsonValue
}

type ImportSource = 'daily_export' | 'video_views_api' | 'streaming_export'

const DAY_MS = 24 * 60 * 60 * 1000
const DEFAULT_RECENT_IMPORT_MINUTES = 15
const DEFAULT_POLL_INTERVAL_MS = 10 * 60 * 1000
const DEFAULT_LIVE_CACHE_MS = 45 * 1000

@Injectable()
export class UsageService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(UsageService.name)
  private recentPollTimer?: NodeJS.Timeout
  private dailyImportTimer?: NodeJS.Timeout
  private readonly liveCountsCache = new Map<
    string,
    { expiresAt: number; value: MuxEngagementCounts }
  >()

  constructor(
    private readonly prisma: PrismaService,
    private readonly muxService: MuxService,
  ) {}

  onModuleInit() {
    if (process.env.MUX_USAGE_JOBS_ENABLED !== 'true') {
      return
    }

    const intervalMs = Number(
      process.env.MUX_USAGE_POLL_INTERVAL_MS ?? DEFAULT_POLL_INTERVAL_MS,
    )

    this.recentPollTimer = setInterval(() => {
      void this.importRecentProvisionalUsage().catch((error) => {
        this.logger.warn(`Recent Mux usage poll failed: ${error}`)
      })
    }, intervalMs)

    this.dailyImportTimer = setInterval(() => {
      void this.importPreviousUtcDayIfReady().catch((error) => {
        this.logger.warn(`Daily Mux usage import failed: ${error}`)
      })
    }, intervalMs)
  }

  onModuleDestroy() {
    if (this.recentPollTimer) clearInterval(this.recentPollTimer)
    if (this.dailyImportTimer) clearInterval(this.dailyImportTimer)
  }

  async importMuxUsageForDate(dateString: string) {
    const date = parseDateOnlyUtc(dateString)
    const start = startOfUtcDay(date)
    const end = new Date(start.getTime() + DAY_MS)

    return this.importRange({
      start,
      end,
      date: start,
      freshness: AnalyticsFreshness.SETTLED,
      preferredSource: 'daily_export',
    })
  }

  async importRecentProvisionalUsage(minutes = DEFAULT_RECENT_IMPORT_MINUTES) {
    const end = new Date()
    const start = new Date(end.getTime() - minutes * 60 * 1000)

    return this.importRange({
      start,
      end,
      date: startOfUtcDay(end),
      freshness: AnalyticsFreshness.PROVISIONAL,
      preferredSource: 'video_views_api',
    })
  }

  async listImports(query: { from?: string; to?: string }) {
    return this.prisma.muxUsageImport.findMany({
      where: {
        ...(query.from || query.to
          ? {
              date: {
                ...(query.from ? { gte: parseDateOnlyUtc(query.from) } : null),
                ...(query.to ? { lte: parseDateOnlyUtc(query.to) } : null),
              },
            }
          : null),
      },
      orderBy: { startedAt: 'desc' },
      take: 100,
    })
  }

  async getCreatorOverviewUsage(creatorId: string) {
    const [settled, provisional, latestUsage, latestImport, liveViewers] =
      await Promise.all([
        this.prisma.dailyCreatorUsage.aggregate({
          where: { creatorId, freshness: AnalyticsFreshness.SETTLED },
          _sum: {
            qualifiedViews: true,
            watchTimeMs: true,
            playingTimeMs: true,
          },
        }),
        this.prisma.dailyCreatorUsage.aggregate({
          where: { creatorId, freshness: AnalyticsFreshness.PROVISIONAL },
          _sum: {
            qualifiedViews: true,
            watchTimeMs: true,
            playingTimeMs: true,
          },
        }),
        this.prisma.dailyCreatorUsage.findFirst({
          where: { creatorId },
          orderBy: { lastSyncedAt: 'desc' },
          select: { lastSyncedAt: true },
        }),
        this.prisma.muxUsageImport.findFirst({
          where: { status: UsageImportStatus.COMPLETED },
          orderBy: { completedAt: 'desc' },
          select: { completedAt: true },
        }),
        this.getCreatorLiveViewers(creatorId),
      ])

    const watchTimeMs =
      toNumber(settled._sum.watchTimeMs) + toNumber(provisional._sum.watchTimeMs)
    const playingTimeMs =
      toNumber(settled._sum.playingTimeMs) +
      toNumber(provisional._sum.playingTimeMs)

    return {
      settledViews: settled._sum.qualifiedViews ?? 0,
      provisionalViews: provisional._sum.qualifiedViews ?? 0,
      liveViewers,
      watchMinutes: msToMinutes(watchTimeMs),
      playingMinutes: msToMinutes(playingTimeMs),
      lastAnalyticsSyncAt:
        latestUsage?.lastSyncedAt ?? latestImport?.completedAt ?? null,
    }
  }

  async getCreatorUsage(creatorId: string, period: UsagePeriod) {
    const { start, end, bucket } = getUsageRange(period)
    const rows = await this.prisma.dailyCreatorUsage.findMany({
      where: {
        creatorId,
        date: { gte: start, lt: end },
      },
      orderBy: { date: 'asc' },
    })
    const selectedRows = selectFreshestRows(rows, (row) => row.date)
    const buckets = new Map<
      string,
      {
        date: string
        views: number
        uniqueViewers: number
        watchMinutes: number
        playingMinutes: number
        billableMinutes: number
        freshness: AnalyticsFreshness
      }
    >()

    selectedRows.forEach((row) => {
      const key = bucket === 'month' ? formatMonthKey(row.date) : formatDayKey(row.date)
      const current =
        buckets.get(key) ??
        {
          date: key,
          views: 0,
          uniqueViewers: 0,
          watchMinutes: 0,
          playingMinutes: 0,
          billableMinutes: 0,
          freshness: row.freshness,
        }

      current.views += row.qualifiedViews
      current.uniqueViewers += row.uniqueViewers
      current.watchMinutes += msToMinutes(toNumber(row.watchTimeMs))
      current.playingMinutes += msToMinutes(toNumber(row.playingTimeMs))
      current.billableMinutes += msToMinutes(toNumber(row.billableWatchTimeMs))
      current.freshness = freshest(current.freshness, row.freshness)
      buckets.set(key, current)
    })

    const data = Array.from(buckets.values())
    const total = data.reduce(
      (sum, item) => ({
        views: sum.views + item.views,
        uniqueViewers: sum.uniqueViewers + item.uniqueViewers,
        watchMinutes: sum.watchMinutes + item.watchMinutes,
        playingMinutes: sum.playingMinutes + item.playingMinutes,
        billableMinutes: sum.billableMinutes + item.billableMinutes,
      }),
      {
        views: 0,
        uniqueViewers: 0,
        watchMinutes: 0,
        playingMinutes: 0,
        billableMinutes: 0,
      },
    )

    return { data, total }
  }

  async getContentAnalytics(requestingUserId: string, contentId: string) {
    const content = await this.prisma.videoContent.findFirst({
      where: { id: contentId, deletedAt: null },
      select: {
        id: true,
        creatorId: true,
        muxPlaybackId: true,
        title: true,
        views: true,
      },
    })

    if (!content) {
      throw new NotFoundException('Content not found')
    }

    await this.assertCanViewCreatorAnalytics(requestingUserId, content.creatorId)

    const [rows, latestUsage, liveCounts] = await Promise.all([
      this.prisma.muxVideoView.findMany({
        where: { contentId: content.id },
        orderBy: { viewEnd: 'desc' },
        take: 10000,
      }),
      this.prisma.dailyContentUsage.findFirst({
        where: { contentId: content.id },
        orderBy: { lastSyncedAt: 'desc' },
      }),
      this.getLiveCountsForContent(content.id),
    ])

    const rawViews = rows.length
    const qualifiedRows = rows.filter((row) => row.isQualified)
    const qualifiedViews = qualifiedRows.length
    const uniqueViewers = new Set(
      qualifiedRows.map((row) => row.viewerUserId ?? row.muxViewerId ?? row.id),
    ).size
    const playbackFailures = rows.filter((row) => row.playbackFailure).length
    const watchTimeMs = qualifiedRows.reduce(
      (sum, row) => sum + row.watchTimeMs,
      0,
    )
    const playingTimeMs = qualifiedRows.reduce(
      (sum, row) => sum + row.playingTimeMs,
      0,
    )
    const completionRates = qualifiedRows
      .map((row) =>
        row.videoDurationMs && row.videoDurationMs > 0
          ? Math.min(row.playingTimeMs / row.videoDurationMs, 1)
          : null,
      )
      .filter((rate): rate is number => rate !== null)
    const completionRate =
      completionRates.length > 0
        ? completionRates.reduce((sum, rate) => sum + rate, 0) /
          completionRates.length
        : null

    return {
      contentId: content.id,
      title: content.title,
      views: content.views,
      rawViews,
      qualifiedViews,
      uniqueViewers,
      liveViews: liveCounts.views,
      liveViewers: liveCounts.viewers,
      watchMinutes: msToMinutes(watchTimeMs),
      playingMinutes: msToMinutes(playingTimeMs),
      averageWatchSeconds:
        qualifiedViews > 0 ? Math.round(watchTimeMs / qualifiedViews / 1000) : 0,
      completionRate,
      playbackFailureRate: rawViews > 0 ? playbackFailures / rawViews : 0,
      countryBreakdown: buildBreakdown(rows, 'countryCode'),
      deviceBreakdown: buildBreakdown(rows, 'deviceCategory'),
      freshness:
        liveCounts.updatedAt !== null
          ? AnalyticsFreshness.LIVE
          : latestUsage?.freshness ?? AnalyticsFreshness.SETTLED,
      lastAnalyticsSyncAt: latestUsage?.lastSyncedAt ?? null,
    }
  }

  async getLiveCountsForContent(contentId: string) {
    const cached = this.liveCountsCache.get(contentId)
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value
    }

    try {
      const counts = await this.muxService.getEngagementCountsForVideoId(contentId)
      this.liveCountsCache.set(contentId, {
        value: counts,
        expiresAt: Date.now() + DEFAULT_LIVE_CACHE_MS,
      })
      return counts
    } catch (error) {
      this.logger.warn(`Failed to retrieve live Mux counts for ${contentId}: ${error}`)
      return { views: 0, viewers: 0, updatedAt: null, freshness: 'LIVE' as const }
    }
  }

  private async importRange({
    start,
    end,
    date,
    freshness,
    preferredSource,
  }: {
    start: Date
    end: Date
    date: Date
    freshness: AnalyticsFreshness
    preferredSource: ImportSource
  }) {
    if (!this.muxService.hasApiCredentials()) {
      throw new Error('Mux API credentials are not configured')
    }

    const importRow = await this.prisma.muxUsageImport.create({
      data: {
        date: startOfUtcDay(date),
        source: preferredSource,
        freshness,
        status: UsageImportStatus.RUNNING,
      },
    })

    try {
      const rawRows =
        preferredSource === 'daily_export'
          ? await this.loadDailyExportRows(start)
          : await this.muxService.listVideoViewDetails(start, end)
      const { imported, skipped } = await this.upsertMuxViews(rawRows, freshness)

      await this.recomputeDailyAggregates(start, end, freshness)

      if (freshness === AnalyticsFreshness.SETTLED) {
        await this.clearProvisionalAggregates(start, end)
      }

      const completed = await this.prisma.muxUsageImport.update({
        where: { id: importRow.id },
        data: {
          status: UsageImportStatus.COMPLETED,
          completedAt: new Date(),
          rowsImported: imported,
          rowsSkipped: skipped,
        },
      })

      return completed
    } catch (error) {
      if (preferredSource === 'daily_export') {
        this.logger.warn(`Daily Mux export unavailable, falling back to API: ${error}`)
        return this.retryImportWithVideoViewsApi(importRow.id, start, end, freshness)
      }

      await this.prisma.muxUsageImport.update({
        where: { id: importRow.id },
        data: {
          status: UsageImportStatus.FAILED,
          completedAt: new Date(),
          error: error instanceof Error ? error.message : String(error),
        },
      })
      throw error
    }
  }

  private async retryImportWithVideoViewsApi(
    importId: string,
    start: Date,
    end: Date,
    freshness: AnalyticsFreshness,
  ) {
    try {
      const rawRows = await this.muxService.listVideoViewDetails(start, end)
      const { imported, skipped } = await this.upsertMuxViews(rawRows, freshness)

      await this.recomputeDailyAggregates(start, end, freshness)
      if (freshness === AnalyticsFreshness.SETTLED) {
        await this.clearProvisionalAggregates(start, end)
      }

      return this.prisma.muxUsageImport.update({
        where: { id: importId },
        data: {
          source: 'video_views_api',
          status: UsageImportStatus.COMPLETED,
          completedAt: new Date(),
          rowsImported: imported,
          rowsSkipped: skipped,
        },
      })
    } catch (error) {
      await this.prisma.muxUsageImport.update({
        where: { id: importId },
        data: {
          source: 'video_views_api',
          status: UsageImportStatus.FAILED,
          completedAt: new Date(),
          error: error instanceof Error ? error.message : String(error),
        },
      })
      throw error
    }
  }

  private async loadDailyExportRows(date: Date) {
    const exportDate = formatDayKey(date)
    const exports = await this.muxService.listVideoViewExports()
    const entry = exports.data.find((item) => item.export_date === exportDate)

    if (!entry) {
      throw new Error(`No Mux video view export found for ${exportDate}`)
    }

    const file =
      entry.files.find((item) => item.type.toLowerCase().includes('csv')) ??
      entry.files[0]

    if (!file?.path) {
      throw new Error(`Mux export ${exportDate} did not include a file path`)
    }

    const text = await this.muxService.downloadExportText(file.path)
    return parseCsv(text)
  }

  private async upsertMuxViews(
    rawRows: Array<Record<string, unknown>>,
    freshness: AnalyticsFreshness,
  ) {
    const contentById = await this.loadContentMap(rawRows)
    let imported = 0
    let skipped = 0

    for (const rawRow of rawRows) {
      const normalized = normalizeMuxView(rawRow, contentById, freshness)

      if (!normalized) {
        skipped += 1
        continue
      }

      await this.prisma.muxVideoView.upsert({
        where: { muxViewId: normalized.muxViewId },
        update: {
          freshness,
          contentId: normalized.contentId,
          creatorId: normalized.creatorId,
          playbackId: normalized.playbackId,
          muxAssetId: normalized.muxAssetId,
          viewerUserId: normalized.viewerUserId,
          muxViewerId: normalized.muxViewerId,
          viewStart: normalized.viewStart,
          viewEnd: normalized.viewEnd,
          watchTimeMs: normalized.watchTimeMs,
          playingTimeMs: normalized.playingTimeMs,
          videoDurationMs: normalized.videoDurationMs,
          maxPlayheadTimeMs: normalized.maxPlayheadTimeMs,
          countryCode: normalized.countryCode,
          deviceCategory: normalized.deviceCategory,
          osFamily: normalized.osFamily,
          browser: normalized.browser,
          playerName: normalized.playerName,
          playbackFailure: normalized.playbackFailure,
          errorTypeId: normalized.errorTypeId,
          isQualified: normalized.isQualified,
          raw: normalized.raw,
        },
        create: {
          muxViewId: normalized.muxViewId,
          freshness,
          contentId: normalized.contentId,
          creatorId: normalized.creatorId,
          playbackId: normalized.playbackId,
          muxAssetId: normalized.muxAssetId,
          viewerUserId: normalized.viewerUserId,
          muxViewerId: normalized.muxViewerId,
          viewStart: normalized.viewStart,
          viewEnd: normalized.viewEnd,
          watchTimeMs: normalized.watchTimeMs,
          playingTimeMs: normalized.playingTimeMs,
          videoDurationMs: normalized.videoDurationMs,
          maxPlayheadTimeMs: normalized.maxPlayheadTimeMs,
          countryCode: normalized.countryCode,
          deviceCategory: normalized.deviceCategory,
          osFamily: normalized.osFamily,
          browser: normalized.browser,
          playerName: normalized.playerName,
          playbackFailure: normalized.playbackFailure,
          errorTypeId: normalized.errorTypeId,
          isQualified: normalized.isQualified,
          raw: normalized.raw,
        },
      })
      imported += 1
    }

    return { imported, skipped }
  }

  private async loadContentMap(rawRows: Array<Record<string, unknown>>) {
    const contentIds = new Set<string>()
    const playbackIds = new Set<string>()

    rawRows.forEach((row) => {
      const videoId = getString(row, ['video_id'])
      const playbackId = getString(row, ['playback_id'])

      if (videoId) contentIds.add(videoId)
      if (playbackId) playbackIds.add(playbackId)
    })

    const conditions: Prisma.VideoContentWhereInput[] = []
    if (contentIds.size > 0) {
      conditions.push({ id: { in: Array.from(contentIds) } })
    }
    if (playbackIds.size > 0) {
      conditions.push({ muxPlaybackId: { in: Array.from(playbackIds) } })
    }

    if (conditions.length === 0) {
      return {
        byId: new Map<string, { id: string; creatorId: string; muxPlaybackId: string | null; muxAssetId: string | null }>(),
        byPlaybackId: new Map<string, { id: string; creatorId: string; muxPlaybackId: string | null; muxAssetId: string | null }>(),
      }
    }

    const content = await this.prisma.videoContent.findMany({
      where: {
        OR: conditions,
      },
      select: {
        id: true,
        creatorId: true,
        muxPlaybackId: true,
        muxAssetId: true,
      },
    })

    const byId = new Map<string, (typeof content)[number]>()
    const byPlaybackId = new Map<string, (typeof content)[number]>()

    content.forEach((item) => {
      byId.set(item.id, item)
      if (item.muxPlaybackId) byPlaybackId.set(item.muxPlaybackId, item)
    })

    return { byId, byPlaybackId }
  }

  private async recomputeDailyAggregates(
    start: Date,
    end: Date,
    freshness: AnalyticsFreshness,
  ) {
    const existingContent = await this.prisma.dailyContentUsage.findMany({
      where: { date: { gte: start, lt: end }, freshness },
      select: { contentId: true },
    })
    const affectedContentIds = new Set(existingContent.map((item) => item.contentId))

    const rows = await this.prisma.muxVideoView.findMany({
      where: {
        viewEnd: { gte: start, lt: end },
        freshness,
        contentId: { not: null },
        creatorId: { not: null },
      },
      select: {
        id: true,
        contentId: true,
        creatorId: true,
        viewerUserId: true,
        muxViewerId: true,
        viewEnd: true,
        watchTimeMs: true,
        playingTimeMs: true,
        playbackFailure: true,
        isQualified: true,
      },
    })

    rows.forEach((row) => {
      if (row.contentId) affectedContentIds.add(row.contentId)
    })

    await this.prisma.$transaction([
      this.prisma.dailyContentUsage.deleteMany({
        where: { date: { gte: start, lt: end }, freshness },
      }),
      this.prisma.dailyCreatorUsage.deleteMany({
        where: { date: { gte: start, lt: end }, freshness },
      }),
    ])

    const contentStats = new Map<string, UsageAggregate>()
    const creatorStats = new Map<string, UsageAggregate>()

    rows.forEach((row) => {
      if (!row.contentId || !row.creatorId) return
      const day = startOfUtcDay(row.viewEnd)
      const contentKey = `${formatDayKey(day)}:${row.contentId}`
      const creatorKey = `${formatDayKey(day)}:${row.creatorId}`

      addRowToAggregate(
        contentStats,
        contentKey,
        day,
        row.contentId,
        row.creatorId,
        row,
      )
      addRowToAggregate(
        creatorStats,
        creatorKey,
        day,
        null,
        row.creatorId,
        row,
      )
    })

    const now = new Date()
    const contentData = Array.from(contentStats.values()).map((entry) => ({
      date: entry.date,
      contentId: entry.contentId!,
      creatorId: entry.creatorId,
      freshness,
      rawViews: entry.rawViews,
      qualifiedViews: entry.qualifiedViews,
      uniqueViewers: entry.uniqueViewerIds.size,
      playbackFailures: entry.playbackFailures,
      watchTimeMs: BigInt(entry.watchTimeMs),
      playingTimeMs: BigInt(entry.playingTimeMs),
      billableWatchTimeMs: BigInt(entry.billableWatchTimeMs),
      lastSyncedAt: now,
    }))
    const creatorData = Array.from(creatorStats.values()).map((entry) => ({
      date: entry.date,
      creatorId: entry.creatorId,
      freshness,
      rawViews: entry.rawViews,
      qualifiedViews: entry.qualifiedViews,
      uniqueViewers: entry.uniqueViewerIds.size,
      playbackFailures: entry.playbackFailures,
      watchTimeMs: BigInt(entry.watchTimeMs),
      playingTimeMs: BigInt(entry.playingTimeMs),
      billableWatchTimeMs: BigInt(entry.billableWatchTimeMs),
      lastSyncedAt: now,
    }))

    if (contentData.length > 0) {
      await this.prisma.dailyContentUsage.createMany({ data: contentData })
    }
    if (creatorData.length > 0) {
      await this.prisma.dailyCreatorUsage.createMany({ data: creatorData })
    }

    await this.refreshContentViewCounts(Array.from(affectedContentIds))
  }

  private async clearProvisionalAggregates(start: Date, end: Date) {
    await this.prisma.$transaction([
      this.prisma.dailyContentUsage.deleteMany({
        where: {
          date: { gte: start, lt: end },
          freshness: AnalyticsFreshness.PROVISIONAL,
        },
      }),
      this.prisma.dailyCreatorUsage.deleteMany({
        where: {
          date: { gte: start, lt: end },
          freshness: AnalyticsFreshness.PROVISIONAL,
        },
      }),
    ])
  }

  private async refreshContentViewCounts(contentIds: string[]) {
    await Promise.all(
      [...new Set(contentIds)].map(async (contentId) => {
        const views = await this.prisma.muxVideoView.count({
          where: { contentId, isQualified: true },
        })

        await this.prisma.videoContent.update({
          where: { id: contentId },
          data: { views },
        })
      }),
    )
  }

  private async getCreatorLiveViewers(creatorId: string) {
    const content = await this.prisma.videoContent.findMany({
      where: { creatorId, deletedAt: null },
      select: { id: true },
      take: 100,
    })

    const counts = await Promise.all(
      content.map((item) => this.getLiveCountsForContent(item.id)),
    )

    return counts.reduce((sum, item) => sum + item.viewers, 0)
  }

  private async importPreviousUtcDayIfReady() {
    const now = new Date()

    // 06:00 Africa/Lusaka is 04:00 UTC. Mux daily exports can lag, so run once ready.
    if (now.getUTCHours() < 4) {
      return
    }

    const target = startOfUtcDay(new Date(now.getTime() - DAY_MS))
    const existing = await this.prisma.muxUsageImport.findFirst({
      where: {
        date: target,
        freshness: AnalyticsFreshness.SETTLED,
        status: UsageImportStatus.COMPLETED,
      },
    })

    if (existing) {
      return
    }

    await this.importMuxUsageForDate(formatDayKey(target))
  }

  private async assertCanViewCreatorAnalytics(userId: string, creatorId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { roles: true },
    })

    if (!user) {
      throw new ForbiddenException('User not found')
    }

    if (userId !== creatorId && !user.roles.includes(Role.ADMIN)) {
      throw new ForbiddenException('Not allowed to view analytics for this content')
    }
  }
}

type UsageAggregate = {
  date: Date
  contentId: string | null
  creatorId: string
  rawViews: number
  qualifiedViews: number
  uniqueViewerIds: Set<string>
  playbackFailures: number
  watchTimeMs: number
  playingTimeMs: number
  billableWatchTimeMs: number
}

function addRowToAggregate(
  map: Map<string, UsageAggregate>,
  key: string,
  date: Date,
  contentId: string | null,
  creatorId: string,
  row: {
    id: string
    viewerUserId: string | null
    muxViewerId: string | null
    watchTimeMs: number
    playingTimeMs: number
    playbackFailure: boolean
    isQualified: boolean
  },
) {
  const entry =
    map.get(key) ??
    {
      date,
      contentId,
      creatorId,
      rawViews: 0,
      qualifiedViews: 0,
      uniqueViewerIds: new Set<string>(),
      playbackFailures: 0,
      watchTimeMs: 0,
      playingTimeMs: 0,
      billableWatchTimeMs: 0,
    }

  entry.rawViews += 1
  if (row.playbackFailure) entry.playbackFailures += 1

  if (row.isQualified) {
    entry.qualifiedViews += 1
    entry.watchTimeMs += row.watchTimeMs
    entry.playingTimeMs += row.playingTimeMs
    entry.billableWatchTimeMs += row.watchTimeMs
    entry.uniqueViewerIds.add(row.viewerUserId ?? row.muxViewerId ?? row.id)
  }

  map.set(key, entry)
}

function normalizeMuxView(
  rawRow: Record<string, unknown>,
  contentMap: {
    byId: Map<string, { id: string; creatorId: string; muxPlaybackId: string | null; muxAssetId: string | null }>
    byPlaybackId: Map<string, { id: string; creatorId: string; muxPlaybackId: string | null; muxAssetId: string | null }>
  },
  freshness: AnalyticsFreshness,
): NormalizedMuxView | null {
  const muxViewId = getString(rawRow, ['view_id', 'id'])
  if (!muxViewId) return null

  const playbackId = getString(rawRow, ['playback_id'])
  const rawContentId = getString(rawRow, ['video_id'])
  const content =
    (rawContentId ? contentMap.byId.get(rawContentId) : undefined) ??
    (playbackId ? contentMap.byPlaybackId.get(playbackId) : undefined)
  const watchTimeMs = getNumber(rawRow, ['watch_time'])
  const playingTimeMs =
    getNumber(rawRow, [
      'view_total_content_playback_time',
      'view_playing_time',
      'playing_time',
    ]) || watchTimeMs
  const playbackFailure = getBoolean(rawRow, ['playback_failure'])
  const viewEnd =
    getDate(rawRow, ['view_end']) ??
    getDate(rawRow, ['updated_at']) ??
    new Date()
  const contentId = content?.id ?? rawContentId ?? null
  const creatorId = content?.creatorId ?? getString(rawRow, ['video_creator_id'])

  return {
    muxViewId,
    contentId,
    creatorId,
    playbackId,
    muxAssetId: getString(rawRow, ['asset_id']) ?? content?.muxAssetId ?? null,
    viewerUserId: getString(rawRow, ['viewer_user_id']),
    muxViewerId: getString(rawRow, ['mux_viewer_id']),
    viewStart: getDate(rawRow, ['view_start']),
    viewEnd,
    watchTimeMs,
    playingTimeMs,
    videoDurationMs: getNumberOrNull(rawRow, ['video_duration', 'player_source_duration']),
    maxPlayheadTimeMs: getNumberOrNull(rawRow, ['view_max_playhead_position']),
    countryCode: getString(rawRow, ['country_code']),
    deviceCategory: getString(rawRow, ['viewer_device_category']),
    osFamily: getString(rawRow, ['viewer_os_family']),
    browser: getString(rawRow, ['viewer_application_name']),
    playerName: getString(rawRow, ['player_name']),
    playbackFailure,
    errorTypeId: getNumberOrNull(rawRow, ['error_type_id', 'view_error_id']),
    isQualified: Boolean(content?.id && watchTimeMs > 0 && !playbackFailure),
    raw: rawRow as Prisma.InputJsonValue,
  }
}

function parseCsv(text: string) {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    const next = text[index + 1]

    if (char === '"' && inQuotes && next === '"') {
      field += '"'
      index += 1
      continue
    }

    if (char === '"') {
      inQuotes = !inQuotes
      continue
    }

    if (char === ',' && !inQuotes) {
      row.push(field)
      field = ''
      continue
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') index += 1
      row.push(field)
      if (row.some((value) => value.length > 0)) rows.push(row)
      row = []
      field = ''
      continue
    }

    field += char
  }

  row.push(field)
  if (row.some((value) => value.length > 0)) rows.push(row)

  const [headers = [], ...dataRows] = rows
  const normalizedHeaders = headers.map((header) =>
    header.replace(/^\uFEFF/, '').trim().toLowerCase(),
  )

  return dataRows.map((values) => {
    const result: Record<string, unknown> = {}
    normalizedHeaders.forEach((header, index) => {
      result[header] = values[index] ?? ''
    })
    return result
  })
}

function getField(row: Record<string, unknown>, keys: string[]) {
  const normalized = new Map(
    Object.entries(row).map(([key, value]) => [key.trim().toLowerCase(), value]),
  )

  for (const key of keys) {
    const value = normalized.get(key)
    if (value !== undefined && value !== null && value !== '') {
      return value
    }
  }

  return null
}

function getString(row: Record<string, unknown>, keys: string[]) {
  const value = getField(row, keys)
  if (value === null || value === undefined) return null
  const text = String(value).trim()
  return text.length > 0 ? text : null
}

function getNumber(row: Record<string, unknown>, keys: string[]) {
  return Math.max(0, Math.round(getNumberOrNull(row, keys) ?? 0))
}

function getNumberOrNull(row: Record<string, unknown>, keys: string[]) {
  const value = getField(row, keys)
  if (value === null || value === undefined) return null
  const number = typeof value === 'number' ? value : Number.parseFloat(String(value))
  return Number.isFinite(number) ? number : null
}

function getBoolean(row: Record<string, unknown>, keys: string[]) {
  const value = getField(row, keys)
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0
  if (typeof value === 'string') {
    return ['true', '1', 'yes'].includes(value.toLowerCase())
  }
  return false
}

function getDate(row: Record<string, unknown>, keys: string[]) {
  const value = getField(row, keys)
  if (!value) return null
  const date = new Date(String(value))
  return Number.isNaN(date.getTime()) ? null : date
}

function parseDateOnlyUtc(dateString: string) {
  const date = new Date(`${dateString.slice(0, 10)}T00:00:00.000Z`)
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${dateString}`)
  }
  return date
}

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

function formatDayKey(date: Date) {
  return date.toISOString().slice(0, 10)
}

function formatMonthKey(date: Date) {
  return date.toISOString().slice(0, 7)
}

function msToMinutes(ms: number) {
  return Math.round((ms / 60000) * 100) / 100
}

function toNumber(value: bigint | number | null | undefined) {
  if (typeof value === 'bigint') return Number(value)
  return value ?? 0
}

function getUsageRange(period: UsagePeriod) {
  const now = new Date()
  const end = new Date(startOfUtcDay(now).getTime() + DAY_MS)

  if (period === 'year') {
    const start = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - 11, 1))
    return { start, end, bucket: 'month' as const }
  }

  const days = period === 'day' ? 1 : period === 'week' ? 7 : 30
  return {
    start: new Date(startOfUtcDay(now).getTime() - (days - 1) * DAY_MS),
    end,
    bucket: 'day' as const,
  }
}

function selectFreshestRows<T extends { freshness: AnalyticsFreshness }>(
  rows: T[],
  keyFn: (row: T) => Date,
) {
  const byDate = new Map<string, T>()

  rows.forEach((row) => {
    const key = formatDayKey(keyFn(row))
    const existing = byDate.get(key)

    if (!existing || freshnessRank(row.freshness) > freshnessRank(existing.freshness)) {
      byDate.set(key, row)
    }
  })

  return Array.from(byDate.values())
}

function freshnessRank(freshness: AnalyticsFreshness) {
  if (freshness === AnalyticsFreshness.SETTLED) return 3
  if (freshness === AnalyticsFreshness.PROVISIONAL) return 2
  return 1
}

function freshest(left: AnalyticsFreshness, right: AnalyticsFreshness) {
  return freshnessRank(right) > freshnessRank(left) ? right : left
}

function buildBreakdown<T extends Record<string, unknown>>(rows: T[], field: keyof T) {
  const counts = new Map<string, number>()

  rows.forEach((row) => {
    const value = typeof row[field] === 'string' ? (row[field] as string) : 'unknown'
    counts.set(value || 'unknown', (counts.get(value || 'unknown') ?? 0) + 1)
  })

  return Array.from(counts.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
}
