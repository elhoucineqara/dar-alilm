import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';
import Course from '@/models/Course';
import Category from '@/models/Category';
import User from '@/models/User';
import Module from '@/models/Module';
import Section from '@/models/Section';
import Quiz from '@/models/Quiz';
import Question from '@/models/Question';
import Answer from '@/models/Answer';

// GET a single published course (public endpoint for free courses)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    await connectDB();
    
    // Ensure all models are registered before use
    if (!mongoose.models.Course) {
      require('@/models/Course');
    }
    if (!mongoose.models.Category) {
      require('@/models/Category');
    }
    if (!mongoose.models.User) {
      require('@/models/User');
    }
    if (!mongoose.models.Module) {
      require('@/models/Module');
    }
    if (!mongoose.models.Section) {
      require('@/models/Section');
    }
    if (!mongoose.models.Quiz) {
      require('@/models/Quiz');
    }
    if (!mongoose.models.Question) {
      require('@/models/Question');
    }
    if (!mongoose.models.Answer) {
      require('@/models/Answer');
    }

    // Handle both Promise and direct params for Next.js compatibility
    const resolvedParams = params instanceof Promise ? await params : params;
    const courseId = resolvedParams.id;

    // Find published course
    const course = await Course.findOne({ 
      _id: courseId, 
      status: 'published' 
    }).lean();
    
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Only allow access to free courses (price === 0) without authentication
    if (course.price !== 0 && course.price !== undefined && course.price !== null) {
      return NextResponse.json({ 
        error: 'This course requires authentication and payment' 
      }, { status: 403 });
    }

    // Load category manually
    let category = null;
    if (course.categoryId) {
      try {
        category = await Category.findById(course.categoryId)
          .select('name')
          .lean();
      } catch (error: any) {
        console.error('Error loading category:', error);
      }
    }

    // Load instructor manually
    let instructor = null;
    if (course.instructorId) {
      try {
        instructor = await User.findById(course.instructorId)
          .select('firstName lastName')
          .lean();
      } catch (error: any) {
        console.error('Error loading instructor:', error);
      }
    }

    // Load modules separately
    const modulesData = await Module.find({ courseId: courseId })
      .sort({ order: 1 })
      .lean();
    
    // Load sections and quizzes for each module manually
    const modules = await Promise.all(
      modulesData.map(async (module: any) => {
        let sections: any[] = [];
        let quiz: any = null;
        
        // Load sections manually
        if (module.sections && module.sections.length > 0) {
          try {
            sections = await Section.find({
              _id: { $in: module.sections }
            })
              .sort({ order: 1 })
              .lean();
          } catch (error: any) {
            console.error('Error loading sections:', error);
            sections = [];
          }
        }
        
        // Load quiz manually if exists
        if (module.quiz) {
          try {
            quiz = await Quiz.findById(module.quiz).lean();
            // Load questions for quiz if exists
            if (quiz && quiz.questions && quiz.questions.length > 0) {
              try {
                const questionsData = await Question.find({
                  _id: { $in: quiz.questions }
                })
                  .sort({ order: 1 })
                  .lean();
                
                // Load answers for each question manually
                const questions = await Promise.all(
                  questionsData.map(async (question: any) => {
                    if (question.answers && question.answers.length > 0) {
                      try {
                        const answers = await Answer.find({
                          _id: { $in: question.answers }
                        })
                          .sort({ order: 1 })
                          .lean();
                        return {
                          ...question,
                          answers
                        };
                      } catch (error: any) {
                        console.error('Error loading answers:', error);
                        return {
                          ...question,
                          answers: []
                        };
                      }
                    }
                    return {
                      ...question,
                      answers: []
                    };
                  })
                );
                
                quiz.questions = questions;
              } catch (error: any) {
                console.error('Error loading quiz questions:', error);
                quiz.questions = [];
              }
            }
          } catch (error: any) {
            console.error('Error loading quiz:', error);
            quiz = null;
          }
        }
        
        return {
          ...module,
          sections,
          quiz
        };
      })
    );

    // Load final exam if exists
    let finalExam = null;
    if (course.finalExam) {
      // Load quiz first
      finalExam = await Quiz.findById(course.finalExam).lean();
      
      // Load questions separately to avoid populate issues
      if (finalExam && finalExam.questions && finalExam.questions.length > 0) {
        try {
          const questionsData = await Question.find({ 
            _id: { $in: finalExam.questions } 
          })
            .sort({ order: 1 })
            .lean();
          
          // Load answers for each question manually
          const questions = await Promise.all(
            questionsData.map(async (question: any) => {
              if (question.answers && question.answers.length > 0) {
                try {
                  const answers = await Answer.find({
                    _id: { $in: question.answers }
                  })
                    .sort({ order: 1 })
                    .lean();
                  return {
                    ...question,
                    answers
                  };
                } catch (error: any) {
                  console.error('Error loading answers:', error);
                  return {
                    ...question,
                    answers: []
                  };
                }
              }
              return {
                ...question,
                answers: []
              };
            })
          );
          
          finalExam.questions = questions;
        } catch (error: any) {
          console.error('Error loading questions:', error);
          // If loading questions fails, return quiz without questions
          finalExam.questions = [];
        }
      }
    }

    // Combine course data with modules and final exam
    const courseWithModules = {
      ...course,
      categoryId: category,
      instructorId: instructor,
      modules,
      finalExam,
    };

    return NextResponse.json({ course: courseWithModules }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching course:', error);
    if (error.name === 'CastError') {
      return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

