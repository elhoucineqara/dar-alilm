'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchApi, getFileUrl } from '@/lib/api-client';

interface Course {
  _id: string;
  title: string;
  description: string;
  categoryId: { _id: string; name: string } | string;
  price: number;
  thumbnail?: string;
  status: 'draft' | 'published';
  createdAt: string;
  updatedAt: string;
}

export default function CoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      router.push('/login');
      return;
    }

    fetchCourses(token);
  }, [router]);

  const fetchCourses = async (token: string) => {
    try {
      const res = await fetchApi('/api/instructor/courses', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setCourses(data.courses || []);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching courses:', error);
      setLoading(false);
    }
  };

  const handleDelete = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course?')) {
      return;
    }

    const token = localStorage.getItem('token');
    try {
      const res = await fetchApi(`/api/instructor/courses/${courseId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        setCourses(courses.filter(c => c._id !== courseId));
      } else {
        alert('Failed to delete course');
      }
    } catch (error) {
      console.error('Error deleting course:', error);
      alert('Error deleting course');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Courses</h1>
        <p className="text-gray-600">Manage your courses</p>
      </div>

      {/* All Courses Section */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">All Courses</h2>
        <Link
          href="/instructor/courses/create"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors shadow-md hover:shadow-lg"
        >
          + Create Course
        </Link>
      </div>

      {/* Courses Grid */}
      {courses.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md border border-gray-200">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No courses yet</h3>
          <p className="text-gray-600 mb-6">Create your first course to get started</p>
          <Link
            href="/instructor/courses/create"
            className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
          >
            + Create Course
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => (
            <div key={course._id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
              {course.thumbnail ? (
                <div className="w-full h-40 bg-white border-b border-gray-200 flex items-center justify-center overflow-hidden">
                  <img 
                    src={getFileUrl(course.thumbnail)} 
                    alt={course.title} 
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => {
                      console.error('Error loading course thumbnail:', getFileUrl(course.thumbnail));
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              ) : (
                <div className="w-full h-40 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                  <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-gray-900 mb-1 line-clamp-2">{course.title}</h3>
                    <p className="text-xs text-gray-500 mb-2">
                      {typeof course.categoryId === 'object' && course.categoryId ? course.categoryId.name : 'Uncategorized'}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded ${
                    course.status === 'published' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {course.status}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mb-3 line-clamp-2">{course.description}</p>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-bold text-blue-600">
                    ${course.price === 0 ? 'Free' : course.price.toFixed(2)}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(course.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex gap-2 pt-3 border-t border-gray-200">
                  <Link
                    href={`/instructor/courses/${course._id}/edit`}
                    className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-xs text-center transition-colors"
                  >
                    Edit
                  </Link>
                  <Link
                    href={`/instructor/courses/${course._id}/settings`}
                    className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-xs transition-colors"
                    title="Settings"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </Link>
                  <button
                    onClick={() => handleDelete(course._id)}
                    className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-xs transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
