'use client'

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/context";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";

function HomeContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [authProcessing, setAuthProcessing] = useState(false);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      // Check if this is an auth callback from Supabase email verification
      const token = searchParams.get('token');
      const type = searchParams.get('type');
      const error = searchParams.get('error');
      const error_description = searchParams.get('error_description');
      
      // Handle auth errors from URL
      if (error) {
        setAuthError(error_description || error);
        // Clean up URL
        router.replace('/');
        return;
      }
      
      // Handle email verification callback
      if (token && type === 'signup') {
        setAuthProcessing(true);
        try {
          const supabase = createClient();
          
          // Try to verify the email token
          const { data, error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'signup',
          });
          
          if (verifyError) {
            console.error('Email verification error:', verifyError);
            setAuthError('Failed to verify email. Please try signing up again.');
          } else if (data?.user) {
            setAuthMessage('Email verified successfully! You can now sign in.');
            // Clean up URL and redirect to login after a moment
            setTimeout(() => {
              router.replace('/auth/login?message=' + encodeURIComponent('Email verified! Please sign in to continue.'));
            }, 2000);
          } else {
            setAuthError('Email verification completed, but no user session created. Please try signing in.');
          }
        } catch (err) {
          console.error('Exception during email verification:', err);
          setAuthError('An error occurred during email verification.');
        } finally {
          setAuthProcessing(false);
        }
        return;
      }
    };

    handleAuthCallback();
  }, [searchParams, router]);

  useEffect(() => {
    // If user is logged in, redirect to programs
    if (!loading && user && !authProcessing) {
      router.push('/programs');
    }
  }, [user, loading, router, authProcessing]);

  // Show loading state during auth processing or normal loading
  if (loading || authProcessing) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="text-center">
          <p className="text-lg">
            {authProcessing ? 'Verifying your email...' : 'Loading...'}
          </p>
        </div>
      </main>
    );
  }

  // Show success message
  if (authMessage) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="text-center">
          <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
            <p className="text-green-800">{authMessage}</p>
          </div>
          <p className="text-muted-foreground">Redirecting you to sign in...</p>
        </div>
      </main>
    );
  }

  // Show error message
  if (authError) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <p className="text-red-800">{authError}</p>
          </div>
          <div className="flex gap-4 justify-center">
            <Link href="/auth/login">
              <Button variant="default">Sign In</Button>
            </Link>
            <Link href="/auth/signup">
              <Button variant="outline">Sign Up</Button>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to Convene</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Workshop Administration Platform
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/auth/login">
            <Button variant="default">Sign In</Button>
          </Link>
          <Link href="/auth/signup">
            <Button variant="outline">Sign Up</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="text-center">
          <p className="text-lg">Loading...</p>
        </div>
      </main>
    }>
      <HomeContent />
    </Suspense>
  );
}