'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { fetchApi, getFileUrl as getBackendFileUrl } from '@/lib/api-client';
import StudentLayout from '../../../components/StudentLayout';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

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
    return getBackendFileUrl(`/api/files/${section.fileId}`);
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
      return '📄';
  }
}

function getYouTubeEmbedUrl(url: string): string {
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

export default function DashboardCourseViewPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;
  const [user, setUser] = useState<User | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<{ moduleId: string; sectionId: string } | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<{ moduleId: string; quizId: string } | { type: 'final' } | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  // Course content sidebar - hidden on mobile, visible on desktop by default
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mainSidebarOpen, setMainSidebarOpen] = useState(false); // Main navigation sidebar - hidden by default on course view page
  
  // Set course content sidebar to visible on desktop on mount
  useEffect(() => {
    const checkScreenSize = () => {
      if (window.innerWidth >= 1024) { // lg breakpoint
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);
  const [isMobile, setIsMobile] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [showCertificate, setShowCertificate] = useState(false);
  const [progress, setProgress] = useState<any>(null);
  const [courseProgress, setCourseProgress] = useState(0);
  const [isReviewingCourse, setIsReviewingCourse] = useState(false);
  const [certificateUrl, setCertificateUrl] = useState<string | null>(null);
  const [generatingCertificate, setGeneratingCertificate] = useState(false);
  const [showCopyToast, setShowCopyToast] = useState(false);
  
  // Anti-fraud system
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showFraudWarning, setShowFraudWarning] = useState(false);
  const [isQuizLocked, setIsQuizLocked] = useState(false);
  const [fraudAttempts, setFraudAttempts] = useState<string[]>([]);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [skippedQuestions, setSkippedQuestions] = useState<string[]>([]);
  const [tamperingDetected, setTamperingDetected] = useState(false);
  const [showRedBorder, setShowRedBorder] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

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
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    // Fetch user info
    fetchApi('/api/auth/me')
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
          fetchCourse(token);
        }
        setLoading(false);
      })
      .catch(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
      });
  }, [router, courseId]);

  const fetchCourse = async (token: string) => {
    if (!courseId) return;

    try {
      setLoading(true);
      const res = await fetchApi(`/api/student/courses`);
      
      if (!res.ok) {
        setError('Failed to load course');
        setLoading(false);
        return;
      }

      const data = await res.json();
      let enrolledCourse = data.courses?.find((item: any) => item.course._id === courseId);
      
      // If course is not enrolled, try to enroll automatically
      if (!enrolledCourse) {
        try {
          const enrollRes = await fetchApi('/api/student/enroll', {
            method: 'POST',
            body: JSON.stringify({ courseId }),
          });

          if (enrollRes.ok || enrollRes.status === 400) {
            // Enrollment successful or already enrolled
            // Wait a bit for database to update, then reload courses list
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Reload courses to verify enrollment
            const refreshRes = await fetchApi(`/api/student/courses`);
            
            if (refreshRes.ok) {
              const refreshData = await refreshRes.json();
              enrolledCourse = refreshData.courses?.find((item: any) => item.course._id === courseId);
            }
          } else {
            // Enrollment failed - try to load course anyway (might be free)
            const errorData = await enrollRes.json();
            console.warn('Enrollment failed, trying to load course anyway:', errorData);
          }
        } catch (enrollError) {
          console.error('Error enrolling:', enrollError);
          // Continue to try loading course (might be free or accessible)
        }
      }

      // Fetch full course details (this will check enrollment internally)
      const courseRes = await fetchApi(`/api/courses/${courseId}`);

      if (!courseRes.ok) {
        const errorData = await courseRes.json();
        // If it's a 403, it means course requires enrollment
        if (courseRes.status === 403) {
          setError('This course requires enrollment. Please enroll from the courses page.');
        } else {
          setError(errorData.error || 'Impossible de charger les détails du cours');
        }
        setLoading(false);
        return;
      }

      const courseData = await courseRes.json();
      setCourse(courseData.course);
      
      // Fetch progress to restore last accessed section
      const progressRes = await fetchApi(`/api/student/progress?courseId=${courseId}`);

      let lastModuleId: string | null = null;
      let lastSectionId: string | null = null;
      let lastQuizId: string | null = null;

      if (progressRes.ok) {
        const progressData = await progressRes.json();
        if (progressData.progress) {
          lastModuleId = progressData.progress.moduleId || null;
          lastSectionId = progressData.progress.sectionId || null;
          lastQuizId = progressData.progress.quizId || null;
          setProgress(progressData.progress);
          setCourseProgress(progressData.progress.overallProgress || 0);
        }
      }

      // Restore last accessed section or use first section as default
      if (courseData.course.modules && courseData.course.modules.length > 0) {
        let targetModule = null;
        let targetSection = null;
        let targetQuiz = null;

        // Try to find the last accessed section/quiz
        if (lastModuleId && lastSectionId) {
          targetModule = courseData.course.modules.find((m: any) => m._id === lastModuleId);
          if (targetModule && targetModule.sections) {
            targetSection = targetModule.sections.find((s: any) => s._id === lastSectionId);
          }
        } else if (lastModuleId && lastQuizId) {
          targetModule = courseData.course.modules.find((m: any) => m._id === lastModuleId);
          if (targetModule && targetModule.quiz && targetModule.quiz._id === lastQuizId) {
            targetQuiz = targetModule.quiz;
          }
        } else if (lastQuizId && courseData.course.finalExam && courseData.course.finalExam._id === lastQuizId) {
          // Check if last accessed was final exam
          targetQuiz = { type: 'final' } as any;
        }

        // If last accessed item not found, use first section
        if (!targetSection && !targetQuiz) {
          const firstModule = courseData.course.modules[0];
          targetModule = firstModule;
          if (firstModule.sections && firstModule.sections.length > 0) {
            targetSection = firstModule.sections[0];
          }
        }

        // Set active section/quiz
        if (targetModule) {
          setExpandedModule(targetModule._id);
          if (targetSection) {
            setActiveSection({
              moduleId: targetModule._id,
              sectionId: targetSection._id
            });
          } else if (targetQuiz) {
            if ('type' in targetQuiz && targetQuiz.type === 'final') {
              setActiveQuiz({ type: 'final' });
            } else {
              setActiveQuiz({
                moduleId: targetModule._id,
                quizId: (targetQuiz as any)._id
              });
            }
          }
        } else if (targetQuiz && 'type' in targetQuiz && targetQuiz.type === 'final') {
          // Handle final exam without a module
          setActiveQuiz({ type: 'final' });
        }
      }
    } catch (error) {
      console.error('Error fetching course:', error);
      setError('Failed to load course. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Update progress when section is viewed
  const updateProgress = async (moduleId?: string, sectionId?: string, quizId?: string, completedFinalExam?: boolean) => {
    const token = localStorage.getItem('token');
    if (!token || !courseId) return;

    try {
      const response = await fetchApi('/api/student/progress', {
        method: 'PUT',
        body: JSON.stringify({
          courseId,
          moduleId,
          sectionId,
          quizId,
          completedFinalExam,
        }),
      });
      
      // Refresh progress data
      if (response.ok) {
        const progressRes = await fetchApi(`/api/student/progress?courseId=${courseId}`);
        
        if (progressRes.ok) {
          const progressData = await progressRes.json();
          if (progressData.progress) {
            setProgress(progressData.progress);
            setCourseProgress(progressData.progress.overallProgress || 0);
          }
        }
      }
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  // Calculate quiz score
  const calculateQuizScore = (quiz?: Quiz): number => {
    if (!quiz || !quiz.questions || quiz.questions.length === 0) return 0;
    
    let correctAnswers = 0;
    quiz.questions.forEach((question) => {
      const selectedAnswerId = selectedAnswers[question._id];
      if (selectedAnswerId) {
        const selectedAnswer = question.answers?.find(a => a._id === selectedAnswerId);
        if (selectedAnswer?.isCorrect) {
          correctAnswers++;
        }
      }
    });
    
    return Math.round((correctAnswers / quiz.questions.length) * 100);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  // Auto-skip to next question on fraud detection
  const skipToNextQuestion = () => {
    if (!activeQuiz || quizCompleted || isBlocked) return;
    
    const currentQuiz = activeQuiz && 'type' in activeQuiz && activeQuiz.type === 'final' 
      ? course?.finalExam 
      : course?.modules?.find(m => 'moduleId' in activeQuiz && m._id === activeQuiz.moduleId)?.quiz;
    
    if (!currentQuiz || !currentQuiz.questions) return;

    // Mark current question as skipped
    const currentQuestionId = currentQuiz.questions[currentQuestionIndex]?._id;
    if (currentQuestionId) {
      setSkippedQuestions(prev => [...prev, currentQuestionId]);
    }
    
    // Show red border and block for 3 seconds
    setShowRedBorder(true);
    setIsBlocked(true);
    
    setTimeout(() => {
      setShowRedBorder(false);
      
      // Check if this is the last question
      if (currentQuestionIndex >= (currentQuiz.questions?.length || 0) - 1) {
        // Last question - calculate score and complete quiz
        const score = calculateQuizScore(currentQuiz);
        setQuizScore(score);
        setQuizCompleted(true);
        setShowResults(false);
        
        // Auto-navigate to next module or final exam after completing quiz
        setTimeout(() => {
          if ('type' in activeQuiz && activeQuiz.type === 'final') {
            // If this was the final exam, close it
            setActiveQuiz(null);
            setQuizCompleted(false);
            setCurrentQuestionIndex(0);
            setSelectedAnswers({});
          } else if ('moduleId' in activeQuiz) {
            // Find current module and move to next
            const currentModuleIndex = course?.modules?.findIndex(m => m._id === activeQuiz.moduleId) || 0;
            const nextModule = course?.modules?.[currentModuleIndex + 1];
            
            if (nextModule) {
              // Move to next module's first section
              if (nextModule.sections && nextModule.sections.length > 0) {
                setActiveSection({ moduleId: nextModule._id, sectionId: nextModule.sections[0]._id });
                setActiveQuiz(null);
              } else if (nextModule.quiz) {
                // If no sections, start the next module's quiz
                setActiveQuiz({ moduleId: nextModule._id, quizId: nextModule.quiz._id });
              }
              setQuizCompleted(false);
              setCurrentQuestionIndex(0);
              setSelectedAnswers({});
            } else {
              // No more modules, start final exam if available
              if (course?.finalExam) {
                setActiveQuiz({ type: 'final' });
                setActiveSection(null);
                setQuizCompleted(false);
                setCurrentQuestionIndex(0);
                setSelectedAnswers({});
              } else {
                // No final exam, close quiz
                setActiveQuiz(null);
                setQuizCompleted(false);
                setCurrentQuestionIndex(0);
                setSelectedAnswers({});
              }
            }
          }
        }, 1000);
      } else {
        // Move to next question
        setCurrentQuestionIndex(prev => prev + 1);
        setShowResults(false);
      }
      
      setIsBlocked(false);
    }, 3000);
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

  // Reset question index when quiz changes
  useEffect(() => {
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setShowResults(false);
    setQuizCompleted(false);
    setQuizScore(null);
    // Reset fraud detection when starting new quiz
    setTabSwitchCount(0);
    setIsQuizLocked(false);
    setFraudAttempts([]);
    setShowFraudWarning(false);
    setSkippedQuestions([]);
  }, [activeQuiz]);
  
  // Reset showResults when question changes
  useEffect(() => {
    setShowResults(false);
  }, [currentQuestionIndex]);

  // Update progress when section changes
  useEffect(() => {
    if (activeSection?.sectionId && activeSection?.moduleId) {
      updateProgress(activeSection.moduleId, activeSection.sectionId);
    }
  }, [activeSection]);

  // Request fullscreen when quiz starts
  useEffect(() => {
    if (activeQuiz && !quizCompleted && !isFullScreen) {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        elem.requestFullscreen().then(() => {
          setIsFullScreen(true);
        }).catch(() => {
          // Fullscreen request failed, continue anyway
        });
      }
    }

    // Exit fullscreen when quiz ends
    if ((!activeQuiz || quizCompleted) && isFullScreen) {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => {
          setIsFullScreen(false);
        }).catch(() => {
          // Exit fullscreen failed
        });
      }
    }
  }, [activeQuiz, quizCompleted]);

  // Detect fullscreen exit
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && activeQuiz && !quizCompleted) {
        const newCount = tabSwitchCount + 1;
        setTabSwitchCount(newCount);
        setFraudAttempts(prev => [...prev, `Fullscreen exit detected at ${new Date().toLocaleTimeString()}`]);
        
        // Skip to next question immediately - NO LOCKING, just skip
        skipToNextQuestion();
      }
      setIsFullScreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [activeQuiz, quizCompleted, tabSwitchCount, currentQuestionIndex, selectedAnswers]);

  // Anti-fraud detection system
  useEffect(() => {
    if (!activeQuiz || quizCompleted) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        const newCount = tabSwitchCount + 1;
        setTabSwitchCount(newCount);
        setFraudAttempts(prev => [...prev, `Tab switch detected at ${new Date().toLocaleTimeString()}`]);
        
        // Skip to next question immediately - NO LOCKING, just skip
        skipToNextQuestion();
      }
    };

    const handleBlur = () => {
      if (!document.hidden) {
        const newCount = tabSwitchCount + 1;
        setTabSwitchCount(newCount);
        setFraudAttempts(prev => [...prev, `Window blur detected at ${new Date().toLocaleTimeString()}`]);
        
        // Skip to next question immediately - NO LOCKING, just skip
        skipToNextQuestion();
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      setFraudAttempts(prev => [...prev, `Right-click blocked at ${new Date().toLocaleTimeString()}`]);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow only typing letters, numbers, and basic navigation
      const allowedKeys = ['Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Escape', 'Backspace', 'Delete'];
      
      // Block all Ctrl combinations - Trigger fraud detection
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        
        // Log the specific fraud attempt
        const fraudMessage = e.key ? `Ctrl+${e.key.toUpperCase()} blocked` : 'Ctrl key blocked';
        setFraudAttempts(prev => [...prev, `${fraudMessage} at ${new Date().toLocaleTimeString()}`]);
        
        // Skip to next question with red border
        skipToNextQuestion();
        return;
      }
      
      // Block F12 and other function keys
      if (e.key === 'F12' || e.key.startsWith('F')) {
        e.preventDefault();
        setFraudAttempts(prev => [...prev, `Function key blocked at ${new Date().toLocaleTimeString()}`]);
        return;
      }
      
      // Block Alt key combinations
      if (e.altKey && e.key !== 'Tab') {
        e.preventDefault();
        setFraudAttempts(prev => [...prev, `Alt combination blocked at ${new Date().toLocaleTimeString()}`]);
        return;
      }
    };
    
    // Block copy event
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      setFraudAttempts(prev => [...prev, `Copy attempt blocked at ${new Date().toLocaleTimeString()}`]);
    };
    
    // Block paste event
    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      setFraudAttempts(prev => [...prev, `Paste attempt blocked at ${new Date().toLocaleTimeString()}`]);
    };
    
    // Block cut event
    const handleCut = (e: ClipboardEvent) => {
      e.preventDefault();
      setFraudAttempts(prev => [...prev, `Cut attempt blocked at ${new Date().toLocaleTimeString()}`]);
    };
    
    // Block text selection
    const handleSelectStart = (e: Event) => {
      // Allow selection only in input/textarea for answering questions
      const target = e.target as HTMLElement;
      if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && !target.hasAttribute('contenteditable')) {
        e.preventDefault();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('cut', handleCut);
    document.addEventListener('selectstart', handleSelectStart);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('selectstart', handleSelectStart);
    };
  }, [activeQuiz, quizCompleted, tabSwitchCount]);

  // Update progress when quiz becomes active
  useEffect(() => {
    if (activeQuiz) {
      if ('moduleId' in activeQuiz) {
        const moduleQuiz = activeQuiz as { moduleId: string; quizId: string };
        updateProgress(moduleQuiz.moduleId, undefined, moduleQuiz.quizId);
      } else if ('type' in activeQuiz && activeQuiz.type === 'final' && course?.finalExam?._id) {
        // For final exam, we need to update progress with the final exam quiz ID
        // We don't have a moduleId for final exam, so pass undefined
        updateProgress(undefined, undefined, course.finalExam._id);
      }
    }
  }, [activeQuiz, course?.finalExam?._id]);

  // Anti-tampering protection system
  useEffect(() => {
    if (!activeQuiz || quizCompleted) return;

    // Create a hash of critical functions to detect tampering
    const originalFunctions = {
      addEventListener: document.addEventListener,
      removeEventListener: document.removeEventListener,
      preventDefault: Event.prototype.preventDefault,
      stopPropagation: Event.prototype.stopPropagation,
    };

    // Monitor for console usage
    const consoleDetection = setInterval(() => {
      const element = new Image();
      Object.defineProperty(element, 'id', {
        get: function() {
          setTamperingDetected(true);
          setFraudAttempts(prev => [...prev, `Console opened at ${new Date().toLocaleTimeString()}`]);
          skipToNextQuestion();
          clearInterval(consoleDetection);
          return '';
        }
      });
      console.log(element);
    }, 1000);

    // Detect DevTools by checking window size anomalies
    const checkDevTools = setInterval(() => {
      const widthThreshold = window.outerWidth - window.innerWidth > 160;
      const heightThreshold = window.outerHeight - window.innerHeight > 160;
      
      if (widthThreshold || heightThreshold) {
        setTamperingDetected(true);
        setFraudAttempts(prev => [...prev, `DevTools detected via window size at ${new Date().toLocaleTimeString()}`]);
        skipToNextQuestion();
        clearInterval(checkDevTools);
      }
    }, 1000);

    // Monitor for function tampering
    const checkTampering = setInterval(() => {
      if (
        document.addEventListener !== originalFunctions.addEventListener ||
        document.removeEventListener !== originalFunctions.removeEventListener ||
        Event.prototype.preventDefault !== originalFunctions.preventDefault ||
        Event.prototype.stopPropagation !== originalFunctions.stopPropagation
      ) {
        setTamperingDetected(true);
        setFraudAttempts(prev => [...prev, `Function tampering detected at ${new Date().toLocaleTimeString()}`]);
        setIsQuizLocked(true);
        clearInterval(checkTampering);
      }
    }, 500);

    // Detect debugger
    const checkDebugger = setInterval(() => {
      const start = performance.now();
      debugger;
      const end = performance.now();
      if (end - start > 100) {
        setTamperingDetected(true);
        setFraudAttempts(prev => [...prev, `Debugger detected at ${new Date().toLocaleTimeString()}`]);
        skipToNextQuestion();
        clearInterval(checkDebugger);
      }
    }, 1000);

    // Protect against script injection
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeName === 'SCRIPT') {
            setTamperingDetected(true);
            setFraudAttempts(prev => [...prev, `Script injection detected at ${new Date().toLocaleTimeString()}`]);
            setIsQuizLocked(true);
            (node as HTMLElement).remove();
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Detect rapid key pressing (possible automation)
    let keyPressCount = 0;
    let keyPressTimer: NodeJS.Timeout;
    
    const detectAutomation = (e: KeyboardEvent) => {
      keyPressCount++;
      clearTimeout(keyPressTimer);
      
      if (keyPressCount > 10) {
        setTamperingDetected(true);
        setFraudAttempts(prev => [...prev, `Automation/bot detected at ${new Date().toLocaleTimeString()}`]);
        skipToNextQuestion();
        keyPressCount = 0;
      }
      
      keyPressTimer = setTimeout(() => {
        keyPressCount = 0;
      }, 1000);
    };

    document.addEventListener('keydown', detectAutomation);

    // Cleanup
    return () => {
      clearInterval(consoleDetection);
      clearInterval(checkDevTools);
      clearInterval(checkTampering);
      clearInterval(checkDebugger);
      observer.disconnect();
      document.removeEventListener('keydown', detectAutomation);
    };
  }, [activeQuiz, quizCompleted, currentQuestionIndex, selectedAnswers]);

  // Protect window object from manipulation during quiz
  useEffect(() => {
    if (!activeQuiz || quizCompleted) return;

    // Freeze important objects to prevent tampering
    const protectedObjects = [
      document.addEventListener,
      document.removeEventListener,
      window.addEventListener,
      window.removeEventListener,
      Event.prototype.preventDefault,
      Event.prototype.stopPropagation,
      Event.prototype.stopImmediatePropagation,
    ];

    // Store original toString methods
    const originalToStrings = protectedObjects.map(obj => obj.toString);

    // Override toString to hide our protection
    protectedObjects.forEach((obj, index) => {
      try {
        Object.defineProperty(obj, 'toString', {
          value: function() {
            return originalToStrings[index].call(this);
          },
          writable: false,
          configurable: false,
        });
      } catch (e) {
        // Silently fail if already protected
      }
    });

    // Detect attempts to access React DevTools
    if (typeof window !== 'undefined') {
      try {
        // Only define if not already defined
        if (!window.hasOwnProperty('__REACT_DEVTOOLS_GLOBAL_HOOK__')) {
          Object.defineProperty(window, '__REACT_DEVTOOLS_GLOBAL_HOOK__', {
            get() {
              setTamperingDetected(true);
              setFraudAttempts(prev => [...prev, `React DevTools detected at ${new Date().toLocaleTimeString()}`]);
              skipToNextQuestion();
              return undefined;
            },
            configurable: true,
          });
        } else {
          // If it already exists, monitor it
          const existingHook = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
          if (existingHook) {
            setTamperingDetected(true);
            setFraudAttempts(prev => [...prev, `React DevTools extension detected at ${new Date().toLocaleTimeString()}`]);
          }
        }
      } catch (e) {
        // Property already exists and is not configurable, silently continue
        console.warn('Unable to override React DevTools hook');
      }
    }

    // Prevent access to our anti-fraud variables via console
    const protectVariables = () => {
      const variablesToProtect = [
        'setIsQuizLocked',
        'setTabSwitchCount', 
        'setShowFraudWarning',
        'skipToNextQuestion',
        'isQuizLocked',
        'tabSwitchCount',
      ];

      variablesToProtect.forEach(varName => {
        try {
          Object.defineProperty(window, varName, {
            get() {
              setTamperingDetected(true);
              setFraudAttempts(prev => [...prev, `Variable access attempt: ${varName} at ${new Date().toLocaleTimeString()}`]);
              skipToNextQuestion();
              return undefined;
            },
            set() {
              setTamperingDetected(true);
              setFraudAttempts(prev => [...prev, `Variable manipulation attempt: ${varName} at ${new Date().toLocaleTimeString()}`]);
              setIsQuizLocked(true);
              return false;
            },
            configurable: false,
          });
        } catch (e) {
          // Already protected
        }
      });
    };

    protectVariables();

    // Monitor for CSS injection that could disable our protections
    const styleObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeName === 'STYLE' || (node.nodeName === 'LINK' && (node as HTMLLinkElement).rel === 'stylesheet')) {
            const content = node.textContent || '';
            // Check for attempts to re-enable text selection or hide warnings
            if (
              content.includes('user-select') ||
              content.includes('pointer-events') ||
              content.includes('display: none') ||
              content.includes('visibility: hidden') ||
              content.includes('opacity: 0')
            ) {
              setTamperingDetected(true);
              setFraudAttempts(prev => [...prev, `CSS injection detected at ${new Date().toLocaleTimeString()}`]);
              (node as HTMLElement).remove();
              skipToNextQuestion();
            }
          }
        });
      });
    });

    styleObserver.observe(document.head, {
      childList: true,
      subtree: true,
    });

    return () => {
      styleObserver.disconnect();
    };

  }, [activeQuiz, quizCompleted]);

  if (loading) {
    return (
      <StudentLayout
        user={user || { firstName: '', lastName: '', email: '' }}
        sidebarOpen={mainSidebarOpen}
        setSidebarOpen={setMainSidebarOpen}
        showProfileDropdown={showProfileDropdown}
        setShowProfileDropdown={setShowProfileDropdown}
        dropdownRef={dropdownRef}
        onProfileClick={() => router.push('/dashboard/profile')}
        onSettingsClick={() => router.push('/dashboard/settings')}
        onLogout={handleLogout}
        pageTitle="Loading..."
        pageSubtitle=""
      >
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading course...</p>
          </div>
        </div>
      </StudentLayout>
    );
  }

  if (!user || user.role !== 'student') {
    return null;
  }

  // Only show error if not loading and error exists
  if (!loading && error && !course) {
    return (
      <StudentLayout
        user={user}
        sidebarOpen={mainSidebarOpen}
        setSidebarOpen={setMainSidebarOpen}
        showProfileDropdown={showProfileDropdown}
        setShowProfileDropdown={setShowProfileDropdown}
        dropdownRef={dropdownRef}
        onProfileClick={() => router.push('/dashboard/profile')}
        onSettingsClick={() => router.push('/dashboard/settings')}
        onLogout={handleLogout}
        pageTitle="Error"
        pageSubtitle=""
      >
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-red-900 mb-2">Error</h3>
            <p className="text-red-700 mb-4">{error || 'Cours non trouvé'}</p>
            <Link
              href="/dashboard/courses"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to my courses
            </Link>
          </div>
        </div>
      </StudentLayout>
    );
  }

  // Show loading if still loading or no course yet
  if (loading || !course) {
    return (
      <StudentLayout
        user={user || { firstName: '', lastName: '', email: '' }}
        sidebarOpen={mainSidebarOpen}
        setSidebarOpen={setMainSidebarOpen}
        showProfileDropdown={showProfileDropdown}
        setShowProfileDropdown={setShowProfileDropdown}
        dropdownRef={dropdownRef}
        onProfileClick={() => router.push('/dashboard/profile')}
        onSettingsClick={() => router.push('/dashboard/settings')}
        onLogout={handleLogout}
        pageTitle="Loading..."
        pageSubtitle=""
      >
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading course...</p>
          </div>
        </div>
      </StudentLayout>
    );
  }

  // Get current section
  const currentSection = activeSection && course.modules
    ? course.modules
        .find(m => m._id === activeSection.moduleId)
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

  // Function to generate certificate in database and get shareable link
  const generateCertificate = async () => {
    setGeneratingCertificate(true);
    try {
      const token = localStorage.getItem('token');
      
      console.log('=== GENERATING CERTIFICATE ===');
      console.log('Course ID:', course._id);
      console.log('Token exists:', !!token);
      
      const res = await fetchApi('/api/student/certificates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ courseId: course._id }),
      });

      const data = await res.json();
      
      console.log('Response status:', res.status);
      console.log('Response data:', data);

      if (res.ok) {
        const fullUrl = `${window.location.origin}${data.shareUrl}`;
        setCertificateUrl(fullUrl);
        console.log('Certificate URL:', fullUrl);
        return fullUrl;
      } else {
        console.error('Error response:', data);
        alert(data.error || 'Error generating certificate');
        return null;
      }
    } catch (error) {
      console.error('Error generating certificate:', error);
      alert('Error generating certificate');
      return null;
    } finally {
      setGeneratingCertificate(false);
    }
  };

  // Function to download certificate as PDF
  const downloadCertificatePDF = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
    
    const currentDate = new Date().toLocaleDateString('fr-FR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    // Get final score - use 100 if course is completed, otherwise try to get from progress
    const finalScore = courseProgress >= 100 ? '100' : (quizScore || '100');
    const studentName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Étudiant';
    
    // Debug: Log all data
    console.log('=== CERTIFICATE DATA ===');
    console.log('User:', user);
    console.log('Student Name:', studentName);
    console.log('Course:', course);
    console.log('Course Title:', course?.title);
    console.log('Quiz Score:', quizScore);
    console.log('Course Progress:', courseProgress);
    console.log('Final Score:', finalScore);
    console.log('Progress:', progress);
    console.log('Instructor:', course?.instructorId);
    console.log('Current Date:', currentDate);
    
    // Get instructor name
    const instructorName = typeof course?.instructorId === 'object' 
      ? `${course.instructorId.firstName || ''} ${course.instructorId.lastName || ''}`.trim() || 'Dar Al-Ilm'
      : 'Dar Al-Ilm';
    
    console.log('Instructor Name:', instructorName);
    console.log('=======================');
    
    // Set up PDF colors and styling
    const primaryColor: [number, number, number] = [102, 126, 234]; // #667eea
    const secondaryColor: [number, number, number] = [118, 75, 162]; // #764ba2
    const greenColor: [number, number, number] = [16, 185, 129]; // #10b981
    
    // Background gradient (simulated with rectangles)
    doc.setFillColor(102, 126, 234);
    doc.rect(0, 0, 297, 210, 'F');
    
    // White certificate box
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(20, 20, 257, 170, 3, 3, 'F');
    
    // Border
    doc.setDrawColor(240, 240, 240);
    doc.setLineWidth(3);
    doc.roundedRect(20, 20, 257, 170, 3, 3, 'S');
    
    // Logo emoji at top
    doc.setFontSize(50);
    doc.text('🎓', 148.5, 40, { align: 'center' });
    
    // Header
    doc.setFontSize(40);
    doc.setTextColor(...primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text('Certificate of Achievement', 148.5, 53, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setTextColor(...secondaryColor);
    doc.setFont('helvetica', 'normal');
    doc.text('Dar Al-Ilm', 148.5, 63, { align: 'center' });
    
    // Horizontal line
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(1);
    doc.line(40, 70, 257, 70);
    
    // Badge "CERTIFIÉ"
    doc.setFillColor(...greenColor);
    doc.roundedRect(115, 78, 67, 12, 6, 6, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('✓ CERTIFIED', 148.5, 86, { align: 'center' });
    
    // "This certificate is awarded to"
    doc.setTextColor(107, 114, 128);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('This certificate is awarded to', 148.5, 103, { align: 'center' });
    
    // Student name
    doc.setTextColor(...primaryColor);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text(studentName, 148.5, 118, { align: 'center' });
    
    // "for successfully completing the course"
    doc.setTextColor(107, 114, 128);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('for successfully completing the course', 148.5, 130, { align: 'center' });
    
    // Course title
    doc.setTextColor(31, 41, 55);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(course?.title || 'Cours', 148.5, 141, { align: 'center' });
    
    // Score and Date
    doc.setTextColor(107, 114, 128);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Final Score', 100, 150, { align: 'center' });
    doc.text('Date', 197, 150, { align: 'center' });
    
    doc.setTextColor(...greenColor);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`${finalScore}%`, 100, 160, { align: 'center' });
    
    doc.setTextColor(31, 41, 55);
    doc.setFontSize(12);
    doc.text(currentDate, 197, 160, { align: 'center' });
    
    // Instructor
    doc.setTextColor(107, 114, 128);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Instructor: ${instructorName}`, 148.5, 172, { align: 'center' });
    
    // Footer
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(1);
    doc.line(40, 178, 257, 178);
    
    doc.setTextColor(107, 114, 128);
    doc.setFontSize(8);
    doc.text('This certificate attests to your achievement and can be added to your professional profile', 148.5, 185, { align: 'center' });
    
    // Download the PDF
    doc.save(`Certificat-${course?.title || 'Cours'}-${studentName}.pdf`);
    
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF');
    }
  };


  // Certificate Modal Component
  const CertificateModal = () => {
    if (!showCertificate) return null;
    
    const currentDate = new Date().toLocaleDateString('fr-FR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden animate-fadeIn">
          {/* Certificate Header */}
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-8 text-white text-center">
            <div className="text-6xl mb-4">🎓</div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">Congratulations!</h1>
            <p className="text-lg opacity-90">You passed the final exam</p>
          </div>
          
          {/* Certificate Body */}
          <div className="p-8 sm:p-12 bg-gradient-to-br from-gray-50 to-white">
            <div className="text-center mb-8">
              <div className="inline-block px-6 py-2 bg-green-100 text-green-700 rounded-full font-semibold text-lg mb-6">
                ✓ Certifié
              </div>
              
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4">
                Certificate of Achievement
              </h2>
              
              <p className="text-gray-600 mb-2">This certificate is awarded to</p>
              
              <div className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-6">
                {user?.firstName || ''} {user?.lastName || ''}
              </div>
              
              <p className="text-gray-600 mb-2">for successfully completing the course</p>
              
              <div className="text-xl sm:text-2xl font-semibold text-gray-800 mb-6 max-w-2xl mx-auto">
                {course.title}
              </div>
              
              <div className="flex items-center justify-center gap-8 mb-6 text-sm text-gray-600">
                <div>
                  <div className="font-semibold text-gray-800">Final Score</div>
                  <div className="text-2xl font-bold text-green-600">{courseProgress >= 100 ? '100' : (quizScore || '100')}%</div>
                </div>
                <div className="w-px h-12 bg-gray-300"></div>
                <div>
                  <div className="font-semibold text-gray-800">Date</div>
                  <div className="text-lg">{currentDate}</div>
                </div>
              </div>
              
              {/* Instructor Info */}
              <div className="text-sm text-gray-500 mb-8">
                <p>Instructor: {typeof course.instructorId === 'object' 
                  ? `${course.instructorId.firstName || ''} ${course.instructorId.lastName || ''}`.trim() || 'Dar Al-Ilm'
                  : 'Dar Al-Ilm'}</p>
              </div>
              
              {/* Decorative Elements */}
              <div className="flex justify-center gap-4 mb-8">
                <div className="w-16 h-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded"></div>
                <div className="w-16 h-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded"></div>
                <div className="w-16 h-1 bg-gradient-to-r from-pink-600 to-red-600 rounded"></div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={downloadCertificatePDF}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download Certificate (PDF)
              </button>
              
              <button
                onClick={() => {
                  setShowCertificate(false);
                  router.push('/dashboard');
                }}
                className="px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-300 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Back to Dashboard
              </button>
            </div>
          </div>
          
          {/* Certificate Footer */}
          <div className="bg-gray-100 px-8 py-4 text-center text-sm text-gray-600">
            <p>🏆 This certificate attests to your achievement and can be added to your professional profile</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <CertificateModal />
      
      {/* Toast Notification */}
      {showCopyToast && (
        <div className="fixed top-4 right-4 z-50 animate-slideIn">
          <div className="bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm font-medium">Link copied to clipboard</span>
          </div>
        </div>
      )}


      {/* Quiz Locked Modal */}
      {isQuizLocked && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-red-600 mb-3">
              {tamperingDetected ? '⚠️ Security Breach Detected' : '🚫 Quiz Locked'}
            </h2>
            <p className="text-gray-700 mb-4">
              {tamperingDetected 
                ? 'Your quiz has been locked due to tampering attempts or use of unauthorized tools.'
                : 'Your quiz has been locked due to multiple suspicious activities.'}
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
              <h4 className="font-semibold text-red-800 mb-2">Detected Activities:</h4>
              <ul className="text-sm text-red-700 space-y-1">
                {fraudAttempts.slice(-5).map((attempt, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-red-500">•</span>
                    <span>{attempt}</span>
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Please contact your instructor to retake this quiz.
            </p>
            <button
              onClick={() => {
                setActiveQuiz(null);
                setIsQuizLocked(false);
                setShowFraudWarning(false);
              }}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors"
            >
              Exit Quiz
            </button>
          </div>
        </div>
      )}
      
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
        hideSidebar={courseProgress >= 100}
        pageTitle={course.title}
        pageSubtitle="Continue your learning"
    >
      <div className="h-full bg-gray-50 flex overflow-hidden">
        {/* Mobile Overlay for Course Content Sidebar */}
        {sidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}
        
        {/* Sidebar - Course Content - Always visible */}
        {true && (
          <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} fixed lg:sticky top-16 left-0 w-full sm:w-80 lg:w-80 bg-white border-r border-gray-200 overflow-y-auto transition-transform duration-300 z-40`} style={{ height: 'calc(100vh - 4rem)' }}>
          <div className="lg:hidden p-3 sm:p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">Course Content</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="group relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 rounded-lg transition-all duration-300"
              aria-label="Close sidebar"
            >
              <div className="relative w-5 h-5">
                <span className="absolute top-1/2 left-0 w-4 h-0.5 bg-current transform rotate-45 translate-y-0 transition-all duration-300 group-hover:scale-110"></span>
                <span className="absolute top-1/2 left-0 w-4 h-0.5 bg-current transform -rotate-45 translate-y-0 transition-all duration-300 group-hover:scale-110"></span>
              </div>
            </button>
          </div>
          <div className="p-4 sm:p-6">
            {/* Course Info */}
            <div className="mb-4 sm:mb-6 pb-4 sm:pb-6 border-b border-gray-200">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 line-clamp-2">{course.title}</h1>
              
              {/* 100% Completion Banner - Review Mode */}
              {courseProgress >= 100 && isReviewingCourse && (
                <div className="mt-4 space-y-2">
                  <div className="p-3 bg-blue-50 border-2 border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="text-2xl">👀</div>
                      <div className="flex-1">
                        <h3 className="text-xs font-bold text-blue-800">Review Mode</h3>
                        <p className="text-xs text-blue-700">Your certification remains valid</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setIsReviewingCourse(false);
                        setActiveSection(null);
                        setActiveQuiz(null);
                      }}
                      className="w-full px-3 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg text-xs font-semibold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                      </svg>
                      Back to Congratulations
                    </button>
                  </div>
                </div>
              )}
              
              {/* 100% Completion Banner - Not in Review Mode */}
              {courseProgress >= 100 && !isReviewingCourse && (
                <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-3xl">🎉</div>
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-green-800">Congratulations!</h3>
                      <p className="text-xs text-green-700">You have completed this course</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowCertificate(true)}
                    className="w-full px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg text-sm font-semibold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download your certificate
                  </button>
                </div>
              )}
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
                              {module.sections.length} {module.sections.length === 1 ? 'leçon' : 'leçons'}
                            </p>
                          )}
                        </div>
                      </div>
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform ${expandedModule === module._id ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {expandedModule === module._id && module.sections && module.sections.length > 0 && (
                      <div className="mt-2 ml-4 space-y-1">
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
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}

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
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No modules available</p>
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
                      <span className="text-xs sm:text-sm font-medium truncate">{course.finalExam.title || 'Examen Final'}</span>
                      {course.finalExam.questions && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {course.finalExam.questions.length} {course.finalExam.questions.length === 1 ? 'question' : 'questions'}
                        </p>
                      )}
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </aside>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-hidden flex flex-col">
          {courseProgress >= 100 && !isReviewingCourse ? (
            /* Completion Congratulations Page */
            <div className="h-full flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-2 overflow-hidden">
              <div className="max-w-2xl w-full bg-white rounded-xl shadow-2xl p-4 sm:p-5 max-h-[95vh] overflow-y-auto no-scrollbar">
                {/* Success Header */}
                <div className="text-center mb-3">
                  <div className="text-4xl sm:text-5xl mb-2 animate-bounce">🎉</div>
                  <h1 className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 mb-1.5">
                    Congratulations!
                  </h1>
                  <p className="text-base sm:text-lg font-semibold text-gray-800 mb-1.5">
                    You have completed this course
                  </p>
                  <div className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full font-bold text-xs">
                    ✓ 100% Completed
                  </div>
                </div>

                {/* Course Info */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3 mb-3">
                  <h2 className="text-lg font-bold text-gray-800 mb-0.5 text-center">
                    {course.title}
                  </h2>
                  <p className="text-xs text-gray-600 text-center">
                    You are now certified in this course
                  </p>
                </div>

                {/* Certificate Download Section */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-3 mb-3">
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <div className="text-3xl">🏆</div>
                    <div className="flex-1">
                      <h3 className="text-base font-bold text-green-800 mb-0">
                        Your Certificate is Ready!
                      </h3>
                      <p className="text-xs text-green-700">
                        Download your official certificate of achievement
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <button
                      onClick={async () => {
                        // Generate certificate link and download PDF simultaneously
                        const url = await generateCertificate();
                        downloadCertificatePDF();
                      }}
                      disabled={generatingCertificate}
                      className="w-full px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg text-sm font-bold transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {generatingCertificate ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Generating...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Download Certificate (PDF)
                        </>
                      )}
                    </button>

                    {certificateUrl && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                        <p className="text-xs text-blue-800 font-semibold mb-1">Share link:</p>
                        <div className="flex gap-1">
                          <input
                            type="text"
                            value={certificateUrl}
                            readOnly
                            className="flex-1 px-2 py-1 bg-white border border-blue-300 rounded text-xs font-mono"
                          />
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(certificateUrl);
                              setShowCopyToast(true);
                              setTimeout(() => setShowCopyToast(false), 2000);
                            }}
                            className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold transition-colors"
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="grid sm:grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      // Enable review mode and reset to first section
                      setIsReviewingCourse(true);
                      if (course.modules && course.modules.length > 0) {
                        const firstModule = course.modules[0];
                        if (firstModule.sections && firstModule.sections.length > 0) {
                          setActiveSection({
                            moduleId: firstModule._id,
                            sectionId: firstModule.sections[0]._id
                          });
                          setExpandedModule(firstModule._id);
                        }
                      }
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg text-sm font-semibold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-1.5"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    Review Course
                  </button>

                  <button
                    onClick={() => router.push('/dashboard')}
                    className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-300 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-1.5"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Back to Dashboard
                  </button>
                </div>

                {/* Additional Info */}
                <div className="mt-3 pt-2.5 border-t border-gray-200 text-center">
                  <p className="text-xs text-gray-600">
                    💡 You can review the content without affecting your certification.
                  </p>
                </div>
              </div>
            </div>
          ) : (currentSection || currentQuiz) ? (
            currentQuiz ? (
            <div className="h-full flex flex-col overflow-hidden bg-gray-50">
              {/* Quiz Header with Progress */}
              {currentQuiz.questions && currentQuiz.questions.length > 0 && currentQuestionIndex < currentQuiz.questions.length && (
                <div className="flex-shrink-0 bg-white border-b border-gray-200 px-3 py-1.5">
                  <div className="max-w-4xl mx-auto">
                    <div className="flex items-center justify-between gap-2">
                      <button
                        onClick={() => setSidebarOpen(true)}
                        className="lg:hidden p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        aria-label="Open course content"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                      </button>
                      <div className="flex-1 flex items-center justify-between gap-2">
                        <div className="flex-1 max-w-md">
                          <div className="w-full bg-gray-200 rounded-full h-1">
                            <div 
                              className="bg-gradient-to-r from-blue-600 to-purple-600 h-1 rounded-full transition-all duration-300"
                              style={{ width: `${((currentQuestionIndex + 1) / currentQuiz.questions.length) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-xs font-medium text-gray-600">
                            Question {currentQuestionIndex + 1} / {currentQuiz.questions.length}
                          </div>
                          {/* Security Status Indicator */}
                          {tabSwitchCount > 0 && (
                            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                              isQuizLocked 
                                ? 'bg-red-100 text-red-700' 
                                : tabSwitchCount >= 5
                                  ? 'bg-red-100 text-red-700' 
                                  : tabSwitchCount >= 3 
                                    ? 'bg-orange-100 text-orange-700' 
                                    : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              {isQuizLocked ? 'LOCKED' : `⚠ ${tabSwitchCount}`}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Quiz Content - One Question at a Time */}
              <div className="flex-1 overflow-hidden bg-gray-50 flex items-center min-h-0 quiz-no-select">
                {currentQuiz.questions && currentQuiz.questions.length > 0 ? (
                  <div className="max-w-4xl mx-auto w-full px-3 sm:px-4 h-full flex items-center min-h-0">
                    {!quizCompleted && currentQuestionIndex < currentQuiz.questions.length ? (
                      <div className={`bg-white rounded-lg shadow-md p-3 sm:p-4 w-full max-h-full overflow-hidden flex flex-col transition-all duration-300 ${showRedBorder ? 'border-4 border-red-600 animate-pulse' : 'border border-gray-200'}`}>
                        {(() => {
                          const currentQuestion = currentQuiz.questions![currentQuestionIndex];
                          return (
                            <>
                              <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-2 flex-shrink-0">
                                {currentQuestion.question}
                              </h2>
                                
                              {/* Display answers */}
                              <div className="flex-1 min-h-0 flex flex-col">
                                {currentQuestion.answers && 
                                 currentQuestion.answers.length > 0 ? (
                                  <div className="space-y-1.5 sm:space-y-2 flex-1 min-h-0 overflow-hidden">
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
                                            if (!showResults && !isQuizLocked && !isBlocked) {
                                              setSelectedAnswers({
                                                ...selectedAnswers,
                                                [questionId]: answer._id
                                              });
                                            }
                                          }}
                                          disabled={showResults || isQuizLocked || isBlocked}
                                          className={`w-full text-left p-2 sm:p-2.5 rounded-lg border-2 transition-all flex-shrink-0 ${
                                            showCorrect
                                              ? 'bg-green-50 border-green-500 text-green-900 shadow-sm'
                                              : showIncorrect
                                                ? 'bg-red-50 border-red-500 text-red-900 shadow-sm'
                                                : isSelected
                                                  ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-sm'
                                                  : 'bg-gray-50 border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-100 hover:shadow-sm'
                                          } ${showResults || isQuizLocked || isBlocked ? 'cursor-default' : 'cursor-pointer'} ${isQuizLocked || isBlocked ? 'opacity-50' : ''}`}
                                        >
                                          <div className="flex items-center gap-2">
                                            <div className={`flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                              showCorrect
                                                ? 'bg-green-500 border-green-500'
                                                : showIncorrect
                                                  ? 'bg-red-500 border-red-500'
                                                  : isSelected
                                                    ? 'bg-blue-500 border-blue-500'
                                                    : 'border-gray-300'
                                            }`}>
                                              {showCorrect && (
                                                <span className="text-white font-bold text-xs">✓</span>
                                              )}
                                              {showIncorrect && (
                                                <span className="text-white font-bold text-xs">✗</span>
                                              )}
                                              {!showResults && isSelected && (
                                                <span className="text-white font-bold text-xs">●</span>
                                              )}
                                            </div>
                                            <span className="text-sm font-medium flex-1">{answer.answer}</span>
                                          </div>
                                        </button>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-lg flex-shrink-0">
                                    <p className="text-yellow-800 text-xs">No answers available for this question.</p>
                                  </div>
                                )}
                                
                                {/* Show result message */}
                                {showResults && currentQuestion.answers && 
                                 selectedAnswers[currentQuestion._id] && (
                                  <div className={`mt-2 p-2 rounded-lg flex-shrink-0 ${
                                    currentQuestion.answers.find(
                                      a => a._id === selectedAnswers[currentQuestion._id]
                                    )?.isCorrect
                                      ? 'bg-green-50 border-2 border-green-200'
                                      : 'bg-red-50 border-2 border-red-200'
                                  }`}>
                                    <p className={`text-xs font-semibold ${
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
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden p-1 sm:p-1.5 md:p-2">
                        <div className="h-full w-full">
                          {/* Main Result Card - Full Screen */}
                          <div className="h-full w-full bg-white rounded-md sm:rounded-lg shadow-2xl overflow-hidden flex flex-col">
                            {/* Header Section */}
                            <div className={`flex-shrink-0 py-1 sm:py-1.5 md:py-2 text-center ${
                              quizScore !== null && quizScore >= (currentQuiz.passingScore || 70)
                                ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                                : 'bg-gradient-to-r from-red-500 to-rose-600'
                            }`}>
                              <div className="inline-flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full bg-white/20 backdrop-blur-sm mb-0.5">
                                {quizScore !== null && quizScore >= (currentQuiz.passingScore || 70) ? (
                                  <svg className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                ) : (
                                  <svg className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                )}
                              </div>
                              <h2 className="text-xs sm:text-sm md:text-base font-bold text-white mb-0.5">Quiz Results</h2>
                              <p className="text-white/90 text-xs px-2 line-clamp-1">
                                {activeQuiz && 'type' in activeQuiz && activeQuiz.type === 'final' 
                                  ? 'Final Exam - Formation en C'
                                  : activeQuiz && 'moduleId' in activeQuiz
                                    ? (() => {
                                        const module = course?.modules?.find(m => m._id === (activeQuiz as any).moduleId);
                                        return module?.title || 'Quiz';
                                      })()
                                    : 'Quiz Completed'
                                }
                              </p>
                            </div>

                            {/* Main Content Area - Flex 1 */}
                            <div className="flex-1 flex flex-col items-center justify-center p-1 sm:p-1.5 md:p-2 min-h-0 overflow-hidden">
                              {/* Score Display */}
                              <div className="text-center mb-0.5 sm:mb-1 md:mb-1.5">
                                <p className="text-gray-500 text-xs mb-0.5">Your Score</p>
                                <p className={`text-2xl sm:text-3xl md:text-4xl lg:text-4xl xl:text-5xl font-bold mb-0.5 ${
                                  quizScore !== null && quizScore >= (currentQuiz.passingScore || 70)
                                    ? 'text-green-600'
                                    : 'text-red-600'
                                }`}>
                                  {quizScore}<span className="text-base sm:text-lg md:text-xl lg:text-xl xl:text-2xl">%</span>
                                </p>
                                <div className={`inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 md:px-2.5 py-0.5 rounded-full font-bold text-xs ${
                                  quizScore !== null && quizScore >= (currentQuiz.passingScore || 70)
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                                }`}>
                                  {quizScore !== null && quizScore >= (currentQuiz.passingScore || 70) ? (
                                    <>
                                      <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                      </svg>
                                      Passed
                                    </>
                                  ) : (
                                    <>
                                      <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                      </svg>
                                      Failed
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* Statistics Grid */}
                              <div className="w-full max-w-3xl grid grid-cols-4 gap-0.5 sm:gap-1 md:gap-1.5 mb-0.5 sm:mb-1 md:mb-1.5">
                                <div className="bg-blue-50 rounded-sm sm:rounded-md p-0.5 sm:p-1 md:p-1.5 text-center border border-blue-200">
                                  <div className="text-base sm:text-lg md:text-xl lg:text-xl xl:text-2xl font-bold text-blue-600 mb-0">
                                    {currentQuiz.questions?.length || 0}
                                  </div>
                                  <div className="text-xs text-gray-700 font-semibold">Total</div>
                                </div>
                                <div className="bg-green-50 rounded-sm sm:rounded-md p-0.5 sm:p-1 md:p-1.5 text-center border border-green-200">
                                  <div className="text-base sm:text-lg md:text-xl lg:text-xl xl:text-2xl font-bold text-green-600 mb-0">
                                    {Math.round(((quizScore || 0) / 100) * (currentQuiz.questions?.length || 0))}
                                  </div>
                                  <div className="text-xs text-gray-700 font-semibold">Correct</div>
                                </div>
                                <div className="bg-red-50 rounded-sm sm:rounded-md p-0.5 sm:p-1 md:p-1.5 text-center border border-red-200">
                                  <div className="text-base sm:text-lg md:text-xl lg:text-xl xl:text-2xl font-bold text-red-600 mb-0">
                                    {(currentQuiz.questions?.length || 0) - Math.round(((quizScore || 0) / 100) * (currentQuiz.questions?.length || 0))}
                                  </div>
                                  <div className="text-xs text-gray-700 font-semibold">Wrong</div>
                                </div>
                                <div className="bg-purple-50 rounded-sm sm:rounded-md p-0.5 sm:p-1 md:p-1.5 text-center border border-purple-200">
                                  <div className="text-base sm:text-lg md:text-xl lg:text-xl xl:text-2xl font-bold text-purple-600 mb-0">
                                    {currentQuiz.passingScore || 70}%
                                  </div>
                                  <div className="text-xs text-gray-700 font-semibold">Required</div>
                                </div>
                              </div>

                              {/* Messages */}
                              <div className="w-full max-w-2xl space-y-0.5 sm:space-y-1 md:space-y-1.5">
                                {/* Success/Fail Message */}
                                <div className={`rounded-sm sm:rounded-md p-1 sm:p-1.5 md:p-2 ${
                                  quizScore !== null && quizScore >= (currentQuiz.passingScore || 70)
                                    ? 'bg-green-50 border-2 border-green-300'
                                    : 'bg-red-50 border-2 border-red-300'
                                }`}>
                                  <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2">
                                    <svg className={`w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 ${
                                      quizScore !== null && quizScore >= (currentQuiz.passingScore || 70)
                                        ? 'text-green-600'
                                        : 'text-red-600'
                                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={
                                        quizScore !== null && quizScore >= (currentQuiz.passingScore || 70)
                                          ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                          : "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                      } />
                                    </svg>
                                    <div className="flex-1 min-w-0">
                                      <h3 className={`font-bold text-xs mb-0 ${
                                        quizScore !== null && quizScore >= (currentQuiz.passingScore || 70)
                                          ? 'text-green-900'
                                          : 'text-red-900'
                                      }`}>
                                        {quizScore !== null && quizScore >= (currentQuiz.passingScore || 70)
                                          ? 'Congratulations! 🎉'
                                          : 'Keep Trying! 💪'}
                                      </h3>
                                      <p className={`text-xs ${
                                        quizScore !== null && quizScore >= (currentQuiz.passingScore || 70)
                                          ? 'text-green-700'
                                          : 'text-red-700'
                                      }`}>
                                        {quizScore !== null && quizScore >= (currentQuiz.passingScore || 70)
                                          ? `You passed with ${quizScore}%.`
                                          : `You need ${currentQuiz.passingScore || 70}% to pass.`}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                {/* Fraud Alert */}
                                {skippedQuestions.length > 0 && (
                                  <div className="bg-orange-50 border border-orange-300 rounded-sm sm:rounded-md p-1 sm:p-1.5 md:p-2">
                                    <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2">
                                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                      </svg>
                                      <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-xs text-orange-900 mb-0">Fraud Detection ⚠️</h3>
                                        <p className="text-xs text-orange-700">
                                          {skippedQuestions.length} question(s) skipped.
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-600">No questions available.</p>
                  </div>
                )}
              </div>

              {/* Quiz Navigation */}
              {currentQuiz.questions && currentQuiz.questions.length > 0 && currentQuestionIndex < currentQuiz.questions.length && (
                <div className="flex-shrink-0 bg-white border-t border-gray-200 shadow-lg">
                  <div className="max-w-4xl mx-auto w-full px-3 py-2">
                    {!showResults && !quizCompleted && (
                      <div className="mb-1 flex justify-center">
                        <button
                          type="button"
                          onClick={() => {
                            if (isQuizLocked || isBlocked) return;
                            const questionId = currentQuiz.questions![currentQuestionIndex]._id;
                            if (selectedAnswers[questionId]) {
                              // If it's the last question, finish the quiz immediately
                              if (currentQuestionIndex === currentQuiz.questions!.length - 1) {
                                const score = calculateQuizScore(currentQuiz);
                                setQuizScore(score);
                                setQuizCompleted(true);
                              } else {
                                // Otherwise just show the result
                                setShowResults(true);
                              }
                            }
                          }}
                          disabled={!selectedAnswers[currentQuiz.questions![currentQuestionIndex]._id] || isQuizLocked || isBlocked}
                          className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg ${
                            !selectedAnswers[currentQuiz.questions![currentQuestionIndex]._id] || isQuizLocked || isBlocked
                              ? 'opacity-50 cursor-not-allowed'
                              : 'hover:from-green-700 hover:to-green-800 cursor-pointer transform hover:scale-105'
                          }`}
                        >
                          {currentQuestionIndex === currentQuiz.questions!.length - 1 ? 'Finish Quiz' : 'Check Answer'}
                        </button>
                      </div>
                    )}
                    
                    {showResults && !quizCompleted ? (
                      <div className="flex items-center justify-between gap-2">
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
                          className={`px-3 sm:px-4 py-1.5 sm:py-2 border-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 ${
                            currentQuestionIndex === 0
                              ? 'opacity-50 cursor-not-allowed border-gray-200 text-gray-400'
                              : 'hover:bg-gray-50 text-gray-700 border-gray-300 cursor-pointer hover:border-gray-400'
                          }`}
                          style={{ pointerEvents: 'auto' }}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                          <span>Previous</span>
                        </button>
                        
                        <div className="text-xs sm:text-sm text-gray-600 font-medium px-2">
                          {currentQuestionIndex + 1} / {currentQuiz.questions.length}
                        </div>
                        
                        <button
                          type="button"
                          onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            
                            if (currentQuestionIndex < currentQuiz.questions!.length - 1) {
                              setCurrentQuestionIndex(currentQuestionIndex + 1);
                              setShowResults(false);
                            } else {
                              // Last question - calculate score and complete quiz
                              const score = calculateQuizScore(currentQuiz);
                              setQuizScore(score);
                              setQuizCompleted(true);
                            }
                          }}
                          className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg text-xs sm:text-sm font-semibold transition-all shadow-md hover:shadow-lg flex items-center gap-1.5 cursor-pointer transform hover:scale-105"
                          style={{ pointerEvents: 'auto' }}
                        >
                          <span>{currentQuestionIndex < currentQuiz.questions!.length - 1 ? 'Next' : 'Finish'}</span>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
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
                          className={`px-3 sm:px-4 py-1.5 sm:py-2 border-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 ${
                            currentQuestionIndex === 0
                              ? 'opacity-50 cursor-not-allowed border-gray-200 text-gray-400'
                              : 'hover:bg-gray-50 text-gray-700 border-gray-300 cursor-pointer hover:border-gray-400'
                          }`}
                          style={{ pointerEvents: 'auto' }}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                          <span>Previous</span>
                        </button>
                        
                        <div className="text-xs sm:text-sm text-gray-600 font-medium px-2">
                          {currentQuestionIndex + 1} / {currentQuiz.questions.length}
                        </div>
                        
                        <div className="w-[100px]"></div>
                      </div>
                    )}
                    
                    {quizCompleted && (
                      <div className="flex justify-center mt-2">
                        {quizScore !== null && quizScore >= (currentQuiz.passingScore || 70) ? (
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              
                              // Update progress
                              if (activeQuiz) {
                                if ('moduleId' in activeQuiz) {
                                  const moduleQuiz = activeQuiz as { moduleId: string; quizId: string };
                                  await updateProgress(moduleQuiz.moduleId, undefined, moduleQuiz.quizId);
                                } else if ('type' in activeQuiz && activeQuiz.type === 'final') {
                                  // For final exam, we don't have a moduleId, so pass undefined
                                  await updateProgress(undefined, undefined, undefined, true);
                                }
                              }
                              
                              // Navigate to next content
                              const modules = course.modules || [];
                              let navigated = false;
                              
                              if (activeQuiz && 'moduleId' in activeQuiz) {
                                const moduleQuiz = activeQuiz as { moduleId: string; quizId: string };
                                for (let i = 0; i < modules.length; i++) {
                                  const module = modules[i];
                                  
                                  if (module._id === moduleQuiz.moduleId) {
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
                                // Final exam completed - Show certificate
                                setShowCertificate(true);
                              }
                            }}
                            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg text-xs sm:text-sm font-semibold transition-all shadow-md hover:shadow-lg flex items-center gap-1.5 cursor-pointer transform hover:scale-105"
                            style={{ pointerEvents: 'auto' }}
                          >
                            <span>Continue</span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setActiveQuiz(null);
                              setCurrentQuestionIndex(0);
                              setSelectedAnswers({});
                              setQuizCompleted(false);
                              setQuizScore(null);
                              if (course.modules && course.modules.length > 0 && course.modules[0].sections && course.modules[0].sections.length > 0) {
                                setActiveSection({
                                  moduleId: course.modules[0]._id,
                                  sectionId: course.modules[0].sections[0]._id
                                });
                                setExpandedModule(course.modules[0]._id);
                              }
                            }}
                            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-xs sm:text-sm font-semibold transition-all shadow-md hover:shadow-lg flex items-center gap-1.5 cursor-pointer"
                            style={{ pointerEvents: 'auto' }}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            <span className="hidden sm:inline">Back to learning</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : currentSection ? (
            <div className="h-full flex flex-col overflow-hidden relative">
              {/* Mobile Header with Menu Button */}
              <div className="lg:hidden flex-shrink-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="group relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 rounded-lg transition-all duration-300"
                  aria-label="Open course content"
                >
                  <div className="relative w-6 h-6">
                    <span className="absolute top-0 left-0 w-5 h-0.5 bg-current transform transition-all duration-300"></span>
                    <span className="absolute top-1/2 left-0 w-5 h-0.5 bg-current transform transition-all duration-300"></span>
                    <span className="absolute bottom-0 left-0 w-5 h-0.5 bg-current transform transition-all duration-300"></span>
                  </div>
                </button>
                <h2 className="text-sm font-semibold text-gray-700 flex-1 text-center">
                  {currentSection.title || 'Course Content'}
                </h2>
                <div className="w-10"></div> {/* Spacer for centering */}
              </div>
              
              {/* Section Content */}
              <div className="flex-1 overflow-hidden bg-white pb-20">
                <div className="w-full h-full bg-white">
                  {currentSection && currentSection.type === 'file' && (currentSection.fileId || currentSection.fileUrl) ? (
                    <div className="h-full w-full overflow-hidden bg-white">
                      {currentSection.fileType === 'pdf' && getFileUrl(currentSection) ? (
                        <div className="h-full w-full relative bg-white">
                          <iframe
                            src={`${getFileUrl(currentSection)}#toolbar=1&navpanes=1&scrollbar=1`}
                            className="w-full h-full border-0"
                            style={{ 
                              height: '100%', 
                              width: '100%',
                              display: 'block',
                              backgroundColor: 'white',
                              minHeight: '600px'
                            }}
                            title={currentSection.fileName || 'PDF Document'}
                            allow="fullscreen"
                            onError={(e) => {
                              console.error('PDF load error:', e);
                            }}
                          ></iframe>
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
                              Download to view
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
                              Aperçu non disponible pour ce type de fichier.
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
                              Download file
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : currentSection && currentSection.type === 'youtube' && currentSection.youtubeUrl ? (
                    <div className="h-full w-full flex items-center justify-center bg-black p-2">
                      <div className="w-full h-full flex items-center justify-center" style={{ maxWidth: '100%', maxHeight: '100%' }}>
                        <div style={{ 
                          width: '100%',
                          maxWidth: 'min(100%, calc((100vh - 180px) * 16/9))',
                          aspectRatio: '16/9'
                        }}>
                          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                            <iframe
                              src={getYouTubeEmbedUrl(currentSection.youtubeUrl)}
                              className="absolute top-0 left-0 w-full h-full border-0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                              allowFullScreen
                              frameBorder="0"
                              title="YouTube video player"
                            ></iframe>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : currentSection ? (
                    <div className="w-full h-full flex items-center justify-center bg-gray-50">
                      <div className="text-center p-8">
                        <div className="text-6xl mb-4">📄</div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          Contenu non disponible
                        </h3>
                        <p className="text-gray-600 mb-2">
                          Type de section: {currentSection.type || 'non défini'}
                        </p>
                        <p className="text-gray-500 text-sm">
                          Cette section ne contient pas de contenu à afficher.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-50">
                      <div className="text-center p-8">
                        <div className="text-6xl mb-4">📚</div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          No section selected
                        </h3>
                        <p className="text-gray-600">
                          Please select a section from the left menu.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Navigation */}
              {currentSection && (
                <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
                  <div className="max-w-4xl mx-auto w-full px-3 sm:px-4 lg:px-8 py-3 sm:py-4 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        if (!currentSection || !activeSection) return;
                        
                        const modules = course.modules || [];
                        let prevSectionFound = false;
                        
                        for (let i = 0; i < modules.length; i++) {
                          const module = modules[i];
                          
                          if (module._id === activeSection.moduleId) {
                            const sections = module.sections || [];
                            
                            for (let j = 0; j < sections.length; j++) {
                              if (sections[j]._id === activeSection.sectionId) {
                                if (j > 0) {
                                  setActiveSection({ 
                                    moduleId: module._id, 
                                    sectionId: sections[j - 1]._id 
                                  });
                                  setActiveQuiz(null);
                                  prevSectionFound = true;
                                  break;
                                } else if (i > 0) {
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
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        if (!currentSection || !activeSection) return;
                        
                        const modules = course.modules || [];
                        let navigated = false;
                        
                        for (let i = 0; i < modules.length; i++) {
                          const module = modules[i];
                          
                          if (module._id === activeSection.moduleId) {
                            const sections = module.sections || [];
                            
                            for (let j = 0; j < sections.length; j++) {
                              if (sections[j]._id === activeSection.sectionId) {
                                // 1. Try next section in same module
                                if (j < sections.length - 1) {
                                  setActiveSection({ 
                                    moduleId: module._id, 
                                    sectionId: sections[j + 1]._id 
                                  });
                                  setActiveQuiz(null);
                                  navigated = true;
                                  break;
                                }
                                
                                // 2. If last section, try module quiz
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
            ) : activeSection && currentSection ? (
              /* Display Active Section */
              <div className="h-full bg-white overflow-hidden">
                {(currentSection as any).type === 'file' && (currentSection as any).fileType === 'pdf' && (
                  <iframe
                    src={`/uploads/${(currentSection as any).content}`}
                    className="w-full h-full"
                    title={(currentSection as any).title}
                  />
                )}
                {(currentSection as any).type === 'file' && (currentSection as any).fileType === 'image' && (
                  <div className="h-full flex items-center justify-center bg-gray-900 p-4">
                    <img
                      src={`/uploads/${(currentSection as any).content}`}
                      alt={(currentSection as any).title}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                )}
                {(currentSection as any).type === 'youtube' && (currentSection as any).content && (
                  <div className="h-full w-full bg-black flex items-start justify-center">
                    <div
                      className="relative w-full"
                      style={{
                        paddingBottom: '80px',
                        maxWidth: 'min(100%, calc((100vh - 180px) * 16/9))',
                        maxHeight: 'calc(100% - 80px)',
                        aspectRatio: '16/9',
                      }}
                    >
                      <iframe
                        src={`https://www.youtube.com/embed/${(currentSection as any).content.includes('watch?v=') ? (currentSection as any).content.split('watch?v=')[1].split('&')[0] : (currentSection as any).content.split('/').pop()}`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="absolute top-0 left-0"
                        style={{ width: '100%', height: '100%' }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Loading or fallback */
              <div className="h-full flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading course content...</p>
                </div>
              </div>
            )
          ) : null}
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </StudentLayout>
    </>
  );
}

