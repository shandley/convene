/**
 * Get the current site URL for redirects and callbacks
 * Handles both production and development environments correctly
 */
export function getSiteURL() {
  // In production, use NEXT_PUBLIC_SITE_URL if set properly
  let url = process?.env?.NEXT_PUBLIC_SITE_URL
  
  // If not set or still pointing to localhost in production, use Vercel URL
  if (!url || url.includes('localhost')) {
    // Use Vercel's automatic URL if available
    url = process?.env?.NEXT_PUBLIC_VERCEL_URL
  }
  
  // Fallback to window.location in browser
  if (!url && typeof window !== 'undefined') {
    url = window.location.origin
  }
  
  // Fallback to localhost for development
  if (!url) {
    url = 'http://localhost:3000'
  }
  
  // Ensure URL has protocol
  if (!url.startsWith('http')) {
    url = `https://${url}`
  }
  
  // Ensure URL has trailing slash for consistency
  return url.endsWith('/') ? url : `${url}/`
}

/**
 * Get the auth callback URL for email confirmations
 */
export function getAuthCallbackURL() {
  return `${getSiteURL()}auth/callback`
}

/**
 * Get the auth confirm URL for token hash confirmations
 */
export function getAuthConfirmURL() {
  return `${getSiteURL()}auth/confirm`
}