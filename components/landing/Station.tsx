import { Fragment } from "react";

import { IconArrow } from "./icons";

type Stage = {
  cls: string;
  idx: string;
  kicker: string;
  title: string;
  body: string;
  rows: [string, string][];
};

/**
 * §04 — THE BROADCAST STATION. Sells the V2 retention loop as a console signal
 * path: ARM → FIRE → ARCHIVED. Every number here mirrors the real pipeline
 * (scripts/broadcast-daemon.mjs poll, /api/alerts/fire render, broadcast archive).
 */
const STAGES: Stage[] = [
  {
    cls: "stg-a",
    idx: "01",
    kicker: "IN / ARM",
    title: "Arm an alert",
    body: "Set the move you are waiting for — 5% down, 12% up, either direction. The CHOGRAM daemon reads $CHOG from Dexscreener once every 60 seconds and holds the alert until the move lands. No tab to keep open, no schedule for you to babysit.",
    rows: [
      ["Threshold", "0.5 – 50%"],
      ["Poll", "EVERY 60S"],
      ["Direction", "UP · DOWN · ANY"],
    ],
  },
  {
    cls: "stg-b",
    idx: "02",
    kicker: "PROC / FIRE",
    title: "CHOGRAM renders for you",
    body: "On trigger the station pushes the alert into the render pipeline and a signed Price Alert clip comes out the other end — unattended, scored with the broadcast BGM. Measured end to end on this host: 171 seconds at 720p, nobody at the keyboard.",
    rows: [
      ["Cut", "PRICE ALERT · 720P"],
      ["Typical", "~3 MIN / 171S"],
      ["Score", "BGM · 3 TRACKS"],
    ],
  },
  {
    cls: "stg-c",
    idx: "03",
    kicker: "OUT / ARCHIVE",
    title: "It lands in your archive",
    body: "Timestamped, sized, downloadable. Fired or hand-exported, every clip is appended to your archive with its resolution, file size and render time — newest 50 kept. Download it, post it, arm the next one.",
    rows: [
      ["Kept", "NEWEST 50"],
      ["Fields", "TIME · SIZE · MS"],
      ["File", "MP4 · 1 CLICK"],
    ],
  },
];

/** Loop-state strip: ARMED → FIRING → ARCHIVED (CSS cycles the highlight). */
const STATES: { cls: string; label: string; note: string }[] = [
  { cls: "st-chip-a", label: "ARMED", note: "60S POLL" },
  { cls: "st-chip-b", label: "FIRING", note: "~3 MIN" },
  { cls: "st-chip-c", label: "ARCHIVED", note: "MP4 FILED" },
];

export default function Station() {
  return (
    <section className="lg-sec" id="station">
      <div className="lg-wrap">
        <header className="sec-head">
          <span className="sec-idx">§04</span>
          <h2 className="sec-title">The broadcast station</h2>
          <span className="sec-meta micro">ARM → FIRE → ARCHIVED</span>
        </header>

        <p className="sec-lede">
          The studio waits for you to press Export. The station keeps going: arm a threshold and
          CHOGRAM watches <b>$CHOG</b> while you are away — trigger to downloadable MP4 in about
          three minutes, with nobody at the keyboard.
        </p>

        <div className="st-strip reg-on">
          <span className="st-strip-tag micro">Loop state</span>
          <div className="st-states">
            {STATES.map((s, i) => (
              <Fragment key={s.label}>
                {i > 0 ? (
                  <span className="st-link" aria-hidden="true">
                    <i />
                    <IconArrow size={13} />
                  </span>
                ) : null}
                <span className={`st-chip ${s.cls}`}>
                  <i className="st-led" aria-hidden="true" />
                  <b>{s.label}</b>
                  <span className="micro">{s.note}</span>
                </span>
              </Fragment>
            ))}
          </div>
        </div>

        <ol className="st-path">
          {STAGES.map((s) => (
            <li className={`stg ${s.cls}`} key={s.idx}>
              <div className="stg-head">
                <span className="stg-num">{s.idx}</span>
                <span className="stg-kicker micro">{s.kicker}</span>
              </div>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
              <dl className="st-read">
                {s.rows.map(([k, v]) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
            </li>
          ))}
        </ol>

        <div className="st-foot">
          <a className="btn btn-acid st-cta" href="/dashboard">
            Open the Station
            <IconArrow size={16} />
          </a>
          <span className="micro">
            Local daemon · npm run daemon · polls every 60s · never exits
          </span>
        </div>
      </div>
    </section>
  );
}
