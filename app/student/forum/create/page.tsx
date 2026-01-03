'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import StudentLayout from '@/app/components/StudentLayout';
import { fetchApi } from '@/lib/api-client';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'student' | 'instructor';
}

export default function CreateForumPostPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('general');
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const categories = [
    { id: 'general', name: 'General', icon: '💬', description: 'General discussions and topics' },
    { id: 'courses', name: 'Courses', icon: '📖', description: 'Course-related questions and discussions' },
    { id: 'technical', name: 'Technical', icon: '⚙️', description: 'Technical issues and support' },
    { id: 'assignments', name: 'Assignments', icon: '📝', description: 'Assignment help and discussions' },
    { id: 'help', name: 'Help', icon: '🆘', description: 'General help and support' },
  ];

  useEffect(() => {
    fetchUserData();
  }, [router]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const res = await fetchApi('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        const userData = data.user || data;
        
        if (userData.role && userData.role !== 'student') {
          if (userData.role === 'instructor') {
            router.push('/instructor/forum/create');
          } else {
            router.push('/');
          }
          return;
        }
        
        setUser(userData);
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileClick = () => {
    router.push('/student/profile');
  };

  const handleSettingsClick = () => {
    router.push('/student/settings');
  };

  const handleLogout = async () => {
    try {
      await fetchApi('/api/auth/logout', { method: 'POST' });
      localStorage.removeItem('token');
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      setError('Content is required');
      return;
    }

    if (content.length < 10) {
      setError('Content must be at least 10 characters long');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetchApi('/api/forum/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim() || content.substring(0, 100).trim() + (content.length > 100 ? '...' : ''),
          content: content.trim(),
          category,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/student/forum/${data.post._id}`);
      } else {
        const errorData = await res.json();
        setError(errorData.error || 'Failed to create post');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
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
      onProfileClick={handleProfileClick}
      onSettingsClick={handleSettingsClick}
      onLogout={handleLogout}
      pageTitle="Create Discussion"
      pageSubtitle="Start a new conversation with the community"
    >
      <div className="h-full overflow-y-auto bg-gray-50">
        <div className="max-w-4xl mx-auto p-6">
          {/* Back Button */}
          <Link
            href="/student/forum"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Forum
          </Link>

          {/* Form Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Start a New Discussion</h2>
              <p className="text-gray-600 mt-1">Share your thoughts, ask questions, or start a conversation</p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 className="font-semibold text-red-900">Error</h4>
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                </div>
              )}

              {/* Category Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Select Category <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        category === cat.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{cat.icon}</span>
                        <span className="font-semibold text-gray-900">{cat.name}</span>
                      </div>
                      <p className="text-sm text-gray-600">{cat.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title Input */}
              <div>
                <label htmlFor="title" className="block text-sm font-semibold text-gray-900 mb-2">
                  Title <span className="text-gray-500 text-xs font-normal">(Optional - will be generated from content if not provided)</span>
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Give your discussion a clear title..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  maxLength={200}
                />
                <p className="text-xs text-gray-500 mt-1">{title.length}/200 characters</p>
              </div>

              {/* Content Textarea */}
              <div>
                <label htmlFor="content" className="block text-sm font-semibold text-gray-900 mb-2">
                  Content <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your discussion content here... Be clear and descriptive."
                  rows={10}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 resize-none"
                  required
                />
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-gray-500">Minimum 10 characters</p>
                  <p className={`text-xs font-medium ${content.length < 10 ? 'text-red-500' : 'text-green-600'}`}>
                    {content.length} characters
                  </p>
                </div>
              </div>

              {/* Guidelines */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Community Guidelines
                </h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Be respectful and courteous to others</li>
                  <li>• Stay on topic and provide valuable contributions</li>
                  <li>• Use clear and descriptive titles</li>
                  <li>• Search before posting to avoid duplicates</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={submitting || !content.trim() || content.length < 10}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Publishing...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Publish Discussion</span>
                    </>
                  )}
                </button>
                <Link
                  href="/student/forum"
                  className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </Link>
              </div>
            </form>
          </div>

          {/* Tips Card */}
          <div className="mt-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="text-2xl">💡</span>
              Tips for Great Discussions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
              <div>
                <h4 className="font-medium mb-1">📝 Be Clear</h4>
                <p className="text-gray-600">Use descriptive titles and detailed explanations</p>
              </div>
              <div>
                <h4 className="font-medium mb-1">🎯 Stay Focused</h4>
                <p className="text-gray-600">Keep your discussion on a single topic</p>
              </div>
              <div>
                <h4 className="font-medium mb-1">🔍 Search First</h4>
                <p className="text-gray-600">Check if your question has been answered</p>
              </div>
              <div>
                <h4 className="font-medium mb-1">🤝 Be Respectful</h4>
                <p className="text-gray-600">Treat others with kindness and respect</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
