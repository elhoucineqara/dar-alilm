'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchApi } from '../../../../lib/api-client';
import Link from 'next/link';

interface StudentDetails {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
}

interface CourseProgress {
  courseId: string;
  courseTitle: string;
  overallProgress: number;
  completedSections: number;
  totalSections: number;
  completedQuizzes: number;
  totalQuizzes: number;
  completedFinalExam: boolean;
  lastAccessedAt: string;
  enrolledAt: string;
}

export default function StudentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;
  const [student, setStudent] = useState<StudentDetails | null>(null);
  const [courses, setCourses] = useState<CourseProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentDetails();
  }, [studentId]);

  const fetchStudentDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetchApi(`/api/instructor/students/${studentId}`);

      if (res.ok) {
        const data = await res.json();
        setStudent(data.student);
        setCourses(data.courses);
      } else {
        console.error('Failed to fetch student details');
      }
    } catch (error) {
      console.error('Error fetching student details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'text-green-600 bg-green-100';
    if (progress >= 50) return 'text-blue-600 bg-blue-100';
    if (progress >= 25) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getProgressBarColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 25) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center py-12">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Student not found</h2>
          <Link
            href="/instructor/students"
            className="text-blue-600 hover:underline"
          >
            Back to students list
          </Link>
        </div>
    );
  }

  const averageProgress =
    courses.length > 0
      ? courses.reduce((sum, c) => sum + c.overallProgress, 0) / courses.length
      : 0;

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ← Back
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {student.firstName} {student.lastName}
            </h1>
            <p className="text-gray-600 mt-1">{student.email}</p>
          </div>
        </div>

        {/* Student Info Card */}
        <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-lg p-8 text-white">
          <div className="flex items-center gap-6 mb-6">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-3xl font-bold">
              {student.firstName[0]}{student.lastName[0]}
            </div>
            <div>
              <h2 className="text-2xl font-bold">
                {student.firstName} {student.lastName}
              </h2>
              <p className="text-blue-100">{student.email}</p>
              <p className="text-sm text-blue-100 mt-1">
                Member since {formatDate(student.createdAt)}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-3xl font-bold">{courses.length}</div>
              <div className="text-sm text-blue-100">Enrolled Courses</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-3xl font-bold">{Math.round(averageProgress)}%</div>
              <div className="text-sm text-blue-100">Average Progress</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-3xl font-bold">
                {courses.filter((c) => c.completedFinalExam).length}
              </div>
              <div className="text-sm text-blue-100">Completed Courses</div>
            </div>
          </div>
        </div>

        {/* Courses Progress */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Progress by Course</h2>
          </div>

          {courses.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">📚</div>
              <p className="text-gray-600">No enrolled courses</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {courses.map((course) => (
                <div key={course.courseId} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {course.courseTitle}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>
                          📖 Enrolled {formatDate(course.enrolledAt)}
                        </span>
                        <span>
                          🕐 Last activity: {formatDateTime(course.lastAccessedAt)}
                        </span>
                      </div>
                    </div>
                    <div
                      className={`px-4 py-2 rounded-full font-semibold ${getProgressColor(
                        course.overallProgress
                      )}`}
                    >
                      {Math.round(course.overallProgress)}%
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                    <div
                      className={`h-2 rounded-full transition-all ${getProgressBarColor(
                        course.overallProgress
                      )}`}
                      style={{ width: `${course.overallProgress}%` }}
                    ></div>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <div className="text-2xl font-bold text-blue-600">
                        {course.completedSections}/{course.totalSections}
                      </div>
                      <div className="text-xs text-gray-600">Sections</div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3">
                      <div className="text-2xl font-bold text-purple-600">
                        {course.completedQuizzes}/{course.totalQuizzes}
                      </div>
                      <div className="text-xs text-gray-600">Quizzes</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3">
                      <div className="text-2xl font-bold text-green-600">
                        {course.completedFinalExam ? '✓' : '○'}
                      </div>
                      <div className="text-xs text-gray-600">Final Exam</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
  );
}

