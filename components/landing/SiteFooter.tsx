import { IconUpRight } from "./icons";

const LINKS = [
  { label: "Discord", handle: "discord.gg/chog", href: "https://discord.gg/chog" },
  { label: "X", handle: "@ChogNFT", href: "https://x.com/ChogNFT" },
  { label: "Site", handle: "chog.xyz", href: "https://chog.xyz" },
];

export default function SiteFooter() {
  return (
    <footer className="lg-foot">
      <div className="lg-wrap">
        <div className="foot-mark" aria-hidden="true">
          CHOGRAM
        </div>

        <div className="foot-grid">
          <nav className="foot-links" aria-label="Community links">
            {LINKS.map((l) => (
              <a key={l.handle} href={l.href} target="_blank" rel="noreferrer noopener">
                {l.label} — {l.handle}
                <IconUpRight size={13} />
              </a>
            ))}
          </nav>
          <span className="micro">YOUR CHOG IS THE ACTOR</span>
        </div>

        <div className="foot-meta">
          <span className="micro micro-acid">BUILT FOR CHOGATHON 2026</span>
          <span className="micro">MONAD / 143</span>
          <span className="micro">CHOGRAM — CHOG BROADCAST STUDIO</span>
          <span className="micro">SUPPLY 1,969 · OWNERS 1.0K</span>
        </div>
      </div>
    </footer>
  );
}
