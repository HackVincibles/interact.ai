"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Plus, Trash2, Youtube, Play, CheckCircle2, Loader2, Search, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { 
  getPlaylists as fetchPlaylists, 
  addPlaylist as createPlaylist, 
  updatePlaylistProgress, 
  deletePlaylist as removePlaylist 
} from "@/lib/actions/playlist.action";
import { useImperativeHandle, forwardRef } from "react";

interface Playlist {
  _id: string;
  playlistId: string;
  name: string;
  thumbnail: string;
  progress: number;
  watchedIndices: number[];
  videoDurations?: Record<string, number>;
  totalPlaylistDuration?: number;
  cumulativeWatchTime?: number;
  isDeleted?: boolean;
}

export default function PlaylistTube() {
  const params = useParams();
  const router = useRouter();
  const playlistIdFromUrl = params?.id as string;

  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [newUrl, setNewUrl] = useState("");
  const [newName, setNewName] = useState("");
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [activePlaylist, setActivePlaylist] = useState<Playlist | null>(null);
  const [currentView, setCurrentView] = useState<'dashboard' | 'player'>('dashboard');
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [playlistLength, setPlaylistLength] = useState(0);
  const [playlistVideoIds, setPlaylistVideoIds] = useState<string[]>([]);
  const [currentVideoDuration, setCurrentVideoDuration] = useState(0);
  const [currentVideoTitle, setCurrentVideoTitle] = useState("");
  const [sessionWatchTime, setSessionWatchTime] = useState(0);
  const [localWatchTime, setLocalWatchTime] = useState(0);
  const playerRef = useRef<{ playVideoAt: (index: number) => void }>(null);
  
  // Refs for synchronous tracking
  const cumulativeWatchTimeRef = useRef(0);
  const sessionWatchTimeRef = useRef(0);
  const pendingWatchTimeRef = useRef(0);
  const lastSyncTimeRef = useRef(Date.now());

  useEffect(() => {
    loadPlaylists();
  }, []);

  const loadPlaylists = async () => {
    setIsInitialLoading(true);
    try {
      const res = await fetchPlaylists();
      if (res.success) {
        const serverPlaylists = res.playlists.map((p: any) => {
          // If server time is 0 but we have progress, reconstruct from durations
          let watchTime = Number(p.cumulativeWatchTime) || 0;
          if (watchTime === 0 && p.watchedIndices?.length > 0 && p.videoDurations) {
            const durationsMap = p.videoDurations instanceof Map ? p.videoDurations : new Map(Object.entries(p.videoDurations || {}));
            p.watchedIndices.forEach((idx: number) => {
              watchTime += Number(durationsMap.get(idx.toString())) || 0;
            });
          }

          return {
            ...p,
            cumulativeWatchTime: p._id === activePlaylist?._id || p._id === playlistIdFromUrl
              ? Math.max(watchTime, cumulativeWatchTimeRef.current)
              : watchTime
          };
        });
        setPlaylists(serverPlaylists);
        
        if (playlistIdFromUrl) {
          const playlist = serverPlaylists.find((p: any) => p._id === playlistIdFromUrl);
          if (playlist) {
            setActivePlaylist(playlist);
            
            const cachedTime = Number(localStorage.getItem(`watchtime_${playlist._id}`)) || 0;
            const finalTime = Math.max(cumulativeWatchTimeRef.current, cachedTime, playlist.cumulativeWatchTime || 0);
            
            cumulativeWatchTimeRef.current = finalTime;
            setLocalWatchTime(finalTime);
            sessionWatchTimeRef.current = 0;
            setSessionWatchTime(0);
            setCurrentView('player');
          } else {
            router.push('/playlist-tube');
          }
        } else {
          setCurrentView('dashboard');
          setActivePlaylist(null);
        }
      }
    } catch (error) {
      console.error("Failed to load playlists:", error);
    } finally {
      setIsInitialLoading(false);
    }
  };

  useEffect(() => {
    localStorage.setItem("interact_playlists", JSON.stringify(playlists));
  }, [playlists]);

  useEffect(() => {
    if (activePlaylist) {
      localStorage.setItem("active_playlist_id", activePlaylist._id);
    } else {
      localStorage.removeItem("active_playlist_id");
    }
    localStorage.setItem("current_view", currentView);
    localStorage.setItem("current_video_index", currentVideoIndex.toString());
  }, [activePlaylist, currentView, currentVideoIndex]);

  // Migration for missing thumbnails
  useEffect(() => {
    const migrateThumbnails = async () => {
      const updatedPlaylists = await Promise.all(playlists.map(async (p) => {
        if (!p.thumbnail || p.thumbnail.includes('q_v_v_v_v') || p.thumbnail.includes('noembed')) {
          if (p.videoIds?.[0]) {
            return { ...p, thumbnail: `https://i.ytimg.com/vi/${p.videoIds[0]}/hqdefault.jpg` };
          }
          
          try {
            const response = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/playlist?list=${p.playlistId}`);
            const data = await response.json();
            
            let extractedVideoId = '';
            if (data.html) {
              const vMatch = data.html.match(/v=([^&"\s?]+)/);
              if (vMatch) extractedVideoId = vMatch[1];
            }

            if (data.thumbnail_url && !data.thumbnail_url.includes('noembed')) {
              return { ...p, thumbnail: data.thumbnail_url };
            } else if (extractedVideoId) {
              return { ...p, thumbnail: `https://i.ytimg.com/vi/${extractedVideoId}/hqdefault.jpg` };
            }
            return { ...p, thumbnail: `https://i.ytimg.com/vi_webp/${p.playlistId}/hqdefault.webp` };
          } catch (e) {
            return p;
          }
        }
        return p;
      }));
      
      if (JSON.stringify(updatedPlaylists) !== JSON.stringify(playlists)) {
        setPlaylists(updatedPlaylists);
      }
    };

    if (playlists.length > 0) {
      migrateThumbnails();
    }
  }, [playlists.length]);

  const extractPlaylistId = (url: string) => {
    try {
      const match = url.match(/[?&]list=([^#\&\?]+)/);
      return match ? match[1] : null;
    } catch (e) {
      return null;
    }
  };

  const extractVideoIdFromUrl = (url: string) => {
    try {
      const match = url.match(/[?&]v=([^#\&\?]+)/);
      return match ? match[1] : null;
    } catch (e) {
      return null;
    }
  };

  const handleAddPlaylist = async () => {
    if (!newUrl) {
      toast.error("Please enter a YouTube playlist URL");
      return;
    }

    const urlToProcess = newUrl.trim();
    const playlistId = extractPlaylistId(urlToProcess);
    
    if (!playlistId) {
      toast.error("Invalid YouTube playlist URL. Make sure it contains 'list=' parameter.");
      return;
    }

    setIsActionLoading(true);
    try {
      // Try to get video ID from the URL itself first
      let extractedVideoId = extractVideoIdFromUrl(urlToProcess);
      
      const response = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/playlist?list=${playlistId}`);
      const data = await response.json();
      
      const name = newName.trim() || data.title || `Playlist ${playlists.length + 1}`;
      
      // If no video ID in URL, try to extract from noembed HTML
      if (!extractedVideoId && data.html) {
        const vMatch = data.html.match(/v=([^&"\s?]+)/);
        if (vMatch) extractedVideoId = vMatch[1];
      }

      // If still no video ID, try a regex that looks for any video ID pattern in the HTML
      if (!extractedVideoId && data.html) {
        const anyVMatch = data.html.match(/vi\/([^/]+)/);
        if (anyVMatch) extractedVideoId = anyVMatch[1];
      }

      let thumbnail = data.thumbnail_url;
      
      // If thumbnail is missing or generic, use the extracted video ID
      if (!thumbnail || thumbnail.includes('noembed') || thumbnail.includes('q_v_v_v_v')) {
        if (extractedVideoId) {
          thumbnail = `https://i.ytimg.com/vi/${extractedVideoId}/hqdefault.jpg`;
        } else {
          // Absolute fallback: try to use the playlist ID in a way that might work or use a nice default
          thumbnail = `https://i.ytimg.com/vi_webp/${playlistId}/hqdefault.webp`; // This often fails but worth a shot
        }
      }

      const res = await createPlaylist({
        name,
        url: newUrl,
        playlistId,
        thumbnail,
        videoIds: extractedVideoId ? [extractedVideoId] : []
      });

      if (res.success) {
        setPlaylists([res.playlist, ...playlists]);
        setNewUrl("");
        setNewName("");
        toast.success("Playlist added successfully!");
      } else {
        toast.error(res.message || "Failed to add playlist");
      }
    } catch (error) {
      console.error("Metadata fetch failed", error);
      toast.error("Failed to add playlist. Please check the URL.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleWatchTimeUpdate = (delta: number, forceSync = false) => {
    if (!activePlaylist) return;

    const validDelta = Number(delta) || 0;
    cumulativeWatchTimeRef.current += validDelta;
    sessionWatchTimeRef.current += validDelta;
    pendingWatchTimeRef.current += validDelta;
    
    setSessionWatchTime(sessionWatchTimeRef.current);
    setLocalWatchTime(cumulativeWatchTimeRef.current);
    
    // Cache to LocalStorage to survive re-mounts
    localStorage.setItem(`watchtime_${activePlaylist._id}`, cumulativeWatchTimeRef.current.toString());

    setPlaylists(prev => prev.map(p => {
      if (p._id === activePlaylist._id) {
        return { ...p, cumulativeWatchTime: cumulativeWatchTimeRef.current };
      }
      return p;
    }));

    setActivePlaylist(prev => prev ? { ...prev, cumulativeWatchTime: cumulativeWatchTimeRef.current } : null);

    // Auto-mark as watched at 50% threshold
    if (currentVideoDuration > 0 && 
        !activePlaylist.watchedIndices?.includes(currentVideoIndex) && 
        sessionWatchTimeRef.current >= currentVideoDuration * 0.5) {
      handleMarkWatched(sessionWatchTimeRef.current, false); // Auto-mark: No top-up
    }

    const now = Date.now();
    // Increase sync frequency to every 10 seconds for better responsiveness
    if (forceSync || now - lastSyncTimeRef.current > 10000 || pendingWatchTimeRef.current >= 30) {
      lastSyncTimeRef.current = now;
      pendingWatchTimeRef.current = 0;

      updatePlaylistProgress(
        activePlaylist._id, 
        activePlaylist.progress, 
        activePlaylist.watchedIndices, 
        activePlaylist.videoDurations, 
        activePlaylist.totalPlaylistDuration,
        activePlaylist.videoIds,
        cumulativeWatchTimeRef.current
      ).catch(err => console.error("Periodic sync failed", err));
    }
  };

  useEffect(() => {
    return () => {
      if (pendingWatchTimeRef.current > 0 && activePlaylist) {
        handleWatchTimeUpdate(0, true);
      }
    };
  }, [activePlaylist]);

  const handleDeletePlaylist = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const res = await removePlaylist(id);
    if (res.success) {
      setPlaylists(playlists.map((p) => p._id === id ? { ...p, isDeleted: true } : p));
      if (activePlaylist?._id === id) setActivePlaylist(null);
      toast.info("Playlist removed");
    }
  };

  const updateProgress = async (
    id: string, 
    progress: number, 
    watchedIndices: number[], 
    videoDurations?: any, 
    totalDuration?: number,
    videoIds?: string[],
    cumulativeWatchTime?: number
  ) => {
    // 1. Immediate synchronous update for high-precision trackers
    if (cumulativeWatchTime !== undefined) {
      const validTime = Number(cumulativeWatchTime) || 0;
      cumulativeWatchTimeRef.current = Math.max(cumulativeWatchTimeRef.current, validTime);
      setLocalWatchTime(cumulativeWatchTimeRef.current);
    }

    // 2. Functional state update to prevent stale closures
    setPlaylists(prev => {
      const updatedList = prev.map(p => {
        if (p._id === id) {
          return { 
            ...p, 
            progress, 
            watchedIndices, 
            videoDurations: videoDurations || p.videoDurations,
            totalPlaylistDuration: totalDuration || p.totalPlaylistDuration,
            videoIds: videoIds || p.videoIds,
            cumulativeWatchTime: cumulativeWatchTime !== undefined ? cumulativeWatchTime : (p.cumulativeWatchTime || 0)
          };
        }
        return p;
      });

      // Synchronize activePlaylist state with the updated entry
      const updatedItem = updatedList.find(p => p._id === id);
      if (updatedItem && (activePlaylist?._id === id || playlistIdFromUrl === id)) {
        setActivePlaylist(updatedItem);
      }

      return updatedList;
    });
    
    // 3. Background server synchronization
    await updatePlaylistProgress(
      id, 
      progress, 
      watchedIndices, 
      videoDurations, 
      totalDuration, 
      videoIds, 
      cumulativeWatchTime ?? cumulativeWatchTimeRef.current
    );
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return "0s";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const handleMarkWatched = (index?: number, overrideTime?: number, shouldTopUp = true) => {
    if (!activePlaylist) return;
    
    const targetIndex = index !== undefined ? index : currentVideoIndex;
    
    // If already watched, don't add time again, but we can still trigger a sync if needed
    if (activePlaylist.watchedIndices?.includes(targetIndex)) {
      toast.info("Video already marked as watched");
      return;
    }

    // Try to get duration from: 
    // 1. Current video state
    // 2. Player directly
    // 3. Playlist's stored durations
    let duration = (targetIndex === currentVideoIndex) ? currentVideoDuration : (activePlaylist.videoDurations?.[targetIndex.toString()] || 0);
    let currentTime = (targetIndex === currentVideoIndex) ? sessionWatchTimeRef.current : 0;

    if (targetIndex === currentVideoIndex && playerRef.current) {
      const player = playerRef.current as any;
      const playerDuration = typeof player.getDuration === 'function' ? player.getDuration() : 0;
      const playerCurrentTime = typeof player.getCurrentTime === 'function' ? player.getCurrentTime() : 0;
      
      if (duration <= 0 && playerDuration > 0) duration = playerDuration;
      if (currentTime <= 0 && playerCurrentTime > 0) currentTime = playerCurrentTime;
    }

    // Fallback: If we still don't have duration but it's in our stored durations
    if (duration <= 0 && activePlaylist.videoDurations?.[targetIndex.toString()]) {
      duration = activePlaylist.videoDurations[targetIndex.toString()];
    }

    const timeToUse = overrideTime !== undefined ? overrideTime : currentTime;
    
    // Manual mark-as-watched adds the full duration (Top-up). 
    // Automatic mark-as-watched (at 50%) only adds the actual time spent.
    const remainingTime = (shouldTopUp && duration > 0) ? Math.max(0, duration - timeToUse) : 0;
    
    const newCumulativeTime = cumulativeWatchTimeRef.current + remainingTime;
    cumulativeWatchTimeRef.current = newCumulativeTime;
    setLocalWatchTime(newCumulativeTime);
    
    // Immediate cache update
    localStorage.setItem(`watchtime_${activePlaylist._id}`, newCumulativeTime.toString());
    
    if (targetIndex === currentVideoIndex && duration > 0) {
      sessionWatchTimeRef.current = duration;
      setSessionWatchTime(duration);
    }

    const newWatched = [...(activePlaylist.watchedIndices || [])];
    if (!newWatched.includes(targetIndex)) {
      newWatched.push(targetIndex);
    }
    
    const total = playlistLength || 1;
    const progress = Math.round((newWatched.length / total) * 100);
    
    const newDurations = { ...(activePlaylist.videoDurations || {}) };
    if (duration > 0) {
      newDurations[targetIndex.toString()] = duration;
    }
    
    const totalDuration = Object.values(newDurations).reduce((acc: number, curr: any) => acc + curr, 0);

    updateProgress(activePlaylist._id, progress, newWatched, newDurations, totalDuration, playlistVideoIds, newCumulativeTime);
    toast.success(`Video #${targetIndex + 1} marked as watched!`);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black tracking-tight text-white flex items-center gap-3">
          <Youtube className="w-10 h-10 text-red-500" />
          PLAYLIST <span className="text-primary">TUBE</span>
        </h1>
        <p className="text-muted-foreground text-lg">
          Import your favorite YouTube playlists and track your learning progress.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 rounded-3xl bg-dark-200/50 border border-white/5 backdrop-blur-xl shadow-2xl">
        <div className="md:col-span-2 space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">YouTube Playlist URL</label>
          <div className="relative group">
            <Youtube className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-red-500 transition-colors" />
            <Input 
              placeholder="https://www.youtube.com/playlist?list=..." 
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              className="pl-12 py-6 bg-dark-300/50 border-white/10 rounded-2xl focus:border-red-500/50 focus:ring-red-500/20 transition-all text-lg"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Playlist Name (Optional)</label>
          <Input 
            placeholder="e.g. Next.js Mastery" 
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="py-6 bg-dark-300/50 border-white/10 rounded-2xl focus:border-primary/50 focus:ring-primary/20 transition-all text-lg"
          />
        </div>
        <div className="md:col-span-3">
          <Button 
            onClick={handleAddPlaylist}
            disabled={!newUrl || isActionLoading}
            className="w-full py-7 rounded-2xl bg-primary hover:bg-primary/90 text-black font-black text-lg transition-all active:scale-[0.98] shadow-lg shadow-primary/20 flex items-center justify-center gap-2 group"
          >
            {isActionLoading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
            )}
            {isActionLoading ? "IMPORTING..." : "IMPORT PLAYLIST"}
          </Button>
        </div>
      </div>

      {currentView === 'dashboard' && (
        <div className="space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 space-y-6">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-2xl font-black text-white flex items-center gap-3">
                  <Youtube className="w-6 h-6 text-red-500" />
                  YOUR PLAYLISTS
                </h2>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground bg-white/5 px-4 py-2 rounded-full">
                  {playlists.filter(p => !p.isDeleted).length} ACTIVE
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {isInitialLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-64 rounded-[2rem] bg-dark-200 animate-pulse border border-white/5" />
                  ))
                ) : playlists.filter(p => !p.isDeleted).length === 0 ? (
                  <div className="md:col-span-2 p-16 text-center border-2 border-dashed border-white/5 rounded-[2.5rem] bg-dark-200/50 space-y-4">
                    <Play className="w-12 h-12 text-muted-foreground mx-auto" />
                    <p className="text-muted-foreground font-medium">No playlists added yet. Import one to start your journey.</p>
                  </div>
                ) : (
                  playlists.filter(p => !p.isDeleted).map((playlist) => (
                    <div 
                      key={playlist._id}
                      onClick={() => {
                        router.push(`/playlist-tube/${playlist._id}`);
                      }}
                      className="group relative rounded-[2.5rem] bg-dark-200 border border-white/5 overflow-hidden cursor-pointer transition-all hover:scale-[1.02] hover:border-primary/30 hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                    >
                      <div className="aspect-[16/10] relative overflow-hidden">
                        <img 
                          src={playlist.videoIds?.[0] ? `https://i.ytimg.com/vi/${playlist.videoIds[0]}/hqdefault.jpg` : (playlist.thumbnail || `https://i.ytimg.com/vi/playlist/hqdefault.jpg`)} 
                          alt={playlist.name} 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=1000&auto=format&fit=crop"; // Better fallback image
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-dark-300 via-transparent to-transparent opacity-60" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-[2px]">
                           <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-black shadow-2xl">
                             <Play className="w-8 h-8 fill-black" />
                           </div>
                        </div>
                        <div className="absolute bottom-4 left-6 right-6">
                           <h3 className="text-xl font-black text-white truncate drop-shadow-2xl">{playlist.name}</h3>
                        </div>
                      </div>
                      
                      <div className="p-6 space-y-4">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="text-primary">{playlist.progress}%</span>
                        </div>
                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden p-[1px]">
                          <div 
                            className="h-full bg-primary rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(var(--primary),0.5)]"
                            style={{ width: `${playlist.progress}%` }}
                          />
                        </div>
                        <div className="flex justify-between items-center pt-2">
                          <div className="flex flex-col">
                             <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                               Watch Time 
                               <Loader2 className="w-2 h-2 animate-spin opacity-0 group-hover:opacity-100 transition-opacity" />
                             </span>
                             <span className="text-xs font-bold text-white/90">{formatDuration(playlist.cumulativeWatchTime || 0)}</span>
                          </div>
                          <Button 
                             variant="ghost" 
                             onClick={(e) => {
                               e.stopPropagation();
                               handleDeletePlaylist(playlist._id, e);
                             }}
                             className="p-2 h-auto text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-xl"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="sticky top-8">
                <AnalyticsDashboard playlists={playlists} formatDuration={formatDuration} />
              </div>
            </div>
          </div>

          <div className="space-y-6 pt-12 border-t border-white/5">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-xl font-black text-white/50 flex items-center gap-3">
                LEARNING HISTORY
              </h2>
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                ALL TIME RECORDS
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {playlists.map((p) => (
                <div 
                  key={p._id}
                  className={cn(
                    "group relative p-3 rounded-3xl border transition-all hover:bg-white/5",
                    p.isDeleted ? "bg-white/[0.02] border-white/5 opacity-60" : "bg-white/5 border-white/10"
                  )}
                >
                  <div className="aspect-square rounded-2xl overflow-hidden mb-3 bg-dark-300">
                    <img 
                      src={p.videoIds?.[0] ? `https://i.ytimg.com/vi/${p.videoIds[0]}/hqdefault.jpg` : (p.thumbnail || "https://i.ytimg.com/vi/playlist/hqdefault.jpg")} 
                      alt={p.name}
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all"
                      onError={(e) => {
                         (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=1000&auto=format&fit=crop";
                      }}
                    />
                  </div>
                  <h4 className="text-[10px] font-black text-white truncate group-hover:text-primary mb-1">{p.name}</h4>
                  <div className="flex items-center justify-between">
                     <span className="text-[8px] font-black text-muted-foreground uppercase">{formatDuration(p.cumulativeWatchTime || 0)}</span>
                     <span className="text-[8px] font-black text-primary">{p.progress}%</span>
                  </div>
                  {p.isDeleted && (
                    <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-red-500/10 border border-red-500/20">
                      <span className="text-[6px] font-bold text-red-500 uppercase">REMOVED</span>
                    </div>
                  )}
                </div>
              ))}
              {playlists.length === 0 && (
                <div className="col-span-full py-12 text-center text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.3em]">
                  No history recorded yet
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {currentView === 'player' && activePlaylist && (
        <div className="fixed inset-0 z-[100] bg-dark-400 overflow-y-auto animate-in fade-in duration-500">
          <div className="max-w-[1600px] mx-auto min-h-screen p-4 md:p-8 space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <Button 
                  variant="ghost" 
                  onClick={() => router.push('/playlist-tube')}
                  className="p-3 h-auto text-muted-foreground hover:text-white rounded-2xl bg-white/5 border border-white/10 transition-all hover:scale-105"
                >
                  <ArrowLeft className="w-6 h-6" />
                </Button>
                <div className="space-y-1">
                  <h2 className="text-3xl md:text-4xl font-black text-white tracking-tighter truncate max-w-[300px] md:max-w-xl">{activePlaylist.name}</h2>
                  <div className="flex items-center gap-3">
                     <div className="h-1.5 w-32 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]" style={{ width: `${activePlaylist.progress}%` }} />
                     </div>
                     <span className="text-[10px] font-black text-primary uppercase tracking-widest">{activePlaylist.progress}% COMPLETE</span>
                  </div>
                </div>
              </div>
              <div className="hidden md:flex flex-col items-end">
                 <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Focused Session</span>
                 <span className="text-sm font-bold text-white/50">{activePlaylist.playlistId}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-8 space-y-6">
                <div className="aspect-video rounded-3xl overflow-hidden border border-white/10 bg-black shadow-2xl relative group ring-1 ring-white/5">
                  <YoutubePlayer 
                    ref={playerRef}
                    playlistId={activePlaylist.playlistId} 
                    onWatchTimeUpdate={handleWatchTimeUpdate}
                    onStateChange={(state, index, length, title, duration, videoIds) => {
                      if (index !== currentVideoIndex) {
                        handleWatchTimeUpdate(0, true);
                        sessionWatchTimeRef.current = 0;
                        setSessionWatchTime(0);
                      }
                      setCurrentVideoIndex(index);
                      if (length) setPlaylistLength(length);
                      if (title) setCurrentVideoTitle(title);
                      if (duration) setCurrentVideoDuration(duration);
                      if (videoIds) setPlaylistVideoIds(videoIds);
                      
                      if (state === 0) {
                        const newWatched = [...(activePlaylist.watchedIndices || [])];
                        if (!newWatched.includes(index)) {
                          newWatched.push(index);
                          const progress = Math.round((newWatched.length / (length || 1)) * 100);
                          const newDurations = { ...(activePlaylist.videoDurations || {}) };
                          if (duration > 0) newDurations[index.toString()] = duration;
                          const totalDur = Object.values(newDurations).reduce((acc: number, curr: any) => acc + curr, 0);
                          
                          // Auto-mark when video ends naturally: No top-up
                          handleMarkWatched(index, sessionWatchTimeRef.current, false);
                        }
                      }
                    }}
                  />
                </div>

                <div className="p-8 rounded-[2.5rem] bg-dark-200 border border-white/5 space-y-6 shadow-xl">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-2 flex-1">
                      <h2 className="text-3xl font-black text-white leading-tight tracking-tight">{currentVideoTitle || "Loading video title..."}</h2>
                      <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                         <span>Video #{currentVideoIndex + 1} of {playlistLength}</span>
                         <span className="w-1 h-1 rounded-full bg-white/20" />
                         <span>{activePlaylist.name}</span>
                      </div>
                    </div>
                    <Button 
                      onClick={() => handleMarkWatched()}
                      disabled={activePlaylist.watchedIndices?.includes(currentVideoIndex)}
                      className={cn(
                        "rounded-2xl px-10 py-7 font-black text-lg transition-all flex items-center gap-3 shadow-2xl shrink-0",
                        activePlaylist.watchedIndices?.includes(currentVideoIndex)
                          ? "bg-green-500/10 text-green-500 border border-green-500/20"
                          : "bg-white text-black hover:bg-white/90"
                      )}
                    >
                      <CheckCircle2 className="w-6 h-6" />
                      {activePlaylist.watchedIndices?.includes(currentVideoIndex) ? "WATCHED" : "MARK AS WATCHED"}
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-8 border-t border-white/5">
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total Playlist Progress</p>
                      <div className="flex items-center gap-3">
                         <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]" style={{ width: `${activePlaylist.progress}%` }} />
                         </div>
                         <span className="text-sm font-black text-primary">{activePlaylist.progress}%</span>
                      </div>
                    </div>
                    <div className="space-y-2 md:text-right">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total Learning Time</p>
                      <p className="text-2xl font-black text-white/90">{formatDuration(localWatchTime)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4 h-full flex flex-col max-h-[calc(100vh-200px)]">
                <div className="bg-dark-200 border border-white/10 rounded-[2.5rem] flex flex-col h-full overflow-hidden shadow-2xl backdrop-blur-xl">
                   <div className="p-6 border-b border-white/5 bg-white/2">
                      <h3 className="text-xl font-black text-white truncate">{activePlaylist.name}</h3>
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">
                         {activePlaylist.watchedIndices?.length || 0} / {playlistLength} COMPLETED
                      </p>
                   </div>
                   
                   <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                      {Array.from({ length: playlistLength || 0 }).map((_, idx) => (
                        <div 
                          key={idx}
                          onClick={() => playerRef.current?.playVideoAt(idx)}
                          className={cn(
                            "flex gap-4 p-3 rounded-2xl cursor-pointer transition-all hover:bg-white/5 group",
                            currentVideoIndex === idx ? "bg-white/10" : ""
                          )}
                        >
                           <div className="flex items-center text-[10px] font-black text-muted-foreground w-4 shrink-0">
                             {currentVideoIndex === idx ? <Play className="w-3 h-3 text-primary fill-primary" /> : idx + 1}
                           </div>
                           
                           <div className="relative w-32 aspect-video rounded-xl overflow-hidden shrink-0 bg-dark-300">
                             {playlistVideoIds[idx] ? (
                               <img 
                                 src={`https://i.ytimg.com/vi/${playlistVideoIds[idx]}/mqdefault.jpg`}
                                 alt=""
                                 className="w-full h-full object-cover"
                               />
                             ) : (
                               <div className="w-full h-full flex items-center justify-center">
                                 <Play className="w-4 h-4 text-white/10" />
                               </div>
                             )}
                             {activePlaylist.watchedIndices?.includes(idx) && (
                               <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center backdrop-blur-[1px]">
                                 <CheckCircle2 className="w-6 h-6 text-green-500 drop-shadow-lg" />
                               </div>
                             )}
                           </div>

                           <div className="flex flex-col gap-1 overflow-hidden">
                              <h4 className={cn(
                                "text-xs font-bold line-clamp-2 leading-tight transition-colors",
                                currentVideoIndex === idx ? "text-primary" : "text-white/80"
                              )}>
                                {currentVideoIndex === idx && currentVideoTitle ? currentVideoTitle : `Video #${idx + 1}`}
                              </h4>
                              <div className="flex items-center gap-2">
                                 <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                                   {activePlaylist.watchedIndices?.includes(idx) ? "WATCHED" : "PENDING"}
                                 </span>
                              </div>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const YoutubePlayer = forwardRef(({ 
  playlistId, 
  onStateChange,
  onWatchTimeUpdate
}: { 
  playlistId: string, 
  onStateChange: (state: number, index: number, length?: number, title?: string, duration?: number, videoIds?: string[]) => void,
  onWatchTimeUpdate: (delta: number) => void
}, ref) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<any>(null);
  const onStateChangeRef = useRef(onStateChange);
  const onWatchTimeUpdateRef = useRef(onWatchTimeUpdate);

  useEffect(() => {
    onWatchTimeUpdateRef.current = onWatchTimeUpdate;
  }, [onWatchTimeUpdate]);

  useEffect(() => {
    onStateChangeRef.current = onStateChange;
  }, [onStateChange]);

  useImperativeHandle(ref, () => ({
    playVideoAt: (index: number) => {
      if (playerRef.current && typeof playerRef.current.playVideoAt === 'function') {
        playerRef.current.playVideoAt(index);
      }
    },
    getPlayerState: () => {
      return playerRef.current?.getPlayerState();
    },
    getDuration: () => {
      return playerRef.current?.getDuration() || 0;
    },
    getCurrentTime: () => {
      return playerRef.current?.getCurrentTime() || 0;
    }
  }));

  useEffect(() => {
    const initPlayer = () => {
      if (typeof window !== 'undefined' && (window as any).YT) {
        playerRef.current = new (window as any).YT.Player('youtube-player', {
          events: {
            onStateChange: (event: any) => {
              const player = event.target;
              const index = player.getPlaylistIndex();
              const playlist = player.getPlaylist();
              const title = player.getVideoData().title;
              const duration = player.getDuration();
              onStateChangeRef.current(event.data, index, playlist?.length, title, duration, playlist);
            },
            onReady: (event: any) => {
              playerRef.current = event.target;
              // Immediate sync on load to detect new videos added on YouTube
              const index = playerRef.current.getPlaylistIndex();
              const playlist = playerRef.current.getPlaylist();
              const title = playerRef.current.getVideoData().title;
              const duration = playerRef.current.getDuration();
              if (playlist && playlist.length > 0) {
                onStateChangeRef.current(-1, index || 0, playlist.length, title, duration, playlist);
              }
            }
          }
        });
      }
    };

    if (!(window as any).YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      (window as any).onYouTubeIframeAPIReady = initPlayer;
    } else if ((window as any).YT.Player) {
      initPlayer();
    }

    const checkProgress = setInterval(() => {
      if (playerRef.current && typeof playerRef.current.getPlayerState === 'function') {
        const state = playerRef.current.getPlayerState();
        if (state === 1) { // Playing
           try {
             const playbackRate = playerRef.current.getPlaybackRate() || 1;
             const delta = 5 * playbackRate;
             onWatchTimeUpdateRef.current(delta);
           } catch (e) {}
        }
      }
    }, 5000);

    return () => {
      clearInterval(checkProgress);
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        try {
          playerRef.current.destroy();
        } catch (e) {}
        playerRef.current = null;
      }
    };
  }, [playlistId]);

  const origin = typeof window !== 'undefined' ? window.location.origin.replace(/\/$/, '') : 'http://localhost:3000';

  return (
    <iframe
      id="youtube-player"
      key={playlistId}
      ref={iframeRef}
      className="w-full h-full"
      src={`https://www.youtube.com/embed/videoseries?list=${playlistId}&enablejsapi=1&origin=${origin}&rel=0&modestbranding=1&theme=dark&force_dark=1`}
      title="YouTube Playlist Player"
      frameBorder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
    />
  );
});

YoutubePlayer.displayName = "YoutubePlayer";

const AnalyticsDashboard = ({ playlists, formatDuration }: { playlists: Playlist[], formatDuration: (s: number) => string }) => {
  const totalGlobalWatchTime = playlists.reduce((acc, p) => acc + (p.cumulativeWatchTime || 0), 0);
  const averageProgress = playlists.length > 0 
    ? playlists.reduce((acc, p) => acc + p.progress, 0) / playlists.length 
    : 0;

  return (
    <div className="p-8 rounded-[2.5rem] bg-dark-200 border border-white/5 space-y-8 shadow-2xl h-full backdrop-blur-3xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="relative space-y-6">
        <h3 className="text-2xl font-black text-white flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <Search className="w-6 h-6" />
          </div>
          ANALYTICS DASHBOARD
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-5 rounded-3xl bg-white/5 border border-white/5 space-y-2">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total Watch Time</p>
            <p className="text-3xl font-black text-primary">{formatDuration(totalGlobalWatchTime)}</p>
          </div>
          <div className="p-5 rounded-3xl bg-white/5 border border-white/5 space-y-2">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Avg. Progress</p>
            <p className="text-3xl font-black text-green-500">{Math.round(averageProgress)}%</p>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Playlist Performance</p>
          <div className="h-64 w-full flex items-end justify-between gap-6 px-4 pt-12 bg-white/2 rounded-[2.5rem] border border-white/5 relative group/chart">
            {(() => {
              // Sort: Active playlists first, Deleted playlists at the end
              const displayPlaylists = [...playlists].sort((a, b) => {
                if (a.isDeleted === b.isDeleted) return 0;
                return a.isDeleted ? 1 : -1;
              });

              const maxDuration = Math.max(...displayPlaylists.map(p => p.cumulativeWatchTime || 0), 3600);
              
              return displayPlaylists.slice(0, 5).map((p, i) => {
                const barHeight = Math.max(((p.cumulativeWatchTime || 0) / maxDuration) * 100, 4);
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-4 group h-full">
                    <div className="relative w-full flex flex-col justify-end h-full">
                      <div 
                        className={cn(
                          "w-full rounded-2xl transition-all duration-1000 group-hover:scale-x-[1.05] group-hover:brightness-125 relative",
                          p.isDeleted 
                            ? "bg-gradient-to-t from-red-500/10 via-red-500/40 to-red-500 shadow-[0_0_40px_rgba(239,68,68,0.1)] opacity-60" 
                            : "bg-gradient-to-t from-primary/20 via-primary/60 to-primary shadow-[0_0_40px_rgba(var(--primary),0.1)]"
                        )}
                        style={{ height: `${barHeight}%` }}
                      >
                          <div className="absolute inset-x-2 top-2 h-8 bg-white/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 scale-75 group-hover:scale-100 bg-white px-3 py-1.5 rounded-xl text-[10px] font-black text-black whitespace-nowrap shadow-[0_10px_30px_rgba(0,0,0,0.5)] z-20">
                            {formatDuration(p.cumulativeWatchTime || 0)}
                          </div>
                       </div>
                    </div>
                    <div className="flex flex-col items-center gap-1 w-full pb-2">
                      <span className={cn(
                        "text-[10px] font-black uppercase truncate w-full text-center group-hover:text-primary transition-colors",
                        p.isDeleted ? "text-red-500/70" : "text-muted-foreground"
                      )}>
                        {p.name.substring(0, 10)}
                      </span>
                      {p.isDeleted ? (
                        <span className="text-[7px] font-black text-red-500 uppercase tracking-tighter">REMOVED</span>
                      ) : (
                        <div className="px-2 py-0.5 rounded-full bg-white/5 border border-white/5">
                          <span className="text-[8px] font-black text-primary uppercase">{p.progress}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              });
            })()}
            {playlists.length === 0 && <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-xs italic">No data available</div>}
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-white/5">
           <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Recent Activity</p>
           <div className="space-y-3">
             {playlists
               .sort((a, b) => (a.isDeleted === b.isDeleted ? 0 : a.isDeleted ? 1 : -1))
               .slice(0, 3)
               .map((p, i) => (
                 <div key={i} className="flex items-center justify-between text-xs p-3 rounded-2xl bg-white/2">
                   <div className="flex items-center gap-2">
                     <span className={cn(
                       "font-bold line-clamp-1",
                       p.isDeleted ? "text-white/40" : "text-white/70"
                     )}>
                       {p.name}
                     </span>
                     {p.isDeleted && (
                       <span className="text-[8px] font-black text-red-500 uppercase">REMOVED</span>
                     )}
                   </div>
                   <span className="text-muted-foreground font-mono">{formatDuration(p.cumulativeWatchTime || 0)}</span>
                 </div>
               ))}
           </div>
        </div>
      </div>
    </div>
  );
};
