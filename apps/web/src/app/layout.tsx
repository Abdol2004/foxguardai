import type { Metadata, Viewport } from "next";
import { Toaster } from "react-hot-toast";
import { TopLoader } from "@/components/TopLoader";
import "./globals.css";

export const metadata: Metadata = {
  title: "FoxGuard",
  description: "AI community manager for Telegram",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <TopLoader />
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "#1c1c2a",
              color: "#e2e8f0",
              border: "1px solid rgba(255,255,255,0.07)",
              fontSize: "13px",
            },
          }}
        />
      </body>
    </html>
  );
}
