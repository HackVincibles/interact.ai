"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ZoomMtg } from "@zoom/meetingsdk";
import { vapi } from "@/lib/vapi.sdk";
import { Brain, MessageSquare, Hash, Clock, Users, Check, X } from "lucide-react";

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
  const [aiMessages, setAiMessages] = useState<string[]>([]);
  const [showAiPanel, setShowAiPanel] = useState(true);
  const [gdTimer, setGdTimer] = useState(duration * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const meetingContainerRef = useRef<HTMLDivElement>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Initialize timer
  useEffect(() => {
    if (duration > 0) {
      setGdTimer(duration * 60);
    }
  }, [duration]);

  // Timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerRunning && gdTimer > 0) {
      interval = setInterval(() => {
        setGdTimer((prev) => (prev <= 1 ? 0 : prev - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning, gdTimer]);

  // Initialize Zoom and join meeting
  useEffect(() => {
    const initZoom = async () => {
      try {
        setIsLoading(true);

        ZoomMtg.setZoomJSLib("https://source.zoom.us/3.1.6/lib", "/av");
        ZoomMtg.preLoadWasm();
        ZoomMtg.prepareWebSDK();

        const role = isHost ? 1 : 0; // 1 = host, 0 = participant
        console.log(`Generating signature as ${isHost ? 'HOST' : 'PARTICIPANT'} with role ${role}`);
        
        const response = await fetch("/api/zoom/signature", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            meetingNumber: meetingNumber.replace(/\D/g, ""),
            role: role,
          }),
        });

        if (!response.ok) throw new Error("Failed to get signature");

        const { signature } = await response.json();

        ZoomMtg.init({
          leaveUrl: window.location.href,
          isSupportAV: true,
          success: () => {
            ZoomMtg.join({
              meetingNumber: meetingNumber.replace(/\D/g, ""),
              userName,
              userEmail,
              passWord: password || "",
              signature,
              sdkKey: process.env.NEXT_PUBLIC_ZOOM_SDK_KEY || "",
              success: () => {
                if (isMounted.current) {
                  setIsLoading(false);
                  setTimerRunning(true);
                  addAiMessage(`Welcome ${userName} to the GD on "${topic}"! Keep cameras on and speak clearly.`);
                }
              },
              error: (err: any) => {
                if (isMounted.current) {
                  setError("Failed to join: " + (err.message || "Unknown error"));
                  setIsLoading(false);
                }
              },
            });
          },
          error: (err: any) => {
            if (isMounted.current) {
              setError("Zoom init failed: " + (err.message || "Unknown error"));
              setIsLoading(false);
            }
          },
        });
      } catch (err: any) {
        if (isMounted.current) {
          setError(err.message || "Failed to start meeting");
          setIsLoading(false);
        }
      }
    };

    initZoom();
  }, [meetingNumber, password, userName, userEmail, topic]);

  const addAiMessage = useCallback((message: string) => {
    setAiMessages((prev) => [...prev, message]);
  }, []);

  const leaveMeeting = useCallback(() => {
    try {
      ZoomMtg.leaveMeeting({});
    } catch (e) {
      console.log("Leave error:", e);
    }
    onLeave();
  }, [onLeave]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (error) {
    return (
      <div className="h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center p-8">
          <X className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Meeting Error</h3>
          <p className="text-gray-400 mb-6">{error}</p>
          <button onClick={onLeave} className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-gray-400" />
            <span className="text-white font-mono text-sm">{meetingNumber}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className={`w-4 h-4 ${gdTimer <= 60 ? "text-red-400" : "text-gray-400"}`} />
            <span className={`text-sm ${gdTimer <= 60 ? "text-red-400" : "text-white"}`}>
              {formatTime(gdTimer)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAiPanel(!showAiPanel)}
            className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2"
          >
            <Brain className="w-4 h-4" />
            {showAiPanel ? "Hide AI" : "Show AI"}
          </button>
          <button onClick={leaveMeeting} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg">
            Leave
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* Zoom Meeting Area */}
        <div className={`flex-1 relative bg-black ${showAiPanel ? "" : "w-full"}`}>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-white">Joining Zoom Meeting...</p>
              </div>
            </div>
          )}
          <div ref={meetingContainerRef} className="w-full h-full" id="zmmtg-root" />
        </div>

        {/* AI Panel */}
        {showAiPanel && (
          <div className="w-96 bg-gray-800 border-l border-gray-700 flex flex-col">
            {/* AI Header */}
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">AI Moderator</h3>
                  <p className="text-gray-400 text-sm">Topic: {topic}</p>
                </div>
              </div>
            </div>

            {/* AI Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {aiMessages.length === 0 ? (
                <p className="text-gray-500 text-center">AI moderator will appear here...</p>
              ) : (
                aiMessages.map((msg, idx) => (
                  <div key={idx} className="bg-gray-700 rounded-lg p-3">
                    <p className="text-gray-200 text-sm whitespace-pre-wrap">{msg}</p>
                  </div>
                ))
              )}
            </div>

            {/* AI Controls */}
            <div className="p-4 border-t border-gray-700 space-y-2">
              <button
                onClick={() => addAiMessage("Remember to speak clearly and maintain eye contact with the camera.")}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
              >
                Get Speaking Tips
              </button>
              <button
                onClick={() => addAiMessage(`Time remaining: ${formatTime(gdTimer)}. Keep up the good discussion!`)}
                className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm"
              >
                Check Time
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
