import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { PrismaModule } from './prisma'
import { ClerkModule } from './clerk'

@Module({
  imports: [PrismaModule, ClerkModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
