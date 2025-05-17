import { Injectable, Logger } from '@nestjs/common';
import * as AWS from 'aws-sdk';

@Injectable()
export class SnsAlertPublisher {
  private readonly logger = new Logger(SnsAlertPublisher.name);
  private readonly sns: AWS.SNS;
  private readonly topicArn = process.env.SNS_ALERT_TOPIC_ARN || '';

  constructor() {
    AWS.config.update({ region: process.env.AWS_REGION || 'us-east-1' });
    this.sns = new AWS.SNS();
    
    this.logger.log(`SNS Alert Publisher initialized with topic ARN: ${this.topicArn}`);
  }

  async publishCorruptEvent(containerId: string, newState: string): Promise<void> {
    if (!this.topicArn) {
      this.logger.warn('SNS Topic ARN not configured. Skipping alert publication.');
      return;
    }
    
    try {
      const message = {
        type: 'CORRUPT_EVENT_DETECTED',
        containerId,
        newState,
        timestamp: new Date().toISOString(),
      };

      const result = await this.sns.publish({
        TopicArn: this.topicArn,
        Subject: `Alerta de evento corrupto: ${containerId}`,
        Message: JSON.stringify(message),
      }).promise();
      
      this.logger.log(`Alert published for container: ${containerId}, MessageId: ${result.MessageId}`);
    } catch (error) {
      this.logger.error(`Failed to publish alert: ${error.message}`);
      
      if (process.env.NODE_ENV === 'dev') {
        this.logger.debug(`Topic ARN: ${this.topicArn}`);
        this.logger.debug(`AWS Region: ${AWS.config.region}`);
        this.logger.debug(`Error stack: ${error.stack}`);
      }
    }
  }
}