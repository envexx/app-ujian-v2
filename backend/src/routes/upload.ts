import { Hono } from 'hono';
import { authMiddleware, tenantMiddleware } from '../middleware/auth';
import { uploadBase64ToR2, uploadFileToR2, deleteFromR2, extractKeyFromUrl } from '../lib/r2';
import type { HonoEnv } from '../env';

const upload = new Hono<HonoEnv>();

// Apply auth middleware
upload.use('*', authMiddleware, tenantMiddleware);

// Helper to get R2 bucket and public URL from env
function getR2(c: any) {
  const bucket = c.env?.R2_BUCKET as R2Bucket;
  const publicUrl = c.env?.R2_PUBLIC_URL || 'https://storage.nilai.online';
  if (!bucket) throw new Error('R2_BUCKET binding not configured');
  return { bucket, publicUrl };
}

// POST /upload/r2 - Upload base64 image to R2
upload.post('/r2', async (c) => {
  try {
    const body = await c.req.json();
    const { imageBase64, fileName, folder } = body;

    if (!imageBase64) {
      return c.json({ success: false, error: 'Image data required' }, 400);
    }

    const { bucket, publicUrl } = getR2(c);
    const user = c.get('user');
    const schoolId = user?.schoolId || 'default';
    const folderPath = `${schoolId}/${folder || 'uploads'}`;
    const name = fileName || 'image';

    const result = await uploadBase64ToR2(bucket, imageBase64, folderPath, name, publicUrl);

    if (!result.success) {
      return c.json({ success: false, error: result.error || 'Upload failed' }, 500);
    }

    return c.json({ success: true, data: { url: result.url, key: result.key } });
  } catch (error) {
    console.error('Error uploading to R2:', error);
    return c.json({ success: false, error: 'Failed to upload' }, 500);
  }
});

// POST /upload/soal - Upload soal image (for guru)
upload.post('/soal', async (c) => {
  try {
    const body = await c.req.json();
    const { imageBase64, ujianId, soalIndex } = body;

    if (!imageBase64) {
      return c.json({ success: false, error: 'Image data required' }, 400);
    }

    const { bucket, publicUrl } = getR2(c);
    const user = c.get('user');
    const schoolId = user?.schoolId || 'default';
    const folderPath = `${schoolId}/soal/${ujianId || 'draft'}`;
    const fileName = `soal_${soalIndex || Date.now()}`;

    const result = await uploadBase64ToR2(bucket, imageBase64, folderPath, fileName, publicUrl);

    if (!result.success) {
      return c.json({ success: false, error: result.error || 'Upload failed' }, 500);
    }

    return c.json({ success: true, data: { url: result.url, key: result.key } });
  } catch (error) {
    console.error('Error uploading soal image:', error);
    return c.json({ success: false, error: 'Failed to upload' }, 500);
  }
});

// POST /upload/jawaban - Upload jawaban image (for siswa)
upload.post('/jawaban', async (c) => {
  try {
    const body = await c.req.json();
    const { imageBase64, ujianId, soalId } = body;

    if (!imageBase64) {
      return c.json({ success: false, error: 'Image data required' }, 400);
    }

    const { bucket, publicUrl } = getR2(c);
    const user = c.get('user');
    const schoolId = user?.schoolId || 'default';
    const userId = user?.userId || 'anonymous';
    const folderPath = `${schoolId}/jawaban/${ujianId || 'draft'}/${userId}`;
    const fileName = `jawaban_${soalId || Date.now()}`;

    const result = await uploadBase64ToR2(bucket, imageBase64, folderPath, fileName, publicUrl);

    if (!result.success) {
      return c.json({ success: false, error: result.error || 'Upload failed' }, 500);
    }

    return c.json({ success: true, data: { url: result.url, key: result.key } });
  } catch (error) {
    console.error('Error uploading jawaban image:', error);
    return c.json({ success: false, error: 'Failed to upload' }, 500);
  }
});

// POST /upload/profile - Upload profile image
upload.post('/profile', async (c) => {
  try {
    const body = await c.req.json();
    const { imageBase64 } = body;

    if (!imageBase64) {
      return c.json({ success: false, error: 'Image data required' }, 400);
    }

    const { bucket, publicUrl } = getR2(c);
    const user = c.get('user');
    const schoolId = user?.schoolId || 'default';
    const userId = user?.userId || 'anonymous';
    const folderPath = `${schoolId}/profiles`;
    const fileName = `profile_${userId}`;

    const result = await uploadBase64ToR2(bucket, imageBase64, folderPath, fileName, publicUrl);

    if (!result.success) {
      return c.json({ success: false, error: result.error || 'Upload failed' }, 500);
    }

    return c.json({ success: true, data: { url: result.url, key: result.key } });
  } catch (error) {
    console.error('Error uploading profile image:', error);
    return c.json({ success: false, error: 'Failed to upload' }, 500);
  }
});

// POST /upload/file - Upload file via multipart form
upload.post('/file', async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'files';

    if (!file) {
      return c.json({ success: false, error: 'File required' }, 400);
    }

    const { bucket, publicUrl } = getR2(c);
    const user = c.get('user');
    const schoolId = user?.schoolId || 'default';
    const folderPath = `${schoolId}/${folder}`;

    const result = await uploadFileToR2(bucket, file, folderPath, publicUrl);

    if (!result.success) {
      return c.json({ success: false, error: result.error || 'Upload failed' }, 500);
    }

    return c.json({ success: true, data: { url: result.url, key: result.key } });
  } catch (error) {
    console.error('Error uploading file:', error);
    return c.json({ success: false, error: 'Failed to upload' }, 500);
  }
});

// DELETE /upload - Delete file from R2
upload.delete('/', async (c) => {
  try {
    const body = await c.req.json();
    const { url, key } = body;
    const { bucket, publicUrl } = getR2(c);

    let deleteKey = key;
    if (!deleteKey && url) {
      deleteKey = extractKeyFromUrl(publicUrl, url);
    }

    if (!deleteKey) {
      return c.json({ success: false, error: 'Key or URL required' }, 400);
    }

    // Verify user has permission (file belongs to their school)
    const user = c.get('user');
    const schoolId = user?.schoolId;
    
    if (schoolId && !deleteKey.startsWith(schoolId)) {
      return c.json({ success: false, error: 'Permission denied' }, 403);
    }

    const success = await deleteFromR2(bucket, deleteKey);

    if (!success) {
      return c.json({ success: false, error: 'Delete failed' }, 500);
    }

    return c.json({ success: true, message: 'File deleted' });
  } catch (error) {
    console.error('Error deleting file:', error);
    return c.json({ success: false, error: 'Failed to delete' }, 500);
  }
});

// POST /upload - General file upload (backward compatibility)
upload.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const { imageBase64, fileName, folder } = body;

    if (!imageBase64) {
      return c.json({ success: false, error: 'Image data required' }, 400);
    }

    const { bucket, publicUrl } = getR2(c);
    const user = c.get('user');
    const schoolId = user?.schoolId || 'default';
    const folderPath = `${schoolId}/${folder || 'uploads'}`;
    const name = fileName || 'file';

    const result = await uploadBase64ToR2(bucket, imageBase64, folderPath, name, publicUrl);

    if (!result.success) {
      return c.json({ success: false, error: result.error || 'Upload failed' }, 500);
    }

    return c.json({ success: true, data: { url: result.url, key: result.key } });
  } catch (error) {
    console.error('Error uploading:', error);
    return c.json({ success: false, error: 'Failed to upload' }, 500);
  }
});

export default upload;
