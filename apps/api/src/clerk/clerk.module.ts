import { Module } from '@nestjs/common'
import { ClerkService } from './clerk.service'
import { ClerkWebhookController } from './clerk-webhook.controller'

@Module({
  controllers: [ClerkWebhookController],
  providers: [ClerkService],
  exports: [ClerkService],
})
export class ClerkModule {}
