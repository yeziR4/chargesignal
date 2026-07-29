import type { CommerceSource } from "./vana";
import type { SubscriptionForecast } from "./recurrence";

export type CommerceAnalysisResult = {
  source: CommerceSource;
  recordCount: number;
  totalSpend: number;
  currency: string;
  forecasts: SubscriptionForecast[];
};

type SpendEvent = {
  id: string;
  date: string;
  merchant: string;
  category: string;
  amount: number;
  currency: string;
};

const objectRecords = (value: unknown) => {
  const records: Record<string, unknown>[] = [];
  const visit = (node: unknown) => {
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    if (!node || typeof node !== "object") return;
    const record = node as Record<string, unknown>;
    records.push(record);
    Object.values(record).forEach(visit);
  };
  visit(value);
  return records;
};

function amountFrom(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return 0;
  const match = value.replaceAll(",", "").match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

function currencyFrom(value: unknown, fallback = "USD") {
  if (typeof value === "string" && /^[A-Z]{3}$/i.test(value.trim())) return value.trim().toUpperCase();
  if (typeof value === "string") {
    if (value.includes("₦") || /NGN/i.test(value)) return "NGN";
    if (value.includes("€") || /EUR/i.test(value)) return "EUR";
    if (value.includes("£") || /GBP/i.test(value)) return "GBP";
  }
  return fallback;
}

function validDate(value: unknown) {
  if (typeof value !== "string") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function amazonEvents(records: Record<string, unknown>[]) {
  const events: SpendEvent[] = [];
  for (const order of records) {
    if (typeof order.orderId !== "string" || !Array.isArray(order.items)) continue;
    const date = validDate(order.orderDate);
    if (!date) continue;
    const orderCurrency = currencyFrom(order.orderTotal);
    for (const [index, itemValue] of order.items.entries()) {
      if (!itemValue || typeof itemValue !== "object") continue;
      const item = itemValue as Record<string, unknown>;
      if (typeof item.name !== "string") continue;
      events.push({
        id: `${order.orderId}:${index}`,
        date,
        merchant: item.name.trim() || "Amazon purchase",
        category: "Amazon",
        amount: amountFrom(item.price) || amountFrom(order.orderTotal) / Math.max(order.items.length, 1),
        currency: currencyFrom(item.price, orderCurrency),
      });
    }
  }
  return events;
}

function shopEvents(records: Record<string, unknown>[]) {
  return records.flatMap((order): SpendEvent[] => {
    if (typeof order.id !== "string") return [];
    const date = validDate(order.placedAt);
    if (!date) return [];
    return [{
      id: order.id,
      date,
      merchant: typeof order.merchantName === "string" && order.merchantName.trim() ? order.merchantName : "Shop purchase",
      category: "Shop",
      amount: amountFrom(order.total),
      currency: currencyFrom(order.currency),
    }];
  });
}

function uberEvents(records: Record<string, unknown>[]) {
  return records.flatMap((trip): SpendEvent[] => {
    if (typeof trip.id !== "string") return [];
    const date = validDate(trip.requestTime);
    if (!date) return [];
    return [{
      id: trip.id,
      date,
      merchant: "Uber",
      category: typeof trip.vehicleType === "string" ? trip.vehicleType : "Transport",
      amount: amountFrom(trip.fare),
      currency: currencyFrom(trip.currencyCode),
    }];
  });
}

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const midpoint = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[midpoint] : (sorted[midpoint - 1] + sorted[midpoint]) / 2;
}

function cadence(days: number): SubscriptionForecast["cadence"] {
  if (days <= 10) return "Weekly";
  if (days <= 40) return "Monthly";
  if (days <= 110) return "Quarterly";
  if (days > 300) return "Annual";
  return "Recurring";
}

function forecast(events: SpendEvent[], now = new Date()) {
  const grouped = new Map<string, SpendEvent[]>();
  for (const event of events) {
    const key = `${event.merchant.toLowerCase()}::${event.currency}`;
    grouped.set(key, [...(grouped.get(key) ?? []), event]);
  }
  const forecasts: SubscriptionForecast[] = [];
  for (const group of grouped.values()) {
    if (group.length < 2) continue;
    group.sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
    const intervals = group.slice(1).map((item, index) => (Date.parse(item.date) - Date.parse(group[index].date)) / 86_400_000);
    const interval = median(intervals.filter((days) => days > 0));
    if (!Number.isFinite(interval) || interval < 1 || interval > 400) continue;
    const latest = group.at(-1)!;
    const next = new Date(latest.date);
    next.setUTCDate(next.getUTCDate() + Math.round(interval));
    while (next < now) next.setUTCDate(next.getUTCDate() + Math.round(interval));
    forecasts.push({
      merchant: latest.merchant,
      category: latest.category,
      amount: median(group.map((item) => item.amount)),
      currency: latest.currency,
      cadence: cadence(interval),
      nextCharge: next.toISOString(),
      lastCharge: latest.date,
      confidence: Math.max(55, Math.min(94, 58 + group.length * 7)),
      occurrences: group.length,
    });
  }
  return forecasts.sort((a, b) => Date.parse(a.nextCharge) - Date.parse(b.nextCharge));
}

export function analyzeCommerceData(source: CommerceSource, value: unknown): CommerceAnalysisResult {
  const records = objectRecords(value);
  const events = source === "amazon" ? amazonEvents(records) : source === "shop" ? shopEvents(records) : uberEvents(records);
  const uniqueEvents = [...new Map(events.map((event) => [event.id, event])).values()];
  const currency = uniqueEvents.find((event) => event.currency)?.currency ?? "USD";
  return {
    source,
    recordCount: uniqueEvents.length,
    totalSpend: uniqueEvents.filter((event) => event.currency === currency).reduce((sum, event) => sum + event.amount, 0),
    currency,
    forecasts: forecast(uniqueEvents),
  };
}
