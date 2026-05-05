"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setSessionCookie } from "@/lib/actions/auth.action";
import { toast } from "sonner";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    const handleAuth = async () => {
      if (token) {
        try {
          await setSessionCookie(token);
          toast.success("Signed in successfully!");
          // Use window.location.href for a full refresh to ensure all layouts re-render with the new session
          window.location.href = "/";
        } catch (error) {
          console.error("Auth callback error:", error);
          toast.error("Authentication failed. Please try again.");
          router.push("/sign-in");
        }
      } else {
        router.push("/sign-in");
      }
    };

    handleAuth();
  }, [token, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-muted-foreground animate-pulse">Completing authentication...</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground animate-pulse">Loading...</p>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
