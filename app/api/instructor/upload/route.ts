import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import { uploadFileToGridFS } from '@/lib/gridfs';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; role: string };
    if (decoded.role !== 'instructor') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type - accept documents and images
    const allowedDocumentTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'];
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    const fileType = file.type;
    
    // Check if file type is allowed (documents or images)
    const isValidDocumentType = allowedDocumentTypes.includes(fileType) || 
      file.name.toLowerCase().endsWith('.pdf') ||
      file.name.toLowerCase().endsWith('.doc') ||
      file.name.toLowerCase().endsWith('.docx') ||
      file.name.toLowerCase().endsWith('.ppt') ||
      file.name.toLowerCase().endsWith('.pptx');
    
    const isValidImageType = allowedImageTypes.includes(fileType) ||
      file.name.toLowerCase().endsWith('.jpg') ||
      file.name.toLowerCase().endsWith('.jpeg') ||
      file.name.toLowerCase().endsWith('.png') ||
      file.name.toLowerCase().endsWith('.gif') ||
      file.name.toLowerCase().endsWith('.webp') ||
      file.name.toLowerCase().endsWith('.svg');

    if (!isValidDocumentType && !isValidImageType) {
      return NextResponse.json({ error: 'Invalid file type. Only PDF, Word, PowerPoint files and images (JPG, PNG, GIF, WebP, SVG) are allowed.' }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${timestamp}_${sanitizedName}`;
    
    // Upload file to GridFS with metadata
    const fileId = await uploadFileToGridFS(buffer, filename, {
      originalName: file.name,
      uploadedBy: decoded.userId,
      uploadedAt: new Date(),
      contentType: file.type,
      size: file.size,
    });

    // Return the file ID (which will be used to download the file)
    const fileUrl = `/api/files/${fileId}`;
    
    return NextResponse.json({ 
      fileId,
      fileUrl,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

