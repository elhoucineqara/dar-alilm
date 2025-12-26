'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchApi } from '@/lib/api-client';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface Statistics {
  totalCourses: number;
  publishedCourses: number;
  draftCourses: number;
  totalStudents: number;
  totalEnrollments: number;
}

interface Course {
  _id: string;
  title: string;
  description: string;
  categoryId: string | { name: string };
  price: number;
  status: 'draft' | 'published';
  createdAt: string;
  updatedAt: string;
}

export default function InstructorPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<Statistics>({
    totalCourses: 0,
    publishedCourses: 0,
    draftCourses: 0,
    totalStudents: 0,
    totalEnrollments: 0,
  });
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        const cachedUser = localStorage.getItem('user');
        
        if (!token) {
          router.push('/login');
          return;
        }

        // Use cached user data immediately if available
        if (cachedUser) {
          try {
            const parsedUser = JSON.parse(cachedUser);
            if (parsedUser.role === 'instructor') {
              setUser(parsedUser);
              setLoading(false);
              // Fetch data in background
              fetchStatistics(token);
              fetchCourses(token);
            }
          } catch (e) {
            // Invalid cache
          }
        }

        const res = await fetchApi('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          if (data.user.role !== 'instructor') {
            router.push('/dashboard');
            return;
          }
          setUser(data.user);
          localStorage.setItem('user', JSON.stringify(data.user));
          setLoading(false);
          if (!cachedUser) {
            fetchStatistics(token);
            fetchCourses(token);
          }
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          router.push('/login');
        }
      } catch (error) {
        console.error('Error:', error);
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

  const fetchStatistics = async (token: string) => {
    try {
      const res = await fetchApi('/api/instructor/statistics', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setStatistics(data.statistics || data);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

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
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="p-4 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, <span className="text-blue-600">{user.firstName}</span>!
        </h1>
        <p className="text-gray-600">
          Here's what's happening with your courses today
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-md border border-blue-200 p-6 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center shadow-md">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          </div>
          <div>
            <p className="text-sm text-blue-700 font-medium mb-1">Total Courses</p>
            <p className="text-3xl font-bold text-blue-900 mb-2">{statistics.totalCourses}</p>
            <p className="text-xs text-blue-600">
              {statistics.publishedCourses} published, {statistics.draftCourses} draft
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow-md border border-purple-200 p-6 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center shadow-md">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
          <div>
            <p className="text-sm text-purple-700 font-medium mb-1">Total Students</p>
            <p className="text-3xl font-bold text-purple-900 mb-2">{statistics.totalStudents}</p>
            <p className="text-xs text-purple-600">Enrolled students</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-md border border-green-200 p-6 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center shadow-md">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div>
            <p className="text-sm text-green-700 font-medium mb-1">Total Enrollments</p>
            <p className="text-3xl font-bold text-green-900 mb-2">{statistics.totalEnrollments}</p>
            <p className="text-xs text-green-600">Course enrollments</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <h2 className="text-lg font-bold text-gray-900">Quick Actions</h2>
          </div>
          <div className="space-y-3">
            <Link
              href="/instructor/courses/create"
              className="block w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors text-center"
            >
              + Create New Course
            </Link>
            <Link
              href="/instructor/courses"
              className="block w-full bg-white text-gray-700 px-6 py-3 rounded-lg font-medium border border-gray-300 hover:bg-gray-50 transition-colors text-center"
            >
              📚 View All Courses
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-lg font-bold text-gray-900">Recent Activity</h2>
          </div>
          <div className="text-center py-8">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-500 text-sm">No recent activity</p>
            <p className="text-gray-400 text-xs mt-1">Your activity will appear here</p>
          </div>
        </div>
      </div>
    </div>
  );
}
