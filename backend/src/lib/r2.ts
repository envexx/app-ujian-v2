// Cloudflare R2 Storage Client
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

// R2 Configuration from environment variables
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || '';
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || '';
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || '';
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'e-learning';
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || 'https://storage.nilai.online';

// Create S3 client configured for Cloudflare R2
export const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

export interface UploadResult {
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
}

/**
 * Upload a file to R2
 * @param buffer - File buffer
 * @param key - Object key (path in bucket)
 * @param contentType - MIME type
 */
export async function uploadToR2(
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<UploadResult> {
  try {
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    });

    await r2Client.send(command);

    const url = `${R2_PUBLIC_URL}/${key}`;
    
    return {
      success: true,
      url,
      key,
    };
  } catch (error: any) {
    console.error('R2 upload error:', error);
    return {
      success: false,
      error: error.message || 'Upload failed',
    };
  }
}

/**
 * Upload base64 image to R2
 * @param base64Data - Base64 encoded image data (with or without data URL prefix)
 * @param folder - Folder path in bucket
 * @param fileName - File name (without extension)
 */
export async function uploadBase64ToR2(
  base64Data: string,
  folder: string,
  fileName: string
): Promise<UploadResult> {
  try {
    // Remove data URL prefix if present
    let base64String = base64Data;
    let contentType = 'image/png';
    
    if (base64Data.includes(',')) {
      const parts = base64Data.split(',');
      base64String = parts[1];
      
      // Extract content type from data URL
      const match = parts[0].match(/data:([^;]+);/);
      if (match) {
        contentType = match[1];
      }
    }

    // Determine file extension from content type
    const extMap: Record<string, string> = {
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'image/svg+xml': 'svg',
      'application/pdf': 'pdf',
    };
    const ext = extMap[contentType] || 'png';

    // Generate unique key
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const key = `${folder}/${fileName}_${timestamp}_${randomStr}.${ext}`;

    // Convert base64 to buffer
    const buffer = Buffer.from(base64String, 'base64');

    return await uploadToR2(buffer, key, contentType);
  } catch (error: any) {
    console.error('R2 base64 upload error:', error);
    return {
      success: false,
      error: error.message || 'Upload failed',
    };
  }
}

/**
 * Upload file from form data to R2
 * @param file - File object from form data
 * @param folder - Folder path in bucket
 */
export async function uploadFileToR2(
  file: File,
  folder: string
): Promise<UploadResult> {
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const contentType = file.type || 'application/octet-stream';
    
    // Generate unique key
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `${folder}/${timestamp}_${randomStr}_${originalName}`;

    return await uploadToR2(buffer, key, contentType);
  } catch (error: any) {
    console.error('R2 file upload error:', error);
    return {
      success: false,
      error: error.message || 'Upload failed',
    };
  }
}

/**
 * Delete a file from R2
 * @param key - Object key to delete
 */
export async function deleteFromR2(key: string): Promise<boolean> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    });

    await r2Client.send(command);
    return true;
  } catch (error) {
    console.error('R2 delete error:', error);
    return false;
  }
}

/**
 * Get public URL for a key
 * @param key - Object key
 */
export function getR2PublicUrl(key: string): string {
  return `${R2_PUBLIC_URL}/${key}`;
}

/**
 * Extract key from R2 URL
 * @param url - Full R2 URL
 */
export function extractKeyFromUrl(url: string): string | null {
  if (!url.startsWith(R2_PUBLIC_URL)) {
    return null;
  }
  return url.replace(`${R2_PUBLIC_URL}/`, '');
}

export { R2_BUCKET_NAME, R2_PUBLIC_URL };
