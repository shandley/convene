// Debug utilities for authentication issues
export const debugAuthState = () => {
  if (typeof window === 'undefined') return

  console.log('=== Auth Debug Info ===')
  
  // Check localStorage for auth tokens
  const authKeys = Object.keys(localStorage).filter(key => 
    key.includes('supabase') || key.includes('auth')
  )
  
  console.log('Auth-related localStorage keys:', authKeys)
  
  authKeys.forEach(key => {
    try {
      const value = localStorage.getItem(key)
      if (value) {
        // Don't log the actual token values for security
        console.log(`${key}: ${value.length} characters`)
      }
    } catch (err) {
      console.log(`${key}: Error reading value`)
    }
  })
  
  console.log('=== End Auth Debug ===')
}

export const clearAllAuthStorage = () => {
  if (typeof window === 'undefined') return
  
  console.log('Clearing all authentication storage...')
  
  // Clear all Supabase auth keys
  Object.keys(localStorage).forEach(key => {
    if (key.includes('supabase') || key.includes('auth')) {
      localStorage.removeItem(key)
      console.log(`Removed: ${key}`)
    }
  })
  
  // Also clear sessionStorage
  Object.keys(sessionStorage).forEach(key => {
    if (key.includes('supabase') || key.includes('auth')) {
      sessionStorage.removeItem(key)
      console.log(`Removed from session: ${key}`)
    }
  })
  
  console.log('Auth storage cleared')
}

// Add this to window for manual debugging in the browser console
if (typeof window !== 'undefined') {
  (window as any).debugAuth = {
    debugAuthState,
    clearAllAuthStorage
  }
}