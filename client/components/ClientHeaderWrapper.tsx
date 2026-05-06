"use client";

import { usePathname } from "next/navigation";
import ClientHeader from "./ClientHeader";
import { User } from "@/types";

interface ClientHeaderWrapperProps {
  initialUser: User | null;
}

export default function ClientHeaderWrapper({ initialUser }: ClientHeaderWrapperProps) {
  const pathname = usePathname();
  
  // Don't render the header on the landing page
  if (pathname === "/landing") {
    return null;
  }
  
  return <ClientHeader initialUser={initialUser} />;
}
