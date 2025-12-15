import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Progress from '@/models/Progress';
import Enrollment from '@/models/Enrollment';
import Course from '@/models/Course';
import Module from '@/models/Module';
import Section from '@/models/Section';
import Quiz from '@/models/Quiz';
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

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');

    // Ensure models are registered
    if (!mongoose.models.Progress) { require('@/models/Progress'); }
    if (!mongoose.models.Enrollment) { require('@/models/Enrollment'); }
    if (!mongoose.models.Course) { require('@/models/Course'); }
    if (!mongoose.models.Module) { require('@/models/Module'); }
    if (!mongoose.models.Section) { require('@/models/Section'); }
    if (!mongoose.models.Quiz) { require('@/models/Quiz'); }

    if (courseId) {
      // Get progress for a specific course
      const progress = await Progress.findOne({
        userId: decoded.userId,
        courseId: courseId,
      }).lean();

      if (!progress) {
        return NextResponse.json({ error: 'Progress not found' }, { status: 404 });
      }

      // Get course details with modules
      const course = await Course.findById(courseId)
        .populate('categoryId', 'name')
        .populate('instructorId', 'firstName lastName')
        .lean();

      // Get modules with sections and quizzes
      const modules = await Module.find({ courseId: courseId })
        .sort({ order: 1 })
        .lean();

      const modulesWithProgress = await Promise.all(
        modules.map(async (module: any) => {
          // Get sections
          const sections = await Section.find({ moduleId: module._id })
            .sort({ order: 1 })
            .lean();

          // Get quiz if exists
          let quiz = null;
          if (module.quiz) {
            quiz = await Quiz.findById(module.quiz).lean();
          }

          // Check completion status
          const completedSections = sections.filter((section: any) =>
            progress.completedSections?.some((id: any) => id.toString() === section._id.toString())
          );

          const quizCompleted = quiz && progress.completedQuizzes?.some(
            (id: any) => id.toString() === quiz._id.toString()
          );

          return {
            ...module,
            sections: sections.map((section: any) => ({
              ...section,
              completed: progress.completedSections?.some(
                (id: any) => id.toString() === section._id.toString()
              ) || false,
            })),
            quiz: quiz ? {
              ...quiz,
              completed: quizCompleted || false,
            } : null,
          };
        })
      );

      return NextResponse.json({
        progress: {
          overallProgress: progress.overallProgress,
          completedSections: progress.completedSections,
          completedQuizzes: progress.completedQuizzes,
          completedFinalExam: progress.completedFinalExam,
          lastAccessedAt: progress.lastAccessedAt,
          moduleId: progress.moduleId,
          sectionId: progress.sectionId,
          quizId: progress.quizId,
        },
        course,
        modules: modulesWithProgress,
      }, { status: 200 });
    } else {
      // Get all progress for this student
      const allProgress = await Progress.find({ userId: decoded.userId })
        .populate('courseId', 'title thumbnail')
        .sort({ lastAccessedAt: -1 })
        .lean();

      return NextResponse.json({
        progress: allProgress,
      }, { status: 200 });
    }
  } catch (error: any) {
    console.error('Error fetching progress:', error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; role: string };
    
    if (decoded.role !== 'student') {
      return NextResponse.json({ error: 'Only students can update progress' }, { status: 403 });
    }

    const { courseId, moduleId, sectionId, quizId, completedFinalExam } = await request.json();

    if (!courseId) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
    }

    // Ensure models are registered
    if (!mongoose.models.Progress) { require('@/models/Progress'); }
    if (!mongoose.models.Course) { require('@/models/Course'); }
    if (!mongoose.models.Module) { require('@/models/Module'); }
    if (!mongoose.models.Section) { require('@/models/Section'); }
    if (!mongoose.models.Quiz) { require('@/models/Quiz'); }

    // Get or create progress
    let progress = await Progress.findOne({
      userId: decoded.userId,
      courseId: courseId,
    });

    if (!progress) {
      // Get enrollment
      const enrollment = await Enrollment.findOne({
        userId: decoded.userId,
        courseId: courseId,
      });

      if (!enrollment) {
        return NextResponse.json({ error: 'Not enrolled in this course' }, { status: 400 });
      }

      progress = await Progress.create({
        userId: decoded.userId,
        courseId: courseId,
        enrollmentId: enrollment._id,
        completedSections: [],
        completedQuizzes: [],
        completedFinalExam: false,
        overallProgress: 0,
      });
    }

    // Update last accessed location
    if (moduleId) {
      progress.moduleId = moduleId;
    }
    if (sectionId) {
      progress.sectionId = sectionId;
      progress.quizId = undefined; // Clear quizId when viewing a section
      // Mark section as completed if not already
      if (!progress.completedSections.includes(sectionId)) {
        progress.completedSections.push(sectionId);
      }
    }
    if (quizId) {
      progress.quizId = quizId;
      progress.sectionId = undefined; // Clear sectionId when viewing a quiz
      // Mark quiz as completed if not already
      if (!progress.completedQuizzes.includes(quizId)) {
        progress.completedQuizzes.push(quizId);
      }
    }

    if (completedFinalExam !== undefined) {
      progress.completedFinalExam = completedFinalExam;
      if (completedFinalExam) {
        progress.quizId = undefined; // Clear quizId when final exam is completed
      }
    }

    // Calculate overall progress
    const course = await Course.findById(courseId).lean();
    const modules = await Module.find({ courseId: courseId }).lean();
    
    let totalSections = 0;
    let totalQuizzes = 0;
    let completedSectionsCount = progress.completedSections.length;
    let completedQuizzesCount = progress.completedQuizzes.length;

    for (const module of modules) {
      const sections = await Section.countDocuments({ moduleId: module._id });
      totalSections += sections;
      
      if (module.quiz) {
        totalQuizzes += 1;
      }
    }

    // Add final exam to quizzes count
    if (course?.finalExam) {
      totalQuizzes += 1;
      if (progress.completedFinalExam) {
        completedQuizzesCount += 1;
      }
    }

    const totalItems = totalSections + totalQuizzes;
    const completedItems = completedSectionsCount + completedQuizzesCount;
    
    progress.overallProgress = totalItems > 0 
      ? Math.round((completedItems / totalItems) * 100) 
      : 0;

    progress.lastAccessedAt = new Date();
    await progress.save();

    // Update enrollment status if course is completed
    if (progress.overallProgress === 100) {
      const enrollment = await Enrollment.findOne({
        userId: decoded.userId,
        courseId: courseId,
      });
      
      if (enrollment && enrollment.status === 'active') {
        enrollment.status = 'completed';
        enrollment.completedAt = new Date();
        await enrollment.save();
      }
    }

    return NextResponse.json({ 
      message: 'Progress updated successfully',
      progress 
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating progress:', error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

