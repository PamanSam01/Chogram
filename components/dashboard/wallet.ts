// EIP-1193 helpers: injected wallet connect, Monad chain switch/add, live $CHOG balance.
// Deliberately window.ethereum-typed via casts (no global interface merging).
import { createPublicClient, createWalletClient, custom, defineChain, encodeFunctionData, formatUnits, http } from "viem";
import { CHOG_TOKEN, MONAD_CHAIN_ID, MONAD_RPC } from "../../lib/market";
import { saveWallet } from "../../lib/chog";

type Eip1193 = {
  request: (args: { method: string; params?: readonly unknown[] | object }) => Promise<unknown>;
  on?: (event: string, handler: (...args: any[]) => void) => void;
  removeListener?: (event: string, handler: (...args: any[]) => void) => void;
};

const HEX_CHAIN_ID = `0x${MONAD_CHAIN_ID.toString(16)}`; // 143 → 0x8f

export function getInjected(): Eip1193 | null {
  if (typeof window === "undefined") return null;
  const eth = (window as unknown as { ethereum?: Eip1193 }).ethereum;
  return eth ?? null;
}

const monadChain = defineChain({
  id: MONAD_CHAIN_ID,
  name: "Monad",
  nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 },
  rpcUrls: { default: { http: [MONAD_RPC] } },
});

export function makePublicClient() {
  return createPublicClient({ chain: monadChain, transport: http(MONAD_RPC) });
}

/**
 * Connect the injected wallet, force it onto Monad 143 (wallet_switchEthereumChain,
 * wallet_addEthereumChain fallback for unknown chains), persist the address.
 * Returns the account address.
 */
export async function connectInjected(): Promise<string> {
  const eth = getInjected();
  if (!eth) throw new Error("No injected wallet found. Install a Monad-compatible wallet.");

  const accounts = (await eth.request({ method: "eth_requestAccounts" })) as string[];
  const account = accounts?.[0];
  if (!account) throw new Error("Wallet returned no account.");

  try {
    const current = (await eth.request({ method: "eth_chainId" })) as string;
    if (parseInt(current, 16) !== MONAD_CHAIN_ID) {
      await eth.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: HEX_CHAIN_ID }],
      });
    }
  } catch (err: unknown) {
    const code = (err as { code?: number })?.code;
    if (code === 4902 || code === -32603) {
      await eth.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: HEX_CHAIN_ID,
            chainName: "Monad",
            nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 },
            rpcUrls: [MONAD_RPC],
          },
        ],
      });
    } else {
      const msg = (err as { message?: string })?.message ?? "";
      if (/user rejected|rejected the request/i.test(msg)) throw new Error("Chain switch rejected.");
      // Non-fatal: balance reads still go through MONAD_RPC directly.
    }
  }

  saveWallet(account);
  return account;
}

/**
 * balanceOf(address) as a raw eth_call against $CHOG on chain 143.
 * Throws on RPC failure — callers surface an honest unavailable state.
 */
export async function fetchChogBalance(owner: string): Promise<bigint> {
  const client = makePublicClient();
  const result = await client.readContract({
    address: CHOG_TOKEN,
    abi: [
      {
        type: "function",
        name: "balanceOf",
        stateMutability: "view",
        inputs: [{ name: "account", type: "address" }],
        outputs: [{ name: "", type: "uint256" }],
      },
    ],
    functionName: "balanceOf",
    args: [owner as `0x${string}`],
  });
  return result as bigint;
}

/** Raw → display string using viem's decimal-safe formatting. */
export function chogBalanceLabel(raw: bigint): string {
  return formatUnits(raw, 18);
}

/* ------------------------------------------------------------------ *
 * V2 BURN UNLOCK — one-time transfer of 500 $CHOG to the dEaD sink.
 * premium = balanceOf > 0  OR  stored burn receipt in localStorage.
 * ------------------------------------------------------------------ */

/** Amount (whole $CHOG) burned to open every premium slate. */
export const BURN_AMOUNT = 500;
/** Canonical burn sink — shown short in UI, exported for README/docs. */
export const BURN_SINK = "0x000000000000000000000000000000000000dEaD";
/** localStorage key holding the burn receipt (read via isPremiumUnlocked). */
export const PREMIUM_STORAGE_KEY = "chogram.premium";

const ERC20_TRANSFER_ABI = [
  {
    type: "function",
    name: "transfer",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

export type PremiumUnlock = { tx: string; at: string; amount: string };

/** Read the stored burn receipt — null when never burned (or storage unreadable). */
export function getPremiumUnlock(): PremiumUnlock | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PREMIUM_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PremiumUnlock> | null;
    if (parsed && typeof parsed.tx === "string" && /^0x[0-9a-fA-F]{64}$/.test(parsed.tx)) {
      return {
        tx: parsed.tx,
        at: typeof parsed.at === "string" ? parsed.at : "",
        amount: typeof parsed.amount === "string" ? parsed.amount : String(BURN_AMOUNT),
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * The single premium gate besides balanceOf > 0:
 * `premium = balanceOf(wallet) > 0 || isPremiumUnlocked()`.
 */
export function isPremiumUnlocked(): boolean {
  return getPremiumUnlock() !== null;
}

/** Persist the burn receipt after receipt.status === "success". */
export function savePremiumUnlock(tx: string): PremiumUnlock {
  const rec: PremiumUnlock = { tx, at: new Date().toISOString(), amount: String(BURN_AMOUNT) };
  try {
    window.localStorage.setItem(PREMIUM_STORAGE_KEY, JSON.stringify(rec));
  } catch {
    // Storage unavailable (private mode) — unlock still holds for this session via component state.
  }
  return rec;
}

/** Currently selected injected account (no popup), or null when none/unavailable. */
export async function activeAccount(): Promise<string | null> {
  const eth = getInjected();
  if (!eth) return null;
  try {
    const accounts = (await eth.request({ method: "eth_accounts" })) as string[];
    return accounts?.[0] ?? null;
  } catch {
    return null;
  }
}

/**
 * Force the injected wallet onto Monad 143 before a state-changing tx.
 * Re-throws user rejection (4001); other failures are non-fatal — the wallet
 * may already be on-chain or the RPC read path is unaffected.
 */
export async function ensureMonadChain(): Promise<void> {
  const eth = getInjected();
  if (!eth) throw new Error("No injected wallet found. Install a Monad-compatible wallet.");
  const current = (await eth.request({ method: "eth_chainId" })) as string;
  if (parseInt(current, 16) === MONAD_CHAIN_ID) return;
  try {
    await eth.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: HEX_CHAIN_ID }],
    });
  } catch (err: unknown) {
    const code = (err as { code?: number })?.code;
    const msg = (err as { message?: string })?.message ?? "";
    if (code === 4001 || /user rejected|rejected the request/i.test(msg)) throw err;
    if (code === 4902 || code === -32603) {
      await eth.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: HEX_CHAIN_ID,
            chainName: "Monad",
            nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 },
            rpcUrls: [MONAD_RPC],
          },
        ],
      });
    }
  }
}

/**
 * Submit `transfer(0xdEaD, 500e18)` on $CHOG through the injected wallet.
 * Returns the tx hash once the wallet has accepted the request (phase: pending).
 */
export async function sendBurnTransaction(account: string): Promise<`0x${string}`> {
  const eth = getInjected();
  if (!eth) throw new Error("No injected wallet found. Install a Monad-compatible wallet.");
  await ensureMonadChain();

  const data = encodeFunctionData({
    abi: ERC20_TRANSFER_ABI,
    functionName: "transfer",
    args: [BURN_SINK as `0x${string}`, BigInt(BURN_AMOUNT) * 10n ** 18n],
  });

  const walletClient = createWalletClient({
    chain: monadChain,
    transport: custom(eth),
  });

  return walletClient.sendTransaction({
    account: account as `0x${string}`,
    to: CHOG_TOKEN as `0x${string}`,
    data,
  });
}

/** Poll MONAD_RPC until the burn receipt lands; throws on revert or timeout. */
export async function confirmBurnTransaction(hash: `0x${string}`): Promise<void> {
  const client = makePublicClient();
  const receipt = await client.waitForTransactionReceipt({ hash, timeout: 180_000 });
  if (receipt.status !== "success") {
    throw new Error("Burn transaction reverted on-chain (receipt status 0).");
  }
}

export type BurnFailure = {
  kind: "rejected" | "gas" | "rpc";
  message: string;
};

/**
 * Honest failure taxonomy for the burn flow:
 * user rejection → quiet line, insufficient MON → say so, anything else → error line.
 */
export function classifyBurnError(err: unknown): BurnFailure {
  const code = (err as { code?: number } | null)?.code;
  const name = err instanceof Error ? err.name : "";
  const msg = err instanceof Error ? err.message : String(err ?? "");
  if (
    code === 4001 ||
    name === "UserRejectedRequestError" ||
    /user rejected|user denied|rejected the request/i.test(msg)
  ) {
    return { kind: "rejected", message: "Request rejected in wallet — nothing was sent." };
  }
  if (/insufficient funds|insufficient balance|gas required exceeds|cannot pay|exceeds the balance/i.test(msg)) {
    return { kind: "gas", message: "Not enough MON in this wallet to pay gas for the burn transaction." };
  }
  if (/timed out/i.test(msg)) {
    return {
      kind: "rpc",
      message: "Timed out waiting for confirmation — the burn may still land. Reload to re-check.",
    };
  }
  return { kind: "rpc", message: msg || "RPC unreachable — the burn could not be submitted." };
}
