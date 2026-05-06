"use server";

import apiClient from "../api-client";

export const createGDRoom = async (topic: string, durationMinutes: number) => {
  try {
    const response = await apiClient.post("/gd/create-room", { topic, durationMinutes });
    return response.data;
  } catch (error: any) {
    console.error("Create GD Room Error:", error.response?.data || error.message);
    return { success: false, error: error.message };
  }
};

export const getGDSession = async (roomId: string) => {
  try {
    const response = await apiClient.get(`/gd/room/${roomId}`);
    return response.data;
  } catch (error: any) {
    console.error("Get GD Session Error:", error.response?.data || error.message);
    return { success: false, error: error.message };
  }
};

export const getGDToken = async () => {
  try {
    const response = await apiClient.get("/gd/token");
    return response.data;
  } catch (error: any) {
    console.error("Get GD Token Error:", error.response?.data || error.message);
    return { success: false, error: error.message };
  }
};

export const getActiveGDSessions = async () => {
  try {
    const response = await apiClient.get("/gd/sessions");
    return response.data;
  } catch (error: any) {
    console.error("Get Active GD Sessions Error:", error.response?.data || error.message);
    return { success: false, error: error.message };
  }
};

export const joinGDRoom = async (data: { roomId?: string; roomCode?: string }) => {
  try {
    const response = await apiClient.post("/gd/join-room", data);
    return response.data;
  } catch (error: any) {
    console.error("Join GD Room Error:", error.response?.data || error.message);
    return { success: false, error: error.message };
  }
};

export const updateGDState = async (sessionId: string, sessionState: string) => {
  try {
    const response = await apiClient.post("/gd/update-state", { sessionId, sessionState });
    return response.data;
  } catch (error: any) {
    console.error("Update GD State Error:", error.response?.data || error.message);
    return { success: false, error: error.message };
  }
};

export const completeGDSession = async (sessionId: string) => {
  try {
    const response = await apiClient.post("/gd/complete", { sessionId });
    return response.data;
  } catch (error: any) {
    console.error("Complete GD Session Error:", error.response?.data || error.message);
    return { success: false, error: error.message };
  }
};

export const getGDResults = async (sessionId: string) => {

  try {
    const response = await apiClient.get(`/gd/results/${sessionId}`);
    return response.data;
  } catch (error: any) {
    console.error("Get GD Results Error:", error.response?.data || error.message);
    return { success: false, error: error.message };
  }
};


export const updateGDMetrics = async (sessionId: string, userId: string, userName: string, metrics: any, transcript?: string) => {
  try {
    const response = await apiClient.post("/gd/update-metrics", { sessionId, userId, userName, metrics, transcript });
    return response.data;
  } catch (error: any) {
    console.error("Update GD Metrics Error:", error.response?.data || error.message);
    return { success: false, error: error.message };
  }
};

export const getPastGDSessions = async () => {
  try {
    const response = await apiClient.get("/gd/past-sessions");
    return response.data;
  } catch (error: any) {
    console.error("Get Past GD Sessions Error:", error.response?.data || error.message);
    return { success: false, error: error.message };
  }
};

