import express, { NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import accountRouter from '../routes/account-router';
import addressRouter from '../routes/address-router';
import collectionRouter from '../routes/collection-router';
import statisticsRouter from '../routes/statistics-router';
import config from '../config';
import Logger from '../loaders/logger';
import swaggerUi from 'swagger-ui-express';
import swaggerFile from '../swagger-output.json';

export default ({ app }: { app: express.Application }) => {
  /**
   * Health Check endpoints
   * @TODO Explain why they are here
   */

  const formatMaker = function (tokens: any, req: any, res: any) {
    return [
      '[REQ]',
      '[' + config.serverNumber + ']',
      '[' + tokens['response-time'](req, res),
      'ms]',
      //tokens.res(req, res, 'content-length'), '-',
      tokens['remote-addr'](req, res),
      '[' + tokens['user-agent'](req, res) + ']',
      '[' + req.headers['authorization'] + ']',
      '[' + tokens.method(req, res) + ']',
      '[' + tokens.url(req, res) + ']',
      '[' + tokens.status(req, res) + ']',
      '[' + JSON.stringify(req.body) + ']',
    ].join(' ');
  };

  //morgan http request log.
  const httpLogStream = {
    write: (message: string) => {
      Logger.http(message);
    },
  };
  //app.use(morgan('combined', {stream: httpLogStream}));
  //app.use(morgan('combined', {stream: httpLogStream, immediate: true}));
  app.use(
    morgan(formatMaker, {
      skip: function (request, response) {
        /*
        if(request.path == "/test") {
          return true;
        }
        */
        //return response.statusCode < 400;
        return false;
      },
      stream: httpLogStream,
    }),
  );

  app.get('/status', (req, res) => {
    res.status(200).end();
  });
  app.head('/status', (req, res) => {
    res.status(200).end();
  });

  // Useful if you're behind a reverse proxy (Heroku, Bluemix, AWS ELB, Nginx, etc)
  // It shows the real origin IP in the heroku or Cloudwatch logs
  //app.enable('trust proxy');

  app.use('/uploads', express.static('uploads'));
  app.use(express.json()); //req.body를 json으로 받을 수 있도록 한다.
  app.use(express.urlencoded({ extended: true }));
  app.use(cors()); //cors를 allow한다.

  app.use('/account', accountRouter);
  app.use('/address', addressRouter);
  app.use('/collection', collectionRouter);
  app.use('/statistics', statisticsRouter);

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerFile));

  /// catch 404 and forward to error handler
  app.use((req, res, next) => {
    const err: any = new Error('Not Found');
    err['status'] = 404;
    next(err);
  });

  /// error handlers
  app.use((err: any, req: any, res: any, next: NextFunction) => {
    /**
     * Handle 401 thrown by express-jwt library
     */
    if (err.name === 'UnauthorizedError') {
      return res.status(err.status).send({ message: err.message }).end();
    }
    return next(err);
  });

  app.use((err: any, req: any, res: any, next: NextFunction) => {
    res.error = (statusCode: number, errorMessage: string) =>
      res.status(statusCode).json(errorMessage);

    res.status(err.status || 500);
    res.json({
      errors: {
        message: err.message,
      },
    });
  });
};
