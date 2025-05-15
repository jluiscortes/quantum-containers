import type { AWS } from '@serverless/typescript';

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
    stage: 'dev', // prefix "dev" if undefined
    environment: {
      APP_AWS_REGION: '${self:provider.region}',
    }
  },
  
  functions: {
    main: { // The name of the lambda function
      // The module 'handler' is exported in the file 'src/lambda'
      handler: 'dist/src/lambda.handler',
      description: 'nest monolith serverless demo',
      events: [
        {
          http: {
            method: 'any',
            path: '/{any+}'
          }
        }
      ]
    }
  },
  
  // If you need custom configuration for jetpack or offline
  custom: {
    'serverless-jetpack': {
      // Jetpack options here
    },
    'serverless-offline': {
      // Offline options here
    }
  }
};

module.exports = serverlessConfiguration;