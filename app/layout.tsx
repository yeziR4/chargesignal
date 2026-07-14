import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.VANA_APP_URL || "https://chargesignal.example"),
  title: "ChargeSignal",
  description: "Private subscription forecasts from your Gmail receipt history, powered by Vana.",
  icons: { icon: "/icon.png", shortcut: "/icon.png" },
  openGraph: {
    title: "ChargeSignal — See your next charge before it lands",
    description: "Turn Gmail receipt history into a private forecast of subscriptions and renewals.",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
