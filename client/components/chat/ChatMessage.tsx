"use client";

import React, { useState } from "react";
import { Bot, User, RotateCcw } from "lucide-react";
import MarkdownRenderer from "./MarkdownRenderer";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  timestamp?: Date;
  mode: "interview" | "tech-helper";
}

export default function ChatMessage({ role, content, isStreaming, timestamp, mode }: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div
      className={cn(
        "group flex gap-3 px-4 py-5 animate-fadeIn",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-md",
          isUser
            ? "bg-primary text-primary-foreground"
            : mode === "interview"
            ? "bg-gradient-to-br from-violet-600 to-purple-700 text-white"
            : "bg-gradient-to-br from-sky-500 to-blue-600 text-white"
        )}
      >
        {isUser ? <User size={14} /> : <Bot size={14} />}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          "relative max-w-[80%] rounded-2xl px-4 py-3 shadow-sm",
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-sm"
            : "bg-card border border-border/50 rounded-tl-sm text-foreground"
        )}
      >
        {isUser ? (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
        ) : (
          <div className="text-sm prose-sm max-w-none">
            {isStreaming ? (
              <>
                <MarkdownRenderer content={content} />
                <span className="inline-flex gap-1 ml-1 align-middle">
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: "300ms" }} />
                </span>
              </>
            ) : (
              <MarkdownRenderer content={content} />
            )}
          </div>
        )}

        {/* Timestamp */}
        {timestamp && (
          <p className={cn(
            "text-[10px] mt-1.5 select-none",
            isUser ? "text-primary-foreground/60 text-right" : "text-muted-foreground"
          )}>
            {new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        )}
      </div>
    </div>
  );
}

// Typing indicator (shown when AI is thinking before first token arrives)
export function TypingIndicator({ mode }: { mode: "interview" | "tech-helper" }) {
  return (
    <div className="flex gap-3 px-4 py-4 animate-fadeIn">
      <div
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-md",
          mode === "interview"
            ? "bg-gradient-to-br from-violet-600 to-purple-700"
            : "bg-gradient-to-br from-sky-500 to-blue-600"
        )}
      >
        <Bot size={14} className="text-white" />
      </div>
      <div className="bg-card border border-border/50 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
        <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
        <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  );
}
