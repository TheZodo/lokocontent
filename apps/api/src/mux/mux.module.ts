import { Module } from '@nestjs/common'
import { MuxService } from './mux.service'
import { MuxController } from './mux.controller'
import { MuxWebhookController } from './mux-webhook.controller'

@Module({
  controllers: [MuxController, MuxWebhookController],
  providers: [MuxService],
  exports: [MuxService],
})
export class MuxModule {}
