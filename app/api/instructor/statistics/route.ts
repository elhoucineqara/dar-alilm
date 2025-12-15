import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Course from '@/models/Course';
import User from '@/models/User';
import Enrollment from '@/models/Enrollment';
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    const instructorId = decoded.userId;

    // Verify user is an instructor
    const instructor = await User.findById(instructorId);
    if (!instructor || instructor.role !== 'instructor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get total courses created by this instructor
    const totalCourses = await Course.countDocuments({ instructorId });

    // Get published courses count
    const publishedCourses = await Course.countDocuments({ 
      instructorId, 
      status: 'published' 
    });

    // Get all instructor's courses
    const instructorCourses = await Course.find({ instructorId }).select('_id');
    const courseIds = instructorCourses.map((course) => course._id);

    // Get total enrollments for instructor's courses
    const totalEnrollments = await Enrollment.countDocuments({ 
      courseId: { $in: courseIds } 
    });

    // Get unique students enrolled in instructor's courses
    const enrollments = await Enrollment.find({ 
      courseId: { $in: courseIds } 
    }).distinct('userId');
    const totalStudents = enrollments.length;

    return NextResponse.json({
      statistics: {
        totalCourses,
        publishedCourses,
        draftCourses: totalCourses - publishedCourses,
        totalStudents,
        totalEnrollments,
      },
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching statistics:', error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

