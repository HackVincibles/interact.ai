

import { Toaster } from "sonner";
import type { Metadata } from "next";
import { Mona_Sans } from "next/font/google";
import { getCurrentUser } from "@/lib/actions/auth.action";
import ClientHeader from "@/components/ClientHeader";
import ClientHeaderWrapper from "@/components/ClientHeaderWrapper";

import "./globals.css";

const monaSans = Mona_Sans({
  variable: "--font-mona-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Interact.ai",
  description: "An AI-powered platform for preparing for mock interviews",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>

        <meta name="theme-color" content="#000000" />
        <meta name="color-scheme" content="light dark" />
        {/* Theme initialization script - prevents flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const theme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${monaSans.className} antialiased`}>
        <ClientHeaderWrapper initialUser={user} />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
