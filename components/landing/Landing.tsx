"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchChogsForOwner, getActiveChog, saveActiveChog } from "@/lib/chog";
import { SAMPLE_CHOGS } from "@/lib/fixtures";
import { fetchMarketData } from "@/lib/market";
import type { ChogNFT, MarketData } from "@/lib/types";
import { broadcastFor } from "@/remotion/Root";
import ChogPicker from "./ChogPicker";
import Hero from "./Hero";
import Nav from "./Nav";
import SiteFooter from "./SiteFooter";
import Steps from "./Steps";
import Station from "./Station";
import SummonModal from "./SummonModal";
import Templates from "./Templates";
import WhyNft from "./WhyNft";
import { useInjectedWallet } from "./useInjectedWallet";

type Picker = {
  open: boolean;
  chogs: ChogNFT[];
  loading: boolean;
  source: "wallet" | "sample";
};

const PICKER_CLOSED: Picker = { open: false, chogs: [], loading: false, source: "sample" };

export default function Landing() {
  const router = useRouter();
  const wallet = useInjectedWallet();

  const [market, setMarket] = useState<MarketData | null>(null);
  const [activeChog, setActiveChog] = useState<ChogNFT | null>(null);
  const [picker, setPicker] = useState<Picker>(PICKER_CLOSED);
  const [film, setFilm] = useState<"summon" | "preview" | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // restore saved state + pull live market data
  useEffect(() => {
    setActiveChog(getActiveChog());
    let alive = true;
    fetchMarketData()
      .then((m) => {
        if (alive) setMarket(m);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (wallet.error) setNotice(wallet.error);
  }, [wallet.error]);

  const openWalletPicker = useCallback(async (address: string) => {
    setNotice(null);
    setPicker({ open: true, chogs: [], loading: true, source: "wallet" });
    try {
      const chogs = await fetchChogsForOwner(address);
      setPicker((p) => (p.open && p.source === "wallet" ? { ...p, chogs, loading: false } : p));
    } catch {
      setPicker((p) => (p.open ? { ...p, chogs: SAMPLE_CHOGS, loading: false } : p));
    }
  }, []);

  const openSamplePicker = useCallback(() => {
    setNotice(null);
    setPicker({ open: true, chogs: SAMPLE_CHOGS, loading: false, source: "sample" });
  }, []);

  const handleConnect = useCallback(async () => {
    const res = await wallet.connect();
    if (res.notice === "no-wallet") {
      openSamplePicker();
      return;
    }
    if (res.notice) setNotice(res.notice);
    if (res.address) await openWalletPicker(res.address);
  }, [wallet, openWalletPicker, openSamplePicker]);

  const pickChog = useCallback((chog: ChogNFT) => {
    saveActiveChog(chog);
    setActiveChog(chog);
    setPicker(PICKER_CLOSED);
    setNotice(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const filmBroadcast = useMemo(() => {
    if (!film) return null;
    if (film === "preview") return broadcastFor("summon");
    return broadcastFor("summon", { chog: activeChog ?? SAMPLE_CHOGS[0] });
  }, [film, activeChog]);

  const handleEnterStudio = useCallback(() => {
    router.push("/dashboard");
  }, [router]);

  const handlePickFromPreview = useCallback(() => {
    setFilm(null);
    openSamplePicker();
  }, [openSamplePicker]);

  return (
    <div className="lg-page">
      <Nav
        wallet={wallet.address}
        connecting={wallet.connecting}
        onConnect={handleConnect}
        onOpenPicker={() =>
          wallet.address ? openWalletPicker(wallet.address) : openSamplePicker()
        }
      />

      <main>
        <Hero
          market={market}
          wallet={wallet.address}
          connecting={wallet.connecting}
          activeChog={activeChog}
          notice={notice}
          onConnect={handleConnect}
          onWatch={() => setFilm("preview")}
          onSample={openSamplePicker}
          onSummon={() => setFilm("summon")}
          onOpenPicker={() =>
            wallet.address ? openWalletPicker(wallet.address) : openSamplePicker()
          }
        />
        <Steps />
        <Templates />
        <WhyNft />
        <Station />
      </main>

      <SiteFooter />

      <ChogPicker
        open={picker.open}
        title={
          picker.source === "wallet" ? "Your Chog Genesis cast" : "Sample cast — no wallet needed"
        }
        subtitle={
          picker.source === "wallet"
            ? "SCANNING CHOG GENESIS / MONAD"
            : "FIXTURE ACTORS / DEMO MODE"
        }
        chogs={picker.chogs}
        loading={picker.loading}
        onPick={pickChog}
        onClose={() => setPicker(PICKER_CLOSED)}
        onSample={openSamplePicker}
      />

      {film && filmBroadcast ? (
        <SummonModal
          broadcast={filmBroadcast}
          mode={film}
          onClose={() => setFilm(null)}
          onEnterStudio={handleEnterStudio}
          onPickChog={handlePickFromPreview}
        />
      ) : null}
    </div>
  );
}
