import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Enrollment from '@/models/Enrollment';
import Progress from '@/models/Progress';
import Course from '@/models/Course';
import Category from '@/models/Category';
import User from '@/models/User';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; role: string };
    
    if (decoded.role !== 'student') {
      return NextResponse.json({ error: 'Only students can access this endpoint' }, { status: 403 });
    }

    // Ensure models are registered
    if (!mongoose.models.Enrollment) { require('@/models/Enrollment'); }
    if (!mongoose.models.Progress) { require('@/models/Progress'); }
    if (!mongoose.models.Course) { require('@/models/Course'); }
    if (!mongoose.models.Category) { require('@/models/Category'); }
    if (!mongoose.models.User) { require('@/models/User'); }

    // Get all enrollments for this student
    const enrollments = await Enrollment.find({ userId: decoded.userId })
      .populate('courseId')
      .sort({ enrolledAt: -1 })
      .lean();

    // Get progress for each enrollment
    const coursesWithProgress = await Promise.all(
      enrollments.map(async (enrollment: any) => {
        const progress = await Progress.findOne({
          userId: decoded.userId,
          courseId: enrollment.courseId._id,
        }).lean();

        // Populate category and instructor
        const course = await Course.findById(enrollment.courseId._id)
          .populate('categoryId', 'name')
          .populate('instructorId', 'firstName lastName')
          .lean();

        return {
          enrollment: {
            _id: enrollment._id,
            enrolledAt: enrollment.enrolledAt,
            status: enrollment.status,
            completedAt: enrollment.completedAt,
          },
          course: {
            _id: course?._id,
            title: course?.title,
            description: course?.description,
            thumbnail: course?.thumbnail,
            price: course?.price,
            category: course?.categoryId,
            instructor: course?.instructorId,
          },
          progress: progress ? {
            overallProgress: progress.overallProgress,
            completedSections: progress.completedSections?.length || 0,
            completedQuizzes: progress.completedQuizzes?.length || 0,
            completedFinalExam: progress.completedFinalExam || false,
            lastAccessedAt: progress.lastAccessedAt,
          } : null,
        };
      })
    );

    return NextResponse.json({ 
      courses: coursesWithProgress 
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching enrolled courses:', error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

