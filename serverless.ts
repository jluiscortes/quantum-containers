import type { AWS } from '@serverless/typescript';
import { MONGO_URI, NODE_ENV } from './config';

const serverlessConfiguration: AWS = {
  service: 'quantum-containers',

  plugins: [
    'serverless-jetpack',
    'serverless-offline'
  ],

  provider: {
    name: 'aws',
    runtime: 'nodejs18.x',
    region: 'us-east-1',
    memorySize: 2048,
    timeout: 29,
    stage: 'dev',
    environment: {
      APP_AWS_REGION: 'us-east-1',
      ERROR_LOGS_BUCKET: { Ref: 'ErrorLogsBucket' },
      SNS_ALERT_TOPIC_ARN: { Ref: 'CorruptEventAlertTopic' },
      NODE_ENV: NODE_ENV,
      MONGO_URI: MONGO_URI
    },
    iam: {
      role: {
        statements: [
          // Permiso para S3
          {
            Effect: 'Allow',
            Action: ['s3:PutObject', 's3:GetObject', 's3:ListBucket'],
            Resource: [
              { 'Fn::GetAtt': ['ErrorLogsBucket', 'Arn'] },
              { 'Fn::Join': ['', [{ 'Fn::GetAtt': ['ErrorLogsBucket', 'Arn'] }, '/*']] }
            ]
          },
          // Permiso para SNS
          {
            Effect: 'Allow',
            Action: ['sns:Publish'],
            Resource: { Ref: 'CorruptEventAlertTopic' }
          }
        ]
      }
    }
  },

  functions: {
    main: {
      handler: 'dist/src/main/lambda.handler',
      description: 'quantum-containers',
      events: [
        {
          http: {
            method: 'any',
            path: '/{any+}'
          }
        }
      ],
      environment: {
        APP_AWS_REGION: 'us-east-1',
        ERROR_LOGS_BUCKET: { Ref: 'ErrorLogsBucket' },
        SNS_ALERT_TOPIC_ARN: { Ref: 'CorruptEventAlertTopic' },
        NODE_ENV: NODE_ENV,
        MONGO_URI: MONGO_URI
      }
    }
  },

  resources: {
    Resources: {
      // S3 para logs de errores
      ErrorLogsBucket: {
        Type: 'AWS::S3::Bucket',
        Properties: {
          BucketName: 'quantum-error-logs',
          AccessControl: 'Private',
          PublicAccessBlockConfiguration: {
            BlockPublicAcls: true,
            BlockPublicPolicy: true,
            IgnorePublicAcls: true,
            RestrictPublicBuckets: true
          },
          LifecycleConfiguration: {
            Rules: [
              {
                Id: 'ExpireErrorLogs',
                Status: 'Enabled',
                ExpirationInDays: 90
              }
            ]
          }
        }
      },

      // SNS Topic para alertas de eventos corruptos
      CorruptEventAlertTopic: {
        Type: 'AWS::SNS::Topic',
        Properties: {
          TopicName: 'corrupt-event-alerts'
        }
      }
    }
  }
};

module.exports = serverlessConfiguration;
