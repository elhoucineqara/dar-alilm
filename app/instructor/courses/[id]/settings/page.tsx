'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { fetchApi, getFileUrl } from '@/lib/api-client';

interface Course {
  _id: string;
  title: string;
  description: string;
  categoryId: { _id: string; name: string } | string;
  price: number;
  thumbnail?: string;
  status: 'draft' | 'published';
  createdAt: string;
  updatedAt: string;
}

export default function CourseSettingsPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<Course | null>(null);
  
  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(0);
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      router.push('/login');
      return;
    }

    fetchCourse(token);
  }, [courseId, router]);

  const fetchCourse = async (token: string) => {
    try {
      const res = await fetchApi(`/api/instructor/courses/${courseId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setCourse(data.course);
        setTitle(data.course.title);
        setDescription(data.course.description);
        setPrice(data.course.price || 0);
        setStatus(data.course.status || 'draft');
        if (data.course.thumbnail) {
          setThumbnailPreview(getFileUrl(data.course.thumbnail));
        }
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching course:', error);
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      let thumbnailUrl = undefined;

      // Upload image if a file was selected
      if (thumbnailFile) {
        setUploadingThumbnail(true);
        const uploadFormData = new FormData();
        uploadFormData.append('file', thumbnailFile);

        const uploadRes = await fetchApi('/api/instructor/upload', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: uploadFormData,
        });

        if (!uploadRes.ok) {
          const errorData = await uploadRes.json();
          const errorMsg = errorData.error || 'Failed to upload thumbnail';
          console.error('Upload error:', errorMsg);
          alert(`Upload failed: ${errorMsg}`);
          setUploadingThumbnail(false);
          setSaving(false);
          return;
        }

        const uploadData = await uploadRes.json();
        thumbnailUrl = uploadData.fileUrl;
        setUploadingThumbnail(false);
      }

      const res = await fetchApi(`/api/instructor/courses/${courseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
          price,
          status,
          thumbnail: thumbnailUrl,
        }),
      });

      if (res.ok) {
        await fetchCourse(token!);
        router.push('/instructor/courses');
      } else {
        const data = await res.json();
        const errorMsg = data.error || 'Failed to update course settings';
        console.error('Update error:', errorMsg);
        alert(`Failed to update: ${errorMsg}`);
      }
    } catch (error: any) {
      const errorMsg = error.message || 'An error occurred. Please try again.';
      console.error('Error in handleSave:', error);
      alert(`Error: ${errorMsg}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !course) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{title} - Settings</h1>
        </div>

        {/* Settings Form */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Course Settings</h2>
          
          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Course Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                value={title || ''}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                value={description || ''}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course Thumbnail
              </label>
              
              <div className="space-y-3">
                <div className="w-full">
                  {thumbnailPreview ? (
                    <div className="border-2 border-gray-300 rounded-lg p-4 bg-white">
                      <img
                        src={thumbnailPreview}
                        alt="Preview"
                        className="w-full max-h-64 object-contain rounded-lg mx-auto block"
                        onLoad={() => console.log('Preview image loaded successfully')}
                        onError={(e) => {
                          console.error('Error loading preview image:', thumbnailPreview);
                          alert('Failed to load preview image');
                        }}
                      />
                      <label className="block mt-2 text-center text-sm text-gray-600 cursor-pointer">
                        Click to change image
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setThumbnailFile(file);
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setThumbnailPreview(reader.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>
                  ) : course?.thumbnail ? (
                    <div className="border-2 border-gray-300 rounded-lg p-4 bg-white">
                      <img
                        src={getFileUrl(course.thumbnail)}
                        alt="Current thumbnail"
                        className="w-full max-h-64 object-contain rounded-lg mx-auto block"
                        onLoad={() => console.log('Course thumbnail loaded:', getFileUrl(course.thumbnail))}
                        onError={(e) => {
                          console.error('Error loading course thumbnail:', getFileUrl(course.thumbnail));
                          alert('Failed to load course thumbnail. URL: ' + getFileUrl(course.thumbnail));
                        }}
                      />
                      <label className="block mt-2 text-center text-sm text-gray-600 cursor-pointer">
                        Click to change image
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setThumbnailFile(file);
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setThumbnailPreview(reader.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full min-h-48 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-white hover:bg-gray-50 transition-colors py-12">
                      <svg className="w-10 h-10 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setThumbnailFile(file);
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setThumbnailPreview(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  )}
                </div>
                {thumbnailFile && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 p-2 rounded-lg">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{thumbnailFile.name}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setThumbnailFile(null);
                        setThumbnailPreview('');
                      }}
                      className="ml-auto text-red-600 hover:text-red-800"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                  Price ($)
                </label>
                <input
                  type="number"
                  id="price"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={saving || uploadingThumbnail}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Saving...' : uploadingThumbnail ? 'Uploading...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
  );
}
