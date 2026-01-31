import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import { PrismaClient } from '@lokocontent/db'

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      log:
        process.env.NODE_ENV === 'development'
          ? ['query', 'info', 'warn', 'error']
          : ['error'],
    })
  }

  async onModuleInit() {
    await this.$connect()
  }

  async onModuleDestroy() {
    await this.$disconnect()
  }

  /**
   * Clean database for testing purposes
   * WARNING: This deletes all data - only use in test environment
   */
  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot clean database in production')
    }

    // Delete in order respecting foreign key constraints
    await this.$transaction([
      this.rating.deleteMany(),
      this.follow.deleteMany(),
      this.watchHistory.deleteMany(),
      this.purchase.deleteMany(),
      this.videoContent.deleteMany(),
      this.user.deleteMany(),
    ])
  }
}
