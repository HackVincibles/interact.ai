import axios from "axios";
import { cookies } from "next/headers";

const isServer = typeof window === "undefined";

const apiClient = axios.create({
  baseURL: `${isServer ? 'http://127.0.0.1:5000' : (process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5000')}/api`,
  withCredentials: true,
});

// Interceptor to attach session cookie when running in Server Actions
apiClient.interceptors.request.use(async (config) => {
  if (typeof window === "undefined") {
    // We are on the server (Server Action or SSR)
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;
    
    if (session) {
      config.headers.Cookie = `session=${session}`;
    }
  }
  return config;
});

export default apiClient;
