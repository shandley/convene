'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Tables } from '@/types/database.types'

interface AuthContextType {
  user: User | null
  profile: Tables<'profiles'> | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (email: string, password: string, metadata?: { full_name?: string }) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  hasRole: (role: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Tables<'profiles'> | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      
      if (session?.user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        setProfile(profileData)
      }
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        
        if (session?.user) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
          setProfile(profileData)
        } else {
          setProfile(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    // Provide better error messages for common issues
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        return { error: 'Invalid email or password. Please check your credentials and try again.' }
      }
      
      if (error.message.includes('Email not confirmed')) {
        return { error: 'Please check your email and click the verification link before signing in.' }
      }
      
      if (error.message.includes('Too many requests')) {
        return { error: 'Too many login attempts. Please wait a moment before trying again.' }
      }
      
      return { error: error.message }
    }
    
    return { error: undefined }
  }

  const signUp = async (email: string, password: string, metadata?: { full_name?: string }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/auth/callback`,
      },
    })

    // Handle specific error cases
    if (error) {
      // Check for existing user error
      if (error.message.includes('User already registered')) {
        return { error: 'This email is already registered. Please sign in instead.' }
      }
      
      // Check for email validation errors
      if (error.message.includes('invalid email')) {
        return { error: 'Please enter a valid email address.' }
      }
      
      // Check for password strength errors
      if (error.message.includes('Password')) {
        return { error: 'Password must be at least 6 characters long.' }
      }

      return { error: error.message }
    }

    // If no error but no user created, it means email already exists
    // Supabase sometimes doesn't send an error for existing users for security
    if (!data.user && !error) {
      return { error: 'This email is already registered. Please sign in instead.' }
    }

    return { error: undefined }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const hasRole = (role: string) => {
    return profile?.roles?.includes(role as any) ?? false
  }

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      signIn,
      signUp,
      signOut,
      hasRole,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}