import type { Metadata } from "next";
import { SubscriptionDashboard } from "./subscription-dashboard";

export const metadata: Metadata = {
  title: "ChargeSignal — Know what you’ll spend next",
  description: "A private repeat-purchase and spending forecast powered by your user-approved Vana data.",
};

export default function Home() {
  return <SubscriptionDashboard />;
}
