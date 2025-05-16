import * as dotenv from 'dotenv';

const stage = process.env.NODE_ENV || 'dev';
const envFilePath = `./.env.${stage}`;

dotenv.config({ path: envFilePath });

export const MONGO_URI = process.env.MONGO_URI;
export const NODE_ENV = process.env.NODE_ENV || 'dev';
export const ERROR_LOG_BUCKET = process.env.ERROR_LOG_BUCKET;