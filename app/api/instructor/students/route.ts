import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Course from '@/models/Course';
import Enrollment from '@/models/Enrollment';
import Progress from '@/models/Progress';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(req: NextRequest) {
  try {
    // Verify token
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded.role !== 'instructor') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    await connectDB();

    // Get courseId from query params
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');

    let query: any = { instructorId: decoded.userId };
    
    // Get instructor's courses
    const instructorCourses = await Course.find(query).select('_id');
    const courseIds = instructorCourses.map((course) => course._id);

    // Build enrollment query
    let enrollmentQuery: any = { courseId: { $in: courseIds } };
    if (courseId && courseId !== 'all') {
      enrollmentQuery.courseId = courseId;
    }

    // Get all enrollments for instructor's courses
    const enrollments = await Enrollment.find(enrollmentQuery).populate('userId');

    // Get unique students
    const studentIds = [...new Set(enrollments.map((e: any) => e.userId._id.toString()))];

    // Get student details with progress
    const studentsData = await Promise.all(
      studentIds.map(async (studentId) => {
        const student = await User.findById(studentId);
        if (!student) return null;

        // Get student's enrollments in instructor's courses
        const studentEnrollments = enrollments.filter(
          (e: any) => e.userId._id.toString() === studentId
        );

        // Get progress for all enrolled courses
        const progressData = await Promise.all(
          studentEnrollments.map(async (enrollment: any) => {
            const progress = await Progress.findOne({
              userId: studentId,
              courseId: enrollment.courseId,
            });
            return progress?.overallProgress || 0;
          })
        );

        // Calculate average progress
        const totalProgress =
          progressData.length > 0
            ? progressData.reduce((sum, p) => sum + p, 0) / progressData.length
            : 0;

        // Get last activity
        const lastProgress = await Progress.findOne({ userId: studentId })
          .sort({ lastAccessedAt: -1 })
          .select('lastAccessedAt');

        return {
          _id: student._id,
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email,
          enrolledCourses: studentEnrollments.length,
          totalProgress: Math.round(totalProgress),
          lastActive: lastProgress?.lastAccessedAt || student.createdAt,
        };
      })
    );

    // Filter out null values and sort by name
    const students = studentsData
      .filter((s) => s !== null)
      .sort((a: any, b: any) =>
        `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
      );

    return NextResponse.json({ students });
  } catch (error: any) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des étudiants' },
      { status: 500 }
    );
  }
}

