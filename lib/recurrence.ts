export type GmailReceipt = {
  id: string;
  date: string;
  sender: string;
  subject: string;
  snippet: string;
};

export type SubscriptionForecast = {
  merchant: string;
  category: string;
  amount: number;
  currency: string;
  cadence: "Weekly" | "Monthly" | "Quarterly" | "Annual" | "Recurring";
  nextCharge: string;
  lastCharge: string;
  confidence: number;
  occurrences: number;
};

const MERCHANT_HINTS: Array<[RegExp, string, string]> = [
  [/netflix/i, "Netflix", "Entertainment"],
  [/spotify/i, "Spotify", "Music"],
  [/adobe/i, "Adobe Creative Cloud", "Creative tools"],
  [/google (one|storage)|googleone/i, "Google One", "Cloud storage"],
  [/microsoft|office 365/i, "Microsoft 365", "Productivity"],
  [/amazon prime/i, "Amazon Prime", "Shopping"],
  [/dropbox/i, "Dropbox", "Cloud storage"],
  [/notion/i, "Notion", "Productivity"],
  [/canva/i, "Canva", "Creative tools"],
  [/chatgpt|openai/i, "ChatGPT Plus", "AI tools"],
];

const RECEIPT_TERMS = /receipt|invoice|payment|charged|renewal|subscription|order confirmation|your bill/i;
const AMOUNT_PATTERNS = [
  /(?:USD|US\$|\$)\s?([0-9]+(?:,[0-9]{3})*(?:\.[0-9]{2})?)/i,
  /(?:NGN|₦)\s?([0-9]+(?:,[0-9]{3})*(?:\.[0-9]{2})?)/i,
  /(?:EUR|€)\s?([0-9]+(?:,[0-9]{3})*(?:\.[0-9]{2})?)/i,
  /(?:GBP|£)\s?([0-9]+(?:,[0-9]{3})*(?:\.[0-9]{2})?)/i,
];

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

function extractAmount(text: string) {
  for (const pattern of AMOUNT_PATTERNS) {
    const match = text.match(pattern);
    if (!match) continue;
    const token = match[0].toUpperCase();
    const currency = token.includes("₦") || token.includes("NGN")
      ? "NGN"
      : token.includes("€") || token.includes("EUR")
        ? "EUR"
        : token.includes("£") || token.includes("GBP")
          ? "GBP"
          : "USD";
    return { amount: Number(match[1].replaceAll(",", "")), currency };
  }
  return null;
}

function merchantFor(receipt: GmailReceipt) {
  const haystack = `${receipt.sender} ${receipt.subject} ${receipt.snippet}`;
  for (const [pattern, merchant, category] of MERCHANT_HINTS) {
    if (pattern.test(haystack)) return { merchant, category };
  }

  const senderName = receipt.sender
    .replace(/<[^>]+>/g, "")
    .replace(/[^a-z0-9 .&'-]/gi, " ")
    .trim()
    .replace(/\s+/g, " ");
  return { merchant: senderName || "Unknown merchant", category: "Subscription" };
}

function cadenceFor(days: number): SubscriptionForecast["cadence"] {
  if (days >= 5 && days <= 9) return "Weekly";
  if (days >= 25 && days <= 35) return "Monthly";
  if (days >= 80 && days <= 100) return "Quarterly";
  if (days >= 330 && days <= 400) return "Annual";
  return "Recurring";
}

export function findGmailReceipts(value: unknown): GmailReceipt[] {
  const found: GmailReceipt[] = [];
  const visit = (node: unknown) => {
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    if (!node || typeof node !== "object") return;
    const item = node as Record<string, unknown>;
    if (["id", "date", "sender", "subject", "snippet"].every((key) => typeof item[key] === "string")) {
      found.push(item as GmailReceipt);
      return;
    }
    Object.values(item).forEach(visit);
  };
  visit(value);
  return [...new Map(found.map((item) => [item.id, item])).values()];
}

export function forecastSubscriptions(receipts: GmailReceipt[], now = new Date()) {
  const grouped = new Map<string, Array<GmailReceipt & { parsedDate: Date; amount: number; currency: string; category: string }>>();

  for (const receipt of receipts) {
    const parsedDate = new Date(receipt.date);
    const text = `${receipt.subject} ${receipt.snippet}`;
    const price = extractAmount(text);
    if (Number.isNaN(parsedDate.getTime()) || !price || !RECEIPT_TERMS.test(text)) continue;
    const { merchant, category } = merchantFor(receipt);
    const key = `${merchant.toLowerCase()}::${price.currency}`;
    const existing = grouped.get(key) ?? [];
    existing.push({ ...receipt, parsedDate, ...price, category });
    grouped.set(key, existing);
  }

  const forecasts: SubscriptionForecast[] = [];
  for (const charges of grouped.values()) {
    if (charges.length < 2) continue;
    charges.sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime());
    const intervals = charges.slice(1).map((charge, index) =>
      (charge.parsedDate.getTime() - charges[index].parsedDate.getTime()) / 86_400_000,
    );
    const typicalInterval = median(intervals);
    if (typicalInterval < 5 || typicalInterval > 400) continue;
    const variance = intervals.reduce((sum, days) => sum + Math.abs(days - typicalInterval), 0) / intervals.length;
    const latest = charges.at(-1)!;
    const amounts = charges.map((charge) => charge.amount);
    const next = new Date(latest.parsedDate);
    next.setUTCDate(next.getUTCDate() + Math.round(typicalInterval));
    while (next < now) next.setUTCDate(next.getUTCDate() + Math.round(typicalInterval));
    forecasts.push({
      merchant: merchantFor(latest).merchant,
      category: latest.category,
      amount: median(amounts),
      currency: latest.currency,
      cadence: cadenceFor(typicalInterval),
      nextCharge: next.toISOString(),
      lastCharge: latest.parsedDate.toISOString(),
      confidence: Math.max(55, Math.min(98, Math.round(72 + charges.length * 6 - variance * 2))),
      occurrences: charges.length,
    });
  }

  return forecasts.sort((a, b) => Date.parse(a.nextCharge) - Date.parse(b.nextCharge));
}

