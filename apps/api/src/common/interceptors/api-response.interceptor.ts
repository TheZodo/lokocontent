import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'

type SuccessResponse<T> = {
  success: true
  data: T
  meta?: {
    total?: number
    page?: number
    limit?: number
  }
}

@Injectable()
export class ApiResponseInterceptor implements NestInterceptor {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<SuccessResponse<unknown>> {
    return next.handle().pipe(
      map((value) => {
        if (
          value &&
          typeof value === 'object' &&
          'success' in (value as Record<string, unknown>)
        ) {
          const payload = value as Record<string, unknown>
          if (!('data' in payload)) {
            return {
              ...payload,
              data: null,
            } as SuccessResponse<unknown>
          }
          return value as SuccessResponse<unknown>
        }

        if (
          value &&
          typeof value === 'object' &&
          'data' in (value as Record<string, unknown>) &&
          'meta' in (value as Record<string, unknown>)
        ) {
          const payload = value as { data: unknown; meta?: SuccessResponse<unknown>['meta'] }
          return {
            success: true,
            data: payload.data,
            meta: payload.meta,
          }
        }

        return {
          success: true,
          data: value,
        }
      }),
    )
  }
}
