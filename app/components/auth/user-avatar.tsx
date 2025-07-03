'use client'

import { signOut } from 'next-auth/react'
import Image from 'next/image'
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/app/hooks/use-auth'
import { AuthLoading } from './auth-loading'

export function UserAvatar() {
  const { isLoading, isAuthenticated, user, getUserDisplayName, getUserInitials, getUserAvatar } = useAuth()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (isLoading) {
    return <AuthLoading variant="avatar" />
  }

  if (!isAuthenticated || !user) {
    return null
  }

  const handleSignOut = () => {
    setIsDropdownOpen(false)
    signOut({ callbackUrl: '/' })
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="auth-avatar-button flex items-center space-x-3 p-1.5 rounded-lg 
          focus:outline-none focus:ring-2 transition-all duration-200 ease-in-out"
        aria-expanded={isDropdownOpen}
        aria-haspopup="true"
      >
        <div className="relative h-8 w-8 rounded-full overflow-hidden bg-gray-900">
          {getUserAvatar() ? (
            <Image
              src={getUserAvatar()!}
              alt={`${getUserDisplayName()} avatar`}
              width={32}
              height={32}
              className="rounded-full"
            />
          ) : (
            <div className="flex items-center justify-center h-full w-full text-white text-sm font-medium">
              {getUserInitials()}
            </div>
          )}
        </div>
        <div className="hidden sm:block text-left min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-900 truncate">
            {getUserDisplayName()}
          </p>
          {user.email && (
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          )}
        </div>
        <svg
          className={`h-4 w-4 text-gray-500 transition-transform ${
            isDropdownOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="auth-dropdown absolute right-0 mt-2 w-48 sm:w-56 rounded-lg py-1 z-50 border
          animate-in fade-in-0 zoom-in-95 duration-200">
          <div className="px-4 py-2 border-b border-gray-200">
            <p className="text-sm font-medium text-gray-900 truncate">
              {getUserDisplayName()}
            </p>
            {user.email && (
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            )}
          </div>
          
          <a
            href="/dashboard"
            className="auth-dropdown-item block px-4 py-2 text-sm 
              focus:outline-none transition-colors duration-150"
            onClick={() => setIsDropdownOpen(false)}
          >
            Dashboard
          </a>
          
          <a
            href="/profile"
            className="auth-dropdown-item block px-4 py-2 text-sm 
              focus:outline-none transition-colors duration-150"
            onClick={() => setIsDropdownOpen(false)}
          >
            Profile Settings
          </a>
          
          <hr className="my-1 border-gray-200" />
          
          <button
            onClick={handleSignOut}
            className="auth-dropdown-item block w-full text-left px-4 py-2 text-sm 
              focus:outline-none transition-colors duration-150"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}