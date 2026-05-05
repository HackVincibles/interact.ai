import { Router } from "express";
import axios from "axios";
import { generateSignature } from "../services/zoomService";

const router = Router();

// Get Zoom API credentials from environment
const getZoomCredentials = () => ({
  ZOOM_ACCOUNT_ID: process.env.ZOOM_ACCOUNT_ID,
  ZOOM_CLIENT_ID: process.env.ZOOM_CLIENT_ID,
  ZOOM_CLIENT_SECRET: process.env.ZOOM_CLIENT_SECRET,
});

// Cache for access token
let accessToken: string | null = null;
let tokenExpiresAt: number = 0;

/**
 * Get Zoom access token using Server-to-Server OAuth
 */
const getZoomAccessToken = async (): Promise<string> => {
  // Return cached token if still valid
  if (accessToken && Date.now() < tokenExpiresAt) {
    return accessToken;
  }

  const { ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET } = getZoomCredentials();

  if (!ZOOM_ACCOUNT_ID || !ZOOM_CLIENT_ID || !ZOOM_CLIENT_SECRET) {
    throw new Error("Zoom API credentials not configured");
  }

  try {
    const authString = Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString("base64");
    
    const response = await axios.post(
      "https://api.zoom.us/oauth/token",
      new URLSearchParams({
        grant_type: "account_credentials",
        account_id: ZOOM_ACCOUNT_ID,
      }).toString(),
      {
        headers: {
          Authorization: `Basic ${authString}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    accessToken = response.data.access_token;
    // Set expiration 5 minutes before actual expiry
    tokenExpiresAt = Date.now() + (response.data.expires_in - 300) * 1000;
    
    return accessToken as string;
  } catch (error) {
    console.error("Error getting Zoom access token:", error);
    throw new Error("Failed to authenticate with Zoom");
  }
};

/**
 * POST /api/zoom/create-meeting
 * Create a new Zoom meeting
 */
router.post("/create-meeting", async (req, res) => {
  try {
    console.log("🚀 MEETING CREATION REQUEST RECEIVED");
    console.log("📋 Request body:", req.body);
    
    const { topic, duration, password } = req.body;
    console.log("📝 Topic:", topic);
    console.log("⏱️ Duration:", duration);
    console.log("🔐 Password:", password || "auto-generated");

    // Validate request
    if (!topic || typeof topic !== "string") {
      console.log("❌ VALIDATION FAILED: Topic is required");
      return res.status(400).json({
        success: false,
        error: "Topic is required",
      });
    }

    // Check if Zoom is configured
    const { ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET } = getZoomCredentials();
    console.log("🔑 Zoom Credentials Check:");
    console.log("   - Account ID:", ZOOM_ACCOUNT_ID ? "✅ Configured" : "❌ Missing");
    console.log("   - Client ID:", ZOOM_CLIENT_ID ? "✅ Configured" : "❌ Missing");
    console.log("   - Client Secret:", ZOOM_CLIENT_SECRET ? "✅ Configured" : "❌ Missing");
    
    if (!ZOOM_ACCOUNT_ID || !ZOOM_CLIENT_ID || !ZOOM_CLIENT_SECRET) {
      console.log("❌ ZOOM API NOT CONFIGURED");
      return res.status(503).json({
        success: false,
        error: "Zoom API not configured",
        requiresSetup: true,
      });
    }

    console.log("🔐 Getting Zoom access token...");
    const token = await getZoomAccessToken();
    console.log("✅ Access token obtained successfully");

    // Create meeting
    console.log("📞 Creating Zoom meeting...");
    console.log("🌐 API URL:", `https://api.zoom.us/v2/users/me/meetings`);
    
    const meetingData = {
      topic,
      type: 2, // Scheduled meeting - better compatibility with Embedded SDK
      duration: duration || 30,
      timezone: "UTC",
      password: password || Math.random().toString(36).substring(2, 8),
      settings: {
        host_video: true,
        participant_video: true,
        join_before_host: true,
        mute_upon_entry: false,
        waiting_room: false,
        auto_recording: "none",
        enforce_login: false,
        approval_type: 2, // No registration required
      },
    };
    
    console.log("📋 Meeting data:", JSON.stringify(meetingData, null, 2));
    
    const response = await axios.post(
      `https://api.zoom.us/v2/users/me/meetings`,
      meetingData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Zoom API Response Status:", response.status);
    console.log("📊 Zoom API Response Data:", JSON.stringify(response.data, null, 2));

    return res.status(200).json({
      success: true,
      meetingId: response.data.id.toString(),
      joinUrl: response.data.join_url,
      startUrl: response.data.start_url,
      password: response.data.password,
      topic: response.data.topic,
      duration: response.data.duration,
    });

  } catch (error: any) {
    console.error("💥 ERROR CREATING ZOOM MEETING");
    console.error("🔍 Error Type:", error.constructor.name);
    console.error("📝 Error Message:", error.message);
    
    if (axios.isAxiosError(error)) {
      console.error("🌐 Axios Error Details:");
      console.error("   - Status:", error.response?.status);
      console.error("   - Status Text:", error.response?.statusText);
      console.error("   - Data:", error.response?.data);
      console.error("   - Headers:", error.response?.headers);
      console.error("   - URL:", error.config?.url);
      
      return res.status(error.response?.status || 500).json({
        success: false,
        error: error.response?.data?.message || "Failed to create Zoom meeting",
        details: error.response?.data,
      });
    }

    console.error("🔥 Non-Axios Error - Stack Trace:");
    console.error(error.stack);

    return res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error.message,
    });
  }
});

/**
 * DELETE /api/zoom/meetings/:meetingId
 * Delete a Zoom meeting
 */
router.delete("/meetings/:meetingId", async (req, res) => {
  try {
    const { meetingId } = req.params;

    const { ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET } = getZoomCredentials();

    if (!ZOOM_ACCOUNT_ID || !ZOOM_CLIENT_ID || !ZOOM_CLIENT_SECRET) {
      return res.status(503).json({
        success: false,
        error: "Zoom API not configured",
      });
    }

    const token = await getZoomAccessToken();

    await axios.delete(
      `https://api.zoom.us/v2/meetings/${meetingId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return res.status(200).json({
      success: true,
      message: "Meeting deleted successfully",
    });

  } catch (error) {
    console.error("Error deleting Zoom meeting:", error);
    
    return res.status(500).json({
      success: false,
      error: "Failed to delete meeting",
    });
  }
});

/**
 * POST /api/zoom/signature
 * Generate signature for Zoom Web SDK
 */
router.post("/signature", (req, res) => {
  try {
    const { meetingNumber, role } = req.body;

    if (!meetingNumber) {
      return res.status(400).json({
        success: false,
        error: "Meeting number is required",
      });
    }

    const { ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET } = getZoomCredentials();

    if (!ZOOM_CLIENT_ID || !ZOOM_CLIENT_SECRET) {
      return res.status(503).json({
        success: false,
        error: "Zoom SDK credentials not configured",
      });
    }

    // Generate signature using the professional service
    console.log(`🔐 Generating signature for Meeting: ${meetingNumber}, Role: ${role || 0}`);
    const signature = generateSignature(meetingNumber.toString(), parseInt(role || 0));
    console.log(`✅ Signature generated: ${signature.substring(0, 20)}...`);

    return res.status(200).json({
      success: true,
      signature,
      sdkKey: ZOOM_CLIENT_ID
    });

  } catch (error) {
    console.error("Error generating signature:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to generate signature",
    });
  }
});

export default router;
