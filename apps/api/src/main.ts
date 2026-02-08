import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ValidationPipe } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import helmet from 'helmet'
import morgan from 'morgan'
import { json } from 'express'
import { ApiExceptionFilter } from './common/filters/api-exception.filter'
import { ApiResponseInterceptor } from './common/interceptors/api-response.interceptor'

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

  // CORS - allow frontend origins (array = multiple origins allowed)
  const allowedOrigins = [
    'http://localhost:3000',
    'https://lokocontent-web.vercel.app',
    'https://lokocontent.io',
    ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
  ]
  app.enableCors({
    origin: allowedOrigins,
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

  // Global response wrapper + error mapper
  app.useGlobalInterceptors(new ApiResponseInterceptor())
  app.useGlobalFilters(new ApiExceptionFilter())

  // Global API prefix - all routes will be under /api
  app.setGlobalPrefix('api')

  // Swagger / OpenAPI docs at /api/docs (JSON at /api/docs-json)
  const config = new DocumentBuilder()
    .setTitle('Lokocontent API')
    .setDescription('API for Lokocontent video content platform')
    .setVersion('1.0')
    .addBearerAuth()
    .build()
  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('docs', app, document)

  const port = process.env.PORT || 3001
  await app.listen(port)

  console.log(`Application is running on: http://localhost:${port}/api`)
}

bootstrap()
