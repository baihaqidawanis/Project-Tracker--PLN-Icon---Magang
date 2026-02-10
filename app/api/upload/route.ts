import { NextRequest, NextResponse } from 'next/server';
import { uploadFile, generateUniqueFilename, getFileUrl } from '@/app/lib/s3';
import { requireAuth } from '@/app/lib/auth-guard';

export async function POST(request: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult.authorized) return authResult.response;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only JPG, PNG, and PDF allowed.' }, { status: 400 });
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large. Maximum size is 10MB.' }, { status: 400 });
    }

    // Generate unique filename
    const filename = generateUniqueFilename(file.name);
    const s3Key = `evidence/${filename}`;

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to S3/MinIO
    await uploadFile(buffer, s3Key, file.type);

    // Get presigned URL (expires in 7 days for evidence files)
    const fileUrl = await getFileUrl(s3Key, 7 * 24 * 60 * 60);

    return NextResponse.json({
      success: true,
      filename,
      s3Key,
      url: fileUrl,
      message: 'File uploaded successfully'
    });
  } catch (error) {
    console.error('[upload POST]', error instanceof Error ? error.message : error);
    return NextResponse.json({
      error: 'Failed to upload file'
    }, { status: 500 });
  }
}
