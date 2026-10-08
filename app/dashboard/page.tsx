"use client";

import "../dashboard.css";

import { useCallback, useEffect, useMemo, useState } from "react";

import { getActiveChog, getWallet, saveActiveChog, saveWallet } from "../../lib/chog";
import { fetchMarketData } from "../../lib/market";
import { SAMPLE_CHOGS, TEMPLATES } from "../../lib/fixtures";
import type { BroadcastData, ChogNFT, MarketData, TemplateId } from "../../lib/types";
import type { BgmTrack } from "../../remotion/lib/bgm";
import { broadcastFor } from "../../remotion/Root";

import { DashHeader } from "../../components/dashboard/DashHeader";
import { AssetPanel } from "../../components/dashboard/AssetPanel";
import { MarketPanel } from "../../components/dashboard/MarketPanel";
import { BalancePanel } from "../../components/dashboard/BalancePanel";
import type { BalanceState } from "../../components/dashboard/BalancePanel";
import { TemplateGallery } from "../../components/dashboard/TemplateGallery";
import { Studio } from "../../components/dashboard/Studio";
import { AlertsPanel } from "../../components/dashboard/AlertsPanel";
import { ArchivePanel } from "../../components/dashboard/ArchivePanel";
import { DEFAULT_CUSTOM } from "../../components/dashboard/editorFields";
import { chogBalanceLabel, connectInjected, fetchChogBalance, isPremiumUnlocked } from "../../components/dashboard/wallet";

const cloneDefaults = (): Record<TemplateId, Record<string, string>> => {
  const out = {} as Record<TemplateId, Record<string, string>>;
  (Object.keys(DEFAULT_CUSTOM) as TemplateId[]).forEach((k) => {
    out[k] = { ...DEFAULT_CUSTOM[k] };
  });
  return out;
};

export default function DashboardPage() {
  const [chog, setChog] = useState<ChogNFT | null>(null);
  const [wallet, setWallet] = useState<string | null>(null);
  const [market, setMarket] = useState<MarketData | null>(null);
  const [balance, setBalance] = useState<BalanceState>({ status: "no-wallet" });
  const [balanceNonce, setBalanceNonce] = useState(0);
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [selected, setSelected] = useState<TemplateId>("price-alert");
  const [bgmTrack, setBgmTrack] = useState<BgmTrack>("broadcast");
  const [drafts, setDrafts] = useState<Record<TemplateId, Record<string, string>>>(cloneDefaults);
  const [mounted, setMounted] = useState(false);

  // Hydration: localStorage is only readable on the client.
  useEffect(() => {
    const active = getActiveChog();
    if (active) {
      setChog(active);
    } else {
      const fallback = SAMPLE_CHOGS[0];
      saveActiveChog(fallback);
      setChog(fallback);
    }
    setWallet(getWallet());
    setMounted(true);
  }, []);

  // Live market feed (Dexscreener) — re-polled every 30s so the price alert
  // preview and any export payload always carry a fresh tick.
  useEffect(() => {
    let alive = true;
    const load = () =>
      fetchMarketData().then((m) => {
        if (alive) setMarket(m);
      });
    load();
    const id = window.setInterval(load, 30_000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, []);

  // Real $CHOG balance for the connected wallet (chain 143 eth_call).
  useEffect(() => {
    if (!wallet) {
      setBalance({ status: "no-wallet" });
      return;
    }
    let alive = true;
    setBalance({ status: "checking" });
    fetchChogBalance(wallet)
      .then((raw) => {
        if (alive) setBalance({ status: "ok", raw, label: chogBalanceLabel(raw) });
      })
      .catch((err: unknown) => {
        if (alive) {
          setBalance({
            status: "error",
            message: err instanceof Error ? err.message : "RPC unreachable",
          });
        }
      });
    return () => {
      alive = false;
    };
  }, [wallet, balanceNonce]);

  const connect = useCallback(async () => {
    setConnecting(true);
    setConnectError(null);
    try {
      const addr = await connectInjected();
      setWallet(addr);
    } catch (err) {
      setConnectError(err instanceof Error ? err.message : String(err));
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    saveWallet(null);
    setWallet(null);
    setConnectError(null);
  }, []);

  const unlocked = useCallback(
    (t: (typeof TEMPLATES)[number]) =>
      !t.premium || (balance.status === "ok" && balance.raw > 0n) || isPremiumUnlocked(),
    // balanceNonce bumps after a confirmed burn so the gate re-reads localStorage
    [balance, balanceNonce]
  );

  const template = useMemo(
    () => TEMPLATES.find((t) => t.id === selected) ?? TEMPLATES[1],
    [selected]
  );

  const onField = useCallback(
    (key: string, value: string) => {
      setDrafts((prev) => ({ ...prev, [selected]: { ...prev[selected], [key]: value } }));
    },
    [selected]
  );

  // Broadcast = fixture-driven preview merged with the live active Chog + market + editor state.
  const inputProps = useMemo<BroadcastData>(() => {
    const over: Partial<BroadcastData> = {};
    if (chog) over.chog = chog;
    if (market) over.market = market;
    const custom = drafts[selected];
    // bgm rides along so the preview Player hears the selected score live
    over.custom = { ...(custom ?? {}), bgm: bgmTrack };
    return broadcastFor(selected, over);
  }, [selected, chog, market, drafts, bgmTrack]);

  return (
    <main className="dash">
      <DashHeader wallet={wallet} chog={chog} onDisconnect={disconnect} />

      {!mounted ? (
        <div className="dash-boot">
          <span className="micro">MOUNTING STUDIO</span>
          <p className="mono">reading chogram.active_chog / chogram.wallet …</p>
        </div>
      ) : (
        <div className="dash-grid">
          <div className="col col--left">
            {chog ? <AssetPanel chog={chog} active={selected !== null} /> : null}
            <MarketPanel market={market} />
            <BalancePanel
              balance={balance}
              onConnect={connect}
              connecting={connecting}
              connectError={connectError}
              onRetry={() => setBalanceNonce((n) => n + 1)}
              onUnlocked={() => setBalanceNonce((n) => n + 1)}
            />
          </div>

          <div className="col col--right">
            <TemplateGallery
              templates={TEMPLATES}
              selected={selected}
              unlocked={unlocked}
              wallet={wallet}
              chog={chog}
              connecting={connecting}
              connectError={connectError}
              onSelect={setSelected}
              onConnect={connect}
            />
            <Studio
              key={template.id}
              template={template}
              inputProps={inputProps}
              draft={drafts[template.id]}
              onField={onField}
              bgm={bgmTrack}
              onBgm={setBgmTrack}
            />
            <AlertsPanel />
            <ArchivePanel />
          </div>
        </div>
      )}

      <footer className="dash-foot">
        <span className="micro">CHOGRAM · CHOG BROADCAST STUDIO</span>
        <span className="micro mono foot-addr">CHOG_GENESIS 0xc96d31f8…a73763</span>
        <span className="micro mono foot-addr">$CHOG 0x35003555…c27777</span>
        <span className="micro mono">CHAIN 143 · SUPPLY 1,969</span>
      </footer>
    </main>
  );
}
