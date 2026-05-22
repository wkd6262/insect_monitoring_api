import { Router, Request, Response } from 'express';
import axios from 'axios';
import { verifyToken } from '../authorization';
import { AddressService } from '../services/address-service';
import config from '../config';

const router = Router();

// NCP Maps Reverse Geocoding (신버전 호스트). 구버전 naveropenapi.apigw 사용 금지
const reverseGeocodeUrl =
  'https://maps.apigw.ntruss.com/map-reversegeocode/v2/gc';

// 공개 프록시: 웹은 Secret 없이 우리 API만 호출 → 서버가 NCP에 대신 요청
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
    // 쿼리: latitude·longitude (WGS84). 프론트 GPS 순서와 동일
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

    // .env NAVER_CLIENT_ID / NAVER_CLIENT_SECRET_KEY (지도 Application과 동일 키)
    const naverClientId = config.naverClientId;
    const naverClientSecretKey = config.naverClientSecretKey;
    if (!naverClientId || !naverClientSecretKey) {
      response
        .status(400)
        .json({ type: 'error', message: 'unknown server error' });
      return;
    }

    // NCP GET /gc — coords는 경도,위도 순. 상세(addr) 없어도 admcode/legalcode로 구 단위 확보
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

    // NCP body status: 0=성공, 3=결과 없음(바다·국외 등)
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

    // 행정동(admcode) 우선, 없으면 법정동(legalcode)의 region 사용
    const admResult = results.find(
      (item: { name?: string }) => item.name === 'admcode',
    );
    const legalResult = results.find(
      (item: { name?: string }) => item.name === 'legalcode',
    );
    const region = admResult?.region ?? legalResult?.region;
    // area1=시도, area2=시군구(화면 「구까지」), area3=읍면동(DB 저장용)
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

    // 프론트 업로드용 최소 JSON. 304 캐시로 빈 응답 나는 것 방지
    response.set('Cache-Control', 'no-store');
    response.status(200).json({
      address_sido: addressSido,
      address_gungu: addressGungu,
      address_dong: addressDong,
      displayGu: `${addressSido} ${addressGungu}`,
      isSeoul,
    });
  } catch (err) {
    // NCP 401 등은 클라이언트에 400만 반환 (권한·구독 오류 메시지 노출 최소화)
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
