import PlaylistTube from "@/components/PlaylistTube";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Playlist Tube | Interact.ai",
  description: "Track your learning progress with embedded YouTube playlists.",
};

export default function PlaylistTubePage() {
  return (
    <div className="container mx-auto">
      <PlaylistTube />
    </div>
  );
}
