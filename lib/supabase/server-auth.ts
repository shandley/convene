import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'
import type { Database } from '@/types/database.types'

export function createClientForRequest(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  // Create a basic client
  const client = createClient<Database>(supabaseUrl, supabaseKey)
  
  // Check for Authorization header
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    
    // Set the auth header for requests
    client.rest.headers.authorization = `Bearer ${token}`
    client.auth.headers.authorization = `Bearer ${token}`
  }
  
  return client
}

// Create a service role client for bypassing RLS when needed
export function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  return createClient<Database>(supabaseUrl, serviceKey)
}

export async function getUserFromRequest(request: NextRequest) {
  // Try to get user from Authorization header first
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    
    const client = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    const { data: { user }, error } = await client.auth.getUser(token)
    
    if (error || !user) {
      return { user: null, error }
    }
    
    return { user, error: null }
  }
  
  // Fallback to cookie-based auth (for browser requests)
  const { createClient: createServerClient } = await import('./server')
  const serverClient = await createServerClient()
  
  const { data: { user }, error } = await serverClient.auth.getUser()
  
  return { user, error }
}