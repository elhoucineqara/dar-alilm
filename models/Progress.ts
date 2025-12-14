import mongoose, { Document, Schema } from 'mongoose';

export interface IProgress extends Document {
  userId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  enrollmentId: mongoose.Types.ObjectId;
  moduleId?: mongoose.Types.ObjectId;
  sectionId?: mongoose.Types.ObjectId;
  quizId?: mongoose.Types.ObjectId;
  completedSections: mongoose.Types.ObjectId[];
  completedQuizzes: mongoose.Types.ObjectId[];
  completedFinalExam: boolean;
  overallProgress: number; // 0-100
  lastAccessedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ProgressSchema = new Schema<IProgress>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    enrollmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Enrollment',
      required: true,
      index: true,
    },
    moduleId: {
      type: Schema.Types.ObjectId,
      ref: 'Module',
    },
    sectionId: {
      type: Schema.Types.ObjectId,
      ref: 'Section',
    },
    quizId: {
      type: Schema.Types.ObjectId,
      ref: 'Quiz',
    },
    completedSections: [{
      type: Schema.Types.ObjectId,
      ref: 'Section',
    }],
    completedQuizzes: [{
      type: Schema.Types.ObjectId,
      ref: 'Quiz',
    }],
    completedFinalExam: {
      type: Boolean,
      default: false,
    },
    overallProgress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    lastAccessedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index composé pour une recherche rapide
ProgressSchema.index({ userId: 1, courseId: 1 }, { unique: true });

const Progress = mongoose.models.Progress || mongoose.model<IProgress>('Progress', ProgressSchema);

export default Progress;

