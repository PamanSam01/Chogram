"use client";

import { useCallback, useEffect, useState } from "react";

import type { BroadcastMeta } from "../../app/api/broadcasts/types";
import { TEMPLATES } from "../../lib/fixtures";
import { fmtBytes } from "./format";

function errText(err: unknown): string {
  return err instanceof Error ? err.message || String(err) : String(err);
}

/** 2026-10-07 20:15:32 — console-style local stamp, tabular columns. */
function fmtStamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const p = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(
    d.getMinutes()
  )}:${p(d.getSeconds())}`;
}

/**
 * Broadcast archive: every finished render (studio exports + auto-fired alert
 * clips) recorded in data/broadcasts.json, newest first, last 50 kept.
 */
export function ArchivePanel() {
  const [items, setItems] = useState<BroadcastMeta[] | null>(null); // null = still connecting
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/broadcasts", { cache: "no-store" });
      let body: { broadcasts?: unknown; error?: unknown } | null = null;
      try {
        body = (await res.json()) as { broadcasts?: unknown; error?: unknown };
      } catch {
        /* non-JSON body */
      }
      if (!res.ok) throw new Error(body && typeof body.error === "string" ? body.error : `HTTP ${res.status}`);
      setItems(Array.isArray(body?.broadcasts) ? (body.broadcasts as BroadcastMeta[]) : []);
      setError(null);
    } catch (err) {
      setError(errText(err));
      setItems((prev) => prev ?? []);
    }
  }, []);

  useEffect(() => {
    void load();
    // Poll: alert clips land unattended — the archive must pick them up on its own.
    const id = window.setInterval(() => {
      if (document.visibilityState !== "hidden") void load();
    }, 5000);
    return () => window.clearInterval(id);
  }, [load]);

  return (
    <section className="panel archive-panel" aria-label="Broadcast archive">
      <div className="panel__head">
        <span className="micro">BROADCAST_ARCHIVE</span>
        <span className="micro panel__head-right mono">
          {items === null ? "CONNECTING" : `${items.length} / 50 KEPT · NEWEST FIRST`}
        </span>
      </div>

      {error ? <p className="err-line alerts-error">{error}</p> : null}

      {items !== null && items.length === 0 ? (
        <p className="arch-empty">No broadcasts yet — export one from the studio.</p>
      ) : null}

      {items !== null && items.length > 0 ? (
        <div className="arch-scroll">
          <table className="arch-table">
            <thead>
              <tr>
                <th scope="col">TIME</th>
                <th scope="col">TEMPLATE</th>
                <th scope="col">OUTPUT</th>
                <th scope="col">CUT</th>
                <th scope="col">SIZE</th>
                <th scope="col">RENDER</th>
                <th scope="col">FILE</th>
              </tr>
            </thead>
            <tbody>
              {items.map((b) => {
                const template = TEMPLATES.find((t) => t.id === b.template);
                const scale = Number.isFinite(b.scale) && b.scale > 0 ? b.scale : 1;
                const resolution = template
                  ? `${Math.round(template.width * scale)}x${Math.round(template.height * scale)}`
                  : "—";
                const cut = template ? `${(template.durationInFrames / template.fps).toFixed(1)}s` : "—";
                return (
                  <tr key={`${b.at}-${b.file}`}>
                    <td className="mono">{fmtStamp(b.at)}</td>
                    <td>
                      {template ? template.name : b.template}
                      {b.alertId ? <span className="arch-tag">ALERT</span> : null}
                      {b.bgm ? <span className="arch-tag">{b.bgm.toUpperCase()}</span> : null}
                    </td>
                    <td className="mono">{resolution}</td>
                    <td className="mono">{cut}</td>
                    <td className="mono">{fmtBytes(b.bytes)}</td>
                    <td className="mono">{Number.isFinite(b.ms) ? `${(b.ms / 1000).toFixed(1)}s` : "—"}</td>
                    <td>
                      <a className="arch-link mono" href={`/exports/${b.file}`} download>
                        MP4
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}

      <p className="micro arch-hint">
        KEPT IN data/broadcasts.json · NEWEST 50 SURVIVE · APPENDED AUTOMATICALLY ON EVERY READY RENDER
      </p>
    </section>
  );
}
