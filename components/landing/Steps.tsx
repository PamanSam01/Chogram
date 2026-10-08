const STEPS = [
  {
    idx: "01",
    cls: "step-a",
    title: "Summon your Chog",
    body: "Connect on Monad (chain 143) or run it wallet-free with a sample actor. CHOGRAM reads your Chog Genesis token — six traits, rarity rank out of 1,969 — and casts it as the lead.",
    tag: "WALLET OR SAMPLE",
  },
  {
    idx: "02",
    cls: "step-b",
    title: "Pick a broadcast template",
    body: "Five Remotion compositions: The Summon, Price Alert, PFP Flex, Meme Clip, Chog Wrapped. Your traits and the live $CHOG feed are baked into every frame, and you choose the score at export from three BGM tracks — Broadcast, Trenches, Float. Premium cuts open two ways: hold $CHOG, or burn 500 once.",
    tag: "05 COMPOSITIONS · 3 SCORES",
  },
  {
    idx: "03",
    cls: "step-c",
    title: "Export & post",
    body: "Hit Export MP4 in the studio: 1920×1080 for the feed, 4:5 for the timeline. The file auto-downloads the moment the render lands, and every clip — studio or station — is logged to your archive with its resolution, size and render time. Rendered from real data, ready to post.",
    tag: "MP4 · 30FPS",
  },
];

export default function Steps() {
  return (
    <section className="lg-sec" id="how">
      <div className="lg-wrap">
        <header className="sec-head">
          <span className="sec-idx">§01</span>
          <h2 className="sec-title">How it works</h2>
          <span className="sec-meta micro">THREE MOVES / ONE CHOG</span>
        </header>

        <ol className="steps">
          {STEPS.map((s) => (
            <li className={`step ${s.cls}`} key={s.idx}>
              <span className="step-num">{s.idx}</span>
              <div className="step-body">
                <h3>{s.title}</h3>
                <p>{s.body}</p>
                <span className="step-tag micro">{s.tag}</span>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
