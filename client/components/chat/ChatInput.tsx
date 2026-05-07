"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Square, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  onStop?: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function ChatInput({ onSend, isLoading, onStop, disabled, placeholder }: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 180) + "px";
  }, [value]);

  const handleSend = () => {
    const msg = value.trim();
    if (!msg || isLoading || disabled) return;
    onSend(msg);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="px-4 pb-4 pt-2">
      <div
        className={cn(
          "relative flex items-end gap-2 rounded-2xl border bg-card shadow-lg transition-all duration-200",
          disabled
            ? "border-border/30 opacity-50 cursor-not-allowed"
            : "border-border/60 hover:border-primary/40 focus-within:border-primary/60 focus-within:shadow-[0_0_0_3px_hsl(var(--primary)/0.1)]"
        )}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || isLoading}
          placeholder={placeholder || "Message..."}
          rows={1}
          className={cn(
            "flex-1 resize-none bg-transparent px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none min-h-[52px] max-h-[180px] leading-relaxed",
            (disabled || isLoading) && "cursor-not-allowed"
          )}
        />

        {/* Send / Stop button */}
        {isLoading ? (
          <button
            onClick={onStop}
            className="m-2 flex-shrink-0 w-9 h-9 rounded-xl bg-destructive/90 hover:bg-destructive text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95"
            title="Stop generating"
          >
            <Square size={14} fill="currentColor" />
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={!value.trim() || disabled}
            className={cn(
              "m-2 flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all",
              value.trim() && !disabled
                ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 active:scale-95 shadow-md"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
            title="Send (Enter)"
          >
            <Send size={14} />
          </button>
        )}
      </div>

      <p className="text-center text-[10px] text-muted-foreground/40 mt-2">
        Press <kbd className="px-1 py-0.5 text-[9px] bg-muted border border-border rounded">Enter</kbd> to send · <kbd className="px-1 py-0.5 text-[9px] bg-muted border border-border rounded">Shift+Enter</kbd> for new line
      </p>
    </div>
  );
}
