import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma'
import { PurchasesController } from './purchases.controller'
import { PurchasesService } from './purchases.service'
import { LipilaService } from './lipila.service'

@Module({
  imports: [PrismaModule],
  controllers: [PurchasesController],
  providers: [PurchasesService, LipilaService],
  exports: [PurchasesService],
})
export class PurchasesModule {}
