import { Module } from '@nestjs/common'
import { ContentController } from './content.controller'
import { ContentService } from './content.service'
import { ContentAnalysisService } from './content-analysis.service'
import { EnsureCreatorRoleGuard } from './guards/ensure-creator.guard'
import { ClerkModule } from '../clerk'

@Module({
  imports: [ClerkModule],
  controllers: [ContentController],
  providers: [ContentService, ContentAnalysisService, EnsureCreatorRoleGuard],
})
export class ContentModule {}
