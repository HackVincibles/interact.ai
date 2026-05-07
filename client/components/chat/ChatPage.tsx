"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Mic, MessageSquare, Loader2, Sparkles, AlertCircle, Bot, Award, RotateCcw, Minus, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import ChatHistory from "./ChatHistory";
import ChatInput from "./ChatInput";
import ChatMessage, { TypingIndicator } from "./ChatMessage";
import InterviewSetup from "./InterviewSetup";
import InterviewFeedback from "./InterviewFeedback";
import {
  createSession,
  getUserSessions,
  getSession,
  deleteSession,
  renameSession,
  endInterview,
  streamMessage,
} from "@/lib/actions/chat.action";
import { generatePDFReport } from "@/lib/pdf-generator";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface Session {
  _id: string;
  sessionId: string;
  mode: "interview" | "tech-helper";
  title: string;
  status: "active" | "completed" | "abandoned";
  messageCount: number;
  updatedAt: string;
  createdAt: string;
  feedback?: any;
  interviewConfig?: any;
}

export default function ChatPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"interview" | "tech-helper">("interview");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeSession, setActiveSession] = useState<Session | null>(null);

  // Loading & Action States
  const [historyLoading, setHistoryLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const [streamingResponse, setStreamingResponse] = useState("");
  const [endingInterview, setEndingInterview] = useState(false);

  // UI Setup & Feedback Panel States
  const [showSetup, setShowSetup] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackData, setFeedbackData] = useState<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);

  // Fetch session history list
  const loadHistory = async (targetMode = mode) => {
    try {
      setHistoryLoading(true);
      const res = await getUserSessions(targetMode);
      if (res.success) {
        setSessions(res.data);
      }
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadHistory(mode);
    // Reset active chat when switching mode
    setActiveSessionId(null);
    setMessages([]);
    setActiveSession(null);
    setShowSetup(targetModeIsInterview(mode));
    setShowFeedback(false);
  }, [mode]);

  const targetModeIsInterview = (m: "interview" | "tech-helper") => m === "interview";

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingResponse, chatLoading]);

  // Handle selecting a session from history
  const handleSelectSession = async (sessionId: string) => {
    // If we're currently streaming, abort it
    if (readerRef.current) {
      readerRef.current.cancel();
      readerRef.current = null;
    }
    setChatLoading(false);
    setStreamingResponse("");

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
      console.error("Failed to load session details:", err);
    }
  };

  // Create a brand new chat
  const handleNewChat = () => {
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
      startNewTechHelperSession();
    }
  };

  const startNewTechHelperSession = async () => {
    try {
      const res = await createSession("tech-helper");
      if (res.success) {
        setActiveSession(res.data);
        setActiveSessionId(res.data.sessionId);
        loadHistory("tech-helper");
      }
    } catch (err) {
      console.error("Failed to start tech helper session:", err);
    }
  };

  // Start interview after setup
  const handleStartInterview = async (config: any) => {
    try {
      setShowSetup(false);
      const res = await createSession("interview", config);
      if (res.success) {
        const s = res.data;
        setActiveSession(s);
        setActiveSessionId(s.sessionId);
        loadHistory("interview");

        // Automatically trigger AI's opening greeting/intro
        await simulateAiGreeting(s.sessionId, config);
      }
    } catch (err) {
      console.error("Failed to start interview session:", err);
    }
  };

  const simulateAiGreeting = async (sessId: string, config: any) => {
    setChatLoading(true);
    setStreamingResponse("");

    try {
      const introMsg = `Hi! I'm your AI technical interviewer today. I see we're interviewing for a ${
        config.role
      } position specializing in ${config.techStack.join(", ") || "software engineering"}. Let's get started. Could you please introduce yourself and tell me briefly about your background?`;

      // Save intro msg as first AI message by streaming or sending message
      const response = await streamMessage(sessId, "Hello!");
      await readStream(response);
    } catch (err) {
      console.error("Intro failed:", err);
      setChatLoading(false);
    }
  };

  // Standard stream reader
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
              if (parsed.done) {
                break;
              }
            } catch (e) {
              // Ignore parse errors from partial buffers
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
      readerRef.current = null;

      // Finalize message appending
      if (accumulatedText) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: accumulatedText, timestamp: new Date() },
        ]);
        setStreamingResponse("");
        loadHistory(mode);
      }
      setChatLoading(false);
    }
  };

  // Send message
  const handleSendMessage = async (content: string) => {
    if (!activeSessionId) return;

    // Append user message immediately to UI for snappiness
    const userMsg: Message = { role: "user", content, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setChatLoading(true);
    setStreamingResponse("");

    try {
      // Trigger evaluation if candidate manually types "end interview"
      if (mode === "interview" && content.toLowerCase().includes("end interview")) {
        await handleEndInterview();
        return;
      }

      const response = await streamMessage(activeSessionId, content);
      await readStream(response);
    } catch (err) {
      console.error("Message error:", err);
      setChatLoading(false);
    }
  };

  // Finalize / End Interview to get performance score & star rating
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
        loadHistory("interview");

        // --- Auto Generate PDF Report ---
        try {
          const CATEGORY_LABELS: Record<string, string> = {
            communicationSkills: "Communication Skills",
            technicalKnowledge: "Technical Knowledge",
            problemSolving: "Problem Solving",
            culturalFit: "Cultural Fit",
            confidenceClarity: "Confidence & Clarity",
          };

          const categoryArr = Object.entries(res.data.feedback.categoryScores || {}).map(([key, score]) => ({
            name: CATEGORY_LABELS[key] || key,
            score: Number(score),
            comment: ""
          }));

          const pdfData = {
            type: "interview" as const,
            userName: "Candidate", 
            role: activeSession?.interviewConfig?.role || "Software Engineer",
            totalScore: res.data.feedback.totalScore || 0,
            finalAssessment: res.data.feedback.finalAssessment || "",
            strengths: res.data.feedback.strengths || [],
            areasForImprovement: res.data.feedback.areasForImprovement || [],
            categoryScores: categoryArr,
            transcript: messages.map(m => ({ role: m.role, content: m.content }))
          };
          
          await generatePDFReport(pdfData);
        } catch (pdfErr) {
          console.error("Failed to generate PDF report:", pdfErr);
        }
      }
    } catch (err: any) {
      console.warn("Failed to end interview:", err.message || err);
      toast.error(err.message || "Failed to analyze interview. Please try again.");
    } finally {
      setEndingInterview(false);
    }
  };

  // Rename past session title
  const handleRenameSession = async (sessId: string, newTitle: string) => {
    try {
      const res = await renameSession(sessId, newTitle);
      if (res.success) {
        setSessions((prev) =>
          prev.map((s) => (s.sessionId === sessId ? { ...s, title: newTitle } : s))
        );
        if (activeSessionId === sessId && activeSession) {
          setActiveSession({ ...activeSession, title: newTitle });
        }
      }
    } catch (err) {
      console.error("Rename failed:", err);
    }
  };

  // Delete past session
  const handleDeleteSession = async (sessId: string) => {
    try {
      const res = await deleteSession(sessId);
      if (res.success) {
        setSessions((prev) => prev.filter((s) => s.sessionId !== sessId));
        if (activeSessionId === sessId) {
          setActiveSessionId(null);
          setMessages([]);
          setActiveSession(null);
          setShowFeedback(false);
          setShowSetup(mode === "interview");
        }
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const handleStopGenerating = () => {
    if (readerRef.current) {
      readerRef.current.cancel();
      readerRef.current = null;
    }
    setChatLoading(false);
  };

  return (
    <div className="flex h-[80vh] border border-border/50 rounded-2xl overflow-hidden glass-card shadow-2xl">
      {/* 1. History Sidebar panel */}
      <ChatHistory
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onRenameSession={handleRenameSession}
        onDeleteSession={handleDeleteSession}
        currentMode={mode}
        isLoading={historyLoading}
      />

      {/* 2. Main Chat Workspace */}
      <div className="flex-1 flex flex-col bg-background/40 backdrop-blur-sm relative min-w-0">
        {/* Toggle Head bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 bg-card/60 border-b border-border/50 gap-4">
          <div className="flex items-center gap-2.5">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center text-white",
              mode === "interview" ? "bg-violet-600" : "bg-sky-500"
            )}>
              {mode === "interview" ? <Mic size={16} /> : <MessageSquare size={16} />}
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider">
                {mode === "interview" ? "AI Interviewer Chatbot" : "AI Tech Helper Assistant"}
              </h3>
              <p className="text-[10px] text-muted-foreground font-medium uppercase">
                {activeSessionId ? activeSession?.title : "New Session"}
              </p>
            </div>
          </div>

          {/* Action Tools & Switch Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/60 bg-muted/20 hover:bg-muted text-[10px] font-black uppercase tracking-wider text-muted-foreground hover:text-foreground transition-all cursor-pointer shadow-sm"
              title="Back to Dashboard"
            >
              <ArrowLeft size={11} />
              <span>Back</span>
            </button>

            <button
              onClick={() => router.push("/?chat=open")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/60 bg-muted/20 hover:bg-muted text-[10px] font-black uppercase tracking-wider text-muted-foreground hover:text-foreground transition-all cursor-pointer shadow-sm"
              title="Minimize Chat to Widget"
            >
              <Minus size={11} />
              <span>Minimize</span>
            </button>

            {/* Mode Switch Toggle */}
            <div className="flex rounded-full bg-muted/60 p-1 border border-border/30 shadow-inner">
              <button
                onClick={() => setMode("interview")}
                disabled={chatLoading}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50",
                  mode === "interview"
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Mic size={12} />
                <span>Interview</span>
              </button>
              <button
                onClick={() => setMode("tech-helper")}
                disabled={chatLoading}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50",
                  mode === "tech-helper"
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <MessageSquare size={12} />
                <span>Tech Helper</span>
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Inner Workspace Panel */}
        <div className="flex-1 overflow-y-auto min-h-0 flex flex-col custom-scrollbar">
          {mode === "interview" && showSetup ? (
            <InterviewSetup onStart={handleStartInterview} isLoading={chatLoading} />
          ) : mode === "interview" && showFeedback ? (
            <InterviewFeedback feedback={feedbackData} onNewChat={handleNewChat} />
          ) : messages.length === 0 && !chatLoading ? (
            /* Blank state screen */
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4 max-w-sm mx-auto">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-xl animate-bounce",
                mode === "interview"
                  ? "bg-gradient-to-br from-violet-600 to-purple-600"
                  : "bg-gradient-to-br from-sky-500 to-blue-500"
              )}>
                <Bot size={24} />
              </div>
              <h3 className="text-md font-bold uppercase tracking-tight">
                {mode === "interview" ? "Start Your Mock Interview" : "Ask Anything Tech Related"}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {mode === "interview"
                  ? "Click 'New Chat' to configure your target position and begin a live technical interview session."
                  : "Enter any question about coding, system design, databases, or CS fundamentals in the input bar below."}
              </p>
            </div>
          ) : (
            /* Message List */
            <div className="flex-1 divide-y divide-border/20">
              {messages.map((m, index) => (
                <ChatMessage
                  key={index}
                  role={m.role}
                  content={m.content}
                  timestamp={m.timestamp}
                  mode={mode}
                />
              ))}

              {/* Streaming token bubble */}
              {streamingResponse && (
                <ChatMessage
                  role="assistant"
                  content={streamingResponse}
                  isStreaming={true}
                  mode={mode}
                />
              )}

              {/* Loader dots */}
              {chatLoading && !streamingResponse && <TypingIndicator mode={mode} />}

              {/* Scroll anchor */}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Bar Section */}
        {(!showSetup && !showFeedback && (activeSessionId || mode === "tech-helper")) && (
          <div className="bg-card/40 border-t border-border/50">
            {mode === "interview" && activeSession?.status !== "completed" && (
              <div className="flex items-center justify-between px-6 py-2 bg-violet-600/5 border-b border-violet-500/10">
                <span className="text-[10px] uppercase font-bold text-violet-400">
                  Live Interview Session (Active)
                </span>
                <button
                  onClick={handleEndInterview}
                  disabled={endingInterview}
                  className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-amber-400 hover:text-amber-300 disabled:opacity-50 cursor-pointer"
                >
                  {endingInterview ? (
                    <>
                      <Loader2 size={10} className="animate-spin" />
                      <span>Evaluating...</span>
                    </>
                  ) : (
                    <>
                      <Award size={11} />
                      <span>End Interview & Grade</span>
                    </>
                  )}
                </button>
              </div>
            )}

            <ChatInput
              onSend={activeSessionId ? handleSendMessage : (msg) => {
                // If there's no session, auto create first
                if (mode === "tech-helper") {
                  createSession("tech-helper").then((res) => {
                    if (res.success) {
                      setActiveSession(res.data);
                      setActiveSessionId(res.data.sessionId);
                      loadHistory("tech-helper");
                      streamMessage(res.data.sessionId, msg).then(readStream);
                    }
                  });
                }
              }}
              isLoading={chatLoading}
              onStop={handleStopGenerating}
              placeholder={
                mode === "interview"
                  ? "Type your interview response here..."
                  : "Ask about React hooks, Docker, Binary Search..."
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
