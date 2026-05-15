import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { ToastProvider } from "@/components/Toast";
import { CommandPalette } from "@/components/CommandPalette";
import { BackgroundSwitcher } from "@/components/BackgroundSwitcher";
import { PageTransition } from "@/components/PageTransition";
import { NavbarWrapper } from "@/components/NavbarWrapper";
import { SecurityGuard } from "@/components/SecurityGuard";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Code DNA — Developer Fingerprint Analyzer",
  description: "Analyze your GitHub profile and generate your unique coding DNA across 8 dimensions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", inter.variable)}>
      <body className="antialiased bg-[#050505]">
        <SessionProvider>
          <ToastProvider>
            <SecurityGuard />
            <BackgroundSwitcher />
            <NavbarWrapper />
            <PageTransition>
              <div className="relative z-10">
                {children}
              </div>
            </PageTransition>
            <CommandPalette />
          </ToastProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
