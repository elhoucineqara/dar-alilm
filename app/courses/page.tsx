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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
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

  const handleDashboardClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (userRole === 'admin') {
      router.push('/admin');
    } else if (userRole === 'instructor') {
      router.push('/instructor/dashboard');
    } else {
      router.push('/student/dashboard');
    }
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setCurrentPage(1);
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
    <div className="min-h-screen bg-[#f8fafc] custom-bg-pattern relative">
      {/* Premium Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-blue-100/30 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-purple-100/30 rounded-full blur-[120px]"></div>
      </div>

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-12">
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
                <Link href="/courses" className="text-blue-600 font-bold transition-colors text-sm">
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
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 text-gray-700 hover:text-blue-600 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Toggle menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
              
              {/* Desktop Auth Buttons */}
              <div className="hidden lg:flex items-center gap-3">
                {isAuthenticated ? (
                  <Link
                    href={userRole === 'admin' ? '/admin' : userRole === 'instructor' ? '/instructor' : '/dashboard'}
                    onClick={handleDashboardClick}
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

              {/* Mobile Auth Buttons (when menu closed) */}
              {!mobileMenuOpen && (
                <div className="lg:hidden flex items-center gap-2">
                  {isAuthenticated ? (
                    <Link
                      href={userRole === 'admin' ? '/admin' : userRole === 'instructor' ? '/instructor' : '/dashboard'}
                      onClick={handleDashboardClick}
                      className="text-gray-700 hover:text-blue-600 text-xs font-medium px-2 py-1 rounded hover:bg-blue-50 transition-all"
                    >
                      Dashboard
                    </Link>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        className="text-gray-700 hover:text-blue-600 text-xs font-medium px-2 py-1 rounded border border-gray-200 hover:border-blue-400 transition-all"
                      >
                        Login
                      </Link>
                      <Link
                        href="/register"
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 rounded font-semibold transition-all"
                      >
                        Start
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden border-t border-gray-200 py-4 mt-2">
              <div className="flex flex-col space-y-3">
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-gray-700 hover:text-blue-600 font-medium px-2 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Home
                </Link>
                <Link
                  href="/courses"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-blue-600 font-bold px-2 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Courses
                </Link>
                <Link
                  href="/about"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-gray-700 hover:text-blue-600 font-medium px-2 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  About
                </Link>
                <Link
                  href="/contact"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-gray-700 hover:text-blue-600 font-medium px-2 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Contact
                </Link>
                {!isAuthenticated && (
                  <div className="pt-2 border-t border-gray-200 flex flex-col gap-2">
                    <Link
                      href="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-gray-700 hover:text-blue-600 font-medium px-2 py-2 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all text-center"
                    >
                      Login
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-2 py-2 rounded-lg text-center transition-all"
                    >
                      Get Started
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-12 overflow-hidden z-10">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-5xl sm:text-6xl font-black text-slate-900 tracking-tight leading-[1.1] mb-6">
              Empower your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">future today</span>
            </h1>
            <p className="text-lg text-slate-500 font-medium leading-relaxed max-w-xl">
              Discover curated masterclasses from industry experts. Level up your skills with real-world projects and a global community.
            </p>
          </div>
        </div>
      </section>

      {/* Toolbar & Content Area */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-40">
        {/* Search and Filters Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 bg-white/40 backdrop-blur-md p-4 rounded-[2.5rem] border border-white/50 shadow-sm relative z-50">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
            {/* Search Input */}
            <div className="relative w-full max-w-sm group">
              <input
                type="text"
                placeholder="What do you want to learn?"
                value={searchQuery}
                onChange={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all shadow-sm group-hover:border-blue-300"
              />
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Category Dropdown */}
            <div className="relative">
              <button
                onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:border-blue-300 hover:bg-gray-50 transition-all shadow-sm min-w-[180px] justify-between"
              >
                <span>
                  {selectedCategory === 'all' 
                    ? 'All Categories' 
                    : categories.find((c: Category) => c._id === selectedCategory)?.name || 'All Categories'}
                </span>
                <svg 
                  className={`w-5 h-5 text-gray-400 transition-transform ${categoryDropdownOpen ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {categoryDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setCategoryDropdownOpen(false)}
                  ></div>
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-80 overflow-y-auto">
                    <div className="p-2">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleCategoryChange('all');
                          setCategoryDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                          selectedCategory === 'all' 
                            ? 'bg-blue-600 text-white' 
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        All Courses
                      </button>
                      {!loadingCategories && categories.map((category: Category) => (
                        <button
                          key={category._id}
                          onClick={(e) => {
                            e.preventDefault();
                            handleCategoryChange(category._id);
                            setCategoryDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                            selectedCategory === category._id 
                              ? 'bg-blue-600 text-white' 
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {category.name}
                        </button>
                      ))}
                      {loadingCategories && (
                        <div className="p-2 space-y-1">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse"></div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <main>
          {loadingCourses ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="bg-white/50 backdrop-blur-md rounded-[2.5rem] h-[400px] animate-pulse border border-white/50 shadow-sm"></div>
              ))}
            </div>
          ) : (
            <>
              {filteredCourses.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {filteredCourses.map((course) => {
                    const instructor = typeof course.instructorId === 'object' && course.instructorId ? course.instructorId : null;
                    const instructorName = instructor ? `${instructor.firstName} ${instructor.lastName}` : 'Instructor';
                    const instructorProfileImage = instructor?.profileImage;

                    return (
                      <div
                        key={course._id}
                        className="group flex flex-col bg-white rounded-[2.5rem] border-2 border-slate-100/50 overflow-hidden hover:border-blue-500/50 hover:shadow-[0_40px_80px_-20px_rgba(59,130,246,0.3)] hover:-translate-y-2 transition-all duration-700 ease-out"
                      >
                        {/* Thumbnail Container */}
                        <div className="aspect-video bg-slate-50/50 flex items-center justify-center p-4 relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                          {course.thumbnail ? (
                            <img
                              src={getFileUrl(course.thumbnail)}
                              alt={course.title}
                              className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-1000 ease-out"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
                              <svg className="w-12 h-12 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                              </svg>
                            </div>
                          )}
                        </div>

                        {/* Content area */}
                        <div className="p-5 flex flex-col flex-1">
                          <h3 className="text-base font-black text-slate-900 leading-tight group-hover:text-blue-600 transition-colors line-clamp-2 mb-3 min-h-[3rem]">
                            {course.title}
                          </h3>
                          <p className="text-slate-400 text-xs font-medium line-clamp-2 mb-8 leading-relaxed">
                            {course.description}
                          </p>

                          {/* Footer - Instructor & View */}
                          <div className="mt-auto space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 min-w-0">
                                  {instructorProfileImage ? (
                                    <img src={getFileUrl(instructorProfileImage)} alt={instructorName} className="w-7 h-7 rounded-full object-cover shrink-0 ring-2 ring-white shadow-sm" />
                                  ) : (
                                    <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-[10px] shrink-0 ring-2 ring-white shadow-sm">
                                      {instructor ? instructor.firstName.charAt(0) : 'I'}
                                    </div>
                                  )}
                                  <span className="text-xs font-bold text-slate-600 truncate">{instructorName}</span>
                                </div>
                                
                                <span className={`text-sm font-black px-3 py-1 rounded-full ${course.price === 0 ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                                  {course.price === 0 ? 'FREE' : `$${course.price.toFixed(1)}`}
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
                                          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                          body: JSON.stringify({ courseId: course._id }),
                                        });
                                        if (!enrollRes.ok) {
                                          const errorData = await enrollRes.json();
                                          if (errorData.error === 'Already enrolled in this course') {
                                            router.push(`/dashboard/courses/${course._id}`);
                                            return;
                                          }
                                        } else {
                                          router.push(`/dashboard/courses/${course._id}`);
                                          return;
                                        }
                                      } catch (enrollError) { console.error('Enrollment error:', enrollError); }
                                    }
                                  } catch (parseError) { console.error('Error parsing user:', parseError); }
                                }
                                if (course.price === 0) { router.push(`/courses/${course._id}`); } else { router.push('/login'); }
                              }}
                              className="w-full py-3 bg-slate-900 hover:bg-blue-600 text-white rounded-[1rem] text-[11px] font-black transition-all flex items-center justify-center gap-2 active:scale-95 shadow-xl shadow-slate-200/50 hover:shadow-blue-200/50"
                            >
                              <span>{isAuthenticated && userRole === 'student' ? 'Start Learning Now' : 'Explore Program'}</span>
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7-7 7" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white/50 backdrop-blur-md rounded-[3rem] py-32 px-4 text-center border border-white/50 shadow-sm overflow-hidden relative">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent"></div>
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-md">
                    <svg className="w-10 h-10 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-3">Journey's End</h3>
                  <p className="text-slate-400 max-w-sm mx-auto mb-12 text-sm font-medium leading-relaxed">
                    We couldn't find any programs matching your current selection. <br />Try refreshing your gaze with a new term.
                  </p>
                  <button onClick={() => {setSearchQuery(''); handleCategoryChange('all');}} className="px-10 py-4 bg-blue-600 text-white rounded-[1.5rem] text-xs font-black hover:bg-blue-700 transition-all shadow-2xl shadow-blue-200">
                    Reset Exploration
                  </button>
                </div>
              )}

              {/* Pagination */}
              {!searchQuery && totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-20">
                  <button
                    onClick={() => setCurrentPage((prev: number) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-4 rounded-2xl bg-white border border-slate-100 disabled:opacity-20 hover:bg-slate-50 transition-all shadow-sm group"
                  >
                    <svg className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <div className="flex gap-2.5">
                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`w-12 h-12 rounded-2xl text-[11px] font-black transition-all shadow-sm ${
                          currentPage === i + 1 
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 ring-4 ring-blue-50' 
                            : 'bg-white border border-slate-100 text-slate-400 hover:text-blue-600 hover:border-blue-100'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setCurrentPage((prev: number) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="p-4 rounded-2xl bg-white border border-slate-100 disabled:opacity-20 hover:bg-slate-50 transition-all shadow-sm group"
                  >
                    <svg className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src="/logo.svg" alt="Dar Al-Ilm Logo" className="w-10 h-10" />
                <span className="text-xl font-bold text-white">Dar Al-Ilm</span>
              </div>
              <p className="text-sm">
                Your trusted partner in online learning and skill development.
              </p>
            </div>
            <div>
              <h5 className="text-white font-semibold mb-4">Quick Links</h5>
              <ul className="space-y-2 text-sm">
                <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
                <li><Link href="/courses" className="hover:text-white transition-colors">Courses</Link></li>
                <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="text-white font-semibold mb-4">Support</h5>
              <ul className="space-y-2 text-sm">
                <li><Link href="/help" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="text-white font-semibold mb-4">Contact</h5>
              <ul className="space-y-2 text-sm">
                <li>Email: support@daralilm.com</li>
                <li>Phone: <a href="tel:+212637446431" className="hover:text-white transition-colors">+212 637446431</a></li>
                <li>Location: Bouznika, Morocco</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; 2025 Dar Al-Ilm. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function CoursesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 bg-blue-100 rounded-full blur-3xl opacity-20 animate-pulse"></div>
          <div className="relative text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600 mx-auto mb-6"></div>
            <p className="text-slate-500 font-bold tracking-widest uppercase text-[10px]">Initializing...</p>
          </div>
        </div>
      </div>
    }>
      <CoursesContent />
    </Suspense>
  );
}

