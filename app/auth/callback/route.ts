import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'

// This route handles auth callbacks from Supabase
// It supports both PKCE flow (with code) and OTP flow (with token_hash)
export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const token_hash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type') as EmailOtpType | null
  const next = requestUrl.searchParams.get('next') ?? '/programs'
  const origin = requestUrl.origin
  const error = requestUrl.searchParams.get('error')
  const error_description = requestUrl.searchParams.get('error_description')

  console.log('Auth callback accessed:', {
    code: code ? 'present' : 'missing',
    token_hash: token_hash ? 'present' : 'missing',
    type: type || 'none',
    next,
    origin,
    error,
    error_description,
    url: request.url
  })

  // Handle errors from Supabase
  if (error) {
    console.log('Supabase auth error:', { error, error_description })
    const errorMessage = error_description || error
    return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(errorMessage)}`)
  }

  const supabase = await createClient()

  // Handle PKCE flow (OAuth redirects with code)
  if (code) {
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      console.log('PKCE code exchange result:', {
        success: !error,
        error: error?.message,
        user: data?.user?.email
      })
      
      if (!error && data?.user) {
        // For email confirmation, redirect to login with success message
        if (type === 'signup' || type === 'email') {
          return NextResponse.redirect(`${origin}/auth/login?message=${encodeURIComponent('Email confirmed! Please sign in to continue.')}`)
        }
        // For other auth flows, redirect to intended destination
        const redirectUrl = `${origin}${next}`
        console.log('PKCE: Redirecting to:', redirectUrl)
        return NextResponse.redirect(redirectUrl)
      }

      console.error('PKCE exchange error:', error)
      return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(error?.message || 'Unable to verify authentication code')}`)
    } catch (err) {
      console.error('Exception in PKCE exchange:', err)
      return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent('Authentication failed')}`)
    }
  }

  // Handle OTP flow (Magic links with token_hash)
  if (token_hash && type) {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        type,
        token_hash,
      })

      console.log('OTP verification result:', {
        success: !error,
        error: error?.message,
        user: data?.user?.email
      })

      if (!error && data?.user) {
        const redirectUrl = `${origin}${next}`
        console.log('OTP: Redirecting to:', redirectUrl)
        return NextResponse.redirect(redirectUrl)
      }

      console.error('OTP verification error:', error)
      return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(error?.message || 'Unable to verify email')}`)
    } catch (err) {
      console.error('Exception in OTP verification:', err)
      return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent('Email verification failed')}`)
    }
  }

  // No valid auth parameters provided
  console.log('No valid auth parameters provided to callback route')
  return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent('Invalid authentication request')}`)
}