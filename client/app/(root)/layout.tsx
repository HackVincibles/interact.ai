import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/actions/auth.action";
import Sidebar from "@/components/Sidebar";

const Layout = async ({ children }: { children: ReactNode }) => {
  const isUserAuthenticated = await isAuthenticated();
  if (!isUserAuthenticated) redirect("/landing");

  return (
    <div className="flex h-[calc(100vh-56px)] bg-dark-400 overflow-hidden">
      {/* Sidebar - Fixed on the left */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-y-auto bg-[url('/grid.svg')] bg-fixed bg-center custom-scrollbar">
        <div className="min-h-screen px-4 py-8 sm:px-8 sm:py-10">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
