import { NextRequest, NextResponse } from 'next/server';
import { deleteFile } from '@/app/lib/s3';

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ key: string[] }> }
) {
  try {
    const params = await props.params;
    const { key } = params;
    
    if (!key || key.length === 0) {
      return NextResponse.json({ error: 'No file key provided' }, { status: 400 });
    }

    // Join array to get full S3 key path (e.g., ['evidence', 'filename.png'] => 'evidence/filename.png')
    const s3Key = key.join('/');
    
    // Decode the key (it comes URL-encoded)
    const decodedKey = decodeURIComponent(s3Key);

    console.log('Deleting file:', decodedKey);

    // Delete from S3/MinIO
    await deleteFile(decodedKey);

    return NextResponse.json({ 
      success: true, 
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ 
      error: 'Failed to delete file',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
