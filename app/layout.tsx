import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { ConvexClientProvider } from "@/components/providers/ConvexClientProvider";

export const metadata: Metadata = {
  title: "Шагай Харваа",
  description: "Монгол үндэсний харваа бүртгэлийн систем",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="mn">
        <head>
          <meta name="theme-color" content="#ffffff" />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link
            href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
            rel="stylesheet"
          />
        </head>
        <body className="antialiased min-h-screen">
          <ConvexClientProvider>
            <main className="relative min-h-screen noise">
              {children}
            </main>
          </ConvexClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
