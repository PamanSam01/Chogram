import { SAMPLE_CHOGS } from "./fixtures";
import type { ChogNFT } from "./types";

const ACTIVE_KEY = "chogram.active_chog";
const WALLET_KEY = "chogram.wallet";

/**
 * Fetch Chog Genesis NFTs owned by an address (Monad chain 143).
 * Live implementation: NFT API / Blockscout / OKX — see AGENTS_CONTRACT.md.
 * Falls back to fixtures so the demo never breaks.
 */
export async function fetchChogsForOwner(owner: string): Promise<ChogNFT[]> {
  if (!owner) return [];
  try {
    const res = await fetch(
      `/api/chogs?owner=${encodeURIComponent(owner)}`,
      { cache: "no-store" }
    );
    if (res.ok) {
      const data = (await res.json()) as { chogs?: ChogNFT[] };
      if (data.chogs && data.chogs.length > 0) return data.chogs;
    }
  } catch {
    /* fall through to fixtures */
  }
  return SAMPLE_CHOGS;
}

export function getActiveChog(): ChogNFT | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(ACTIVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ChogNFT;
  } catch {
    return null;
  }
}

export function saveActiveChog(chog: ChogNFT): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACTIVE_KEY, JSON.stringify(chog));
}

export function getWallet(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(WALLET_KEY);
}

export function saveWallet(address: string | null): void {
  if (typeof window === "undefined") return;
  if (address) window.localStorage.setItem(WALLET_KEY, address);
  else window.localStorage.removeItem(WALLET_KEY);
}

export function shortAddr(a: string | null | undefined): string {
  if (!a) return "";
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

/** Deterministic PRNG from a string — keeps same Chog looking the same every render. */
export function seedFrom(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}
