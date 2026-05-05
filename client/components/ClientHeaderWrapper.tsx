"use client";

import { usePathname } from "next/navigation";
import ClientHeader from "./ClientHeader";
import { User } from "@/types";

interface ClientHeaderWrapperProps {
  initialUser: User | null;
}

export default function ClientHeaderWrapper({ initialUser }: ClientHeaderWrapperProps) {
  const pathname = usePathname();
  
  // Don't render the header on the landing page or zoom session
  if (pathname === "/landing" || pathname.startsWith("/zoom-session")) {
    return null;
  }
  
  return <ClientHeader initialUser={initialUser} />;
}
