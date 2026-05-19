import { Router, Request, Response } from 'express';
import { verifyToken } from "../authorization";
import { AddressService } from '../services/address-service';

const router = Router();

router.use('/list', verifyToken);
router.get('/list', async(request: Request, response: Response) => {
  const addressService = new AddressService();
  try{
    const list = await addressService.findAll();
    response.status(200).send(list)
  }catch(err) {
    response.status(400).json({
      type: 'error',
      message: 'unknwon server error'
    })
  }
})

export default router;