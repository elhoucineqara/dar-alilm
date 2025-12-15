import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Course from '@/models/Course';
import Module from '@/models/Module';
import Enrollment from '@/models/Enrollment';
import Progress from '@/models/Progress';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: studentId } = await params;

    await connectDB();

    // Get student details
    const student = await User.findById(studentId).select('-password');
    if (!student) {
      return NextResponse.json({ error: 'Étudiant non trouvé' }, { status: 404 });
    }

    // Get instructor's courses
    const instructorCourses = await Course.find({ instructorId: decoded.userId });
    const courseIds = instructorCourses.map((course) => course._id);

    // Get student's enrollments in instructor's courses
    const enrollments = await Enrollment.find({
      userId: studentId,
      courseId: { $in: courseIds },
    }).populate('courseId');

    // Get detailed progress for each course
    const coursesProgress = await Promise.all(
      enrollments.map(async (enrollment: any) => {
        const course = enrollment.courseId;
        const progress = await Progress.findOne({
          userId: studentId,
          courseId: course._id,
        });

        // Get course modules and count sections/quizzes
        const modules = await Module.find({ courseId: course._id });
        const totalSections = modules.reduce(
          (sum, module) => sum + (module.sections?.length || 0),
          0
        );
        const totalQuizzes = modules.reduce(
          (sum, module) => sum + (module.quizzes?.length || 0),
          0
        );

        return {
          courseId: course._id,
          courseTitle: course.title,
          overallProgress: progress?.overallProgress || 0,
          completedSections: progress?.completedSections?.length || 0,
          totalSections,
          completedQuizzes: progress?.completedQuizzes?.length || 0,
          totalQuizzes,
          completedFinalExam: progress?.completedFinalExam || false,
          lastAccessedAt: progress?.lastAccessedAt || enrollment.enrolledAt,
          enrolledAt: enrollment.enrolledAt,
        };
      })
    );

    return NextResponse.json({
      student: {
        _id: student._id,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        createdAt: student.createdAt,
      },
      courses: coursesProgress,
    });
  } catch (error: any) {
    console.error('Error fetching student details:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des détails de l\'étudiant' },
      { status: 500 }
    );
  }
}

