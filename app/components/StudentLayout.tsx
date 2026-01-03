'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getFileUrl } from '@/lib/api-client';

interface StudentLayoutProps {
  children: ReactNode;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
    role?: string;
    profileImage?: string;
  };
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  showProfileDropdown: boolean;
  setShowProfileDropdown: (show: boolean) => void;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  onProfileClick: () => void;
  onSettingsClick: () => void;
  onLogout: () => void;
  pageTitle: string;
  pageSubtitle?: string;
  hideSidebar?: boolean;
  simpleHeader?: boolean; // For course pages - simple header with just title, subtitle, back button, notification, and avatar
}

export default function StudentLayout({
  children,
  user,
  sidebarOpen,
  setSidebarOpen,
  hideSidebar = false,
  showProfileDropdown,
  setShowProfileDropdown,
  dropdownRef,
  onProfileClick,
  onSettingsClick,
  onLogout,
  pageTitle,
  pageSubtitle,
  simpleHeader = false,
}: StudentLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="h-screen bg-gray-50 overflow-hidden flex flex-col">
      {/* No overlay on desktop - sidebar slides over content */}

      {/* Sidebar - Hidden on mobile, visible on desktop (always expanded) - Hidden in review mode */}
      {!hideSidebar && (
        <aside className={`hidden lg:block fixed bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 border-r border-gray-700 h-screen overflow-y-auto z-40 w-64`} style={{
          boxShadow: '4px 0 20px rgba(0, 0, 0, 0.3), 2px 0 10px rgba(0, 0, 0, 0.2)'
        }}>
        <div className="p-5">
          {/* Logo Section */}
          <div className="flex items-center justify-start mb-8 pb-6 border-b border-gray-700">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg group-hover:scale-110 transition-transform">
                <img src="/logo.svg" alt="Dar Al-Ilm Logo" className="w-6 h-6" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Dar Al-Ilm
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            <Link
              href="/student/dashboard"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 group relative ${
                pathname === '/student/dashboard'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/50'
                  : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
              }`}
            >
              <svg className={`w-5 h-5 ${pathname === '/student/dashboard' ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span>Dashboard</span>
            </Link>
            <Link
              href="/student/courses"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 group ${
                pathname === '/student/courses' || pathname.startsWith('/student/courses/')
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/50'
                  : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
              }`}
            >
              <svg className={`w-5 h-5 ${pathname === '/student/courses' || pathname.startsWith('/student/courses/') ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span>My Courses</span>
            </Link>
            <Link
              href="/student/progress"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 group ${
                pathname === '/student/progress' || pathname.startsWith('/student/progress/')
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/50'
                  : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
              }`}
            >
              <svg className={`w-5 h-5 ${pathname === '/student/progress' || pathname.startsWith('/student/progress/') ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>Progress</span>
            </Link>
            <Link
              href="/student/certificates"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 group ${
                pathname === '/student/certificates' || pathname.startsWith('/student/certificates/')
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/50'
                  : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
              }`}
            >
              <svg className={`w-5 h-5 ${pathname === '/student/certificates' || pathname.startsWith('/student/certificates/') ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              <span>Certificates</span>
            </Link>
            <Link
              href="/student/forum"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 group ${
                pathname === '/student/forum' || pathname.startsWith('/student/forum/')
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/50'
                  : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
              }`}
            >
              <svg className={`w-5 h-5 ${pathname === '/student/forum' || pathname.startsWith('/student/forum/') ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
              </svg>
              <span>Forum</span>
            </Link>
            <Link
              href="/student/settings"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 group ${
                pathname === '/student/settings' || pathname.startsWith('/student/settings/')
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/50'
                  : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
              }`}
            >
              <svg className={`w-5 h-5 ${pathname === '/student/settings' || pathname.startsWith('/student/settings/') ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Settings</span>
            </Link>
          </nav>
        </div>
        </aside>
      )}

      {/* Main Content */}
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${hideSidebar ? '' : 'lg:ml-64'}`}>
        {/* Top Header */}
        <header className={`flex-shrink-0 bg-white/95 backdrop-blur-md border-b border-gray-200 z-30 transition-all duration-300`} style={{
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08), 0 2px 10px rgba(0, 0, 0, 0.04)'
        }}>
          <div className="px-4 sm:px-6 py-3">
            <div className="flex items-center justify-between">
              {/* Simple Header for Course Pages (Student only) */}
              {simpleHeader && user?.role === 'student' ? (
                <>
                  <div className="flex items-center gap-4">
                    <div>
                      <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{pageTitle}</h1>
                      {pageSubtitle && <p className="text-sm text-gray-500 mt-0.5">{pageSubtitle}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link 
                      href="/student/courses"
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                      <span className="hidden sm:inline">Back to My Courses</span>
                      <span className="sm:hidden">Courses</span>
                    </Link>
                    
                    <button className="p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all relative group">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                      <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white"></span>
                    </button>
                    
                    <div className="relative" ref={dropdownRef}>
                      <button
                        onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                        className="flex items-center gap-2 p-1 rounded-xl hover:bg-gray-100 transition-all cursor-pointer group"
                      >
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-lg ring-2 ring-white group-hover:ring-blue-200 transition-all group-hover:scale-105 overflow-hidden">
                          {user?.profileImage ? (
                            <img 
                              src={getFileUrl(user.profileImage)} 
                              alt={`${user.firstName} ${user.lastName}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>{user?.firstName?.charAt(0) || 'U'}{user?.lastName?.charAt(0) || 'U'}</span>
                          )}
                        </div>
                        <svg className="w-4 h-4 text-gray-600 group-hover:text-gray-900 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {showProfileDropdown && (
                        <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-20 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                          <div className="px-5 py-4 bg-gradient-to-r from-blue-500 via-purple-500 to-purple-600">
                            <p className="text-sm font-bold text-white">{user?.firstName || 'User'} {user?.lastName || ''}</p>
                            <p className="text-xs text-blue-100 truncate mt-1">{user?.email || 'No email'}</p>
                          </div>
                          <div className="py-2">
                            <button
                              onClick={() => { setShowProfileDropdown(false); onProfileClick(); }}
                              className="w-full flex items-center gap-3 px-5 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-blue-700 transition-all cursor-pointer group"
                            >
                              <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              <span className="font-medium">Profile</span>
                            </button>
                            <button
                              onClick={() => { setShowProfileDropdown(false); onSettingsClick(); }}
                              className="w-full flex items-center gap-3 px-5 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 hover:text-purple-700 transition-all cursor-pointer group"
                            >
                              <svg className="w-4 h-4 text-gray-400 group-hover:text-purple-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span className="font-medium">Settings</span>
                            </button>
                          </div>
                          <div className="border-t border-gray-100 py-2">
                            <button
                              onClick={() => { setShowProfileDropdown(false); onLogout(); }}
                              className="w-full flex items-center gap-3 px-5 py-3 text-sm text-red-600 hover:bg-red-50 transition-all cursor-pointer group"
                            >
                              <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                              </svg>
                              <span className="font-medium">Logout</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                /* Regular Header */
                <>
                  <div className="flex items-center gap-4">
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">{pageTitle}</h1>
                      {pageSubtitle && <p className="text-sm text-gray-500 mt-0.5">{pageSubtitle}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Back to My Courses button - Only visible when sidebar is hidden */}
                    {hideSidebar && (
                      <Link 
                        href="/dashboard/courses"
                        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        <span className="hidden sm:inline">Back to My Courses</span>
                        <span className="sm:hidden">Courses</span>
                      </Link>
                    )}
                    
                    {/* Forum Link - Only visible when sidebar is not hidden */}
                    {!hideSidebar && (
                      <>
                        {/* Desktop version with text */}
                        <Link
                          href="/student/forum"
                          className={`hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all ${
                            pathname === '/student/forum' || pathname.startsWith('/student/forum/')
                              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                          }`}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                          </svg>
                          <span>Forum</span>
                        </Link>
                        {/* Mobile version - icon only */}
                        <Link
                          href="/student/forum"
                          className={`sm:hidden p-2.5 rounded-xl transition-all ${
                            pathname === '/student/forum' || pathname.startsWith('/student/forum/')
                              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                          }`}
                          title="Forum"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                          </svg>
                        </Link>
                      </>
                    )}
                    
                    <button className="p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all relative group">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                      <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white"></span>
                    </button>
                    
                    {/* Profile Dropdown */}
                    <div className="relative" ref={dropdownRef}>
                      <button
                        onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                        className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-gray-100 transition-all cursor-pointer group"
                      >
                        <div className="w-11 h-11 bg-gradient-to-br from-blue-500 via-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-lg ring-2 ring-white group-hover:ring-blue-200 transition-all group-hover:scale-105 overflow-hidden">
                          {user?.profileImage ? (
                            <img 
                              src={getFileUrl(user.profileImage)} 
                              alt={`${user.firstName} ${user.lastName}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>{user?.firstName?.charAt(0) || 'U'}{user?.lastName?.charAt(0) || 'U'}</span>
                          )}
                        </div>
                        <svg className="w-4 h-4 text-gray-600 group-hover:text-gray-900 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {/* Dropdown Menu */}
                      {showProfileDropdown && (
                        <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-20 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                            <div className="px-5 py-4 bg-gradient-to-r from-blue-500 via-purple-500 to-purple-600">
                              <p className="text-sm font-bold text-white">{user?.firstName || 'User'} {user?.lastName || ''}</p>
                              <p className="text-xs text-blue-100 truncate mt-1">{user?.email || 'No email'}</p>
                            </div>
                            <div className="py-2">
                              <button
                                onClick={() => { setShowProfileDropdown(false); onProfileClick(); }}
                                className="w-full flex items-center gap-3 px-5 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-blue-700 transition-all cursor-pointer group"
                              >
                                <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <span className="font-medium">Profile</span>
                              </button>
                              <button
                                onClick={() => { setShowProfileDropdown(false); onSettingsClick(); }}
                                className="w-full flex items-center gap-3 px-5 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 hover:text-purple-700 transition-all cursor-pointer group"
                              >
                                <svg className="w-4 h-4 text-gray-400 group-hover:text-purple-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span className="font-medium">Settings</span>
                              </button>
                            </div>
                            <div className="border-t border-gray-100 py-2">
                              <button
                                onClick={() => { setShowProfileDropdown(false); onLogout(); }}
                                className="w-full flex items-center gap-3 px-5 py-3 text-sm text-red-600 hover:bg-red-50 transition-all cursor-pointer group"
                              >
                                <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                <span className="font-medium">Logout</span>
                              </button>
                            </div>
                          </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main 
          className="flex-1 overflow-y-auto"
          onClick={() => setShowProfileDropdown(false)}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

