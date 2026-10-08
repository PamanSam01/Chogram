"use client";

import type { ChogNFT } from "../../lib/types";
import { shortAddr } from "../../lib/chog";

type Props = {
  wallet: string | null;
  chog: ChogNFT | null;
  onDisconnect: () => void;
};

export function DashHeader({ wallet, chog, onDisconnect }: Props) {
  return (
    <header className="dash-head">
      <div className="dash-head__left">
        <a href="/" className="wordmark" aria-label="CHOGRAM home">
          CHOGRAM<span className="wordmark__slash">/</span>
          <span className="wordmark__sub">STUDIO</span>
        </a>
        <span className="head-divider" aria-hidden="true" />
        <span className="micro head-signal">
          <span className="signal-bars" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          CHOG BROADCAST STUDIO · CHAIN 143
        </span>
      </div>

      <div className="dash-head__right">
        {chog ? (
          <div className="head-chog">
            <span className="head-chog__thumb">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={chog.image} alt={chog.name} />
            </span>
            <span className="head-chog__meta">
              <span className="micro">ACTIVE_ASSET</span>
              <span className="head-chog__name">{chog.name}</span>
            </span>
          </div>
        ) : null}

        <span className={`wallet-chip ${wallet ? "is-on" : ""}`} title={wallet ?? "No wallet"}>
          <span className="wallet-chip__dot" aria-hidden="true" />
          <span className="mono">{wallet ? shortAddr(wallet) : "NO WALLET"}</span>
        </span>

        <a href="/" className="btn btn-ghost head-btn">
          Change Chog
        </a>
        {wallet ? (
          <button
            type="button"
            className="btn btn-ghost head-btn"
            onClick={onDisconnect}
          >
            Disconnect
          </button>
        ) : null}
      </div>
    </header>
  );
}
