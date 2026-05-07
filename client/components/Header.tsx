"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";
import UserProfile from "./UserProfile";
import { getCurrentUser } from "@/lib/actions/auth.action";

export default async function Header() {
  const pathname = usePathname();
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-50 w-full bg-transparent">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <span className="text-sm font-bold">IA</span>
            </div>
            <span className="text-xl font-semibold text-foreground">InteractAI</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6">
            <Link 
              href="/" 
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname === "/" ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Home
            </Link>
            <Link 
              href="/interview" 
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname === "/interview" ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Interview
            </Link>
            <Link 
              href="/generate" 
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname === "/generate" ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Generate
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          {user ? (
            <UserProfile user={user} />
          ) : (
            <Link 
              href="/sign-in" 
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
