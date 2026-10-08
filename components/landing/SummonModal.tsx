"use client";

import { useEffect, useRef, useState } from "react";
import { Player, type PlayerRef } from "@remotion/player";
import { TEMPLATES } from "@/lib/fixtures";
import type { BroadcastData } from "@/lib/types";
import { Summon } from "@/remotion/compositions/Summon";
import { withBgm } from "@/remotion/lib/bgm";

/** Summon film with BGM — module-level so the Player never remounts. */
const SummonFilm = withBgm(Summon);
import { fmtRarity, timecode } from "./format";
import { IconArrow, IconClose } from "./icons";

type Props = {
  broadcast: BroadcastData;
  /** "summon" = the judged run (ends in ENTER STUDIO); "preview" = hero sample, saves nothing */
  mode: "summon" | "preview";
  onClose: () => void;
  onEnterStudio: () => void;
  onPickChog: () => void;
};

const DEF = TEMPLATES.find((t) => t.id === "summon") ?? {
  id: "summon" as const,
  name: "The Summon",
  blurb: "",
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 540,
  premium: false,
};

export default function SummonModal({
  broadcast,
  mode,
  onClose,
  onEnterStudio,
  onPickChog,
}: Props) {
  const playerRef = useRef<PlayerRef>(null);
  const barRef = useRef<HTMLElement | null>(null);
  const tcRef = useRef<HTMLSpanElement | null>(null);
  const endedRef = useRef(false);
  const [ended, setEnded] = useState(false);
  const [muted, setMuted] = useState(true);

  const total = timecode(DEF.durationInFrames, DEF.fps);

  const finish = () => {
    if (endedRef.current) return;
    endedRef.current = true;
    setEnded(true);
  };

  useEffect(() => {
    const p = playerRef.current;
    if (!p) return;

    const onFrame = (e: { detail: { frame: number } }) => {
      const frame = e.detail.frame;
      const pct = Math.min(1, Math.max(0, frame / DEF.durationInFrames));
      if (barRef.current) barRef.current.style.transform = `scaleX(${pct})`;
      if (tcRef.current) tcRef.current.textContent = `${timecode(frame, DEF.fps)} / ${total}`;
      if (frame >= DEF.durationInFrames - 1) finish();
    };
    const onEnded = () => finish();
    const onMute = (e: { detail: { isMuted: boolean } }) => setMuted(e.detail.isMuted);

    p.addEventListener("frameupdate", onFrame);
    p.addEventListener("ended", onEnded);
    p.addEventListener("mutechange", onMute);
    return () => {
      p.removeEventListener("frameupdate", onFrame);
      p.removeEventListener("ended", onEnded);
      p.removeEventListener("mutechange", onMute);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const toggleSound = () => {
    const p = playerRef.current;
    if (!p) return;
    if (p.isMuted()) p.unmute();
    else p.mute();
  };

  const skip = () => {
    if (mode === "summon") onEnterStudio();
    else onClose();
  };

  return (
    <div className="film" role="dialog" aria-modal="true" aria-label="The Summon">
      <div className="film-top">
        <span className="micro">CHOGRAM / THE SUMMON</span>
        <span className="micro film-name">
          {broadcast.chog.name} · RANK #{broadcast.chog.rarityRank} ·{" "}
          {fmtRarity(broadcast.chog.rarityPercentile)}
        </span>
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Close film">
          <IconClose />
        </button>
      </div>

      <div className="film-stage">
        <div className="film-frame">
          <Player
            ref={playerRef}
            component={SummonFilm}
            inputProps={broadcast}
            durationInFrames={DEF.durationInFrames}
            compositionWidth={DEF.width}
            compositionHeight={DEF.height}
            fps={DEF.fps}
            autoPlay
            loop={false}
            controls={false}
            clickToPlay={false}
            spaceKeyToPlayOrPause={false}
            doubleClickToFullscreen={false}
            allowFullscreen={false}
            initiallyMuted
            moveToBeginningWhenEnded={false}
            acknowledgeRemotionLicense
            style={{ width: "100%", height: "100%" }}
          />
          <span className="film-grade" aria-hidden="true" />
          {ended ? (
            <div className="film-cta">
              <span className="micro micro-acid">
                {mode === "summon" ? "CAST CONFIRMED" : "THAT WAS THE SAMPLE CAST"}
              </span>
              <button
                type="button"
                className="btn btn-acid"
                onClick={mode === "summon" ? onEnterStudio : onPickChog}
              >
                {mode === "summon" ? "Enter Studio" : "Summon your Chog"}
                <IconArrow size={17} />
              </button>
              <span className="micro">
                {mode === "summon"
                  ? "YOUR CHOG IS SAVED — THE STUDIO IS READY"
                  : "PICK AN ACTOR FROM THE SAMPLE CAST"}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      <div className="film-hud">
        <div className="film-bar">
          <i ref={barRef} />
        </div>
        <div className="film-row">
          <span className="micro mono film-tc" ref={tcRef}>
            00:00:00 / {total}
          </span>
          <span className="micro film-meta">
            1920×1080 · {DEF.fps}FPS · REMOTION 4
          </span>
          <span style={{ display: "inline-flex", gap: 12, alignItems: "center" }}>
            <button type="button" className="film-sound" onClick={toggleSound}>
              Sound {muted ? "off" : "on"}
            </button>
            <button type="button" className="film-skip" onClick={skip}>
              {mode === "summon" ? "Skip to studio" : "Close"}
            </button>
          </span>
        </div>
      </div>
    </div>
  );
}
