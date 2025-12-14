import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const RECOMMENDATION_SERVICE_URL = process.env.RECOMMENDATION_SERVICE_URL || 'http://localhost:8000';

/**
 * GET - Obtenir des recommandations pour l'utilisateur connecté
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; role: string };
    
    // Seuls les étudiants peuvent recevoir des recommandations
    if (decoded.role !== 'student') {
      return NextResponse.json({ error: 'Only students can receive recommendations' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const excludeCourses = searchParams.get('exclude')?.split(',') || [];

    // Appeler le service Python de recommandation
    const response = await fetch(`${RECOMMENDATION_SERVICE_URL}/recommendations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: decoded.userId,
        limit: limit,
        exclude_courses: excludeCourses,
      }),
    });

    if (!response.ok) {
      throw new Error('Recommendation service error');
    }

    const data = await response.json();
    
    return NextResponse.json({
      recommendations: data.recommendations,
      count: data.count,
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching recommendations:', error);
    
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    return NextResponse.json({ error: 'Failed to get recommendations' }, { status: 500 });
  }
}

/**
 * POST - Enregistrer une interaction utilisateur
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; role: string };
    
    const body = await request.json();
    const { courseId, interactionType, rating } = body;

    if (!courseId || !interactionType) {
      return NextResponse.json({ error: 'courseId and interactionType are required' }, { status: 400 });
    }

    // Appeler le service Python pour enregistrer l'interaction
    const response = await fetch(`${RECOMMENDATION_SERVICE_URL}/interactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: decoded.userId,
        course_id: courseId,
        interaction_type: interactionType,
        rating: rating || null,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to record interaction');
    }

    return NextResponse.json({ message: 'Interaction recorded successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error recording interaction:', error);
    
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    return NextResponse.json({ error: 'Failed to record interaction' }, { status: 500 });
  }
}

