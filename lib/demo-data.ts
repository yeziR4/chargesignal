import type { GmailReceipt } from "./recurrence";

const receipt = (id: string, date: string, sender: string, subject: string, snippet: string): GmailReceipt => ({ id, date, sender, subject, snippet });

export const demoReceipts: GmailReceipt[] = [
  receipt("nf-1", "2026-04-18T09:00:00Z", "Netflix <info@account.netflix.com>", "Your Netflix receipt", "We charged $15.49 for your monthly subscription."),
  receipt("nf-2", "2026-05-18T09:00:00Z", "Netflix <info@account.netflix.com>", "Your Netflix receipt", "Payment received: $15.49. Thank you."),
  receipt("nf-3", "2026-06-18T09:00:00Z", "Netflix <info@account.netflix.com>", "Your Netflix receipt", "We charged $15.49 for your subscription."),
  receipt("sp-1", "2026-05-05T12:15:00Z", "Spotify <no-reply@spotify.com>", "Receipt for your Spotify payment", "Your payment of $10.99 was successful."),
  receipt("sp-2", "2026-06-05T12:15:00Z", "Spotify <no-reply@spotify.com>", "Receipt for your Spotify payment", "Your monthly subscription was charged $10.99."),
  receipt("ad-1", "2026-05-27T16:45:00Z", "Adobe <mail@adobe.com>", "Adobe invoice available", "Your Creative Cloud subscription payment is $22.99."),
  receipt("ad-2", "2026-06-27T16:45:00Z", "Adobe <mail@adobe.com>", "Adobe invoice available", "Your Creative Cloud subscription was charged $22.99."),
  receipt("go-1", "2026-05-12T08:20:00Z", "Google One <payments-noreply@google.com>", "Your Google One receipt", "Payment received for cloud storage: $2.99."),
  receipt("go-2", "2026-06-12T08:20:00Z", "Google One <payments-noreply@google.com>", "Your Google One receipt", "Your subscription was charged $2.99."),
  receipt("ap-1", "2025-08-02T10:00:00Z", "Amazon Prime <prime@amazon.com>", "Your Amazon Prime renewal", "Annual subscription payment: $139.00."),
  receipt("ap-2", "2026-08-02T10:00:00Z", "Amazon Prime <prime@amazon.com>", "Your Amazon Prime renewal", "Annual subscription charged: $139.00."),
];

