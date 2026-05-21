import { Router, Request, Response } from 'express';
import { verifyToken } from '../authorization';
import { StatisticsService } from '../services/statistics-service';
import { CollectionService } from '../services/collection-service';
import { Statistics } from '../models/statistics';

const router = Router();

router.use('/summary', verifyToken);
router.get('/summary', async (request: Request, response: Response) => {
  // #swagger.tags = ['statistics']
  // #swagger.path = '/statistics/summary'
  // #swagger.security = [{bearerAuth: []}]
  // #swagger.summary = '상태별 집계 요약'
  /* #swagger.responses[200] = {
       description: '성공',
       content: { 'application/json': { schema: { $ref: '#/components/schemas/StatisticsSummaryResponse' } } }
     } */
  /* #swagger.responses[400] = {
       description: '실패',
       content: { 'application/json': { schema: { $ref: '#/components/schemas/GeneralFailedResponse' } } }
     } */
  const statisticsService = new StatisticsService();
  try {
    const stats = await statisticsService.findFirst();
    if (stats === null) {
      response.status(400).json({ type: 'error', message: 'not exists statistics' });
      return;
    }
    response.status(200).json(stats);
  } catch (err) {
    response.status(400).json({ type: 'error', message: 'unknown server error' });
  }
});

router.use('/refresh', verifyToken);
router.post('/refresh', async (request: Request, response: Response) => {
  // #swagger.tags = ['statistics']
  // #swagger.path = '/statistics/refresh'
  // #swagger.security = [{bearerAuth: []}]
  // #swagger.summary = '집계 재계산 (관리자)'
  /* #swagger.responses[200] = {
       description: '성공',
       content: { 'application/json': { schema: { $ref: '#/components/schemas/StatisticsSummaryResponse' } } }
     } */
  /* #swagger.responses[400] = {
       description: '실패',
       content: { 'application/json': { schema: { $ref: '#/components/schemas/GeneralFailedResponse' } } }
     } */
  const collectionService = new CollectionService();
  const statisticsService = new StatisticsService();
  try {
    const userLevel: number = response.locals['user_level'];
    if (userLevel === 0) {
      response.status(400).json({ type: 'error', message: 'not admin level' });
      return;
    }

    const counts = await collectionService.countByStatus();
    const existing = await statisticsService.findFirst();

    const data: Statistics = {
      good_count: counts.good_count,
      normal_count: counts.normal_count,
      warning_count: counts.warning_count,
      bad_count: counts.bad_count,
    };

    let stats: Statistics;
    if (existing?.id) {
      stats = await statisticsService.update(existing.id, data);
    } else {
      stats = await statisticsService.create(data);
    }

    response.status(200).json(stats);
  } catch (err) {
    response.status(400).json({ type: 'error', message: 'unknown server error' });
  }
});

export default router;
