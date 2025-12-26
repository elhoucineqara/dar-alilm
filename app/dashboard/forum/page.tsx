'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchApi } from '@/lib/api-client';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'student' | 'instructor';
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
  replies: number;
  views: number;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function ForumPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<ForumPost[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'unanswered'>('recent');

  const categories = [
    { id: 'all', name: 'All Categories', icon: '📚', color: 'from-blue-500 to-purple-500' },
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
        
        // Redirect instructors to their forum
        if (data.user.role === 'instructor') {
          router.push('/instructor/forum');
          return;
        }
        
        fetchPosts();
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
  }, [router]);

  const fetchPosts = async () => {
    try {
      const res = await fetchApi('/api/forum/posts');
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
        setFilteredPosts(data.posts || []);
      } else {
        console.error('Failed to fetch posts:', res.status);
        // Still set empty arrays to prevent infinite loading
        setPosts([]);
        setFilteredPosts([]);
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error);
      // Still set empty arrays to prevent infinite loading
      setPosts([]);
      setFilteredPosts([]);
    }
  };

  useEffect(() => {
    let filtered = [...posts];

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(post => post.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort
    if (sortBy === 'recent') {
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === 'popular') {
      filtered.sort((a, b) => (b.likes.length + b.replies) - (a.likes.length + a.replies));
    } else if (sortBy === 'unanswered') {
      filtered = filtered.filter(post => post.replies === 0);
    }

    // Pinned posts always on top
    filtered.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));

    setFilteredPosts(filtered);
  }, [posts, searchQuery, selectedCategory, sortBy]);

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const posted = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - posted.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} d ago`;
    return posted.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-blue-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 animate-spin"></div>
          </div>
          <p className="text-gray-600 font-medium">Loading forum...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header with Search and Create Button */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              {/* Search Bar */}
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search in the forum..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Create Post Button */}
              <Link
                href="/dashboard/forum/create"
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>New Discussion</span>
              </Link>
            </div>

            {/* Categories */}
            <div className="flex flex-wrap gap-2 mt-4">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    selectedCategory === category.id
                      ? `bg-gradient-to-r ${category.color} text-white shadow-md`
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span>{category.icon}</span>
                  <span className="text-sm">{category.name}</span>
                </button>
              ))}
            </div>

            {/* Sort Options */}
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
              <span className="text-sm text-gray-600 font-medium">Sort by:</span>
              <div className="flex gap-2">
                {[
                  { value: 'recent', label: 'Recent', icon: '🕐' },
                  { value: 'popular', label: 'Popular', icon: '🔥' },
                  { value: 'unanswered', label: 'Unanswered', icon: '❓' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSortBy(option.value as any)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      sortBy === option.value
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <span>{option.icon}</span>
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

        {/* Posts List */}
        <div className="space-y-4">
            {filteredPosts.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-100">
                <div className="text-6xl mb-4">💬</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No discussions found</h3>
                <p className="text-gray-600 mb-6">Be the first to start a discussion!</p>
                <Link
                  href="/dashboard/forum/create"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create a discussion
                </Link>
              </div>
            ) : (
              filteredPosts.map((post) => (
                <Link
                  key={post._id}
                  href={`/dashboard/forum/${post._id}`}
                  className="block bg-white rounded-2xl shadow-lg hover:shadow-xl p-6 border border-gray-100 transition-all hover:scale-[1.01] group"
                >
                  <div className="flex items-start gap-4">
                    {/* Author Avatar */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold shadow-lg">
                        {post.author.firstName.charAt(0)}{post.author.lastName.charAt(0)}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {post.isPinned && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded">
                                📌 Pinned
                              </span>
                            )}
                            <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                              {post.title}
                            </h3>
                          </div>
                          <p className="text-gray-600 text-sm line-clamp-2">{post.content}</p>
                        </div>
                        <div className="flex-shrink-0">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r ${
                            categories.find(c => c.id === post.category)?.color || 'from-gray-400 to-gray-500'
                          } text-white text-xs font-semibold rounded-lg shadow-sm`}>
                            {categories.find(c => c.id === post.category)?.icon}
                            {categories.find(c => c.id === post.category)?.name}
                          </span>
                        </div>
                      </div>

                      {/* Meta Info */}
                      <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
                        <span className="font-medium text-gray-700">
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
                          {post.views}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                          </svg>
                          {post.likes.length}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          {post.replies}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

