/**
 * S3/MinIO Client Utility
 * Environment-based configuration for local MinIO or production S3
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadBucketCommand, CreateBucketCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// S3 Configuration from environment variables
const S3_CONFIG = {
  endpoint: process.env.S3_ENDPOINT,
  accessKeyId: process.env.S3_ACCESS_KEY!,
  secretAccessKey: process.env.S3_SECRET_KEY!,
  bucketName: process.env.S3_BUCKET_NAME!,
  region: process.env.S3_REGION || 'us-east-1',
  forcePathStyle: !!process.env.S3_ENDPOINT, // Required for MinIO
  useSSL: process.env.S3_USE_SSL === 'true',
};

// Create S3 client instance
export const s3Client = new S3Client({
  endpoint: S3_CONFIG.endpoint,
  region: S3_CONFIG.region,
  credentials: {
    accessKeyId: S3_CONFIG.accessKeyId,
    secretAccessKey: S3_CONFIG.secretAccessKey,
  },
  forcePathStyle: S3_CONFIG.forcePathStyle,
});

/**
 * Ensure bucket exists, create if not
 */
export async function ensureBucket() {
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: S3_CONFIG.bucketName }));
    console.log(`Bucket ${S3_CONFIG.bucketName} exists`);
  } catch (error: any) {
    if (error.name === 'NotFound') {
      console.log(`Creating bucket ${S3_CONFIG.bucketName}...`);
      await s3Client.send(new CreateBucketCommand({ Bucket: S3_CONFIG.bucketName }));
      console.log(`Bucket ${S3_CONFIG.bucketName} created successfully`);
    } else {
      console.error('Error checking bucket:', error);
      throw error;
    }
  }
}

/**
 * Upload file to S3/MinIO
 * @param file - File buffer
 * @param key - S3 object key (filename with path)
 * @param contentType - MIME type
 * @returns S3 key
 */
export async function uploadFile(file: Buffer, key: string, contentType: string): Promise<string> {
  await ensureBucket();

  const command = new PutObjectCommand({
    Bucket: S3_CONFIG.bucketName,
    Key: key,
    Body: file,
    ContentType: contentType,
  });

  await s3Client.send(command);
  console.log(`File uploaded successfully: ${key}`);
  return key;
}

/**
 * Dedicated client for generating Presigned URLs for the BROWSER.
 * This client is configured with 'localhost' (or external domain) so that
 * the generated signature matches the Host header sent by the browser.
 * 
 * Note: Signing is an offline operation, so this client doesn't need network access to localhost.
 */
const signingS3Client = new S3Client({
  endpoint: 'http://10.20.0.141:9000', // External/Browser endpoint (WiFi-Ready)
  region: S3_CONFIG.region,
  credentials: {
    accessKeyId: S3_CONFIG.accessKeyId,
    secretAccessKey: S3_CONFIG.secretAccessKey,
  },
  forcePathStyle: S3_CONFIG.forcePathStyle,
});

/**
 * Get presigned URL for file download/view
 * @param key - S3 object key
 * @param expiresIn - URL expiration in seconds (default: 1 hour)
 * @returns Presigned URL
 */
export async function getFileUrl(key: string, expiresIn: number = 3600): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: S3_CONFIG.bucketName,
    Key: key,
  });

  // Use the SIGNING client to generate the URL
  // This ensures the signature is calculated for 'localhost:9000', not 'minio:9000'
  const url = await getSignedUrl(signingS3Client, command, { expiresIn });

  return url;
}

/**
 * Delete file from S3/MinIO
 * @param key - S3 object key
 */
export async function deleteFile(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: S3_CONFIG.bucketName,
    Key: key,
  });

  await s3Client.send(command);
  console.log(`File deleted successfully: ${key}`);
}

/**
 * Generate unique filename with timestamp
 * @param originalFilename - Original uploaded filename
 * @returns Unique filename
 */
export function generateUniqueFilename(originalFilename: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = originalFilename.split('.').pop();
  const baseName = originalFilename.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9]/g, '_');
  return `${timestamp}-${random}-${baseName}.${extension}`;
}

/**
 * Get public URL for file (if bucket is public)
 * For MinIO local development
 * @param key - S3 object key
 * @returns Public URL
 */
export function getPublicUrl(key: string): string {
  if (S3_CONFIG.endpoint) {
    // MinIO local URL
    return `${S3_CONFIG.endpoint}/${S3_CONFIG.bucketName}/${key}`;
  }
  // AWS S3 public URL
  return `https://${S3_CONFIG.bucketName}.s3.${S3_CONFIG.region}.amazonaws.com/${key}`;
}
