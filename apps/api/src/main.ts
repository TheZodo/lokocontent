import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ValidationPipe } from '@nestjs/common'
import helmet from 'helmet'
import morgan from 'morgan'
import { json } from 'express'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // Disable body parsing to use custom raw body middleware
    bodyParser: false,
  })

  // Raw body middleware for webhook signature verification
  // Must be applied before other body parsers
  app.use(
    json({
      verify: (req: any, res, buf) => {
        // Store raw body for webhook signature verification
        if (req.url?.includes('/webhooks/')) {
          req.rawBody = buf.toString()
        }
      },
    }),
  )

  // Helmet - security headers
  app.use(helmet())

  // CORS - allow frontend origins
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })

  // Morgan - request logging
  // 'combined' format in production (Apache-style logs)
  // 'dev' format in development (colored, concise)
  const morganFormat =
    process.env.NODE_ENV === 'production' ? 'combined' : 'dev'
  app.use(morgan(morganFormat))

  // Global validation pipe for DTO validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )

  // Global API prefix - all routes will be under /api
  app.setGlobalPrefix('api')

  const port = process.env.PORT || 3001
  await app.listen(port)

  console.log(`Application is running on: http://localhost:${port}/api`)
}

bootstrap()
