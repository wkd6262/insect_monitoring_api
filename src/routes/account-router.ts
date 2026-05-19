import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

import { verifyToken } from '../authorization';
import { UserService } from '../services/user-service';
import { User } from '../models/user';
import { DeviceService } from '../services/device-service';
import { Device } from '../models/device';
import { UserDeviceService } from '../services/user-device-service';
import config from '../config';


const router = Router();

//유저 목록 요청.
router.use('/list', verifyToken);
router.get('/list', async (request: Request, response: Response) => {
    // #swagger.tags = ['account']
    // #swagger.path = '/account/list'
    // #swagger.security = [{bearerAuth: []}]
    // #swagger.summary = '사용자 목록 요청'
    /* #swagger.responses[200] = {
         description: '요청 성공',
         content: {
            "application/json": {
                schema: {$ref: '#/components/schemas/AccountListSuccessResponse'}
            }
         }
     } */   
    /* #swagger.responses[400] = {
         description: '요청 실패',
         content: {
            "application/json": {
                schema: {$ref: '#/components/schemas/GeneralFailedResponse'}
            }
         }
     } */
    try{
        const userLevel: number = response.locals['user_level'];
        if(userLevel === 0) {
            response.status(400).json({type: 'error', message: 'not admin level'});
            return;
        }

        const userService = new UserService();
        const userList: User[] = await userService.findAll();
        response.status(200).json(userList);
    }catch(err) {
        response.status(400).json({
            type: 'error',
            message: 'unknown server error',
        });
    }
});

//특정 유저 정보 요청.
router.use('/get', verifyToken);
router.get('/get', async (request: Request, response: Response) => {
    // #swagger.tags = ['account']
    // #swagger.path = '/account/get'
    // #swagger.security = [{bearerAuth: []}]
    // #swagger.summary = '사용자 정보 요청'
    /* #swagger.responses[200] = {
         description: '요청 성공',
         content: {
            "application/json": {
                schema: {$ref: '#/components/schemas/AccountInfoSuccessResponse'}
            }
         }
     } */   
    /* #swagger.responses[400] = {
         description: '요청 실패',
         content: {
            "application/json": {
                schema: {$ref: '#/components/schemas/GeneralFailedResponse'}
            }
         }
     } */
    try{
        const userLevel: number = response.locals['user_level'];
        const userId: string = request.query.userId as string;

        if(userLevel === 0) {
            response.status(400).json({type: 'error', message: 'not admin level'});
            return;
        }

        const userService = new UserService();
        const user: User | null = await userService.findUserByUserId(userId);
        if(user === null) { 
            response.status(400).json({type: 'error', message: 'not exists user'});
            return;
        }

        response.status(200).json(user);
    }catch(err) {
        response.status(400).json({
            type: 'error',
            message: 'unknown server error',
        });
    }
});

//유저 가입 요청.
router.post('/register', async (request: Request, response: Response) => {
    // #swagger.tags = ['account']
    // #swagger.path = '/account/register'
    // #swagger.summary = '사용자 가입 요청'
    /* #swagger.responses[200] = {
         description: '가입 성공',
         content: {
            "application/json": {
                schema: {$ref: '#/components/schemas/AccountSuccessResponse'}
            }
         }
     } */
    /* #swagger.responses[400] = {
         description: '가입 실패',
         content: {
            "application/json": {
                schema: {$ref: '#/components/schemas/AccountFailedResponse'}
            }
         }
     } */
    /* #swagger.requestBody = {
        required: true,
        content: {
            "application/json": {
                schema: {
                    type: "object",
                    properties: {
                        userId: {
                            type: "string",
                            description: "사용자 고유 값"
                        },
                        password: {
                            type: "string", 
                            description: "비밀번호"
                        },
                        userLevel: {
                            type: "number",
                            description: "사용자 레벨(0 - 장비 소유자, 1 - 관리자)"
                        },
                        deviceUUIDs: {
                            type: "array",
                            description: "장비 UUID 목록",
                            items: {
                                type: "string"
                            }
                        }
                    },
                    required: ["userId", "password", "userLevel", "deviceUUIDs"]
                },
                example: {
                    userId: "test",
                    password: "1234",
                    userLevel: 0,
                    deviceUUIDs: ["123e4567-e89b-12d3-a456-426614174000", "123e4567-e89b-12d3-a456-426614174001"]
                }
            }
        }
    } */

    const userService = new UserService();
    const userDeviceService = new UserDeviceService();
    const deviceService = new DeviceService();
    const cryptedPassword = crypto.createHash('sha512').update(request.body.password).digest('base64');

    try{
        const deviceUUIDs: string[] = request.body.deviceUUIDs;

        const createUserData: User = {
            user_id: request.body.userId,
            password: cryptedPassword,
            cellphone: request.body.cellphone,
            user_level: request.body.userLevel,
            created_date: new Date(),
        };

        const user: User = await userService.register(createUserData);

        if(user) {
            //장비 UUID 목록에 대해 등록.
            for(const deviceUUID of deviceUUIDs) {
                const device: Device | null = await deviceService.findDeviceByDeviceUUID(deviceUUID);
                if(device !== null) {
                    await userDeviceService.createUserDevice(user.id!, device.device_uuid);
                }
            }
        }

        //유저 정보를 가지고 토큰을 만들어낸다.
        const token = jwt.sign(
            {
                id: user.id,
            },
            config.jwtSecretKey!,
            {
                expiresIn: 60 * 60 * 24 * 1 //1day
            }
        );

        //개인정보 제거.
        response.status(200).json({type: 'success', user: user, token: token});
    }catch(err) {
        response.status(400).json({
            type: 'error',
            user: null,
            message: 'unknown server error',
        });
    }
});

//유저 로그인 요청.
router.get('/login', async (request: Request, response: Response) => {
    // #swagger.tags = ['account']
    // #swagger.path = '/account/login'
    // #swagger.summary = '사용자 로그인 요청'
    /* #swagger.responses[200] = {
         description: '로그인 성공',
         content: {
            "application/json": {
                schema: {$ref: '#/components/schemas/AccountSuccessResponse'}
            }
         }
     } */
    /* #swagger.responses[400] = {
         description: '로그인 실패',
         content: {
            "application/json": {
                schema: {$ref: '#/components/schemas/AccountFailedResponse'}
            }
         }
     } */
    /* #swagger.parameters['loginId'] = {
         in: 'query',
         description: '사용자 ID',
         required: true,
         type: 'string'
    } */
    /* #swagger.parameters['password'] = {
         in: 'query', 
         description: '비밀번호',
         required: true,
         type: 'string',
    } */

    const userService = new UserService();

    try{
        const loginId: string = request.query.loginId as string;
        const password: string = request.query.password as string;
        const cryptedPassword = crypto.createHash('sha512').update(password).digest('base64');
        
        //일치하는 아이디가 있는지 체크.
        let user: User | null = await userService.findUserByUserId(loginId);
        if(user === null) {
            response.status(400).json({
                type: 'error', 
                user: null, 
                message: 'not exists user id'
            });
            return;
        }

        //비밀번호가 일치하는지 확인.
        if(user.password !== cryptedPassword) {
            response.status(400).json({
                type: 'error', 
                user: null, 
                message: 'wrong password'
            });
            return;
        }

        //유저 정보를 가지고 토큰을 만들어낸다.
        const token = jwt.sign(
            {
                id: user.id,
                user_level: user.user_level
            },
            config.jwtSecretKey!,
            {
                expiresIn: 60 * 60 * 24 * 1 //1day
            }
        );
        userService.updateLastLoginDate(user.id!); //로그인 시간 업데이트.

        response.status(200).json({
            type: 'success', 
            user: user, 
            token: token
        });
    }catch(err) {
        response.status(400).json({
            type: 'error', 
            user: null, 
            message: 'unknown server error'
        });
    }
});

//유저 수정 요청.
router.use('/update', verifyToken);
router.put('/update', async (request: Request, response: Response) => {
    // #swagger.tags = ['account']
    // #swagger.summary = '계정 수정 요청'
    // #swagger.path = '/account/update'
    // #swagger.security = [{bearerAuth: []}]
    /* #swagger.responses[200] = {
         description: '계정 수정 성공',
         content: {
            "application/json": {
                schema: {$ref: '#/components/schemas/AccountSuccessResponse'}
            }
         }
     } */
    /* #swagger.responses[400] = {
         description: '계정 수정 실패',
         content: {
            "application/json": {
                schema: {$ref: '#/components/schemas/AccountFailedResponse'}
            }
         }
     } */
    /* #swagger.requestBody = {
        required: true,
        content: {
            "application/json": {
                schema: {
                    type: "object",
                    properties: {
                        userId: {
                            type: "number",
                            description: "수정할 사용자 고유 값"
                        },
                        password: {
                            type: "string",
                            description: "비밀번호 (비어있을 경우 비밀번호 변경 없음)"
                        },
                         cellphone: {
                            type: "string",
                            description: "전화번호 (비어있을 경우 전화번호 변경 없음)"
                        },
                        userLevel: {
                            type: "number",
                            description: "사용자 레벨(0 - 장비 소유자, 1 - 관리자)"
                        },
                        deviceUUIDs: {
                            type: "array",
                            description: "장비 UUID 목록",
                            items: {
                                type: "string"
                            }
                        }
                    },
                    required: ["userId", "userLevel", "deviceUUIDs"]
                }
            }
        }
    } */

    const userService = new UserService();
    const userDeviceService = new UserDeviceService();
    const deviceService = new DeviceService();
    
    try{
        const id: number = response.locals['id']; //수정을 요청하는 유저의 아이디.
        const userId: number = request.body.userId; //수정 처리할 유저의 아이디.
        const password: string = request.body.password;
        const cellphone: string = request.body.cellphone;
        const userLevel: number = request.body.userLevel;
        const deviceUUIDs: string[] = request.body.deviceUUIDs;

        const user: User | null = await userService.findUserById(id);
        if(user === null) {
            response.status(400).json({type: 'error', message: 'not exists user'});
            return;
        }
        
        //사용자 수정 권한 체크.
        if(user.user_level === 0) {
            response.status(400).json({type: 'error', message: 'not admin level'});
            return;
        }

        const targetUser: User | null = await userService.findUserById(userId);
        if(targetUser === null) {
            response.status(400).json({type: 'error', message: 'not exists target user'});
            return;
        }

        //사용자 수정.
        if(password !== undefined && password !== '') {
            const cryptedPassword = crypto.createHash('sha512').update(password).digest('base64');
            targetUser.password = cryptedPassword;
        }

        if(cellphone !== undefined && cellphone != '') {
            targetUser.cellphone = cellphone;
        }

        targetUser.user_level = userLevel;    
        await userService.update(userId, targetUser);

        //장비 수정.
        await userDeviceService.deleteUserDevice(userId);
        for(const deviceUUID of deviceUUIDs) {
            const device: Device | null = await deviceService.findDeviceByDeviceUUID(deviceUUID);
            if(device !== null) {
                await userDeviceService.createUserDevice(userId, device.device_uuid);
            }
        }

        response.status(200).json({type: 'success', message: 'success'});
    }catch(err) {
        response.status(400).json({type: 'error', message: 'unknown server error'});
    }
});

//유저 삭제 요청.
router.use('/delete', verifyToken);
router.delete('/delete', async (request: Request, response: Response) => {
    // #swagger.tags = ['account']
    // #swagger.summary = '계정 삭제 요청'
    // #swagger.path = '/account/delete'
    // #swagger.security = [{bearerAuth: []}]
    /* #swagger.responses[200] = {
         description: '계정 삭제 성공',
         content: {
            "application/json": {
                schema: {$ref: '#/components/schemas/AccountSuccessResponse'}
            }
         }
     } */
    /* #swagger.responses[400] = {
         description: '계정 삭제 실패',
         content: {
            "application/json": {
                schema: {$ref: '#/components/schemas/AccountFailedResponse'}
            }
         }
     } */
    /* #swagger.requestBody = {
        required: true,
        content: {
            "application/json": {
                schema: {
                    type: "object",
                    properties: {
                        userId: {
                            type: "number",
                            description: "삭제할 사용자 고유 값"
                        },
                    },
                    required: ["userId"]
                }
            }
        }
    } */

    const userService = new UserService();
    const userDeviceService = new UserDeviceService();
    try{
        const id: number = response.locals['id'];
        const deleteUserId: number = request.body.userId;
        const user: User | null = await userService.findUserById(id);
        if(user === null) {
            response.status(400).json({type: 'error', message: 'not exists user'});
            return;
        }
        
        //사용자 삭제 권한 체크.
        if(user.user_level === 0) {
            response.status(400).json({type: 'error', message: 'not admin level'});
            return;
        }

        await userDeviceService.deleteUserDevice(deleteUserId);
        await userService.delete(deleteUserId);
        response.status(200).json({type: 'success', message: 'success'});
    }catch(err) {
        response.status(400).json({type: 'error', message: 'unknown server error'});
    }
});

export default router;