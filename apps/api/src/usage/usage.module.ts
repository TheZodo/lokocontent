import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma'
import { MuxModule } from '../mux'
import { UsageController } from './usage.controller'
import { UsageService } from './usage.service'

@Module({
  imports: [PrismaModule, MuxModule],
  controllers: [UsageController],
  providers: [UsageService],
  exports: [UsageService],
})
export class UsageModule {}
