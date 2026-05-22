import dotenv from 'dotenv';

const envFound = dotenv.config();
if (envFound.error) {
  throw new Error("Couldn't find .env file");
}

export default {
  name: process.env.NAME,

  //Server Port.
  port: process.env.PORT,

  databaseURL: process.env.DATABASE_URL,

  jwtSecretKey: process.env.JWT_SECRET_KEY,

  serverNumber: process.env.SERVER_NUM,
  webhookSecretKey: process.env.WEBHOOK_SECRET_KEY,
  naverClientId: process.env.NAVER_CLIENT_ID,
  naverClientSecretKey: process.env.NAVER_CLIENT_SECRET_KEY,

  awsBucketName: process.env.AWS_BUCKET_NAME,
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  awsRegion: process.env.AWS_REGION,
  storageServerAddress: process.env.STORAGE_SERVER_ADDRESS,

  //for winston logger
  logs: {
    level: process.env.LOG_LEVEL,
  },
};
