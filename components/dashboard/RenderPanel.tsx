"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { BroadcastData, TemplateDef } from "../../lib/types";
import type { BgmTrack } from "../../remotion/lib/bgm";
import { fmtBytes, fmtDuration, fmtElapsed, fmtMs } from "./format";

type Phase = "idle" | "bundling" | "rendering" | "ready" | "failed";

type RenderState = {
  phase: Phase;
  progress: number; // 0..1 while rendering
  elapsedMs: number; // live clock while bundling/rendering
  url?: string;
  bytes?: number;
  ms?: number;
  durationSec?: number;
  width?: number; // actual output px (scale applied)
  height?: number;
  error?: string;
};

const IDLE: RenderState = { phase: "idle", progress: 0, elapsedMs: 0 };

/**
 * Render-speed constants measured on this host (2 cores, software GL):
 * full scale ≈ 2.3 s/frame (180f price-alert = 414-419s), 720p ≈ 1.0 s/frame (180f = 171s).
 */
const SEC_FULL = 2.3;
const SEC_720 = 1.0;
const estSeconds = (frames: number, full: boolean): number =>
  Math.round(frames * (full ? SEC_FULL : SEC_720));
const fmtEst = (sec: number): string =>
  sec < 90 ? `~${sec}s` : `~${Math.ceil(sec / 60)} min`;

/** BGM tracks (see remotion/lib/bgm.tsx + scripts/make-bgm.py) and their tempo. */
const BGM_TRACKS: BgmTrack[] = ["broadcast", "trenches", "float"];
const BGM_BPM: Record<BgmTrack, string> = { broadcast: "96", trenches: "126", float: "84" };

type Props = {
  template: TemplateDef;
  broadcast: BroadcastData;
  /** Controlled score selection — page owns it so the preview Player hears it live. */
  bgm?: BgmTrack;
  onBgm?: (t: BgmTrack) => void;
};

/**
 * Render queue: POST /api/render, NDJSON phase stream
 * (bundling → rendering{progress} → ready | failed). Falls back to plain JSON.
 */
export function RenderPanel({ template, broadcast, bgm, onBgm }: Props) {
  const [state, setState] = useState<RenderState>(IDLE);
  const [cliLine, setCliLine] = useState<string | null>(null);
  /** true = 1080p-class full quality, false = 720p draft (scale 2/3). 720p is
   *  the default so the first export lands in ~3 min on this host. */
  const [fullHd, setFullHd] = useState(false);
  /** Score track: controlled by the page when wired, internal otherwise. */
  const [internalTrack, setInternalTrack] = useState<BgmTrack>("broadcast");
  const bgmTrack = bgm ?? internalTrack;
  const pickTrack = (t: BgmTrack) => (onBgm ? onBgm(t) : setInternalTrack(t));
  const outScale = fullHd ? 1 : 2 / 3;
  const outW = Math.round(template.width * outScale);
  const outH = Math.round(template.height * outScale);
  const tickRef = useRef<number | null>(null);
  const startedRef = useRef<number>(0);
  const phaseRef = useRef<Phase>("idle");

  const stopTick = useCallback(() => {
    if (tickRef.current !== null) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  useEffect(() => stopTick, [stopTick]);

  const failWith = useCallback(
    (message: string) => {
      stopTick();
      setState((s) => ({ ...s, phase: "failed", error: message, elapsedMs: performance.now() - startedRef.current }));
      setCliLine(
        `npm run render remotion/index.ts ${template.id} out/${template.id}.mp4 --props='${JSON.stringify(broadcast)}'`
      );
    },
    [broadcast, stopTick, template.id]
  );

  const handleMsg = useCallback(
    (msg: any) => {
      if (!msg || typeof msg !== "object") return;
      if (msg.phase === "bundling") {
        phaseRef.current = "bundling";
        setState((s) => ({ ...s, phase: "bundling", progress: 0 }));
      } else if (msg.phase === "rendering") {
        phaseRef.current = "rendering";
        setState((s) => ({
          ...s,
          phase: "rendering",
          progress: typeof msg.progress === "number" ? msg.progress : s.progress,
        }));
      } else if (msg.phase === "ready") {
        phaseRef.current = "ready";
        stopTick();
        setState({
          phase: "ready",
          progress: 1,
          elapsedMs: typeof msg.ms === "number" ? msg.ms : performance.now() - startedRef.current,
          url: String(msg.url ?? ""),
          bytes: typeof msg.bytes === "number" ? msg.bytes : 0,
          ms: typeof msg.ms === "number" ? msg.ms : 0,
          durationSec: typeof msg.durationSec === "number" ? msg.durationSec : 0,
          width: typeof msg.width === "number" ? msg.width : undefined,
          height: typeof msg.height === "number" ? msg.height : undefined,
        });
        setCliLine(null);
        // auto-download: the export IS the deliverable — fire it the moment
        // the render lands (the visible Download MP4 link stays as fallback).
        const readyUrl = String(msg.url ?? "");
        if (readyUrl) {
          try {
            const a = document.createElement("a");
            a.href = readyUrl;
            a.download = readyUrl.split("/").pop() || "chogram.mp4";
            a.rel = "noopener";
            document.body.appendChild(a);
            a.click();
            a.remove();
          } catch {
            /* popup/blocked — the Download MP4 link remains usable */
          }
        }
      } else if (msg.phase === "failed") {
        phaseRef.current = "failed";
        failWith(String(msg.error ?? "Render failed"));
      }
    },
    [failWith, stopTick]
  );

  const startRender = useCallback(async () => {
    stopTick();
    setCliLine(null);
    startedRef.current = performance.now();
    phaseRef.current = "bundling";
    setState({ phase: "bundling", progress: 0, elapsedMs: 0 });
    tickRef.current = window.setInterval(() => {
      setState((s) =>
        s.phase === "bundling" || s.phase === "rendering"
          ? { ...s, elapsedMs: performance.now() - startedRef.current }
          : s
      );
    }, 120);

    try {
      const res = await fetch("/api/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: template.id,
          broadcast: { ...broadcast, custom: { ...broadcast.custom, bgm: bgmTrack } },
          scale: outScale,
        }),
      });

      const contentType = res.headers.get("content-type") ?? "";
      if (!res.ok) {
        let message = `HTTP ${res.status}`;
        try {
          const data = await res.json();
          if (data?.error) message = String(data.error);
        } catch {
          /* non-JSON error body */
        }
        failWith(message);
        return;
      }

      if (contentType.includes("ndjson") && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          let nl = buf.indexOf("\n");
          while (nl >= 0) {
            const line = buf.slice(0, nl).trim();
            buf = buf.slice(nl + 1);
            if (line) {
              try {
                handleMsg(JSON.parse(line));
              } catch {
                /* partial line */
              }
            }
            nl = buf.indexOf("\n");
          }
        }
        const tail = buf.trim();
        if (tail) {
          try {
            handleMsg(JSON.parse(tail));
          } catch {
            /* ignore */
          }
        }
        if (phaseRef.current === "bundling" || phaseRef.current === "rendering") {
          failWith("Stream ended without a terminal state");
        }
      } else {
        const data = await res.json();
        handleMsg(data?.url ? { ...data, phase: "ready" } : data);
        if (!data?.url && !data?.error) failWith("Malformed response from /api/render");
      }
    } catch (err) {
      failWith(err instanceof Error ? err.message : String(err));
    }
  }, [bgmTrack, broadcast, failWith, handleMsg, outScale, stopTick, template.id]);

  const busy = state.phase === "bundling" || state.phase === "rendering";
  const statusText =
    state.phase === "idle"
      ? "IDLE — READY FOR EXPORT"
      : state.phase === "bundling"
        ? "BUNDLING — COMPILING REMOTION BUNDLE"
        : state.phase === "rendering"
          ? `RENDERING — ${Math.round(state.progress * 100)}% · ${fmtElapsed(state.elapsedMs)}${
              state.progress > 0.03
                ? ` · REMAIN ${fmtEst(
                    Math.round(
                      (state.elapsedMs / 1000 / state.progress) * (1 - state.progress)
                    )
                  )}`
                : ""
            }`
          : state.phase === "ready"
            ? `READY — ${fmtBytes(state.bytes ?? 0)} · ${state.width ?? template.width}x${state.height ?? template.height} · ${fmtDuration(template.durationInFrames, template.fps)} CUT · ${fmtMs(state.ms ?? 0)} WALL`
            : `FAILED — ${state.error ?? "unknown error"}`;

  return (
    <section className="panel render-panel" aria-label="Render queue">
      <div className="clapper" aria-hidden="true">
        <span className="clapper__stripes" />
      </div>
      <div className="panel__head panel__head--flush">
        <span className="micro">RENDER_QUEUE</span>
        <span className="micro panel__head-right">
          H.264 · CONCURRENCY 1 · {template.id.toUpperCase()}
        </span>
      </div>

      <div className="render-status" role="status" aria-live="polite">
        <span className={`rec ${busy ? "is-rec" : ""} ${state.phase === "failed" ? "is-fail" : ""}`}>
          <span className="rec__dot" aria-hidden="true" />
          {busy ? "REC" : state.phase === "failed" ? "ERR" : state.phase === "ready" ? "OK" : "STBY"}
        </span>
        <span className="render-status__text mono">{statusText}</span>
      </div>

      <div className="render-progress" aria-hidden="true">
        <span
          className={`render-progress__fill ${state.phase === "failed" ? "is-fail" : ""}`}
          style={{
            width:
              state.phase === "ready"
                ? "100%"
                : state.phase === "failed"
                  ? "100%"
                  : `${Math.round(state.progress * 100)}%`,
          }}
        />
      </div>

      <div className="render-quality" role="group" aria-label="Export quality">
        <button
          type="button"
          className={`rq ${fullHd ? "" : "is-on"}`}
          aria-pressed={!fullHd}
          disabled={busy}
          onClick={() => setFullHd(false)}
        >
          <span className="rq__res">720p</span>
          <span className="rq__meta mono">
            {Math.round((template.width * 2) / 3)}×{Math.round((template.height * 2) / 3)} ·{" "}
            {fmtEst(estSeconds(template.durationInFrames, false))}
          </span>
        </button>
        <button
          type="button"
          className={`rq ${fullHd ? "is-on" : ""}`}
          aria-pressed={fullHd}
          disabled={busy}
          onClick={() => setFullHd(true)}
        >
          <span className="rq__res">1080p</span>
          <span className="rq__meta mono">
            {template.width}×{template.height} · {fmtEst(estSeconds(template.durationInFrames, true))}
          </span>
        </button>
      </div>

      <div className="render-bgm" role="group" aria-label="Score track">
        <span className="micro">SCORE · 20s LOOP</span>
        <div className="render-bgm__row">
          {BGM_TRACKS.map((track) => (
            <button
              key={track}
              type="button"
              className={`rq bt ${bgmTrack === track ? "is-on" : ""}`}
              aria-pressed={bgmTrack === track}
              disabled={busy}
              onClick={() => pickTrack(track)}
            >
              <span className="rq__res">{track.toUpperCase()}</span>
              <span className="rq__meta mono">{BGM_BPM[track]} BPM</span>
            </button>
          ))}
        </div>
      </div>

      <div className="render-actions">
        <button
          type="button"
          className="btn btn-acid"
          onClick={startRender}
          disabled={busy}
        >
          {busy ? "Rendering…" : state.phase === "ready" ? "Export Again" : "Export MP4"}
        </button>

        {state.phase === "ready" && state.url ? (
          <a className="btn btn-primary" href={state.url} download>
            Download MP4
          </a>
        ) : null}

        <span className="render-meta mono">
          {state.phase === "ready"
            ? `${fmtBytes(state.bytes ?? 0)} · ${state.width ?? outW}x${state.height ?? outH} · ${template.fps}fps`
            : busy
              ? `ELAPSED ${fmtElapsed(state.elapsedMs)} · EST TOTAL ${fmtEst(estSeconds(template.durationInFrames, fullHd))}`
              : `OUTPUT /public/exports/ · ${outW}x${outH}`}
        </span>
      </div>

      {state.phase === "failed" && state.error ? (
        <div className="render-fallback">
          <p className="render-fallback__msg">{state.error}</p>
          <p className="micro">FALLBACK — RUN THE RENDER LOCALLY</p>
          <pre className="cli-line mono">{cliLine}</pre>
        </div>
      ) : null}
    </section>
  );
}
