"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getGDSession, getGDToken } from "@/lib/actions/gd.action";
import { getCurrentUser } from "@/lib/actions/auth.action";
import dynamic from "next/dynamic";
const VideoSDKMeeting = dynamic(() => import("@/components/gd/VideoSDKMeeting"), { ssr: false });

import { toast } from "sonner";
import { Loader2, AlertCircle } from "lucide-react";

export default function GDJoinPage() {
  const { roomId } = useParams();
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const [tokenData, userData, sessionData] = await Promise.all([
          getGDToken(),
          getCurrentUser(),
          getGDSession(roomId as string)
        ]);

        if (tokenData.token) {
          setToken(tokenData.token);
        } else {
          setError("Failed to generate meeting token");
        }

        if (userData) {
          setUser(userData);
        }

        if (sessionData.success) {
          const sess = sessionData.session;
          if (sess.status === 'completed' || sess.sessionState === 'archived' || sess.sessionState === 'ended') {
            setError("This session has already concluded and is no longer joinable.");
          } else {
            setSession(sess);
          }
        } else {
          setError("Session not found or invalid");
        }
      } catch (err) {
        console.error("Initialization error:", err);
        setError("Failed to initialize session");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [roomId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
        <p className="text-gray-400 font-medium">Preparing secure environment...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
          <AlertCircle className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
        <p className="text-gray-400 mb-8 max-w-md">{error}</p>
        <button
          onClick={() => router.push("/gd")}
          className="px-8 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 transition-all font-semibold"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-160px)] w-full">
      {token && user && session && (
        <VideoSDKMeeting
          roomId={roomId as string}
          token={token}
          participantName={user.name || "Candidate"}
          userId={user.id || user._id}
          session={session}
          onLeave={() => router.push(`/gd/results/${session?._id || ''}`)}
        />
      )}

    </div>
  );
}
