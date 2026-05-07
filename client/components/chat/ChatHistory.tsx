"use client";

import React, { useState } from "react";
import { Trash2, MessageSquare, Mic, MoreHorizontal, Pencil, Check, X, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { deleteSession, renameSession } from "@/lib/actions/chat.action";

interface Session {
  _id: string;
  sessionId: string;
  mode: "interview" | "tech-helper";
  title: string;
  status: "active" | "completed" | "abandoned";
  messageCount: number;
  updatedAt: string;
  createdAt: string;
  "feedback.totalScore"?: number;
  "feedback.rating"?: number;
  feedback?: { totalScore: number; rating: number };
  interviewConfig?: { role: string; difficulty: string };
}

interface ChatHistoryProps {
  sessions: Session[];
  activeSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
  onDeleteSession: (sessionId: string) => void;
  onRenameSession: (sessionId: string, title: string) => void;
  currentMode: "interview" | "tech-helper";
  isLoading?: boolean;
}

function groupByDate(sessions: Session[]) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart.getTime() - 86400000);
  const sevenDaysAgo = new Date(todayStart.getTime() - 7 * 86400000);
  const thirtyDaysAgo = new Date(todayStart.getTime() - 30 * 86400000);

  const groups: Record<string, Session[]> = {
    Today: [],
    Yesterday: [],
    "Last 7 days": [],
    "Last 30 days": [],
    Older: [],
  };

  sessions.forEach((s) => {
    const d = new Date(s.updatedAt);
    if (d >= todayStart) groups["Today"].push(s);
    else if (d >= yesterdayStart) groups["Yesterday"].push(s);
    else if (d >= sevenDaysAgo) groups["Last 7 days"].push(s);
    else if (d >= thirtyDaysAgo) groups["Last 30 days"].push(s);
    else groups["Older"].push(s);
  });

  return groups;
}

function SessionItem({
  session,
  isActive,
  onSelect,
  onDelete,
  onRename,
}: {
  session: Session;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onRename: (title: string) => void;
}) {
  const [hovering, setHovering] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(session.title);
  const [showMenu, setShowMenu] = useState(false);

  const handleRename = () => {
    if (editTitle.trim() && editTitle !== session.title) {
      onRename(editTitle.trim());
    }
    setEditing(false);
    setShowMenu(false);
  };

  const rating = session.feedback?.rating;
  const score = session.feedback?.totalScore;

  return (
    <div
      className={cn(
        "group relative flex items-start gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150",
        isActive
          ? "bg-primary/10 border border-primary/20"
          : "hover:bg-muted/70 border border-transparent"
      )}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => { setHovering(false); setShowMenu(false); }}
      onClick={() => !editing && onSelect()}
    >
      {/* Mode icon */}
      <div className={cn(
        "flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center mt-0.5 text-xs",
        session.mode === "interview"
          ? "bg-violet-500/20 text-violet-400"
          : "bg-sky-500/20 text-sky-400"
      )}>
        {session.mode === "interview" ? <Mic size={12} /> : <MessageSquare size={12} />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {editing ? (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <input
              autoFocus
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleRename(); if (e.key === "Escape") setEditing(false); }}
              className="flex-1 text-xs bg-background border border-primary/50 rounded px-1.5 py-0.5 text-foreground focus:outline-none"
            />
            <button onClick={handleRename} className="text-green-400 hover:text-green-300"><Check size={12} /></button>
            <button onClick={() => setEditing(false)} className="text-muted-foreground hover:text-foreground"><X size={12} /></button>
          </div>
        ) : (
          <p className={cn(
            "text-xs font-medium truncate leading-tight",
            isActive ? "text-foreground" : "text-foreground/80"
          )}>
            {session.title}
          </p>
        )}

        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-muted-foreground/60">
            {session.messageCount} msg{session.messageCount !== 1 ? "s" : ""}
          </span>
          {session.status === "completed" && rating && (
            <span className="text-[10px] text-amber-400/80">
              {"★".repeat(Math.round(rating))} {score}%
            </span>
          )}
          {session.status === "completed" && (
            <span className="text-[10px] text-green-500/70 font-medium">Done</span>
          )}
        </div>
      </div>

      {/* Action buttons */}
      {hovering && !editing && (
        <div
          className="flex items-center gap-0.5 flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setEditing(true)}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-background/80 transition-colors"
            title="Rename"
          >
            <Pencil size={11} />
          </button>
          <button
            onClick={onDelete}
            className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            title="Delete"
          >
            <Trash2 size={11} />
          </button>
        </div>
      )}
    </div>
  );
}

export default function ChatHistory({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onRenameSession,
  currentMode,
  isLoading = false,
}: ChatHistoryProps) {
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState(false);

  const filtered = sessions.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = groupByDate(filtered);

  return (
    <div className={cn(
      "flex flex-col h-full bg-card border-r border-border/50 transition-all duration-300",
      collapsed ? "w-12" : "w-64 min-w-[16rem]"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 pt-4 pb-2 gap-2">
        {!collapsed && (
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">
            Chat History
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors ml-auto"
          title={collapsed ? "Expand" : "Collapse"}
        >
          <ChevronRight size={14} className={cn("transition-transform", collapsed ? "" : "rotate-180")} />
        </button>
      </div>

      {!collapsed && (
        <>
          {/* New Chat button */}
          <div className="px-3 pb-2">
            <button
              onClick={onNewChat}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm"
            >
              <span className="text-base leading-none">+</span> New Chat
            </button>
          </div>

          {/* Search */}
          <div className="px-3 pb-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search chats..."
              className="w-full px-3 py-2 text-xs rounded-lg bg-muted border border-border/50 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>

          {/* Session list */}
          <div className="flex-1 overflow-y-auto px-2 space-y-4 pb-4 custom-scrollbar">
            {isLoading ? (
              <div className="space-y-2 px-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="animate-pulse flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-border/10 bg-muted/20">
                    <div className="w-6 h-6 rounded-lg bg-muted-foreground/15 shrink-0" />
                    <div className="flex-1 space-y-1.5 min-w-0">
                      <div className="h-3 bg-muted-foreground/15 rounded-md w-3/4" />
                      <div className="h-2 bg-muted-foreground/15 rounded-md w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="px-3 py-8 text-center">
                <MessageSquare size={28} className="mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-xs text-muted-foreground/50">
                  {search ? "No chats found" : "No chats yet.\nStart a new conversation!"}
                </p>
              </div>
            ) : (
              Object.entries(grouped).map(([label, items]) =>
                items.length > 0 ? (
                  <div key={label}>
                    <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40">
                      {label}
                    </p>
                    <div className="space-y-0.5">
                      {items.map((session) => (
                        <SessionItem
                          key={session.sessionId}
                          session={session}
                          isActive={session.sessionId === activeSessionId}
                          onSelect={() => onSelectSession(session.sessionId)}
                          onDelete={() => onDeleteSession(session.sessionId)}
                          onRename={(title) => onRenameSession(session.sessionId, title)}
                        />
                      ))}
                    </div>
                  </div>
                ) : null
              )
            )}
          </div>
        </>
      )}
    </div>
  );
}
