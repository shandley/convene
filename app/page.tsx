import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to Convene</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Workshop Administration Platform
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/programs/create">
            <Button variant="default">Create Program</Button>
          </Link>
          <Button variant="outline">Learn More</Button>
        </div>
      </div>
    </main>
  );
}