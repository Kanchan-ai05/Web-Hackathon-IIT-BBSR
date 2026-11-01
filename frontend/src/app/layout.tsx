import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "CIT Nexus – Smart Campus Intelligence Platform",
  description: "Advanced institutional scheduling, predictive conflict monitoring, AI copilot, and smart facility management.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#070B14] text-slate-100 font-sans antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

