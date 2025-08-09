import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/programs'
  const origin = requestUrl.origin

  console.log('Callback route accessed:', {
    code: code ? 'present' : 'missing',
    next,
    origin,
    url: request.url,
    env: {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'present' : 'missing',
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'present' : 'missing',
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'not set'
    }
  })

  if (code) {
    try {
      const supabase = await createClient()
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      console.log('Auth exchange result:', {
        success: !error,
        error: error?.message,
        user: data?.user?.email
      })
      
      if (!error && data?.user) {
        // Successful authentication - redirect to the intended destination
        const redirectUrl = `${origin}${next}`
        console.log('Redirecting to:', redirectUrl)
        return NextResponse.redirect(redirectUrl)
      }

      // Auth exchange failed
      console.error('Auth exchange error:', error)
      return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(error?.message || 'Unable to verify email')}`)
    } catch (err) {
      console.error('Exception in auth callback:', err)
      return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent('Authentication failed')}`)
    }
  }

  // No code provided
  console.log('No code provided to callback route')
  return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent('No verification code provided')}`)
}