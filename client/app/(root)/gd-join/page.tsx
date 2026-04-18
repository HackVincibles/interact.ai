"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Users, Hash, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function GDJoinPage() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get meeting details from URL
  const meetingId = searchParams.get("meetingId") || "";
  const password = searchParams.get("password") || "";
  const topic = searchParams.get("topic") || "Group Discussion";
  
  const [userName, setUserName] = useState("");

  const handleJoin = async () => {
    if (!userName.trim()) {
      setError("Please enter your name");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Build the meeting URL with params
      const params = new URLSearchParams({
        meetingId: meetingId,
        password: password,
        userName: userName,
        topic: topic,
        duration: "30",
        isHost: "false",
      });
      
      // Navigate to the meeting
      window.location.href = `/gd-meeting?${params.toString()}`;
    } catch (err) {
      setError("Failed to join meeting. Please try again.");
      setIsLoading(false);
    }
  };

  if (!meetingId) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Hash className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Invalid Meeting Link</h1>
          <p className="text-gray-400 mb-6">
            This meeting link appears to be invalid or expired.
          </p>
          <Button onClick={() => window.location.href = "/gd"} className="w-full">
            Go to Group Discussion
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-blue-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Join Group Discussion</h1>
          <p className="text-gray-400">Enter your name to join the session</p>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
              <Hash className="w-4 h-4" />
              Meeting ID
            </div>
            <p className="text-white font-mono">{meetingId}</p>
          </div>

          <div className="bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
              <Users className="w-4 h-4" />
              Topic
            </div>
            <p className="text-white">{topic}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name" className="text-white">
              Your Name
            </Label>
            <Input
              id="name"
              placeholder="Enter your full name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-500"
            />
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <Button
            onClick={handleJoin}
            disabled={isLoading || !userName.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Joining...
              </>
            ) : (
              <>
                Join Meeting
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-gray-500 text-sm">
            By joining, you agree to participate respectfully in the group discussion.
          </p>
        </div>
      </div>
    </div>
  );
}
