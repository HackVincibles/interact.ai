"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, ReactNode } from "react";
import { Mic, Code, Users, Home } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import UserProfile from "./UserProfile";
import { User } from "@/types";

interface ClientHeaderProps {
  initialUser: User | null;
}

export default function ClientHeader({ initialUser }: ClientHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user] = useState(initialUser);
  const [loadingPath, setLoadingPath] = useState<string | null>(null);

  const isActive = (path: string) => pathname === path;

  const handleNavClick = (href: string) => {
    if (href !== pathname) {
      setLoadingPath(href);
      router.push(href);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-transparent">
      <div className="container mx-auto px-4">
        <div className="flex h-14 items-center justify-between">
          {/* Logo - Only InteractAI branding */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-transform hover:scale-105">
              <span className="text-sm font-bold">IA</span>
            </div>
            <span className="text-lg font-semibold text-foreground">InteractAI</span>
          </Link>

          {/* Right Side */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <ThemeToggle />
            {user ? (
              <UserProfile user={user} />
            ) : (
              <Link
                href="/sign-in"
                className="inline-flex items-center justify-center rounded-full text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

interface NavButtonProps {
  href: string;
  icon: ReactNode;
  label: string;
  isActive: boolean;
  isLoading?: boolean;
  onClick: () => void;
}

function NavButton({ href, icon, label, isActive, isLoading, onClick }: NavButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-1.5 px-2 sm:px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
        isActive
          ? "text-primary bg-primary/10"
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
      {/* Loading underline animation */}
      {isLoading && (
        <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary overflow-hidden rounded-full">
          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent animate-loading-underline" />
        </span>
      )}
    </button>
  );
}
