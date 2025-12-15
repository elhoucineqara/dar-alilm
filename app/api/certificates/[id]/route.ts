import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Certificate from '@/models/Certificate';

// GET - Fetch public certificate by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('=== PUBLIC CERTIFICATE API ===');
    const { id } = await params;
    console.log('Certificate ID:', id);

    await dbConnect();
    console.log('Database connected');

    const certificate = await Certificate.findOne({ certificateId: id });
    console.log('Certificate found:', !!certificate);
    
    if (certificate) {
      console.log('Certificate details:', {
        _id: certificate._id,
        studentName: certificate.studentName,
        courseName: certificate.courseName,
      });
    } else {
      console.log('No certificate found with ID:', id);
      
      // Check if any certificates exist at all
      const count = await Certificate.countDocuments();
      console.log('Total certificates in database:', count);
      
      // Show a sample certificate ID if any exist
      if (count > 0) {
        const sample = await Certificate.findOne().select('certificateId');
        console.log('Sample certificate ID in database:', sample?.certificateId);
      }
    }

    if (!certificate) {
      return NextResponse.json({ error: 'Certificat introuvable' }, { status: 404 });
    }

    return NextResponse.json({ certificate }, { status: 200 });
  } catch (error) {
    console.error('=== PUBLIC CERTIFICATE API ERROR ===');
    console.error('Error fetching certificate:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

