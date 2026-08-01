import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.VANA_APP_URL || "https://chargesignal-production-101d.up.railway.app"),
  title: "Threadprint",
  description: "A private, portable collaboration profile built from user-approved AI history through Vana.",
  icons: { icon: "/icon.png", shortcut: "/icon.png" },
  openGraph: {
    title: "Threadprint — See the patterns in your AI conversations",
    description: "Turn user-approved ChatGPT and Claude history into a portable guide to how you think and work.",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
