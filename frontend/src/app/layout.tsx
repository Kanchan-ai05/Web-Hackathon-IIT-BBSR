import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chilika Institute of Technology - Scheduling Platform",
  description: "Academic timetable, exam schedule, and venue management platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}
