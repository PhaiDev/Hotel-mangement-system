import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SUMOTEL",
  description: "Room Management System",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SUMOTEL",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className={`${inter.className} bg-gray-950 text-white selection:bg-[#f59e0b]/30`}>
        <main className="min-h-screen relative overflow-x-hidden">
          <Providers>
            {children}
          </Providers>
        </main>
      </body>
    </html>
  );
}
