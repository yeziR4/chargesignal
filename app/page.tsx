import type { Metadata } from "next";
import { ContextPassportApp } from "./context-passport";

export const metadata: Metadata = {
  title: "Threadprint — See the patterns in your AI conversations",
  description: "A private collaboration profile built from the ChatGPT and Claude history you approve through Vana.",
};

export default function Home() {
  return <ContextPassportApp />;
}
