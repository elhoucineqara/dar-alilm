import { NextRequest, NextResponse } from 'next/server';
import { downloadFileFromGridFS } from '@/lib/gridfs';
import connectDB from '@/lib/mongodb';

/**
 * GET - Download a file from GridFS
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    await connectDB();

    // Handle both Promise and direct params for Next.js compatibility
    const resolvedParams = params instanceof Promise ? await params : params;
    const fileId = resolvedParams.id;

    if (!fileId) {
      return NextResponse.json({ error: 'File ID is required' }, { status: 400 });
    }

    const { buffer, filename, contentType } = await downloadFileFromGridFS(fileId);

    // Determine content type based on file extension if not provided
    let mimeType = contentType;
    if (!mimeType) {
      const extension = filename.toLowerCase().split('.').pop();
      const mimeTypes: Record<string, string> = {
        // Documents
        pdf: 'application/pdf',
        doc: 'application/msword',
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ppt: 'application/vnd.ms-powerpoint',
        pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        // Images
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        gif: 'image/gif',
        webp: 'image/webp',
        svg: 'image/svg+xml',
      };
      mimeType = mimeTypes[extension || ''] || 'application/octet-stream';
    }

    // Return file with appropriate headers
    // Convert Buffer to Uint8Array for NextResponse compatibility
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `inline; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error('Error downloading file:', error);
    
    if (error.message === 'File not found' || error.message === 'Invalid file ID') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

