import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { BusinessException } from '../../domain/errors/business.exception';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    const path = req?.url || 'unknown';
    const timestamp = new Date().toISOString();

    const isBusiness =
      exception instanceof BusinessException ||
      exception?.constructor?.name === 'BusinessException';

    if (isBusiness) {
      const businessError = exception as BusinessException;

      this.logger.warn(
        `[BusinessError] ${businessError.code} – ${businessError.message}`
      );

      return res.status(businessError.statusCode).json({
        success: false,
        message: businessError.message,
        data: null,
        errorCode: businessError.code,
        statusCode: businessError.statusCode,
        timestamp,
        path,
      });
    }

    const status =
      exception instanceof HttpException ? exception.getStatus() : 500;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : (exception as Error)?.message || 'Error interno del servidor';

    this.logger.error(`[Unhandled] ${req.method} ${path} – ${message}`);

    return res.status(status).json({
      success: false,
      message: 'Ocurrió un error inesperado',
      data: null,
      errorCode: 'UNEXPECTED_ERROR',
      statusCode: status,
      timestamp,
      path,
    });
  }
}
