"use client";

import { useEffect, useRef, useState } from "react";
import { Player, type PlayerRef } from "@remotion/player";
import type { BroadcastData, TemplateDef } from "../../lib/types";
import type { CompositionComponent } from "./compositions";
import { fmtDuration, fmtRes, timecode } from "./format";

type FrameProps = {
  template: TemplateDef;
  component: CompositionComponent;
  inputProps: BroadcastData;
  controls?: boolean;
  onFrame?: (frame: number) => void;
  label?: string;
};

/** Aspect-true framed Player — the shared render surface for monitor + modal. */
function PlayerFrame({ template, component, inputProps, controls = true, onFrame, label }: FrameProps) {
  const ref = useRef<PlayerRef>(null);

  useEffect(() => {
    const player = ref.current;
    if (!player) return;
    const listener = (e: { detail: { frame: number } }) => onFrame?.(e.detail.frame);
    player.addEventListener("frameupdate", listener);
    return () => player.removeEventListener("frameupdate", listener);
  }, [onFrame]);

  return (
    <div
      className="pf-frame"
      style={
        {
          aspectRatio: `${template.width} / ${template.height}`,
          "--ar-num": String(template.width / template.height),
        } as React.CSSProperties
      }
      aria-label={label ?? `${template.name} preview`}
    >
      <Player
        ref={ref}
        component={component}
        inputProps={inputProps}
        durationInFrames={template.durationInFrames}
        compositionWidth={template.width}
        compositionHeight={template.height}
        fps={template.fps}
        controls={controls}
        loop
        doubleClickToFullscreen
        acknowledgeRemotionLicense
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}

/** Program monitor: bezel, safe-area corner marks, live timecode, meta chips. */
export function ProgramMonitor({ template, component, inputProps }: Omit<FrameProps, "controls">) {
  const [frame, setFrame] = useState(0);

  return (
    <section className="monitor" aria-label="Program monitor">
      <div className="monitor__bar">
        <span className="micro">
          <span className="live-dot" aria-hidden="true" />
          PROGRAM_MONITOR
        </span>
        <span className="monitor__tc mono">{timecode(frame, template.fps)}</span>
        <span className="monitor__frame mono">
          FRAME {frame.toString().padStart(3, "0")}/{template.durationInFrames}
        </span>
      </div>

      <div className="monitor__bezel">
        <div className="monitor__screen">
          <PlayerFrame
            template={template}
            component={component}
            inputProps={inputProps}
            onFrame={setFrame}
            label={`${template.name} program monitor`}
          />
          <span className="safe safe--tl" aria-hidden="true" />
          <span className="safe safe--tr" aria-hidden="true" />
          <span className="safe safe--bl" aria-hidden="true" />
          <span className="safe safe--br" aria-hidden="true" />
        </div>
      </div>

      <div className="monitor__chips">
        <span className="tag chip-mono mono">{fmtRes(template.width, template.height)}</span>
        <span className="tag chip-mono mono">{template.fps} FPS</span>
        <span className="tag chip-mono mono">{fmtDuration(template.durationInFrames, template.fps)}</span>
        <span className="tag chip-mono mono">H.264</span>
        <span className="tag chip-hint">Double-click to fullscreen</span>
      </div>
    </section>
  );
}

/** Fullscreen replay modal (Summon) — letterboxed by aspect-ratio at every size. */
export function ModalPlayer({
  template,
  component,
  inputProps,
  onClose,
}: Omit<FrameProps, "controls" | "onFrame"> & { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label={`${template.name} replay`}>
      <div className="modal__sheet">
        <div className="modal__bar">
          <span className="micro">REPLAY · {template.id.toUpperCase()}</span>
          <button type="button" className="btn btn-ghost modal__close" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="modal__stage">
          <PlayerFrame
            template={template}
            component={component}
            inputProps={inputProps}
            label={`${template.name} replay`}
          />
        </div>
      </div>
    </div>
  );
}
