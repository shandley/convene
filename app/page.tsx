'use client'

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/context";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";

function HomeContent() {
  const { user, loading, initialized } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [authError, setAuthError] = useState<string | null>(null);
  const [redirectAttempted, setRedirectAttempted] = useState(false);
  const [, forceUpdate] = useState({});

  useEffect(() => {
    // Handle any auth-related URL parameters (errors from auth callback)
    const error = searchParams.get('error');
    const error_description = searchParams.get('error_description');
    
    // Handle auth errors from URL
    if (error) {
      setAuthError(error_description || error);
      // Clean up URL
      router.replace('/');
      return;
    }
  }, [searchParams, router]);

  useEffect(() => {
    // If user is logged in and auth is initialized, redirect to programs
    if (initialized && !loading && user && !redirectAttempted) {
      console.log('Redirecting to /programs - user authenticated');
      setRedirectAttempted(true);
      // Use replace instead of push to avoid back button issues
      router.replace('/programs');
    }
  }, [user, loading, initialized, router, redirectAttempted]);

  // Add debug logging
  useEffect(() => {
    console.log('Home page state:', { user: !!user, loading, initialized, redirectAttempted });
  }, [user, loading, initialized, redirectAttempted]);

  // Fallback timeout to ensure redirect happens
  useEffect(() => {
    if (initialized && !loading && user && !redirectAttempted) {
      console.log('Fallback redirect timer starting...');
      const timer = setTimeout(() => {
        if (!redirectAttempted) {
          console.log('Fallback redirect executing...');
          setRedirectAttempted(true);
          router.replace('/programs');
        }
      }, 100); // Very short timeout as a fallback

      return () => clearTimeout(timer);
    }
  }, [user, loading, initialized, redirectAttempted, router]);

  // Emergency override: if user is present but loading is stuck, show manual option
  if (user && loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="text-center">
          <p className="text-lg text-green-600">✓ Authentication successful!</p>
          <div className="mt-4 text-sm text-gray-500">
            Debug: loading={loading.toString()}, initialized={initialized.toString()}, user={user.email}
          </div>
          <div className="mt-4">
            <Button 
              onClick={() => {
                console.log('Manual redirect to /programs');
                setRedirectAttempted(true);
                router.replace('/programs');
              }}
              size="lg"
            >
              Continue to Programs →
            </Button>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Loading state seems stuck. Click above to continue.
          </p>
        </div>
      </main>
    );
  }

  // Show loading state during normal loading (when no user or not initialized)
  if (loading || !initialized) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="text-center">
          <p className="text-lg">Loading...</p>
          <div className="mt-4 text-sm text-gray-500">
            Debug: loading={loading.toString()}, initialized={initialized.toString()}, user={user ? 'present' : 'null'}
          </div>
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