import express from 'express';
import { Container } from 'typedi';

import config from './config';
import Logger from './loaders/logger';
import expressLoader from './loaders/express';
import { Scheduler } from './scheduler';

export class MainServer {
  private app: express.Application;

  constructor() {
    this.app = express();
  }

  async start(): Promise<void> {
    const scheduler = new Scheduler();
    scheduler.start();
    console.log('Scheduler running...');

    //싱글톤처럼 쓰기 위해 logger 객체를 보관해놓는다.
    Container.set('logger', Logger);

    //express 기본 세팅.
    expressLoader({ app: this.app });

    this.app
      .listen(config.port, () => {
        console.log(`Server listening on port: ${config.port}`);
        Logger.info(`Server listening on port: ${config.port}`);
      })
      .on('error', (err: Error) => {
        console.error(err);
        Logger.error(err);
        process.exit(1);
      });
  }
}
