"use client";

import { useCallback, useEffect, useState } from "react";
import { createWalletClient, custom } from "viem";
import { getWallet, saveWallet } from "@/lib/chog";
import { MONAD_CHAIN_ID, MONAD_RPC } from "@/lib/market";

/** Minimal EIP-1193 shape for window.ethereum (MetaMask & friends). */
export type Eip1193Provider = {
  request: (args: { method: string; params?: readonly unknown[] | object }) => Promise<unknown>;
  on?: (event: string, handler: (...args: never[]) => void) => void;
  removeListener?: (event: string, handler: (...args: never[]) => void) => void;
};

export function getInjectedEthereum(): Eip1193Provider | null {
  if (typeof window === "undefined") return null;
  const eth = (window as unknown as { ethereum?: Eip1193Provider }).ethereum;
  return eth && typeof eth.request === "function" ? eth : null;
}

const MONAD_HEX = `0x${MONAD_CHAIN_ID.toString(16)}`; // 0x8f — chain 143

const ADD_CHAIN_PARAMS = {
  chainId: MONAD_HEX,
  chainName: "Monad",
  nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 },
  rpcUrls: [MONAD_RPC],
};

function isMissingChainError(err: unknown): boolean {
  const e = err as { code?: number; message?: string; data?: { originalError?: { code?: number } } };
  const code = e?.code ?? e?.data?.originalError?.code;
  const message = String(e?.message ?? "");
  return code === 4902 || /4902|unrecognized chain|unknown chain|add.*ethereum.*chain/i.test(message);
}

function isUserRejected(err: unknown): boolean {
  const e = err as { code?: number; message?: string };
  return e?.code === 4001 || /user rejected|user denied/i.test(String(e?.message ?? ""));
}

export type ConnectResult = {
  address: string | null;
  /** non-fatal message (chain switch refused, etc.) */
  notice: string | null;
};

/**
 * Injected-wallet connection: eth_requestAccounts via viem's custom transport,
 * then wallet_switchEthereumChain -> Monad (0x8f) with wallet_addEthereumChain
 * fallback. Persists through lib/chog saveWallet().
 */
export function useInjectedWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAddress(getWallet());
  }, []);

  const connect = useCallback(async (): Promise<ConnectResult> => {
    const eth = getInjectedEthereum();
    if (!eth) {
      setError("No browser wallet detected — run it with a sample Chog instead.");
      return { address: null, notice: "no-wallet" };
    }
    setConnecting(true);
    setError(null);
    try {
      // viem injected connector: eth_requestAccounts
      const walletClient = createWalletClient({ transport: custom(eth) });
      const accounts = await walletClient.requestAddresses();
      const account = accounts[0];
      if (!account) throw new Error("Wallet returned no accounts.");

      let notice: string | null = null;
      try {
        await eth.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: MONAD_HEX }],
        });
      } catch (switchErr) {
        if (isMissingChainError(switchErr)) {
          try {
            await eth.request({ method: "wallet_addEthereumChain", params: [ADD_CHAIN_PARAMS] });
          } catch {
            notice = "Connected — approve the Monad (143) network prompt to render on-chain.";
          }
        } else if (isUserRejected(switchErr)) {
          notice = "Network switch skipped — CHOGRAM needs Monad (chain 143) to render.";
        } else {
          notice = "Connected, but the Monad switch could not be confirmed.";
        }
      }

      setAddress(account);
      saveWallet(account);
      return { address: account, notice };
    } catch (err) {
      if (isUserRejected(err)) setError("Connection rejected in the wallet.");
      else setError("Could not connect to the wallet — try the sample path.");
      return { address: null, notice: null };
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    saveWallet(null);
    setAddress(null);
    setError(null);
  }, []);

  // follow account switches / disconnects from the extension
  useEffect(() => {
    const eth = getInjectedEthereum();
    if (!eth?.on) return;
    const onAccounts = (...args: never[]) => {
      const next = (args[0] as unknown as string[] | undefined) ?? [];
      const account = next[0] ?? null;
      setAddress(account);
      saveWallet(account);
    };
    eth.on("accountsChanged", onAccounts);
    return () => {
      eth.removeListener?.("accountsChanged", onAccounts);
    };
  }, []);

  return { address, connecting, error, setError, connect, disconnect };
}
