"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getActiveGDSessions, joinGDRoom } from "@/lib/actions/gd.action";


import EnhancedCard from "@/components/EnhancedCard";
import EnhancedButton from "@/components/EnhancedButton";
import { Users, Video, Plus, Search, Calendar, ArrowRight, Loader2, Share2, History } from "lucide-react";


import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { QrCode, X } from "lucide-react";


export default function GDDashboard() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQR, setShowQR] = useState<{ url: string, topic: string } | null>(null);
  const router = useRouter();



  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const result = await getActiveGDSessions();
        if (result.success) {
          setSessions(result.sessions);
        }
      } catch (error) {
        console.error("Failed to load discussions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
    const interval = setInterval(fetchSessions, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-10">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-white/10 p-10">
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-4xl font-black text-white mb-4 italic tracking-tight">
            GROUP <span className="text-blue-400">DISCUSSIONS</span>
          </h1>
          <p className="text-gray-400 text-lg mb-8 leading-relaxed">
            Participate in AI-proctored group discussions. Get real-time feedback on your communication, leadership, and relevance.
          </p>
          <div className="flex flex-wrap gap-6 items-end">
            <Link href="/gd/create">
              <EnhancedButton className="px-8 py-3 rounded-xl flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Start New Session
              </EnhancedButton>
            </Link>

            <Link href="/gd/history">
              <EnhancedButton variant="outline" className="px-8 py-3 rounded-xl flex items-center gap-2 bg-white/5 border-white/10 text-white">
                <History className="w-5 h-5 text-blue-400" />
                View History
              </EnhancedButton>
            </Link>


            <div className="flex items-center gap-2">
              <div className="space-y-1.5">
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Have a Room Code?</div>
                <div className="flex gap-2">
                  <input 
                    id="room-code-input"
                    type="text" 
                    placeholder="e.g. GD4821" 
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 w-32 uppercase font-bold tracking-widest placeholder:text-gray-600"
                  />
                  <EnhancedButton 
                    variant="outline" 
                    className="px-6"
                    onClick={async () => {
                      const code = (document.getElementById('room-code-input') as HTMLInputElement).value;
                      if (!code) return toast.error("Please enter a room code");
                      const res = await joinGDRoom({ roomCode: code.toUpperCase() });
                      if (res.success) {
                        router.push(`/gd/join/${res.session.roomId}`);
                      } else {
                        toast.error(res.error || "Invalid room code");
                      }
                    }}
                  >
                    Join
                  </EnhancedButton>
                </div>
              </div>
            </div>
          </div>

        </div>
        {/* Background blobs */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute right-40 bottom-0 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Active Discussions List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="w-2 h-8 bg-blue-500 rounded-full" />
              Active Placement Rooms
            </h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            </div>
          ) : sessions.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {sessions.map((session) => (
                <EnhancedCard 
                  key={session._id} 
                  variant="glass" 
                  className="p-6 group hover:border-blue-500/50 transition-all cursor-pointer"
                >
                  <Link href={`/gd/join/${session.roomId}`} className="flex items-center justify-between">
                    <div className="flex gap-6">
                      <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                        <Users className="w-8 h-8 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors mb-1">
                          {session.topic}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-500 font-medium">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            {new Date(session.createdAt).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Video className="w-4 h-4" />
                            {session.durationMinutes} Minutes
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const url = `${window.location.origin}/gd/join/${session.roomId}`;
                          setShowQR({ url, topic: session.topic });
                        }}
                        className="p-3 rounded-full bg-white/5 hover:bg-purple-500/20 text-gray-400 hover:text-purple-400 transition-all border border-white/10 z-20"
                        title="Show QR Code"
                      >
                        <QrCode className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const url = `${window.location.origin}/gd/join/${session.roomId}`;
                          navigator.clipboard.writeText(url);
                          toast.success("Invite link copied!");
                        }}
                        className="p-3 rounded-full bg-white/5 hover:bg-blue-500/20 text-gray-400 hover:text-blue-400 transition-all border border-white/10 z-20"
                        title="Share Room"
                      >
                        <Share2 className="w-5 h-5" />
                      </button>

                      <div className="hidden sm:flex -space-x-2">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="w-8 h-8 rounded-full border-2 border-dark-400 bg-white/10" />
                        ))}
                        <div className="w-8 h-8 rounded-full border-2 border-dark-400 bg-blue-500 flex items-center justify-center text-[10px] font-bold text-white">
                          +{session.participants.length}
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-all">
                        <ArrowRight className="w-5 h-5" />
                      </div>
                    </div>
                  </Link>

                </EnhancedCard>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center rounded-3xl border border-dashed border-white/10 bg-white/5">
              <Video className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-400">No active discussions</h3>
              <p className="text-gray-500 mt-2">Create a new room to start practicing with the AI Moderator</p>
            </div>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <EnhancedCard variant="themed" className="p-6 bg-blue-600/5 border-blue-500/20">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Search className="w-5 h-5 text-blue-400" />
              How it works
            </h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-[10px] font-black flex items-center justify-center shrink-0">1</div>
                <p className="text-sm text-gray-400"><span className="text-gray-200 font-semibold">Join a Room</span> using a shareable ID or create your own topic.</p>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-[10px] font-black flex items-center justify-center shrink-0">2</div>
                <p className="text-sm text-gray-400"><span className="text-gray-200 font-semibold">AI Proctored</span> - The AI Moderator will track your turns and evaluate quality.</p>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-[10px] font-black flex items-center justify-center shrink-0">3</div>
                <p className="text-sm text-gray-400"><span className="text-gray-200 font-semibold">Live Scoring</span> - Check the results page immediately after the session ends.</p>
              </div>
            </div>
          </EnhancedCard>

          <EnhancedCard variant="glass" className="p-6 overflow-hidden relative">
            <div className="relative z-10">
              <h3 className="text-lg font-bold text-white mb-2">Recruiter Mode</h3>
              <p className="text-sm text-gray-400 mb-4">View detailed analytics of all candidates in this session.</p>
              <EnhancedButton variant="outline" className="w-full">
                Learn More
              </EnhancedButton>
            </div>
            <Users className="absolute -right-8 -bottom-8 w-32 h-32 text-white/5 rotate-12" />
          </EnhancedCard>
        </div>
      </div>
      {/* QR Modal */}
      {showQR && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-dark-400/80 backdrop-blur-md" onClick={() => setShowQR(null)} />
          <EnhancedCard variant="glass" className="relative z-10 p-10 max-w-sm w-full text-center space-y-6 border-white/20 shadow-2xl">
            <button 
              onClick={() => setShowQR(null)}
              className="absolute right-6 top-6 text-gray-500 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-white italic tracking-tighter">SCAN TO JOIN</h3>
              <p className="text-sm text-gray-400 truncate">{showQR.topic}</p>
            </div>
            <div className="bg-white p-6 rounded-3xl mx-auto w-fit shadow-xl shadow-blue-500/10 border-4 border-white/10">
              <QRCodeSVG value={showQR.url} size={200} level="H" />
            </div>
            <div className="pt-4">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Or scan with your phone camera</p>
              <EnhancedButton className="w-full" onClick={() => setShowQR(null)}>
                Got it
              </EnhancedButton>
            </div>
          </EnhancedCard>
        </div>
      )}
    </div>
  );
}

