import type { BroadcastData, ChogNFT, MarketData, TemplateDef } from "./types";

/**
 * Sample Chogs — every field below is real on-chain data for mainnet contract
 * 0xc96d31f8626c6d03fae5dcd3d61e3fb9f4a73763 (Monad chain 143):
 *   - name / traits .... tokenURI metadata fetched from the collection's IPFS CID
 *   - image ............ that token's real art, downloaded to public/chogs/nft-<id>.jpg
 *   - rarityRank ....... trait-frequency ranking over all 1969 tokens
 *                        (public/fixtures/rarity.json, rank 1 = rarest);
 *                        rarityPercentile = 1 - (rank - 1) / 1969
 *   - holder ........... ownerOf() on-chain at 2026-10-07
 * Entries 0-2 are the original three samples (same tokenIds), now carrying their
 * real metadata; entries 3-5 belong to one verified holder of five Chogs.
 */
export const SAMPLE_CHOGS: ChogNFT[] = [
  {
    tokenId: "1806",
    collection: "Chog Genesis",
    name: "CHOG #1298",
    image: "/chogs/nft-1806.jpg",
    traits: [
      { trait_type: "Background", value: "Lime Green" },
      { trait_type: "Aura", value: "Wind" },
      { trait_type: "Base", value: "Origin" },
      { trait_type: "Skin", value: "Origin" },
      { trait_type: "Side", value: "Left" },
      { trait_type: "Body", value: "Red jacket" },
      { trait_type: "Mouth", value: "Smile" },
      { trait_type: "Eyes", value: "Clown Eye" },
      { trait_type: "Head", value: "MEGA Chog" },
      { trait_type: "Accessory", value: "Green Candle" },
      { trait_type: "Form", value: "Chog" },
      { trait_type: "Tier", value: "Uncommon" },
      { trait_type: "Naked", value: "No" },
    ],
    rarityRank: 169,
    rarityPercentile: 0.9147,
    holder: "0x125530f633b8cd23236fa5b88539776ea4a94302",
  },
  {
    tokenId: "1298",
    collection: "Chog Genesis",
    name: "CHOG #790",
    image: "/chogs/nft-1298.jpg",
    traits: [
      { trait_type: "Background", value: "Light Purple" },
      { trait_type: "Aura", value: "Burning Aura" },
      { trait_type: "Base", value: "Origin" },
      { trait_type: "Skin", value: "Origin" },
      { trait_type: "Side", value: "Left" },
      { trait_type: "Body", value: "red tee" },
      { trait_type: "Mouth", value: "Mon coin" },
      { trait_type: "Eyes", value: "Clown Eye Mix" },
      { trait_type: "Head", value: "Russian Hat" },
      { trait_type: "Form", value: "Chog" },
      { trait_type: "Tier", value: "Uncommon" },
      { trait_type: "Naked", value: "No" },
    ],
    rarityRank: 442,
    rarityPercentile: 0.776,
    holder: "0x9b1de5b0d8f033d171a1057333960afd66249d65",
  },
  {
    tokenId: "777",
    collection: "Chog Genesis",
    name: "CHOG #269",
    image: "/chogs/nft-777.jpg",
    traits: [
      { trait_type: "Background", value: "Aqua" },
      { trait_type: "Aura", value: "Fire" },
      { trait_type: "Base", value: "Origin" },
      { trait_type: "Skin", value: "Red" },
      { trait_type: "Side", value: "Right" },
      { trait_type: "Body", value: "Banana suit" },
      { trait_type: "Mouth", value: "Smile" },
      { trait_type: "Eyes", value: "Green laser" },
      { trait_type: "Form", value: "Chog" },
      { trait_type: "Tier", value: "Common" },
      { trait_type: "Naked", value: "No" },
    ],
    rarityRank: 1256,
    rarityPercentile: 0.3626,
    holder: "0x125530f633b8cd23236fa5b88539776ea4a94302",
  },
  {
    tokenId: "1613",
    collection: "Chog Genesis",
    name: "CHOG #1105",
    image: "/chogs/nft-1613.jpg",
    traits: [
      { trait_type: "Background", value: "Lemon Yellow" },
      { trait_type: "Base", value: "Origin" },
      { trait_type: "Skin", value: "Pink" },
      { trait_type: "Side", value: "Left" },
      { trait_type: "Body", value: "Grey Shirt" },
      { trait_type: "Mouth", value: "Sad" },
      { trait_type: "Eyes", value: "Clown Eye Mix" },
      { trait_type: "Head", value: "Wizard Beanie" },
      { trait_type: "Accessory", value: "SB" },
      { trait_type: "Form", value: "Chog" },
      { trait_type: "Tier", value: "Uncommon" },
      { trait_type: "Naked", value: "No" },
    ],
    rarityRank: 275,
    rarityPercentile: 0.8608,
    holder: "0x0fC538F514E9f65fF97d77b09043E0A7edeFda5d",
  },
  {
    tokenId: "1584",
    collection: "Chog Genesis",
    name: "CHOG #1076",
    image: "/chogs/nft-1584.jpg",
    traits: [
      { trait_type: "Background", value: "Aqua Mint" },
      { trait_type: "Base", value: "Origin" },
      { trait_type: "Skin", value: "Pink" },
      { trait_type: "Side", value: "Right" },
      { trait_type: "Body", value: "Inmate" },
      { trait_type: "Mouth", value: "normal smile" },
      { trait_type: "Eyes", value: "Round Eye" },
      { trait_type: "Head", value: "Orange Bucket Cap" },
      { trait_type: "Form", value: "Chog" },
      { trait_type: "Tier", value: "Common" },
      { trait_type: "Naked", value: "No" },
    ],
    rarityRank: 1448,
    rarityPercentile: 0.2651,
    holder: "0x0fC538F514E9f65fF97d77b09043E0A7edeFda5d",
  },
  {
    tokenId: "1473",
    collection: "Chog Genesis",
    name: "CHOG #965",
    image: "/chogs/nft-1473.jpg",
    traits: [
      { trait_type: "Background", value: "Lemon Yellow" },
      { trait_type: "Base", value: "Origin" },
      { trait_type: "Skin", value: "Pink" },
      { trait_type: "Side", value: "Right" },
      { trait_type: "Body", value: "Black Vest" },
      { trait_type: "Mouth", value: "normal smile" },
      { trait_type: "Eyes", value: "Gradient visor" },
      { trait_type: "Head", value: "Crown" },
      { trait_type: "Form", value: "Chog" },
      { trait_type: "Tier", value: "Common" },
      { trait_type: "Naked", value: "No" },
    ],
    rarityRank: 1774,
    rarityPercentile: 0.0995,
    holder: "0x0fC538F514E9f65fF97d77b09043E0A7edeFda5d",
  },
];

/**
 * Fallback snapshot, used only when a live source is unreachable.
 * Observed 2026-10-07T07:44Z:
 *   price/change ... Dexscreener deepest monad pair (nad-fun 0x116e7D07…, $123k liquidity)
 *   floor/holders .. OpenSea collection page for chog-genesis
 *                    (floor 5,273.0419 MON = $143.27, 1,012 unique owners, 303 listed)
 */
export const SAMPLE_MARKET: MarketData = {
  chogPriceUsd: 0.002139,
  chogChange24h: -3.36,
  floorMon: 5273.0419,
  floorUsd: 143.27,
  holders: 1012,
  ts: 1791359076901,
};

export function sampleBroadcast(): BroadcastData {
  return {
    chog: SAMPLE_CHOGS[0],
    market: SAMPLE_MARKET,
    generatedAt: new Date().toISOString(),
    custom: {},
  };
}

export const TEMPLATES: TemplateDef[] = [
  {
    id: "summon",
    name: "The Summon",
    blurb: "Cinematic origin film of your Chog — the portal into the studio.",
    width: 1920,
    height: 1080,
    fps: 30,
    durationInFrames: 540,
    premium: false,
  },
  {
    id: "price-alert",
    name: "Price Alert",
    blurb: "$CHOG moves, your Chog reacts. Auto-postable market clip.",
    width: 1080,
    height: 1080,
    fps: 30,
    durationInFrames: 180,
    premium: false,
  },
  {
    id: "pfp-flex",
    name: "PFP Flex",
    blurb: "Trait + rarity showcase for the timeline.",
    width: 1080,
    height: 1350,
    fps: 30,
    durationInFrames: 180,
    premium: false,
  },
  {
    id: "meme-clip",
    name: "Meme Clip",
    blurb: "Your Chog as the star of a custom captioned meme.",
    width: 1080,
    height: 1080,
    fps: 30,
    durationInFrames: 150,
    premium: true,
  },
  {
    id: "chog-wrapped",
    name: "Chog Wrapped",
    blurb: "Your monthly recap with the Chog World Order stats.",
    width: 1080,
    height: 1350,
    fps: 30,
    durationInFrames: 360,
    premium: true,
  },
];
