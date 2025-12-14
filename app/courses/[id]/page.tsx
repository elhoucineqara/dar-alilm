'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface Section {
  _id: string;
  title: string;
  description?: string;
  type: 'file' | 'youtube';
  order: number;
  fileId?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: 'pdf' | 'word' | 'ppt';
  youtubeUrl?: string;
}

interface Question {
  _id: string;
  question: string;
  type: 'multiple-choice' | 'true-false';
  order: number;
  answers?: Answer[];
}

interface Answer {
  _id: string;
  answer: string;
  isCorrect: boolean;
  order: number;
}

interface Quiz {
  _id: string;
  title: string;
  description?: string;
  passingScore: number;
  questions?: Question[];
}

interface Module {
  _id: string;
  title: string;
  description?: string;
  order: number;
  sections?: Section[];
  quiz?: Quiz | null;
}

interface Course {
  _id: string;
  title: string;
  description: string;
  categoryId: {
    name: string;
  } | string;
  instructorId: {
    firstName: string;
    lastName: string;
  } | string;
  price: number;
  thumbnail?: string;
  status: 'draft' | 'published';
  modules?: Module[];
  finalExam?: Quiz | null;
}

function getFileUrl(section: Section): string | undefined {
  if (section.fileId) {
    return `/api/files/${section.fileId}`;
  }
  return section.fileUrl;
}

function getFileIcon(fileType?: string): string {
  switch (fileType) {
    case 'pdf':
      return '📄';
    case 'word':
      return '📝';
    case 'ppt':
      return '📊';
    default:
      return '📎';
  }
}

function getYouTubeEmbedUrl(url: string): string {
  // Extract video ID from various YouTube URL formats
  let videoId = '';
  
  if (url.includes('youtu.be/')) {
    videoId = url.split('youtu.be/')[1].split('?')[0].split('&')[0];
  } else if (url.includes('youtube.com/watch?v=')) {
    videoId = url.split('watch?v=')[1].split('&')[0];
  } else if (url.includes('youtube.com/embed/')) {
    videoId = url.split('embed/')[1].split('?')[0].split('&')[0];
  }
  
  if (videoId) {
    return `https://www.youtube.com/embed/${videoId}?controls=1&modestbranding=1&rel=0&showinfo=0&enablejsapi=1`;
  }
  
  return url;
}

export default function CourseViewPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<{ moduleId: string; sectionId: string } | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<{ moduleId: string; quizId: string } | { type: 'final' } | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({}); // questionId -> answerId
  const [showResults, setShowResults] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!courseId) return;

    const fetchCourse = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/courses/${courseId}`);
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
          if (res.status === 403) {
            setError('This course requires authentication and payment. Please login to access.');
          } else if (res.status === 404) {
            setError('Course not found.');
          } else {
            setError(errorData.error || 'Failed to load course');
          }
          setLoading(false);
          return;
        }

        const data = await res.json();
        setCourse(data.course);
        
        // Expand first module and set first section as active by default
        if (data.course.modules && data.course.modules.length > 0) {
          const firstModule = data.course.modules[0];
          setExpandedModule(firstModule._id);
          if (firstModule.sections && firstModule.sections.length > 0) {
            setActiveSection({
              moduleId: firstModule._id,
              sectionId: firstModule.sections[0]._id
            });
          }
        }
      } catch (error) {
        console.error('Error fetching course:', error);
        setError('Failed to load course. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId]);

  // Reset question index when quiz changes
  useEffect(() => {
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setShowResults(false);
    setQuizCompleted(false);
    setQuizScore(null);
  }, [activeQuiz]);
  
  // Reset showResults when question changes
  useEffect(() => {
    setShowResults(false);
  }, [currentQuestionIndex]);

  // Calculate quiz score
  const calculateQuizScore = (quiz: Quiz): number => {
    if (!quiz.questions || quiz.questions.length === 0) return 0;
    
    let correctAnswers = 0;
    quiz.questions.forEach((question) => {
      const selectedAnswerId = selectedAnswers[question._id];
      if (selectedAnswerId) {
        const selectedAnswer = question.answers?.find(a => a._id === selectedAnswerId);
        if (selectedAnswer && selectedAnswer.isCorrect) {
          correctAnswers++;
        }
      }
    });
    
    return Math.round((correctAnswers / quiz.questions.length) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading course...</p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
          <p className="text-gray-600 mb-6">{error || 'Course not found'}</p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }


  // Get current section
  const currentSection = activeSection 
    ? course.modules
        ?.find(m => m._id === activeSection.moduleId)
        ?.sections?.find(s => s._id === activeSection.sectionId)
    : null;

  // Get current quiz
  const currentQuiz = activeQuiz
    ? ('type' in activeQuiz && activeQuiz.type === 'final')
      ? course.finalExam
      : ('moduleId' in activeQuiz)
        ? (() => {
            const moduleQuiz = activeQuiz as { moduleId: string; quizId: string };
            return course.modules
              ?.find(m => m._id === moduleQuiz.moduleId)
              ?.quiz;
          })()
        : null
    : null;

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-12">
            <div className="flex items-center gap-2 sm:gap-4 lg:gap-8">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
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
                <Link href="/courses" className="text-gray-700 hover:text-blue-600 font-medium transition-colors text-sm">
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
              <Link
                href="/login"
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-gray-700 hover:text-blue-600 font-medium transition-colors text-sm"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="px-4 sm:px-5 py-1.5 sm:py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg text-sm"
              >
                Get Started
              </Link>
            </div>
          </div>
        </nav>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden" style={{ height: 'calc(100vh - 3rem)' }}>
        {/* Sidebar - Course Content */}
        <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} fixed lg:sticky top-12 left-0 w-full lg:w-80 bg-white border-r border-gray-200 overflow-y-auto transition-transform duration-300 z-40`} style={{ height: 'calc(100vh - 3rem)' }}>
          <div className="lg:hidden p-3 sm:p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">Course Content</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-4 sm:p-6">
            {/* Course Info */}
            <div className="mb-4 sm:mb-6 pb-4 sm:pb-6 border-b border-gray-200">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 line-clamp-2">{course.title}</h1>
            </div>

            {/* Course Content */}
            <div className="space-y-2">
              <h2 className="hidden lg:block text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Course Content</h2>
              {course.modules && course.modules.length > 0 ? (
                course.modules.map((module, moduleIndex) => (
                  <div key={module._id} className="mb-4">
                    <button
                      onClick={() => setExpandedModule(expandedModule === module._id ? null : module._id)}
                      className="w-full flex items-center justify-between p-2.5 sm:p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                    >
                      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-xs sm:text-sm">
                          {moduleIndex + 1}
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <h3 className="font-semibold text-gray-900 text-xs sm:text-sm group-hover:text-blue-600 transition-colors truncate">
                            {module.title}
                          </h3>
                          {module.sections && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              {module.sections.length} {module.sections.length === 1 ? 'lesson' : 'lessons'}
                            </p>
                          )}
                        </div>
                      </div>
                      <svg
                        className={`w-5 h-5 text-gray-400 flex-shrink-0 transform transition-transform ${
                          expandedModule === module._id ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {expandedModule === module._id && module.sections && (
                      <div className="ml-11 mt-2 space-y-1">
                        {module.sections.map((section, sectionIndex) => {
                          const isActive = activeSection?.moduleId === module._id && activeSection?.sectionId === section._id;
                          return (
                            <button
                              key={section._id}
                              onClick={() => {
                                setActiveSection({ moduleId: module._id, sectionId: section._id });
                                setActiveQuiz(null);
                                setSidebarOpen(false);
                              }}
                              className={`w-full flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-lg text-left transition-all ${
                                isActive
                                  ? 'bg-blue-50 border border-blue-200 text-blue-700'
                                  : 'hover:bg-gray-50 text-gray-700'
                              }`}
                            >
                              <div className={`flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                                isActive ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                              }`}>
                                {sectionIndex + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs sm:text-sm font-medium truncate">{section.title}</span>
                                  {section.type === 'file' && (
                                    <span className="text-xs">{getFileIcon(section.fileType)}</span>
                                  )}
                                  {section.type === 'youtube' && (
                                    <span className="text-xs">▶️</span>
                                  )}
                                </div>
                                {section.description && (
                                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{section.description}</p>
                                )}
                              </div>
                              {isActive && (
                                <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-600"></div>
                              )}
                            </button>
                          );
                        })}
                        
                        {/* Quiz for this module */}
                        {module.quiz && (
                          <button
                            onClick={() => {
                              setActiveQuiz({ moduleId: module._id, quizId: module.quiz!._id });
                              setActiveSection(null);
                              setCurrentQuestionIndex(0);
                              setSidebarOpen(false);
                            }}
                    className={`w-full flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-lg text-left transition-all mt-1 cursor-pointer ${
                      activeQuiz && 'moduleId' in activeQuiz && activeQuiz.moduleId === module._id
                        ? 'bg-purple-50 border border-purple-200 text-purple-700'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className={`flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                      activeQuiz && 'moduleId' in activeQuiz && activeQuiz.moduleId === module._id
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      🧩
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs sm:text-sm font-medium truncate">{module.quiz.title || 'Quiz'}</span>
                              {module.quiz.questions && (
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {module.quiz.questions.length} {module.quiz.questions.length === 1 ? 'question' : 'questions'}
                                </p>
                              )}
                            </div>
                            {activeQuiz && 'moduleId' in activeQuiz && activeQuiz.moduleId === module._id && (
                              <div className="flex-shrink-0 w-2 h-2 rounded-full bg-purple-600"></div>
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-8">No content available yet.</p>
              )}
              
              {/* Final Exam */}
              {course.finalExam && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setActiveQuiz({ type: 'final' });
                      setActiveSection(null);
                      setCurrentQuestionIndex(0);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-lg text-left transition-all cursor-pointer ${
                      activeQuiz && 'type' in activeQuiz && activeQuiz.type === 'final'
                        ? 'bg-purple-50 border border-purple-200 text-purple-700'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className={`flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                      activeQuiz && 'type' in activeQuiz && activeQuiz.type === 'final'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      🎯
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs sm:text-sm font-medium truncate">{course.finalExam.title || 'Final Exam'}</span>
                      {course.finalExam.questions && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {course.finalExam.questions.length} {course.finalExam.questions.length === 1 ? 'question' : 'questions'}
                        </p>
                      )}
                    </div>
                    {activeQuiz && 'type' in activeQuiz && activeQuiz.type === 'final' && (
                      <div className="flex-shrink-0 w-2 h-2 rounded-full bg-purple-600"></div>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-hidden flex flex-col">
          {currentQuiz ? (
            <div className="h-full flex flex-col overflow-hidden">
              {/* Quiz Header */}
              <div className="flex-shrink-0 bg-white border-b border-gray-200 px-3 sm:px-4 lg:px-8 py-3 sm:py-4">
                <div className="max-w-4xl mx-auto">
                  <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-1">
                    {currentQuiz.title || (activeQuiz && 'type' in activeQuiz && activeQuiz.type === 'final' ? 'Final Exam' : 'Quiz')}
                  </h1>
                  {currentQuiz.description && (
                    <p className="text-xs sm:text-sm text-gray-600">{currentQuiz.description}</p>
                  )}
                  {currentQuiz.passingScore && (
                    <p className="text-xs text-gray-500 mt-1">
                      Passing Score: {currentQuiz.passingScore}%
                    </p>
                  )}
                </div>
              </div>

              {/* Quiz Content - One Question at a Time */}
              <div className="flex-1 overflow-hidden bg-gray-50 flex items-center justify-center">
                {currentQuiz.questions && currentQuiz.questions.length > 0 ? (
                  <div className="max-w-4xl mx-auto w-full px-3 sm:px-4 lg:px-8 py-3 sm:py-4 h-full flex items-center">
                    {currentQuestionIndex < currentQuiz.questions.length ? (
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 lg:p-8 w-full">
                        <div className="mb-4">
                          {(() => {
                            const currentQuestion = currentQuiz.questions![currentQuestionIndex];
                            return (
                              <>
                                <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-start sm:items-center gap-2 sm:gap-3">
                                  <span className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-base sm:text-lg">
                                    {currentQuestionIndex + 1}
                                  </span>
                                  <span className="flex-1">{currentQuestion.question}</span>
                                </h3>
                                
                                {/* Display answers - works for all question types */}
                                {currentQuestion.answers && 
                                 currentQuestion.answers.length > 0 ? (
                                  <div className="space-y-2">
                                    {currentQuestion.answers.map((answer) => {
                                      const questionId = currentQuestion._id;
                                const isSelected = selectedAnswers[questionId] === answer._id;
                                const isCorrect = answer.isCorrect;
                                const showCorrect = showResults && isCorrect;
                                const showIncorrect = showResults && isSelected && !isCorrect;
                                
                                return (
                                  <button
                                    key={answer._id}
                                    type="button"
                                    onClick={() => {
                                      if (!showResults) {
                                        setSelectedAnswers({
                                          ...selectedAnswers,
                                          [questionId]: answer._id
                                        });
                                      }
                                    }}
                                    disabled={showResults}
                                    className={`w-full text-left p-2.5 sm:p-3 rounded-lg border-2 transition-all ${
                                      showCorrect
                                        ? 'bg-green-50 border-green-400 text-green-900'
                                        : showIncorrect
                                          ? 'bg-red-50 border-red-400 text-red-900'
                                          : isSelected
                                            ? 'bg-blue-50 border-blue-400 text-blue-900'
                                            : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                                    } ${showResults ? 'cursor-default' : 'cursor-pointer'}`}
                                  >
                                    <div className="flex items-center gap-2 sm:gap-3">
                                      {showCorrect && (
                                        <span className="text-green-600 font-bold text-base sm:text-lg flex-shrink-0">✓</span>
                                      )}
                                      {showIncorrect && (
                                        <span className="text-red-600 font-bold text-base sm:text-lg flex-shrink-0">✗</span>
                                      )}
                                      {!showResults && isSelected && (
                                        <span className="text-blue-600 font-bold text-base sm:text-lg flex-shrink-0">○</span>
                                      )}
                                      <span className="text-xs sm:text-sm lg:text-base">{answer.answer}</span>
                                    </div>
                                  </button>
                                );
                              })}
                                  </div>
                                ) : (
                                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <p className="text-yellow-800 text-sm">No answers available for this question.</p>
                                  </div>
                                )}
                                
                                {/* Show result message if results are shown */}
                                {showResults && currentQuestion.answers && 
                                 selectedAnswers[currentQuestion._id] && (
                                  <div className={`mt-4 p-3 rounded-lg ${
                                    currentQuestion.answers.find(
                                      a => a._id === selectedAnswers[currentQuestion._id]
                                    )?.isCorrect
                                      ? 'bg-green-50 border border-green-200'
                                      : 'bg-red-50 border border-red-200'
                                  }`}>
                                    <p className={`text-sm font-medium ${
                                      currentQuestion.answers.find(
                                        a => a._id === selectedAnswers[currentQuestion._id]
                                      )?.isCorrect
                                        ? 'text-green-800'
                                        : 'text-red-800'
                                    }`}>
                                      {currentQuestion.answers.find(
                                        a => a._id === selectedAnswers[currentQuestion._id]
                                      )?.isCorrect
                                        ? '✓ Correct!'
                                        : '✗ Incorrect. The correct answer is highlighted in green.'}
                                    </p>
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                        <p className="text-gray-600">No more questions.</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                      <p className="text-gray-600">No questions available yet.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Quiz Navigation */}
              {currentQuiz.questions && currentQuiz.questions.length > 0 && (
                <div className="flex-shrink-0 bg-white border-t border-gray-200 shadow-lg z-50">
                  <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4">
                    {/* Check Answer Button */}
                    {!showResults && !quizCompleted && (
                      <div className="mb-3 flex justify-center">
                        <button
                          type="button"
                          onClick={() => {
                            const questionId = currentQuiz.questions![currentQuestionIndex]._id;
                            if (selectedAnswers[questionId]) {
                              setShowResults(true);
                              
                              // If this is the last question, calculate final score
                              if (currentQuestionIndex === currentQuiz.questions!.length - 1) {
                                const score = calculateQuizScore(currentQuiz);
                                setQuizScore(score);
                                setQuizCompleted(true);
                              }
                            }
                          }}
                          disabled={!selectedAnswers[currentQuiz.questions![currentQuestionIndex]._id]}
                          className={`px-6 py-2 bg-green-600 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg ${
                            !selectedAnswers[currentQuiz.questions![currentQuestionIndex]._id]
                              ? 'opacity-50 cursor-not-allowed'
                              : 'hover:bg-green-700 cursor-pointer'
                          }`}
                        >
                          {currentQuestionIndex === currentQuiz.questions!.length - 1 ? 'Finish Quiz' : 'Check Answer'}
                        </button>
                      </div>
                    )}
                    
                    {/* Quiz Results */}
                    {quizCompleted && quizScore !== null && (
                      <div className="mb-4 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-blue-200">
                        <div className="text-center">
                          <h3 className="text-2xl font-bold text-gray-900 mb-2">Quiz Results</h3>
                          <div className="text-4xl font-bold mb-2" style={{ 
                            color: quizScore >= (currentQuiz.passingScore || 70) ? '#10b981' : '#ef4444' 
                          }}>
                            {quizScore}%
                          </div>
                          <p className="text-lg font-semibold mb-4" style={{ 
                            color: quizScore >= (currentQuiz.passingScore || 70) ? '#10b981' : '#ef4444' 
                          }}>
                            {quizScore >= (currentQuiz.passingScore || 70) ? '✓ Passed!' : '✗ Failed'}
                          </p>
                          <p className="text-sm text-gray-600">
                            Passing Score: {currentQuiz.passingScore || 70}%
                          </p>
                          {quizScore < (currentQuiz.passingScore || 70) && (
                            <p className="text-sm text-red-600 mt-2 font-medium">
                              You need to score at least {currentQuiz.passingScore || 70}% to proceed.
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (currentQuestionIndex > 0) {
                            setCurrentQuestionIndex(currentQuestionIndex - 1);
                            setShowResults(false);
                          }
                        }}
                        disabled={currentQuestionIndex === 0}
                        className={`px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 border border-gray-300 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-1 sm:gap-2 ${
                          currentQuestionIndex === 0
                            ? 'opacity-50 cursor-not-allowed'
                            : 'hover:bg-gray-50 text-gray-700 cursor-pointer'
                        }`}
                        style={{ pointerEvents: 'auto' }}
                      >
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        <span className="hidden sm:inline">Previous</span>
                      </button>
                      
                      <div className="text-xs sm:text-sm text-gray-600 px-2">
                        {currentQuestionIndex + 1} / {currentQuiz.questions.length}
                      </div>
                      
                      {quizCompleted ? (
                        quizScore !== null && quizScore >= (currentQuiz.passingScore || 70) ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              
                              // Navigate to next content using the same logic as section navigation
                              const modules = course.modules || [];
                              let navigated = false;
                              
                              if (activeQuiz && 'moduleId' in activeQuiz) {
                                // Find current module
                                const moduleQuiz = activeQuiz as { moduleId: string; quizId: string };
                                for (let i = 0; i < modules.length; i++) {
                                  const module = modules[i];
                                  
                                  if (module._id === moduleQuiz.moduleId) {
                                    // Try first section of next module
                                    if (i < modules.length - 1) {
                                      const nextModule = modules[i + 1];
                                      if (nextModule.sections && nextModule.sections.length > 0) {
                                        setActiveSection({ 
                                          moduleId: nextModule._id, 
                                          sectionId: nextModule.sections[0]._id 
                                        });
                                        setActiveQuiz(null);
                                        navigated = true;
                                        break;
                                      }
                                      
                                      // If next module has no sections, try its quiz
                                      if (nextModule.quiz) {
                                        setActiveQuiz({ moduleId: nextModule._id, quizId: nextModule.quiz._id });
                                        setActiveSection(null);
                                        setCurrentQuestionIndex(0);
                                        setSelectedAnswers({});
                                        setQuizCompleted(false);
                                        setQuizScore(null);
                                        navigated = true;
                                        break;
                                      }
                                    }
                                    
                                    // If no next module, try final exam
                                    if (!navigated && course.finalExam) {
                                      setActiveQuiz({ type: 'final' });
                                      setActiveSection(null);
                                      setCurrentQuestionIndex(0);
                                      setSelectedAnswers({});
                                      setQuizCompleted(false);
                                      setQuizScore(null);
                                      navigated = true;
                                    }
                                    
                                    break;
                                  }
                                }
                              } else if (activeQuiz && 'type' in activeQuiz && activeQuiz.type === 'final') {
                                // Final exam completed - no more content
                                // Could show a completion message here
                              }
                            }}
                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg flex items-center gap-2 hover:from-blue-700 hover:to-purple-700 cursor-pointer"
                            style={{ pointerEvents: 'auto' }}
                          >
                            Continue
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              
                              // Return to first section of the course
                              const modules = course.modules || [];
                              if (modules.length > 0) {
                                const firstModule = modules[0];
                                if (firstModule.sections && firstModule.sections.length > 0) {
                                  setActiveSection({ 
                                    moduleId: firstModule._id, 
                                    sectionId: firstModule.sections[0]._id 
                                  });
                                  setActiveQuiz(null);
                                  setCurrentQuestionIndex(0);
                                  setSelectedAnswers({});
                                  setQuizCompleted(false);
                                  setQuizScore(null);
                                }
                              }
                            }}
                            className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg flex items-center gap-2 cursor-pointer"
                            style={{ pointerEvents: 'auto' }}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            Return to Learning
                          </button>
                        )
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (currentQuestionIndex < currentQuiz.questions!.length - 1) {
                              setCurrentQuestionIndex(currentQuestionIndex + 1);
                              setShowResults(false);
                            }
                          }}
                          disabled={currentQuestionIndex >= currentQuiz.questions!.length - 1}
                          className={`px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-xs sm:text-sm font-semibold transition-all shadow-md hover:shadow-lg flex items-center gap-1 sm:gap-2 ${
                            currentQuestionIndex >= currentQuiz.questions!.length - 1
                              ? 'opacity-50 cursor-not-allowed'
                              : 'hover:from-blue-700 hover:to-purple-700 cursor-pointer'
                          }`}
                          style={{ pointerEvents: 'auto' }}
                        >
                          <span className="hidden sm:inline">Next</span>
                          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : currentSection ? (
            <div className="h-full flex flex-col overflow-hidden relative">
              {/* Section Content - Flexible */}
              <div className="flex-1 overflow-hidden bg-gray-50" style={{ paddingBottom: '80px' }}>
                <div className="w-full h-full">
                  {currentSection.type === 'file' && (currentSection.fileId || currentSection.fileUrl) && (
                    <div className="h-full w-full overflow-hidden">
                      {/* Document Viewer */}
                      {currentSection.fileType === 'pdf' ? (
                        <div className="h-full w-full relative">
                          {isMobile ? (
                            // Mobile: Use object tag with iframe fallback and direct link option
                            <div className="h-full w-full flex flex-col bg-gray-50">
                              <object
                                data={`${getFileUrl(currentSection)}#toolbar=1&navpanes=1&scrollbar=1`}
                                type="application/pdf"
                                className="flex-1 w-full border-0"
                                style={{ minHeight: '500px' }}
                              >
                                <iframe
                                  src={`${getFileUrl(currentSection)}#toolbar=1&navpanes=1&scrollbar=1`}
                                  className="w-full h-full border-0"
                                  style={{ minHeight: '500px' }}
                                  title={currentSection.fileName || 'PDF Document'}
                                ></iframe>
                              </object>
                              <div className="absolute bottom-20 left-0 right-0 flex justify-center z-10 px-4">
                                <a
                                  href={getFileUrl(currentSection)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-4 py-2.5 bg-white border-2 border-blue-600 text-blue-600 rounded-lg font-semibold shadow-lg hover:bg-blue-50 transition-colors text-sm flex items-center gap-2"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                  Ouvrir dans le viewer
                                </a>
                              </div>
                            </div>
                          ) : (
                            // Desktop: Use iframe
                            <iframe
                              src={`${getFileUrl(currentSection)}#toolbar=1&navpanes=1&scrollbar=1`}
                              className="w-full h-full border-0"
                              style={{ height: '100%', pointerEvents: 'auto' }}
                              title={currentSection.fileName || 'PDF Document'}
                              allow="fullscreen"
                            ></iframe>
                          )}
                        </div>
                      ) : currentSection.fileType === 'word' || currentSection.fileType === 'ppt' ? (
                        <div className="w-full h-full flex items-center justify-center bg-gray-50 overflow-hidden">
                            <div className="text-center p-8">
                              <div className="text-6xl mb-4">{getFileIcon(currentSection.fileType)}</div>
                              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                {currentSection.fileName || 'Document'}
                              </h3>
                              <p className="text-gray-600 mb-6">
                                This file type cannot be previewed directly in the browser.
                              </p>
                              <a
                                href={getFileUrl(currentSection)}
                                target="_blank"
                                rel="noopener noreferrer"
                                download
                                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Download to View
                              </a>
                            </div>
                          </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-50 overflow-hidden">
                            <div className="text-center p-8">
                              <div className="text-6xl mb-4">{getFileIcon(currentSection.fileType)}</div>
                              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                {currentSection.fileName || 'Document'}
                              </h3>
                              <p className="text-gray-600 mb-6">
                                Preview not available for this file type.
                              </p>
                              <a
                                href={getFileUrl(currentSection)}
                                target="_blank"
                                rel="noopener noreferrer"
                                download
                                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Download File
                              </a>
                            </div>
                          </div>
                      )}
                    </div>
                    )}

                    {currentSection.type === 'youtube' && currentSection.youtubeUrl && (
                      <div className="h-full w-full bg-black overflow-hidden p-0">
                        <iframe
                          src={getYouTubeEmbedUrl(currentSection.youtubeUrl)}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                          allowFullScreen
                          frameBorder="0"
                          title="YouTube video player"
                          style={{ aspectRatio: '16/9' }}
                        ></iframe>
                      </div>
                    )}
                </div>
              </div>

              {/* Navigation - Fixed */}
              {currentSection && (
                <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
                  <div className="max-w-4xl mx-auto w-full px-3 sm:px-4 lg:px-8 py-3 sm:py-4 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        if (!currentSection || !activeSection) return;
                        
                        // Find previous section
                        const modules = course.modules || [];
                        let prevSectionFound = false;
                        
                        // Find current module and section index
                        for (let i = 0; i < modules.length; i++) {
                          const module = modules[i];
                          
                          // Check if this is the current module
                          if (module._id === activeSection.moduleId) {
                            const sections = module.sections || [];
                            
                            // Find current section index
                            for (let j = 0; j < sections.length; j++) {
                              if (sections[j]._id === activeSection.sectionId) {
                                // If not the first section in this module
                                if (j > 0) {
                                  setActiveSection({ 
                                    moduleId: module._id, 
                                    sectionId: sections[j - 1]._id 
                                  });
                                  setActiveQuiz(null);
                                  prevSectionFound = true;
                                  break;
                                } 
                                // If first section in this module, check previous module
                                else if (i > 0) {
                                  const prevModule = modules[i - 1];
                                  if (prevModule.sections && prevModule.sections.length > 0) {
                                    setActiveSection({
                                      moduleId: prevModule._id,
                                      sectionId: prevModule.sections[prevModule.sections.length - 1]._id
                                    });
                                    setActiveQuiz(null);
                                    prevSectionFound = true;
                                    break;
                                  }
                                }
                                break;
                              }
                            }
                            if (prevSectionFound) break;
                          }
                        }
                      }}
                      className="px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-xs sm:text-sm font-medium text-gray-700 transition-colors flex items-center gap-1 sm:gap-2 cursor-pointer relative z-50"
                      style={{ pointerEvents: 'auto' }}
                    >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="hidden sm:inline">Previous</span>
                  </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        if (!currentSection || !activeSection) return;
                        
                        const modules = course.modules || [];
                        let navigated = false;
                        
                        // Find current module and section index
                        for (let i = 0; i < modules.length; i++) {
                          const module = modules[i];
                          
                          if (module._id === activeSection.moduleId) {
                            const sections = module.sections || [];
                            
                            // Find current section index
                            for (let j = 0; j < sections.length; j++) {
                              if (sections[j]._id === activeSection.sectionId) {
                                // 1. Try next section in current module
                                if (j < sections.length - 1) {
                                  setActiveSection({ 
                                    moduleId: module._id, 
                                    sectionId: sections[j + 1]._id 
                                  });
                                  setActiveQuiz(null);
                                  navigated = true;
                                  break;
                                }
                                
                                // 2. If last section, try quiz of current module
                                if (module.quiz) {
                                  setActiveQuiz({ moduleId: module._id, quizId: module.quiz._id });
                                  setActiveSection(null);
                                  setCurrentQuestionIndex(0);
                                  navigated = true;
                                  break;
                                }
                                
                                // 3. If no quiz, try first section of next module
                                if (i < modules.length - 1) {
                                  const nextModule = modules[i + 1];
                                  if (nextModule.sections && nextModule.sections.length > 0) {
                                    setActiveSection({ 
                                      moduleId: nextModule._id, 
                                      sectionId: nextModule.sections[0]._id 
                                    });
                                    setActiveQuiz(null);
                                    navigated = true;
                                    break;
                                  }
                                  
                                  // 4. If next module has no sections, try its quiz
                                  if (nextModule.quiz) {
                                    setActiveQuiz({ moduleId: nextModule._id, quizId: nextModule.quiz._id });
                                    setActiveSection(null);
                                    setCurrentQuestionIndex(0);
                                    navigated = true;
                                    break;
                                  }
                                }
                                
                                // 5. If no next module, try final exam
                                if (course.finalExam) {
                                  setActiveQuiz({ type: 'final' });
                                  setActiveSection(null);
                                  setCurrentQuestionIndex(0);
                                  navigated = true;
                                  break;
                                }
                                
                                break;
                              }
                            }
                            if (navigated) break;
                          }
                        }
                      }}
                      className="px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg text-xs sm:text-sm font-semibold transition-all shadow-md hover:shadow-lg flex items-center gap-1 sm:gap-2 cursor-pointer relative z-50"
                      style={{ pointerEvents: 'auto' }}
                    >
                      <span className="hidden sm:inline">Next</span>
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    </div>
                  </div>
                )}
            </div>
          ) : (
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 px-4">Welcome to {course.title}</h2>
                <p className="text-sm sm:text-base text-gray-600 mb-6 px-4">{course.description}</p>
                <p className="text-xs sm:text-sm text-gray-500 px-4">Select a lesson from the sidebar to begin learning</p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
}

