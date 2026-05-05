"use client";

import { useEffect, useRef } from "react";

export default function ZoomSessionPage() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    
    // Get parameters from URL
    const params = new URLSearchParams(window.location.search);
    const meetingNumber = params.get("meetingNumber") || "";
    const signature = params.get("signature") || "";
    const sdkKey = params.get("sdkKey") || "";
    const password = params.get("password") || "";
    const userName = params.get("userName") || "Participant";
    const userEmail = params.get("userEmail") || "";

    if (!meetingNumber || !signature) {
      console.error("Missing Zoom parameters");
      return;
    }

    const initZoom = async () => {
      try {
        const ZoomMtg = (window as any).ZoomMtg;
        if (!ZoomMtg) {
          console.error("ZoomMtg not found on window");
          return;
        }

        console.log("🎬 Iframe: Initializing Zoom SDK...");
        ZoomMtg.setZoomJSLib("https://source.zoom.us/6.0.0/lib", "/av");
        
        ZoomMtg.init({
          leaveUrl: window.location.origin + "/gd",
          success: () => {
            console.log("🎬 Iframe: Init success, joining...");
            ZoomMtg.join({
              meetingNumber: meetingNumber.trim(),
              signature,
              userName,
              password: password.trim(),
              userEmail,
              success: () => {
                console.log("✅ Iframe: Joined successfully");
              },
              error: (err: any) => {
                console.error("❌ Iframe: Join error", err);
              }
            });
          },
          error: (err: any) => {
            console.error("❌ Iframe: Init error", err);
          }
        });
        
        initialized.current = true;
      } catch (error) {
        console.error("💥 Iframe: Crash", error);
      }
    };

    const loadScripts = async () => {
      const scripts = [
        "https://source.zoom.us/6.0.0/lib/vendor/react.min.js",
        "https://source.zoom.us/6.0.0/lib/vendor/react-dom.min.js",
        "https://source.zoom.us/6.0.0/lib/vendor/redux.min.js",
        "https://source.zoom.us/6.0.0/lib/vendor/redux-thunk.min.js",
        "https://source.zoom.us/6.0.0/lib/vendor/lodash.min.js",
        "https://source.zoom.us/zoom-meeting-6.0.0.min.js"
      ];

      for (const src of scripts) {
        await new Promise((resolve) => {
          const script = document.createElement("script");
          script.src = src;
          script.onload = resolve;
          document.head.appendChild(script);
        });
      }
      
      initZoom();
    };

    loadScripts();
  }, []);

  return (
    <div id="zmmtg-root" style={{ width: "100%", height: "100%", position: "fixed", top: 0, left: 0, background: "black" }} />
  );
}
