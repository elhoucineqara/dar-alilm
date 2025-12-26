'use client';

import Link from 'next/link';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { fetchApi, getFileUrl } from '@/lib/api-client';

interface Course {
  _id: string;
  title: string;
  description: string;
  categoryId: {
    _id: string;
    name: string;
  } | string;
  instructorId: {
    _id: string;
    firstName: string;
    lastName: string;
    profileImage?: string;
  } | string;
  price: number;
  thumbnail?: string;
  status: 'draft' | 'published';
  createdAt: string;
}

interface Category {
  _id: string;
  name: string;
}

function CoursesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCourses, setTotalCourses] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const coursesPerPage = 12;

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    setIsAuthenticated(!!token);
    
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserRole(user.role);
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }

    // Get category from URL params
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }

    fetchCategories();
    fetchCourses();
  }, [searchParams]);

  useEffect(() => {
    fetchCourses();
  }, [selectedCategory, currentPage]);

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      // Fetch unique categories from published courses
      const res = await fetchApi('/api/courses?limit=1000');
      if (res.ok) {
        const data = await res.json();
        const uniqueCategories = new Map<string, Category>();
        (data.courses as Course[]).forEach((course: Course) => {
          if (typeof course.categoryId === 'object' && course.categoryId) {
            uniqueCategories.set(course.categoryId._id, course.categoryId);
          }
        });
        setCategories(Array.from(uniqueCategories.values()));
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchCourses = async () => {
    try {
      setLoadingCourses(true);
      const skip = (currentPage - 1) * coursesPerPage;
      const categoryId = selectedCategory !== 'all' ? selectedCategory : undefined;
      const queryParams = new URLSearchParams({
        limit: coursesPerPage.toString(),
        skip: skip.toString(),
      });
      if (categoryId) {
        queryParams.append('categoryId', categoryId);
      }

      const res = await fetchApi(`/api/courses?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setCourses(data.courses || []);
        setTotalCourses(data.total || 0);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoadingCourses(false);
    }
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setCurrentPage(1);
    // Update URL without reload
    if (categoryId === 'all') {
      router.push('/courses');
    } else {
      router.push(`/courses?category=${categoryId}`);
    }
  };

  const filteredCourses = searchQuery
    ? courses.filter(
        (course) =>
          course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          course.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : courses;

  const totalPages = Math.ceil(totalCourses / coursesPerPage);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2 sm:gap-4 lg:gap-8">
              <Link href="/" className="flex items-center gap-1 sm:gap-2">
                <img src="/logo.svg" alt="Dar Al-Ilm Logo" className="w-6 h-6 sm:w-7 sm:h-7" />
                <span className="text-base sm:text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  <span className="hidden sm:inline">Dar Al-Ilm</span>
                  <span className="sm:hidden">DAI</span>
                </span>
              </Link>
              <div className="hidden lg:flex items-center gap-6">
                <Link href="/" className="text-gray-700 hover:text-blue-600 font-medium transition-colors text-sm">
                  Home
                </Link>
                <Link href="/courses" className="text-blue-600 font-medium transition-colors text-sm">
                  Courses
                </Link>
                <Link href="/about" className="text-gray-700 hover:text-blue-600 font-medium transition-colors text-sm">
                  About
                </Link>
                <Link href="/contact" className="text-gray-700 hover:text-blue-600 font-medium transition-colors text-sm">
                  Contact
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <Link
                  href={userRole === 'admin' ? '/admin' : userRole === 'instructor' ? '/instructor' : '/dashboard'}
                  className="text-gray-700 hover:text-blue-600 font-medium px-4 py-2 rounded-lg hover:bg-blue-50 transition-all text-sm"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-gray-700 hover:text-blue-600 text-sm font-medium px-4 py-1.5 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all duration-300"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm px-5 py-1.5 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            All Courses
          </h1>
          <p className="text-gray-600">
            Discover our complete catalog of expert-led courses
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
              className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Category Filters */}
          {!loadingCategories && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleCategoryChange('all')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                All Categories
              </button>
              {categories.map((category: Category) => (
                <button
                  key={category._id}
                  onClick={() => handleCategoryChange(category._id)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    selectedCategory === category._id
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Courses Grid */}
        {loadingCourses ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-gray-100 rounded-xl h-80 animate-pulse"></div>
            ))}
          </div>
        ) : filteredCourses.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
              {filteredCourses.map((course) => {
                const categoryName =
                  typeof course.categoryId === 'object' && course.categoryId
                    ? course.categoryId.name
                    : 'Uncategorized';
                const instructor =
                  typeof course.instructorId === 'object' && course.instructorId
                    ? course.instructorId
                    : null;
                const instructorName = instructor
                  ? `${instructor.firstName} ${instructor.lastName}`
                  : 'Instructor';
                const instructorProfileImage = instructor?.profileImage;

                return (
                  <div
                    key={course._id}
                    className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1"
                  >
                    {course.thumbnail ? (
                      <div className="w-full h-40 bg-white border-b border-gray-200 flex items-center justify-center overflow-hidden">
                        <img
                          src={getFileUrl(course.thumbnail)}
                          alt={course.title}
                          className="max-w-full max-h-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-full h-40 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <svg
                          className="w-16 h-16 text-white opacity-50"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                          />
                        </svg>
                      </div>
                    )}
                    <div className="p-4">
                      <div className="mb-2">
                        <span className="text-xs text-blue-600 font-semibold">{categoryName}</span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{course.title}</h3>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{course.description}</p>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {instructorProfileImage ? (
                            <img
                              src={getFileUrl(instructorProfileImage)}
                              alt={instructorName}
                              className="w-6 h-6 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold">
                              {instructor ? instructor.firstName.charAt(0) : 'I'}
                            </div>
                          )}
                          <span className="text-xs text-gray-500">By {instructorName}</span>
                        </div>
                        <span className="text-lg font-bold text-blue-600">
                          ${course.price === 0 ? 'Free' : course.price.toFixed(2)}
                        </span>
                      </div>
                      <button
                        onClick={async (e) => {
                          e.preventDefault();
                          const token = localStorage.getItem('token');
                          const userStr = localStorage.getItem('user');

                          if (token && userStr) {
                            try {
                              const user = JSON.parse(userStr);
                              if (user.role === 'student') {
                                try {
                                  const enrollRes = await fetchApi('/api/student/enroll', {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json',
                                      Authorization: `Bearer ${token}`,
                                    },
                                    body: JSON.stringify({ courseId: course._id }),
                                  });

                                  if (!enrollRes.ok) {
                                    const errorData = await enrollRes.json();
                                    if (errorData.error === 'Already enrolled in this course') {
                                      router.push(`/dashboard/courses/${course._id}`);
                                      return;
                                    }
                                    console.error('Enrollment error:', errorData);
                                  } else {
                                    router.push(`/dashboard/courses/${course._id}`);
                                    return;
                                  }
                                } catch (enrollError) {
                                  console.error('Enrollment error:', enrollError);
                                }
                              }
                            } catch (parseError) {
                              console.error('Error parsing user:', parseError);
                            }
                          }

                          if (course.price === 0) {
                            router.push(`/courses/${course._id}`);
                          } else {
                            router.push('/login');
                          }
                        }}
                        className="block w-full text-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition-colors"
                      >
                        {isAuthenticated && userRole === 'student' ? 'Suivre le cours' : 'View Course'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {!searchQuery && totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <button
                  onClick={() => setCurrentPage((prev: number) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((prev: number) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">
              {searchQuery ? 'No courses found matching your search.' : 'No published courses available yet.'}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default function CoursesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading courses...</p>
        </div>
      </div>
    }>
      <CoursesContent />
    </Suspense>
  );
}

