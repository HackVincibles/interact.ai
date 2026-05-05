"use server";

import apiClient from "../api-client";

export async function createFeedback(params: any) {
  try {
    const response = await apiClient.post("/interviews/feedback", params);
    return response.data;
  } catch (error: any) {
    console.error("Error saving feedback:", error);
    return { success: false };
  }
}

export async function getInterviewById(id: string): Promise<any | null> {
  try {
    const response = await apiClient.get(`/interviews/${id}`);
    return response.data.success ? response.data.data : null;
  } catch (error) {
    return null;
  }
}

export async function getFeedbackByInterviewId(params: any): Promise<any | null> {
  try {
    const response = await apiClient.get(`/interviews/${params.interviewId}/feedback`);
    return response.data.success ? response.data.data : null;
  } catch (error) {
    return null;
  }
}

export async function getInterviewsByUserId(userId: string): Promise<any[] | null> {
  try {
    const response = await apiClient.get(`/interviews/user/${userId}`);
    return response.data.success ? response.data.data : null;
  } catch (error) {
    return [];
  }
}

// Keep the latest interviews logic for now, but pointing to API
export async function getLatestInterviews(params: any): Promise<any[] | null> {
  // This could be a separate global feed endpoint later
  return getInterviewsByUserId(params.userId);
}
