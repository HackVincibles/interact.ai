"use server";

import { cookies } from "next/headers";
import apiClient from "../api-client";

// Set session cookie in the Next.js environment
export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();

  cookieStore.set("session", token, {
    maxAge: 60 * 60 * 24 * 7, // 1 week
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    sameSite: "lax",
  });
}

// Clear session cookie
export async function removeSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}

// Sign In
export async function signIn({ email, password }: any) {
  try {
    const response = await apiClient.post("/auth/login", { email, password });
    
    if (response.data.success) {
      // In a real product, the Express server sets the cookie, 
      // but in Next.js Server Actions we often set it locally for the SSR environment.
      const token = response.headers['set-cookie']?.[0]?.split(';')[0]?.split('=')[1];
      if (token) await setSessionCookie(token);
      
      return { success: true, user: response.data.user };
    }
    return { success: false, message: response.data.message };
  } catch (error: any) {
    return { success: false, message: error.response?.data?.message || "Login failed" };
  }
}

// Sign Up
export async function signUp({ name, email, password }: any) {
  try {
    const response = await apiClient.post("/auth/register", { name, email, password });
    
    if (response.data.success) {
      return { success: true };
    }
    return { success: false, message: response.data.message };
  } catch (error: any) {
    return { success: false, message: error.response?.data?.message || "Registration failed" };
  }
}

// Logout
export async function signOut() {
  try {
    await apiClient.get("/auth/logout");
    await removeSessionCookie();
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

// Get Current User
export async function getCurrentUser(): Promise<any | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session")?.value;

  if (!sessionToken) return null;

  try {
    const response = await apiClient.get("/auth/me", {
      headers: {
        Cookie: `session=${sessionToken}`
      }
    });

    return response.data.success ? response.data.user : null;
  } catch (error) {
    return null;
  }
}

export async function isAuthenticated() {
  const user = await getCurrentUser();
  return !!user;
}

// Password Reset Actions (OTP)
export async function forgotPassword(email: string) {
  try {
    const response = await apiClient.post("/auth/forgotpassword", { email });
    return response.data;
  } catch (error: any) {
    return { success: false, message: error.response?.data?.message || "Failed to send OTP" };
  }
}

export async function verifyOTP(email: string, otp: string) {
  try {
    const response = await apiClient.post("/auth/verifyotp", { email, otp });
    return response.data;
  } catch (error: any) {
    return { success: false, message: error.response?.data?.message || "Invalid OTP" };
  }
}

export async function resetPassword({ email, otp, password }: any) {
  try {
    const response = await apiClient.post("/auth/resetpassword", { email, otp, password });
    return response.data;
  } catch (error: any) {
    return { success: false, message: error.response?.data?.message || "Reset failed" };
  }
}
