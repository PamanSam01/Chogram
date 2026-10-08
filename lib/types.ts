// CHOGRAM shared types — DO NOT change field names. Every module depends on this.
export type Trait = { trait_type: string; value: string | number };

export type ChogNFT = {
  tokenId: string;
  collection: string;
  name: string;
  image: string; // absolute URL or local path like /chogs/chog1.jpg
  traits: Trait[];
  rarityRank: number; // 1 = rarest, out of 1969
  rarityPercentile: number; // 0..1, 1 = rarest
  holder: string; // owner address 0x...
};

export type MarketData = {
  chogPriceUsd: number;
  chogChange24h: number; // percent, e.g. -15.2
  floorMon: number;
  floorUsd: number;
  holders: number;
  ts: number; // ms epoch
};

export type BroadcastData = {
  chog: ChogNFT;
  market: MarketData;
  generatedAt: string; // ISO string
  custom?: Record<string, string>;
};

export type TemplateId =
  | "summon"
  | "price-alert"
  | "pfp-flex"
  | "meme-clip"
  | "chog-wrapped";

export type TemplateDef = {
  id: TemplateId;
  name: string;
  blurb: string;
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
  premium: boolean; // unlocked with $CHOG
};
