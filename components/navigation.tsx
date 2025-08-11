'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth/context'
import { LogOut, User, Settings, Search, Calendar } from 'lucide-react'
import { useState } from 'react'

export function Navigation() {
  const { user, loading, signOut } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleSignOut = async () => {
    try {
      await signOut()
      // Force a full page refresh to clear any remaining state
      window.location.href = '/'
    } catch (error) {
      console.error('Error during sign out:', error)
      // Even if sign out fails, redirect to home
      window.location.href = '/'
    }
  }

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(path)
  }

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold text-gray-900">Convene</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {/* Public Links */}
            <Link
              href="/apply"
              className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-blue-600 ${
                isActive('/apply') ? 'text-blue-600' : 'text-gray-700'
              }`}
            >
              <Search className="h-4 w-4" />
              Browse Programs
            </Link>

            {/* Authenticated User Links */}
            {user && (
              <>
                <Link
                  href="/programs"
                  className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-blue-600 ${
                    isActive('/programs') ? 'text-blue-600' : 'text-gray-700'
                  }`}
                >
                  <Calendar className="h-4 w-4" />
                  My Programs
                </Link>
                
                <Link
                  href="/applications"
                  className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-blue-600 ${
                    isActive('/applications') ? 'text-blue-600' : 'text-gray-700'
                  }`}
                >
                  Applications
                </Link>
              </>
            )}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {loading ? (
              <div className="animate-pulse">
                <div className="h-8 w-20 bg-gray-200 rounded"></div>
              </div>
            ) : user ? (
              <div className="flex items-center space-x-2 relative">
                <span className="text-sm text-gray-700 hidden sm:inline">
                  {user.email}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                  <User className="h-4 w-4" />
                  <span className="sr-only">User menu</span>
                </Button>
                
                {/* Dropdown menu */}
                {isMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-md shadow-lg border z-50">
                    <div className="py-1">
                      <div className="px-4 py-2 text-sm text-gray-700 border-b">
                        {user.email}
                      </div>
                      <Link
                        href="/profile"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Settings className="h-4 w-4" />
                        Profile Settings
                      </Link>
                      <button
                        onClick={() => {
                          setIsMenuOpen(false)
                          handleSignOut()
                        }}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button size="sm">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <div className="w-6 h-6 flex flex-col justify-around">
                <span className="block h-0.5 w-6 bg-gray-600"></span>
                <span className="block h-0.5 w-6 bg-gray-600"></span>
                <span className="block h-0.5 w-6 bg-gray-600"></span>
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t">
            <div className="py-4 space-y-2">
              <Link
                href="/apply"
                className={`block px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive('/apply') 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Browse Programs
              </Link>
              
              {user && (
                <>
                  <Link
                    href="/programs"
                    className={`block px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive('/programs') 
                        ? 'bg-blue-100 text-blue-600' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    My Programs
                  </Link>
                  
                  <Link
                    href="/applications"
                    className={`block px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive('/applications') 
                        ? 'bg-blue-100 text-blue-600' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Applications
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Backdrop for dropdown menus */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </nav>
  )
}