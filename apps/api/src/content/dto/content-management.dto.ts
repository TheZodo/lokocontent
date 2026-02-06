import { Transform } from 'class-transformer'
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator'
import { ContentStatus } from '@lokocontent/db'

const toBoolean = ({ value }: { value: string | boolean | undefined }) => {
  if (value === undefined || value === null || value === '') {
    return undefined
  }
  if (typeof value === 'boolean') {
    return value
  }
  return value === 'true'
}

const toNumber = ({ value }: { value: string | number | undefined }) => {
  if (value === undefined || value === null || value === '') {
    return undefined
  }
  return Number(value)
}

const normalizeStatus = ({ value }: { value: string | ContentStatus | undefined }) => {
  if (!value) {
    return undefined
  }
  const normalized = value.toString().trim().toUpperCase()
  if (normalized === 'DRAFT') {
    return ContentStatus.DRAFT
  }
  if (normalized === 'PUBLISHED') {
    return ContentStatus.PUBLISHED
  }
  if (normalized === 'HIDDEN') {
    return ContentStatus.HIDDEN
  }
  if (normalized === 'PROCESSING') {
    return ContentStatus.PROCESSING
  }
  return value
}

export class CreateContentDto {
  @IsString()
  @IsNotEmpty()
  title!: string

  @IsString()
  @IsNotEmpty()
  synopsis!: string

  @IsString()
  @IsNotEmpty()
  region!: string

  @IsString()
  @IsNotEmpty()
  category!: string

  @Transform(toBoolean)
  @IsBoolean()
  isPremium!: boolean

  @IsOptional()
  @Transform(toNumber)
  @IsNumber()
  @Min(0)
  price?: number

  @Transform(toNumber)
  @IsInt()
  releaseYear!: number

  @IsString()
  @IsNotEmpty()
  muxAssetId!: string

  @IsString()
  @IsNotEmpty()
  muxPlaybackId!: string

  @IsOptional()
  @IsString()
  trailerMuxAssetId?: string

  @IsOptional()
  @IsString()
  trailerMuxPlaybackId?: string

  @IsString()
  @IsNotEmpty()
  thumbnailUrl!: string

  @Transform(normalizeStatus)
  @IsIn([ContentStatus.DRAFT, ContentStatus.PUBLISHED])
  status!: ContentStatus
}

export class UpdateContentDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  synopsis?: string

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  region?: string

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  category?: string

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  thumbnailUrl?: string

  @IsOptional()
  @Transform(normalizeStatus)
  @IsIn([ContentStatus.DRAFT, ContentStatus.PUBLISHED, ContentStatus.HIDDEN])
  status?: ContentStatus
}

export class AnalyzeChangesDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  synopsis?: string

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  region?: string

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  category?: string
}

export class MyUploadsQueryDto {
  @IsOptional()
  @Transform(normalizeStatus)
  @IsIn([
    ContentStatus.DRAFT,
    ContentStatus.PUBLISHED,
    ContentStatus.HIDDEN,
    ContentStatus.PROCESSING,
  ])
  status?: ContentStatus

  @IsOptional()
  @IsIn(['recent', 'views', 'earnings'])
  sortBy?: 'recent' | 'views' | 'earnings'

  @IsOptional()
  @Transform(toNumber)
  @IsInt()
  @Min(1)
  limit?: number

  @IsOptional()
  @Transform(toNumber)
  @IsInt()
  @Min(0)
  offset?: number
}
