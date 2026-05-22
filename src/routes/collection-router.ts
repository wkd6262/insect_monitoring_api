import { Router, Request, Response } from 'express';
import { verifyToken } from '../authorization';
import { CollectionService } from '../services/collection-service';
import { StatisticsService } from '../services/statistics-service';
import { CollectionHistory } from '../models/collectionHistory';
import { Statistics } from '../models/statistics';

const router = Router();

router.use('/list', verifyToken);
router.get('/list', async (request: Request, response: Response) => {
  // #swagger.tags = ['collection']
  // #swagger.path = '/collection/list'
  // #swagger.security = [{bearerAuth: []}]
  // #swagger.summary = '채집 이력 목록 (관리자)'
  /* #swagger.parameters['page'] = { in: 'query', type: 'integer' } */
  /* #swagger.parameters['count'] = { in: 'query', type: 'integer' } */
  /* #swagger.responses[200] = {
       description: '성공',
       content: { 'application/json': { schema: { $ref: '#/components/schemas/CollectionHistoryListResponse' } } }
     } */
  /* #swagger.responses[400] = {
       description: '실패',
       content: { 'application/json': { schema: { $ref: '#/components/schemas/GeneralFailedResponse' } } }
     } */
  const collectionService = new CollectionService();
  try {
    const userLevel: number = response.locals['user_level'];
    if (userLevel === 0) {
      response.status(400).json({ type: 'error', message: 'not admin level' });
      return;
    }

    const page = parseInt((request.query.page as string) || '1', 10);
    const count = parseInt((request.query.count as string) || '20', 10);
    const list = await collectionService.find(page, count);
    response.status(200).json(list);
  } catch (err) {
    response.status(400).json({ type: 'error', message: 'unknown server error' });
  }
});

router.get('/map', async (request: Request, response: Response) => {
  // #swagger.tags = ['collection']
  // #swagger.path = '/collection/map'
  // #swagger.summary = '지도용 채집 이력 (공개)'
  /* #swagger.parameters['address_sido'] = { in: 'query', type: 'string' } */
  /* #swagger.parameters['address_gungu'] = { in: 'query', type: 'string' } */
  /* #swagger.parameters['address_dong'] = { in: 'query', type: 'string' } */
  /* #swagger.responses[200] = {
       description: '성공',
       content: { 'application/json': { schema: { $ref: '#/components/schemas/CollectionHistoryListResponse' } } }
     } */
  /* #swagger.responses[400] = {
       description: '실패',
       content: { 'application/json': { schema: { $ref: '#/components/schemas/GeneralFailedResponse' } } }
     } */
  const collectionService = new CollectionService();
  try {
    const addressSido = (request.query.address_sido as string) || '';
    const addressGungu = (request.query.address_gungu as string) || '';
    const addressDong = (request.query.address_dong as string) || '';
    const list = await collectionService.findMapList(
      addressSido,
      addressGungu,
      addressDong,
    );
    response.status(200).json(list);
  } catch (err) {
    response.status(400).json({ type: 'error', message: 'unknown server error' });
  }
});

router.use('/detail', verifyToken);
router.get('/detail', async (request: Request, response: Response) => {
  // #swagger.tags = ['collection']
  // #swagger.path = '/collection/detail'
  // #swagger.security = [{bearerAuth: []}]
  // #swagger.summary = '채집 이력 상세'
  /* #swagger.parameters['id'] = { in: 'query', required: true, type: 'integer' } */
  /* #swagger.responses[200] = {
       description: '성공',
       content: { 'application/json': { schema: { $ref: '#/components/schemas/CollectionHistory' } } }
     } */
  /* #swagger.responses[400] = {
       description: '실패',
       content: { 'application/json': { schema: { $ref: '#/components/schemas/GeneralFailedResponse' } } }
     } */
  const collectionService = new CollectionService();
  try {
    const id = parseInt(request.query.id as string, 10);
    const item = await collectionService.findById(id);
    if (item === null) {
      response.status(400).json({ type: 'error', message: 'not exists history' });
      return;
    }
    response.status(200).json(item);
  } catch (err) {
    response.status(400).json({ type: 'error', message: 'unknown server error' });
  }
});

router.post('/register', async (request: Request, response: Response) => {
  // #swagger.tags = ['collection']
  // #swagger.path = '/collection/register'
  // #swagger.summary = '채집 이력 등록 (공개)'
  /* #swagger.requestBody = {
       required: true,
       content: {
         'application/json': {
           schema: {
             type: 'object',
             required: ['insect_name', 'address_sido', 'address_gungu', 'address_dong', 'latitude', 'longitude', 'collect_count', 'collect_count_min', 'status'],
             properties: {
               device_id: { type: 'integer', nullable: true },
               insect_name: { type: 'string' },
               image_file: { type: 'string' },
               address_sido: { type: 'string' },
               address_gungu: { type: 'string' },
               address_dong: { type: 'string' },
               address_detail: { type: 'string' },
               latitude: { type: 'number' },
               longitude: { type: 'number' },
               collect_count: { type: 'integer' },
               collect_count_min: { type: 'integer' },
               collect_count_max: { type: 'integer', nullable: true },
               status: { type: 'string', description: 'good | normal | warning | bad' },
               memo: { type: 'string' },
               created_date: { type: 'string', format: 'date-time' }
             }
           }
         }
       }
     } */
  /* #swagger.responses[200] = {
       description: '성공',
       content: { 'application/json': { schema: { $ref: '#/components/schemas/CollectionHistory' } } }
     } */
  /* #swagger.responses[400] = {
       description: '실패',
       content: { 'application/json': { schema: { $ref: '#/components/schemas/GeneralFailedResponse' } } }
     } */
  const collectionService = new CollectionService();
  try {
    const data: CollectionHistory = {
      device_id: request.body.device_id ?? null,
      insect_name: request.body.insect_name,
      image_file: request.body.image_file ?? '',
      address_sido: request.body.address_sido,
      address_gungu: request.body.address_gungu,
      address_dong: request.body.address_dong,
      address_detail: request.body.address_detail ?? '',
      latitude: request.body.latitude,
      longitude: request.body.longitude,
      collect_count: request.body.collect_count,
      collect_count_min: request.body.collect_count_min,
      collect_count_max: request.body.collect_count_max ?? null,
      status: request.body.status,
      memo: request.body.memo ?? '',
      created_date: request.body.created_date
        ? new Date(request.body.created_date)
        : new Date(),
    };

    const created = await collectionService.register(data);

    const counts = await collectionService.countByStatus();
    const statisticsService = new StatisticsService();
    const existingStats = await statisticsService.findFirst();
    const statsPayload: Statistics = {
      good_count: counts.good_count,
      normal_count: counts.normal_count,
      warning_count: counts.warning_count,
      bad_count: counts.bad_count,
    };
    if (existingStats?.id) {
      await statisticsService.update(existingStats.id, statsPayload);
    } else {
      await statisticsService.create(statsPayload);
    }

    response.status(200).json(created);
  } catch (err) {
    response.status(400).json({ type: 'error', message: 'unknown server error' });
  }
});

router.use('/update', verifyToken);
router.put('/update', async (request: Request, response: Response) => {
  // #swagger.tags = ['collection']
  // #swagger.path = '/collection/update'
  // #swagger.security = [{bearerAuth: []}]
  // #swagger.summary = '채집 이력 수정 (관리자)'
  /* #swagger.requestBody = {
       required: true,
       content: {
         'application/json': {
           schema: {
             type: 'object',
             required: ['id'],
             properties: {
               id: { type: 'integer' },
               device_id: { type: 'integer', nullable: true },
               insect_name: { type: 'string' },
               image_file: { type: 'string' },
               address_sido: { type: 'string' },
               address_gungu: { type: 'string' },
               address_dong: { type: 'string' },
               address_detail: { type: 'string' },
               latitude: { type: 'number' },
               longitude: { type: 'number' },
               collect_count: { type: 'integer' },
               collect_count_min: { type: 'integer' },
               collect_count_max: { type: 'integer', nullable: true },
               status: { type: 'string' },
               memo: { type: 'string' }
             }
           }
         }
       }
     } */
  /* #swagger.responses[200] = {
       description: '성공',
       content: { 'application/json': { schema: { $ref: '#/components/schemas/CollectionHistory' } } }
     } */
  /* #swagger.responses[400] = {
       description: '실패',
       content: { 'application/json': { schema: { $ref: '#/components/schemas/GeneralFailedResponse' } } }
     } */
  const collectionService = new CollectionService();
  try {
    const userLevel: number = response.locals['user_level'];
    if (userLevel === 0) {
      response.status(400).json({ type: 'error', message: 'not admin level' });
      return;
    }

    const id = request.body.id as number;
    const existing = await collectionService.findById(id);
    if (existing === null) {
      response.status(400).json({ type: 'error', message: 'not exists history' });
      return;
    }

    const data: CollectionHistory = {
      device_id: request.body.device_id ?? existing.device_id,
      insect_name: request.body.insect_name ?? existing.insect_name,
      image_file: request.body.image_file ?? existing.image_file,
      address_sido: request.body.address_sido ?? existing.address_sido,
      address_gungu: request.body.address_gungu ?? existing.address_gungu,
      address_dong: request.body.address_dong ?? existing.address_dong,
      address_detail: request.body.address_detail ?? existing.address_detail,
      latitude: request.body.latitude ?? existing.latitude,
      longitude: request.body.longitude ?? existing.longitude,
      collect_count: request.body.collect_count ?? existing.collect_count,
      collect_count_min: request.body.collect_count_min ?? existing.collect_count_min,
      collect_count_max: request.body.collect_count_max ?? existing.collect_count_max,
      status: request.body.status ?? existing.status,
      memo: request.body.memo ?? existing.memo,
    };

    const updated = await collectionService.update(id, data);
    response.status(200).json(updated);
  } catch (err) {
    response.status(400).json({ type: 'error', message: 'unknown server error' });
  }
});

router.use('/delete', verifyToken);
router.delete('/delete', async (request: Request, response: Response) => {
  // #swagger.tags = ['collection']
  // #swagger.path = '/collection/delete'
  // #swagger.security = [{bearerAuth: []}]
  // #swagger.summary = '채집 이력 삭제 (관리자)'
  /* #swagger.requestBody = {
       required: true,
       content: {
         'application/json': {
           schema: {
             type: 'object',
             required: ['id'],
             properties: { id: { type: 'integer' } }
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
  const collectionService = new CollectionService();
  try {
    const userLevel: number = response.locals['user_level'];
    if (userLevel === 0) {
      response.status(400).json({ type: 'error', message: 'not admin level' });
      return;
    }

    const id = request.body.id as number;
    await collectionService.delete(id);

    const counts = await collectionService.countByStatus();
    const statisticsService = new StatisticsService();
    const existingStats = await statisticsService.findFirst();
    const statsPayload: Statistics = {
      good_count: counts.good_count,
      normal_count: counts.normal_count,
      warning_count: counts.warning_count,
      bad_count: counts.bad_count,
    };
    if (existingStats?.id) {
      await statisticsService.update(existingStats.id, statsPayload);
    } else {
      await statisticsService.create(statsPayload);
    }

    response.status(200).json({ type: 'success', message: 'success' });
  } catch (err) {
    response.status(400).json({ type: 'error', message: 'unknown server error' });
  }
});

export default router;
