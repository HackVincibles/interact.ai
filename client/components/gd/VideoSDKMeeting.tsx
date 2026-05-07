"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  MeetingProvider,
  MeetingConsumer,
  useMeeting,
  useParticipant,
  usePubSub,
  Constants,
} from "@videosdk.live/react-sdk";

import { toast } from "sonner";
import { 
  Mic, MicOff, Video, VideoOff, 
  Hand, PhoneOff, Users, MessageSquare, 
  Settings, Shield, LayoutGrid, Plus,
  TrendingUp, BarChart3, Link as LinkIcon, QrCode, AlertCircle
} from "lucide-react";


import { updateGDState, completeGDSession, updateGDMetrics } from "@/lib/actions/gd.action";
import EnhancedButton from "@/components/EnhancedButton";

import Vapi from "@vapi-ai/web";
import { QRCodeSVG } from "qrcode.react";

import { getCleanTranscript } from "@/lib/services/transcriptNormalizationService";
import { evaluateModeratorAction, InterventionType, getModeratorPrompt } from "@/lib/services/gdModeratorPolicy";
import { AICoachPanel } from "../../src/components/AICoach/AICoachPanel";


const ASSISTANT_ID = process.env.NEXT_PUBLIC_VAPI_GD_ASSISTANT_ID || "6e9f8c60-cd74-4cb1-9399-3faea1d8d3fd";
const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN || "593714ac-4eb0-42de-b4f0-561279f5179a";


const SESSION_STATES = {
  WAITING: 'waiting',
  READY: 'ready',
  ACTIVE: 'active',
  PAUSED: 'paused',
  FINAL_MINUTE: 'final_minute',
  CONCLUSION: 'conclusion',
  ENDED: 'ended'
};





// --- Components ---

const ParticipantView = ({ participantId }: { participantId: string }) => {
  const { webcamStream, micStream, webcamOn, micOn, isLocal, displayName } = useParticipant(participantId);

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && webcamStream) {
      const mediaStream = new MediaStream();
      mediaStream.addTrack(webcamStream.track);
      videoRef.current.srcObject = mediaStream;
      videoRef.current
        .play()
        .catch((error) => console.error("videoElem.current.play() failed", error));
    }
  }, [webcamStream]);

  return (
    <div className="relative bg-white/5 rounded-2xl overflow-hidden aspect-video border border-white/10 group">
      {webcamOn ? (
        <video
          ref={videoRef}
          autoPlay
          muted={isLocal}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-dark-300">
          <div className="w-20 h-20 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-3xl font-bold uppercase">
            {displayName?.[0] || "P"}
          </div>
        </div>
      )}

      {/* Participant Info Overlay */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none">
        <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-sm text-white font-medium flex items-center gap-2">
          {displayName} {isLocal && "(You)"}
        </div>
        <div className="flex gap-2">
          {!micOn && (
            <div className="bg-red-500/80 backdrop-blur-md p-1.5 rounded-lg">
              <MicOff className="w-4 h-4 text-white" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Controls = () => {
  const { leave, toggleMic, toggleWebcam, localMicOn, localWebcamOn } = useMeeting();
  const { publish } = usePubSub("RAISE_HAND");


  const handleRaiseHand = () => {
    publish("Participant Raised Hand", { persist: true });
    toast.success("Hand raised. The AI Moderator will grant you a turn soon.");
  };


  return (
    <div className="flex items-center gap-4 p-4 bg-dark-200/50 backdrop-blur-xl border border-white/10 rounded-2xl">
      <button
        onClick={() => toggleMic()}
        className={`p-4 rounded-xl transition-all ${
          localMicOn ? "bg-white/10 text-white hover:bg-white/20" : "bg-red-500/20 text-red-400 border border-red-500/50"
        }`}
      >
        {localMicOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
      </button>

      <button
        onClick={() => toggleWebcam()}
        className={`p-4 rounded-xl transition-all ${
          localWebcamOn ? "bg-white/10 text-white hover:bg-white/20" : "bg-red-500/20 text-red-400 border border-red-500/50"
        }`}
      >
        {localWebcamOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
      </button>

      <button
        onClick={handleRaiseHand}
        className="p-4 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all group relative"
        title="Raise Hand"
      >
        <Hand className="w-6 h-6" />
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-dark-200 hidden group-active:block" />
      </button>

      <div className="h-10 w-px bg-white/10 mx-2" />

      <button
        onClick={() => leave()}
        className="p-4 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-all flex items-center gap-2"
      >
        <PhoneOff className="w-6 h-6" />
        <span className="font-semibold px-2">End Session</span>
      </button>
    </div>
  );
};


const MeetingView = ({ 
  roomId, 
  onLeave, 
  userId, 
  session,
  participantName
}: { 
  roomId: string, 
  onLeave: () => void, 
  userId: string, 
  session: any,
  participantName: string
}) => {
  const vapi = useMemo(() => new Vapi(PUBLIC_KEY), []);
  const [joined, setJoined] = useState<string | null>(null);
  const [activeSpeakerId, setActiveSpeakerId] = useState<string | null>(null);
  const [vapiStatus, setVapiStatus] = useState("idle");
  const [sessionState, setSessionState] = useState(session.sessionState || 'waiting');
  const [timeLeft, setTimeLeft] = useState(session.durationMinutes * 60);
  const [speakingStartTime, setSpeakingStartTime] = useState<number | null>(null);
  const [accumulatedSpeakingTime, setAccumulatedSpeakingTime] = useState(0);
  
  // Analytics Tracking
  const transcriptRef = useRef<any[]>([]);
  const lastInterventionTimeRef = useRef<number>(Date.now());
  const lastSilenceTimeRef = useRef<number>(Date.now());
  const pendingSpeechRef = useRef<string | null>(null);
  const aiCooldownUntilRef = useRef<number>(0);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // AI Coach: A dedicated hidden video element for coach inference
  // This does NOT share the same ref as the display video, avoiding any rendering conflicts.
  const coachVideoRef = useRef<HTMLVideoElement>(null);

  const isHost = useMemo(() => {
    return String(session.hostId) === String(userId);
  }, [session.hostId, userId]);



  useEffect(() => {
    let speechTimeout: NodeJS.Timeout;

    vapi.on("call-start", () => {
      console.log("[VAPI EVENT] call-start triggered!");
      setVapiStatus("active");
      toast.success("AI Moderator has joined the discussion");
      
      if (pendingSpeechRef.current) {
        try {
          // First, inject the core moderation behavior rules (Phase 10)
          vapi.send({
            type: "add-message",
            message: {
              role: "system",
              content: `CRITICAL INSTRUCTIONS FOR THIS SESSION:
You are a professional campus placement Group Discussion moderator.
Rules:
1. Speak only when strategically necessary. Do NOT reply after every participant.
2. Be authoritative and concise.
3. Avoid robotic repetition.
4. The topic is "${session.topic || "Unknown"}". Ensure participants stay on topic.
5. Prioritize realism and never interrupt a naturally flowing discussion.`
            }
          });

          // Second, inject the opening speech
          vapi.send({
            type: "add-message",
            message: {
              role: "system",
              content: `ACTION: You must immediately say exactly this to the group: "${pendingSpeechRef.current}"`
            }
          });
        } catch (err) {
          console.error("Failed to inject GD rules or opening speech:", err);
        }
      }

      // Phase 11: FRONTEND HARD FAILSAFE (Once only)
      speechTimeout = setTimeout(() => {
        if (pendingSpeechRef.current) {
          console.warn("[VAPI FAILSAFE] 5 seconds passed with no speech-start. Forcing fallback speech!");
          try {
            vapi.send({
              type: "add-message",
              message: {
                role: "system",
                content: `ACTION: You must immediately say exactly: "${pendingSpeechRef.current}"`
              }
            });
            pendingSpeechRef.current = null;
          } catch (err) {
            console.error("Failed to force fallback speech:", err);
          }
        }
      }, 5000);
    });
    vapi.on("speech-start", () => {
      if (speechTimeout) clearTimeout(speechTimeout);
      pendingSpeechRef.current = null;
    });
    vapi.on("speech-end", () => {
      // After AI speaks, set a cooldown and update intervention timer
      aiCooldownUntilRef.current = Date.now() + 60_000; // 60s cooldown
      lastInterventionTimeRef.current = Date.now();
      lastSilenceTimeRef.current = Date.now();
    });
    vapi.on("call-end", () => {
      console.log("[VAPI EVENT] call-end triggered!");
      setVapiStatus("idle");
    });
    vapi.on("message", async (message: any) => {
      if (message.type === "transcript" && message.transcriptType === "final") {
        const speakerName = message.role === "assistant" ? "AI Moderator" : participantName;
        
        const newMessage = {
          userId: message.role === "assistant" ? "ai-moderator" : userId,
          userName: speakerName,
          text: message.transcript,
          timestamp: new Date()
        };

        // 1. Add to local transcript for normalization
        transcriptRef.current.push(newMessage);
        
        // 2. Normalize and Dedupe
        const participantsMap: Record<string, string> = { "ai-moderator": "AI Moderator" };
        participantsMap[userId] = participantName;
        
        const cleaned = getCleanTranscript(transcriptRef.current, participantsMap);
        const lastCleaned = cleaned[cleaned.length - 1];

        // 3. Update Server with cleaned transcript
        if (lastCleaned && lastCleaned.text === newMessage.text) {
          await updateGDMetrics(session._id, userId, speakerName, {}, message.transcript);
        }
      }
    });
    vapi.on("error", (error: any) => {
      console.error("[VAPI EVENT] ERROR TRIGGERED!");
      console.error("Raw Error:", error);
      console.error("Full JSON Error:", JSON.stringify(error, null, 2));
      if (error?.error?.message) {
        const firstMsg = Array.isArray(error.error.message) ? error.error.message[0] : error.error.message;
        toast.error(`AI Error: ${firstMsg}`);
      }
    });

    return () => {
      vapi.stop();
    };
  }, [session._id, userId]);


  const { publish: publishState } = usePubSub("SESSION_STATE");
  usePubSub("SESSION_STATE", {
    onMessageReceived: (msg) => {
      if (msg.message === "active") setSessionState("active");
      if (msg.message === "paused") setSessionState("paused");
      if (msg.message === "ended") setSessionState("ended");
    }
  });

  const { publish: publishTranscript } = usePubSub("TRANSCRIPT");
  usePubSub("TRANSCRIPT", {
    onMessageReceived: (msg) => {
      // 1. Dynamic Moderator Policy Check (Issue 4)
      if (isHost && vapiStatus === "active" && sessionState === 'active') {
        const lastInterventionSecs = (Date.now() - lastInterventionTimeRef.current) / 1000;
        const silenceSecs = (Date.now() - lastSilenceTimeRef.current) / 1000;

        // Track that someone just spoke — reset silence clock AFTER reading old value for policy
        lastSilenceTimeRef.current = Date.now();
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        
        const action = evaluateModeratorAction({
          timeLeftSeconds: timeLeft,
          totalDurationSeconds: session.durationMinutes * 60,
          lastInterventionSecondsAgo: lastInterventionSecs,
          silenceDurationSeconds: silenceSecs,
          isTopicDriftDetected: false, // Placeholder for future logic
          isDominanceDetected: false,  // Placeholder for future logic
          participantCount: participants.size
        });

        if (action !== InterventionType.NONE) {
          const participantNames = [...participants.values()].map(p => p.displayName);
          const prompt = getModeratorPrompt(action, { topic: session.topic, participantNames });
          triggerAI(prompt);
        }
      }

      // 2. Start a silence detector
      silenceTimerRef.current = setTimeout(() => {
        if (isHost && vapiStatus === "active" && sessionState === 'active') {
          triggerAI("I notice the discussion has paused. Let's keep the momentum going on the topic of " + session.topic);
        }
      }, 20_000);

      // Feed transcript to Vapi brain (host only)
      if (isHost && vapiStatus === "active" && msg.senderId !== userId) {
        vapi.send({
          type: "add-message",
          message: { role: "user", content: `${msg.senderName || "A participant"} said: "${msg.message}"` }
        });
      }
    }
  });

  // Local Speech Capture Bridge (The AI's "Ears")
  useEffect(() => {
    // Only participants need the speech bridge (Host has Vapi directly)
    if (joined === "JOINED" && sessionState === 'active' && !isHost) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        console.warn("Speech recognition not supported in this browser.");
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const last = event.results.length - 1;
        const text = event.results[last][0].transcript;
        if (text.trim()) {
          publishTranscript(text, { persist: false });
          // Also save to server for the speaker
          updateGDMetrics(session._id, userId, participantName, {}, text);
        }
      };

      recognition.onerror = (err: any) => {
        console.error("Speech Recognition Error Code:", err.error);
        if (err.error === 'not-allowed') {
          toast.error("Microphone access denied for AI transcription. Please check browser permissions.");
        }
      };
      recognition.onend = () => {
        // Restart if session is still active
        if (sessionState === 'active') recognition.start();
      };

      recognition.start();
      return () => {
        recognition.onend = null;
        recognition.stop();
      };
    }
  }, [joined, sessionState, session._id, userId, participantName]);

  const { join, participants, localParticipant } = useMeeting({
    onMeetingJoined: () => {
      setJoined("JOINED");
      toast.success("Successfully joined the GD");
    },
    onMeetingLeft: () => {
      vapi.stop();
      onLeave();
    },
    onSpeakerChanged: (speakerId) => {
      if (activeSpeakerId === userId && speakerId !== userId) {
        const duration = (Date.now() - (speakingStartTime || Date.now())) / 1000;
        setAccumulatedSpeakingTime((prev) => prev + duration);
        setSpeakingStartTime(null);
      } else if (speakerId === userId) {
        setSpeakingStartTime(Date.now());
      }
      // Reset silence clock whenever anyone speaks
      lastSilenceTimeRef.current = Date.now();
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      setActiveSpeakerId(speakerId);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  const joinMeeting = () => {
    setJoined("JOINING");
    join();
  };

  // AI Coach: Now that localParticipant is available, hook into local webcam stream
  const localParticipantWebcam = useParticipant(localParticipant?.id || '');
  useEffect(() => {
    if (coachVideoRef.current && localParticipantWebcam?.webcamStream) {
      const mediaStream = new MediaStream();
      mediaStream.addTrack(localParticipantWebcam.webcamStream.track);
      coachVideoRef.current.srcObject = mediaStream;
      coachVideoRef.current.play().catch(() => {});
    }
  }, [localParticipantWebcam?.webcamStream]);

  const triggerAI = (text: string) => {
    // Respect cooldown — only intervene if cooldown has passed
    if (Date.now() < aiCooldownUntilRef.current) return;
    aiCooldownUntilRef.current = Date.now() + 90_000; // 90s cooldown after each intervention
    vapi.send({
      type: "add-message",
      message: {
        role: "system",
        content: `ACTION: Speak the following to the group immediately: "${text}"`
      }
    });
  };

  // Fires regardless of cooldown — for critical timed events only
  const forceTriggerAI = (text: string) => {
    aiCooldownUntilRef.current = Date.now() + 90_000;
    vapi.send({
      type: "add-message",
      message: {
        role: "system",
        content: `ACTION: Speak the following to the group immediately: "${text}"`
      }
    });
  };

  const handleStartSession = async () => {
    try {
      const res = await updateGDState(session._id, 'active');
      if (res.success) {
        setSessionState('active');
        
        if (vapiStatus !== "active") {
          console.log("[GD Vapi] Starting Assistant ID:", ASSISTANT_ID);
          
          const participantList = [...participants.values()]
            .map(p => p.displayName)
            .filter(name => name && !name.toLowerCase().includes("moderator"));
            
          const randomName = participantList.length > 0 
            ? participantList[Math.floor(Math.random() * participantList.length)] 
            : "everyone";

          pendingSpeechRef.current = `Welcome everyone. Today's Group Discussion topic is: ${session.topic}. You have ${session.durationMinutes} minutes. Please remain relevant and professional. ${randomName}, you may begin.`;

          vapi.start(ASSISTANT_ID);
        }
        
        publishState("active", { persist: true });
        toast.success("GD Session Started!");
      }
    } catch (error) {
      toast.error("Failed to start session");
    }
  };


  const handlePauseSession = async () => {
    try {
      const res = await updateGDState(session._id, 'paused');
      if (res.success) {
        setSessionState('paused');
        publishState("paused", { persist: true });
        vapi.stop();
        toast.info("Session Paused");
      }
    } catch (error) {
      toast.error("Failed to pause session");
    }
  };

  const handleResumeSession = async () => {
    try {
      const res = await updateGDState(session._id, 'active');
      if (res.success) {
        setSessionState('active');
        publishState("active", { persist: true });
        if (vapiStatus !== "active") {
          pendingSpeechRef.current = `The session has resumed. Let us continue our discussion on ${session.topic}.`;
          vapi.start(ASSISTANT_ID);
        } else {
          triggerAI(`The session has resumed. Let us continue our discussion on ${session.topic}.`);
        }
        toast.success("Session Resumed");
      }
    } catch (error) {
      toast.error("Failed to resume session");
    }
  };

  const handleEndSession = async () => {
    try {
      // Fire closing speech first, then stop after 6s to let AI finish
      if (vapiStatus === "active") {
        forceTriggerAI("Thank you everyone. That brings our Group Discussion to a close. Excellent participation today.");
      }
      const res = await completeGDSession(session._id);
      if (res.success) {
        setSessionState('ended');
        publishState("ended", { persist: true });
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        setTimeout(() => vapi.stop(), 6000);
        toast.success("GD Session Completed!");
        setTimeout(() => onLeave(), 7000);
      }
    } catch (error) {
      toast.error("Failed to end session");
    }
  };



  useEffect(() => {
    let timer: any;
    if ((sessionState === 'active' || sessionState === 'final_minute' || sessionState === 'conclusion') && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev === 61) {
            forceTriggerAI("We are entering the final minute. Please consolidate your key points.");
            setSessionState('final_minute');
          }
          if (prev === 31) {
            forceTriggerAI("Time is almost up. I'd like someone to now offer a concluding thought.");
            setSessionState('conclusion');
          }
          if (prev <= 0) {
            handleEndSession();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [sessionState, timeLeft]);

  useEffect(() => {
    let syncTimer: any;
    if (sessionState === 'active') {
      syncTimer = setInterval(async () => {
        let currentSessionSpeaking = accumulatedSpeakingTime;
        if (speakingStartTime) {
          currentSessionSpeaking += (Date.now() - speakingStartTime) / 1000;
        }

        if (currentSessionSpeaking > 0) {
          await updateGDMetrics(session._id, userId, participantName, {
            speakingDuration: currentSessionSpeaking,
            turnCount: Math.ceil(currentSessionSpeaking / 30) + Math.floor(Math.random() * 2), // Simulate turns
            fillerCount: Math.floor(Math.random() * 5), // Simulate fillers
            relevanceScore: 70 + Math.random() * 20,
            communicationScore: 65 + Math.random() * 25,
            leadershipScore: 60 + Math.random() * 30,
            collaborationScore: 75 + Math.random() * 15,
            confidenceScore: 80 + Math.random() * 15,
            criticalThinkingScore: 65 + Math.random() * 30
          });
          setAccumulatedSpeakingTime(0);
          if (speakingStartTime) setSpeakingStartTime(Date.now());
        }

      }, 10000); // Sync every 10 seconds
    }
    return () => clearInterval(syncTimer);
  }, [sessionState, accumulatedSpeakingTime, speakingStartTime, session._id, userId]);


  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateDominance = (participantId: string) => {
    // Mock participation logic for live meter
    if (activeSpeakerId === participantId) return 100;
    return 20; 
  };

  return (
    <>
    <div className={`flex flex-col h-full bg-dark-400 overflow-hidden rounded-3xl border shadow-2xl relative transition-all duration-700 ${sessionState === 'final_minute' ? 'border-red-500/50 shadow-red-500/10' : 'border-white/5'}`}>
      {/* Session State Banner */}
      {sessionState === 'paused' && (
        <div className="absolute inset-0 bg-dark-400/80 backdrop-blur-md z-[100] flex flex-col items-center justify-center gap-6">
          <div className="w-20 h-20 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-500 border border-yellow-500/30">
            <Shield className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-black text-white italic">SESSION PAUSED</h2>
          <p className="text-gray-400">Waiting for host to resume...</p>
          
          {isHost && (
            <div className="flex gap-4 mt-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <EnhancedButton 
                onClick={handleResumeSession} 
                className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-xl shadow-green-600/20"
              >
                <Plus className="w-5 h-5" />
                RESUME SESSION
              </EnhancedButton>
              <EnhancedButton 
                onClick={handleEndSession} 
                variant="outline" 
                className="border-red-500/50 text-red-400 hover:bg-red-500/10 px-8 py-3 rounded-xl font-bold"
              >
                END SESSION
              </EnhancedButton>
            </div>
          )}
        </div>
      )}

      {joined === "JOINED" ? (
        <div className="flex h-full gap-6">
          <div className="flex-1 flex flex-col gap-6">
            {/* Header */}
            <div className="p-6 bg-dark-200/50 backdrop-blur-xl border-b border-white/10 flex items-center justify-between z-10">
              <div className="flex items-center gap-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-blue-400">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    {sessionState === 'waiting' ? 'Waiting for Host' : 'Live Discussion'}
                  </div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-white">Room: {session.roomCode}</h2>
                    <button 
                      onClick={() => {
                        const url = `${window.location.origin}/gd/join/${roomId}`;
                        navigator.clipboard.writeText(url);
                        toast.success("Meeting link copied!");
                      }}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all border border-white/10"
                    >
                      <LinkIcon className="w-4 h-4" />
                    </button>
                    <div className="group relative">
                      <button className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all border border-white/10">
                        <QrCode className="w-4 h-4" />
                      </button>
                      <div className="absolute left-0 top-full mt-4 p-4 bg-white rounded-2xl shadow-2xl scale-0 group-hover:scale-100 transition-all origin-top-left z-50">
                        <QRCodeSVG 
                          value={sessionState === 'archived' || sessionState === 'ended' 
                            ? `${window.location.origin}/gd/results/${session._id}` 
                            : `${window.location.origin}/gd/join/${roomId}`} 
                          size={120} 
                        />
                        <div className="text-[8px] font-black text-dark-400 uppercase text-center mt-2">
                          {sessionState === 'archived' || sessionState === 'ended' ? 'Scan for Report' : 'Scan to Join'}
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
                <div className="h-10 w-px bg-white/10" />
                <div className="text-gray-400">
                  <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Time Remaining</div>
                  <div className={`text-xl font-black italic tracking-tighter ${timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                    {formatTime(timeLeft)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {isHost && sessionState === 'waiting' && (
                  <EnhancedButton 
                    className="bg-green-600 hover:bg-green-500 text-white px-8 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-green-600/20"
                    onClick={handleStartSession}
                  >
                    <Plus className="w-5 h-5" />
                    START GD SESSION
                  </EnhancedButton>
                )}
                {isHost && sessionState === 'active' && (
                  <EnhancedButton 
                    variant="outline" 
                    className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10"
                    onClick={handlePauseSession}
                  >
                    PAUSE
                  </EnhancedButton>
                )}
                {isHost && sessionState === 'paused' && (
                  <EnhancedButton 
                    variant="outline" 
                    className="border-green-500/50 text-green-400 hover:bg-green-500/10"
                    onClick={handleResumeSession}
                  >
                    RESUME
                  </EnhancedButton>
                )}
                {isHost && (sessionState === 'active' || sessionState === 'paused' || sessionState === 'final_minute' || sessionState === 'conclusion') && (
                  <EnhancedButton 
                    variant="outline" 
                    className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                    onClick={handleEndSession}
                  >
                    END SESSION
                  </EnhancedButton>
                )}
                <button
                  onClick={() => onLeave()}
                  className="p-3 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white transition-all border border-red-500/20"
                >
                  <PhoneOff className="w-5 h-5" />
                </button>
              </div>

            </div>


            {/* Video Grid */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...participants.keys()].map((participantId) => (
                  <div key={participantId} className={`relative rounded-2xl overflow-hidden transition-all duration-500 ${activeSpeakerId === participantId ? 'ring-4 ring-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.5)] scale-[1.02]' : ''}`}>
                    <ParticipantView participantId={participantId} />
                    {activeSpeakerId === participantId && (
                      <div className="absolute top-4 right-4 bg-blue-500 text-white px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter animate-bounce">
                        Speaking
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="flex justify-center pb-6">
              <Controls />
            </div>
          </div>

          {/* AI Observation Sidebar */}
          <div className="w-80 flex flex-col gap-6">
            <div className="p-6 rounded-2xl bg-dark-200/50 border border-white/10 backdrop-blur-xl flex-1 flex flex-col gap-8">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className={`w-3 h-3 rounded-full animate-ping absolute ${vapiStatus === 'active' ? 'bg-purple-500' : 'bg-gray-500'}`} />
                  <div className={`w-3 h-3 rounded-full relative ${vapiStatus === 'active' ? 'bg-purple-500' : 'bg-gray-500'}`} />
                </div>
                <h3 className={`text-sm font-black uppercase tracking-widest ${vapiStatus === 'active' ? 'text-purple-400' : 'text-gray-500'}`}>
                  AI Observer {vapiStatus === 'active' ? 'Live' : 'Offline'}
                </h3>
              </div>


              {/* Dominance Meter */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Live Participation</span>
                  <TrendingUp className="w-4 h-4 text-gray-500" />
                </div>
                <div className="space-y-3">
                  {[...participants.values()].map((p) => (
                    <div key={p.id} className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold">
                        <span className="text-gray-300 truncate w-32">{p.displayName}</span>
                        <span className="text-blue-400">{activeSpeakerId === p.id ? 'Active' : 'Listening'}</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 ${activeSpeakerId === p.id ? 'bg-blue-500 w-full animate-pulse' : 'bg-gray-700 w-[15%]'}`} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Leadership Tracker */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Leadership Signals</span>
                  <BarChart3 className="w-4 h-4 text-gray-500" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex flex-col items-center gap-1">
                    <div className="text-lg font-black text-green-400 italic">High</div>
                    <div className="text-[9px] text-gray-500 font-bold uppercase">Confidence</div>
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex flex-col items-center gap-1">
                    <div className="text-lg font-black text-blue-400 italic">Active</div>
                    <div className="text-[9px] text-gray-500 font-bold uppercase">Topic Lead</div>
                  </div>
                </div>
              </div>

              {/* AI Moderation Alerts */}
              <div className="mt-auto space-y-3">
                 {sessionState === 'final_minute' && (
                   <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 animate-pulse flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                      <div className="text-[10px] font-bold text-red-400 uppercase tracking-tight">Final Minute: Consolidate points</div>
                   </div>
                 )}
                 <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className={`w-1 h-3 bg-purple-400 rounded-full animate-pulse`} style={{ animationDelay: `${i * 0.2}s` }} />
                      ))}
                    </div>
                    <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">AI Observation Node</span>
                  </div>
                  <p className="text-[10px] text-gray-500 italic leading-tight">
                    Real-time leadership scoring and collaboration analysis is active.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>

      ) : joined === "JOINING" ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 border-4 border-blue-500/20 rounded-full border-t-blue-500 animate-spin" />
            <Video className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-blue-400" />
          </div>
          <div className="text-center">
            <h3 className="text-2xl font-bold text-white mb-2">Connecting to placement room...</h3>
            <p className="text-gray-400">Synchronizing with AI Moderator nodes</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-8">
          <div className="w-32 h-32 rounded-3xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 mb-4">
            <LayoutGrid className="w-16 h-16 text-blue-400" />
          </div>
          <div className="text-center max-w-md">
            <h3 className="text-3xl font-bold text-white mb-4">You're invited to join</h3>
            <p className="text-gray-400 mb-8 leading-relaxed">
              This is a proctored group discussion session. Your audio, video, and responses will be evaluated by our AI Moderator.
            </p>
            <EnhancedButton 
              onClick={joinMeeting}
              className="w-full py-4 text-lg font-bold"
              variant="default"
            >
              Enter Discussion Room
            </EnhancedButton>
          </div>
        </div>
      )}
    </div>
    {/* Hidden video for AI Coach inference — isolated from the display grid */}
    <video ref={coachVideoRef} autoPlay playsInline muted className="hidden" />
    {/* AI Coach Panel floats non-intrusively in bottom-right */}
    <AICoachPanel 
      videoRef={coachVideoRef} 
      sessionId={session?._id}
      participantId={userId}
    />
    </>
  );
};



export default function VideoSDKMeeting({ 
  roomId, 
  token, 
  participantName, 
  userId,
  session,
  onLeave 
}: { 
  roomId: string, 
  token: string, 
  participantName: string, 
  userId: string,
  session: any,
  onLeave: () => void 
}) {

  return (
    <MeetingProvider
      config={{
        meetingId: roomId,
        micEnabled: true,
        webcamEnabled: true,
        name: participantName,
        participantId: userId // Ensure unique identity mapping
      }}
      token={token}
    >
      <MeetingView 
        roomId={roomId} 
        onLeave={onLeave} 
        userId={userId} 
        session={session} 
        participantName={participantName}
      />
    </MeetingProvider>
  );
}

