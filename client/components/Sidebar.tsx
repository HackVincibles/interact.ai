"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  Mic, 
  Code, 
  Users, 
  GraduationCap, 
  Target, 
  Trophy, 
  User as UserIcon,
  ChevronRight,
  PlaySquare,
  MessageSquare
} from "lucide-react";
import { cn } from "@/lib/utils";


const sidebarLinks = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "AI Interview", href: "/interview", icon: Mic },
  { label: "Try Code", href: "/code-editor", icon: Code },
  { label: "Group Discussion", href: "/gd", icon: Users, modal: false },
  { label: "Playlist Tube", href: "/playlist-tube", icon: PlaySquare, modal: false },
  { label: "AI Chatbot", href: "/ai-chat", icon: MessageSquare, modal: false },

  { label: "Prep Resources", href: "https://aveshpathaklms.vercel.app/dashboard", icon: GraduationCap, external: true },
  { label: "Job Matches", href: "/matches", icon: Target },
  { label: "Leaderboard", href: "/leaderboard", icon: Trophy },
  { label: "Profile", href: "/profile", icon: UserIcon },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showGDModal, setShowGDModal] = useState(false);

  useEffect(() => {
    if (pathname === "/ai-chat") {
      setIsCollapsed(true);
    }
  }, [pathname]);

  return (
    <>
      <aside 
        className={cn(
          "sticky top-0 h-screen bg-dark-200 border-r border-border transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] z-50 flex flex-col group/sidebar",
          isCollapsed ? "w-20" : "w-72"
        )}
      >
        {/* Toggle Button */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            "absolute -right-3 top-10 w-6 h-6 rounded-full bg-primary border border-border flex items-center justify-center text-black shadow-lg cursor-pointer z-50 transition-transform hover:scale-110",
            isCollapsed ? "rotate-0" : "rotate-180"
          )}
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Logo Section */}
        <div className="p-6 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0 border border-primary/20">
              <Image src="/logo.svg" alt="Logo" width={28} height={24} />
            </div>
            {!isCollapsed && (
              <span className="text-xl font-black tracking-tighter text-foreground italic">
                INTERACT<span className="text-primary">AI</span>
              </span>
            )}
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto custom-scrollbar">
          {sidebarLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            const hasStatus = link.label === "AI Interview" || link.label === "Group Discussion";

            const handleClick = (e: React.MouseEvent) => {
              if (link.modal && link.label === "Group Discussion") {
                // Modal removed in Master Rebuild
              }

            };

            const content = (
              <div
                className={cn(
                  "flex items-center gap-4 px-4 py-3 rounded-xl transition-all group relative overflow-hidden",
                  isActive 
                    ? "bg-primary text-black font-extrabold shadow-[0_0_20px_rgba(var(--primary),0.3)]" 
                    : "text-muted-foreground hover:bg-primary/5 hover:text-foreground"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive ? "text-black" : "group-hover:text-primary transition-colors")} />
                {!isCollapsed && (
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs uppercase font-bold tracking-widest">{link.label}</span>
                    {hasStatus && (
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                      </span>
                    )}
                  </div>
                )}
                
                {isCollapsed && hasStatus && (
                  <div className="absolute top-2 right-2 flex h-2 w-2">
                     <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                     <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </div>
                )}
              </div>
            );

            if (link.external) {
              return (
                <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer" className="block">
                  {content}
                </a>
              );
            }

            return (
              <Link key={link.label} href={link.href} onClick={handleClick} className="block">
                {content}
              </Link>
            );
          })}
        </nav>

        {/* Footer Branding */}
        {!isCollapsed && (
          <div className="p-6 mt-auto">
            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
              <p className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 mb-1">Status</p>
              <p className="text-[10px] font-bold text-foreground">All Engines Operational</p>
            </div>
          </div>
        )}
      </aside>

      {/* Global Modals */}
      {/* GD Modal removed in Master Rebuild */}

    </>
  );
}
