"use server";

/**
 * Server action: fetch the current TRM (USD to COP exchange rate) for today's date.
 * Reads EXCHANGE_RATE_API_URL (optional, defaults to https://trm-colombia.vercel.app).
 * @returns the conversion rate from USD to COP
 * @throws if the fetch fails or response is invalid
 */
export async function getTRM(): Promise<number> {
  // Fetch the TRM (USD to COP exchange rate) for today's date
  // Default service: https://trm-colombia.vercel.app
  const baseUrl = "https://trm-colombia.vercel.app";
  // Today's date in YYYY-MM-DD format
  const date = new Date().toISOString().slice(0, 10);
  const url = `${baseUrl}/?date=${date}`;
  console.log("Fetching TRM from (cached 12h):", url);
  // Cache this request for 12 hours (43200 seconds)
  const res = await fetch(url, { next: { revalidate: 43200 } });
  if (!res.ok) {
    throw new Error(`Failed to fetch TRM for date ${date}: ${res.status} ${res.statusText}`);
  }
  // Expected response shape:
  // { data: { unit: string, validityFrom: string, validityTo: string, value: number, success: boolean }, ... }
  const json = (await res.json()) as { data?: { value?: number } };
  console.log("TRM response:", json);
  const rate = json.data?.value;
  if (typeof rate !== "number") {
    throw new Error("Invalid TRM response format");
  }
  return rate;
}
