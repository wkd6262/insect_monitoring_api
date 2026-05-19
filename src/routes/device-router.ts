import { Router, Request, Response } from 'express';

import { verifyToken } from '../authorization';
import { UserService } from '../services/user-service';
import { UserDeviceService } from '../services/user-device-service';
import { DeviceService } from '../services/device-service';
// import { DeviceGroupService } from '../services/device-group-service';
import { Device } from '../models/device';
import { DeviceGroup } from '../models/deviceGroup';
import { InsectHistory } from '../models/insectHistory';
import { CollectionService } from '../services/collection-service';
import { User } from '../models/user';
import { UserDevice } from '../models/userDevice';
import { MQTTService } from '../services/mqtt-service';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { DeviceSettingService } from '../services/device-setting-service';

dayjs.extend(utc);
dayjs.extend(timezone);

const router = Router();

//디바이스 UUID(MAC Address) 값만 등록된 장비 목록 반환 요청.
router.use('/listUUID', verifyToken);
router.get('/listUUID', async (request: Request, response: Response) => {
  // #swagger.tags = ['device']
  // #swagger.summary = 'UUID(Mac Address)만 존재하는 장비 목록 요청'
  // #swagger.path = '/device/listUUID'
  // #swagger.security = [{bearerAuth: []}]
  /* #swagger.responses[200] = {
         description: '요청 성공',
         content: {
            "application/json": {   
                schema: {$ref: '#/components/schemas/DeviceListSuccessResponse'}
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
  try {
    const deviceService = new DeviceService();
    const userLevel: number = response.locals['user_level'];

    //권한 체크.
    if (userLevel === 0) {
      response.status(400).json({ type: 'error', message: 'not admin level' });
      return;
    }

    const devices: Device[] = await deviceService.findDeviceOnlyUUID();
    response.status(200).json(devices);
  } catch (err) {
    response.status(400).json({
      type: 'error',
      message: 'unknown server error',
    });
  }
});

//특정 사용자의 장비 그룹 목록 요청.

/*
router.use('/listGroup', verifyToken);
router.get('/listGroup', async (request: Request, response: Response) => {
    // #swagger.tags = ['device']
    // #swagger.summary = '특정 사용자의 장비 그룹 목록 요청'
    // #swagger.path = '/device/listGroup'
    // #swagger.security = [{bearerAuth: []}]
    /* #swagger.responses[200] = {
         description: '요청 성공',
         content: {
            "application/json": {   
                schema: {$ref: '#/components/schemas/DeviceGroupListSuccessResponse'}
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
/*
    try{
        const deviceGroupService = new DeviceGroupService();
        const userDeviceService = new UserDeviceService();

        const userId: number = response.locals['id'];   
        const userLevel: number = response.locals['user_level'];

        let list: UserDevice[] = [];
        if(userLevel === 1) { // 관리자일 경우는 전체 그룹 목록을 바로 가져온다.
            const result: DeviceGroup[] = await deviceGroupService.findAll();
            list = result.map(deviceGroup => ({
                id: 0,
                user_id: userId,
                device_group_id: deviceGroup.id || 0,
                device_uuid: '',
                device_usim: '',
                created_date: deviceGroup.created_date,
                deviceGroup: deviceGroup
            }));
        }else{
            list = await userDeviceService.findUserGroupByUserId(userId);
        }
        response.status(200).send(list);
    }catch(err) {
        response.status(400).json({
            type: 'error',
            message: 'unknown server error',
        });
    }
});
*/

//사용자의 모든 장비 목록 요청. (관리자일 경우 모든 장비 요청)
router.use('/listAll', verifyToken);
router.get('/listAll', async (request: Request, response: Response) => {
  // #swagger.tags = ['device']
  // #swagger.summary = '사용자의 모든 장비 목록 요청'
  // #swagger.path = '/device/listAll'
  // #swagger.security = [{bearerAuth: []}]
  /* #swagger.responses[200] = {
         description: '요청 성공',
         content: {
            "application/json": {   
                schema: {$ref: '#/components/schemas/DeviceListSuccessResponse'}
            }
         }
     } */
  try {
    const deviceService = new DeviceService();
    const userDeviceService = new UserDeviceService();

    const userId: number = response.locals['id'];
    const userLevel: number = response.locals['user_level'];

    let list: UserDevice[] = [];
    if (userLevel === 1) {
      // 관리자일 경우는 userDevice에서 디바이스를 관리하지 않으므로 deviceService에서 모든 디바이스를 조회.
      const result: Device[] = await deviceService.findAll();
      list = result.map((device) => ({
        id: 0,
        user_id: userId,
        // device_group_id: device.device_group_id,
        device_uuid: device.device_uuid,
        device_usim: device.device_usim,
        created_date: device.created_date,
        device: device,
        // device_group: device.deviceGroup
      }));
    } else {
      list = await userDeviceService.findUserDeviceByUserId(userId);
    }
    response.status(200).send(list);
  } catch (err) {
    response.status(400).json({
      type: 'error',
      message: 'unknown server error',
    });
  }
});

// 옵션으로 장비 필터링 목록 요청 (지역별 포집 현황)
router.use('/listByOption', verifyToken);
router.get('/listByOption', async (request: Request, response: Response) => {
  // #swagger.tags = ['device']
  // #swagger.summary = '옵션으로 장비 필터링 목록 요청 (지역별 포집 현황)'
  // #swagger.path = '/device/listByOption'
  // #swagger.security = [{bearerAuth: []}]
  /* #swagger.parameters['address_sido'] = { in: 'query', description: '시/도', type: 'string' } */
  /* #swagger.parameters['address_gungu'] = { in: 'query', description: '구/군', type: 'string' } */
  /* #swagger.parameters['address_dong'] = { in: 'query', description: '읍/면/동', type: 'string' } */
  /* #swagger.parameters['device_id'] = { in: 'query', description: '장비 ID (0은 전체)', type: 'number' } */
  /* #swagger.parameters['status'] = { in: 'query', description: '상태 (정상 = good, 주의 = warning, 심각 = bad)', type: 'string' } */
  /* #swagger.responses[200] = {
            description: '요청 성공',
            content: {
                "application/json": {
                    schema: { $ref: '#/components/schemas/DeviceListSuccessResponse' }
                }
            }
        } 
    */
  try {
    const deviceService = new DeviceService();
    const userDeviceService = new UserDeviceService();

    const userId: number = response.locals['id'];
    const userLevel: number = response.locals['user_level'];

    // 쿼리 스트링에서 필터링에 사용할 파라미터를 추출
    const { address_sido, address_gungu, address_dong, status } = request.query;
    const device_id = request.query.device_id
      ? parseInt(request.query.device_id as string, 10)
      : 0;

    let list; // 관리자와 유저의 반환 타입이 다르므로 let으로 선언

    // 사용자 레벨에 따라 분기합니다.
    if (userLevel === 1) {
      // 관리자일 경우
      // DeviceService를 사용하여 전체 장비를 대상으로 필터링
      list = await deviceService.findDeviceOption(
        (address_sido as string) || '',
        (address_gungu as string) || '',
        (address_dong as string) || '',
        device_id,
        (status as string) || '',
      );
    } else {
      // 일반 사용자일 경우
      // UserDeviceService를 사용하여 해당 사용자의 장비 내에서만 필터링
      list = await userDeviceService.findDeviceOption(
        userId,
        (address_sido as string) || '',
        (address_gungu as string) || '',
        (address_dong as string) || '',
        device_id,
        (status as string) || '',
      );
    }

    response.status(200).json(list);
  } catch (err) {
    response.status(400).json({
      type: 'error',
      message: 'unknown server error',
    });
  }
});

/*
router.use('/addGroup', verifyToken);
router.post('/addGroup', async (request: Request, response: Response) => {
    // #swagger.tags = ['device']
    // #swagger.summary = '장비 그룹 추가'
    // #swagger.path = '/device/addGroup'
    // #swagger.security = [{bearerAuth: []}]
    /* #swagger.responses[200] = {
         description: '요청 성공',
         content: {
            "application/json": {   
                schema: {$ref: '#/components/schemas/DeviceGroupSuccessResponse'}
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
/* #swagger.requestBody = {
        required: true,
        content: {
            "application/json": {
                schema: {
                    type: "object",
                    properties: {
                        groupName: {
                            type: "string",
                            description: "생성할 그룹명"
                        },
                    },
                    required: ["groupName"]
                },
                example: {
                    groupName: "production",
                }
            }
        }
    } */
/*
    try{
        const deviceGroupService = new DeviceGroupService();

        const userLevel: number = response.locals['user_level'];
        const groupName: string = request.body.groupName;
    
        //권한 체크.
        if(userLevel === 0) {
            response.status(400).json({type: 'error', message: 'not admin level'});
            return;
        }
    
        //이미 존재하는 그룹명인지 체크.
        const deviceGroup: DeviceGroup | null = await deviceGroupService.findByGroupName(groupName);
        if(deviceGroup !== null) {
            response.status(400).json({type: 'error', message: 'already exists group name'});
            return;
        }
    
        const newDeviceGroup: DeviceGroup = {
            group_name: groupName,
            created_date: new Date(),
        };
    
        const result = await deviceGroupService.register(newDeviceGroup);
        response.status(200).send(result);
    }catch(err) {
        response.status(400).json({
            type: 'error',
            message: 'unknown server error',
        });
    }
});
*/

/*
router.use('/updateGroup', verifyToken);
router.put('/updateGroup', async (request: Request, response: Response) => {
    // #swagger.tags = ['device']
    // #swagger.summary = '장비 그룹명 수정 요청'
    // #swagger.path = '/device/updateGroup'
    // #swagger.security = [{bearerAuth: []}]
    /* #swagger.responses[200] = {
         description: '장비 그룹명 수정 성공',
         content: {
            "application/json": {
                schema: {$ref: '#/components/schemas/DeviceSuccessResponse'}
            }
         }
     } */
/* #swagger.responses[400] = {
         description: '장비 그룹명 수정 실패',
         content: {
            "application/json": {
                schema: {$ref: '#/components/schemas/GeneralFailedResponse'}
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
                        groupId: {
                            type: "number",
                            description: "수정할 그룹 고유 값"
                        },
                        groupName: {
                            type: "string",
                            description: "변경할 그룹명"
                        },
                    },
                    required: ["groupId", "groupName"]
                }
            }
        }
    } */
/*
    const deviceGroupService = new DeviceGroupService();

    try{
        const id: number = response.locals['id'];
        const groupId: number = request.body.groupId;
        const groupName: string = request.body.groupName;
        
        const userLevel: number = response.locals['user_level'];

        if(userLevel === 1) { //관리자인 경우.
            const deviceGroup: DeviceGroup | null = await deviceGroupService.findById(groupId);
            if(deviceGroup === null) {
                response.status(400).json({type: 'error', message: 'not exists device group'});
                return;
            }

            deviceGroup.group_name = groupName;
            await deviceGroupService.update(groupId, deviceGroup);
            console.log(`device_group_change: ${groupId}, ${groupName}`);
        }else {
            response.status(400).json({type: 'error', message: 'not admin level'});
            return;
        }

        response.status(200).json({type: 'success', message: 'success'});
    }catch(err) {
        response.status(400).json({type: 'error', message: 'unknown server error'});
    }
});
*/

/*
router.use('/deleteGroup', verifyToken);
router.delete('/deleteGroup', async (request: Request, response: Response) => {
    // #swagger.tags = ['device']
    // #swagger.summary = '장비 그룹 삭제'
    // #swagger.path = '/device/deleteGroup'
    // #swagger.security = [{bearerAuth: []}]
    /* #swagger.responses[200] = {
         description: '요청 성공',
         content: {
            "application/json": {
                schema: {
                    type: "string",
                    example: "success"
                }
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
/* #swagger.parameters['deviceGroupId'] = {
         in: 'query',
         description: '장비 그룹 고유 ID',
         required: true,
         type: 'number'
    } */
/*
    try{
        const deviceGroupService = new DeviceGroupService();
        const deviceService = new DeviceService();
        const userDeviceService = new UserDeviceService();

        const userLevel: number = response.locals['user_level'];
        const deviceGroupId: number = parseInt(request.query.deviceGroupId as string);

        //권한 체크.
        if(userLevel === 0) {
            response.status(400).json({type: 'error', message: 'not admin level'});
            return;
        }

        //그룹 내 디바이스가 들어있는지 체크.
        /*
        const deviceList: Device[] = await deviceService.findDeviceByGroupId(deviceGroupId);
        if(deviceList.length > 0) {
            response.status(400).json({type: 'error', message: 'group has devices'});
            return;
        }
        */

/*
        await userDeviceService.deleteUserDeviceByGroupId(deviceGroupId); //사용자와 연관되어있는 사용자 디바이스 목록 제거.
        await deviceService.deleteByGroupId(deviceGroupId); //그룹 내 디바이스 목록 제거.
        await deviceGroupService.delete(deviceGroupId); //디바이스 그룹 제거.
        response.status(200).send('success');
    }catch(err) {
        response.status(400).json({
            type: 'error',
            message: 'unknown server error',
        });
    }
});
*/

/*
//특정 장비 그룹에 대한 장비 목록 요청.
router.use('/list', verifyToken);
router.get('/list', async (request: Request, response: Response) => {
    // #swagger.tags = ['device']
    // #swagger.summary = '특정 장비 그룹 내 장비 목록 요청'
    // #swagger.path = '/device/list'
    // #swagger.security = [{bearerAuth: []}]
    /* #swagger.responses[200] = {
         description: '요청 성공',
         content: {
            "application/json": {   
                schema: {$ref: '#/components/schemas/DeviceListSuccessResponse'}
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
/* #swagger.parameters['deviceGroupId'] = {
         in: 'query',
         description: '장비 그룹 고유 ID',
         required: true,
         type: 'number'
    } */
/*
    const userDeviceService = new UserDeviceService();

    try{
        let userId: number = response.locals['id'];
        const userLevel: number = response.locals['user_level'];
        const deviceGroupId: number = parseInt(request.query.deviceGroupId as string);
        
        let list: UserDevice[] = [];

        if(userLevel === 1) { // 관리자일 경우는 userDevice에서 디바이스를 관리하지 않으므로 deviceService에서 모든 디바이스를 조회.
            const deviceService = new DeviceService();
            const result: Device[] = await deviceService.findDeviceByGroupId(deviceGroupId);
            list = result.map(device => ({
                id: 0,
                user_id: userId,
                // device_group_id: device.device_group_id,
                device_uuid: device.device_uuid,
                device_usim: device.device_usim,
                created_date: device.created_date,
                device: device,
                // device_group: device.deviceGroup
            }));
        }else{
            list = await userDeviceService.findUserDeviceByUserIdAndGroupId(userId, deviceGroupId);
        }

        response.status(200).send(list);
    }catch(err) {
        response.status(400).json({
            type: 'error',
            message: 'unknown server error',
        });
    }
});
*/

//특정 장비 정보 요청.
router.use('/get', verifyToken);
router.get('/get', async (request: Request, response: Response) => {
  // #swagger.tags = ['device']
  // #swagger.summary = '특정 장비 정보 요청'
  // #swagger.path = '/device/get'
  // #swagger.security = [{bearerAuth: []}]
  /* #swagger.responses[200] = {
         description: '요청 성공',
         content: {
            "application/json": {   
                schema: {$ref: '#/components/schemas/UserDeviceSuccessResponse'}
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
  /* #swagger.parameters['deviceUUID'] = {
         in: 'query',
         description: '장비 고유 UUID',
         required: true,
         type: 'string'
    } */

  const userDeviceService = new UserDeviceService();

  try {
    const userId: number = response.locals['id'];
    const userLevel: number = response.locals['user_level'];
    const deviceUUID: string = request.query.deviceUUID as string;
    if (userLevel === 0) {
      //일반 사용자일 경우 디바이스 소유 중인지 확인.
      const userDeviceList: UserDevice[] =
        await userDeviceService.findUserDeviceByUserId(userId);
      if (userDeviceList.length === 0) {
        response.status(400).json({
          type: 'error',
          token: '',
          message: 'not exists user device',
        });
        return;
      }
    }

    let userDevice: UserDevice | null = null;
    if (userLevel === 1) {
      // 관리자일 경우는 userDevice에서 디바이스를 관리하지 않으므로 deviceService에서 모든 디바이스를 조회.
      const deviceService = new DeviceService();
      const device: Device | null =
        await deviceService.findDeviceByDeviceUUID(deviceUUID);
      if (device !== null) {
        userDevice = {
          id: 0,
          user_id: userId,
          // device_group_id: device.device_group_id,
          device_uuid: device.device_uuid,
          created_date: device.created_date,
          device: device,
          // deviceGroup: device.deviceGroup
        };
      }
    } else {
      const list = await userDeviceService.findUserDeviceByUserIdAndDeviceId(
        userId,
        deviceUUID,
      );
      userDevice = list[0];
    }
    response.status(200).json(userDevice);
  } catch (err) {
    response.status(400).json({
      type: 'error',
      token: '',
    });
  }
});

//특정 장비 검색.
router.use('/search', verifyToken);
router.get('/search', async (request: Request, response: Response) => {
  // #swagger.tags = ['device']
  // #swagger.summary = '장비 검색'
  // #swagger.path = '/device/search'
  // #swagger.security = [{bearerAuth: []}]
  /* #swagger.responses[200] = {
         description: '요청 성공',
         content: {
            "application/json": {   
                schema: {$ref: '#/components/schemas/DeviceListSuccessResponse'}
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
  /* #swagger.parameters['uuid'] = {
         in: 'query',
         description: '장비 고유 UUID',
         required: true,
         type: 'number'
    } */

  const deviceService = new DeviceService();

  try {
    const userId: number = response.locals['id'];
    const userLevel: number = response.locals['user_level'];
    const deviceUUID: string = request.query.deviceUUID as string;

    //권한 체크.
    if (userLevel === 0) {
      response.status(400).json({ type: 'error', message: 'not admin level' });
      return;
    }

    const devices: Device[] =
      await deviceService.searchDeviceByDeviceUUID(deviceUUID);
    response.status(200).json(devices);
  } catch (err) {
    response.status(400).json({
      type: 'error',
      message: 'unknown server error',
    });
  }
});

//장비 추가 함수 v3. (기존 uuid가 존재할 경우 update, 없을 경우 insert, groupId 없음)
router.use('/addDevice_v3', verifyToken);
router.post('/addDevice_v3', async (request: Request, response: Response) => {
  // #swagger.tags = ['device']
  // #swagger.summary = '장비 추가 (v3, groupId 없음)'
  // #swagger.path = '/device/addDevice_v3'
  // #swagger.security = [{bearerAuth: []}]
  /* #swagger.responses[200] = { description: '요청 성공' } */
  /* #swagger.responses[400] = { description: '요청 실패' } */
  /* #swagger.requestBody = {
        required: true,
        content: {
            "application/json": {
                schema: {
                    type: "object",
                    properties: {
                        deviceName: { type: "string" },
                        deviceUUID: { type: "string" },
                        deviceUSIM: { type: "string" },
                        address_sido: { type: "string" },
                        address_gungu: { type: "string" },
                        address_dong: { type: "string" },
                        address_detail: { type: "string" }
                    }
                }
            }
        }
    } */
  try {
    const deviceService = new DeviceService();
    const deviceSettingService = new DeviceSettingService();

    const userLevel: number = response.locals['user_level'];

    const deviceName: string = request.body.deviceName ?? '';
    const deviceUUID: string = request.body.deviceUUID;
    const deviceUSIM: string = request.body.deviceUSIM;
    const address_sido: string = request.body.address_sido;
    const address_gungu: string = request.body.address_gungu;
    const address_dong: string = request.body.address_dong;
    const address_detail: string = request.body.address_detail;

    //권한 체크.
    if (userLevel === 0) {
      response.status(400).json({ type: 'error', message: 'not admin level' });
      return;
    }

    const DEFAULT_NORMAL_MIN = 0;
    const DEFAULT_NORMAL_MAX = 49;
    const DEFAULT_WARNING_MIN = 50;
    const DEFAULT_WARNING_MAX = 99;
    const DEFAULT_BAD_MIN = 100;
    const DEFAULT_BAD_MAX = 10000;

    //기존 UUID가 존재하는지 체크.
    const oldDevice: Device | null =
      await deviceService.findDeviceByDeviceUUID(deviceUUID);
    if (oldDevice !== null) {
      const device: Device = {
        // device_group_id: null, // groupId 제거
        device_name: deviceName,
        device_uuid: deviceUUID,
        device_usim: deviceUSIM,
        address_sido: address_sido,
        address_gungu: address_gungu,
        address_dong: address_dong,
        address_detail: address_detail,
        latitude: 0,
        longitude: 0,
        mode: 2,
        ip_address: '',
        on_time: '17:00~05:00',
        co2_on_time: '17:00~05:00',
        co2_period: 5,
        valid_token: '',
        insect_count: 0,
        battery: 0,
        charge: 0,
        fan: 0,
        token_expired: null,
        device_date: new Date(),
        updated_date: new Date(),
        created_date: new Date(),
        last_offline_alert_date: null,
        last_battery_alert_date: null,
        last_collection_alert_date: null,
      };
      device.id = oldDevice.id!;

      const newDevice: Device | null = await deviceService.update(
        device.id,
        device,
      );

      const existingSetting = await deviceSettingService.getSettingByDeviceId(
        device.id,
      );
      if (!existingSetting) {
        await deviceSettingService.create(
          device.id,
          DEFAULT_NORMAL_MIN,
          DEFAULT_NORMAL_MAX,
          DEFAULT_WARNING_MIN,
          DEFAULT_WARNING_MAX,
          DEFAULT_BAD_MIN,
          DEFAULT_BAD_MAX,
        );
      }

      response.status(200).send(newDevice);
    } else {
      const device: Device = {
        // device_group_id: null, // groupId 제거
        device_name: deviceName,
        device_uuid: deviceUUID,
        device_usim: deviceUSIM,
        address_sido: address_sido,
        address_gungu: address_gungu,
        address_dong: address_dong,
        address_detail: address_detail,
        latitude: 0,
        longitude: 0,
        mode: 2,
        ip_address: '',
        on_time: '17:00~05:00',
        co2_on_time: '17:00~05:00',
        co2_period: 5,
        valid_token: '',
        insect_count: 0,
        battery: 0,
        charge: 0,
        fan: 0,
        token_expired: null,
        device_date: new Date(),
        updated_date: new Date(),
        created_date: new Date(),
        last_offline_alert_date: null,
        last_battery_alert_date: null,
        last_collection_alert_date: null,
      };
      const newDevice: Device = await deviceService.register(device);
      response.status(200).send(newDevice);
    }
  } catch (err) {
    response.status(400).json({
      type: 'error',
      message: 'unknown server error',
    });
  }
});

//장비 추가 함수. (기존 uuid가 존재할 경우 update, 없을 경우 insert)
router.use('/addDevice_v2', verifyToken);
router.post('/addDevice_v2', async (request: Request, response: Response) => {
  // #swagger.tags = ['device']
  // #swagger.summary = '장비 추가'
  // #swagger.path = '/device/addDevice_v2'
  // #swagger.security = [{bearerAuth: []}]
  /* #swagger.responses[200] = {
         description: '요청 성공',
         content: {
            "application/json": {   
                schema: {$ref: '#/components/schemas/DeviceSuccessResponse'}
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
  /* #swagger.requestBody = {
        required: true,
        content: {
            "application/json": {
                schema: {
                    type: "object",
                    properties: {
                        deviceGroupId: {
                            type: "number",
                            description: "연동되는 그룹 번호"
                        },
                        deviceName: {
                            type: "string",
                            description: "장비명"
                        },
                        deviceUUID: {
                            type: "string",
                            description: "장비 UUID"
                        },
                        address: {
                            type: "string",
                            description: "장비가 설치된 주소"
                        },  
                    },
                    required: ["groupName"]
                },
                example: {
                    deviceGroupId: 1,
                    deviceUUID: "1234567890",
                    address: "서울특별시 강남구 테헤란로 14길",
                }
            }
        }
    } */
  try {
    const deviceService = new DeviceService();

    const userLevel: number = response.locals['user_level'];

    const deviceGroupId: string = request.body.deviceGroupId;
    const deviceName: string = request.body.deviceName ?? '';
    const deviceUUID: string = request.body.deviceUUID;
    const deviceUSIM: string = request.body.deviceUSIM;
    const address_sido: string = request.body.address_sido;
    const address_gungu: string = request.body.address_gungu;
    const address_dong: string = request.body.address_dong;
    const address_detail: string = request.body.address_detail;

    //권한 체크.
    if (userLevel === 0) {
      response.status(400).json({ type: 'error', message: 'not admin level' });
      return;
    }

    //기존 UUID가 존재하는지 체크.
    const oldDevice: Device | null =
      await deviceService.findDeviceByDeviceUUID(deviceUUID);
    if (oldDevice !== null) {
      const device: Device = {
        // device_group_id: parseInt(deviceGroupId),
        device_name: deviceName,
        device_uuid: deviceUUID,
        device_usim: deviceUSIM,
        address_sido: address_sido,
        address_gungu: address_gungu,
        address_dong: address_dong,
        address_detail: address_detail,
        latitude: 0,
        longitude: 0,
        mode: 2,
        ip_address: '',
        on_time: '17:00~05:00',
        co2_on_time: '17:00~05:00',
        co2_period: 5,
        valid_token: '',
        insect_count: 0,
        battery: 0,
        charge: 0,
        fan: 0,
        token_expired: null,
        device_date: new Date(),
        updated_date: null,
        created_date: new Date(),
        last_offline_alert_date: null,
        last_battery_alert_date: null,
        last_collection_alert_date: null,
      };
      device.id = oldDevice.id!;

      const newDevice: Device | null = await deviceService.update(
        device.id,
        device,
      );
      response.status(200).send(newDevice);
    } else {
      const device: Device = {
        // device_group_id: parseInt(deviceGroupId),
        device_name: deviceName,
        device_uuid: deviceUUID,
        device_usim: deviceUSIM,
        address_sido: address_sido,
        address_gungu: address_gungu,
        address_dong: address_dong,
        address_detail: address_detail,
        latitude: 0,
        longitude: 0,
        mode: 2,
        ip_address: '',
        on_time: '17:00~05:00',
        co2_on_time: '17:00~05:00',
        co2_period: 5,
        valid_token: '',
        insect_count: 0,
        battery: 0,
        charge: 0,
        fan: 0,
        token_expired: null,
        device_date: new Date(),
        updated_date: null,
        created_date: new Date(),
        last_offline_alert_date: null,
        last_battery_alert_date: null,
        last_collection_alert_date: null,
      };
      const newDevice: Device = await deviceService.register(device);
      response.status(200).send(newDevice);
    }
  } catch (err) {
    response.status(400).json({
      type: 'error',
      message: 'unknown server error',
    });
  }
});

//기존 장비 추가 함수.
router.use('/addDevice', verifyToken);
router.post('/addDevice', async (request: Request, response: Response) => {
  // #swagger.tags = ['device']
  // #swagger.summary = '장비 추가'
  // #swagger.path = '/device/addDevice'
  // #swagger.security = [{bearerAuth: []}]
  /* #swagger.responses[200] = {
         description: '요청 성공',
         content: {
            "application/json": {   
                schema: {$ref: '#/components/schemas/DeviceSuccessResponse'}
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
  /* #swagger.requestBody = {
        required: true,
        content: {
            "application/json": {
                schema: {
                    type: "object",
                    properties: {
                        deviceGroupId: {
                            type: "number",
                            description: "연동되는 그룹 번호"
                        },
                        deviceName: {
                            type: "string",
                            description: "장비명"
                        },
                        deviceUUID: {
                            type: "string",
                            description: "장비 UUID"
                        },
                        address: {
                            type: "string",
                            description: "장비가 설치된 주소"
                        },  
                    },
                    required: ["groupName"]
                },
                example: {
                    deviceGroupId: 1,
                    deviceUUID: "1234567890",
                    address: "서울특별시 강남구 테헤란로 14길",
                }
            }
        }
    } */
  try {
    const deviceService = new DeviceService();

    const userLevel: number = response.locals['user_level'];

    const deviceGroupId: string = request.body.deviceGroupId;
    const deviceName: string = request.body.deviceName ?? '';
    const deviceUUID: string = request.body.deviceUUID;
    const deviceUSIM: string = request.body.deviceUSIM;
    const address_sido: string = request.body.address_sido;
    const address_gungu: string = request.body.address_gungu;
    const address_dong: string = request.body.address_dong;
    const address_detail: string = request.body.address_detail;

    //권한 체크.
    if (userLevel === 0) {
      response.status(400).json({ type: 'error', message: 'not admin level' });
      return;
    }

    //기존 UUID가 존재하는지 체크.
    const oldDevice: Device | null =
      await deviceService.findDeviceByDeviceUUID(deviceUUID);
    if (oldDevice !== null) {
      response
        .status(400)
        .json({ type: 'error', message: 'already exists device uuid' });
      return;
    }

    const device: Device = {
      // device_group_id: parseInt(deviceGroupId),
      device_name: deviceName,
      device_uuid: deviceUUID,
      device_usim: deviceUSIM,
      address_sido: address_sido,
      address_gungu: address_gungu,
      address_dong: address_dong,
      address_detail: address_detail,
      latitude: 0,
      longitude: 0,
      mode: 2,
      ip_address: '',
      on_time: '17:00~05:00',
      co2_on_time: '17:00~05:00',
      co2_period: 5,
      valid_token: '',
      insect_count: 0,
      battery: 0,
      charge: 0,
      fan: 0,
      token_expired: null,
      device_date: new Date(),
      updated_date: null,
      created_date: new Date(),
      last_offline_alert_date: null,
      last_battery_alert_date: null,
      last_collection_alert_date: null,
    };
    const newDevice: Device = await deviceService.register(device);
    response.status(200).send(newDevice);
  } catch (err) {
    response.status(400).json({
      type: 'error',
      message: 'unknown server error',
    });
  }
});

router.use('/updateDevice', verifyToken);
router.put('/updateDevice', async (request: Request, response: Response) => {
  // #swagger.tags = ['device']
  // #swagger.summary = '여러 장비의 정보(주소, 장비명) 일괄 변경'
  // #swagger.description = '관리자 권한으로 여러 장비의 주소 또는 장비명을 한 번에 변경합니다. 변경하고 싶은 필드만 값을 보내면 됩니다.'
  // #swagger.path = '/device/updateDevice'
  // #swagger.security = [{bearerAuth: []}]
  /* #swagger.requestBody = {
        required: true,
        content: {
            "application/json": {
                schema: {
                    type: "object",
                    properties: {
                        deviceUUIDs: {
                            type: "array",
                            items: { "type": "string" },
                            description: "정보를 변경할 장비 UUID 목록",
                            example: ["uuid-1", "uuid-2"]
                        },
                        device_name: { type: "string", description: "변경할 장비명 (선택)", example: "통합 관리 장비" },
                        address_sido: { type: "string", description: "변경할 시/도 (선택)", example: "경기도" },
                        address_gungu: { type: "string", description: "변경할 군/구 (선택)", example: "수원시" },
                        address_dong: { type: "string", description: "변경할 동/읍/면 (선택)", example: "매탄동" },
                        address_detail: { type: "string", description: "변경할 상세주소 (선택)", example: "삼성로 123" }
                    },
                    required: ["deviceUUIDs"]
                }
            }
        }
    } */
  /* #swagger.responses[200] = {
        description: '요청 성공',
        schema: {
            type: 'object',
            properties: {
                type: { type: 'string', example: 'success' },
                message: { type: 'string', example: '요청된 장비의 정보가 성공적으로 업데이트되었습니다.' }
            }
        }
    } */
  /* #swagger.responses[400] = { description: '잘못된 요청 (예: 필수 필드 누락)' } */
  /* #swagger.responses[403] = { description: '권한 없음 (관리자 아님)' } */
  /* #swagger.responses[500] = { description: '서버 오류' } */

  const deviceService = new DeviceService();
  try {
    const userLevel: number = response.locals['user_level'];
    const {
      deviceUUIDs,
      address_sido,
      address_gungu,
      address_dong,
      address_detail,
      device_name, // [추가]
    } = request.body;

    // 1. 관리자 권한 확인
    if (userLevel !== 1) {
      return response.status(403).json({
        type: 'error',
        message: 'Permission denied. Admin level required.',
      });
    }

    // 2. 입력값 유효성 검사
    if (!Array.isArray(deviceUUIDs) || deviceUUIDs.length === 0) {
      return response.status(400).json({
        type: 'error',
        message: 'deviceUUIDs must be a non-empty array.',
      });
    }

    // 최소한 하나의 업데이트 필드는 존재해야 함
    if (
      !address_sido &&
      !address_gungu &&
      !address_dong &&
      !address_detail &&
      !device_name
    ) {
      return response.status(400).json({
        type: 'error',
        message: 'At least one field to update is required.',
      });
    }

    // 3. DeviceService를 통해 업데이트 로직 호출 (메서드명 변경됨: updateAddressForMany -> updateDevices)
    await deviceService.updateDevices(
      deviceUUIDs,
      address_sido,
      address_gungu,
      address_dong,
      address_detail,
      device_name,
    );

    // 4. 성공 응답 반환
    response.status(200).json({
      type: 'success',
      message: 'Device information updated successfully.',
    });
  } catch (err) {
    console.error('updateDevice error:', err);
    response.status(500).json({
      type: 'error',
      message: 'A server error occurred while updating device information.',
    });
  }
});

// 단일 장비 UUID/USIM 변경: 내 디바이스에 선택한 미등록 디바이스의 UUID/USIM 덮어쓰기, 선택한 디바이스는 삭제.
router.use('/updateDeviceUuidUsim', verifyToken);
router.put(
  '/updateDeviceUuidUsim',
  async (request: Request, response: Response) => {
    const deviceService = new DeviceService();
    const collectionService = new CollectionService();
    const userDeviceService = new UserDeviceService();
    const deviceSettingService = new DeviceSettingService();
    try {
      const userLevel: number = response.locals['user_level'];
      if (userLevel !== 1) {
        return response.status(403).json({
          type: 'error',
          message: 'Permission denied. Admin level required.',
        });
      }
      const { currentDeviceUuid, newDeviceUuid, newDeviceUsim } = request.body;
      if (!currentDeviceUuid || typeof currentDeviceUuid !== 'string') {
        return response
          .status(400)
          .json({ type: 'error', message: 'currentDeviceUuid is required.' });
      }
      if (!newDeviceUuid || !newDeviceUsim) {
        return response.status(400).json({
          type: 'error',
          message: 'newDeviceUuid and newDeviceUsim are required.',
        });
      }

      const [device, sourceDevice] = await Promise.all([
        deviceService.findDeviceByDeviceUUID(currentDeviceUuid),
        deviceService.findDeviceByDeviceUUID(newDeviceUuid),
      ]);

      if (!device) {
        return response.status(400).json({
          type: 'error',
          message: 'Device with the given UUID was not found.',
        });
      }
      if (!sourceDevice) {
        return response
          .status(400)
          .json({ type: 'error', message: 'Selected device was not found.' });
      }
      if (sourceDevice.device_name !== '') {
        return response.status(400).json({
          type: 'error',
          message:
            'Only unregistered devices with empty device_name can be selected.',
        });
      }

      const finalUuid = newDeviceUuid;
      const finalUsim = newDeviceUsim;

      await userDeviceService.deleteUserDeviceByUUID(newDeviceUuid);
      await collectionService.deleteByDeviceUUID(newDeviceUuid);
      await deviceSettingService.deleteBySettings(sourceDevice.id!);
      await deviceService.delete(sourceDevice.id!);
      await deviceService.updateUuidUsim(device.id!, finalUuid, finalUsim);
      if (finalUuid !== currentDeviceUuid) {
        await collectionService.updateDeviceUuidByDeviceId(
          device.id!,
          finalUuid,
        );
        await userDeviceService.updateDeviceUuid(currentDeviceUuid, finalUuid);
      }

      response
        .status(200)
        .json({ type: 'success', message: 'UUID/USIM has been updated.' });
    } catch (err) {
      console.error('updateDeviceUuidUsim error:', err);
      response.status(500).json({
        type: 'error',
        message: 'A server error occurred while updating UUID/USIM.',
      });
    }
  },
);

// 장비 방역 기준 설정 업데이트
router.use('/updateSetting', verifyToken);
router.put(
  '/updateSetting',
  verifyToken,
  async (request: Request, response: Response) => {
    // #swagger.tags = ['Device']
    // #swagger.summary = '여러 장비의 방역 기준 설정 일괄 업데이트'
    // #swagger.description = '배열로 받은 여러 장비 ID에 대해 동일한 방역 기준 설정을 순차적으로 적용합니다. 트랜잭션은 사용하지 않습니다.'
    // #swagger.path = '/device/updateSetting'
    // #swagger.security = [{ "bearerAuth": [] }]

    /* #swagger.requestBody = {
        required: true,
        content: {
            "application/json": {
                schema: {
                    type: "object",
                    properties: {
                        deviceIds: {
                            type: "array",
                            items: { "type": "number" },
                            description: "설정을 적용할 장비 ID 목록",
                            example: [1, 2, 5]
                        },
                        settings: {
                            type: "object",
                            description: "적용할 방역 기준 설정값",
                            properties: {
                                normal_min: { type: "number", example: 0 },
                                normal_max: { type: "number", example: 49 },
                                warning_min: { type: "number", example: 50 },
                                warning_max: { type: "number", example: 99 },
                                bad_min: { type: "number", example: 100 },
                                bad_max: { type: "number", example: 10000 }
                            }
                        }
                    }
                }
            }
        }
    } */

    /* #swagger.responses[200] = {
        description: '성공적으로 모든 요청을 처리한 경우',
        schema: {
            type: 'object',
            properties: {
                type: { type: 'string', example: 'success' },
                message: { type: 'string', example: '요청된 모든 장비의 설정이 업데이트되었습니다.' }
            }
        }
    } */
    /* #swagger.responses[400] = {
        description: '요청 본문(body)의 형식이 잘못된 경우 (예: deviceIds가 배열이 아님)',
        schema: {
            type: 'object',
            properties: {
                type: { type: 'string', example: 'error' },
                message: { type: 'string', example: 'deviceIds는 비어있지 않은 배열이어야 합니다.' }
            }
        }
    } */
    /* #swagger.responses[403] = {
        description: '관리자 권한이 없는 경우',
        schema: {
            type: 'object',
            properties: {
                type: { type: 'string', example: 'error' },
                message: { type: 'string', example: '관리자 권한이 필요합니다.' }
            }
        }
    } */
    /* #swagger.responses[500] = {
        description: '처리 중 서버 내부 오류가 발생한 경우 (일부만 업데이트되었을 수 있음)',
        schema: {
            type: 'object',
            properties: {
                type: { type: 'string', example: 'error' },
                message: { type: 'string', example: '서버 오류가 발생했습니다. 일부 장비의 설정만 변경되었을 수 있습니다.' }
            }
        }
    } */

    const deviceSettingService = new DeviceSettingService();
    try {
      const { deviceIds, settings } = request.body;
      const userLevel: number = response.locals['user_level'];

      if (userLevel !== 1) {
        return response.status(403).json({
          type: 'error',
          message: 'Permission denied. Admin level required.',
        });
      }
      if (!Array.isArray(deviceIds) || deviceIds.length === 0) {
        return response.status(400).json({
          type: 'error',
          message: 'deviceIds must be a non-empty array.',
        });
      }
      if (!settings) {
        return response
          .status(400)
          .json({ type: 'error', message: 'The settings object is required.' });
      }

      await deviceSettingService.updateManySettings(deviceIds, settings);

      response.status(200).json({
        type: 'success',
        message: 'Settings for all requested devices have been updated.',
      });
    } catch (err) {
      console.error('설정 일괄 업데이트 중 오류 발생:', err);
      response.status(500).json({
        type: 'error',
        message:
          'A server error occurred. Only some device settings may have been changed.',
      });
    }
  },
);

router.use('/deleteDevice', verifyToken);
router.delete('/deleteDevice', async (request: Request, response: Response) => {
  // #swagger.tags = ['device']
  // #swagger.summary = '장비 삭제'
  // #swagger.path = '/device/deleteDevice'
  // #swagger.security = [{bearerAuth: []}]
  /* #swagger.responses[200] = {
         description: '요청 성공',
         content: {
            "application/json": {
                schema: {
                    type: "string",
                    example: "success"
                }
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
  /* #swagger.parameters['deviceUUID'] = {
         in: 'query',
         description: '장비 UUID',
         required: true,
         type: 'string'
    } */
  try {
    const deviceService = new DeviceService();
    const collectionService = new CollectionService();
    const userDeviceService = new UserDeviceService();

    const userLevel: number = response.locals['user_level'];
    const deviceUUID: string = request.query.deviceUUID as string;

    //권한 체크.
    if (userLevel === 0) {
      response.status(400).json({ type: 'error', message: 'not admin level' });
      return;
    }

    await userDeviceService.deleteUserDeviceByUUID(deviceUUID); //사용자와 연관되어있는 사용자 디바이스 목록 제거.
    await collectionService.deleteByDeviceUUID(deviceUUID); //컬렉션 목록 제거.
    await deviceService.deleteByUUID(deviceUUID); //그룹 내 디바이스 목록 제거.
    response.status(200).send('success');
  } catch (err) {
    response.status(400).json({
      type: 'error',
      message: 'unknown server error',
    });
  }
});

//지정된 마릿수 이상 잡힌 장비 검색.
router.use('/listByCount', verifyToken);
router.get('/listByCount', async (request: Request, response: Response) => {
  // #swagger.tags = ['device']
  // #swagger.summary = '지정된 마릿수 이상 잡힌 장비 검색'
  // #swagger.path = '/device/listByCount'
  // #swagger.security = [{bearerAuth: []}]
  /* #swagger.responses[200] = {
         description: '요청 성공',
         content: {
            "application/json": {   
                schema: {$ref: '#/components/schemas/ListByCountSuccessResponse'}
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
  /* #swagger.parameters['deviceGroupId'] = {
         in: 'query',
         description: '장비 그룹 ID (0이면 모든 장비)',
         required: true,
         type: 'number'
    } */
  /* #swagger.parameters['count'] = {
         in: 'query',
         description: '잡힌 마릿수(이상) (ex: 200이면 200마리 이상)',
         required: true,
         type: 'number'
    } */

  const userDeviceService = new UserDeviceService();
  const deviceService = new DeviceService();

  try {
    const userId: number = response.locals['id'];
    const userLevel: number = response.locals['user_level'];
    const deviceGroupId: number = parseInt(
      request.query.deviceGroupId as string,
    );
    const count: number = parseInt(request.query.count as string);

    let result: any = [];

    if (userLevel === 1) {
      //관리자인 경우.
      const deviceList: Device[] =
        await deviceService.findDeviceAndCount(count);
      result = deviceList.map((device) => ({
        // device_group_id: device.device_group_id,
        device_id: device.id,
        count: device.insect_count,
      }));
    } else {
      const userDeviceList: UserDevice[] =
        await userDeviceService.findUserDeviceByUserIdAndCount(userId, count);
      result = userDeviceList.map((userDevice) => ({
        device_id: userDevice.device!.id!,
        count: userDevice.device!.insect_count,
      }));
    }

    response.status(200).send(result);
  } catch (err) {
    response.status(400).json({
      type: 'error',
      message: 'unknown server error',
    });
  }
});

//장비 현황 요약 정보
/*
router.use('/summary', verifyToken);
router.get('/summary', async (request: Request, response: Response) => {
    // #swagger.tags = ['device']
    // #swagger.summary = '장비 현황 요약 정보 요청'
    // #swagger.path = '/device/summary'
    // #swagger.security = [{bearerAuth: []}]
    /* #swagger.responses[200] = {
         description: '요청 성공',
         content: {
            "application/json": {   
                schema: {$ref: '#/components/schemas/SummarySuccessResponse'}
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
/* #swagger.parameters['deviceGroupId'] = {
         in: 'query',
         description: '장비 그룹 ID (0이면 모든 장비)',
         required: true,
         type: 'number'
    } */
/*
    const userDeviceService = new UserDeviceService();
    const deviceService = new DeviceService();

    try{
        const userId: number = response.locals['id'];
        const userLevel: number = response.locals['user_level'];
        const deviceGroupId: number = parseInt(request.query.deviceGroupId as string);

        let result: any = {
            device_group_id: deviceGroupId,
            device_count: 0,
            online_count: 0,
            offline_count: 0,
            warning_count: 0,
            insect_count: 0,
        };

        if(userLevel === 1) { //관리자인 경우.
            const deviceList: Device[] = await deviceService.findDeviceByGroupId(deviceGroupId);
            result.device_count = deviceList.length;
            const now = new Date();
            deviceList.forEach(device => {
                if (!device.updated_date) {
                    result.offline_count++;
                    return;
                }
                
                const diffMinutes = (now.getTime() - device.updated_date.getTime()) / (1000 * 60);
                
                if (diffMinutes < 6) {
                    result.online_count++;
                } else if (diffMinutes < 10) {
                    result.warning_count++;
                } else {
                    result.offline_count++;
                }
            });
            result.insect_count = deviceList.reduce((acc, curr) => acc + curr.insect_count, 0);
        }else{
            const userDeviceList: UserDevice[] = await userDeviceService.findUserDeviceByUserIdAndGroupId(userId, deviceGroupId);
            result.device_count = userDeviceList.length;
            result.insect_count = userDeviceList.reduce((acc, curr) => acc + curr.device!.insect_count, 0);
        }
        
        response.status(200).json(result);
    }catch(err) {
        response.status(400).json({
            type: 'error',
            token: '',
        });
    }
});
*/

//장비 포충 실적
router.use('/statistics', verifyToken);
router.get('/statistics', async (request: Request, response: Response) => {
  // #swagger.tags = ['device']
  // #swagger.summary = '장비 포충 실적 요청'
  // #swagger.path = '/device/statistics'
  // #swagger.security = [{bearerAuth: []}]
  /* #swagger.responses[200] = {
         description: '요청 성공',
         content: {
            "application/json": {   
                schema: {$ref: '#/components/schemas/StatisticsSuccessResponse'}
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
  /* #swagger.parameters['deviceUUID'] = {
         in: 'query',
         description: '장비 UUID (0이면 UUID 무시)',
         required: true,
         type: 'string'
    } */
  /* #swagger.parameters['type'] = {
         in: 'query',
         description: '타입 (0 - 3개월, 1 - 4주/5주, 2 - 7일, 3 - 24시간)',
         required: true,
         type: 'string'
    } */

  const deviceService = new DeviceService();
  const userDeviceService = new UserDeviceService();
  const collectionService = new CollectionService();

  try {
    const userId: number = response.locals['id'];
    const userLevel: number = response.locals['user_level'];
    const deviceUUID: string = request.query.deviceUUID as string;
    const type: number = parseInt(request.query.type as string);
    // const offset: number = parseInt(request.query.offset as string); // 24시간 데이터에만 해당되며 offset에 따라 전날 혹은 다음날 등의 데이터를 보여줌. (0은 현재)

    let startDate: Date = new Date();
    let endDate: Date = new Date();

    // UTC -> KST 변환 (9시간 추가)
    const kstStartDate = new Date(startDate.getTime() + 9 * 60 * 60 * 1000);
    kstStartDate.setHours(0, 0, 0, 0);

    const kstEndDate = new Date(kstStartDate);
    kstEndDate.setDate(kstEndDate.getDate() + 1); //아래에서 -1밀리초 빼서 전날로 처리되므로 1일 더 더해줌.

    // KST -> UTC 변환 (9시간 차감)
    kstStartDate.setTime(kstStartDate.getTime() - 9 * 60 * 60 * 1000);
    kstEndDate.setTime(kstEndDate.getTime() - 9 * 60 * 60 * 1000 - 1); // UTC 기준으로 변환하고 1밀리초 빼서 전날 23:59:59.999로 설정

    startDate = kstStartDate;
    endDate = kstEndDate;

    const today = new Date();

    // 타입에 따라 날짜 범위 선택.
    if (type === 0) {
      // 현재 달의 1일로 설정
      startDate.setDate(1);
      // 3개월 전으로 설정
      startDate.setMonth(startDate.getMonth() - 2);

      // KST 08:00 = UTC -1시(전일 23:00)
      startDate.setUTCHours(-1, 0, 0, 0);
      endDate.setDate(endDate.getDate() + 1);
      // KST 다음날 07:59 = UTC 당일 22:59
      endDate.setUTCHours(-2, 59, 59, 999);
    } else if (type === 1) {
      // 현재 달의 1일부터 말일까지의 데이터를 가져옴.
      startDate.setDate(1);

      // KST 08:00 = UTC -1시(전일 23:00)
      startDate.setUTCHours(-1, 0, 0, 0);
      endDate.setDate(endDate.getDate() + 1);
      // KST 다음날 07:59 = UTC 당일 22:59
      endDate.setUTCHours(-2, 59, 59, 999);
    } else if (type === 2) {
      // 7일 조회: 현재 월의 현재 주차 (월 1일 기준)
      // KST 기준으로 현재 날짜 계산
      const kstToday = new Date(today.getTime() + 9 * 60 * 60 * 1000);
      const kstYear = kstToday.getUTCFullYear();
      const kstMonth = kstToday.getUTCMonth();
      const kstDay = kstToday.getUTCDate();

      // KST (오늘 - 6일) 08:00 = UTC -1시(전일 23:00) (Date.UTC 일자 자동 롤링 처리)
      startDate = new Date(Date.UTC(kstYear, kstMonth, kstDay - 6, -1, 0, 0, 0));
      // KST 내일 07:59 = UTC 당일 22:59
      endDate = new Date(
        Date.UTC(kstYear, kstMonth, kstDay + 1, -2, 59, 59, 999),
      );

      // 이번 달 1일 기준으로 몇 번째 주차인지 계산
      // const weekNumber = Math.floor((kstDay - 1) / 7); // 0주차, 1주차, ...
      // const weekStartDay = weekNumber * 7 + 1; // 해당 주차의 시작 날짜

      // // 주차 시작일 (예: 1일, 8일, 15일, 22일, 29일) 08:00 (UTC -1시)
      // startDate = new Date(Date.UTC(kstYear, kstMonth, weekStartDay, -1, 0, 0, 0));

      // // 오늘 다음날 07:59 (UTC 당일 22:59)
      // endDate = new Date(Date.UTC(kstYear, kstMonth, kstDay + 1, -2, 59, 59, 999));
    } else if (type === 3) {
      // const currentUTCHour = today.getUTCHours();
      // console.log(currentUTCHour);
      const kstHour = new Date(
        today.getTime() + 9 * 60 * 60 * 1000,
      ).getUTCHours(); // KST시간으로 분기하기 위해 KST (0~23) 계산

      // KST 기준 오늘 날짜 계산
      const kstToday = new Date(today.getTime() + 9 * 60 * 60 * 1000);
      const kstYear = kstToday.getUTCFullYear();
      const kstMonth = kstToday.getUTCMonth();
      const kstDay = kstToday.getUTCDate();

      if (kstHour >= 8) {
        // [KST 08:00 이후]
        // 오늘 08:00 부터 ~ 내일 07:59:59 까지
        // console.log('KST 08:00 이후: 오늘 08:00 -> 내일 07:59');
        startDate = new Date(Date.UTC(kstYear, kstMonth, kstDay, -1, 0, 0, 0)); // KST 오늘 08:00 = UTC -1시
        endDate = new Date(
          Date.UTC(kstYear, kstMonth, kstDay + 1, -2, 59, 59, 999),
        ); // KST 내일 07:59 = UTC 당일 22:59
      } else {
        // [KST 08:00 이전]
        // 어제 08:00 부터 ~ 오늘 07:59:59 까지
        // console.log('KST 08:00 이전: 어제 08:00 -> 오늘 07:59');
        startDate = new Date(
          Date.UTC(kstYear, kstMonth, kstDay - 1, -1, 0, 0, 0),
        ); // KST 어제 08:00 = UTC -1시
        endDate = new Date(Date.UTC(kstYear, kstMonth, kstDay, -2, 59, 59, 999)); // KST 오늘 07:59 = UTC -2시
      }
    }

    console.log(
      `current : ${today.toISOString()}, startDate : ${startDate.toISOString()}, endDate : ${endDate.toISOString()}`,
    );
    // 권한이 있는 장비 목록 선별.
    let deviceList: Device[] = [];
    const deviceIds: number[] = [];
    if (userLevel === 1) {
      //관리자인 경우.
      deviceList = await deviceService.findAll();
      deviceList = deviceList.filter(
        (device) => deviceUUID === '' || device.device_uuid === deviceUUID,
      );
    } else {
      const userDevices: UserDevice[] =
        await userDeviceService.findAllUserDevicesByUserId(userId);
      deviceList = userDevices.map((userDevice) => userDevice.device!);
      deviceList = deviceList.filter(
        (device) => deviceUUID === '' || device.device_uuid === deviceUUID,
      );
    }

    for (const device of deviceList) {
      deviceIds.push(device.id!);
    }
    let collectionList: InsectHistory[] =
      await collectionService.findByDate(startDate, endDate, deviceIds);

    // 타입별로 데이터 정리
    if (type === 0 || type === 1 || type === 2) {
      // 월별/현재달/주별 - 일자별 합산
      const dailyData = new Map<
        string,
        {
          lastHistory: InsectHistory;
          totalCount: number;
          dayKey: string;
        }
      >();

      collectionList.forEach((history) => {
        const utcDate = new Date(history.created_date);
        const kstDate = new Date(utcDate.getTime() + 9 * 60 * 60 * 1000);
        const kstHour = kstDate.getUTCHours(); // KST 시간

        let checkDate = new Date(kstDate);
        let dayKey = '';

        if (utcDate.getHours() < 8) {
          utcDate.setDate(utcDate.getDate() - 1);
        }

        // (8시~익일7시59분)
        if (kstHour >= 8) {
          dayKey = checkDate.toISOString().slice(0, 10);
        } else if (kstHour < 8) {
          checkDate.setUTCDate(checkDate.getUTCDate() - 1);
          dayKey = checkDate.toISOString().slice(0, 10);
        } else {
          return; // 낮 데이터 제외
        }

        // 데이터 확인용 콘솔
        // const kstStr = kstDate.toISOString().replace('T', ' ').slice(0, 19);
        // console.log(`UUID: ${history.device_uuid} | KST: ${kstStr} | Key: ${dayKey} | Count: ${history.count}`);

        const compositeKey = `${history.device_uuid}-${dayKey}`;

        const existing = dailyData.get(compositeKey);

        if (!existing) {
          dailyData.set(compositeKey, {
            lastHistory: history,
            totalCount: history.count,
            dayKey: dayKey,
          });
        } else {
          // 같은 날짜의 경우 시간이 더 늦은 데이터로 업데이트
          if (existing.lastHistory.created_date < history.created_date) {
            existing.lastHistory = history;
            existing.totalCount = history.count;
          }
        }
      });

      // 각 날짜별 마지막 데이터에 합산된 카운트 적용
      collectionList = Array.from(dailyData.values()).map((data) => {
        // backend에선 dayKey로 종합했지만 front에선 created_date로 구분하기 때문에 종합한 키로 date를 넣어준다.
        return {
          ...data.lastHistory,
          created_date: new Date(`${data.dayKey}T00:00:00Z`),
          count: data.totalCount,
        };
      });
    } else if (type === 3) {
      // 하루 - 시간별
      const hourlyData = new Map<string, InsectHistory>();
      collectionList.forEach((history) => {
        const hourKey = history.created_date.toISOString().slice(0, 13); // YYYY-MM-DDTHH
        const compositeHourKey = `${history.device_uuid}-${hourKey}`;
        const existingEntry = hourlyData.get(compositeHourKey);
        if (
          !existingEntry ||
          existingEntry.created_date < history.created_date
        ) {
          hourlyData.set(compositeHourKey, history);
        }
      });
      collectionList = Array.from(hourlyData.values());
    }
    response.status(200).json(collectionList);
  } catch (err) {
    response.status(400).json({
      type: 'error',
      message: 'unknown server error',
    });
  }
});

//장비 포충 실적 쿼리 받는 형태
router.use('/statisticsByDate', verifyToken);
router.get(
  '/statisticsByDate',
  async (request: Request, response: Response) => {
    // #swagger.tags = ['device']
    // #swagger.summary = '장비 포충 실적 쿼리문 요청'
    // #swagger.path = '/device/statisticsByDate'
    // #swagger.security = [{bearerAuth: []}]
    /* #swagger.responses[200] = {
         description: '요청 성공',
         content: {
            "application/json": {   
                schema: {$ref: '#/components/schemas/StatisticsSuccessResponse'}
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
    /* #swagger.parameters['deviceUUID'] = {
         in: 'query',
         description: '장비 UUID (0이면 UUID 무시)',
         required: true,
         type: 'string'
    } */
    /* #swagger.parameters['startDateTime'] = {
         in: 'query',
         description: '필수 요청 시작 날짜-시간 (ISO 8601 형식 권장, ex: 2024-01-01T00:00:00Z)',
         required: true, 
         type: 'string'
    } */
    /* #swagger.parameters['endDateTime'] = {
         in: 'query',
         description: '필수 요청 종료 날짜-시간 (ISO 8601 형식 권장, ex: 2025-10-11T23:59:59Z)',
         required: true, 
         type: 'string'
    } */
    /* #swagger.parameters['address_sido'] = {
        in: 'query',
        description: '시/도 필터 (빈 문자열시 무시)',
        required: false,
        type: 'string'
    } */
    /* #swagger.parameters['address_gungu'] = {
        in: 'query',
        description: '군/구 필터 (빈 문자열시 무시)',
        required: false,
        type: 'string'
    } */
    /* #swagger.parameters['address_dong'] = {
        in: 'query',
        description: '동/읍/면 필터 (빈 문자열시 무시)',
        required: false,
        type: 'string'
    } */
    /* #swagger.parameters['aggregation'] = {
        in: 'query',
        description: '데이터 집계 방식 ("day": KST 일별 최종값, "raw": 원본 전체 기록)',
        required: false,
        type: 'string'
    } */

    const deviceService = new DeviceService();
    const userDeviceService = new UserDeviceService();
    const collectionService = new CollectionService();

    try {
      const userId: number = response.locals['id'];
      const userLevel: number = response.locals['user_level'];
      const deviceUUID: string = (request.query.deviceUUID as string) || '0';
      const addressSido: string = (request.query.address_sido as string) || '';
      const addressGungu: string =
        (request.query.address_gungu as string) || '';
      const addressDong: string = (request.query.address_dong as string) || '';
      const aggregation: string =
        (request.query.aggregation as string) || 'day';

      const startDateTimeStr: string | undefined = request.query
        .startDateTime as string;
      const endDateTimeStr: string | undefined = request.query
        .endDateTime as string;

      if (!startDateTimeStr || !endDateTimeStr) {
        return response.status(400).json({
          type: 'error',
          message:
            'startDateTime and endDateTime query parameters are required.',
        });
      } // --- [수정된 부분] KST 시간 설정 로직 시작 --- // 쿼리 파라미터의 시간을 KST로 가정하고 Date 객체를 생성

      let startDate = new Date(startDateTimeStr);
      let endDate = new Date(endDateTimeStr);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return response.status(400).json({
          type: 'error',
          message: 'Invalid startDateTime or endDateTime format.',
        });
      }

      if (startDate > endDate) {
        return response.status(400).json({
          type: 'error',
          message: 'startDateTime cannot be later than endDateTime.',
        });
      }

      // console.log('[statisticsByDate] 수신한 날짜·시간 (파싱 직후)', {
      //   집계방식: aggregation,
      //   쿼리시작: startDateTimeStr,
      //   쿼리종료: endDateTimeStr,
      //   파싱시작UTC: startDate.toISOString(),
      //   파싱종료UTC: endDate.toISOString(),
      // });

      // day 집계만 KST 영업일 창으로 보정. raw는 클라이언트가 보낸 구간(UTC) 그대로 조회
      if (aggregation !== 'raw') {
        const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

        // 1. 받은 UTC 시간을 KST 기준으로 날짜를 복원
        // 예: '2024-12-31T15:00Z' -> '2025-01-01T00:00Z'
        const correctedStartDate = new Date(
          startDate.getTime() + KST_OFFSET_MS,
        );
        const correctedEndDate = new Date(endDate.getTime() + KST_OFFSET_MS);

        // 2. 복원된 날짜를 기준으로 UTC 시간을 설정 (서버 시간대 영향 없음)
        // 시작일: KST 08:00 (UTC -1시)
        correctedStartDate.setUTCHours(-1, 0, 0, 0);

        // 종료일: KST 다음날 07:59 (UTC +1일 -2시)
        correctedEndDate.setUTCDate(correctedEndDate.getUTCDate() + 1);
        correctedEndDate.setUTCHours(-2, 59, 59, 999);

        startDate = correctedStartDate;
        endDate = correctedEndDate;

        console.log(
          `statisticsByDate current : ${new Date().toISOString()}, startDate : ${startDate.toISOString()}, endDate : ${endDate.toISOString()}`,
        );

        // console.log('[statisticsByDate] KST 일 단위 보정 후 조회 범위', {
        //   보정후시작UTC: startDate.toISOString(),
        //   보정후종료UTC: endDate.toISOString(),
        // });
      } else {
        console.log(
          `statisticsByDate current : ${new Date().toISOString()}, startDate : ${startDate.toISOString()}, endDate : ${endDate.toISOString()}`,
        );
        // console.log('[statisticsByDate] raw — 보정 없이 조회 구간', {
        //   조회시작UTC: startDate.toISOString(),
        //   조회종료UTC: endDate.toISOString(),
        // });
      }

      let deviceList: Device[] = [];
      if (userLevel === 1) {
        deviceList = await deviceService.findAll();
      } else {
        const userDevices: UserDevice[] =
          await userDeviceService.findAllUserDevicesByUserId(userId);
        deviceList = userDevices.map((userDevice) => userDevice.device!);
      } // --- 2. 쿼리 파라미터로 장비 필터링 ---

      let filteredDeviceList = deviceList;
      if (deviceUUID && deviceUUID !== '0') {
        filteredDeviceList = filteredDeviceList.filter(
          (device) => device.device_uuid === deviceUUID,
        );
      }
      if (addressSido) {
        filteredDeviceList = filteredDeviceList.filter(
          (device) => device.address_sido === addressSido,
        );
      }
      if (addressGungu) {
        filteredDeviceList = filteredDeviceList.filter(
          (device) => device.address_gungu === addressGungu,
        );
      }
      if (addressDong) {
        filteredDeviceList = filteredDeviceList.filter(
          (device) => device.address_dong === addressDong,
        );
      } // --- 3. 최종 필터링된 장비 ID 추출 ---

      const deviceIds: number[] = filteredDeviceList.map(
        (device) => device.id!,
      );
      if (deviceIds.length === 0) {
        return response.status(200).json([]);
      } // --- 4. 필터링된 장비의 원본 포충 데이터 조회 ---

      const collectionList: InsectHistory[] =
        await collectionService.findByDate(startDate, endDate, deviceIds); // --- 5. 데이터 가공 (aggregation 옵션에 따라 분기) ---

      let finalCollectionList: InsectHistory[];

      if (aggregation === 'raw') {
        finalCollectionList = collectionList;
      } else {
        // 'day' 집계 로직
        const dailyLastEntryMap = new Map<
          string,
          InsectHistory & { targetKey: string }
        >();
        const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

        const oneDay = 24 * 60 * 60 * 1000;
        const isDayRequest = endDate.getTime() - startDate.getTime() < oneDay;

        collectionList.forEach((history) => {
          const kstDate = new Date(
            history.created_date.getTime() + KST_OFFSET_MS,
          );
          const kstHour = kstDate.getUTCHours();
          let dayKey = '';

          // 당일 8시 ~ 익일 오전 07:59 까지 포함
          if (kstHour >= 8) {
            // 당일 08:00 ~ 23:59
            dayKey = kstDate.toISOString().slice(0, 10);
          } else if (kstHour < 8) {
            // 익일 00:00 ~ 07:59 -> 전날 날짜로 편입
            const checkDate = new Date(kstDate);
            checkDate.setUTCDate(checkDate.getUTCDate() - 1);
            dayKey = checkDate.toISOString().slice(0, 10);
          } else {
            // 낮 데이터는 기존 기능 유지 여부와 상관없이 사용자 기준에 따라 제외
            return;
          }

          // 데이터 확인용 콘솔
          // const kstStr = kstDate.toISOString().replace('T', ' ').slice(0, 19);
          // console.log(`UUID: ${history.device_uuid} | KST: ${kstStr} | Key: ${dayKey} | Count: ${history.count}`);

          // 기존 로직의 compositeKey 생성 방식 유지 (시간별 보기 대응)
          let compositeKey: string;
          if (isDayRequest) {
            // 24시간 미만 요청 시 시간별 데이터 보존 (YYYY-MM-DDTHH)
            const hourKey = history.created_date.toISOString().slice(0, 13);
            compositeKey = `${history.device_uuid}-${dayKey}-${hourKey}`;
          } else {
            // 일별 보기
            compositeKey = `${history.device_uuid}-${dayKey}`;
          }

          const existingEntry = dailyLastEntryMap.get(compositeKey);

          // 최신 데이터로 업데이트
          if (
            !existingEntry ||
            existingEntry.created_date < history.created_date
          ) {
            dailyLastEntryMap.set(compositeKey, {
              ...history,
              targetKey: dayKey, // 판정된 날짜 보관
            });
          }
        });

        // 최종 결과 생성
        finalCollectionList = Array.from(dailyLastEntryMap.values()).map(
          (item) => {
            const { targetKey, ...history } = item;

            // 일별 보기일 때만 프론트엔드 표 동기화를 위해 created_date를 판정 날짜로 치환
            // 시간별 보기(isDayRequest)일 때는 원본 시간을 유지하는 것이 차트 표시에 유리함
            const finalDate = isDayRequest
              ? history.created_date
              : new Date(`${targetKey}T00:00:00Z`);

            return {
              ...history,
              created_date: finalDate,
              count: history.count,
            };
          },
        );
      }
      response.status(200).json(finalCollectionList);
    } catch (err) {
      console.error(err);
      response.status(500).json({
        type: 'error',
        message: 'An error occurred while processing the request.',
      });
    }
  },
);

// Raw 포충 실적 단건 수정
router.use('/rawCollection', verifyToken);
router.put('/rawCollection', async (request: Request, response: Response) => {
  try {
    const id: number = request.body.id;
    const historyCount: number = request.body.count;
    const collectionService = new CollectionService();
    const updated = await collectionService.updateCount(
      id,
      historyCount,
    );
    return response.status(200).json(updated);
  } catch (err) {
    console.error(err);
    return response
      .status(500)
      .json({ type: 'error', message: 'An error occurred while updating.' });
  }
});

// Raw 포충 실적 일괄 수정
router.use('/rawCollectionBulk', verifyToken);
router.post(
  '/rawCollectionBulk',
  async (request: Request, response: Response) => {
    try {
      const startDateTime: string = request.body.startDateTime;
      const endDateTime: string = request.body.endDateTime;
      const historyCount: number = request.body.count;
      const deviceUUID: string | undefined = request.body.deviceUUID;
      const startDate: Date = new Date(startDateTime);
      const endDate: Date = new Date(endDateTime);
      // console.log('[rawCollectionBulk] 수신한 날짜·시간', {
      //   바디시작: startDateTime,
      //   바디종료: endDateTime,
      //   파싱시작UTC: startDate.toISOString(),
      //   파싱종료UTC: endDate.toISOString(),
      //   포충실적값: mosquitoCount,
      // });
      const collectionService = new CollectionService();
      const result = await collectionService.updateManyCountByDateRange(
        startDate,
        endDate,
        historyCount,
        deviceUUID,
      );
      return response.status(200).json({ count: result.count });
    } catch (err) {
      console.error(err);
      return response.status(500).json({
        type: 'error',
        message: 'An error occurred while bulk updating.',
      });
    }
  },
);

router.use('/control', verifyToken);
router.post('/control', async (request: Request, response: Response) => {
  // #swagger.tags = ['device']
  // #swagger.summary = '장비 제어'
  // #swagger.path = '/device/control'
  // #swagger.security = [{bearerAuth: []}]
  /* #swagger.responses[200] = {
         description: '요청 성공',
         content: {
            "application/json": {   
                schema: {$ref: '#/components/schemas/ControlSuccessResponse'}
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
  /* #swagger.requestBody = {
        required: true,
        content: {
            "application/json": {
                schema: {
                    type: "object",
                    properties: {
                        deviceUUIDs: {
                            type: "array",
                            items: { "type": "string" }
                            description: "장비 UUID 목록(비어있으면 무시)"
                        },  
                        control: {
                            type: "string",
                            description: "제어 명령 (server_time - 서버 시간 전달, on_time - 켜짐 시간 설정, factory_reset - 공장 초기화, count_reset - 포집수 초기화 요청, mode - 현재 모드 상태 전송 0: OFF모드, 1: ON 모드, 2: 일반 모드)"
                        },
                        value: {
                            type: "string",
                            description: "제어 값\n" +
                                "- server_time: 2025-01-01 00:00:00 (서버 시간 전달)\n" +
                                "- on_time: 10:00~12:00 \n" + 
                                "- co2_on_time: 10:00~12:00 \n" + 
                                "- co2_period: 5 (분 단위로 설정)\n" + 
                                "- factory_reset: value 값 없음\n" +
                                "- count_reset: value 값 없음" +
                                "- mode: 0"
                        },
                    },
                    required: ["deviceUUIDs", "control"]
                },
                example: {
                    "deviceUUIDs": ['1','2'],
                    "control": "co2_period",
                    "value": "5"
                }
            }
        }
    } */

  // console.log('--- 컨트롤 제어 시작 ---');
  // console.log('요청 Body:', request.body);
  // console.log('------------------------------------');

  const deviceService = new DeviceService();
  const userDeviceService = new UserDeviceService();
  const mqttService = MQTTService.getInstance();
  mqttService.connect();

  const userId: number = response.locals['id'];
  const userLevel: number = response.locals['user_level'];
  const deviceUUIDs: string[] = request.body.deviceUUIDs;
  const control: string = request.body.control;
  const value: string = request.body.value;

  // const targetUUIDList: string[] = [];

  try {
    let targetUUIDList: string[] = [];

    // 컨트롤할 장비 목록을 선별
    if (userLevel === 1) {
      // 관리자인 경우
      targetUUIDList = deviceUUIDs; // 요청받은 UUID 목록을 그대로 사용
    } else {
      // 일반 사용자인 경우
      // 사용자가 소유한 장비 목록 조회
      const userDeviceList: UserDevice[] =
        await userDeviceService.findAllUserDevicesByUserId(userId);

      const ownedUUIDs: string[] = userDeviceList.map((ud) => ud.device_uuid);

      // .includes를 사용하여 소유한 장비만 필터링
      targetUUIDList = deviceUUIDs.filter((uuid) => ownedUUIDs.includes(uuid));
    }

    const devicesToControl =
      await deviceService.findDevicesByUUIDs(targetUUIDList);

    for (const device of devicesToControl) {
      // const device = await deviceService.findDeviceByDeviceUUID(targetUUID);
      if (device === null) {
        response.status(400).json({
          type: 'error',
          message: 'not exists device',
        });
      }

      //컨트롤 명령을 수행한다.
      let data = undefined;

      /*
      if(control === 'fan') {
          if(value === 'on') {
              data = {
                  type: 'fan',
                  value: 'on'
              };
          }else{
              data = {
                  type: 'fan',
                  value: 'off'
              };
          }
      }else*/ if (control === 'server_time') {
        console.log('server_time_value : ', value);
        const server_time = dayjs()
          .tz('Asia/Seoul')
          .format('YYYY-MM-DD HH:mm:ss');
        data = {
          type: 'server_time',
          value: server_time,
        };
        console.log('server_time(web) : ', server_time);
      } else if (control === 'on_time') {
        if (value !== '') {
          data = {
            type: 'on_time',
            value: value,
          };

          // DB에도 저장한다.
          device!.on_time = value;
          await deviceService.update(device!.id!, device!);
        }
      } else if (control === 'co2_time') {
        if (value !== '') {
          data = {
            type: 'co2_time',
            value: value,
          };

          // DB에도 저장한다.
          device!.co2_on_time = value.split(',')[0];
          device!.co2_period = parseInt(value.split(',')[1]);
          await deviceService.update(device!.id!, device!);
        }
      } else if (control === 'factory_reset') {
        data = {
          type: 'factory_reset',
          value: 'on',
        };
      } else if (control === 'count_reset') {
        data = {
          type: 'count_reset',
          value: 'on',
        };
      } else if (control === 'mode') {
        // off, on, normal을 장비 프로토콜 0,1,2로 변환
        let modeValue = 0; // 기본 OFF
        if (value === 'on') modeValue = 1;
        else if (value === 'normal') modeValue = 2;

        data = {
          type: 'mode', // 장비가 인식할 명령 타입
          value: modeValue, // 0,1,2 중 하나
        };
        device!.mode = modeValue;
        await deviceService.update(device!.id!, device!);
      } /*else if(control === 'gps') {
          data = {
              type: 'gps',
              value: 'on'
          };
      }*/
      await mqttService.sendMessage(device!.device_usim!, JSON.stringify(data)); //자동 연결 끊기 처리
    }

    response.status(200).json({
      status: 'success',
    });
  } catch (err) {
    response.status(400).json({
      type: 'error',
      message: 'unknown server error',
    });
  }
});

// [신규] 장비 다중 삭제 엔드포인트
router.use('/deleteDevices', verifyToken);
router.post('/deleteDevices', async (request: Request, response: Response) => {
  // #swagger.tags = ['device']
  // #swagger.summary = '장비 다중 삭제 (관리자)'
  // #swagger.path = '/device/deleteDevices'
  // #swagger.security = [{bearerAuth: []}]
  /* #swagger.responses[200] = {
         description: '요청 성공',
         content: { "application/json": { schema: { $ref: '#/components/schemas/ControlSuccessResponse' } } }
     } */
  /* #swagger.responses[400] = {
         description: '요청 실패',
         content: { "application/json": { schema: { $ref: '#/components/schemas/GeneralFailedResponse' } } }
     } */
  /* #swagger.responses[403] = {
         description: '권한 없음',
         content: { "application/json": { schema: { $ref: '#/components/schemas/GeneralFailedResponse' } } }
     } */
  /* #swagger.requestBody = {
        required: true,
        content: {
            "application/json": {
                schema: {
                    type: "object",
                    properties: {
                        deviceUUIDs: {
                            type: "array",
                            items: { "type": "string" },
                            description: "삭제할 장비 UUID 목록"
                        },  
                    },
                    required: ["deviceUUIDs"]
                },
                example: {
                    "deviceUUIDs": ['uuid1','uuid2']
                }
            }
        }
    } */

  const deviceService = new DeviceService();
  const deviceSettingService = new DeviceSettingService();
  const userDeviceService = new UserDeviceService();

  try {
    const userLevel: number = response.locals['user_level'];
    const deviceUUIDs: string[] = request.body.deviceUUIDs;

    // 1. 관리자 권한 확인
    if (userLevel !== 1) {
      return response.status(403).json({
        type: 'error',
        message: 'Permission denied. Admin level required.',
      });
    }

    // 2. Body 유효성 검사
    if (!Array.isArray(deviceUUIDs) || deviceUUIDs.length === 0) {
      return response.status(400).json({
        type: 'error',
        message: 'deviceUUIDs must be a non-empty array.',
      });
    }

    const targetUUIDList = deviceUUIDs;

    // 3. 삭제 로직 수행
    for (const uuid of targetUUIDList) {
      const device = await deviceService.findDeviceByDeviceUUID(uuid);
      if (device && device.id) {
        // UserDevice 삭제
        await userDeviceService.deleteUserDeviceByUUID(uuid);
        // DeviceSetting 삭제
        await deviceSettingService.deleteBySettings(device.id!);
        // Device 삭제 (마지막)
        await deviceService.deleteByUUID(uuid);
      } else {
        console.error(`Device not found for UUID: ${uuid}, skipping delete.`);
      }
    }

    response.status(200).json({
      status: 'success',
      message: `${targetUUIDList.length} devices processed for deletion.`,
    });
  } catch (err) {
    response.status(400).json({
      type: 'error',
      message: 'unknown server error',
    });
  }
});

export default router;
