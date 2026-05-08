import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import PWAInstall from "@/components/PWAInstall";

export const metadata: Metadata = {
  title: "גמרא — כיתה יא",
  description: "אפליקציית לימוד גמרא להכנה למבחנים",
  manifest: "/manifest.webmanifest",
  applicationName: "גמרא יא",
  appleWebApp: {
    capable: true,
    title: "גמרא יא",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#1e3a5f",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;600;700;800&family=Frank+Ruhl+Libre:wght@400;500;700&display=swap"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
        <PWAInstall />
      </body>
    </html>
  );
}
