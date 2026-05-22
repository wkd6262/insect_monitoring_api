import {
  S3Client,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import dayjs from 'dayjs';
import config from '../config';

export class S3StorageService {
  private s3: S3Client;

  constructor() {
    this.s3 = new S3Client({
      region: config.awsRegion ?? 'ap-northeast-2',
      credentials: {
        accessKeyId: config.awsAccessKeyId ?? '',
        secretAccessKey: config.awsSecretAccessKey ?? '',
      },
    });
  }

  public GetS3Client() {
    return this.s3;
  }

  public async getSingedPutUrl(
    bucketName: string,
    folder: string,
    fileName: string,
    expires: number,
  ): Promise<string> {
    const key = `images/${folder}/[${dayjs().format('YYYY-MM-DD')}]/${dayjs().format('HH_mm_ss')}_${fileName}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ACL: 'public-read',
    });

    try {
      return await getSignedUrl(this.s3, command, { expiresIn: expires });
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  // multer-s3 업로드 후 key만 알 때, 동일 key로 Get → Put (URL·DB 경로 문자열 유지)
  public async replaceObject(bucketName: string, key: string): Promise<void> {
    try {
      const getObjectResult = await this.s3.send(
        new GetObjectCommand({ Bucket: bucketName, Key: key }),
      );

      const bodyStream = getObjectResult.Body;
      if (!bodyStream) {
        throw new Error('S3 object body empty');
      }

      const body = Buffer.from(await bodyStream.transformToByteArray());

      await this.s3.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: key,
          Body: body,
          ContentType:
            getObjectResult.ContentType ?? 'application/octet-stream',
          ACL: 'public-read',
        }),
      );
    } catch (err) {
      console.warn(err);
      throw err;
    }
  }

  public async deleteObject(
    bucketName: string,
    objectKey: string,
  ): Promise<string> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: objectKey,
      });

      await this.s3.send(command);
      return objectKey;
    } catch (err) {
      console.warn(err);
      throw err;
    }
  }

  public async deleteContainer(
    bucketName: string,
    folder: string,
    requestParams: any | null,
  ): Promise<string> {
    try {
      const params = requestParams ?? {
        Bucket: bucketName,
        Prefix: folder + '/',
      };

      const command = new ListObjectsV2Command(params);
      const listedObjects = await this.s3.send(command);

      if (!listedObjects.Contents?.length) {
        return '';
      }

      const deleteParams = {
        Bucket: bucketName,
        Delete: {
          Objects: listedObjects.Contents.map((obj) => ({ Key: obj.Key! })),
        },
      };

      const deleteCommand = new DeleteObjectsCommand(deleteParams);
      const deleteResult = await this.s3.send(deleteCommand);

      if (deleteResult.Errors?.length) {
        return '';
      }

      if (listedObjects.IsTruncated) {
        const nextParams = {
          ...params,
          ContinuationToken: listedObjects.NextContinuationToken,
        };
        await this.deleteContainer(bucketName, folder, nextParams);
      } else {
        return folder;
      }
    } catch (err) {
      console.warn(err);
      throw err;
    }

    return '';
  }
}
