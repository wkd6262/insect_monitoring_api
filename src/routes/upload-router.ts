import { Router, Request, Response } from 'express';
import { verifyToken } from '../authorization';
import multerS3 from 'multer-s3';
import multer from 'multer';
import dayjs from 'dayjs';
import config from '../config';
import { S3StorageService } from '../services/s3-service';

const router = Router();

const storageService = new S3StorageService();

const s3upload_images = multer({
  storage: multerS3({
    s3: storageService.GetS3Client(),
    bucket: config.awsBucketName!, //버킷 이름.
    key: function (req: Request, file, cb) {
      let folder: string = req.path.substring(1).split('/')[1]; //맨 앞의 '/' 제거.(ex: /images/user => images/user)
      var destFile =
        'images/' +
        folder +
        '/[' +
        dayjs().format('YYYY-MM-DD') +
        ']' +
        '/' +
        dayjs().format('HH_mm_ss') +
        '_' +
        Buffer.from(file.originalname, 'ascii').toString('utf8');
      cb(null, destFile);
    },
    acl: 'public-read', //객체 읽기 권한.
  }),
  limits: {
    files: 15,
    fileSize: 1024 * 1024 * 10, //10MB.
  },
});

//가입시 프로필 사진 업로드를 위해 user 경로는 인증하지 않음.
// router.post(
//   '/image/user',
//   s3upload_images.single('file'),
//   async (request: Request, response: Response) => {
//     try {
//       if (!request.file) {
//         response.status(400).send('upload failed');
//         return;
//       }
//       const key = (request.file as any).key;
//       await storageService.replaceObject(config.awsBucketName!, key);
//       response.send(key);
//     } catch (err) {
//       console.log(err);
//       response.status(400).send('upload failed');
//     }
//   },
// );

//파일 업로드.
router.use('/image/:folder', verifyToken);
router.post(
  '/image/:folder',
  s3upload_images.single('file'),
  async (request: Request, response: Response) => {
    try {
      if (!request.file) {
        response.status(400).send('upload failed');
        return;
      }
      const key = (request.file as any).key;
      await storageService.replaceObject(config.awsBucketName!, key);
      response.send(key);
    } catch (err) {
      console.log(err);
      response.status(400).send('upload failed');
    }
  },
);

//파일 삭제.
router.use('/image', verifyToken);
router.delete('/image', async (request: Request, response: Response) => {
  let file: string = request.query.filename as string; //맨 앞의 '/' 제거.(ex: /images/user => images/user)

  if (file == '') {
    response.status(200).send('success');
    return;
  }

  const result = await storageService.deleteObject(config.awsBucketName!, file);
  if (result) {
    response.status(200).send('success');
  } else {
    response.status(400).send('image delete failed');
  }
});

//폴더 삭제.
router.use('/folder', verifyToken);
router.delete('/folder', async (request: Request, response: Response) => {
  let folder: string = request.query.folder as string; //맨 앞의 '/' 제거.(ex: /images/user => images/user)

  const result = await storageService.deleteContainer(
    config.awsBucketName!,
    folder,
    null,
  );
  if (result) {
    response.status(200).send('success');
  } else {
    response.status(400).send('image folder delete failed');
  }
});

//presigned url 요청.
router.use('/pre/image', verifyToken);
router.post('/pre/image', async (request: Request, response: Response) => {
  const url: string = await storageService.getSingedPutUrl(
    config.awsBucketName!,
    request.body.folder,
    request.body.fileName,
    60 * 5,
  ); //5 minutes
  response.send(url);
});

//presigned url 요청.(non-auth)
//가입시 프로필 사진 업로드를 위해 user 경로는 인증하지 않음.
//router.use('/pre/image_pet', verifyToken);
router.post('/pre/image_pet', async (request: Request, response: Response) => {
  const url: string = await storageService.getSingedPutUrl(
    config.awsBucketName!,
    'pet',
    request.body.fileName,
    60 * 1,
  ); //1 minutes
  response.send(url);
});

export default router;
