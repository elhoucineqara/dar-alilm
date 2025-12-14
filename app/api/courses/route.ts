import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';
import Course from '@/models/Course';
import Category from '@/models/Category';
import User from '@/models/User';

// GET all published courses (public endpoint)
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Ensure all models are registered before use
    // In production, models might not be registered yet, so we force registration
    if (!mongoose.models.Course) {
      require('@/models/Course');
    }
    if (!mongoose.models.Category) {
      require('@/models/Category');
    }
    if (!mongoose.models.User) {
      require('@/models/User');
    }

    // Get query parameters for pagination and filtering
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '12');
    const skip = parseInt(searchParams.get('skip') || '0');
    const categoryId = searchParams.get('categoryId');

    // Build query
    const query: any = { status: 'published' };
    if (categoryId) {
      query.categoryId = categoryId;
    }

    // Fetch courses without populate to avoid schema registration issues
    const coursesData = await Course.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    // Load category and instructor data manually
    const courses = await Promise.all(
      coursesData.map(async (course: any) => {
        let category = null;
        let instructor = null;

        // Load category if exists
        if (course.categoryId) {
          try {
            category = await Category.findById(course.categoryId)
              .select('name')
              .lean();
          } catch (error: any) {
            console.error('Error loading category:', error);
          }
        }

        // Load instructor if exists
        if (course.instructorId) {
          try {
            instructor = await User.findById(course.instructorId)
              .select('firstName lastName')
              .lean();
          } catch (error: any) {
            console.error('Error loading instructor:', error);
          }
        }

        return {
          ...course,
          categoryId: category,
          instructorId: instructor,
        };
      })
    );

    // Get total count for pagination
    const total = await Course.countDocuments(query);

    return NextResponse.json({ 
      courses,
      total,
      limit,
      skip
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching published courses:', error);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
    });
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

