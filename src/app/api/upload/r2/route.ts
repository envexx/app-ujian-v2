import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Cloudflare R2 Configuration
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || '';
const R2_ENDPOINT = R2_ACCOUNT_ID ? `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : '';
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || '';
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || '';
const R2_BUCKET = process.env.R2_BUCKET_NAME || 'e-learning';
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || '';

// Initialize S3 client for Cloudflare R2
const s3Client = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

export async function POST(request: Request) {
  try {
    // Validate R2 configuration
    if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_PUBLIC_URL) {
      return NextResponse.json(
        { success: false, error: 'R2 configuration tidak lengkap. Pastikan R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, dan R2_PUBLIC_URL dikonfigurasi di environment variable.' },
        { status: 500 }
      );
    }

    const session = await getSession();

    if (!session.isLoggedIn) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { imageBase64, fileName, folder } = body;

    if (!imageBase64) {
      return NextResponse.json(
        { success: false, error: 'No image provided' },
        { status: 400 }
      );
    }

    // Validate base64 format
    if (!imageBase64.startsWith('data:image/')) {
      return NextResponse.json(
        { success: false, error: 'Invalid image format' },
        { status: 400 }
      );
    }

    // Extract image data and content type
    const matches = imageBase64.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
    if (!matches) {
      return NextResponse.json(
        { success: false, error: 'Invalid base64 image format' },
        { status: 400 }
      );
    }

    const contentType = `image/${matches[1]}`;
    const imageData = matches[2];

    // Convert base64 to buffer
    const buffer = Buffer.from(imageData, 'base64');

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (buffer.length > maxSize) {
      return NextResponse.json(
        { success: false, error: 'Image size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Create unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = matches[1] || 'jpg';
    const uploadFolder = folder || 'essay-answers';
    const uniqueFileName = `${uploadFolder}/${timestamp}_${randomString}.${fileExtension}`;

    // Upload to R2
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: uniqueFileName,
      Body: buffer,
      ContentType: contentType,
    });

    await s3Client.send(command);

    // Return public URL
    const publicUrl = `${R2_PUBLIC_URL}/${uniqueFileName}`;

    return NextResponse.json({
      success: true,
      data: {
        url: publicUrl,
        fileName: uniqueFileName,
        fileSize: buffer.length,
        fileType: contentType,
      },
      message: 'Image uploaded successfully to R2',
    });
  } catch (error: any) {
    console.error('Error uploading image to R2:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to upload image to R2' },
      { status: 500 }
    );
  }
}
