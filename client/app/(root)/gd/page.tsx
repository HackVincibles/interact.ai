"use client";

import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Phone, 
  MessageSquare, 
  Users, 
  Settings, 
  ScreenShare, 
  Circle, 
  Grid, 
  Speaker,
  ExternalLink,
  Copy,
  Check,
  Hash,
  Lock,
  Clock,
  User,
  Info,
  Zap
} from "lucide-react";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import SetupCard from "@/components/ui/SetupCard";
import UserProfile from "@/components/UserProfile";
import { getCurrentUser } from "@/lib/actions/auth.action";

interface ZoomMeeting {
  joinUrl: string;
  startUrl?: string;
  meetingId: string;
  password?: string;
  topic?: string;
  duration?: number;
}

export default function GDPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [meeting, setMeeting] = useState<ZoomMeeting | null>(null);
  const [copied, setCopied] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  const topic = searchParams.get("topic") || "General Discussion";
  const duration = parseInt(searchParams.get("duration") || "30");
  const userName = searchParams.get("userName") || "Participant";

  // Load user on mount
  useEffect(() => {
    getCurrentUser().then(setUser);
  }, []);

  // Generate Zoom meeting
  const generateMeeting = async () => {
    setIsGenerating(true);
    try {
      // Call server API to create Zoom meeting
      const response = await fetch("/api/zoom/create-meeting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, duration }),
      });

      if (!response.ok) {
        throw new Error("Failed to create meeting");
      }

      const data = await response.json();

      // Store meeting data with both joinUrl and startUrl
      setMeeting({
        joinUrl: data.joinUrl,
        startUrl: data.startUrl,
        meetingId: data.meetingId,
        password: data.password,
        duration: duration,
      });

    } catch (error) {
      console.error("Error creating meeting:", error);
      // Fallback: Show instructions for manual Zoom setup
      setMeeting({
        joinUrl: "",
        startUrl: "",
        meetingId: "manual-setup",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <div className="flex flex-col gap-8 mt-4 px-16 max-sm:px-4 max-sm:mt-2">
        {/* Two Cards Side by Side - Small Size */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Card - Meeting Details */}
          <section className="bg-card border border-border rounded-2xl p-6 shadow-2xl">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg text-foreground font-bold">Meeting Details</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Configure your AI-moderated group discussion session
              </p>
              
              {/* Meeting Details Grid - Smaller */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted rounded-lg p-3 border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center">
                      <Hash className="w-3 h-3 text-white" />
                    </div>
                    <p className="text-xs font-medium text-muted-foreground">Meeting ID</p>
                  </div>
                  <p className="text-sm font-bold text-foreground font-mono">Will Generate</p>
                </div>
                <div className="bg-muted rounded-lg p-3 border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-purple-600 rounded-lg flex items-center justify-center">
                      <Lock className="w-3 h-3 text-white" />
                    </div>
                    <p className="text-xs font-medium text-muted-foreground">Password</p>
                  </div>
                  <p className="text-sm font-bold text-foreground font-mono">Will Generate</p>
                </div>
                <div className="bg-muted rounded-lg p-3 border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-green-600 rounded-lg flex items-center justify-center">
                      <Clock className="w-3 h-3 text-white" />
                    </div>
                    <p className="text-xs font-medium text-muted-foreground">Duration</p>
                  </div>
                  <p className="text-sm font-bold text-foreground">{duration} min</p>
                </div>
                <div className="bg-muted rounded-lg p-3 border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-orange-600 rounded-lg flex items-center justify-center">
                      <User className="w-3 h-3 text-white" />
                    </div>
                    <p className="text-xs font-medium text-muted-foreground">Host</p>
                  </div>
                  <p className="text-sm font-bold text-foreground">{userName}</p>
                </div>
              </div>
              
              {/* Topic Display - Smaller */}
              <div className="bg-gradient-to-r from-muted to-muted/80 rounded-lg p-3 border border-border">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center">
                    <MessageSquare className="w-3 h-3 text-white" />
                  </div>
                  <h4 className="text-sm font-semibold text-foreground">Discussion Topic</h4>
                </div>
                <div className="bg-background rounded-lg p-2 border border-border">
                  <p className="text-xs text-muted-foreground font-medium">
                    {topic === "General Discussion" ? "AI will generate topic automatically" : topic}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Right Card - Join Existing Meeting */}
          <section className="bg-card border border-border rounded-2xl p-6 shadow-2xl">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-green-600 flex items-center justify-center">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg text-foreground font-bold">Join Existing Meeting</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Enter meeting details or paste a meeting link to join
              </p>
              
              {/* Tab Navigation */}
              <div className="flex gap-2 bg-muted rounded-lg p-1">
                <button
                  id="manual-tab"
                  onClick={() => {
                    document.getElementById('manual-tab')?.classList.add('bg-primary', 'text-primary-foreground');
                    document.getElementById('manual-tab')?.classList.remove('text-muted-foreground');
                    document.getElementById('link-tab')?.classList.remove('bg-primary', 'text-primary-foreground');
                    document.getElementById('link-tab')?.classList.add('text-muted-foreground');
                    document.getElementById('manual-form')?.classList.remove('hidden');
                    document.getElementById('link-form')?.classList.add('hidden');
                  }}
                  className="flex-1 py-2 px-3 rounded-md text-sm font-medium bg-primary text-primary-foreground transition-colors"
                >
                  Manual Entry
                </button>
                <button
                  id="link-tab"
                  onClick={() => {
                    document.getElementById('link-tab')?.classList.add('bg-primary', 'text-primary-foreground');
                    document.getElementById('link-tab')?.classList.remove('text-muted-foreground');
                    document.getElementById('manual-tab')?.classList.remove('bg-primary', 'text-primary-foreground');
                    document.getElementById('manual-tab')?.classList.add('text-muted-foreground');
                    document.getElementById('link-form')?.classList.remove('hidden');
                    document.getElementById('manual-form')?.classList.add('hidden');
                  }}
                  className="flex-1 py-2 px-3 rounded-md text-sm font-medium text-muted-foreground transition-colors"
                >
                  Join via Link
                </button>
              </div>
              
              {/* Manual Entry Form */}
              <div id="manual-form" className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Meeting ID</label>
                  <input
                    type="text"
                    placeholder="Enter Meeting ID"
                    className="w-full px-3 py-2 bg-muted border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-foreground placeholder-muted-foreground text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Password (Optional)</label>
                  <input
                    type="text"
                    placeholder="Enter Password"
                    className="w-full px-3 py-2 bg-muted border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-foreground placeholder-muted-foreground text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Your Name</label>
                  <input
                    type="text"
                    placeholder="Enter Your Name"
                    defaultValue={userName}
                    className="w-full px-3 py-2 bg-muted border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-foreground placeholder-muted-foreground text-sm"
                  />
                </div>
              </div>
              
              {/* Link Join Form */}
              <div id="link-form" className="hidden grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Meeting Link</label>
                  <input
                    type="text"
                    id="meeting-link-input"
                    placeholder="Paste meeting link (e.g., https://zoom.us/j/123456789)"
                    className="w-full px-3 py-2 bg-muted border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-foreground placeholder-muted-foreground text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Your Name</label>
                  <input
                    type="text"
                    placeholder="Enter Your Name"
                    defaultValue={userName}
                    className="w-full px-3 py-2 bg-muted border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-foreground placeholder-muted-foreground text-sm"
                  />
                </div>
              </div>
              
              <button
                onClick={() => {
                  const isLinkMode = !document.getElementById('link-form')?.classList.contains('hidden');

                  if (isLinkMode) {
                    // Join via link - redirect directly to Zoom
                    const linkInput = document.getElementById('meeting-link-input') as HTMLInputElement;
                    const nameInput = document.querySelectorAll('input[placeholder="Enter Your Name"]')[1] as HTMLInputElement;

                    if (linkInput?.value && nameInput?.value) {
                      // Use the provided Zoom link directly
                      let zoomUrl = linkInput.value.trim();
                      // Add uname parameter if not present
                      if (!zoomUrl.includes('uname=')) {
                        zoomUrl += (zoomUrl.includes('?') ? '&' : '?') + `uname=${encodeURIComponent(nameInput.value)}`;
                      }
                      window.location.href = zoomUrl;
                    } else {
                      alert('Please fill in meeting link and your name');
                    }
                  } else {
                    // Manual join - redirect to Zoom with meeting ID
                    const meetingIdInput = document.querySelector('input[placeholder="Enter Meeting ID"]') as HTMLInputElement;
                    const passwordInput = document.querySelector('input[placeholder="Enter Password"]') as HTMLInputElement;
                    const nameInput = document.querySelector('input[placeholder="Enter Your Name"]') as HTMLInputElement;

                    if (meetingIdInput?.value && nameInput?.value) {
                      const meetingId = meetingIdInput.value.trim();
                      const password = passwordInput?.value || '';
                      const userName = encodeURIComponent(nameInput.value);
                      // Redirect directly to Zoom
                      const zoomUrl = `https://zoom.us/j/${meetingId}${password ? `?pwd=${password}` : ''}${password ? '&' : '?'}uname=${userName}`;
                      window.location.href = zoomUrl;
                    } else {
                      alert('Please fill in Meeting ID and Your Name');
                    }
                  }
                }}
                className="w-full py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <Users className="w-4 h-4" />
                Join Zoom Meeting
              </button>
            </div>
          </section>
        </div>

        {/* Meeting Created Successfully - Show join options */}
        {!meeting ? (
          <SetupCard 
            type={isGenerating ? "loading" : "generate"}
            onGenerate={generateMeeting}
            topic={topic}
            duration={duration}
          />
        ) : meeting.meetingId === "manual-setup" ? (
          <SetupCard type="manual" />
        ) : (
          <div className="text-center py-12">
            {meeting && (
              <div className="bg-card rounded-xl shadow-2xl p-6 border border-border mb-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                      <Video className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground">Meeting Generated Successfully!</h3>
                      <p className="text-sm text-muted-foreground">Share this link with participants</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-green-500/20 px-3 py-1 rounded-full border border-green-500">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-sm text-green-600 font-medium">Active</span>
                  </div>
                </div>
                
                {/* Meeting Link Card - Dark Theme */}
                <div className="bg-gradient-to-r from-muted to-muted/80 rounded-xl p-6 mb-6 border border-border shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
                        <Video className="w-5 h-5 text-white" />
                      </div>
                      <h4 className="text-lg font-semibold text-foreground">Meeting Link</h4>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`https://zoom.us/j/${meeting.meetingId}${meeting.password ? `?pwd=${meeting.password}` : ''}`);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copied ? "Copied!" : "Copy Link"}
                    </button>
                  </div>
                  <div className="bg-background rounded-xl p-4 border border-border">
                    <p className="text-sm text-muted-foreground font-mono break-all">
                      https://zoom.us/j/{meeting.meetingId}{meeting.password ? `?pwd=${meeting.password}` : ''}
                    </p>
                  </div>
                </div>
                
                {/* Meeting Details Grid - Dark Theme */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-muted rounded-xl p-4 border border-border shadow-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                        <Hash className="w-5 h-5 text-white" />
                      </div>
                      <p className="text-sm font-medium text-muted-foreground">Meeting ID</p>
                    </div>
                    <p className="text-xl font-bold text-foreground font-mono">{meeting.meetingId}</p>
                  </div>
                  <div className="bg-muted rounded-xl p-4 border border-border shadow-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
                        <Lock className="w-5 h-5 text-white" />
                      </div>
                      <p className="text-sm font-medium text-muted-foreground">Password</p>
                    </div>
                    <p className="text-xl font-bold text-foreground font-mono">{meeting.password || "None"}</p>
                  </div>
                  <div className="bg-muted rounded-xl p-4 border border-border shadow-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
                        <Clock className="w-5 h-5 text-white" />
                      </div>
                      <p className="text-sm font-medium text-muted-foreground">Duration</p>
                    </div>
                    <p className="text-xl font-bold text-foreground">{meeting.duration} min</p>
                  </div>
                  <div className="bg-muted rounded-xl p-4 border border-border shadow-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <p className="text-sm font-medium text-muted-foreground">Host</p>
                    </div>
                    <p className="text-xl font-bold text-foreground">{userName}</p>
                  </div>
                </div>

                {/* Join Options */}
                <div className="space-y-4">
                  <div className="bg-muted rounded-lg p-4 border border-border">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <Video className="w-4 h-4 text-white" />
                      </div>
                      <h4 className="text-lg font-semibold text-foreground">Join via InteractAI</h4>
                      <span className="bg-purple-500/20 text-purple-600 text-xs px-2 py-1 rounded-full font-medium border border-purple-500">AI-Powered</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Join with AI GD moderator, real-time analysis, and performance reviews. Camera required throughout the session.
                    </p>
                    <button
                      onClick={() => {
                        setIsJoining(true);
                        const params = new URLSearchParams({
                          meetingId: meeting.meetingId,
                          password: meeting.password || "",
                          userName: userName,
                          topic: topic,
                          duration: duration.toString(),
                          isHost: "true",
                        });
                        window.location.href = `/gd-meeting?${params.toString()}`;
                      }}
                      disabled={isJoining}
                      className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-70 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      {isJoining ? (
                        <>
                          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Joining...
                        </>
                      ) : (
                        <>
                          <Video className="w-5 h-5" />
                          Join GD Session
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
