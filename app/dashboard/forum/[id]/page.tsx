'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { fetchApi } from '@/lib/api-client';
import StudentLayout from '@/app/components/StudentLayout';
import InstructorLayout from '@/app/components/InstructorLayout';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'student' | 'instructor';
}

interface Reply {
  _id: string;
  content: string;
  author: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  likes: string[];
  createdAt: string;
}

interface ForumPost {
  _id: string;
  title: string;
  content: string;
  category: string;
  author: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  likes: string[];
  replies: Reply[];
  views: number;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function ForumPostPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<ForumPost | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const categories = [
    { id: 'general', name: 'General', icon: '💬', color: 'from-blue-500 to-blue-600' },
    { id: 'courses', name: 'Courses', icon: '📖', color: 'from-green-500 to-green-600' },
    { id: 'technical', name: 'Technical', icon: '⚙️', color: 'from-orange-500 to-orange-600' },
    { id: 'assignments', name: 'Assignments', icon: '📝', color: 'from-purple-500 to-purple-600' },
    { id: 'help', name: 'Help', icon: '🆘', color: 'from-red-500 to-red-600' },
  ];

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const checkAuth = async () => {
      try {
        const res = await fetchApi('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          router.push('/login');
          return;
        }
        const data = await res.json();
        setUser(data.user);
        fetchPost();
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router, postId]);

  const fetchPost = async () => {
    try {
      const res = await fetchApi(`/api/forum/posts/${postId}`);
      if (res.ok) {
        const data = await res.json();
        setPost(data.post);
      } else {
        router.push('/dashboard/forum');
      }
    } catch (error) {
      console.error('Failed to fetch post:', error);
      router.push('/dashboard/forum');
    }
  };

  const handleLikePost = async () => {
    if (!user || !post) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetchApi(`/api/forum/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
      });

      if (res.ok) {
        fetchPost();
      }
    } catch (error) {
      console.error('Failed to like post:', error);
    }
  };

  const handleLikeReply = async (replyId: string) => {
    if (!user) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetchApi(`/api/forum/posts/${postId}/replies/${replyId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
      });

      if (res.ok) {
        fetchPost();
      }
    } catch (error) {
      console.error('Failed to like reply:', error);
    }
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || submittingReply) return;

    setSubmittingReply(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetchApi(`/api/forum/posts/${postId}/replies`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: replyContent }),
      });

      if (res.ok) {
        setReplyContent('');
        fetchPost();
      }
    } catch (error) {
      console.error('Failed to submit reply:', error);
    } finally {
      setSubmittingReply(false);
    }
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const posted = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - posted.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} d ago`;
    return posted.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const handleProfileClick = () => {
    router.push('/dashboard/profile');
  };

  const handleSettingsClick = () => {
    router.push('/dashboard/settings');
  };

  const handleLogout = () => {
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-blue-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 animate-spin"></div>
          </div>
          <p className="text-gray-600 font-medium">Loading discussion...</p>
        </div>
      </div>
    );
  }

  if (!user || !post) {
    return null;
  }

  const category = categories.find(c => c.id === post.category);
  const isLikedByUser = post.likes.includes(user._id);

  // Post content component
  const postContent = (
      <div className="h-full overflow-y-auto bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
        <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
          {/* Back Button */}
          <Link
            href="/dashboard/forum"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 group"
          >
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="font-medium">Back to forum</span>
          </Link>

          {/* Post */}
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 mb-6 border border-gray-100">
            {/* Header */}
            <div className="flex items-start gap-4 mb-6">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  {post.author.firstName.charAt(0)}{post.author.lastName.charAt(0)}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {post.isPinned && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-lg">
                      📌 Épinglé
                    </span>
                  )}
                  {category && (
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r ${category.color} text-white text-xs font-semibold rounded-lg shadow-sm`}>
                      <span>{category.icon}</span>
                      <span>{category.name}</span>
                    </span>
                  )}
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{post.title}</h1>
                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                  <span className="font-semibold text-gray-900">
                    {post.author.firstName} {post.author.lastName}
                  </span>
                  <span>•</span>
                  <span>{getTimeAgo(post.createdAt)}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    {post.views} vues
                  </span>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="prose max-w-none mb-6">
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{post.content}</p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
              <button
                onClick={handleLikePost}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  isLikedByUser
                    ? 'bg-red-100 text-red-600 hover:bg-red-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <svg className="w-5 h-5" fill={isLikedByUser ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span>{post.likes.length}</span>
              </button>
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-600 rounded-lg font-medium">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>{post.replies.length} replies</span>
              </div>
            </div>
          </div>

          {/* Reply Form */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Add a reply</h3>
            <form onSubmit={handleSubmitReply}>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold shadow-lg">
                    {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                  </div>
                </div>
                <div className="flex-1">
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Write your reply..."
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all mb-3"
                    disabled={submittingReply}
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={submittingReply || !replyContent.trim()}
                      className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submittingReply ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Envoi...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                          <span>Reply</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Replies */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {post.replies.length} {post.replies.length === 1 ? 'Reply' : 'Replies'}
            </h3>
            {post.replies.map((reply) => (
              <div key={reply._id} className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold shadow-lg">
                      {reply.author.firstName.charAt(0)}{reply.author.lastName.charAt(0)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-semibold text-gray-900">
                        {reply.author.firstName} {reply.author.lastName}
                      </span>
                      <span className="text-sm text-gray-500">{getTimeAgo(reply.createdAt)}</span>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap mb-4">{reply.content}</p>
                    <button
                      onClick={() => handleLikeReply(reply._id)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        reply.likes.includes(user._id)
                          ? 'bg-red-100 text-red-600 hover:bg-red-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <svg className="w-4 h-4" fill={reply.likes.includes(user._id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      <span>{reply.likes.length}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
  );

  // Render with appropriate layout based on user role
  if (user.role === 'instructor') {
    return <InstructorLayout>{postContent}</InstructorLayout>;
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
      pageTitle="Discussion"
      pageSubtitle={post.title}
    >
      {postContent}
    </StudentLayout>
  );
}

