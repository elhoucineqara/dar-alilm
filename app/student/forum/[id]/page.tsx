'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import StudentLayout from '@/app/components/StudentLayout';
import { fetchApi, getFileUrl } from '@/lib/api-client';

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
    role?: string;
    profileImage?: string;
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
    role?: string;
    profileImage?: string;
  };
  likes: string[];
  replies: Reply[];
  views: number;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  media?: Array<{
    type: 'image' | 'video';
    url: string;
    thumbnail?: string;
  }>;
}

export default function ForumPostDetailPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingPost, setLoadingPost] = useState(true);
  const [post, setPost] = useState<ForumPost | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const replyFormRef = useRef<HTMLDivElement>(null); // Reference to reply form
  const [showReplyMenu, setShowReplyMenu] = useState<string | null>(null); // Track which reply menu is open

  const categories = [
    { id: 'general', name: 'General', icon: '💬' },
    { id: 'courses', name: 'Courses', icon: '📖' },
    { id: 'technical', name: 'Technical', icon: '⚙️' },
    { id: 'assignments', name: 'Assignments', icon: '📝' },
    { id: 'help', name: 'Help', icon: '🆘' },
  ];

  useEffect(() => {
    fetchUserData();
  }, [router]);

  useEffect(() => {
    if (user && postId) {
      fetchPost();
    }
  }, [user, postId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
      // Close reply menu when clicking outside
      if (showReplyMenu) {
        const target = event.target as HTMLElement;
        if (!target.closest('.relative')) {
          setShowReplyMenu(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showReplyMenu]);

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
            router.push(`/instructor/forum/${postId}`);
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

  const fetchPost = async () => {
    try {
      setLoadingPost(true);
      const res = await fetchApi(`/api/forum/posts/${postId}`);
      if (res.ok) {
        const data = await res.json();
        setPost(data.post);
      } else {
        console.error('Failed to fetch post');
        router.push('/student/forum');
      }
    } catch (error) {
      console.error('Error fetching post:', error);
      router.push('/student/forum');
    } finally {
      setLoadingPost(false);
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

  const scrollToReplyForm = () => {
    replyFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // Focus on the textarea after scrolling
    setTimeout(() => {
      const textarea = replyFormRef.current?.querySelector('textarea');
      textarea?.focus();
    }, 500);
  };

  const handleCopyReply = (content: string) => {
    navigator.clipboard.writeText(content);
    alert('Reply copied to clipboard!');
    setShowReplyMenu(null);
  };

  const handleEditReply = (replyId: string) => {
    alert('Edit functionality coming soon!');
    setShowReplyMenu(null);
  };

  const handleDeleteReply = async (replyId: string) => {
    if (!confirm('Are you sure you want to delete this reply?')) return;
    
    try {
      const res = await fetchApi(`/api/forum/posts/${postId}/replies/${replyId}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        fetchPost(); // Refresh the post
        alert('Reply deleted successfully!');
      } else {
        alert('Failed to delete reply');
      }
    } catch (error) {
      console.error('Error deleting reply:', error);
      alert('An error occurred');
    }
    setShowReplyMenu(null);
  };

  const handleReplyToReply = (authorName: string, content: string) => {
    const textarea = replyFormRef.current?.querySelector('textarea') as HTMLTextAreaElement;
    if (textarea) {
      textarea.value = `@${authorName} ${content}\n\n`;
      scrollToReplyForm();
    }
    setShowReplyMenu(null);
  };

  const handleLikePost = async () => {
    if (!post || !user) return;

    try {
      const res = await fetchApi(`/api/forum/posts/${postId}/like`, {
        method: 'POST',
      });

      if (res.ok) {
        const data = await res.json();
        setPost(data.post);
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleLikeReply = async (replyId: string) => {
    if (!post || !user) return;

    try {
      const res = await fetchApi(`/api/forum/posts/${postId}/replies/${replyId}/like`, {
        method: 'POST',
      });

      if (res.ok) {
        const data = await res.json();
        setPost(data.post);
      }
    } catch (error) {
      console.error('Error liking reply:', error);
    }
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!replyContent.trim()) {
      setError('Reply content is required');
      return;
    }

    if (replyContent.length < 5) {
      setError('Reply must be at least 5 characters long');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetchApi(`/api/forum/posts/${postId}/replies`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: replyContent.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setPost(data.post);
        setReplyContent('');
      } else {
        const errorData = await res.json();
        setError(errorData.error || 'Failed to post reply');
      }
    } catch (error) {
      console.error('Error posting reply:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours === 0) {
        const minutes = Math.floor(diff / (1000 * 60));
        return minutes <= 1 ? 'Just now' : `${minutes} minutes ago`;
      }
      return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
    }
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Helper function to check if user has liked
  const isLiked = (likes: any[]) => {
    if (!likes || !user) return false;
    // Get user ID (could be _id or id depending on the response)
    const userId = user._id || (user as any).id;
    if (!userId) return false;
    // Convert all IDs to strings for comparison
    return likes.some(id => String(id) === String(userId));
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
      pageTitle="Forum Discussion"
      pageSubtitle="View and participate in the discussion"
    >
      <div className="h-full overflow-y-auto bg-gray-50">
        <div className="max-w-5xl mx-auto p-6">
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

          {loadingPost ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          ) : post ? (
            <>
              {/* Main Post */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
                {/* Post Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-start gap-4 mb-4">
              <div className="flex-shrink-0">
                      {post.author?.profileImage ? (
                        <img
                          src={getFileUrl(post.author.profileImage)}
                          alt={`${post.author?.firstName} ${post.author?.lastName}`}
                          className="w-14 h-14 rounded-full object-cover border-2 border-blue-500"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-lg">
                          {post.author?.firstName?.charAt(0) || 'U'}{post.author?.lastName?.charAt(0) || ''}
                </div>
                      )}
              </div>
              <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">
                          {post.author?.firstName || 'Unknown'} {post.author?.lastName || 'User'}
                        </h3>
                        {post.author?.role === 'instructor' && (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                            Instructor
                    </span>
                  )}
                        {post.isPinned && (
                          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded flex items-center gap-1">
                            <span>📌</span>
                            Pinned
                    </span>
                  )}
                </div>
                      <p className="text-sm text-gray-500">{formatDate(post.createdAt)}</p>
                    </div>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                      categories.find(c => c.id === post.category)?.icon
                    } bg-blue-100 text-blue-700`}>
                      {categories.find(c => c.id === post.category)?.name || post.category}
                  </span>
                </div>

                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{post.content}</p>
                  
                  {/* Post Media */}
                  {post.media && post.media.length > 0 && (
                    <div className="mt-4 space-y-3">
                      {post.media.map((item, index) => (
                        <div key={index} className="rounded-lg overflow-hidden border border-gray-200">
                          {item.type === 'image' ? (
                            <img
                              src={getFileUrl(item.url)}
                              alt={`Post image ${index + 1}`}
                              className="w-full h-auto object-cover max-h-96"
                            />
                          ) : item.type === 'video' ? (
                            <video
                              src={getFileUrl(item.url)}
                              poster={item.thumbnail ? getFileUrl(item.thumbnail) : undefined}
                              controls
                              className="w-full h-auto max-h-96"
                            >
                              Your browser does not support the video tag.
                            </video>
                          ) : null}
              </div>
                      ))}
            </div>
                  )}
            </div>

                {/* Post Actions */}
                <div className="px-6 py-4 flex items-center gap-6 text-sm text-gray-600">
              <button
                onClick={handleLikePost}
                    className={`flex items-center gap-2 transition-colors ${
                      isLiked(post.likes)
                        ? 'text-red-600'
                        : 'hover:text-red-600'
                    }`}
                  >
                    {isLiked(post.likes) ? (
                      <svg key="filled" className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                        <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    ) : (
                      <svg key="outline" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                    )}
                    <span className="font-medium">{post.likes.length}</span>
                    <span>Likes</span>
              </button>
                  <button
                    onClick={scrollToReplyForm}
                    className="flex items-center gap-2 hover:text-blue-600 transition-colors cursor-pointer"
                  >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                    <span className="font-medium">{post.replies.length}</span>
                    <span>Replies</span>
                  </button>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span className="font-medium">{post.views}</span>
                    <span>Views</span>
              </div>
            </div>
          </div>

              {/* Replies Section */}
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  {post.replies.length} {post.replies.length === 1 ? 'Reply' : 'Replies'}
                </h2>

                {post.replies.length > 0 ? (
                  <div className="space-y-4">
                    {post.replies.map((reply) => (
                      <div key={reply._id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                            {reply.author?.profileImage ? (
                              <img
                                src={getFileUrl(reply.author.profileImage)}
                                alt={`${reply.author?.firstName} ${reply.author?.lastName}`}
                                className="w-12 h-12 rounded-full object-cover border-2 border-green-500"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center text-white font-semibold">
                                {reply.author?.firstName?.charAt(0) || 'U'}{reply.author?.lastName?.charAt(0) || ''}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-gray-900">
                                  {reply.author?.firstName || 'Unknown'} {reply.author?.lastName || 'User'}
                                </h4>
                                {reply.author?.role === 'instructor' && (
                                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                                    Instructor
                                  </span>
                                )}
                                <span className="text-sm text-gray-500">• {formatDate(reply.createdAt)}</span>
                              </div>
                              
                              {/* Reply Menu Button */}
                              <div className="relative">
                                <button
                                  onClick={() => setShowReplyMenu(showReplyMenu === reply._id ? null : reply._id)}
                                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                  <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                                  </svg>
                                </button>
                                
                                {/* Dropdown Menu */}
                                {showReplyMenu === reply._id && (
                                  <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                                    <button
                                      key={`reply-menu-reply-${reply._id}`}
                                      onClick={() => handleReplyToReply(`${reply.author?.firstName} ${reply.author?.lastName}`, reply.content)}
                                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                      </svg>
                                      Reply
                                    </button>
                                    <button
                                      key={`reply-menu-copy-${reply._id}`}
                                      onClick={() => handleCopyReply(reply.content)}
                                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                      </svg>
                                      Copy
                                    </button>
                                    <button
                                      key={`reply-menu-edit-${reply._id}`}
                                      onClick={() => handleEditReply(reply._id)}
                                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                      Edit
                                    </button>
                                    <button
                                      key={`reply-menu-delete-${reply._id}`}
                                      onClick={() => handleDeleteReply(reply._id)}
                                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                      Delete
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed mb-3">{reply.content}</p>
                            <button
                              onClick={() => handleLikeReply(reply._id)}
                              className={`flex items-center gap-1 text-sm transition-colors ${
                                isLiked(reply.likes || [])
                                  ? 'text-red-600'
                                  : 'text-gray-600 hover:text-red-600'
                              }`}
                            >
                              {isLiked(reply.likes || []) ? (
                                <svg key={`reply-filled-${reply._id}`} className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                  <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                              ) : (
                                <svg key={`reply-outline-${reply._id}`} className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                              )}
                              <span className="font-medium">{reply.likes?.length || 0}</span>
                            </button>
                          </div>
                  </div>
                </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">No replies yet</h3>
                    <p className="text-gray-600">Be the first to reply to this discussion!</p>
                  </div>
                )}
              </div>

              {/* Reply Form */}
              <div ref={replyFormRef} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Add Your Reply</h3>
                
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmitReply}>
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Write your reply here... Be respectful and constructive."
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 resize-none mb-3"
                    required
                  />
                  <div className="flex justify-between items-center">
                    <p className={`text-xs ${replyContent.length < 5 ? 'text-red-500' : 'text-gray-500'}`}>
                      Minimum 5 characters • {replyContent.length} characters
                    </p>
                    <button
                      type="submit"
                      disabled={submitting || !replyContent.trim() || replyContent.length < 5}
                      className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Posting...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                          <span>Post Reply</span>
                        </>
                      )}
                    </button>
              </div>
            </form>
          </div>
            </>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Discussion not found</h3>
              <p className="text-gray-600 mb-6">The discussion you're looking for doesn't exist or has been removed.</p>
              <Link
                href="/student/forum"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
              >
                Back to Forum
              </Link>
                  </div>
          )}
        </div>
      </div>
    </StudentLayout>
  );
}
