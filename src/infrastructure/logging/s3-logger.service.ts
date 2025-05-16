import * as AWS from 'aws-sdk';
import { Injectable } from '@nestjs/common';

@Injectable()
export class S3LoggerService {
  private readonly s3 = new AWS.S3(
    { region: process.env.AWS_REGION || 'us-east-1' } 
  );
  private readonly bucketName = process.env.S3_BUCKET_NAME ?? 'quantum-error-logs';

  async logError(filename: string, error: any): Promise<void> {
    await this.s3
      .putObject({
        Bucket: this.bucketName,
        Key: `logs/${filename}.json`,
        Body: JSON.stringify(error),
        ContentType: 'application/json',
      })
      .promise();
  }
}
