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
  naverMapNcpKeyId: process.env.NAVER_MAP_NCP_KEY_ID,
  naverMapApiKey: process.env.NAVER_MAP_API_KEY,
  //for winston logger
  logs: {
    level: process.env.LOG_LEVEL,
  },
};
