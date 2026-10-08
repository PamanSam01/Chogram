"use client";

import type { KeyboardEvent } from "react";
import type { ChogNFT, TemplateDef } from "../../lib/types";
import { fmtDuration, fmtRes } from "./format";

type Props = {
  templates: TemplateDef[];
  selected: string | null;
  unlocked: (t: TemplateDef) => boolean;
  wallet: string | null;
  chog: ChogNFT | null;
  connecting: boolean;
  connectError: string | null;
  onSelect: (id: TemplateDef["id"]) => void;
  onConnect: () => void;
};

function Padlock({ size = 26 }: { size?: number }) {
  return (
    <svg
      className="padlock"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="square"
      aria-hidden="true"
    >
      <rect x="4.5" y="10.5" width="15" height="9.5" />
      <path d="M8 10.5V7.6a4 4 0 0 1 8 0v2.9" />
      <path d="M12 14v2.6" />
    </svg>
  );
}

/** Broadcast format slates: aspect-true letterboxed thumbnails, mono spec lines, $CHOG locks. */
export function TemplateGallery({
  templates,
  selected,
  unlocked,
  wallet,
  chog,
  connecting,
  connectError,
  onSelect,
  onConnect,
}: Props) {
  const openCount = templates.filter(unlocked).length;

  const handleKey = (e: KeyboardEvent<HTMLDivElement>, t: TemplateDef) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (unlocked(t)) onSelect(t.id);
    }
  };

  return (
    <section className="panel gallery-panel" aria-label="Template gallery">
      <div className="panel__head">
        <span className="micro">TEMPLATE_SLATES</span>
        <span className="micro panel__head-right">
          {openCount}/{templates.length} OPEN · {templates.length - openCount} LOCKED
        </span>
      </div>

      <div className="slate-grid">
        {templates.map((t) => {
          const isOpen = unlocked(t);
          const isSel = selected === t.id;
          const ar = `${t.width} / ${t.height}`;
          return (
            <div
              key={t.id}
              className={`slate ${isSel ? "is-sel" : ""} ${isOpen ? "" : "is-locked"}`}
              role="button"
              tabIndex={isOpen ? 0 : -1}
              aria-pressed={isSel}
              aria-disabled={!isOpen}
              onClick={() => isOpen && onSelect(t.id)}
              onKeyDown={(e) => handleKey(e, t)}
            >
              <div className="slate__frame">
                <div className="slate__inner" style={{ aspectRatio: ar }}>
                  {chog ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="slate__img" src={chog.image} alt="" aria-hidden="true" />
                  ) : null}
                  <span className="slate__code mono">{t.id.toUpperCase()}</span>
                  <span className="slate__tally" aria-hidden="true" />
                </div>

                {isOpen ? null : (
                  <div className="slate__lock">
                    <Padlock />
                    <p className="slate__lock-title">
                      {wallet ? "HOLD OR BURN $CHOG TO UNLOCK" : "PREMIUM SLATE"}
                    </p>
                    <p className="slate__lock-sub">
                      {wallet
                        ? "Opens when balanceOf() > 0 on chain 143 — or burn 500 $CHOG once to 0x…dEaD."
                        : "Connect a wallet that holds $CHOG — or burn 500 $CHOG once — to open this format."}
                    </p>
                    {wallet ? null : (
                      <button
                        type="button"
                        className="btn btn-acid slate__lock-cta"
                        disabled={connecting}
                        onClick={(e) => {
                          e.stopPropagation();
                          onConnect();
                        }}
                      >
                        {connecting ? "Connecting…" : "Connect Wallet"}
                      </button>
                    )}
                    {connectError ? (
                      <p className="err-line slate__lock-err">{connectError}</p>
                    ) : null}
                  </div>
                )}
              </div>

              <div className="slate__meta">
                <div className="slate__title-row">
                  <span className="slate__name">{t.name}</span>
                  {t.premium ? <span className="slate__badge">PREMIUM</span> : null}
                </div>
                <span className="slate__spec mono">
                  {fmtRes(t.width, t.height)} · {t.fps}fps · {fmtDuration(t.durationInFrames, t.fps)}
                </span>
                <span className="slate__blurb">{t.blurb}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
