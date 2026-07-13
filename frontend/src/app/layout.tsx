import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";

const inter = Inter({ subsets: ["latin", "vietnamese"] });

export const metadata: Metadata = {
  title: "PPL Tracker – Giáo Án Cá Nhân",
  description: "Ứng dụng theo dõi giáo án PPL 2.0 cá nhân",
  manifest: "/manifest.json",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0f172a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className="dark">
      <body className={`${inter.className} bg-slate-950 text-slate-100 min-h-screen antialiased`}>
        {/* Main Content Area */}
        <div className="pb-20">
          {children}
        </div>
        {/* Bottom Navigation */}
        <BottomNav />
      </body>
    </html>
  );
}
