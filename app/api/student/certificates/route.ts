import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import Certificate from '@/models/Certificate';
import Course from '@/models/Course';
import User from '@/models/User';
import Progress from '@/models/Progress';
import { nanoid } from 'nanoid';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// GET - Fetch student's certificates
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    
    if (!token) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
    
    if (decoded.role !== 'student') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    await dbConnect();

    const certificates = await Certificate.find({ studentId: decoded.userId })
      .populate('courseId', 'title')
      .sort({ issuedAt: -1 });

    return NextResponse.json({ certificates }, { status: 200 });
  } catch (error) {
    console.error('Error fetching certificates:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST - Generate and store certificate
export async function POST(req: NextRequest) {
  try {
    console.log('=== CERTIFICATE API - START ===');
    
    const token = req.headers.get('authorization')?.split(' ')[1];
    
    if (!token) {
      console.log('No token provided');
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
    console.log('Decoded token:', decoded);
    
    if (decoded.role !== 'student') {
      console.log('Not a student role:', decoded.role);
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { courseId } = await req.json();
    console.log('Course ID:', courseId);

    if (!courseId) {
      console.log('No courseId provided');
      return NextResponse.json({ error: 'ID du cours requis' }, { status: 400 });
    }

    console.log('Connecting to database...');
    await dbConnect();
    console.log('Database connected');

    // Check if certificate already exists
    console.log('Checking for existing certificate...');
    const existingCertificate = await Certificate.findOne({
      studentId: decoded.userId,
      courseId,
    });

    if (existingCertificate) {
      console.log('Certificate already exists:', existingCertificate.certificateId);
      return NextResponse.json({ 
        certificate: existingCertificate,
        shareUrl: `/certificates/${existingCertificate.certificateId}`,
        message: 'Certificat déjà généré'
      }, { status: 200 });
    }

    // Verify student has completed the course
    console.log('Checking progress...');
    const progress = await Progress.findOne({
      userId: decoded.userId,
      courseId,
    });
    console.log('Progress found:', !!progress);
    console.log('Progress value:', progress?.overallProgress);

    if (!progress) {
      console.log('No progress found for this student/course');
      return NextResponse.json({ 
        error: 'Aucun progrès trouvé pour ce cours' 
      }, { status: 400 });
    }

    // Accept progress >= 100 (in case it was calculated as slightly more)
    if (progress.overallProgress < 100) {
      console.log('Course not completed. Progress:', progress.overallProgress);
      return NextResponse.json({ 
        error: `Vous devez compléter le cours à 100% pour obtenir le certificat. Progrès actuel: ${progress.overallProgress}%` 
      }, { status: 400 });
    }
    
    console.log('Progress check passed:', progress.overallProgress);

    // Get course and student details
    console.log('Fetching course and student...');
    const course = await Course.findById(courseId).populate('instructorId', 'firstName lastName');
    const student = await User.findById(decoded.userId);

    if (!course || !student) {
      console.log('Course or student not found');
      return NextResponse.json({ error: 'Cours ou étudiant introuvable' }, { status: 404 });
    }

    console.log('Course:', course.title);
    console.log('Student:', student.firstName, student.lastName);

    // Generate unique certificate ID
    const certificateId = nanoid(16);
    console.log('Generated certificate ID:', certificateId);

    // Create certificate
    console.log('Creating certificate...');
    const certificate = await Certificate.create({
      studentId: decoded.userId,
      courseId,
      certificateId,
      studentName: `${student.firstName} ${student.lastName}`,
      courseName: course.title,
      instructorName: typeof course.instructorId === 'object' 
        ? `${course.instructorId.firstName} ${course.instructorId.lastName}`
        : 'Dar Al-Ilm',
      score: 100, // Since course is 100% complete
      completionDate: progress.lastAccessedAt || new Date(),
    });

    console.log('Certificate created successfully:', certificate._id);
    console.log('=== CERTIFICATE API - END ===');

    return NextResponse.json({ 
      certificate,
      shareUrl: `/certificates/${certificateId}`,
      message: 'Certificat généré avec succès'
    }, { status: 201 });
  } catch (error) {
    console.error('=== CERTIFICATE API - ERROR ===');
    console.error('Error generating certificate:', error);
    return NextResponse.json({ error: 'Erreur serveur', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

