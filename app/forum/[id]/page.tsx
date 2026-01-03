'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { fetchApi, getFileUrl } from '@/lib/api-client';

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

export default function PublicForumPostPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<ForumPost | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
    
    if (postId) {
      fetchPost();
    }
  }, [postId]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const res = await fetchApi(`/api/forum/posts/${postId}`);
      if (res.ok) {
        const data = await res.json();
        setPost(data.post);
      }
    } catch (error) {
      console.error('Error fetching post:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginRedirect = () => {
    router.push(`/login?redirect=/forum/${postId}`);
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
        return `${minutes} min ago`;
      }
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Post not found.</p>
          <Link href="/forum" className="mt-4 text-blue-600 hover:text-blue-800">
            Back to Forum
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/forum" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back to Forum</span>
            </Link>
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <Link
                  href="/student/forum"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Go to Forum
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-4 py-2 text-gray-700 font-medium hover:text-gray-900 transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Post */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {post.isPinned && (
                  <span className="text-yellow-500">📌</span>
                )}
                <h1 className="text-2xl font-bold text-gray-900">{post.title || 'Untitled'}</h1>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                <div className="flex items-center gap-2">
                  {post.author.profileImage ? (
                    <img
                      src={getFileUrl(post.author.profileImage)}
                      alt={`${post.author.firstName} ${post.author.lastName}`}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium">
                      {post.author.firstName[0]}{post.author.lastName[0]}
                    </div>
                  )}
                  <span className="font-medium text-gray-700">
                    {post.author.firstName} {post.author.lastName}
                  </span>
                  {post.author.role && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                      {post.author.role}
                    </span>
                  )}
                </div>
                <span>•</span>
                <span>{formatDate(post.createdAt)}</span>
                <span>•</span>
                <span>{post.views || 0} views</span>
                <span>•</span>
                <span>{post.likes?.length || 0} likes</span>
              </div>
            </div>
          </div>

          <div className="prose max-w-none mb-6">
            <p className="text-gray-700 whitespace-pre-wrap">{post.content}</p>
          </div>

          {post.media && post.media.length > 0 && (
            <div className="mb-6 space-y-2">
              {post.media.map((media, index) => (
                <div key={index}>
                  {media.type === 'image' ? (
                    <img
                      src={getFileUrl(media.url)}
                      alt={`Media ${index + 1}`}
                      className="max-w-full rounded-lg"
                    />
                  ) : (
                    <video
                      src={getFileUrl(media.url)}
                      controls
                      className="max-w-full rounded-lg"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Comments Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              Comments ({post.replies?.length || 0})
            </h2>
            {!isAuthenticated && (
              <button
                onClick={handleLoginRedirect}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Sign in to Comment
              </button>
            )}
          </div>

          {!isAuthenticated && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Want to join the discussion?</strong> 
                <button onClick={handleLoginRedirect} className="ml-1 text-blue-600 hover:text-blue-800 underline font-medium">
                  Sign in
                </button> to comment on this post.
              </p>
            </div>
          )}

          {post.replies && post.replies.length > 0 ? (
            <div className="space-y-4">
              {post.replies.map((reply) => (
                <div key={reply._id} className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
                  <div className="flex items-start gap-3">
                    {reply.author.profileImage ? (
                      <img
                        src={getFileUrl(reply.author.profileImage)}
                        alt={`${reply.author.firstName} ${reply.author.lastName}`}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                        {reply.author.firstName[0]}{reply.author.lastName[0]}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900">
                          {reply.author.firstName} {reply.author.lastName}
                        </span>
                        {reply.author.role && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                            {reply.author.role}
                          </span>
                        )}
                        <span className="text-sm text-gray-500">•</span>
                        <span className="text-sm text-gray-500">{formatDate(reply.createdAt)}</span>
                        <span className="text-sm text-gray-500">•</span>
                        <span className="text-sm text-gray-500">{reply.likes?.length || 0} likes</span>
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap">{reply.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No comments yet.</p>
              {!isAuthenticated && (
                <p className="mt-2 text-sm">
                  <button onClick={handleLoginRedirect} className="text-blue-600 hover:text-blue-800 underline">
                    Sign in
                  </button> to be the first to comment!
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

