import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common'
import { Response } from 'express'

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()

    if (exception instanceof HttpException) {
      const status = exception.getStatus()
      const exceptionResponse = exception.getResponse()

      if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse &&
        'success' in exceptionResponse
      ) {
        response.status(status).json(exceptionResponse)
        return
      }

      const message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as { message?: string | string[] }).message

      const details =
        typeof exceptionResponse === 'object' ? exceptionResponse : undefined

      const isValidation = status === HttpStatus.BAD_REQUEST

      response.status(status).json({
        success: false,
        error: {
          code: isValidation
            ? 'VALIDATION_ERROR'
            : status === HttpStatus.UNAUTHORIZED
              ? 'UNAUTHORIZED'
              : status === HttpStatus.FORBIDDEN
                ? 'FORBIDDEN'
                : status === HttpStatus.NOT_FOUND
                  ? 'NOT_FOUND'
                  : `HTTP_${status}`,
          message: Array.isArray(message)
            ? 'Validation failed'
            : message ?? 'Request failed',
          details: Array.isArray(message) ? message : details,
        },
      })
      return
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Unexpected error',
        details: exception instanceof Error ? exception.message : exception,
      },
    })
  }
}
