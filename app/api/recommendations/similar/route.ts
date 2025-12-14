import { NextRequest, NextResponse } from 'next/server';

const RECOMMENDATION_SERVICE_URL = process.env.RECOMMENDATION_SERVICE_URL || 'http://localhost:8000';

/**
 * GET - Obtenir des cours similaires à un cours donné
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const limit = parseInt(searchParams.get('limit') || '5');

    if (!courseId) {
      return NextResponse.json({ error: 'courseId is required' }, { status: 400 });
    }

    // Appeler le service Python
    const response = await fetch(`${RECOMMENDATION_SERVICE_URL}/similar-courses/${courseId}?limit=${limit}`);

    if (!response.ok) {
      throw new Error('Recommendation service error');
    }

    const data = await response.json();
    
    return NextResponse.json({
      courseId: data.course_id,
      similarCourses: data.similar_courses,
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching similar courses:', error);
    return NextResponse.json({ error: 'Failed to get similar courses' }, { status: 500 });
  }
}

