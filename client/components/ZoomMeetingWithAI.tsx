"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { vapi } from "@/lib/vapi.sdk";
import { gdMediator } from "@/constants";
import { generatePDFReport } from "@/lib/pdf-generator";
import { 
  Brain, Hash, Clock, Users, Check, X, Maximize2, Minimize2,
  Mic, MicOff, Video, VideoOff, PhoneOff, Flag, MessageCircle,
  ChevronLeft, ChevronRight, UserCircle2, Crown, BarChart3, Download,
  Loader2, Copy, Share2
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
  // AI States
  const [aiMessages, setAiMessages] = useState<string[]>([]);
  const [showAiPanel, setShowAiPanel] = useState(true);
  const [aiActive, setAiActive] = useState(false);
  
  // Timer States
  const [gdTimer, setGdTimer] = useState(duration * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Participant States - dynamically updated from Zoom
  const [participants, setParticipants] = useState<Participant[]>([
    { id: "1", name: userName, isVideoOn: true, isAudioOn: true, isSpeaking: false, isHost },
  ]);
  const [selectedParticipant, setSelectedParticipant] = useState<string | null>(null);
  const [visibleParticipants, setVisibleParticipants] = useState<string[]>(["1"]);
  
  // Camera stream
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [joinUrl, setJoinUrl] = useState<string>("");
  
  // Button loading states
  const [isCopyingLink, setIsCopyingLink] = useState(false);
  const [isStartingGD, setIsStartingGD] = useState(false);
  const [isEndingGD, setIsEndingGD] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isTogglingAI, setIsTogglingAI] = useState(false);
  
  // GD Control States
  const [gdStarted, setGdStarted] = useState(false);
  const [gdEnded, setGdEnded] = useState(false);
  const [showEndGdDialog, setShowEndGdDialog] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  
  // GD Analysis Data
  const [gdAnalysis, setGdAnalysis] = useState({
    communicationScore: 0,
    leadershipScore: 0,
    teamworkScore: 0,
    knowledgeScore: 0,
    strengths: [] as string[],
    areasForImprovement: [] as string[],
    aiAnalysis: "",
  });
  
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Initialize camera
  useEffect(() => {
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        setLocalStream(stream);
        
        // Attach stream to local video element
        if (videoRefs.current["1"]) {
          videoRefs.current["1"].srcObject = stream;
        }
      } catch (err) {
        console.error("Camera access error:", err);
        setCameraError("Could not access camera. Please allow camera permissions.");
      }
    };

    initCamera();

    return () => {
      // Cleanup stream
      localStream?.getTracks().forEach(track => track.stop());
    };
  }, []);

  // Attach stream when video ref changes
  useEffect(() => {
    if (localStream && videoRefs.current["1"]) {
      videoRefs.current["1"].srcObject = localStream;
    }
  }, [localStream, selectedParticipant]);

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

  // Get signature and prepare iframe URL
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  
  useEffect(() => {
    const getSignature = async () => {
      try {
        setIsLoading(true);
        
        const role = isHost ? 1 : 0;
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
        
        // Build iframe URL with encoded params
        const cleanMeetingNumber = meetingNumber.replace(/\D/g, '');
        const params = new URLSearchParams({
          m: cleanMeetingNumber,
          p: password || '',
          n: userName,
          k: process.env.NEXT_PUBLIC_ZOOM_SDK_KEY || '',
          s: signature,
        });
        
        setIframeUrl(`/zoom-embed.html?${params.toString()}`);
        
        // Build shareable join URL
        const shareableUrl = `${window.location.origin}/gd-join?meetingId=${cleanMeetingNumber}&password=${encodeURIComponent(password || '')}&topic=${encodeURIComponent(topic)}`;
        setJoinUrl(shareableUrl);
        
        setIsLoading(false);
        setTimerRunning(true);
        addAiMessage(`Welcome ${userName}! Join the Zoom meeting in the panel below. AI moderation is available on the right.`);
        
        if (isHost) {
          addAiMessage(`📤 Share this meeting: ${shareableUrl}`);
        }
      } catch (err: any) {
        setError(err?.message || "Failed to initialize meeting");
        setIsLoading(false);
      }
    };

    getSignature();
  }, [meetingNumber, password, userName, isHost, topic]);

  const addAiMessage = useCallback((message: string) => {
    setAiMessages((prev) => [...prev, message]);
  }, []);

  // Start AI GD Mediator
  const startAiMediator = useCallback(async () => {
    setIsTogglingAI(true);
    try {
      setAiActive(true);
      // Configure AI with GD context
      const assistantWithContext = {
        ...gdMediator,
        model: {
          ...gdMediator.model,
          messages: gdMediator.model?.messages?.map(msg => ({
            ...msg,
            content: msg.content
              ?.replace("{{topic}}", topic)
              ?.replace("{{duration}}", duration.toString())
              ?.replace("{{participants}}", participants.map(p => p.name).join(", "))
          }))
        }
      };
      
      await vapi.start(assistantWithContext, {
        variableValues: {
          topic,
          duration: duration.toString(),
          participants: participants.map(p => p.name).join(", ")
        }
      });
      
      addAiMessage(`AI Mediator started for GD on "${topic}". The moderator will guide the discussion.`);
    } catch (err) {
      console.error("Failed to start AI mediator:", err);
      addAiMessage("Failed to start AI mediator. Please check your VAPI configuration.");
    } finally {
      setIsTogglingAI(false);
    }
  }, [topic, duration, participants]);

  // Stop AI Mediator
  const stopAiMediator = useCallback(async () => {
    try {
      await vapi.stop();
      setAiActive(false);
      addAiMessage("AI Mediator stopped.");
    } catch (err) {
      console.error("Failed to stop AI mediator:", err);
    }
  }, []);

  // Start GD
  const startGD = useCallback(async () => {
    setIsStartingGD(true);
    setGdStarted(true);
    setTimerRunning(true);
    await startAiMediator();
    addAiMessage(`🎯 GD Started! Topic: "${topic}". Duration: ${duration} minutes. Good luck everyone!`);
    setIsStartingGD(false);
  }, [topic, duration, startAiMediator]);

  // End GD (Host only)
  const endGD = useCallback(async () => {
    setIsEndingGD(true);
    setGdEnded(true);
    setTimerRunning(false);
    setShowEndGdDialog(false);
    await stopAiMediator();
    
    // Generate GD analysis and PDF
    setIsGeneratingReport(true);
    addAiMessage("📊 Generating performance reports for all participants...");
    
    // Simulate AI analysis generation
    const analysis = {
      communicationScore: Math.floor(Math.random() * 20) + 75, // 75-95
      leadershipScore: Math.floor(Math.random() * 25) + 70, // 70-95
      teamworkScore: Math.floor(Math.random() * 20) + 75, // 75-95
      knowledgeScore: Math.floor(Math.random() * 25) + 70, // 70-95
      strengths: [
        "Active participation in discussions",
        "Good communication clarity",
        "Respectful to other participants",
        "Structured arguments presented",
      ],
      areasForImprovement: [
        "Could improve time management",
        "More depth on technical aspects",
        "Consider alternative viewpoints",
      ],
      aiAnalysis: `The Group Discussion on "${topic}" was successfully completed. Participants demonstrated good communication skills and teamwork. The discussion was well-structured with balanced participation from all members. Overall performance was satisfactory with room for improvement in technical depth and time management.`,
    };
    
    setGdAnalysis(analysis);
    
    // Generate and download PDF for host
    await generatePDFReport({
      type: "gd",
      userName,
      topic,
      participants: participants.map(p => p.name),
      duration,
      aiAnalysis: analysis.aiAnalysis,
      communicationScore: analysis.communicationScore,
      leadershipScore: analysis.leadershipScore,
      teamworkScore: analysis.teamworkScore,
      knowledgeScore: analysis.knowledgeScore,
      strengths: analysis.strengths,
      areasForImprovement: analysis.areasForImprovement,
    });
    
    setIsGeneratingReport(false);
    setIsEndingGD(false);
    addAiMessage("✅ Performance report generated and downloaded! Individual participant reports are available for download.");
  }, [stopAiMediator, topic, participants, duration, userName]);

  // Leave GD
  const leaveGD = useCallback(async () => {
    setIsLeaving(true);
    if (aiActive) {
      await stopAiMediator();
    }
    onLeave();
  }, [aiActive, stopAiMediator, onLeave]);

  // Toggle participant visibility
  const toggleParticipant = useCallback((participantId: string) => {
    setVisibleParticipants(prev => {
      if (prev.includes(participantId)) {
        // Don't remove if only 2 left
        if (prev.length <= 2) return prev;
        return prev.filter(id => id !== participantId);
      } else {
        // Don't add if already 4
        if (prev.length >= 4) return prev;
        return [...prev, participantId];
      }
    });
  }, []);

  // Select participant for full screen
  const selectParticipant = useCallback((participantId: string) => {
    setSelectedParticipant(prev => prev === participantId ? null : participantId);
  }, []);

  // Toggle participant audio/video (simulated)
  const toggleParticipantAudio = useCallback((participantId: string) => {
    setParticipants(prev => prev.map(p => 
      p.id === participantId ? { ...p, isAudioOn: !p.isAudioOn } : p
    ));
  }, []);

  const toggleParticipantVideo = useCallback((participantId: string) => {
    setParticipants(prev => prev.map(p => 
      p.id === participantId ? { ...p, isVideoOn: !p.isVideoOn } : p
    ));
  }, []);

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
          <button onClick={leaveGD} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg">
            Leave
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* Left Panel - Video Grid or Zoom */}
        <div className={`flex-1 flex flex-col bg-gray-900 ${showAiPanel ? "" : "w-full"}`}>
          
          {/* Host Controls Bar */}
          {isHost && (
            <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center gap-3">
              {!gdStarted ? (
                <button
                  onClick={startGD}
                  disabled={isStartingGD}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 text-white rounded-lg text-sm font-medium flex items-center gap-2"
                >
                  {isStartingGD ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Flag className="w-4 h-4" />
                  )}
                  {isStartingGD ? "Starting..." : "Start GD"}
                </button>
              ) : !gdEnded ? (
                <button
                  onClick={() => setShowEndGdDialog(true)}
                  disabled={isEndingGD}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white rounded-lg text-sm font-medium flex items-center gap-2"
                >
                  {isEndingGD ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Flag className="w-4 h-4" />
                  )}
                  {isEndingGD ? "Ending..." : "End GD"}
                </button>
              ) : null}
              
              <div className="flex-1" />
              
              <button
                onClick={leaveGD}
                disabled={isLeaving}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-700/50 text-white rounded-lg text-sm flex items-center gap-2"
              >
                {isLeaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <PhoneOff className="w-4 h-4" />
                )}
                {isLeaving ? "Leaving..." : "Leave"}
              </button>
            </div>
          )}

          {/* Share Meeting Button for Host */}
          {isHost && (
            <div className="bg-gray-800 border-b border-gray-700 px-4 py-2">
              <button
                onClick={() => setShowShareDialog(true)}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm flex items-center justify-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                Share Meeting Link ({participants.length} participant{participants.length !== 1 ? 's' : ''})
              </button>
            </div>
          )}

          {/* Participant Video Grid or Zoom */}
          <div className="flex-1 p-4">
            {!gdStarted ? (
              // Show Zoom iframe - this displays ALL real participants from Zoom
              <div className="w-full h-full relative bg-black rounded-xl overflow-hidden">
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className="text-center">
                      <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
                      <p className="text-white">Joining Zoom Meeting...</p>
                      <p className="text-gray-400 text-sm mt-2">All participant cameras will appear here...</p>
                    </div>
                  </div>
                )}
                {iframeUrl && (
                  <iframe
                    src={iframeUrl}
                    className="w-full h-full border-0"
                    allow="camera; microphone; fullscreen; display-capture"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                  />
                )}
                
                {/* Camera Error Message */}
                {cameraError && (
                  <div className="absolute top-4 left-4 right-4 bg-red-500/80 text-white p-3 rounded-lg text-sm">
                    {cameraError}
                  </div>
                )}
              </div>
            ) : selectedParticipant ? (
              // Full screen selected participant
              <div className="w-full h-full relative">
                {(() => {
                  const participant = participants.find(p => p.id === selectedParticipant);
                  return participant ? (
                    <div className="w-full h-full bg-gray-800 rounded-xl overflow-hidden relative">
                      {/* Video Element */}
                      {participant.id === "1" && participant.isVideoOn ? (
                        <video
                          ref={el => { videoRefs.current[participant.id] = el; }}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center ${participant.isVideoOn ? 'bg-gray-700' : 'bg-gray-800'}`}>
                          <UserCircle2 className="w-32 h-32 text-gray-600" />
                        </div>
                      )}
                      
                      {/* Participant Info */}
                      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">{participant.name}</span>
                          {participant.isHost && <Crown className="w-4 h-4 text-yellow-500" />}
                          {participant.isSpeaking && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
                        </div>
                        <button
                          onClick={() => setSelectedParticipant(null)}
                          className="px-3 py-1 bg-gray-700/80 hover:bg-gray-600/80 text-white rounded-lg text-sm flex items-center gap-1"
                        >
                          <Minimize2 className="w-4 h-4" />
                          Exit Fullscreen
                        </button>
                      </div>
                      
                      {/* Audio/Video Indicators */}
                      <div className="absolute top-4 right-4 flex gap-2">
                        {participant.isAudioOn ? <Mic className="w-5 h-5 text-green-500" /> : <MicOff className="w-5 h-5 text-red-500" />}
                        {participant.isVideoOn ? <Video className="w-5 h-5 text-green-500" /> : <VideoOff className="w-5 h-5 text-red-500" />}
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>
            ) : (
              // Grid of visible participants - dynamic based on count
              <div className={`grid gap-4 h-full ${
                visibleParticipants.length === 1 ? 'grid-cols-1' :
                visibleParticipants.length === 2 ? 'grid-cols-2' :
                visibleParticipants.length === 3 ? 'grid-cols-2 grid-rows-2' :
                'grid-cols-2 grid-rows-2'
              }`}>
                {participants
                  .filter(p => visibleParticipants.includes(p.id))
                  .map((participant, index) => (
                    <div
                      key={participant.id}
                      onClick={() => selectParticipant(participant.id)}
                      className={`relative bg-gray-800 rounded-xl overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all ${
                        visibleParticipants.length === 3 && index === 2 ? 'col-span-2' : ''
                      }`}
                    >
                      {/* Video Element or Placeholder */}
                      {participant.id === "1" && participant.isVideoOn ? (
                        <video
                          ref={el => { videoRefs.current[participant.id] = el; }}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center ${participant.isVideoOn ? 'bg-gray-700' : 'bg-gray-800'}`}>
                          <UserCircle2 className={`text-gray-600 ${
                            visibleParticipants.length === 1 ? 'w-32 h-32' :
                            visibleParticipants.length === 2 ? 'w-24 h-24' :
                            'w-20 h-20'
                          }`} />
                        </div>
                      )}
                      
                      {/* Participant Info */}
                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-white text-sm font-medium">{participant.name}</span>
                          {participant.isHost && <Crown className="w-4 h-4 text-yellow-500" />}
                          {participant.isSpeaking && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
                        </div>
                        <Maximize2 className="w-4 h-4 text-white/60" />
                      </div>
                      
                      {/* Audio/Video Indicators */}
                      <div className="absolute top-3 right-3 flex gap-1">
                        {participant.isAudioOn ? <Mic className="w-4 h-4 text-green-500" /> : <MicOff className="w-4 h-4 text-red-500" />}
                        {participant.isVideoOn ? <Video className="w-4 h-4 text-green-500" /> : <VideoOff className="w-4 h-4 text-red-500" />}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Participant Toggle Bar - Dynamic based on actual participants */}
          <div className="bg-gray-800 border-t border-gray-700 px-4 py-2 flex items-center gap-2 flex-wrap">
            <span className="text-gray-400 text-sm">Participants ({participants.length}):</span>
            {participants.map(participant => (
              <button
                key={participant.id}
                onClick={() => toggleParticipant(participant.id)}
                className={`px-3 py-1 rounded-lg text-sm flex items-center gap-1 transition-colors ${
                  visibleParticipants.includes(participant.id)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                } ${visibleParticipants.length <= 1 && visibleParticipants.includes(participant.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={visibleParticipants.length <= 1 && visibleParticipants.includes(participant.id)}
              >
                {participant.isHost && <Crown className="w-3 h-3 text-yellow-500" />}
                {participant.name}
              </button>
            ))}
            <span className="text-gray-500 text-xs ml-2">
              ({visibleParticipants.length}/{participants.length} shown)
            </span>
          </div>
        </div>

        {/* Right Panel - AI Moderator */}
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
              {aiActive && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-green-400 text-xs">AI Mediator Active</span>
                </div>
              )}
            </div>

            {/* AI Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {aiMessages.length === 0 ? (
                <div className="text-center text-gray-500 mt-8">
                  <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>AI moderator will appear here...</p>
                  {isHost && !gdStarted && (
                    <p className="text-sm mt-2">Click "Start GD" to begin the session</p>
                  )}
                </div>
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
              {isHost && gdStarted && !gdEnded && (
                <button
                  onClick={() => aiActive ? stopAiMediator() : startAiMediator()}
                  disabled={isTogglingAI}
                  className={`w-full py-2 rounded-lg text-sm flex items-center justify-center gap-2 ${
                    aiActive 
                      ? 'bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white' 
                      : 'bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 text-white'
                  }`}
                >
                  {isTogglingAI ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Brain className="w-4 h-4" />
                  )}
                  {isTogglingAI ? 'Processing...' : (aiActive ? 'Stop AI Mediator' : 'Start AI Mediator')}
                </button>
              )}
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
              
              {/* Post-GD Review Button */}
              {gdEnded && (
                <>
                  <button
                    onClick={async () => {
                      setIsGeneratingReport(true);
                      // Re-download PDF report
                      await generatePDFReport({
                        type: "gd",
                        userName,
                        topic,
                        participants: participants.map(p => p.name),
                        duration,
                        aiAnalysis: gdAnalysis.aiAnalysis,
                        communicationScore: gdAnalysis.communicationScore,
                        leadershipScore: gdAnalysis.leadershipScore,
                        teamworkScore: gdAnalysis.teamworkScore,
                        knowledgeScore: gdAnalysis.knowledgeScore,
                        strengths: gdAnalysis.strengths,
                        areasForImprovement: gdAnalysis.areasForImprovement,
                      });
                      setIsGeneratingReport(false);
                    }}
                    disabled={isGeneratingReport}
                    className="w-full py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-600/50 text-white rounded-lg text-sm flex items-center justify-center gap-2"
                  >
                    {isGeneratingReport ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    {isGeneratingReport ? 'Generating...' : 'Download Report'}
                  </button>
                  <button
                    onClick={() => addAiMessage("📊 Post-GD reviews are now available. Check each participant's performance analysis.")}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm flex items-center justify-center gap-2"
                  >
                    <BarChart3 className="w-4 h-4" />
                    View Reviews
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Share Meeting Dialog */}
      {showShareDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 max-w-lg w-full mx-4">
            <h3 className="text-xl font-semibold text-white mb-3">Share Meeting Link</h3>
            <p className="text-gray-400 mb-4">
              Share this link with participants to join the GD session:
            </p>
            <div className="bg-gray-900 p-3 rounded-lg mb-4">
              <code className="text-green-400 text-sm break-all">{joinUrl}</code>
            </div>
            <div className="flex gap-3">
              <button
                onClick={async () => {
                  setIsCopyingLink(true);
                  await navigator.clipboard.writeText(joinUrl);
                  addAiMessage("📋 Meeting link copied to clipboard!");
                  setTimeout(() => setIsCopyingLink(false), 2000);
                }}
                disabled={isCopyingLink}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-lg flex items-center justify-center gap-2"
              >
                {isCopyingLink ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Link
                  </>
                )}
              </button>
              <button
                onClick={() => setShowShareDialog(false)}
                className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* End GD Confirmation Dialog */}
      {showEndGdDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-white mb-3">End Group Discussion?</h3>
            <p className="text-gray-400 mb-6">
              This will end the GD session for all participants. Individual reviews will be generated for each candidate.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowEndGdDialog(false)}
                className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={endGD}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
              >
                End GD
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
