'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchApi, getFileUrl } from '@/lib/api-client';
import Swal from 'sweetalert2';

interface ForumPost {
  _id: string;
  title: string;
  content: string;
  category?: string;
  author: {
    _id: string;
    firstName: string;
    lastName: string;
    profileImage?: string;
  };
  courseId?: {
    _id: string;
    title: string;
  };
  replies: number;
  views: number;
  media?: Array<{
    type: 'image' | 'video';
    url: string;
    thumbnail?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export default function ForumPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<ForumPost[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostCategory, setNewPostCategory] = useState('general');
  const [submitting, setSubmitting] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreview, setMediaPreview] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<{
    _id: string;
    firstName?: string;
    lastName?: string;
    profileImage?: string;
  } | null>(null);
  const [editingPost, setEditingPost] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState('general');
  const [editMediaFiles, setEditMediaFiles] = useState<File[]>([]);
  const [editMediaPreview, setEditMediaPreview] = useState<string[]>([]);
  const [existingMedia, setExistingMedia] = useState<Array<{type: string, url: string}>>([]);
  const [deletingPost, setDeletingPost] = useState<string | null>(null);

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
          if (data.user.role !== 'instructor') {
            router.push('/dashboard');
            return;
          }
          setCurrentUser(data.user);
          fetchForumPosts(token);
        }
        setLoading(false);
      })
      .catch(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
      });
  }, [router]);

  const fetchForumPosts = async (token: string) => {
    try {
      const res = await fetchApi('/api/instructor/forum');
      if (res.ok) {
        const data = await res.json();
        console.log('Forum posts:', data.posts);
        console.log('Current user:', currentUser);
        setPosts(data.posts || []);
        setFilteredPosts(data.posts || []);
      }
    } catch (error) {
      console.error('Error fetching forum posts:', error);
    }
  };

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredPosts(posts);
    } else {
      const filtered = posts.filter(post =>
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredPosts(filtered);
    }
  }, [searchQuery, posts]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      
      // Upload media files first if any
      const mediaUrls: Array<{type: string, url: string}> = [];
      if (mediaFiles.length > 0) {
        console.log('Uploading', mediaFiles.length, 'media files...');
        for (const file of mediaFiles) {
          console.log('Uploading file:', file.name, file.type);
          const formData = new FormData();
          formData.append('file', file);
          
          const uploadRes = await fetchApi('/api/instructor/upload', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            body: formData,
          });
          
          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            console.log('File uploaded successfully:', uploadData);
            console.log('File URL:', uploadData.fileUrl);
            const mediaType = file.type.startsWith('image/') ? 'image' : 'video';
            mediaUrls.push({
              type: mediaType,
              url: uploadData.fileUrl,
            });
          } else {
            const errorText = await uploadRes.text();
            console.error('Upload failed:', errorText);
            alert(`Upload failed: ${errorText}`);
          }
        }
      }

      console.log('Creating post with media:', mediaUrls);

      const res = await fetchApi('/api/forum/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: newPostContent,
          category: newPostCategory,
          media: mediaUrls,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        console.log('Post created successfully:', data);
        // Reset form
        setNewPostContent('');
        setNewPostCategory('general');
        setMediaFiles([]);
        setMediaPreview([]);
        setShowCreatePost(false);
        // Refresh posts
        if (token) {
          fetchForumPosts(token);
        }
      } else {
        console.error('Post creation failed:', await res.text());
      }
    } catch (error) {
      console.error('Failed to create post:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => 
      file.type.startsWith('image/') || file.type.startsWith('video/')
    );
    
    setMediaFiles(prev => [...prev, ...validFiles].slice(0, 4)); // Max 4 files
    
    // Create previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreview(prev => [...prev, reader.result as string].slice(0, 4));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeMedia = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setMediaPreview(prev => prev.filter((_, i) => i !== index));
  };

  const handleDeletePost = async (postId: string) => {
    const result = await Swal.fire({
      title: 'Delete Post',
      text: 'Are you sure you want to delete this post? All replies and likes will be permanently removed.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      backdrop: true,
      customClass: {
        popup: 'rounded-xl',
        confirmButton: 'px-6 py-2.5 rounded-lg font-medium',
        cancelButton: 'px-6 py-2.5 rounded-lg font-medium'
      }
    });

    if (!result.isConfirmed) return;
    
    setDeletingPost(postId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetchApi(`/api/forum/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (res.ok) {
        // Refresh posts
        if (token) {
          fetchForumPosts(token);
        }
        Swal.fire({
          title: 'Deleted!',
          text: 'Post has been deleted successfully.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      }
    } catch (error) {
      console.error('Failed to delete post:', error);
      Swal.fire({
        title: 'Error',
        text: 'Failed to delete post. Please try again.',
        icon: 'error',
        confirmButtonColor: '#dc2626'
      });
    } finally {
      setDeletingPost(null);
    }
  };

  const startEditPost = (post: ForumPost) => {
    setEditingPost(post._id);
    setEditContent(post.content);
    setEditCategory(post.category || 'general');
    // Load existing media
    console.log('Loading existing media:', post.media);
    setExistingMedia(post.media || []);
    // Reset new media
    setEditMediaFiles([]);
    setEditMediaPreview([]);
  };

  const cancelEdit = () => {
    setEditingPost(null);
    setEditContent('');
    setEditCategory('general');
    setEditMediaFiles([]);
    setEditMediaPreview([]);
    setExistingMedia([]);
  };

  const removeExistingMedia = (index: number) => {
    setExistingMedia(prev => prev.filter((_, i) => i !== index));
  };

  const moveExistingMediaLeft = (index: number) => {
    if (index === 0) return;
    setExistingMedia(prev => {
      const newMedia = [...prev];
      [newMedia[index - 1], newMedia[index]] = [newMedia[index], newMedia[index - 1]];
      return newMedia;
    });
  };

  const moveExistingMediaRight = (index: number) => {
    setExistingMedia(prev => {
      if (index === prev.length - 1) return prev;
      const newMedia = [...prev];
      [newMedia[index], newMedia[index + 1]] = [newMedia[index + 1], newMedia[index]];
      return newMedia;
    });
  };

  const handleEditMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => 
      file.type.startsWith('image/') || file.type.startsWith('video/')
    );
    
    setEditMediaFiles(prev => [...prev, ...validFiles].slice(0, 4));
    
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditMediaPreview(prev => [...prev, reader.result as string].slice(0, 4));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeEditMedia = (index: number) => {
    setEditMediaFiles(prev => prev.filter((_, i) => i !== index));
    setEditMediaPreview(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdatePost = async (postId: string) => {
    if (!editContent.trim()) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      
      // Upload new media files if any
      const newMediaUrls: Array<{type: string, url: string}> = [];
      if (editMediaFiles.length > 0) {
        console.log('Uploading', editMediaFiles.length, 'media files for edit...');
        for (const file of editMediaFiles) {
          const formData = new FormData();
          formData.append('file', file);
          
          const uploadRes = await fetchApi('/api/instructor/upload', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            body: formData,
          });
          
          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            const mediaType = file.type.startsWith('image/') ? 'image' : 'video';
            newMediaUrls.push({
              type: mediaType,
              url: uploadData.fileUrl,
            });
          }
        }
      }
      
      // Combine existing media (not deleted) + new media
      const allMedia = [...existingMedia, ...newMediaUrls];
      
      const res = await fetchApi(`/api/forum/posts/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: editContent,
          category: editCategory,
          media: allMedia,
        }),
      });

      if (res.ok) {
        cancelEdit();
        // Refresh posts
        if (token) {
          fetchForumPosts(token);
        }
      }
    } catch (error) {
      console.error('Failed to update post:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading forum...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Forum</h1>
            <p className="text-gray-600 mt-2">Manage discussions and engage with students</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Search posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
          />
          <svg
            className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Create Post Box - Facebook Style */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 mb-4">
          {!showCreatePost ? (
            <button
              onClick={() => setShowCreatePost(true)}
              className="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left"
            >
              {currentUser?.profileImage ? (
                <img 
                  src={getFileUrl(currentUser.profileImage)} 
                  alt={`${currentUser.firstName || ''} ${currentUser.lastName || ''}`}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {currentUser?.firstName?.charAt(0) || 'U'}{currentUser?.lastName?.charAt(0) || ''}
                </div>
              )}
              <span className="text-gray-500">What's on your mind? Share with students...</span>
            </button>
          ) : (
            <form onSubmit={handleCreatePost} className="space-y-4">
              {/* Content Input */}
              <textarea
                placeholder="What do you want to discuss?"
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                autoFocus
              />

              {/* Media Preview */}
              {mediaPreview.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {mediaPreview.map((preview, index) => (
                    <div key={index} className="relative group">
                      {mediaFiles[index]?.type.startsWith('image/') ? (
                        <img
                          src={preview}
                          alt="Preview"
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      ) : (
                        <video
                          src={preview}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => removeMedia(index)}
                        className="absolute top-1 right-1 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                <input
                  type="file"
                  id="media-upload"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleMediaSelect}
                  className="hidden"
                  disabled={mediaFiles.length >= 4}
                />
                <label
                  htmlFor="media-upload"
                  className={`p-2 rounded-lg transition-all cursor-pointer ${
                    mediaFiles.length >= 4
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                  }`}
                  title="Add photo/video"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </label>
                
                <div className="flex-1 flex gap-2">
                  <button
                    type="submit"
                    disabled={submitting || !newPostContent.trim()}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Posting...' : 'Post'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreatePost(false);
                      setNewPostContent('');
                      setNewPostCategory('general');
                      setMediaFiles([]);
                      setMediaPreview([]);
                    }}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Posts List */}
      <div className="space-y-4">
        {filteredPosts.length > 0 ? (
          filteredPosts.map((post) => (
            <div
              key={post._id}
              className="bg-white rounded-lg shadow-md border border-gray-200 p-4 sm:p-6 hover:border-blue-300 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 cursor-pointer" onClick={() => router.push(`/instructor/forum/${post._id}`)}>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-blue-600 transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {post.content}
                  </p>
                  
                  {/* Media Gallery - Hide when editing */}
                  {!editingPost && post.media && post.media.length > 0 && (
                    <div className={`grid gap-2 mb-3 ${
                      post.media.length === 1 ? 'grid-cols-1' : 
                      post.media.length === 2 ? 'grid-cols-2' : 
                      'grid-cols-2'
                    }`}>
                      {post.media.slice(0, 4).map((media, index) => (
                        <div key={index} className="relative rounded-lg overflow-hidden bg-gray-100">
                          {media.type === 'image' ? (
                            <img
                              src={getFileUrl(media.url)}
                              alt="Post media"
                              className="w-full h-40 object-cover"
                            />
                          ) : (
                            <video
                              src={getFileUrl(media.url)}
                              className="w-full h-40 object-cover"
                              controls
                            />
                          )}
                          {index === 3 && post.media && post.media.length > 4 && (
                            <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                              <span className="text-white text-2xl font-bold">+{post.media.length - 4}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      {post.author.profileImage ? (
                        <img 
                          src={getFileUrl(post.author.profileImage)} 
                          alt={`${post.author.firstName} ${post.author.lastName}`}
                          className="w-8 h-8 rounded-full object-cover ring-2 ring-white"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold ring-2 ring-white">
                          {post.author.firstName.charAt(0)}{post.author.lastName.charAt(0)}
                        </div>
                      )}
                      <span className="font-medium text-gray-700">{post.author.firstName} {post.author.lastName}</span>
                    </div>
                    {post.courseId && (
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <span>{post.courseId.title}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                      <span>{post.replies} replies</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span>{post.views} views</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{formatDate(post.createdAt)}</span>
                    </div>
                  </div>
                </div>
                
                {/* Edit/Delete buttons - Always show for debugging */}
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('Post author ID:', post.author._id);
                      console.log('Current user:', currentUser);
                      console.log('Match:', currentUser && post.author._id === currentUser._id);
                      startEditPost(post);
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit post"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePost(post._id);
                    }}
                    disabled={deletingPost === post._id}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Delete post"
                  >
                    {deletingPost === post._id ? (
                      <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Edit form */}
              {editingPost === post._id && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none mb-3"
                  />
                  
                  {/* Existing Media */}
                  {existingMedia.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm text-gray-600 mb-2">Current media:</p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {existingMedia.map((media, index) => {
                          const mediaUrl = getFileUrl(media.url);
                          console.log(`Media ${index}:`, media, 'URL:', mediaUrl);
                          return (
                          <div key={`existing-${index}`} className="relative group bg-gray-100 rounded-lg overflow-hidden">
                            {media.type === 'image' ? (
                              <img
                                src={mediaUrl}
                                alt="Existing media"
                                className="w-full h-32 object-cover"
                                onError={(e) => console.error('Image load error:', e)}
                                onLoad={() => console.log('Image loaded:', mediaUrl)}
                              />
                            ) : (
                              <video
                                src={mediaUrl}
                                className="w-full h-32 object-cover"
                              />
                            )}
                            {/* Control buttons - show on hover */}
                            <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={() => removeExistingMedia(index)}
                                className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg"
                                title="Delete"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                            <div className="absolute bottom-1 left-1 right-1 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={() => moveExistingMediaLeft(index)}
                                disabled={index === 0}
                                className="p-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg disabled:opacity-30 disabled:cursor-not-allowed"
                                title="Move left"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                onClick={() => moveExistingMediaRight(index)}
                                disabled={index === existingMedia.length - 1}
                                className="p-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg disabled:opacity-30 disabled:cursor-not-allowed"
                                title="Move right"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* New Media Preview for Edit */}
                  {editMediaPreview.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm text-gray-600 mb-2">New media to add:</p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {editMediaPreview.map((preview, index) => (
                          <div key={`new-${index}`} className="relative group">
                            {editMediaFiles[index]?.type.startsWith('image/') ? (
                              <img
                                src={preview}
                                alt="Preview"
                                className="w-full h-32 object-cover rounded-lg"
                              />
                            ) : (
                              <video
                                src={preview}
                                className="w-full h-32 object-cover rounded-lg"
                              />
                            )}
                            <button
                              type="button"
                              onClick={() => removeEditMedia(index)}
                              className="absolute top-1 right-1 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      id={`edit-media-upload-${post._id}`}
                      accept="image/*,video/*"
                      multiple
                      onChange={handleEditMediaSelect}
                      className="hidden"
                      disabled={editMediaFiles.length >= 4}
                    />
                    <label
                      htmlFor={`edit-media-upload-${post._id}`}
                      className={`p-2 rounded-lg transition-all cursor-pointer ${
                        editMediaFiles.length >= 4
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                      }`}
                      title="Add photo/video"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </label>
                    
                    <div className="flex-1 flex gap-2">
                      <button
                        onClick={() => handleUpdatePost(post._id)}
                        disabled={submitting}
                        className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
                      >
                        {submitting ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <p className="text-gray-600 mb-2">
              {searchQuery ? 'No posts found matching your search' : 'No forum posts yet'}
            </p>
            <p className="text-sm text-gray-500 mb-4">
              {searchQuery ? 'Try a different search term' : 'Create your first post to start discussions'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowCreatePost(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create First Post
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

