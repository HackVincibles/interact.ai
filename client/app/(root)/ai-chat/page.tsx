"use client";

import React from "react";
import ChatPage from "@/components/chat/ChatPage";

export default function AIChatPage() {
  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/20 pb-2">
        <div className="space-y-0.5">
          <h1 className="text-lg font-black tracking-tight uppercase">AI Conversation Studio</h1>
          <p className="text-[10px] text-muted-foreground font-semibold">
            Conduct technical mock interviews with instant grading or converse with our AI technical coding assistant.
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 h-6 rounded-full bg-primary/10 border border-primary/20 text-[9px] font-black uppercase tracking-wider text-primary shrink-0 self-start sm:self-center">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
          </span>
          NextGen NLP Online
        </div>
      </div>

      <ChatPage />
    </div>
  );
}
