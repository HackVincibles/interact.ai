"use client";

import { useState, useEffect } from "react";
import { 
  Brain, Clock, Eye, EyeOff, Loader2, X, ChevronRight
} from "lucide-react";

interface Participant {
  id: string;
  name: string;
  isVideoOn: boolean;
  isAudioOn: boolean;
  isSpeaking: boolean;
  isHost?: boolean;
}

interface ZoomMeetingWithAIProps {
  meetingNumber: string;
  password?: string;
  userName: string;
  userEmail?: string;
  topic: string;
  duration: number;
  isHost?: boolean;
  onLeave: () => void;
}

export default function ZoomMeetingWithAI({
  meetingNumber,
  password,
  userName,
  userEmail = "",
  topic,
  duration,
  isHost = false,
  onLeave,
}: ZoomMeetingWithAIProps) {
  const [showAiPanel, setShowAiPanel] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signatureData, setSignatureData] = useState<{signature: string, sdkKey: string} | null>(null);
  
  // Clean meeting number for URL
  const cleanMeetingNumber = meetingNumber.replace(/\D/g, "");

  // Fetch signature on mount
  useEffect(() => {
    const fetchSignature = async () => {
      try {
        const response = await fetch("/api/zoom/signature", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            meetingNumber: cleanMeetingNumber,
            role: 0, // Force role 0 to avoid host authentication issues
          }),
        });

        if (!response.ok) throw new Error("Failed to get session signature");
        const data = await response.json();
        setSignatureData(data);
        setIsLoading(false);
      } catch (err: any) {
        console.error("Signature error:", err);
        setError(err.message);
        setIsLoading(false);
      }
    };

    fetchSignature();
  }, [cleanMeetingNumber, isHost]);

  return (
    <div className="flex flex-col h-screen bg-black text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 bg-gray-900 border-b border-gray-800 z-50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-gray-500">MEETING</span>
            <span className="text-sm font-bold tracking-wider">{cleanMeetingNumber}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">{duration}:00</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowAiPanel(!showAiPanel)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
          >
            {showAiPanel ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showAiPanel ? "Hide AI" : "Show AI"}
          </button>
          <button 
            onClick={onLeave}
            className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all text-sm font-bold"
          >
            Leave
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex flex-1 overflow-hidden relative">
        <div className="flex-1 bg-black relative">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black">
              <div className="text-center">
                <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
                <p className="text-gray-400">Loading Zoom Engine...</p>
              </div>
            </div>
          ) : error ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black">
              <div className="text-center p-8">
                <X className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Bridge Error</h3>
                <p className="text-gray-400 mb-6">{error}</p>
                <button onClick={() => window.location.reload()} className="px-6 py-2 bg-gray-800 rounded-lg">Retry</button>
              </div>
            </div>
          ) : (
            <iframe
              src={`/zoom.html?meetingNumber=${cleanMeetingNumber}&signature=${encodeURIComponent(signatureData?.signature || "")}&sdkKey=${encodeURIComponent(signatureData?.sdkKey || "")}&password=${encodeURIComponent(password || "")}&userName=${encodeURIComponent(userName)}&userEmail=${encodeURIComponent(userEmail || "")}`}
              className="w-full h-full border-none"
              allow="camera; microphone; display-capture; autoplay; clipboard-read; clipboard-write; fullscreen"
            />
          )}
        </div>

        {/* AI Sidebar */}
        {showAiPanel && (
          <div className="w-[380px] border-l border-gray-800 bg-gray-900 flex flex-col z-40">
            <div className="p-6 border-b border-gray-800">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">AI Moderator</h3>
                  <p className="text-xs text-gray-400">Active Monitoring</p>
                </div>
              </div>
            </div>
            
            <div className="flex-1 p-6 space-y-4">
              <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-800">
                <p className="text-sm text-gray-400 mb-2">Current Topic</p>
                <p className="text-sm font-bold">{topic}</p>
              </div>
              <div className="text-center py-20 opacity-30">
                <Brain className="w-12 h-12 mx-auto mb-4" />
                <p className="text-xs">Waiting for session to start...</p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-800 bg-gray-900">
              <button className="w-full py-3 bg-purple-600 hover:bg-purple-700 rounded-xl font-bold transition-all">
                Analyze Transcription
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
