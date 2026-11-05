import type { Metadata, Viewport } from "next";
import { RegisterSW } from "@/components/RegisterSW";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sui sentieri degli Gnomi",
  description: "Caccia al tesoro narrata nel Parco di Monza per bambini dai 3 ai 5 anni.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Gnomi", statusBarStyle: "default" },
  icons: { icon: "/icons/icon.svg", apple: "/icons/icon.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#2f4a2b",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>
        {children}
        <RegisterSW />
      </body>
    </html>
  );
}
