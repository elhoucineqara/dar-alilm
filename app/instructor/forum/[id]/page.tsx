'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { fetchApi, getFileUrl } from '@/lib/api-client';

interface User {
  id: string;
  _id?: string; // Keep for compatibility
  firstName: string;
  lastName: string;
  email: string;
  role: 'student' | 'instructor';
}

interface Reply {
  _id: string;
  content: string;
  authorId: string;
  author: {
    _id: string;
    firstName: string;
    lastName: string;
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
  authorId: string;
  author: {
    _id: string;
    firstName: string;
    lastName: string;
    role: string;
    profileImage?: string;
  };
  courseId?: {
    _id: string;
    title: string;
  };
  replies: Reply[];
  likes: string[];
  views: number;
  isPinned: boolean;
  media?: Array<{
    type: 'image' | 'video';
    url: string;
    thumbnail?: string;
  }>;
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
          console.error('Auth check failed:', res.status);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          router.push('/login');
          return;
        }
        const data = await res.json();
        console.log('Auth data received:', data);
        
        if (data.user.role !== 'instructor') {
          router.push('/student/dashboard');
          return;
        }
        
        console.log('Setting user:', data.user);
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
        console.log('Post data received:', data.post);
        console.log('Post media:', data.post.media);
        setPost(data.post);
      } else {
        console.error('Failed to fetch post');
      }
    } catch (error) {
      console.error('Error fetching post:', error);
    }
  };

  const handleLike = async () => {
    if (!user) {
      console.log('User not logged in');
      return;
    }
    try {
      console.log('Liking post...');
      console.log('User ID:', user.id);
      console.log('Current likes:', post?.likes);
      const token = localStorage.getItem('token');
      const res = await fetchApi(`/api/forum/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        console.log('Like response:', data);
        fetchPost();
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    setSubmittingReply(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetchApi(`/api/forum/posts/${postId}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: replyContent }),
      });

      if (res.ok) {
        const data = await res.json();
        setPost(data.post);
        setReplyContent('');
      }
    } catch (error) {
      console.error('Error posting reply:', error);
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleLikeReply = async (replyId: string) => {
    if (!user) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetchApi(`/api/forum/posts/${postId}/replies/${replyId}/like`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        fetchPost();
      }
    } catch (error) {
      console.error('Error liking reply:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading || !post) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading discussion...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const currentCategory = categories.find(cat => cat.id === post.category);

  return (
    <div className="p-3 sm:p-6 max-w-5xl mx-auto">
      {/* Back Button */}
      <Link
        href="/instructor/forum"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 group"
      >
        <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span className="font-medium">Back to forum</span>
      </Link>

      {/* Main Post */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sm:p-8 mb-6">
        {/* Category Badge */}
        {currentCategory && (
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r ${currentCategory.color} text-white text-sm font-semibold mb-4`}>
            <span>{currentCategory.icon}</span>
            <span>{currentCategory.name}</span>
          </div>
        )}

        {/* Meta Information */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-6 pb-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            {post.author.profileImage ? (
              <img 
                src={getFileUrl(post.author.profileImage)} 
                alt={`${post.author.firstName} ${post.author.lastName}`}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                {post.author.firstName.charAt(0)}{post.author.lastName.charAt(0)}
              </div>
            )}
            <div>
              <p className="font-medium text-gray-900">{post.author.firstName} {post.author.lastName}</p>
              <p className="text-xs text-gray-500">{post.author.role === 'instructor' ? 'Instructor' : 'Student'}</p>
            </div>
          </div>
          {post.courseId && (
            <div className="flex items-center gap-1 px-3 py-1 bg-blue-50 rounded-full">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span className="text-sm font-medium text-blue-600">{post.courseId.title}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{formatDate(post.createdAt)}</span>
          </div>
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>{post.views} views</span>
          </div>
        </div>

        {/* Content */}
        <div className="prose max-w-none mb-6">
          <p className="text-gray-900 text-lg font-medium whitespace-pre-wrap leading-relaxed">{post.content}</p>
        </div>

        {/* Media Gallery */}
        {post.media && post.media.length > 0 && (
          <div className={`grid gap-3 mb-6 ${
            post.media.length === 1 ? 'grid-cols-1' : 
            post.media.length === 2 ? 'grid-cols-2' : 
            post.media.length === 3 ? 'grid-cols-3' : 
            'grid-cols-2'
          }`}>
            {post.media.map((media, index) => (
              <div key={index} className="relative rounded-xl overflow-hidden bg-gray-100 shadow-md">
                {media.type === 'image' ? (
                  <img
                    src={getFileUrl(media.url)}
                    alt={`Media ${index + 1}`}
                    className="w-full h-auto max-h-96 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => window.open(getFileUrl(media.url), '_blank')}
                  />
                ) : (
                  <video
                    src={getFileUrl(media.url)}
                    className="w-full h-auto max-h-96 object-cover"
                    controls
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Like Button */}
        <button
          onClick={handleLike}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all bg-gray-100 text-gray-600 hover:bg-gray-200"
        >
          <svg 
            className={`w-5 h-5 transition-colors ${user && post.likes.includes(user.id) ? 'text-red-600' : 'text-gray-600'}`}
            fill={user && post.likes.includes(user.id) ? 'currentColor' : 'none'} 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span>{post.likes.length} {post.likes.length === 1 ? 'Like' : 'Likes'}</span>
        </button>
      </div>

      {/* Replies Section */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sm:p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          Replies ({post.replies.length})
        </h2>

        {/* Reply Form */}
        <form onSubmit={handleReply} className="mb-8">
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Write your reply..."
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none transition-all mb-3"
            disabled={submittingReply}
          />
          <button
            type="submit"
            disabled={submittingReply || !replyContent.trim()}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submittingReply ? 'Posting...' : 'Post Reply'}
          </button>
        </form>

        {/* Replies List */}
        <div className="space-y-6">
          {post.replies.length > 0 ? (
            post.replies.map((reply) => (
              <div key={reply._id} className="border-l-4 border-blue-200 pl-4">
                <div className="flex items-start gap-3 mb-3">
                  {reply.author.profileImage ? (
                    <img 
                      src={getFileUrl(reply.author.profileImage)} 
                      alt={`${reply.author.firstName} ${reply.author.lastName}`}
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                      {reply.author.firstName.charAt(0)}{reply.author.lastName.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-900">{reply.author.firstName} {reply.author.lastName}</p>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-gray-500">{formatDate(reply.createdAt)}</span>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap mb-4">{reply.content}</p>
                    <button
                      onClick={() => handleLikeReply(reply._id)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all bg-gray-100 text-gray-600 hover:bg-gray-200"
                    >
                      <svg 
                        className={`w-4 h-4 transition-colors ${user && reply.likes.includes(user.id) ? 'text-red-600' : 'text-gray-600'}`}
                        fill={user && reply.likes.includes(user.id) ? 'currentColor' : 'none'} 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      <span>{reply.likes.length}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 py-8">No replies yet. Be the first to reply!</p>
          )}
        </div>
      </div>
    </div>
  );
}

