import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Enrollment from '@/models/Enrollment';
import Progress from '@/models/Progress';
import Course from '@/models/Course';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; role: string };
    
    if (decoded.role !== 'student') {
      return NextResponse.json({ error: 'Only students can enroll in courses' }, { status: 403 });
    }

    const { courseId } = await request.json();

    if (!courseId) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
    }

    // Check if course exists and is published
    const course = await Course.findById(courseId);
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    if (course.status !== 'published') {
      return NextResponse.json({ error: 'Course is not available for enrollment' }, { status: 400 });
    }

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      userId: decoded.userId,
      courseId: courseId,
    });

    if (existingEnrollment) {
      return NextResponse.json({ 
        error: 'Already enrolled in this course',
        enrollment: existingEnrollment 
      }, { status: 400 });
    }

    // Create enrollment
    const enrollment = await Enrollment.create({
      userId: decoded.userId,
      courseId: courseId,
      status: 'active',
      enrolledAt: new Date(),
    });

    // Create initial progress
    await Progress.create({
      userId: decoded.userId,
      courseId: courseId,
      enrollmentId: enrollment._id,
      completedSections: [],
      completedQuizzes: [],
      completedFinalExam: false,
      overallProgress: 0,
      lastAccessedAt: new Date(),
    });

    return NextResponse.json({ 
      message: 'Successfully enrolled in course',
      enrollment 
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error enrolling in course:', error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

