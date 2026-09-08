import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GetObjectCommand,
  GetObjectTaggingCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const SIGNED_URL_TTL_SECONDS = 900;

export type SignedUrl = { url: string; expiresAt: Date };
export type UploadObjectMetadata = {
  sizeBytes: number;
  contentType: string | undefined;
  checksumSha256: string | undefined;
  scanStatus: 'CLEAN' | 'PENDING' | 'INFECTED';
};

/**
 * Generates time-limited pre-signed URLs for private object storage. When
 * `STORAGE_ENDPOINT` is not configured, a local development URL is returned so
 * the metadata flow remains fully testable without object storage.
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: S3Client | null;
  private readonly bucket: string;
  private readonly appUrl: string;

  constructor(config: ConfigService) {
    this.bucket = config.get<string>('storage.bucket') ?? 'chamber-files';
    this.appUrl = config.get<string>('app.url') ?? 'http://localhost:3000';
    const endpoint = config.get<string>('storage.endpoint');
    if (endpoint) {
      this.client = new S3Client({
        endpoint,
        region: config.get<string>('storage.region') ?? 'us-east-1',
        credentials: {
          accessKeyId: config.get<string>('storage.accessKey') ?? '',
          secretAccessKey: config.get<string>('storage.secretKey') ?? '',
        },
        forcePathStyle: true,
      });
    } else {
      this.client = null;
      this.logger.warn('Object storage is not configured; using local development URLs');
    }
  }

  async createUploadUrl(
    key: string,
    contentType: string,
    sizeBytes: number,
    checksumSha256: string,
  ): Promise<SignedUrl> {
    if (!this.client) return this.devUrl(key);
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
      ContentLength: sizeBytes,
      ChecksumSHA256: checksumSha256,
    });
    const url = await getSignedUrl(this.client, command, { expiresIn: SIGNED_URL_TTL_SECONDS });
    return { url, expiresAt: this.expiry() };
  }

  async createDownloadUrl(key: string): Promise<SignedUrl> {
    if (!this.client) return this.devUrl(key);
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    const url = await getSignedUrl(this.client, command, { expiresIn: SIGNED_URL_TTL_SECONDS });
    return { url, expiresAt: this.expiry() };
  }

  async putGeneratedObject(key: string, contentType: string, body: Uint8Array): Promise<void> {
    if (!this.client) return;
    await this.client.send(new PutObjectCommand({ Bucket: this.bucket, Key: key, ContentType: contentType, Body: body }));
  }

  /**
   * Reads object metadata from storage rather than accepting completion details
   * from the browser. A malware scanner must tag clean objects with
   * `malware-scan-status=clean` before they can become available.
   */
  async inspectUpload(key: string): Promise<UploadObjectMetadata | null> {
    if (!this.client) return null;

    try {
      const [head, tags] = await Promise.all([
        this.client.send(
          new HeadObjectCommand({ Bucket: this.bucket, Key: key, ChecksumMode: 'ENABLED' }),
        ),
        this.client.send(new GetObjectTaggingCommand({ Bucket: this.bucket, Key: key })),
      ]);
      const scanTag = tags.TagSet?.find((tag) => tag.Key === 'malware-scan-status')?.Value;
      const normalizedScanStatus = scanTag?.toLowerCase();

      return {
        sizeBytes: head.ContentLength ?? -1,
        contentType: head.ContentType,
        checksumSha256: head.ChecksumSHA256,
        scanStatus:
          normalizedScanStatus === 'clean'
            ? 'CLEAN'
            : normalizedScanStatus === 'infected'
              ? 'INFECTED'
              : 'PENDING',
      };
    } catch (error) {
      if (this.isObjectNotFound(error)) return null;
      throw error;
    }
  }

  private devUrl(key: string): SignedUrl {
    return { url: `${this.appUrl}/dev-storage/${key}`, expiresAt: this.expiry() };
  }

  private expiry(): Date {
    return new Date(Date.now() + SIGNED_URL_TTL_SECONDS * 1000);
  }

  private isObjectNotFound(error: unknown): boolean {
    if (typeof error !== 'object' || error === null) return false;
    const candidate = error as { name?: unknown; $metadata?: { httpStatusCode?: unknown } };
    return (
      candidate.name === 'NotFound' ||
      candidate.name === 'NoSuchKey' ||
      candidate.$metadata?.httpStatusCode === 404
    );
  }
}
