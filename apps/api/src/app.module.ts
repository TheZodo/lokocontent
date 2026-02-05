import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { join } from 'path'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { PrismaModule } from './prisma'
import { ClerkModule } from './clerk'
import { MuxModule } from './mux'
import { UploadModule } from './upload'

// Load .env from monorepo root (when running from root) or apps/api
const rootEnv = join(process.cwd(), '.env')
const monorepoRootEnv = join(process.cwd(), '../../.env')

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [rootEnv, monorepoRootEnv],
    }),
    PrismaModule,
    ClerkModule,
    MuxModule,
    UploadModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
