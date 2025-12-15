import mongoose, { Schema, Document } from 'mongoose';

export interface ICertificate extends Document {
  studentId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  certificateId: string; // Unique ID for sharing
  studentName: string;
  courseName: string;
  instructorName: string;
  score: number;
  completionDate: Date;
  issuedAt: Date;
}

const CertificateSchema: Schema = new Schema({
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  courseId: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  certificateId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  studentName: {
    type: String,
    required: true,
  },
  courseName: {
    type: String,
    required: true,
  },
  instructorName: {
    type: String,
    required: true,
  },
  score: {
    type: Number,
    required: true,
  },
  completionDate: {
    type: Date,
    required: true,
  },
  issuedAt: {
    type: Date,
    default: Date.now,
  },
});

// Create compound index for student and course
CertificateSchema.index({ studentId: 1, courseId: 1 }, { unique: true });

export default mongoose.models.Certificate || mongoose.model<ICertificate>('Certificate', CertificateSchema);

