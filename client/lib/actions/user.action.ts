"use server";

import apiClient from "../api-client";
import { revalidatePath } from "next/cache";

export async function updateProfile(data: any) {
  try {
    const response = await apiClient.put("/users/profile", data);
    revalidatePath("/profile");
    return response.data;
  } catch (error: any) {
    return { success: false, message: error.response?.data?.message || "Update failed" };
  }
}

export async function updateAvatar(formData: FormData) {
  try {
    const response = await apiClient.put("/users/avatar", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    revalidatePath("/profile");
    return response.data;
  } catch (error: any) {
    return { success: false, message: error.response?.data?.message || "Upload failed" };
  }
}

export async function deleteAvatar() {
  try {
    const response = await apiClient.delete("/users/avatar");
    revalidatePath("/profile");
    return response.data;
  } catch (error: any) {
    return { success: false, message: error.response?.data?.message || "Delete failed" };
  }
}

export async function updateResume(formData: FormData) {
  try {
    const response = await apiClient.put("/users/resume", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    revalidatePath("/profile");
    return response.data;
  } catch (error: any) {
    return { success: false, message: error.response?.data?.message || "Resume upload failed" };
  }
}

export async function triggerForgotPassword(email: string) {
  try {
    const response = await apiClient.post("/auth/forgotpassword", { email });
    return response.data;
  } catch (error: any) {
    return { success: false, message: error.response?.data?.message || "Failed to send reset link" };
  }
}

export async function deleteResume() {
  try {
    const response = await apiClient.delete("/users/resume");
    revalidatePath("/profile");
    return response.data;
  } catch (error: any) {
    return { success: false, message: error.response?.data?.message || "Delete failed" };
  }
}

export async function requestDeleteOTP() {
  try {
    const response = await apiClient.post("/users/request-delete");
    return response.data;
  } catch (error: any) {
    return { success: false, message: error.response?.data?.message || "Failed to send deletion OTP" };
  }
}

export async function confirmDeleteAccount(otp: string) {
  try {
    const response = await apiClient.post("/users/confirm-delete", { otp });
    return response.data;
  } catch (error: any) {
    return { success: false, message: error.response?.data?.message || "Account deletion failed" };
  }
}
