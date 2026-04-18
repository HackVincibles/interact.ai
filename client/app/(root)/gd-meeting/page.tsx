"use client";

import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";

// Dynamically import ZoomMeetingWithAI to avoid SSR issues
const ZoomMeetingWithAI = dynamic(() => import("@/components/ZoomMeetingWithAI"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen bg-gray-900">
      <div className="w-16 h-16 border-4 border-gray-600 border-t-blue-500 rounded-full animate-spin" />
    </div>
  ),
});

export default function GDMeetingPage() {
  const searchParams = useSearchParams();

  // Get meeting parameters from URL
  const meetingId = searchParams.get("meetingId") || "";
  const password = searchParams.get("password") || "";
  const userName = searchParams.get("userName") || "Participant";
  const topic = searchParams.get("topic") || "Group Discussion";
  const duration = parseInt(searchParams.get("duration") || "30");

  // Validate meeting parameters
  if (!meetingId) {
    return (
      <div className="h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-16 h-16 border-4 border-gray-600 border-t-red-500 rounded-full animate-spin mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Invalid Meeting Link</h3>
          <p className="text-gray-400 mb-6">Please check your meeting link and try again.</p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Return the ZoomMeetingWithAI component with embedded Zoom + AI panel
  return (
    <ZoomMeetingWithAI
      meetingNumber={meetingId}
      password={password}
      userName={userName}
      userEmail={userName.toLowerCase().replace(/\s+/g, '.') + "@interact.ai"}
      topic={topic}
      duration={duration}
      onLeave={() => {
        console.log("Meeting ended");
        window.location.href = "/";
      }}
    />
  );
}
