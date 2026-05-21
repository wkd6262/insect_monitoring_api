import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

import { verifyToken } from '../authorization';
import { UserService } from '../services/user-service';
import { User } from '../models/user';
import config from '../config';

const router = Router();

router.use('/list', verifyToken);
router.get('/list', async (request: Request, response: Response) => {
  // #swagger.tags = ['account']
  // #swagger.path = '/account/list'
  // #swagger.security = [{bearerAuth: []}]
  // #swagger.summary = '사용자 목록'
  /* #swagger.responses[200] = {
       description: '성공',
       content: { 'application/json': { schema: { $ref: '#/components/schemas/AccountListSuccessResponse' } } }
     } */
  /* #swagger.responses[400] = {
       description: '실패',
       content: { 'application/json': { schema: { $ref: '#/components/schemas/GeneralFailedResponse' } } }
     } */
  try {
    const userLevel: number = response.locals['user_level'];
    if (userLevel === 0) {
      response.status(400).json({ type: 'error', message: 'not admin level' });
      return;
    }

    const userService = new UserService();
    const userList = await userService.findAll();
    response.status(200).json(userList);
  } catch (err) {
    response.status(400).json({ type: 'error', message: 'unknown server error' });
  }
});

router.use('/get', verifyToken);
router.get('/get', async (request: Request, response: Response) => {
  // #swagger.tags = ['account']
  // #swagger.path = '/account/get'
  // #swagger.security = [{bearerAuth: []}]
  // #swagger.summary = '사용자 정보'
  /* #swagger.parameters['userId'] = { in: 'query', required: true, type: 'string' } */
  /* #swagger.responses[200] = {
       description: '성공',
       content: { 'application/json': { schema: { $ref: '#/components/schemas/AccountInfoSuccessResponse' } } }
     } */
  /* #swagger.responses[400] = {
       description: '실패',
       content: { 'application/json': { schema: { $ref: '#/components/schemas/GeneralFailedResponse' } } }
     } */
  try {
    const userLevel: number = response.locals['user_level'];
    const userId: string = request.query.userId as string;

    if (userLevel === 0) {
      response.status(400).json({ type: 'error', message: 'not admin level' });
      return;
    }

    const userService = new UserService();
    const user = await userService.findUserByUserId(userId);
    if (user === null) {
      response.status(400).json({ type: 'error', message: 'not exists user' });
      return;
    }

    response.status(200).json(user);
  } catch (err) {
    response.status(400).json({ type: 'error', message: 'unknown server error' });
  }
});

router.post('/register', async (request: Request, response: Response) => {
  // #swagger.tags = ['account']
  // #swagger.path = '/account/register'
  // #swagger.summary = '사용자 가입'
  /* #swagger.requestBody = {
       required: true,
       content: {
         'application/json': {
           schema: {
             type: 'object',
             required: ['userId', 'password', 'userLevel'],
             properties: {
               userId: { type: 'string' },
               password: { type: 'string' },
               userLevel: { type: 'integer' }
             }
           }
         }
       }
     } */
  /* #swagger.responses[200] = {
       description: '성공',
       content: { 'application/json': { schema: { $ref: '#/components/schemas/AccountSuccessResponse' } } }
     } */
  /* #swagger.responses[400] = {
       description: '실패',
       content: { 'application/json': { schema: { $ref: '#/components/schemas/AccountFailedResponse' } } }
     } */
  const userService = new UserService();
  const cryptedPassword = crypto
    .createHash('sha512')
    .update(request.body.password)
    .digest('base64');

  try {
    const createUserData: User = {
      user_id: request.body.userId,
      password: cryptedPassword,
      user_level: request.body.userLevel,
      created_date: new Date(),
    };

    const user = await userService.register(createUserData);

    const token = jwt.sign(
      { id: user.id },
      config.jwtSecretKey!,
      { expiresIn: 60 * 60 * 24 * 1 },
    );

    response.status(200).json({ type: 'success', user: user, token: token });
  } catch (err) {
    response.status(400).json({
      type: 'error',
      user: null,
      message: 'unknown server error',
    });
  }
});

router.get('/login', async (request: Request, response: Response) => {
  // #swagger.tags = ['account']
  // #swagger.path = '/account/login'
  // #swagger.summary = '로그인'
  /* #swagger.parameters['loginId'] = { in: 'query', required: true, type: 'string' } */
  /* #swagger.parameters['password'] = { in: 'query', required: true, type: 'string' } */
  /* #swagger.responses[200] = {
       description: '성공',
       content: { 'application/json': { schema: { $ref: '#/components/schemas/AccountSuccessResponse' } } }
     } */
  /* #swagger.responses[400] = {
       description: '실패',
       content: { 'application/json': { schema: { $ref: '#/components/schemas/AccountFailedResponse' } } }
     } */
  const userService = new UserService();

  try {
    const loginId = request.query.loginId as string;
    const password = request.query.password as string;
    const cryptedPassword = crypto
      .createHash('sha512')
      .update(password)
      .digest('base64');

    const user = await userService.findUserByUserId(loginId);
    if (user === null) {
      response.status(400).json({
        type: 'error',
        user: null,
        message: 'not exists user id',
      });
      return;
    }

    if (user.password !== cryptedPassword) {
      response.status(400).json({
        type: 'error',
        user: null,
        message: 'wrong password',
      });
      return;
    }

    const token = jwt.sign(
      { id: user.id, user_level: user.user_level },
      config.jwtSecretKey!,
      { expiresIn: 60 * 60 * 24 * 1 },
    );
    userService.updateLastLoginDate(user.id!);

    response.status(200).json({
      type: 'success',
      user: user,
      token: token,
    });
  } catch (err) {
    response.status(400).json({
      type: 'error',
      user: null,
      message: 'unknown server error',
    });
  }
});

router.use('/update', verifyToken);
router.put('/update', async (request: Request, response: Response) => {
  // #swagger.tags = ['account']
  // #swagger.path = '/account/update'
  // #swagger.security = [{bearerAuth: []}]
  // #swagger.summary = '사용자 수정'
  /* #swagger.requestBody = {
       required: true,
       content: {
         'application/json': {
           schema: {
             type: 'object',
             required: ['userId', 'userLevel'],
             properties: {
               userId: { type: 'integer' },
               password: { type: 'string' },
               userLevel: { type: 'integer' }
             }
           }
         }
       }
     } */
  /* #swagger.responses[200] = {
       description: '성공',
       content: { 'application/json': { schema: { $ref: '#/components/schemas/GeneralSuccessResponse' } } }
     } */
  /* #swagger.responses[400] = {
       description: '실패',
       content: { 'application/json': { schema: { $ref: '#/components/schemas/GeneralFailedResponse' } } }
     } */
  const userService = new UserService();

  try {
    const id: number = response.locals['id'];
    const userId: number = request.body.userId;
    const password: string = request.body.password;
    const userLevel: number = request.body.userLevel;

    const user = await userService.findUserById(id);
    if (user === null) {
      response.status(400).json({ type: 'error', message: 'not exists user' });
      return;
    }

    if (user.user_level === 0) {
      response.status(400).json({ type: 'error', message: 'not admin level' });
      return;
    }

    const targetUser = await userService.findUserById(userId);
    if (targetUser === null) {
      response.status(400).json({ type: 'error', message: 'not exists target user' });
      return;
    }

    if (password !== undefined && password !== '') {
      targetUser.password = crypto
        .createHash('sha512')
        .update(password)
        .digest('base64');
    }

    targetUser.user_level = userLevel;
    await userService.update(userId, targetUser);

    response.status(200).json({ type: 'success', message: 'success' });
  } catch (err) {
    response.status(400).json({ type: 'error', message: 'unknown server error' });
  }
});

router.use('/delete', verifyToken);
router.delete('/delete', async (request: Request, response: Response) => {
  // #swagger.tags = ['account']
  // #swagger.path = '/account/delete'
  // #swagger.security = [{bearerAuth: []}]
  // #swagger.summary = '사용자 삭제'
  /* #swagger.requestBody = {
       required: true,
       content: {
         'application/json': {
           schema: {
             type: 'object',
             required: ['userId'],
             properties: { userId: { type: 'integer' } }
           }
         }
       }
     } */
  /* #swagger.responses[200] = {
       description: '성공',
       content: { 'application/json': { schema: { $ref: '#/components/schemas/GeneralSuccessResponse' } } }
     } */
  const userService = new UserService();

  try {
    const id: number = response.locals['id'];
    const deleteUserId: number = request.body.userId;
    const user = await userService.findUserById(id);
    if (user === null) {
      response.status(400).json({ type: 'error', message: 'not exists user' });
      return;
    }

    if (user.user_level === 0) {
      response.status(400).json({ type: 'error', message: 'not admin level' });
      return;
    }

    await userService.delete(deleteUserId);
    response.status(200).json({ type: 'success', message: 'success' });
  } catch (err) {
    response.status(400).json({ type: 'error', message: 'unknown server error' });
  }
});

export default router;
