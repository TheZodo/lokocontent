import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { PrismaModule } from './prisma'
import { ClerkModule } from './clerk'
import { MuxModule } from './mux'
import { UploadModule } from './upload'

@Module({
  imports: [PrismaModule, ClerkModule, MuxModule, UploadModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
