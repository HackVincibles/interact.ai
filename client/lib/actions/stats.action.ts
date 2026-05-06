"use server";

import { cookies } from "next/headers";
import apiClient from "../api-client";

// ─── Dashboard stats ─────────────────────────────────────────────────────────
export async function getDashboardStats() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session")?.value;
  if (!sessionToken) return null;

  try {
    const response = await apiClient.get("/stats/dashboard", {
      headers: { Cookie: `session=${sessionToken}` },
    });
    return response.data.success ? response.data.data : null;
  } catch {
    return null;
  }
}

// ─── Complete a session (awards XP) ──────────────────────────────────────────
export async function completeSession(type: "interview" | "code" | "gd", score?: number) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session")?.value;
  if (!sessionToken) return null;

  try {
    const response = await apiClient.post(
      "/stats/complete-session",
      { type, score },
      { headers: { Cookie: `session=${sessionToken}` } }
    );
    return response.data.success ? response.data.data : null;
  } catch {
    return null;
  }
}

// ─── Onboarding ───────────────────────────────────────────────────────────────
export async function completeOnboarding(data: {
  targetRole: string;
  targetCompanies: string[];
  experienceLevel: string;
  weeklyGoal: number;
}) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session")?.value;
  if (!sessionToken) return null;

  try {
    const response = await apiClient.post("/stats/onboarding", data, {
      headers: { Cookie: `session=${sessionToken}` },
    });
    return response.data;
  } catch {
    return null;
  }
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────
export async function getLeaderboard(limit = 10) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session")?.value;
  if (!sessionToken) return null;

  try {
    const response = await apiClient.get(`/stats/leaderboard?limit=${limit}`, {
      headers: { Cookie: `session=${sessionToken}` },
    });
    return response.data.success ? response.data.data : null;
  } catch {
    return null;
  }
}

// ─── AI Code Review ───────────────────────────────────────────────────────────
export async function reviewCode(params: {
  code: string;
  language: string;
  problem?: string;
}) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session")?.value;
  if (!sessionToken) return null;

  try {
    const response = await apiClient.post("/code/review", params, {
      headers: { Cookie: `session=${sessionToken}` },
    });
    return response.data.success ? response.data.data : null;
  } catch (error: any) {
    console.error("Code review error:", error);
    return null;
  }
}
