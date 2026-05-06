"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createGDRoom } from "@/lib/actions/gd.action";
import EnhancedCard from "@/components/EnhancedCard";
import EnhancedButton from "@/components/EnhancedButton";
import { toast } from "sonner";
import { Video, Clock, MessageSquare, Loader2 } from "lucide-react";

export default function CreateGDPage() {
  const [topic, setTopic] = useState("");
  const [duration, setDuration] = useState(15);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      toast.error("Please enter a discussion topic");
      return;
    }

    setIsLoading(true);
    try {
      const result = await createGDRoom(topic, duration);
      if (result.success) {
        toast.success("GD Room created successfully!");
        router.push(`/gd/join/${result.roomId}`);
      } else {
        toast.error(result.error || "Failed to create room");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-2xl px-4">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-2">Create Group Discussion</h1>
          <p className="text-gray-400">Initialize a production-grade session with AI Moderator</p>
        </div>

        <EnhancedCard variant="glass" className="p-8">
          <form onSubmit={handleCreate} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-400" />
                Discussion Topic
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., The Impact of AI on Future Software Engineering"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-400" />
                Duration (Minutes)
              </label>
              <div className="grid grid-cols-3 gap-4">
                {[10, 15, 30].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDuration(mins)}
                    className={`py-3 rounded-xl border transition-all ${
                      duration === mins
                        ? "bg-blue-500/20 border-blue-500 text-blue-400"
                        : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                    }`}
                  >
                    {mins} mins
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4">
              <EnhancedButton
                type="submit"
                className="w-full py-4 text-lg font-semibold"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Initializing VideoSDK...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Video className="w-5 h-5" />
                    Create Placement Room
                  </span>
                )}
              </EnhancedButton>
            </div>
          </form>
        </EnhancedCard>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
            <div className="text-blue-400 font-bold mb-1">RTC</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">VideoSDK Powered</div>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
            <div className="text-purple-400 font-bold mb-1">AI</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Vapi Moderator</div>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
            <div className="text-green-400 font-bold mb-1">Auto</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Live Scoring</div>
          </div>
        </div>
      </div>
    </div>
  );
}
