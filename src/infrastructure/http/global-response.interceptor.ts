import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

@Injectable()
export class GlobalResponseInterceptor<T>
  implements NestInterceptor<T, any>
{
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const path = request?.url ?? 'unknown';

    return next.handle().pipe(
      map((data) => ({
        success: true,
        message: 'Operación exitosa',
        data,
        errorCode: null,
        statusCode: 200,
        timestamp: new Date().toISOString(),
        path,
      }))
    );
  }
}
