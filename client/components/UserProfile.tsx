"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { User } from "@/types";
import { LogOut, Loader2 } from "lucide-react";
import { signOut as signOutAction } from "@/lib/actions/auth.action";

interface UserProfileProps {
  user: User | null;
}

const UserProfile = ({ user }: UserProfileProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      const res = await signOutAction();
      if (res.success) {
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="flex items-center gap-4">
      {/* User Info Trigger - Links to Profile */}
      <Link 
        href="/profile" 
        className="flex items-center gap-3 p-1.5 pr-4 rounded-full hover:bg-dark-200 transition-all duration-200 group border border-transparent hover:border-dark-200"
      >
        <div className="relative w-9 h-9 rounded-full overflow-hidden border-2 border-purple-600/30 group-hover:border-purple-600 transition-all shadow-md">
          <Image
            src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
            alt={user.name || "User"}
            fill
            sizes="(max-width: 768px) 100vw, 36px"
            className="object-cover"
          />
        </div>
        <div className="hidden sm:flex flex-col items-start leading-tight">
          <span className="text-light-100 font-bold text-sm group-hover:text-purple-600 transition-colors">
            {user.name}
          </span>
          <span className="text-light-400 text-[10px] font-medium">
            {user.email}
          </span>
        </div>
      </Link>

      <div className="h-6 w-[1px] bg-dark-200 mx-1 hidden sm:block" />

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        disabled={isLoading}
        className="flex items-center justify-center p-2.5 bg-destructive-100/10 hover:bg-destructive-100 text-destructive-100 hover:text-white rounded-full transition-all duration-200 disabled:opacity-50 group"
        title="Logout"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <LogOut className="w-4 h-4" />
        )}
      </button>
    </div>
  );
};

export default UserProfile;
