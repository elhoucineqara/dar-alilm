import mongoose, { Document, Schema } from 'mongoose';

export interface IUserInteraction extends Document {
  userId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  interactionType: 'view' | 'enroll' | 'complete' | 'like' | 'rating';
  rating?: number; // 1-5 pour les notes
  createdAt: Date;
  updatedAt: Date;
}

const UserInteractionSchema = new Schema<IUserInteraction>(
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
    interactionType: {
      type: String,
      enum: ['view', 'enroll', 'complete', 'like', 'rating'],
      required: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
  },
  {
    timestamps: true,
  }
);

// Index composé pour éviter les doublons
UserInteractionSchema.index({ userId: 1, courseId: 1, interactionType: 1 }, { unique: true });

const UserInteraction = mongoose.models.UserInteraction || mongoose.model<IUserInteraction>('UserInteraction', UserInteractionSchema);

export default UserInteraction;

