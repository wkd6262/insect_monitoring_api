import { Request, Response, NextFunction } from 'express';
import jwt, { decode } from 'jsonwebtoken';
import config from './config';

const deviceVerifyToken = (request: Request, response: Response, next: NextFunction) => {
    try {
        if(!request.headers['authorization']) {
            return response.status(403).json({
                success: false,
                message: 'not logged in'
            })
        }

        //const token: string = request.headers['authorization'].toString();
        const token = request.headers['authorization'].toString().split('Bearer ')[1];
        const secret_key = config.webhookSecretKey || '';
        
        // token does not exist
        if(!token) {
            return response.status(403).json({
                success: false,
                message: 'not logged in'
            })
        }

        //토큰을 검증한다.
        const decoded: any = jwt.verify(token, secret_key);
    
        if (decoded) {
            response.locals = {
                ...response.locals,
                deviceId: decoded.deviceId,
                timestamp: decoded.timestamp,
            }
            next();
        } else {
            response.status(401).json({ error: 'unauthorized' });
        }
    } catch (err) {
        response.status(401).json({ error: 'token expired' });
    }
};

const verifyToken = (request: Request, response: Response, next: NextFunction) => {
    try {
        if(!request.headers['authorization']) {
            return response.status(403).json({
                success: false,
                message: 'not logged in'
            })
        }

        //const token: string = request.headers['authorization'].toString();
        const token = request.headers['authorization'].toString().split('Bearer ')[1];
        const secret_key = config.jwtSecretKey || '';
        
        // token does not exist
        if(!token) {
            return response.status(403).json({
                success: false,
                message: 'not logged in'
            })
        }

        //토큰을 검증한다.
        const decoded: any = jwt.verify(token, secret_key);
        
        if (decoded) {
            response.locals = {
                ...response.locals,
                id: decoded.id,
                user_level: decoded.user_level,
            }
            next();
        } else {
            response.status(401).json({ error: 'unauthorized' });
        }
    } catch (err) {
        response.status(401).json({ error: 'token expired' });
    }
};

// Rate Limiter 상태 변수
let requestCount = 0;
let lastResetTime = Date.now();

// 초당 요청 제한 미들웨어
const checkRateLimit = (request: Request, response: Response, next: NextFunction) => {
    const now = Date.now();
    const interval = config.rateLimitInterval || 1000;
    const maxReq = config.maxRequests || 10;

    if (now - lastResetTime > interval) {
        requestCount = 0;
        lastResetTime = now;
    }

    if (requestCount >= maxReq) {
        return response.status(429).json({
            error: {
                code: "RATE_LIMIT_EXCEED",
                message: "Too Many Requests. Max 10 requests per second."
            }
        });
    }

    requestCount++;
    next();
};

// API Key 인증 미들웨어 (config.openApiAllowedKeys 중 하나 일치)
const verifyApiKey = (request: Request, response: Response, next: NextFunction) => {
    const apiKey = request.headers['x-api-key'] as string;
    const allowed = config.openApiAllowedKeys;

    if (!apiKey || allowed.length === 0) {
        return response.status(401).json({
            error: {
                code: "INVALID_API_KEY",
                message: "Invalid or missing API key."
            }
        });
    }

    const idx = allowed.indexOf(apiKey);
    if (idx === -1) {
        return response.status(401).json({
            error: {
                code: "INVALID_API_KEY",
                message: "Invalid or missing API key."
            }
        });
    }

    response.locals.openApiKeyIndex = idx;
    next();
};

export { deviceVerifyToken, verifyToken, checkRateLimit, verifyApiKey };
