'use client'

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/programs');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="text-center">
          <p className="text-lg">Loading...</p>
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