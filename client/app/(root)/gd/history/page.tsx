"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  History, 
  Calendar, 
  Users, 
  BarChart3, 
  ArrowRight, 
  Search,
  FileText,
  ChevronLeft
} from "lucide-react";
import { getPastGDSessions } from "@/lib/actions/gd.action";
import EnhancedButton from "@/components/EnhancedButton";
import EnhancedCard from "@/components/EnhancedCard";
import { format } from "date-fns";
import { QRCodeSVG } from "qrcode.react";
import { QrCode, X } from "lucide-react";


export default function GDHistoryPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showQR, setShowQR] = useState<{ url: string, topic: string } | null>(null);


  useEffect(() => {
    const fetchHistory = async () => {
      const res = await getPastGDSessions();
      if (res.success) {
        setSessions(res.sessions);
      }
      setLoading(false);
    };
    fetchHistory();
  }, []);

  const filteredSessions = sessions.filter(s => 
    s.topic.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-dark-400 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/gd">
            <button className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all">
              <ChevronLeft className="w-6 h-6" />
            </button>
          </Link>
          <div>
            <div className="flex items-center gap-3 text-blue-400 text-xs font-black uppercase tracking-widest mb-1">
              <History className="w-4 h-4" />
              Recruiter Analytics
            </div>
            <h1 className="text-4xl font-black italic tracking-tighter">GD SESSION HISTORY</h1>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-12">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input 
            type="text"
            placeholder="Search by topic..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-dark-200/50 border border-white/5 rounded-2xl py-5 pl-16 pr-8 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all backdrop-blur-xl"
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-48 bg-white/5 rounded-3xl" />
            ))}
          </div>
        ) : filteredSessions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filteredSessions.map((session) => (
              <div key={session._id} className="group relative bg-dark-200/50 rounded-3xl border border-white/5 p-8 hover:border-blue-500/30 transition-all hover:bg-dark-200/80">
                <div className="absolute top-6 right-6">
                  <div className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase tracking-widest border border-blue-500/20">
                    {session.status}
                  </div>
                </div>

                <div className="flex flex-col h-full">
                  <div className="mb-6">
                    <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase tracking-widest mb-2">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(session.createdAt), "MMM dd, yyyy • hh:mm a")}
                    </div>
                    <h3 className="text-2xl font-black italic text-white group-hover:text-blue-400 transition-colors">
                      {session.topic}
                    </h3>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                      <div className="text-[10px] font-bold text-gray-500 uppercase mb-1">Participants</div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-400" />
                        <span className="text-lg font-black">{session.participants.length}</span>
                      </div>
                    </div>
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                      <div className="text-[10px] font-bold text-gray-500 uppercase mb-1">Synergy</div>
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-green-400" />
                        <span className="text-lg font-black">{session.analytics?.groupSynergy || 0}%</span>
                      </div>
                    </div>
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                      <div className="text-[10px] font-bold text-gray-500 uppercase mb-1">Interactions</div>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-purple-400" />
                        <span className="text-lg font-black">{session.transcripts?.length || 0}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto flex gap-3">
                    <Link href={`/gd/results/${session._id}`} className="flex-1">
                      <EnhancedButton className="w-full bg-white/10 hover:bg-blue-600 text-white font-black italic uppercase group-hover:shadow-lg group-hover:shadow-blue-500/20 transition-all">
                        View Report
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </EnhancedButton>
                    </Link>
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        const url = `${window.location.origin}/gd/results/${session._id}`;
                        setShowQR({ url, topic: session.topic });
                      }}
                      className="p-3 rounded-2xl bg-white/5 hover:bg-purple-500/20 text-gray-400 hover:text-purple-400 transition-all border border-white/10"
                      title="Report QR"
                    >
                      <QrCode className="w-5 h-5" />
                    </button>
                  </div>

                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 bg-dark-200/30 rounded-3xl border border-dashed border-white/10">
            <History className="w-16 h-16 text-gray-600 mb-4" />
            <h2 className="text-2xl font-black text-gray-500 italic">NO PAST SESSIONS FOUND</h2>
            <p className="text-gray-600 mt-2">Start a new discussion to see it here later.</p>
            <Link href="/gd">
              <EnhancedButton variant="outline" className="mt-8">
                Create First Room
              </EnhancedButton>
            </Link>
          </div>
        )}
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
              <h3 className="text-2xl font-black text-white italic tracking-tighter">REPORT ACCESS</h3>
              <p className="text-sm text-gray-400 truncate">{showQR.topic}</p>
            </div>
            <div className="bg-white p-6 rounded-3xl mx-auto w-fit shadow-xl shadow-blue-500/10 border-4 border-white/10">
              <QRCodeSVG value={showQR.url} size={200} level="H" />
            </div>
            <div className="pt-4">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Scan to view archived analytics</p>
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
