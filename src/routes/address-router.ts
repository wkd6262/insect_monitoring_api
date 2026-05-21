import { Router, Request, Response } from 'express';
import { verifyToken } from '../authorization';
import { AddressService } from '../services/address-service';

const router = Router();

router.use('/list', verifyToken);
router.get('/list', async (request: Request, response: Response) => {
  // #swagger.tags = ['address']
  // #swagger.path = '/address/list'
  // #swagger.security = [{bearerAuth: []}]
  // #swagger.summary = '주소 목록'
  /* #swagger.responses[200] = {
       description: '성공',
       content: { 'application/json': { schema: { $ref: '#/components/schemas/AddressListSuccessResponse' } } }
     } */
  /* #swagger.responses[400] = {
       description: '실패',
       content: { 'application/json': { schema: { $ref: '#/components/schemas/GeneralFailedResponse' } } }
     } */
  const addressService = new AddressService();
  try {
    const list = await addressService.findAll();
    response.status(200).send(list);
  } catch (err) {
    response.status(400).json({
      type: 'error',
      message: 'unknwon server error',
    });
  }
});

export default router;
