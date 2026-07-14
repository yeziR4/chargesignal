import type { Metadata } from "next";
import { SubscriptionDashboard } from "./subscription-dashboard";

export const metadata: Metadata = {
  title: "ChargeSignal — See your next charge before it lands",
  description: "A private subscription and receipt forecast powered by your Vana data.",
};

export default function Home() {
  return <SubscriptionDashboard />;
}

