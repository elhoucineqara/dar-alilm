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

interface Module {
  _id: string;
  title: string;
  order: number;
  sections: Array<{
    _id: string;
    title: string;
    order: number;
    completed: boolean;
  }>;
  quiz: {
    _id: string;
    title: string;
    completed: boolean;
  } | null;
}

interface CourseProgress {
  progress: {
    overallProgress: number;
    completedSections: string[];
    completedQuizzes: string[];
    completedFinalExam: boolean;
    lastAccessedAt: string;
  };
  course: {
    _id: string;
    title: string;
    description: string;
    thumbnail?: string;
    category?: { name: string };
    instructor?: { firstName: string; lastName: string };
  };
  modules: Module[];
}

export default function ProgressPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [courseProgress, setCourseProgress] = useState<CourseProgress | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [courses, setCourses] = useState<Array<{ course: { _id: string; title: string; thumbnail?: string } }>>([]);
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
      const res = await fetch('/api/student/courses', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setCourses(data.courses || []);
        // Auto-select first course if available
        if (data.courses && data.courses.length > 0) {
          setSelectedCourseId(data.courses[0].course._id);
          fetchCourseProgress(data.courses[0].course._id, token);
        }
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchCourseProgress = async (courseId: string, token: string) => {
    try {
      setLoadingProgress(true);
      const res = await fetch(`/api/student/progress?courseId=${courseId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setCourseProgress(data);
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
    } finally {
      setLoadingProgress(false);
    }
  };

  const handleCourseSelect = (courseId: string) => {
    setSelectedCourseId(courseId);
    const token = localStorage.getItem('token');
    if (token) {
      fetchCourseProgress(courseId, token);
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
      pageTitle="Progression"
      pageSubtitle="Suivez votre progression détaillée dans chaque cours"
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Course List Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 p-4 sticky top-24">
              <h3 className="font-semibold text-gray-900 mb-4">Mes Cours</h3>
              {courses.length === 0 ? (
                <p className="text-sm text-gray-500">Aucun cours</p>
              ) : (
                <div className="space-y-2">
                  {courses.map((item) => (
                    <button
                      key={item.course._id}
                      onClick={() => handleCourseSelect(item.course._id)}
                      className={`w-full text-left p-3 rounded-lg transition-all ${
                        selectedCourseId === item.course._id
                          ? 'bg-blue-50 border-2 border-blue-500'
                          : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {item.course.thumbnail ? (
                          <img
                            src={item.course.thumbnail}
                            alt={item.course.title}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${
                            selectedCourseId === item.course._id ? 'text-blue-700' : 'text-gray-900'
                          }`}>
                            {item.course.title}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Progress Details */}
          <div className="lg:col-span-3">
            {loadingProgress ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8">
                <div className="animate-pulse space-y-4">
                  <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-64 bg-gray-200 rounded"></div>
                </div>
              </div>
            ) : courseProgress ? (
              <div className="space-y-6">
                {/* Course Header */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-start gap-4">
                    {courseProgress.course.thumbnail ? (
                      <img
                        src={courseProgress.course.thumbnail}
                        alt={courseProgress.course.title}
                        className="w-24 h-24 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                        <svg className="w-12 h-12 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                    )}
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">{courseProgress.course.title}</h2>
                      {courseProgress.course.category && (
                        <span className="inline-block px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 rounded mb-2">
                          {typeof courseProgress.course.category === 'object' 
                            ? courseProgress.course.category.name 
                            : courseProgress.course.category}
                        </span>
                      )}
                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Progression Globale</span>
                          <span className="text-lg font-bold text-gray-900">{courseProgress.progress.overallProgress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full transition-all ${
                              courseProgress.progress.overallProgress === 100 ? 'bg-green-500' : 'bg-blue-600'
                            }`}
                            style={{ width: `${courseProgress.progress.overallProgress}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modules Progress */}
                <div className="space-y-4">
                  {courseProgress.modules.map((module, moduleIndex) => {
                    const completedSections = module.sections.filter(s => s.completed).length;
                    const totalSections = module.sections.length;
                    const moduleProgress = totalSections > 0 
                      ? Math.round((completedSections / totalSections) * 100)
                      : 0;
                    const quizCompleted = module.quiz?.completed || false;

                    return (
                      <div key={module._id} className="bg-white rounded-xl border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                              {moduleIndex + 1}
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">{module.title}</h3>
                          </div>
                          <span className="text-sm font-medium text-gray-600">
                            {moduleProgress}% complété
                          </span>
                        </div>

                        {/* Sections */}
                        <div className="space-y-2 mb-4">
                          {module.sections.map((section) => (
                            <div
                              key={section._id}
                              className={`flex items-center gap-3 p-3 rounded-lg ${
                                section.completed
                                  ? 'bg-green-50 border border-green-200'
                                  : 'bg-gray-50 border border-gray-200'
                              }`}
                            >
                              <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                                section.completed
                                  ? 'bg-green-500 text-white'
                                  : 'bg-gray-300 text-gray-600'
                              }`}>
                                {section.completed ? (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                ) : (
                                  <span className="text-xs font-medium">{section.order}</span>
                                )}
                              </div>
                              <span className={`flex-1 text-sm ${
                                section.completed ? 'text-green-800 font-medium' : 'text-gray-700'
                              }`}>
                                {section.title}
                              </span>
                              {section.completed && (
                                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Quiz */}
                        {module.quiz && (
                          <div className={`mt-4 p-4 rounded-lg border-2 ${
                            quizCompleted
                              ? 'bg-green-50 border-green-300'
                              : 'bg-yellow-50 border-yellow-200'
                          }`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                  quizCompleted
                                    ? 'bg-green-500 text-white'
                                    : 'bg-yellow-400 text-white'
                                }`}>
                                  {quizCompleted ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  ) : (
                                    <span className="text-xs font-bold">?</span>
                                  )}
                                </div>
                                <span className={`font-medium ${
                                  quizCompleted ? 'text-green-800' : 'text-yellow-800'
                                }`}>
                                  {module.quiz.title}
                                </span>
                              </div>
                              {quizCompleted && (
                                <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded">
                                  Complété
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Final Exam */}
                {courseProgress.progress.completedFinalExam !== undefined && (
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          courseProgress.progress.completedFinalExam
                            ? 'bg-green-500 text-white'
                            : 'bg-purple-100 text-purple-600'
                        }`}>
                          {courseProgress.progress.completedFinalExam ? (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Examen Final</h3>
                          <p className="text-sm text-gray-600">
                            {courseProgress.progress.completedFinalExam
                              ? 'Examen complété avec succès'
                              : 'Examen final non complété'}
                          </p>
                        </div>
                      </div>
                      {courseProgress.progress.completedFinalExam && (
                        <span className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-semibold text-sm">
                          ✓ Complété
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <div className="flex justify-end">
                  <Link
                    href={`/dashboard/courses/${courseProgress.course._id}`}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
                  >
                    Continuer l'apprentissage
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <svg className="w-20 h-20 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Sélectionnez un cours</h3>
                <p className="text-gray-600">Choisissez un cours dans la liste pour voir votre progression détaillée</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}

