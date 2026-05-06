import PlaylistTube from "@/components/PlaylistTube";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Learning Session | Interact.ai",
  description: "Focused learning session with your YouTube playlist.",
};

export default function PlaylistPlayerPage() {
  return (
    <div className="container mx-auto">
      <PlaylistTube />
    </div>
  );
}
