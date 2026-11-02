import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AdminKeyListener from "@/components/AdminKeyListener";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Md Rajob Ali | Senior Video Editor & Graphics Designer",
  description:
    "Official creative portfolio of Md Rajob Ali — Senior Video Editor, Motion & Graphics Designer and Generative AI Creative Specialist. Available worldwide.",
  keywords: [
    "Md Rajob Ali",
    "Video Editor",
    "Graphics Designer",
    "Reels Editor",
    "DaVinci Resolve",
    "Premiere Pro",
    "After Effects",
    "Midjourney",
    "Runway Gen-3",
    "Dhaka Bangladesh",
  ],
  authors: [{ name: "Md Rajob Ali" }],
  openGraph: {
    title: "Md Rajob Ali | Senior Video Editor & Graphics Designer",
    description:
      "Transforming raw footage & ideas into cinematic stories, viral social reels, and striking visual identities.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="bn"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col selection:bg-amber-200 selection:text-amber-950">
        <AdminKeyListener />
        {children}
      </body>
    </html>
  );
}
