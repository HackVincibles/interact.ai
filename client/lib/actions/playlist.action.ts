"use server";

import apiClient from "../api-client";

export async function getPlaylists() {
  try {
    const response = await apiClient.get("/playlists");
    return response.data;
  } catch (error: any) {
    console.error("Error fetching playlists:", error);
    return { success: false, playlists: [] };
  }
}

export async function addPlaylist(params: { name: string; url: string; playlistId: string; thumbnail: string }) {
  try {
    const response = await apiClient.post("/playlists", params);
    return response.data;
  } catch (error: any) {
    console.error("Error adding playlist:", error);
    return { success: false, message: error.response?.data?.message || "Failed to add playlist" };
  }
}

export async function updatePlaylistProgress(
  id: string, 
  progress: number, 
  watchedIndices?: number[], 
  videoDurations?: any, 
  totalPlaylistDuration?: number,
  videoIds?: string[],
  cumulativeWatchTime?: number
) {
  try {
    const response = await apiClient.put(`/playlists/${id}/progress`, { 
      progress, 
      watchedIndices, 
      videoDurations, 
      totalPlaylistDuration,
      videoIds,
      cumulativeWatchTime
    });
    return response.data;
  } catch (error: any) {
    console.error("Error updating progress:", error);
    return { success: false };
  }
}

export async function deletePlaylist(id: string) {
  try {
    const response = await apiClient.delete(`/playlists/${id}`);
    return response.data;
  } catch (error: any) {
    console.error("Error deleting playlist:", error);
    return { success: false };
  }
}
