"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Mic, MicOff, MessageSquare, X, Minus, Bot, Send, Square, Award, Loader2, Sparkles, Star, Trash2, Maximize2 } from "lucide-react";
import MarkdownRenderer from "./MarkdownRenderer";
import ChatMessage, { TypingIndicator } from "./ChatMessage";
import InterviewSetup from "./InterviewSetup";
import InterviewFeedback from "./InterviewFeedback";
import {
  createSession,
  getUserSessions,
  getSession,
  deleteSession,
  streamMessage,
  endInterview,
} from "@/lib/actions/chat.action";
import { cn } from "@/lib/utils";

export default function FloatingChatWidget() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"interview" | "tech-helper">("tech-helper");
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [activeSession, setActiveSession] = useState<any>(null);

  // States
  const [chatLoading, setChatLoading] = useState(false);
  const [streamingResponse, setStreamingResponse] = useState("");
  const [showSetup, setShowSetup] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackData, setFeedbackData] = useState<any>(null);
  const [endingInterview, setEndingInterview] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingResponse, chatLoading, isOpen]);

  // Load history list when widget opens or toggles
  const loadHistory = async (targetMode = mode) => {
    try {
      const res = await getUserSessions(targetMode);
      if (res.success && res.data.length > 0) {
        setSessions(res.data);
        // Automatically select the most recent active session
        const recent = res.data[0];
        handleSelectSession(recent.sessionId);
      } else {
        setSessions([]);
        setActiveSessionId(null);
        setMessages([]);
        setActiveSession(null);
        setShowSetup(targetMode === "interview");
      }
    } catch (err) {
      console.error("Widget history load failed:", err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadHistory(mode);
    }
  }, [isOpen, mode]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.search.includes("chat=open")) {
      setIsOpen(true);
    }
  }, []);

  const handleSelectSession = async (sessionId: string) => {
    try {
      const res = await getSession(sessionId);
      if (res.success) {
        const s = res.data;
        setActiveSession(s);
        setActiveSessionId(s.sessionId);
        setMessages(s.messages);
        setMode(s.mode);

        if (s.mode === "interview") {
          setShowSetup(false);
          if (s.status === "completed" && s.feedback) {
            setFeedbackData(s.feedback);
            setShowFeedback(true);
          } else {
            setShowFeedback(false);
          }
        } else {
          setShowSetup(false);
          setShowFeedback(false);
        }
      }
    } catch (err) {
      console.error("Widget select session failed:", err);
    }
  };

  const startNewChat = async () => {
    if (readerRef.current) {
      readerRef.current.cancel();
      readerRef.current = null;
    }
    setChatLoading(false);
    setStreamingResponse("");
    setMessages([]);
    setActiveSessionId(null);
    setActiveSession(null);
    setShowFeedback(false);

    if (mode === "interview") {
      setShowSetup(true);
    } else {
      setShowSetup(false);
      try {
        const res = await createSession("tech-helper");
        if (res.success) {
          setActiveSession(res.data);
          setActiveSessionId(res.data.sessionId);
        }
      } catch (err) {
        console.error("New tech helper chat failed:", err);
      }
    }
  };

  const handleStartInterview = async (config: any) => {
    try {
      setShowSetup(false);
      const res = await createSession("interview", config);
      if (res.success) {
        const s = res.data;
        setActiveSession(s);
        setActiveSessionId(s.sessionId);
        setChatLoading(true);
        setStreamingResponse("");

        // Auto-greeting
        const response = await streamMessage(s.sessionId, "Hello!");
        await readStream(response);
      }
    } catch (err) {
      console.error("Start interview failed:", err);
    }
  };

  const readStream = async (response: Response) => {
    const reader = response.body?.getReader();
    if (!reader) return;
    readerRef.current = reader;

    const decoder = new TextDecoder();
    let accumulatedText = "";

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6).trim();
            if (!dataStr) continue;

            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.text) {
                accumulatedText += parsed.text;
                setStreamingResponse(accumulatedText);
              }
            } catch (e) {}
          }
        }
      }
    } finally {
      reader.releaseLock();
      readerRef.current = null;

      if (accumulatedText) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: accumulatedText, timestamp: new Date() },
        ]);
        setStreamingResponse("");
      }
      setChatLoading(false);
    }
  };

  const handleSendMessage = async (content: string) => {
    const targetSessionId = activeSessionId;
    
    if (!targetSessionId) {
      // Auto-create tech helper if none active
      if (mode === "tech-helper") {
        try {
          const res = await createSession("tech-helper");
          if (res.success) {
            const s = res.data;
            setActiveSession(s);
            setActiveSessionId(s.sessionId);
            setMessages([{ role: "user", content, timestamp: new Date() }]);
            setChatLoading(true);
            const response = await streamMessage(s.sessionId, content);
            await readStream(response);
          }
        } catch (err) {}
      }
      return;
    }

    setMessages((prev) => [...prev, { role: "user", content, timestamp: new Date() }]);
    setChatLoading(true);
    setStreamingResponse("");

    try {
      const response = await streamMessage(targetSessionId, content);
      await readStream(response);
    } catch (err) {
      setChatLoading(false);
    }
  };

  const handleEndInterview = async () => {
    if (!activeSessionId) return;
    setEndingInterview(true);
    try {
      const res = await endInterview(activeSessionId);
      if (res.success) {
        setFeedbackData(res.data.feedback);
        setShowFeedback(true);
        if (activeSession) {
          setActiveSession({ ...activeSession, status: "completed", feedback: res.data.feedback });
        }
      }
    } catch (err) {
      console.error("End interview failed:", err);
    } finally {
      setEndingInterview(false);
    }
  };

  const [inputVal, setInputVal] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

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
          setInputVal((prev) => {
            const trimmed = prev.trim();
            return trimmed ? `${trimmed} ${finalTranscript}` : finalTranscript;
          });
        }
      };

      rec.onerror = (event: any) => {
        console.error("Widget Speech recognition error", event.error);
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
      alert("Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const handleSend = () => {
    const text = inputVal.trim();
    if (!text || chatLoading) return;
    handleSendMessage(text);
    setInputVal("");
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* ─── Collapsed State (Floating Robot Image) ─────────────────────────── */}
      {!isOpen && (
        <div onClick={() => setIsOpen(true)} className="group relative flex flex-col items-center cursor-pointer">
          {/* Pulsing Backlight glow */}
          <span className="absolute inset-2 rounded-full bg-primary/25 animate-ping opacity-60 scale-95" />
          
          {/* Tooltip */}
          <div className="absolute bottom-full mb-3 hidden group-hover:flex items-center justify-center bg-card/95 border border-border/60 text-foreground px-3 py-1.5 rounded-xl shadow-xl text-[10px] font-black uppercase tracking-wider animate-bounce select-none whitespace-nowrap">
            <span>Chat with AI! 👋</span>
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-card" />
          </div>

          <div className="w-22 h-22 overflow-hidden rounded-full transition-all duration-300 hover:scale-115 hover:-rotate-6 active:scale-90 flex items-center justify-center border-2 border-primary/40 shadow-[0_0_20px_rgba(var(--primary),0.25)] bg-white dark:brightness-90 dark:border-primary/60 relative">
            <div className="w-[300%] h-full absolute left-[-100%] flex items-center justify-center">
              <Image
                src="/robot-purple.png"
                alt="AI Assistant"
                width={264}
                height={88}
                priority
                className="object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── Expanded State (Floating Chat Popover Window) ─────────────────── */}
      {isOpen && (
        <div className="w-[380px] h-[550px] rounded-2xl border border-border/50 bg-card/95 backdrop-blur-md shadow-2xl flex flex-col overflow-hidden animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b border-border/50">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
                <Bot size={14} />
              </div>
              <span className="text-xs font-black uppercase tracking-wider text-foreground">Interact AI Copilot</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  setIsOpen(false);
                  router.push("/ai-chat");
                }}
                className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                title="Full Screen Mode"
              >
                <Maximize2 size={13} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                title="Minimize"
              >
                <Minus size={13} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                title="Close"
              >
                <X size={13} />
              </button>
            </div>
          </div>

          {/* Toggle Switching Header */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-border/30 bg-muted/10 gap-2">
            <div className="flex rounded-full bg-muted p-0.5 border border-border/30">
              <button
                onClick={() => setMode("interview")}
                className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all",
                  mode === "interview" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"
                )}
              >
                Interview
              </button>
              <button
                onClick={() => setMode("tech-helper")}
                className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all",
                  mode === "tech-helper" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"
                )}
              >
                Tech Helper
              </button>
            </div>

            <button
              onClick={startNewChat}
              className="text-[10px] font-bold text-primary hover:underline uppercase"
            >
              + New Chat
            </button>
          </div>

          {/* Chat Workspace Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar min-h-0 bg-background/20">
            {mode === "interview" && showSetup ? (
              <div className="scale-95 origin-top">
                <InterviewSetup onStart={handleStartInterview} isLoading={chatLoading} />
              </div>
            ) : mode === "interview" && showFeedback ? (
              <div className="scale-95 origin-top">
                <InterviewFeedback feedback={feedbackData} onNewChat={startNewChat} />
              </div>
            ) : messages.length === 0 && !chatLoading ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Bot size={20} className="animate-pulse" />
                </div>
                <h4 className="text-xs font-bold uppercase tracking-wider">
                  {mode === "interview" ? "AI Interview Session" : "AI Technical Assistant"}
                </h4>
                <p className="text-[10px] text-muted-foreground leading-relaxed max-w-[240px]">
                  {mode === "interview"
                    ? "Click '+ New Chat' to configure setup and start a live interview simulation."
                    : "Ask any question about programming languages, algorithms, or system architecture."}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((m, i) => (
                  <div key={i} className={cn("flex gap-2.5", m.role === "user" ? "flex-row-reverse" : "flex-row")}>
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
                      m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted border"
                    )}>
                      {m.role === "user" ? "U" : "AI"}
                    </div>
                    <div className={cn(
                      "max-w-[75%] rounded-2xl px-3 py-2 text-xs",
                      m.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-none"
                        : "bg-card border rounded-tl-none prose-xs text-foreground"
                    )}>
                      {m.role === "user" ? (
                        <p className="leading-relaxed whitespace-pre-wrap">{m.content}</p>
                      ) : (
                        <MarkdownRenderer content={m.content} />
                      )}
                    </div>
                  </div>
                ))}

                {streamingResponse && (
                  <div className="flex gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-muted border flex items-center justify-center text-[10px] font-bold shrink-0">AI</div>
                    <div className="max-w-[75%] rounded-2xl px-3 py-2 text-xs bg-card border rounded-tl-none prose-xs text-foreground">
                      <MarkdownRenderer content={streamingResponse} />
                    </div>
                  </div>
                )}

                {chatLoading && !streamingResponse && (
                  <div className="flex gap-2.5 items-center">
                    <div className="w-6 h-6 rounded-full bg-muted border flex items-center justify-center text-[10px] font-bold shrink-0">AI</div>
                    <span className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
                    </span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Chat Input Footer */}
          {!showSetup && !showFeedback && (
            <div className="p-3 border-t border-border/50 bg-card/60">
              {mode === "interview" && activeSessionId && activeSession?.status !== "completed" && (
                <div className="flex items-center justify-between pb-2 mb-1.5 border-b border-border/30">
                  <span className="text-[9px] uppercase font-black text-violet-400">Live Interview</span>
                  <button
                    onClick={handleEndInterview}
                    disabled={endingInterview}
                    className="text-[9px] font-black uppercase text-amber-400 hover:underline"
                  >
                    {endingInterview ? "Grading..." : "End & Grade"}
                  </button>
                </div>
              )}

              <div className="relative flex items-center bg-muted/40 border border-border/50 rounded-xl px-2.5 py-1.5 focus-within:border-primary/50 transition-colors">
                <button
                  onClick={toggleListening}
                  disabled={chatLoading}
                  className={cn(
                    "p-1.5 rounded-lg flex items-center justify-center transition-all cursor-pointer mr-1.5",
                    isListening
                      ? "bg-red-500 text-white animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.4)]"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                  title={isListening ? "Stop listening" : "Speak (Voice-to-Text)"}
                >
                  {isListening ? <MicOff size={11} className="animate-bounce" /> : <Mic size={11} />}
                </button>
                <input
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder={isListening ? "Listening... Speak now!" : (mode === "interview" ? "Enter your answer..." : "Ask a question...")}
                  className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none py-1"
                />
                <button
                  onClick={handleSend}
                  disabled={!inputVal.trim() || chatLoading}
                  className="p-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  <Send size={10} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
