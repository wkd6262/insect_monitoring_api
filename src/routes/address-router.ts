import { Router, Request, Response } from 'express';
import axios from 'axios';
import { verifyToken } from '../authorization';
import { AddressService } from '../services/address-service';
import config from '../config';

const router = Router();

const reverseGeocodeUrl =
  'https://maps.apigw.ntruss.com/map-reversegeocode/v2/gc';

router.get('/reverse', async (request: Request, response: Response) => {
  // #swagger.tags = ['address']
  // #swagger.path = '/address/reverse'
  // #swagger.summary = '역지오코딩 (공개)'
  /* #swagger.parameters['latitude'] = { in: 'query', required: true, type: 'number' } */
  /* #swagger.parameters['longitude'] = { in: 'query', required: true, type: 'number' } */
  /* #swagger.responses[200] = {
       description: '성공',
       content: { 'application/json': { schema: { $ref: '#/components/schemas/AddressReverseSuccessResponse' } } }
     } */
  /* #swagger.responses[400] = {
       description: '실패',
       content: { 'application/json': { schema: { $ref: '#/components/schemas/GeneralFailedResponse' } } }
     } */
  try {
    const latitudeRaw = request.query.latitude as string;
    const longitudeRaw = request.query.longitude as string;
    if (latitudeRaw === undefined || longitudeRaw === undefined) {
      response.status(400).json({ type: 'error', message: 'invalid request' });
      return;
    }

    const latitude = Number(latitudeRaw);
    const longitude = Number(longitudeRaw);
    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      response.status(400).json({ type: 'error', message: 'invalid request' });
      return;
    }

    const naverClientId = config.naverClientId;
    const naverClientSecretKey = config.naverClientSecretKey;
    if (!naverClientId || !naverClientSecretKey) {
      response
        .status(400)
        .json({ type: 'error', message: 'unknown server error' });
      return;
    }

    const naverResponse = await axios.get(reverseGeocodeUrl, {
      params: {
        request: 'coordsToaddr',
        coords: `${longitude},${latitude}`,
        sourcecrs: 'epsg:4326',
        orders: 'admcode,legalcode,addr,roadaddr',
        output: 'json',
      },
      headers: {
        'x-ncp-apigw-api-key-id': naverClientId,
        'x-ncp-apigw-api-key': naverClientSecretKey,
      },
    });

    const statusCode = naverResponse.data?.status?.code;
    if (statusCode === 3) {
      response
        .status(400)
        .json({ type: 'error', message: 'no address results' });
      return;
    }
    if (statusCode !== 0) {
      response.status(400).json({ type: 'error', message: 'invalid request' });
      return;
    }

    const results = naverResponse.data?.results;
    if (!Array.isArray(results) || results.length === 0) {
      response
        .status(400)
        .json({ type: 'error', message: 'no address results' });
      return;
    }

    const admResult = results.find(
      (item: { name?: string }) => item.name === 'admcode',
    );
    const legalResult = results.find(
      (item: { name?: string }) => item.name === 'legalcode',
    );
    const region = admResult?.region ?? legalResult?.region;
    if (!region?.area1?.name || !region?.area2?.name) {
      response
        .status(400)
        .json({ type: 'error', message: 'no address results' });
      return;
    }

    const addressSido = region.area1.name as string;
    const addressGungu = region.area2.name as string;
    const addressDong = (region.area3?.name as string) ?? '';
    const isSeoul = addressSido.includes('서울');

    response.set('Cache-Control', 'no-store');
    response.status(200).json({
      address_sido: addressSido,
      address_gungu: addressGungu,
      address_dong: addressDong,
      displayGu: `${addressSido} ${addressGungu}`,
      isSeoul,
    });
  } catch (err) {
    response
      .status(400)
      .json({ type: 'error', message: 'unknown server error' });
  }
});

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
