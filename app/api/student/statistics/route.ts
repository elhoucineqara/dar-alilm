import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Enrollment from '@/models/Enrollment';
import Progress from '@/models/Progress';
import Course from '@/models/Course';
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

    // Get total enrollments
    const totalEnrollments = await Enrollment.countDocuments({ userId: decoded.userId });
    
    // Get active enrollments
    const activeEnrollments = await Enrollment.countDocuments({ 
      userId: decoded.userId,
      status: 'active' 
    });

    // Get completed courses
    const completedCourses = await Enrollment.countDocuments({ 
      userId: decoded.userId,
      status: 'completed' 
    });

    // Get average progress
    const allProgress = await Progress.find({ userId: decoded.userId }).lean();
    const averageProgress = allProgress.length > 0
      ? Math.round(
          allProgress.reduce((sum, p) => sum + (p.overallProgress || 0), 0) / allProgress.length
        )
      : 0;

    // Get courses in progress (progress > 0 and < 100)
    const coursesInProgress = await Progress.countDocuments({
      userId: decoded.userId,
      overallProgress: { $gt: 0, $lt: 100 },
    });

    return NextResponse.json({
      statistics: {
        totalEnrollments,
        activeEnrollments,
        completedCourses,
        coursesInProgress,
        averageProgress,
      },
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching student statistics:', error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

