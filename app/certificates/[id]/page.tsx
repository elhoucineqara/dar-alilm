'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Certificate {
  _id: string;
  certificateId: string;
  studentName: string;
  courseName: string;
  instructorName: string;
  score: number;
  completionDate: string;
  issuedAt: string;
}

export default function PublicCertificatePage() {
  const params = useParams();
  const certificateId = params.id as string;
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        const res = await fetch(`/api/certificates/${certificateId}`);
        const data = await res.json();

        if (res.ok) {
          setCertificate(data.certificate);
        } else {
          setError(data.error || 'Certificat introuvable');
        }
      } catch (err) {
        setError('Erreur lors du chargement du certificat');
      } finally {
        setLoading(false);
      }
    };

    if (certificateId) {
      fetchCertificate();
    }
  }, [certificateId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading certificate...</p>
        </div>
      </div>
    );
  }

  if (error || !certificate) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Certificate Not Found</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const completionDate = new Date(certificate.completionDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Actions - Hide on print */}
        <div className="no-print mb-8 flex justify-center">
          <Link
            href="/"
            className="px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-300 rounded-lg font-semibold transition-all flex items-center gap-2"
          >
            Back to Home
          </Link>
        </div>

        {/* Certificate */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-10 border-8 border-gray-100">
          {/* Header */}
          <div className="text-center mb-6 border-b-4 border-blue-600 pb-4">
            <div className="text-5xl mb-3">🎓</div>
            <h1 className="text-3xl sm:text-4xl font-bold text-blue-600 mb-2">
              Certificate of Achievement
            </h1>
            <p className="text-lg text-purple-600 font-semibold">
              Dar Al-Ilm
            </p>
          </div>

          {/* Body */}
          <div className="text-center space-y-4">
            <div className="inline-block px-6 py-2 bg-green-100 text-green-700 rounded-full font-bold text-lg">
              ✓ CERTIFIED
            </div>

            <div>
              <p className="text-gray-600 text-base mb-2">This certificate is awarded to</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-4">
                {certificate.studentName}
              </h2>
            </div>

            <div>
              <p className="text-gray-600 text-base mb-2">for successfully completing the course</p>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">
                {certificate.courseName}
              </h3>
            </div>

            {/* Details */}
            <div className="flex justify-center gap-12 py-4">
              <div className="text-center">
                <p className="text-gray-600 font-semibold mb-1 text-sm">Final Score</p>
                <p className="text-2xl font-bold text-green-600">{certificate.score}%</p>
              </div>
              <div className="w-px bg-gray-300"></div>
              <div className="text-center">
                <p className="text-gray-600 font-semibold mb-1 text-sm">Date</p>
                <p className="text-lg font-semibold text-gray-800">{completionDate}</p>
              </div>
            </div>

            <div className="text-gray-600 text-sm">
              <p>Instructor: <span className="font-semibold">{certificate.instructorName}</span></p>
            </div>

            {/* Decorative lines */}
            <div className="flex justify-center gap-4 pt-4">
              <div className="w-16 h-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded"></div>
              <div className="w-16 h-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded"></div>
              <div className="w-16 h-1 bg-gradient-to-r from-pink-600 to-red-600 rounded"></div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t-4 border-blue-600 text-center">
            <p className="text-gray-600 text-sm">
              🏆 This certificate attests to your achievement and can be added to your professional profile
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Verification ID: {certificate.certificateId}
            </p>
          </div>
        </div>

        {/* Verification Notice */}
        <div className="no-print mt-8 text-center">
          <p className="text-sm text-gray-600">
            This certificate is authentic and can be verified at:<br />
            <span className="font-mono text-blue-600">
              {typeof window !== 'undefined' ? window.location.href : ''}
            </span>
          </p>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: white;
            margin: 0;
            padding: 0;
          }
          * {
            page-break-inside: avoid;
            page-break-before: avoid;
            page-break-after: avoid;
          }
          .max-w-4xl {
            max-width: 100%;
            padding: 0.5rem;
          }
          h1 {
            font-size: 1.75rem !important;
          }
          h2 {
            font-size: 1.5rem !important;
          }
          h3 {
            font-size: 1.25rem !important;
          }
          .space-y-4 > * + * {
            margin-top: 0.5rem !important;
          }
        }
      `}</style>
    </div>
  );
}

