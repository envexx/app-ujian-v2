// Cloudflare R2 Storage — uses native R2 binding (edge-compatible)

export interface UploadResult {
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
}

/**
 * Upload a file to R2 using native binding
 * @param bucket - R2Bucket binding from env
 * @param data - ArrayBuffer or Uint8Array
 * @param key - Object key (path in bucket)
 * @param contentType - MIME type
 * @param publicUrl - R2_PUBLIC_URL from env
 */
export async function uploadToR2(
  bucket: R2Bucket,
  data: ArrayBuffer | Uint8Array,
  key: string,
  contentType: string,
  publicUrl: string
): Promise<UploadResult> {
  try {
    await bucket.put(key, data, {
      httpMetadata: { contentType },
    });

    return {
      success: true,
      url: `${publicUrl}/${key}`,
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
 */
export async function uploadBase64ToR2(
  bucket: R2Bucket,
  base64Data: string,
  folder: string,
  fileName: string,
  publicUrl: string
): Promise<UploadResult> {
  try {
    let base64String = base64Data;
    let contentType = 'image/png';

    if (base64Data.includes(',')) {
      const parts = base64Data.split(',');
      base64String = parts[1];
      const match = parts[0].match(/data:([^;]+);/);
      if (match) contentType = match[1];
    }

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

    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const key = `${folder}/${fileName}_${timestamp}_${randomStr}.${ext}`;

    // Decode base64 to Uint8Array (edge-compatible, no Buffer needed)
    const binaryString = atob(base64String);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    return await uploadToR2(bucket, bytes, key, contentType, publicUrl);
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
 */
export async function uploadFileToR2(
  bucket: R2Bucket,
  file: File,
  folder: string,
  publicUrl: string
): Promise<UploadResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const contentType = file.type || 'application/octet-stream';

    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `${folder}/${timestamp}_${randomStr}_${originalName}`;

    return await uploadToR2(bucket, arrayBuffer, key, contentType, publicUrl);
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
 */
export async function deleteFromR2(bucket: R2Bucket, key: string): Promise<boolean> {
  try {
    await bucket.delete(key);
    return true;
  } catch (error) {
    console.error('R2 delete error:', error);
    return false;
  }
}

/**
 * Get public URL for a key
 */
export function getR2PublicUrl(publicUrl: string, key: string): string {
  return `${publicUrl}/${key}`;
}

/**
 * Extract key from R2 URL
 */
export function extractKeyFromUrl(publicUrl: string, url: string): string | null {
  if (!url.startsWith(publicUrl)) return null;
  return url.replace(`${publicUrl}/`, '');
}
