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

  //for winston logger
  logs: {
    level: process.env.LOG_LEVEL,
  },
};
