"use client";

import Image from "next/image";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { vapi } from "@/lib/vapi.sdk";
import { interviewer } from "@/constants";
import { createFeedback } from "@/lib/actions/general.action";
import CodeEditor from "@/components/CodeEditor";
import AIVoiceVisualizer from "@/components/AIVoiceVisualizer";
import AIAvatar from "@/components/AIAvatar";
import DownloadReportButton from "@/components/DownloadReportButton";
import { generatePDFReport } from "@/lib/pdf-generator";
import { X, Loader2 } from "lucide-react";
import { AICoachPanel } from "../src/components/AICoach/AICoachPanel";

enum CallStatus {
  INACTIVE = "INACTIVE",
  CONNECTING = "CONNECTING",
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED",
}

interface SavedMessage {
  role: "user" | "system" | "assistant";
  content: string;
}

type ViewMode = "ai" | "user";
type MainViewMode = "interview" | "code";

const Agent = ({
  userName,
  userId,
  interviewId,
  feedbackId,
  type,
  questions,
  profileImage,
}: AgentProps) => {
  const router = useRouter();
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [messages, setMessages] = useState<SavedMessage[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [lastMessage, setLastMessage] = useState<string>("");
  
  // Camera states
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("ai");
  const mainVideoRef = useRef<HTMLVideoElement>(null);
  const smallVideoRef = useRef<HTMLVideoElement>(null);
  const coachVideoRef = useRef<HTMLVideoElement>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [tabWarning, setTabWarning] = useState(false);
  const [cheatingCount, setCheatingCount] = useState(0);
  const [mainViewMode, setMainViewMode] = useState<MainViewMode>("interview");

  // Report Popup States
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [showReportPopup, setShowReportPopup] = useState(false);
  const [feedbackData, setFeedbackData] = useState<any>(null);
  const hasGeneratedReportRef = useRef(false);

  // Anti-cheating: Handle tab visibility and beforeunload - ONLY during active call
  useEffect(() => {
    // Only apply restrictions when call is ACTIVE
    if (callStatus !== CallStatus.ACTIVE) {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      return;
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabWarning(true);
        setCheatingCount(prev => prev + 1);
        setTimeout(() => window.focus(), 100);
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "Interview in progress. Are you sure you want to leave?";
      return e.returnValue;
    };

    const focusCheckInterval = setInterval(() => {
      if (!document.hasFocus() && document.hidden) {
        setTabWarning(true);
        setCheatingCount(prev => prev + 1);
      }
    }, 500);

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);
    
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      clearInterval(focusCheckInterval);
    };
  }, [callStatus]);

  useEffect(() => {
    const onCallStart = () => setCallStatus(CallStatus.ACTIVE);
    const onCallEnd = () => setCallStatus(CallStatus.FINISHED);

    const onMessage = (message: any) => {
      if (message.type === "transcript" && message.transcriptType === "final") {
        setMessages((prev) => [...prev, { role: message.role, content: message.transcript }]);
      }
    };

    const onSpeechStart = () => {
      setIsSpeaking(true);
      setIsUserSpeaking(false);
    };

    const onSpeechEnd = () => setIsSpeaking(false);

    const onUserSpeechStart = () => {
      setIsUserSpeaking(true);
      setIsSpeaking(false);
    };

    const onUserSpeechEnd = () => setIsUserSpeaking(false);

    const onError = (error: any) => {
      console.error("Vapi Error details:", JSON.stringify(error, null, 2));
      const errMsg = error?.error?.message?.message 
        || error?.error?.message 
        || error?.message 
        || "Failed to connect to AI Assistant. Please check your VAPI configuration.";
      toast.error(typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg));
      setCallStatus(CallStatus.INACTIVE);
    };

    vapi.on("call-start", onCallStart);
    vapi.on("call-end", onCallEnd);
    vapi.on("message", onMessage);
    vapi.on("speech-start", onSpeechStart);
    vapi.on("speech-end", onSpeechEnd);
    vapi.on("user-speech-start", onUserSpeechStart);
    vapi.on("user-speech-end", onUserSpeechEnd);
    vapi.on("error", onError);

    return () => {
      vapi.off("call-start", onCallStart);
      vapi.off("call-end", onCallEnd);
      vapi.off("message", onMessage);
      vapi.off("speech-start", onSpeechStart);
      vapi.off("speech-end", onSpeechEnd);
      vapi.off("user-speech-start", onUserSpeechStart);
      vapi.off("user-speech-end", onUserSpeechEnd);
      vapi.off("error", onError);
    };
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      setLastMessage(messages[messages.length - 1].content);
    }
  }, [messages]);

  const handleGenerateFeedback = async () => {
    if (messages.length === 0) {
      console.log("No messages to generate feedback from");
      return;
    }
    
    console.log("Starting feedback generation...");
    setIsGeneratingReport(true);
    
    try {
      console.log("Calling createFeedback with:", { interviewId, userId, messageCount: messages.length });
      const result = await createFeedback({
        interviewId: interviewId || "general_practice_mode",
        userId: userId!,
        transcript: messages,
        feedbackId,
      });

      console.log("createFeedback result:", result);

      if (result.success && result.data) {
        console.log("Feedback created successfully, data:", result.data);
        setFeedbackData(result.data);
        setShowReportPopup(true);
        
        // Auto-download PDF report
        // Convert categoryScores object to array for PDF generator
        const formatCategoryScores = (scoresObj: any) => {
          if (!scoresObj) return [];
          if (Array.isArray(scoresObj)) return scoresObj;
          const labels: Record<string, string> = {
            communicationSkills: "Communication Skills",
            technicalKnowledge: "Technical Knowledge",
            problemSolving: "Problem Solving",
            culturalFit: "Cultural Fit",
            confidenceClarity: "Confidence & Clarity",
          };
          return Object.entries(scoresObj).map(([key, value]) => ({
            name: labels[key] || key,
            score: Number(value) || 0,
            comment: ""
          }));
        };

        const pdfData = {
          type: "interview" as const,
          userName: userName || "Candidate",
          role: type === "generate" ? "Technical" : "Interview",
          totalScore: result.data.totalScore,
          finalAssessment: result.data.finalAssessment,
          strengths: result.data.strengths,
          areasForImprovement: result.data.areasForImprovement,
          categoryScores: formatCategoryScores(result.data.categoryScores),
          transcript: messages,
        };
        console.log("PDF data:", pdfData);
        
        await generatePDFReport(pdfData);
        console.log("PDF generated and downloaded successfully");

        // Auto-download Sentiment Analysis PDF if available
        const sentiment = result.data.sentimentAnalysis;
        if (sentiment) {
          const { generateSentimentPDFReport } = await import("@/lib/pdf-generator");
          await generateSentimentPDFReport({
            userName: userName || "Candidate",
            role: type === "generate" ? "Technical" : "Interview",
            overallTone: sentiment.overallTone || "Neutral",
            confidenceLevel: sentiment.confidenceLevel || 0,
            professionalism: sentiment.professionalism || 0,
            engagement: sentiment.engagement || 0,
            behavioralNotes: sentiment.behavioralNotes || []
          });
          console.log("Sentiment PDF downloaded successfully");
        }
      } else {
        console.error("Error saving feedback - result not successful:", result);
      }
    } catch (error) {
      console.error("Error generating report:", error);
      alert("Failed to generate PDF report. Check console for details.");
    } finally {
      setIsGeneratingReport(false);
    }
  };

  useEffect(() => {
    if (callStatus === CallStatus.FINISHED) {
      if (messages.length > 0 && !hasGeneratedReportRef.current) {
        hasGeneratedReportRef.current = true;
        console.log("Call finished. Triggering automatic PDF generation...");
        handleGenerateFeedback();
      } else if (messages.length === 0 && type === "generate") {
        router.push("/");
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callStatus, type, router, messages.length]);

  const handleCall = async () => {
    setCallStatus(CallStatus.CONNECTING);

    // Request fullscreen immediately on user gesture (button click)
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        console.log("Fullscreen entered on call start");
      }
    } catch (err) {
      console.log("Fullscreen request failed (may require user interaction):", err);
    }

    const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;

    console.log("VAPI Config:", { assistantId, type, userName, userId });

    if (!assistantId) {
      console.error("NEXT_PUBLIC_VAPI_ASSISTANT_ID is not set");
      toast.error("AI configuration missing. Please set up your VAPI assistant ID.");
      setCallStatus(CallStatus.INACTIVE);
      return;
    }

    if (type === "generate") {
      try {
        await vapi.start(assistantId, {
          variableValues: {
            username: userName,
            userid: userId,
          },
        });
      } catch (err) {
        console.error("Vapi generate start error:", err);
        setCallStatus(CallStatus.INACTIVE);
      }
    } else {
      // Interview type
      let formattedQuestions = "";
      if (questions) {
        formattedQuestions = questions
          .map((question) => `- ${question}`)
          .join("\n");
      }

      try {
        await vapi.start(assistantId, {
          variableValues: {
            questions: formattedQuestions,
          },
        });
      } catch (err) {
        console.error("Vapi interview start error:", err);
        setCallStatus(CallStatus.INACTIVE);
      }
    }
  };

  // Camera functions
  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: "user" },
        audio: false,
      });
      setStream(mediaStream);
      setIsCameraOn(true);
      setHasPermission(true);
      setCameraError(null);
    } catch (err) {
      console.error("Failed to access camera:", err);
      setCameraError("Camera access denied. Please allow camera permissions.");
      setHasPermission(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      setIsCameraOn(false);
    }
  }, [stream]);

  // Start camera immediately when component mounts
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);



  // Attach stream to video elements whenever they render
  useEffect(() => {
    const attachStream = () => {
      if (stream) {
        if (mainVideoRef.current) {
          mainVideoRef.current.srcObject = stream;
        }
        if (smallVideoRef.current) {
          smallVideoRef.current.srcObject = stream;
        }
        if (coachVideoRef.current) {
          coachVideoRef.current.srcObject = stream;
        }
      }
    };
    
    // Small delay to ensure DOM is ready
    const timer = setTimeout(attachStream, 100);
    return () => clearTimeout(timer);
  }, [stream, viewMode]);

  const handleDisconnect = async () => {
    console.log("handleDisconnect called manually. Ending call...");
    vapi.stop();
    // State will transition to FINISHED via the vapi 'call-end' listener,
    // which in turn will trigger the report generation automatically.
    setCallStatus(CallStatus.FINISHED);
  };

  // Handle code sharing from CodeEditor to AI
  const handleShareCodeWithAI = (code: string, language: string) => {
    console.log("Sharing code with AI:", { language, codeLength: code.length });

    // Add code to messages
    const codeMessage = `[CODE SHARED BY USER]\n\nLanguage: ${language}\n\n\`\`\`${language}\n${code}\n\`\`\``;
    setMessages((prev) => [...prev, { role: "user", content: codeMessage }]);

    // Send code to VAPI AI as a message
    if (vapi && callStatus === CallStatus.ACTIVE) {
      try {
        // Send the code as a message to the AI
        vapi.send({
          type: "add-message",
          message: {
            role: "user",
            content: `I've shared my code with you. Please review this ${language} code and ask me questions about it:\n\n\`\`\`${language}\n${code}\n\`\`\``,
          },
        });
        console.log("Code sent to AI successfully");
      } catch (error) {
        console.error("Error sending code to AI:", error);
      }
    }

    // Keep the editor open so user can continue coding
    // Show a toast or notification that code was shared
    console.log("Code shared successfully - editor remains open");
  };

  // Render small card for top bar
  const renderSmallCard = (
    mode: ViewMode,
    isAI: boolean,
    isActive: boolean
  ) => (
    <div
      onClick={() => setViewMode(mode)}
      className={`cursor-pointer rounded-xl border-2 transition-all duration-300 overflow-hidden ${
        isActive
          ? "border-primary-200 ring-2 ring-primary-200/50"
          : "border-transparent opacity-70 hover:opacity-100"
      }`}
    >
      <div className="relative w-24 h-16 bg-dark-200">
        {isAI ? (
          <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-800 dark:to-gray-900">
            <AIAvatar size="sm" isSpeaking={isSpeaking} isListening={isUserSpeaking} />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full relative">
            {/* Only show video in small card when AI is in main view (not user) */}
            {stream && viewMode === "ai" ? (
              <video
                ref={(el) => {
                  if (el) {
                    el.srcObject = stream;
                  }
                }}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover rounded-xl"
                style={{ transform: 'scaleX(-1)' }}
              />
            ) : (
              <Image
                src={profileImage || "/user-avatar.png"}
                alt="User"
                width={48}
                height={48}
                className="rounded-full object-cover"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col w-full h-screen overflow-hidden">
      {/* Top Card Bar - Compact */}
      <div className="flex gap-4 justify-center items-center px-4 py-2 shrink-0">
        {renderSmallCard("ai", true, viewMode === "ai")}
        {renderSmallCard("user", false, viewMode === "user")}
        {/* CODE Button - Same line as small cards */}
        {mainViewMode !== "code" && (
          <button 
            onClick={() => setMainViewMode("code")}
            className="ml-6 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 border-2 border-orange-400 rounded-lg text-white text-xs font-mono font-bold transition-all duration-200 shadow-lg shadow-orange-500/40"
          >
            &lt;CODE/&gt;
          </button>
        )}
      </div>

      {/* Main Display Area */}
      <div className="relative w-full flex-1 px-4 pb-1 pt-2 min-h-0">
        {mainViewMode === "code" ? (
          // Code Editor View
          <div className="flex justify-center h-full">
            <div className="w-full max-w-3xl h-full">
              <CodeEditor 
                onClose={() => setMainViewMode("interview")} 
                onShareWithAI={handleShareCodeWithAI}
              />
            </div>
          </div>
        ) : (
          // Interview View
          <>
            {/* User Speaking - Voice Modulation at top center of screen - 10x Bigger */}
            {isUserSpeaking && (
              <div className="absolute top-8 left-1/2 -translate-x-1/2 z-30 flex items-center justify-center pointer-events-none">
                <div className="relative flex items-center justify-center w-96 h-96">
                  {/* Core glow */}
                  <div className="absolute w-24 h-24 rounded-full bg-gradient-to-r from-green-400/50 via-emerald-500/50 to-teal-500/50 blur-2xl animate-pulse" />
                  {/* Inner neon ring */}
                  <div className="absolute w-40 h-40 rounded-full border-4 border-green-400/80 shadow-[0_0_50px_rgba(74,222,128,0.8)] animate-[spin_3s_linear_infinite]" />
                  <div className="absolute w-40 h-40 rounded-full border-2 border-emerald-500/60 shadow-[0_0_60px_rgba(16,185,129,0.7)] animate-[spin_3s_linear_infinite_reverse]" />
                  {/* Middle neon rings */}
                  <div className="absolute w-56 h-56 rounded-full border-4 border-emerald-500/50 shadow-[0_0_70px_rgba(16,185,129,0.6)] animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]" />
                  <div className="absolute w-72 h-72 rounded-full border-2 border-teal-500/40 shadow-[0_0_80px_rgba(20,184,166,0.5)] animate-[pulse_1.5s_ease-in-out_infinite]" />
                  {/* Outer neon ring */}
                  <div className="absolute w-96 h-96 rounded-full border-2 border-green-400/30 shadow-[0_0_100px_rgba(74,222,128,0.4)] animate-[spin_8s_linear_infinite]" />
                </div>
              </div>
            )}
            {viewMode === "ai" && (
              <div className="flex justify-center h-full">
                <div className="card-border w-full max-w-3xl h-full">
                  <div className="card-content h-full relative overflow-hidden flex items-center justify-center">
                    {/* New AI Voice Visualizer with adaptive theme */}
                    <AIVoiceVisualizer
                      isSpeaking={isSpeaking}
                      isListening={isUserSpeaking}
                    />
                  </div>
                </div>
              </div>
            )}

            {viewMode === "user" && (
              <div className="flex justify-center h-full">
                <div className="card-border w-full max-w-3xl h-full">
                  <div className="card-content h-full relative overflow-hidden">
                    {stream ? (
                      <video
                        key="main-video"
                        ref={(el) => {
                          if (el) {
                            el.srcObject = stream;
                          }
                        }}
                        autoPlay
                        playsInline
                        muted
                        className="absolute inset-0 w-full h-full object-cover rounded-2xl"
                        style={{ transform: 'scaleX(-1)' }}
                      />
                    ) : (
                      <Image
                        src={profileImage || "/user-avatar.png"}
                        alt={userName}
                        width={200}
                        height={200}
                        className="rounded-full object-cover size-[200px]"
                      />
                    )}
                    <h3 className="relative z-10 mt-4">{userName}</h3>
                    {cameraError && (
                      <p className="text-xs text-destructive-100 mt-2 relative z-10">{cameraError}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {messages.length > 0 && (
        <div className="transcript-border relative shrink-0 my-1 mx-6 py-2 px-4 max-h-16 overflow-hidden">
          {/* Circle indicator at top center of transcript box */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
            <div className={`w-2 h-2 rounded-full transition-all duration-300 ${isUserSpeaking ? 'bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.8)] animate-pulse' : isSpeaking ? 'bg-primary-200 shadow-[0_0_10px_rgba(202,197,254,0.8)]' : 'bg-dark-200'}`} />
          </div>
          {/* User Speaking - Voice Modulation at Right Side of Transcript (Medium Size) */}
          {isUserSpeaking && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center pointer-events-none">
              <div className="relative flex items-center justify-center w-8 h-8">
                {/* Core glow */}
                <div className="absolute w-5 h-5 rounded-full bg-gradient-to-r from-cyan-400/60 via-blue-500/60 to-purple-500/60 blur-lg animate-pulse" />
                {/* Inner neon ring */}
                <div className="absolute w-6 h-6 rounded-full border-2 border-cyan-400/80 shadow-[0_0_20px_rgba(34,211,238,0.8)] animate-[spin_2s_linear_infinite]" />
                <div className="absolute w-6 h-6 rounded-full border border-blue-500/60 shadow-[0_0_25px_rgba(59,130,246,0.7)] animate-[spin_2s_linear_infinite_reverse]" />
                {/* Middle ring */}
                <div className="absolute w-8 h-8 rounded-full border-2 border-blue-500/40 shadow-[0_0_30px_rgba(59,130,246,0.5)] animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite]" />
              </div>
            </div>
          )}
          <div className="transcript pr-12 text-sm">
            <p
              key={lastMessage}
              className={cn(
                "transition-opacity duration-500 opacity-0 truncate",
                "animate-fadeIn opacity-100"
              )}
            >
              {lastMessage}
            </p>
          </div>
        </div>
      )}

      <div className="w-full flex justify-center shrink-0 py-2 pb-4 gap-4">
        {callStatus !== "ACTIVE" ? (
          <button 
            className="relative btn-call flex items-center justify-center gap-2 h-10 px-6" 
            onClick={() => handleCall()}
            disabled={callStatus === "CONNECTING"}
          >
            {callStatus === "CONNECTING" ? (
              <>
                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span className="text-sm">Connecting...</span>
              </>
            ) : (
              <span className="text-sm">Call</span>
            )}
          </button>
        ) : (
          <button 
            className="btn-disconnect flex items-center justify-center gap-2 h-10 px-6" 
            onClick={() => handleDisconnect()}
          >
            <span className="w-2 h-2 rounded-full bg-white/80 animate-pulse" />
            <span className="text-sm">End</span>
          </button>
        )}
        
        {type !== "generate" && (
          <button
            className={cn(
              "flex items-center justify-center gap-2 h-10 px-6 rounded-xl font-medium transition-all duration-300",
              callStatus === CallStatus.FINISHED
                ? "bg-primary-200 text-dark-100 hover:bg-primary-200/80"
                : "bg-dark-300 text-gray-500 cursor-not-allowed"
            )}
            onClick={handleGenerateFeedback}
            disabled={callStatus !== CallStatus.FINISHED || isGeneratingReport}
          >
            {isGeneratingReport ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Analyzing...</span>
              </>
            ) : (
              <span className="text-sm">Generate Report</span>
            )}
          </button>
        )}
      </div>

      {/* Anti-Cheating Warning Modal */}
      {tabWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-dark-200 border-2 border-destructive-100 rounded-2xl p-8 max-w-md mx-4 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive-100/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-destructive-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Warning: Tab Switching Detected!</h3>
            <p className="text-light-100 mb-4">
              You have left the interview tab {cheatingCount} time{cheatingCount > 1 ? 's' : ''}. 
              Please stay on this tab during the interview.
            </p>
            <p className="text-sm text-destructive-100 mb-6">
              Repeated violations may result in automatic termination of the interview.
            </p>
            <button
              onClick={() => setTabWarning(false)}
              className="w-full py-3 bg-primary-200 text-dark-100 font-bold rounded-full hover:bg-primary-200/80 transition-colors"
            >
              I Understand - Return to Interview
            </button>
          </div>
        </div>
      )}

      {/* Report Popup Modal */}
      {showReportPopup && feedbackData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-dark-200 border-2 border-dark-400 rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => {
                setShowReportPopup(false);
                if (type === "generate") router.push("/");
              }}
              className="absolute top-4 right-4 p-2 rounded-full bg-dark-300 hover:bg-dark-400 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h2 className="text-2xl font-bold text-white mb-6">Interview Evaluation Report</h2>
            
            <div className="space-y-6">
              {/* Overall Score */}
              <div className="flex items-center gap-4 bg-dark-300 p-4 rounded-xl">
                <div className="w-16 h-16 rounded-full border-4 border-primary-200 flex items-center justify-center">
                  <span className="text-xl font-bold text-white">{feedbackData.totalScore}</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Overall Readiness Score</h3>
                  <p className="text-gray-400 text-sm">Based on your performance across all evaluated categories.</p>
                </div>
              </div>

              {/* Expert Insights */}
              <div className="bg-dark-300 p-4 rounded-xl">
                <h3 className="text-lg font-semibold text-white mb-2">Expert Insights</h3>
                <p className="text-gray-300 text-sm leading-relaxed">{feedbackData.finalAssessment}</p>
              </div>

              {/* Sentiment Analysis Section */}
              {feedbackData.sentimentAnalysis && (
                <div className="bg-dark-300 p-4 rounded-xl border border-violet-500/20">
                  <h3 className="text-lg font-semibold text-violet-400 mb-3">🧠 Sentiment & Behavioral Analysis</h3>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-sm text-gray-400">Overall Tone:</span>
                    <span className="px-3 py-1 bg-violet-500/20 text-violet-300 text-sm font-semibold rounded-full border border-violet-500/30">
                      {feedbackData.sentimentAnalysis.overallTone || "Neutral"}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    {[
                      { label: "Confidence", value: feedbackData.sentimentAnalysis.confidenceLevel },
                      { label: "Professionalism", value: feedbackData.sentimentAnalysis.professionalism },
                      { label: "Engagement", value: feedbackData.sentimentAnalysis.engagement },
                    ].map((m) => (
                      <div key={m.label} className="text-center">
                        <div className="text-2xl font-black text-violet-400">{m.value || 0}%</div>
                        <div className="text-xs text-gray-500 mt-0.5">{m.label}</div>
                        <div className="h-1 bg-dark-400 rounded-full mt-1 overflow-hidden">
                          <div className="h-full bg-violet-500/70 rounded-full" style={{ width: `${m.value || 0}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  {feedbackData.sentimentAnalysis.behavioralNotes?.length > 0 && (
                    <ul className="space-y-1 mt-2">
                      {feedbackData.sentimentAnalysis.behavioralNotes.map((note: string, i: number) => (
                        <li key={i} className="text-gray-300 text-xs flex items-start gap-2">
                          <span className="text-violet-400 mt-0.5">•</span>
                          <span>{note}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Strengths */}
                <div className="bg-dark-300 p-4 rounded-xl border border-green-500/20">
                  <h3 className="text-lg font-semibold text-green-400 mb-3">Key Strengths</h3>
                  <ul className="space-y-2">
                    {feedbackData.strengths?.map((strength: string, idx: number) => (
                      <li key={idx} className="text-gray-300 text-sm flex items-start gap-2">
                        <span className="text-green-400 mt-0.5">•</span>
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Improvements */}
                <div className="bg-dark-300 p-4 rounded-xl border border-orange-500/20">
                  <h3 className="text-lg font-semibold text-orange-400 mb-3">Areas for Growth</h3>
                  <ul className="space-y-2">
                    {feedbackData.areasForImprovement?.map((improvement: string, idx: number) => (
                      <li key={idx} className="text-gray-300 text-sm flex items-start gap-2">
                        <span className="text-orange-400 mt-0.5">•</span>
                        <span>{improvement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* PDF Export Button */}
              <div className="pt-4 flex justify-end border-t border-dark-400">
                <DownloadReportButton
                  interviewRole={type || "General"}
                  totalScore={feedbackData.totalScore || 0}
                  finalAssessment={feedbackData.finalAssessment || ""}
                  strengths={feedbackData.strengths || []}
                  improvements={feedbackData.areasForImprovement || []}
                  categoryScores={
                    feedbackData.categoryScores
                      ? Array.isArray(feedbackData.categoryScores)
                        ? feedbackData.categoryScores
                        : Object.entries(feedbackData.categoryScores).map(([k, v]) => ({
                            name: k === 'communicationSkills' ? 'Communication Skills' :
                                  k === 'technicalKnowledge' ? 'Technical Knowledge' :
                                  k === 'problemSolving' ? 'Problem Solving' :
                                  k === 'culturalFit' ? 'Cultural Fit' :
                                  k === 'confidenceClarity' ? 'Confidence & Clarity' : k,
                            score: Number(v) || 0,
                            comment: ""
                          }))
                      : []
                  }
                  userName={userName}
                  sentimentAnalysis={feedbackData.sentimentAnalysis || null}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Visually hidden video purely for AI Coach inference to run constantly regardless of ViewMode.
          Chrome strictly throttles/pauses videos with opacity: 0 or size < 3x3 pixels.
          Using w-4 h-4 and opacity: 0.01 bypasses this optimization so the inference loop never gets stuck. */}
      <video ref={coachVideoRef} autoPlay playsInline muted className="absolute w-4 h-4 opacity-[0.01] pointer-events-none -z-10" />

      {/* Mount the AI Coach Panel */}
      <AICoachPanel 
        videoRef={coachVideoRef} 
        sessionId={interviewId}
        participantId={userId}
      />
    </div>
  );
};

export default Agent;
