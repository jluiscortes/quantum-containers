import * as dotenv from 'dotenv';

const stage = process.env.NODE_ENV || 'dev';
const envFilePath = `./.env.${stage}`;

dotenv.config({ path: envFilePath });

export const MONGO_URI = process.env.MONGO_URI;
export const NODE_ENV = process.env.NODE_ENV || 'dev';
export const ERROR_LOG_BUCKET = process.env.ERROR_LOG_BUCKET;
export const SNS_ALERT_TOPIC_ARN = process.env.SNS_ALERT_TOPIC_ARN;

console.log('Configuration loaded:');
console.log(`- NODE_ENV: ${NODE_ENV}`);
console.log(`- MONGO_URI: ${MONGO_URI ? '(set)' : 'not set'}`);
console.log(`- ERROR_LOG_BUCKET: ${ERROR_LOG_BUCKET || 'not set'}`);
console.log(`- SNS_ALERT_TOPIC_ARN: ${SNS_ALERT_TOPIC_ARN || 'not set'}`);
console.log(`- AWS_REGION: ${process.env.AWS_REGION || 'not set'}`);