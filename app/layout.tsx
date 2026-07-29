import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.VANA_APP_URL || "https://chargesignal.example"),
  title: "ChargeSignal",
  description: "Private spending forecasts from your Amazon, Shop, and Uber history, powered by Vana.",
  icons: { icon: "/icon.png", shortcut: "/icon.png" },
  openGraph: {
    title: "ChargeSignal — Know what you’ll spend next",
    description: "Turn user-approved commerce history into private repeat-purchase and spending signals.",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
