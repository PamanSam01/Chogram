"use client";

import { useCallback, useEffect, useState } from "react";

import { getWallet } from "../../lib/chog";
import {
  BURN_AMOUNT,
  BURN_SINK,
  activeAccount,
  classifyBurnError,
  confirmBurnTransaction,
  getPremiumUnlock,
  savePremiumUnlock,
  sendBurnTransaction,
} from "./wallet";

export type BalanceState =
  | { status: "no-wallet" }
  | { status: "checking" }
  | { status: "ok"; raw: bigint; label: string }
  | { status: "error"; message: string };

type Props = {
  balance: BalanceState;
  onConnect: () => void;
  connecting: boolean;
  connectError: string | null;
  onRetry: () => void;
  /** Optional: fired after a confirmed burn so the page can re-evaluate premium gates immediately. */
  onUnlocked?: () => void;
};

type BurnPhase = "idle" | "confirming" | "pending" | "unlocked" | "error";

const shortHash = (h: string): string => `${h.slice(0, 6)}…${h.slice(-4)}`;
const SINK_SHORT = `${BURN_SINK.slice(0, 6)}…${BURN_SINK.slice(-4)}`;

/**
 * Left rail: real on-chain $CHOG balance (eth_call balanceOf on chain 143).
 * premium = raw > 0 OR a stored burn receipt (localStorage `chogram.premium`,
 * written here after a successful transfer(0xdEaD, 500e18)).
 */
export function BalancePanel({ balance, onConnect, connecting, connectError, onRetry, onUnlocked }: Props) {
  const holds = balance.status === "ok" && balance.raw > 0n;

  const [unlockTx, setUnlockTx] = useState<string | null>(null);
  const [phase, setPhase] = useState<BurnPhase>("idle");
  const [burnTx, setBurnTx] = useState<string | null>(null);
  const [burnError, setBurnError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  // Hydration: localStorage is only readable on the client.
  useEffect(() => {
    const rec = getPremiumUnlock();
    if (rec) {
      setUnlockTx(rec.tx);
      setPhase("unlocked");
    }
  }, []);

  const unlocked = holds || unlockTx !== null;
  const busy = phase === "confirming" || phase === "pending";

  const burn = useCallback(async () => {
    if (busy) return;
    setBurnError(null);
    setDismissed(false);
    setPhase("confirming");
    try {
      const account = (await activeAccount()) ?? getWallet();
      if (!account) {
        setPhase("error");
        setBurnError("No active account in the wallet — connect first.");
        return;
      }
      const hash = await sendBurnTransaction(account);
      setBurnTx(hash);
      setPhase("pending");
      await confirmBurnTransaction(hash);
      savePremiumUnlock(hash);
      setUnlockTx(hash);
      setPhase("unlocked");
      onUnlocked?.();
    } catch (err) {
      const failure = classifyBurnError(err);
      if (failure.kind === "rejected") {
        setBurnTx(null);
        setPhase("idle");
        setDismissed(true);
      } else {
        setPhase("error");
        setBurnError(failure.message);
      }
    }
  }, [busy, onUnlocked]);

  return (
    <section
      className={`panel balance-panel ${unlocked ? "is-holding" : ""}${unlockTx && !holds ? " is-burned" : ""}`}
      aria-label="$CHOG balance"
    >
      <div className="panel__head">
        <span className="micro">WALLET_BALANCE · $CHOG</span>
        <span className="micro panel__head-right">ERC-20 balanceOf</span>
      </div>

      <div className="balance-body">
        {balance.status === "no-wallet" ? (
          <>
            <p className="balance-line balance-line--muted">
              No wallet connected. Connect to read your on-chain $CHOG balance.
            </p>
            <button type="button" className="btn btn-acid balance-cta" onClick={onConnect} disabled={connecting}>
              {connecting ? "Connecting…" : "Connect Wallet"}
            </button>
            {connectError ? <p className="err-line">{connectError}</p> : null}
          </>
        ) : balance.status === "checking" ? (
          <p className="balance-line mono">eth_call balanceOf( ) …</p>
        ) : balance.status === "error" ? (
          <>
            <p className="balance-line balance-line--muted">
              RPC unreachable — balance state unknown. Premium templates stay locked until this reads.
            </p>
            <button type="button" className="btn btn-ghost balance-cta" onClick={onRetry}>
              Retry eth_call
            </button>
          </>
        ) : holds ? (
          <>
            <p className="balance-line balance-line--hold">
              You hold <span className="mono">{balance.label}</span> $CHOG
            </p>
            <p className="micro balance-note">PREMIUM SLATES UNLOCKED · FREE — HOLDERS ARE IN</p>
          </>
        ) : unlockTx ? (
          <>
            <p className="balance-line balance-line--hold burn-line">
              UNLOCKED · tx <span className="mono">{shortHash(unlockTx)}</span>
            </p>
            <p className="micro balance-note">
              PREMIUM SLATES UNLOCKED · {BURN_AMOUNT} $CHOG BURNED →{" "}
              <span className="mono">{SINK_SHORT}</span>
            </p>
          </>
        ) : (
          <>
            <p className="balance-line">No $CHOG yet</p>
            <p className="burn-sell">
              Premium slates: hold $CHOG, or burn {BURN_AMOUNT} $CHOG once — both open every format.
            </p>
            <button
              type="button"
              className="btn btn-acid balance-cta"
              onClick={burn}
              disabled={busy}
              aria-busy={busy}
            >
              {phase === "confirming"
                ? "CONFIRM IN WALLET…"
                : phase === "pending"
                  ? "WAITING FOR CONFIRMATION…"
                  : `Unlock with ${BURN_AMOUNT} $CHOG`}
            </button>
            {phase === "pending" && burnTx ? (
              <p className="burn-status mono">
                <span className="burn-dot" aria-hidden="true" />
                tx {shortHash(burnTx)} · {BURN_AMOUNT}e18 → {SINK_SHORT}
              </p>
            ) : null}
            {phase === "error" && burnError ? <p className="err-line">{burnError}</p> : null}
            {dismissed ? <p className="burn-quiet">Request dismissed in wallet — nothing was sent.</p> : null}
            <p className="micro burn-sink">
              SINK <span className="mono" title={BURN_SINK}>{SINK_SHORT}</span> · ONE-TIME · ERC-20
              transfer(dEaD, 500e18)
            </p>
          </>
        )}
      </div>
    </section>
  );
}
