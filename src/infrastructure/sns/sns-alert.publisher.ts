import { Injectable } from '@nestjs/common';
import * as AWS from 'aws-sdk';

@Injectable()
export class SnsAlertPublisher {
  private readonly sns: AWS.SNS;
  private readonly topicArn = process.env.SNS_ALERT_TOPIC_ARN || '';

  constructor() {
    AWS.config.update({ region: process.env.AWS_REGION || 'us-east-1' });
  }

  async publishCorruptEvent(containerId: string, newState: string): Promise<void> {
    try {
      const message = {
        type: 'CORRUPT_EVENT_DETECTED',
        containerId,
        newState,
        timestamp: new Date().toISOString(),
      };

      await this.sns.publish({
        TopicArn: this.topicArn,
        Subject: `Alerta de evento corrupto: ${containerId}`,
        Message: JSON.stringify(message),
      }).promise();
      
      console.log(`Alert published for container: ${containerId}`);
    } catch (error) {
      console.error(`Failed to publish alert: ${error.message}`);
    }
  }
}