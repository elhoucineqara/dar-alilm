'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import StudentLayout from '../../components/StudentLayout';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface Course {
  enrollment: {
    _id: string;
    enrolledAt: string;
    status: string;
    completedAt?: string;
  };
  course: {
    _id: string;
    title: string;
    description: string;
    thumbnail?: string;
    price: number;
    category?: { name: string };
    instructor?: { firstName: string; lastName: string };
  };
  progress: {
    overallProgress: number;
    completedSections: number;
    completedQuizzes: number;
    completedFinalExam: boolean;
    lastAccessedAt: string;
  } | null;
}

export default function MyCoursesPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    // Fetch user info
    fetch('/api/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          router.push('/login');
          return;
        }
        return res.json();
      })
      .then((data) => {
        if (data) {
          setUser(data.user);
          if (data.user.role !== 'student') {
            if (data.user.role === 'instructor') {
              router.push('/instructor');
            } else if (data.user.role === 'admin') {
              router.push('/admin');
            }
            return;
          }
          fetchCourses(token);
        }
        setLoading(false);
      })
      .catch(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
      });
  }, [router]);

  const fetchCourses = async (token: string) => {
    try {
      setLoadingCourses(true);
      const res = await fetch('/api/student/courses', {
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
    } finally {
      setLoadingCourses(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const filteredCourses = courses.filter((item) => {
    if (filter === 'active') {
      return item.enrollment.status === 'active' && (!item.progress || item.progress.overallProgress < 100);
    }
    if (filter === 'completed') {
      return item.enrollment.status === 'completed' || (item.progress && item.progress.overallProgress === 100);
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'student') {
    return null;
  }

  return (
    <StudentLayout
      user={user}
      sidebarOpen={sidebarOpen}
      setSidebarOpen={setSidebarOpen}
      showProfileDropdown={showProfileDropdown}
      setShowProfileDropdown={setShowProfileDropdown}
      dropdownRef={dropdownRef}
      onProfileClick={() => router.push('/dashboard/profile')}
      onSettingsClick={() => router.push('/dashboard/settings')}
      onLogout={handleLogout}
      pageTitle="Mes Cours"
      pageSubtitle="Gérez vos cours et suivez votre progression"
    >
      <div className="max-w-7xl mx-auto">
        {/* Filter Tabs */}
        <div className="mb-6 flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
              filter === 'all'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Tous ({courses.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
              filter === 'active'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            En Cours ({courses.filter(c => c.enrollment.status === 'active' && (!c.progress || c.progress.overallProgress < 100)).length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
              filter === 'completed'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Complétés ({courses.filter(c => c.enrollment.status === 'completed' || (c.progress && c.progress.overallProgress === 100)).length})
          </button>
        </div>

        {/* Courses Grid */}
        {loadingCourses ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-lg overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-200"></div>
                <div className="p-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((item) => (
              <Link
                key={item.enrollment._id}
                href={`/dashboard/courses/${item.course._id}`}
                className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all"
              >
                {item.course.thumbnail ? (
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={item.course.thumbnail}
                      alt={item.course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {item.enrollment.status === 'completed' && (
                      <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Complété
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-48 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center relative">
                    <svg className="w-16 h-16 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    {item.enrollment.status === 'completed' && (
                      <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Complété
                      </div>
                    )}
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors flex-1">
                      {item.course.title}
                    </h3>
                  </div>
                  
                  {item.course.category && (
                    <span className="inline-block px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded mb-2">
                      {typeof item.course.category === 'object' ? item.course.category.name : item.course.category}
                    </span>
                  )}

                  {item.course.instructor && (
                    <p className="text-xs text-gray-500 mb-3">
                      Par {typeof item.course.instructor === 'object' 
                        ? `${item.course.instructor.firstName} ${item.course.instructor.lastName}`
                        : item.course.instructor}
                    </p>
                  )}

                  {item.progress && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-600">Progression</span>
                        <span className="text-xs font-semibold text-gray-900">{item.progress.overallProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            item.progress.overallProgress === 100 ? 'bg-green-500' : 'bg-blue-600'
                          }`}
                          style={{ width: `${item.progress.overallProgress}%` }}
                        ></div>
                      </div>
                      <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                        <span>{item.progress.completedSections} sections</span>
                        <span>{item.progress.completedQuizzes} quizzes</span>
                      </div>
                    </div>
                  )}

                  {!item.progress && (
                    <div className="mt-4">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-gray-300 h-2 rounded-full" style={{ width: '0%' }}></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Pas encore commencé</p>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Inscrit le {new Date(item.enrollment.enrolledAt).toLocaleDateString('fr-FR')}</span>
                      {item.progress && (
                        <span>Dernière visite: {new Date(item.progress.lastAccessedAt).toLocaleDateString('fr-FR')}</span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <svg className="w-20 h-20 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {filter === 'active' 
                ? 'Aucun cours en cours'
                : filter === 'completed'
                ? 'Aucun cours complété'
                : 'Aucun cours trouvé'}
            </h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all'
                ? "Vous n'êtes inscrit à aucun cours pour le moment"
                : filter === 'active'
                ? "Vous n'avez pas de cours en cours d'apprentissage"
                : "Vous n'avez pas encore complété de cours"}
            </p>
            {filter === 'all' && (
              <Link
                href="/"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Explorer les cours
              </Link>
            )}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}

