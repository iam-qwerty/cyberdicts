import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Cyberdict - Gamified Cybersecurity Certification Prep",
  description:
    "Join small, focused leagues, perform daily micro-tasks, gain points and streaks, and collaborate with peers to boost your certification pass rate.",
  keywords: [
    "cybersecurity",
    "certification",
    "Security+",
    "CISSP",
    "CEH",
    "study group",
    "gamified learning",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${jetbrainsMono.variable} antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
