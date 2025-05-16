import { Injectable, LoggerService } from '@nestjs/common';
import * as AWS from 'aws-sdk';

@Injectable()
export class CustomLoggerService implements LoggerService {
  private readonly console = new console.Console(process.stdout, process.stderr);
  private readonly s3 = new AWS.S3();
  private readonly bucket = process.env.ERROR_LOG_BUCKET;

  log(message: string) {
    this.console.log(message);
  }

  warn(message: string) {
    this.console.warn(`[WARN] ${message}`);
  }

  error(message: string, trace?: string) {
    const fullMessage = `[ERROR] ${message}\n${trace ?? ''}`;
    this.console.error(fullMessage);
    this.persistToS3('error', fullMessage);
  }

  private async persistToS3(level: string, message: string) {
    if (!this.bucket) {
      this.console.error('ERROR_LOG_BUCKET environment variable is not defined');
      return;
    }
    
    const key = `logs/${level}-${Date.now()}.log`;
    await this.s3.putObject({
      Bucket: this.bucket,
      Key: key,
      Body: message,
      ContentType: 'text/plain',
    }).promise();
  }
}
