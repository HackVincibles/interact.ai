"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Square, Paperclip, Mic, MicOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  onStop?: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function ChatInput({ onSend, isLoading, onStop, disabled, placeholder }: ChatInputProps) {
  const [value, setValue] = useState("");
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 180) + "px";
  }, [value]);

  // Initialize Web Speech API
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";

      rec.onresult = (event: any) => {
        let finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setValue((prev) => {
            const trimmed = prev.trim();
            return trimmed ? `${trimmed} ${finalTranscript}` : finalTranscript;
          });
        }
      };

      rec.onerror = (event: any) => {
        console.warn("Speech recognition warning:", event.error);
        if (event.error === "not-allowed") {
          toast.error("Microphone access was denied. Please allow microphone permissions in your browser.");
        } else if (event.error === "network") {
          toast.error("Speech recognition network error: Ensure you have an active internet connection and your browser supports cloud speech-to-text.");
        } else {
          toast.error(`Speech recognition error: ${event.error}`);
        }
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.error("Speech recognition is not supported in this browser. Please use Google Chrome, Edge, or Safari.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      toast.success("Voice recording ended");
    } else {
      setIsListening(true);
      recognitionRef.current.start();
      toast.success("Voice recording started... Speak now!");
    }
  };

  const handleSend = () => {
    const msg = value.trim();
    if (!msg || isLoading || disabled) return;
    onSend(msg);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    // Stop recording when sending a message
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
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
          "relative flex items-end gap-1.5 rounded-2xl border bg-card shadow-lg transition-all duration-200",
          disabled
            ? "border-border/30 opacity-50 cursor-not-allowed"
            : "border-border/60 hover:border-primary/40 focus-within:border-primary/60 focus-within:shadow-[0_0_0_3px_hsl(var(--primary)/0.1)]"
        )}
      >
        {/* Mic Button (Speech-to-Text) */}
        <button
          onClick={toggleListening}
          disabled={disabled || isLoading}
          className={cn(
            "m-2 flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer border",
            isListening
              ? "bg-red-500 text-white animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.5)] border-red-500 hover:bg-red-600"
              : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border-border/40"
          )}
          title={isListening ? "Stop listening" : "Speak (Voice-to-Text)"}
        >
          {isListening ? <MicOff size={14} className="animate-bounce" /> : <Mic size={14} />}
        </button>

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || isLoading}
          placeholder={isListening ? "Listening... Speak into your mic!" : (placeholder || "Message...")}
          rows={1}
          className={cn(
            "flex-1 resize-none bg-transparent py-3.5 px-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none min-h-[52px] max-h-[180px] leading-relaxed",
            (disabled || isLoading) && "cursor-not-allowed"
          )}
        />

        {/* Send / Stop button */}
        {isLoading ? (
          <button
            onClick={onStop}
            className="m-2 flex-shrink-0 w-9 h-9 rounded-xl bg-destructive/90 hover:bg-destructive text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer"
            title="Stop generating"
          >
            <Square size={14} fill="currentColor" />
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={!value.trim() || disabled}
            className={cn(
              "m-2 flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer",
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
