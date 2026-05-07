"use client";

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:5000";
const BASE = `${SERVER_URL}/api/chat`;

async function apiFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || "Request failed");
  }
  return res.json();
}

export async function createSession(mode: "interview" | "tech-helper", interviewConfig?: any) {
  return apiFetch("/sessions", {
    method: "POST",
    body: JSON.stringify({ mode, interviewConfig }),
  });
}

export async function getUserSessions(mode?: string) {
  const q = mode ? `?mode=${mode}` : "";
  return apiFetch(`/sessions${q}`);
}

export async function getSession(sessionId: string) {
  return apiFetch(`/sessions/${sessionId}`);
}

export async function deleteSession(sessionId: string) {
  return apiFetch(`/sessions/${sessionId}`, { method: "DELETE" });
}

export async function renameSession(sessionId: string, title: string) {
  return apiFetch(`/sessions/${sessionId}/title`, {
    method: "PATCH",
    body: JSON.stringify({ title }),
  });
}

export async function endInterview(sessionId: string) {
  return apiFetch(`/sessions/${sessionId}/end-interview`, { method: "POST" });
}

// Streaming send — returns a ReadableStream
export function streamMessage(sessionId: string, content: string): Promise<Response> {
  return fetch(`${BASE}/sessions/${sessionId}/message`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
}
