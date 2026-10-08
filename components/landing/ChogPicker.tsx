"use client";

import { useEffect } from "react";
import type { ChogNFT } from "@/lib/types";
import { fmtRarity } from "./format";
import { IconClose } from "./icons";

type Props = {
  open: boolean;
  title: string;
  subtitle: string;
  chogs: ChogNFT[];
  loading: boolean;
  onPick: (chog: ChogNFT) => void;
  onClose: () => void;
  onSample: () => void;
};

export default function ChogPicker({
  open,
  title,
  subtitle,
  chogs,
  loading,
  onPick,
  onClose,
  onSample,
}: Props) {
  useEffect(() => {
    if (!open) return;
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
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="modal"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-panel card">
        <div className="modal-head">
          <div>
            <span className="h-eyebrow">{subtitle}</span>
            <h2>{title}</h2>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close picker">
            <IconClose />
          </button>
        </div>

        {loading ? (
          <div className="skel-grid" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <span className="skel" key={i} />
            ))}
          </div>
        ) : chogs.length === 0 ? (
          <div className="modal-empty">
            <h3>No Chog Genesis in this wallet</h3>
            <p>
              The collection is 1,969 pieces on Monad — your actor has to be one of them. Nothing
              to cast yet, so run the studio with a sample Chog instead.
            </p>
            <button type="button" className="btn btn-acid" onClick={onSample}>
              Use a sample Chog
            </button>
          </div>
        ) : (
          <div className="chog-grid">
            {chogs.map((c) => (
              <button
                type="button"
                className="chog-tile"
                key={`${c.collection}-${c.tokenId}`}
                onClick={() => onPick(c)}
              >
                <span className="chog-tile-img">
                  <img src={c.image} alt={c.name} />
                  <span className="chog-tile-rank">#{c.rarityRank} / 1,969</span>
                </span>
                <span className="chog-tile-body">
                  <b>{c.name}</b>
                  <span className="micro" style={{ display: "block", marginTop: 6 }}>
                    {fmtRarity(c.rarityPercentile)}
                  </span>
                  <span className="chog-traits">
                    {c.traits.slice(0, 3).map((t) => (
                      <span className="tag" key={t.trait_type}>
                        {t.trait_type}: {t.value}
                      </span>
                    ))}
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}

        <div className="modal-foot">
          <span className="micro">
            CASTING SAVES TO THIS BROWSER ONLY · NOTHING LEAVES YOUR DEVICE
          </span>
          {chogs.length > 0 ? (
            <button type="button" className="link-quiet" onClick={onSample}>
              Switch to sample cast
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
