import { Injectable } from '@nestjs/common';
import * as AWS from 'aws-sdk';

@Injectable()
export class SnsAlertPublisher {
  private readonly sns = new AWS.SNS();
  private readonly topicArn = process.env.SNS_ALERT_TOPIC_ARN || '';

  async publishCorruptEvent(containerId: string, newState: string): Promise<void> {
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
  }
}
