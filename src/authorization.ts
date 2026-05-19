import { Request, Response, NextFunction } from 'express';
import jwt, { decode } from 'jsonwebtoken';
import config from './config';

const deviceVerifyToken = (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    if (!request.headers['authorization']) {
      return response.status(403).json({
        success: false,
        message: 'not logged in',
      });
    }

    //const token: string = request.headers['authorization'].toString();
    const token = request.headers['authorization']
      .toString()
      .split('Bearer ')[1];
    const secret_key = config.webhookSecretKey || '';

    // token does not exist
    if (!token) {
      return response.status(403).json({
        success: false,
        message: 'not logged in',
      });
    }

    //토큰을 검증한다.
    const decoded: any = jwt.verify(token, secret_key);

    if (decoded) {
      response.locals = {
        ...response.locals,
        deviceId: decoded.deviceId,
        timestamp: decoded.timestamp,
      };
      next();
    } else {
      response.status(401).json({ error: 'unauthorized' });
    }
  } catch (err) {
    response.status(401).json({ error: 'token expired' });
  }
};

const verifyToken = (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    if (!request.headers['authorization']) {
      return response.status(403).json({
        success: false,
        message: 'not logged in',
      });
    }

    //const token: string = request.headers['authorization'].toString();
    const token = request.headers['authorization']
      .toString()
      .split('Bearer ')[1];
    const secret_key = config.jwtSecretKey || '';

    // token does not exist
    if (!token) {
      return response.status(403).json({
        success: false,
        message: 'not logged in',
      });
    }

    //토큰을 검증한다.
    const decoded: any = jwt.verify(token, secret_key);

    if (decoded) {
      response.locals = {
        ...response.locals,
        id: decoded.id,
        user_level: decoded.user_level,
      };
      next();
    } else {
      response.status(401).json({ error: 'unauthorized' });
    }
  } catch (err) {
    response.status(401).json({ error: 'token expired' });
  }
};

export { deviceVerifyToken, verifyToken };
