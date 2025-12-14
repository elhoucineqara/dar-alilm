import mongoose from 'mongoose';
import { GridFSBucket } from 'mongodb';
import connectDB from './mongodb';

let gridFSBucket: GridFSBucket | null = null;

/**
 * Get or create GridFS bucket instance
 */
async function getGridFSBucket(): Promise<GridFSBucket> {
  if (gridFSBucket) {
    return gridFSBucket;
  }

  await connectDB();
  const db = mongoose.connection.db;
  
  if (!db) {
    throw new Error('Database connection not established');
  }

  gridFSBucket = new GridFSBucket(db, { bucketName: 'uploads' });
  return gridFSBucket;
}

/**
 * Upload a file to GridFS
 * @param buffer File buffer
 * @param filename Original filename
 * @param metadata Optional metadata to store with the file
 * @returns GridFS file ID
 */
export async function uploadFileToGridFS(
  buffer: Buffer,
  filename: string,
  metadata?: Record<string, any>
): Promise<string> {
  const bucket = await getGridFSBucket();
  
  return new Promise((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(filename, {
      metadata: metadata || {},
    });

    uploadStream.on('error', (error) => {
      reject(error);
    });

    uploadStream.on('finish', () => {
      resolve(uploadStream.id.toString());
    });

    uploadStream.end(buffer);
  });
}

/**
 * Download a file from GridFS by ID
 * @param fileId GridFS file ID
 * @returns File buffer and metadata
 */
export async function downloadFileFromGridFS(
  fileId: string
): Promise<{ buffer: Buffer; filename: string; contentType?: string; metadata?: any }> {
  const bucket = await getGridFSBucket();
  const ObjectId = mongoose.Types.ObjectId;

  // Validate ObjectId format
  if (!ObjectId.isValid(fileId)) {
    throw new Error('Invalid file ID');
  }

  const fileIdObj = new ObjectId(fileId);

  // First, get file metadata
  const files = await bucket.find({ _id: fileIdObj }).toArray();
  if (files.length === 0) {
    throw new Error('File not found');
  }

  const fileInfo = files[0];

  return new Promise((resolve, reject) => {
    const downloadStream = bucket.openDownloadStream(fileIdObj);
    const chunks: Buffer[] = [];

    downloadStream.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });

    downloadStream.on('error', (error) => {
      reject(error);
    });

    downloadStream.on('end', () => {
      const buffer = Buffer.concat(chunks);
      const filename = fileInfo.filename || 'file';
      // contentType is stored in metadata, not directly on GridFSFile
      const contentType = (fileInfo.metadata as any)?.contentType;
      const metadata = fileInfo.metadata;

      resolve({
        buffer,
        filename,
        contentType,
        metadata,
      });
    });
  });
}

/**
 * Get file metadata from GridFS
 * @param fileId GridFS file ID
 * @returns File metadata
 */
export async function getFileMetadata(fileId: string): Promise<any> {
  const bucket = await getGridFSBucket();
  const ObjectId = mongoose.Types.ObjectId;

  if (!ObjectId.isValid(fileId)) {
    throw new Error('Invalid file ID');
  }

  const fileIdObj = new ObjectId(fileId);
  const files = await bucket.find({ _id: fileIdObj }).toArray();

  if (files.length === 0) {
    throw new Error('File not found');
  }

  return files[0];
}

/**
 * Delete a file from GridFS
 * @param fileId GridFS file ID
 */
export async function deleteFileFromGridFS(fileId: string): Promise<void> {
  const bucket = await getGridFSBucket();
  const ObjectId = mongoose.Types.ObjectId;

  if (!ObjectId.isValid(fileId)) {
    throw new Error('Invalid file ID');
  }

  const fileIdObj = new ObjectId(fileId);
  await bucket.delete(fileIdObj);
}

