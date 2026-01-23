import {
  CreateBucketCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly region: string;
  private bucketReady = false;

  constructor(configService: ConfigService) {
    const endpoint = configService.get<string>('MINIO_ENDPOINT');
    const accessKeyId = configService.get<string>('MINIO_ACCESS_KEY');
    const secretAccessKey = configService.get<string>('MINIO_SECRET_KEY');
    this.bucket = configService.get<string>('MINIO_BUCKET') || 'submissions';
    this.region = configService.get<string>('MINIO_REGION') || 'us-east-1';

    this.client = new S3Client({
      region: this.region,
      endpoint,
      forcePathStyle: true,
      credentials: accessKeyId && secretAccessKey ? { accessKeyId, secretAccessKey } : undefined,
    });
  }

  private async ensureBucket() {
    if (this.bucketReady) {
      return;
    }

    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
      this.bucketReady = true;
      return;
    } catch (error) {
      this.logger.warn(`Bucket ${this.bucket} not found, creating...`);
    }

    await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
    this.bucketReady = true;
  }

  async putObject(key: string, body: Buffer, contentType?: string) {
    await this.ensureBucket();
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
  }
}
