import { shortAddr } from "@/lib/chog";
type Props = {
  wallet: string | null;
  connecting: boolean;
  onConnect: () => void;
  onOpenPicker: () => void;
};

const LINKS = [
  { id: "how", idx: "01", label: "How it works" },
  { id: "templates", idx: "02", label: "Templates" },
  { id: "why", idx: "03", label: "Why NFT" },
  { id: "station", idx: "04", label: "Station" },
];

export default function Nav({ wallet, connecting, onConnect, onOpenPicker }: Props) {
  const jump = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <header className="lg-nav">
      <div className="lg-wrap lg-nav-in">
        <a className="brand" href="#top" onClick={(e) => jump(e, "top")} aria-label="CHOGRAM home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo/logo.png"
            alt="CHOGRAM"
            className="brand-logo-img"
          />
          <span className="brand-sub">CHOG BROADCAST STUDIO</span>
        </a>

        <nav className="nav-links" aria-label="Sections">
          {LINKS.map((l) => (
            <a key={l.id} href={`#${l.id}`} onClick={(e) => jump(e, l.id)}>
              <i>{l.idx}</i>
              {l.label}
            </a>
          ))}
        </nav>

        <div className="nav-act">
          <span className="nav-rec micro" aria-hidden="true">
            REC ●
          </span>
          {wallet ? (
            <button type="button" className="wallet-chip" onClick={onOpenPicker} title="Pick a Chog">
              <span className="wallet-dot" aria-hidden="true" />
              {shortAddr(wallet)}
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              onClick={onConnect}
              disabled={connecting}
            >
              {connecting ? "Connecting…" : "Connect Wallet"}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
