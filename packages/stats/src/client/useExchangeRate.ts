import { useSyncExternalStore } from "react";

const STORAGE_KEY = "omp-stats-exchange-rate";
const STORAGE_TS_KEY = "omp-stats-exchange-rate-ts";
const API_URL = "https://api.frankfurter.dev/v1/latest?from=USD&to=CNY";

interface StoredRate {
	rate: number;
	timestamp: number;
}

function readStored(): StoredRate | null {
	if (typeof localStorage === "undefined") return null;
	const rateStr = localStorage.getItem(STORAGE_KEY);
	const tsStr = localStorage.getItem(STORAGE_TS_KEY);
	if (rateStr === null || tsStr === null) return null;
	const rate = parseFloat(rateStr);
	const timestamp = parseInt(tsStr, 10);
	if (!Number.isFinite(rate) || rate <= 0 || !Number.isFinite(timestamp)) return null;
	return { rate, timestamp };
}

function persist(rate: number, timestamp: number): void {
	if (typeof localStorage === "undefined") return;
	try {
		localStorage.setItem(STORAGE_KEY, String(rate));
		localStorage.setItem(STORAGE_TS_KEY, String(timestamp));
	} catch {
		// localStorage unavailable
	}
}

let current: StoredRate = readStored() ?? { rate: 7.25, timestamp: 0 };
let fetching = false;
const listeners = new Set<() => void>();

function emit(): void {
	for (const listener of listeners) listener();
}

function subscribe(callback: () => void): () => void {
	listeners.add(callback);
	return () => listeners.delete(callback);
}

async function fetchRate(): Promise<void> {
	if (fetching) return;
	fetching = true;
	try {
		const res = await fetch(API_URL);
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		const json = (await res.json()) as { rates?: { CNY?: number } };
		const cny = json?.rates?.CNY;
		if (typeof cny !== "number" || cny <= 0) throw new Error("Invalid CNY rate");
		const now = Date.now();
		current = { rate: cny, timestamp: now };
		persist(cny, now);
		emit();
	} catch {
		// Keep cached rate, don't emit
	} finally {
		fetching = false;
	}
}

/** Get the current exchange rate (USD → CNY). */
export function getExchangeRate(): number {
	return current.rate;
}

/** Get the timestamp of the last successful fetch. */
export function getExchangeRateTimestamp(): number {
	return current.timestamp;
}

/** Fetch the latest rate from the API. */
export function refreshExchangeRate(): void {
	fetchRate();
}

/** Reader for the current exchange rate. */
export function useExchangeRate(): number {
	return useSyncExternalStore(
		subscribe,
		() => current.rate,
		() => 7.25,
	);
}

/** Reader for the last fetch timestamp. */
export function useExchangeRateTimestamp(): number {
	return useSyncExternalStore(
		subscribe,
		() => current.timestamp,
		() => 0,
	);
}
