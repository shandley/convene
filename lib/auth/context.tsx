'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getAuthCallbackURL } from '@/lib/utils/url'
import type { User } from '@supabase/supabase-js'
import type { Tables } from '@/types/database.types'

interface AuthContextType {
  user: User | null
  profile: Tables<'profiles'> | null
  loading: boolean
  initialized: boolean
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
  const [initialized, setInitialized] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    let isMounted = true;
    
    // Failsafe: ensure loading is set to false after a maximum timeout
    const failsafeTimeout = setTimeout(() => {
      if (isMounted) {
        console.log('Failsafe: Setting loading to false after timeout');
        setLoading(false);
        setInitialized(true);
      }
    }, 5000); // 5 second maximum loading time

    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('Getting initial session...');
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (!isMounted) return;
        
        if (error) {
          console.error('Error getting session:', error)
          setLoading(false)
          setInitialized(true)
          clearTimeout(failsafeTimeout);
          return
        }

        console.log('Initial session result:', session ? 'session found' : 'no session');
        setUser(session?.user ?? null)
        
        if (session?.user) {
          try {
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single()
            
            if (isMounted) {
              if (profileError) {
                console.error('Error fetching profile:', profileError)
              } else {
                setProfile(profileData)
              }
            }
          } catch (err) {
            console.error('Exception fetching profile:', err)
          }
        }
      } catch (err) {
        console.error('Exception getting initial session:', err)
      } finally {
        if (isMounted) {
          console.log('Setting loading to false from initial session');
          setLoading(false)
          setInitialized(true)
          clearTimeout(failsafeTimeout);
        }
      }
    }

    getInitialSession()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        console.log('Auth state change:', event, session?.user?.email)
        
        // Always set loading to false and mark as initialized to ensure UI updates
        setLoading(false)
        setInitialized(true)
        setUser(session?.user ?? null)
        
        if (session?.user && isMounted) {
          try {
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single()
            
            if (isMounted) {
              if (profileError) {
                console.error('Error fetching profile on auth change:', profileError)
              } else {
                setProfile(profileData)
              }
            }
          } catch (err) {
            console.error('Exception fetching profile on auth change:', err)
          }
        } else if (isMounted) {
          setProfile(null)
        }
        
        console.log('Auth state change processing complete')
      }
    )

    return () => {
      isMounted = false;
      subscription.unsubscribe()
      clearTimeout(failsafeTimeout);
    }
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
        emailRedirectTo: getAuthCallbackURL(),
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
      initialized,
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