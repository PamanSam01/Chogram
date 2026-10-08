import type { ReactNode } from "react";
import { CHOG_GENESIS, CHOG_TOKEN } from "@/lib/market";

const REASONS: { idx: string; title: string; body: ReactNode }[] = [
  {
    idx: "A",
    title: "Traits drive the rig",
    body: "Background, Eyes, Head, Mouth, Body and Aura are read from the Chog Genesis token at render time and mapped onto the character rig, palette and camera. Laser eyes and a Crown are literally in the shot — two Chogs never produce the same film.",
  },
  {
    idx: "B",
    title: "Rarity drives the rank HUD",
    body: "rarityRank #42 / 1,969 and rarityPercentile come straight from the collection, not a form field: the on-screen rank plate, percentile bar and tier badge are computed from your token every time you render.",
  },
  {
    idx: "C",
    title: "Holder gates access",
    body: `Every composition is built against a connected wallet that owns Chog Genesis (${CHOG_GENESIS.slice(0, 6)}…${CHOG_GENESIS.slice(-4)}) on Monad. No token, no actor, no film. Premium templates open two ways: hold $CHOG, or burn 500 $CHOG once.`,
  },
  {
    idx: "D",
    title: "Signed at render time",
    body: (
      <>
        The Summon and every Price Alert — studio export or auto-fired — burn{" "}
        <code>BROADCAST SIG 0x…</code> into the frame: an FNV-1a hash of tokenId + holder + render
        timestamp. Same Chog, one second apart, two different signatures — a clip that escapes into
        the wild traces straight back to the token that produced it.
      </>
    ),
  },
];

export default function WhyNft() {
  return (
    <section className="lg-sec" id="why">
      <div className="lg-wrap">
        <header className="sec-head">
          <span className="sec-idx">§03</span>
          <h2 className="sec-title">Why the Chog NFT matters</h2>
          <span className="sec-meta micro">THE HARD RULE</span>
        </header>

        <div className="why-grid">
          <div className="why-claim reg-on">
            <p className="why-statement">
              Remove the NFT and the film <em>cannot</em> be generated.
            </p>
            <p className="why-note micro">
              Every composition reads traits · rarity · holder from the token at render time.
              Nothing here is a form input.
            </p>
            <svg
              className="why-arrow"
              width="132"
              height="26"
              viewBox="0 0 132 26"
              aria-hidden="true"
              focusable="false"
            >
              <path
                d="M0 13 H124 M112 4 L124 13 L112 22"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="square"
              />
            </svg>
            <p className="micro" style={{ marginTop: 14 }}>
              GENESIS {CHOG_GENESIS.slice(0, 10)}… · $CHOG {CHOG_TOKEN.slice(0, 8)}…
            </p>
          </div>

          <ol className="why-list">
            {REASONS.map((r) => (
              <li className="why-item" key={r.idx}>
                <span className="why-idx">{r.idx}</span>
                <div>
                  <h3>{r.title}</h3>
                  <p>{r.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
