"use client";

import { useEffect, useState, type ComponentType } from "react";
import { Player } from "@remotion/player";
import { TEMPLATES } from "@/lib/fixtures";
import type { BroadcastData, TemplateDef, TemplateId } from "@/lib/types";
import { COMPOSITION_IDS, broadcastFor } from "@/remotion/Root";
import { Summon } from "@/remotion/compositions/Summon";
import { PriceAlert } from "@/remotion/compositions/PriceAlert";
import { PfpFlex } from "@/remotion/compositions/PfpFlex";
import { MemeClip } from "@/remotion/compositions/MemeClip";
import { ChogWrapped } from "@/remotion/compositions/ChogWrapped";
import { CHOG_STILLS, fmtDuration } from "./format";
import { IconLock, IconPlay } from "./icons";
import { withBgm } from "@/remotion/lib/bgm";

const COMPOSITION: Record<TemplateId, ComponentType<BroadcastData>> = {
  summon: withBgm(Summon),
  "price-alert": withBgm(PriceAlert),
  "pfp-flex": withBgm(PfpFlex),
  "meme-clip": withBgm(MemeClip),
  "chog-wrapped": withBgm(ChogWrapped),
};

/** Only the first two previews are allowed to autoplay (RAM budget). */
const AUTOPLAY = new Set<TemplateId>(["summon", "price-alert"]);

function TemplateCard({ def, index }: { def: TemplateDef; index: number }) {
  const [broadcast] = useState<BroadcastData>(() => broadcastFor(def.id));
  const [started, setStarted] = useState(false);
  // never SSR/hydrate a <Player> — it injects Remotion internals that differ per render
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const playing = mounted && (started || AUTOPLAY.has(def.id));
  const comp = COMPOSITION[def.id];
  const featured = index === 0;
  const stage = (
    <div className="tpl-stage" style={{ aspectRatio: `${def.width} / ${def.height}` }}>
      {playing ? (
        <Player
          component={comp}
          inputProps={broadcast}
          durationInFrames={def.durationInFrames}
          compositionWidth={def.width}
          compositionHeight={def.height}
          fps={def.fps}
          autoPlay
          loop
          controls
          initiallyMuted
          acknowledgeRemotionLicense
          style={{ width: "100%", height: "100%" }}
        />
      ) : (
        <button
          type="button"
          className="tpl-poster"
          onClick={() => setStarted(true)}
          aria-label={`Load preview of ${def.name}`}
        >
          <img src={CHOG_STILLS[index % CHOG_STILLS.length]} alt="" />
          <span className="poster-veil" />
          <span className="poster-cta">
            <span className="play-mark">
              <IconPlay size={20} />
            </span>
            <span className="poster-label">Load preview</span>
          </span>
        </button>
      )}
    </div>
  );

  const foot = (
    <div className="tpl-foot">
      <p className="tpl-blurb">{def.blurb}</p>
      <div className="tpl-meta micro">
        <span>
          <b>{def.width}</b>×{def.height}
        </span>
        <span>
          <b>{def.fps}</b>FPS
        </span>
        <span>
          <b>{fmtDuration(def.durationInFrames, def.fps)}</b>
        </span>
        <span>ID · {COMPOSITION_IDS[def.id]}</span>
      </div>
    </div>
  );

  const cls = featured
    ? "tpl tpl--wide reg-on"
    : index === 1
      ? "tpl tpl--mid reg-on"
      : "tpl reg-on";

  return (
    <article className={cls}>
      <header className="tpl-head">
        <span className="tpl-idx micro">T-0{index + 1}</span>
        <h3>{def.name}</h3>
        {def.premium ? (
          <span className="chip-prem">
            <IconLock size={12} />
            $CHOG
          </span>
        ) : null}
      </header>
      {featured ? (
        <div className="tpl-inner">
          {stage}
          {foot}
        </div>
      ) : (
        <>
          {stage}
          {foot}
        </>
      )}
    </article>
  );
}

export default function Templates() {
  return (
    <section className="lg-sec" id="templates">
      <div className="lg-wrap">
        <header className="sec-head">
          <span className="sec-idx">§02</span>
          <h2 className="sec-title">The templates</h2>
          <span className="sec-meta micro">05 COMPOSITIONS / REMOTION 4</span>
        </header>

        <p className="sec-lede">
          Every card runs the real Remotion composition the studio renders — same code, same
          inputs, fixture-driven data. The first two play live; tap any still to load its preview.
        </p>

        <div className="tpl-grid">
          {TEMPLATES.map((def, i) => (
            <TemplateCard def={def} index={i} key={def.id} />
          ))}
        </div>
      </div>
    </section>
  );
}
