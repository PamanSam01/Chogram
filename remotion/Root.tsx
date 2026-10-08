// CHOGRAM Remotion root — registers all 5 broadcast compositions.
// Geometry (width/height/fps/durationInFrames) always resolves from TEMPLATES by id.
import React from "react";
import {
  Composition,
  type CalculateMetadataFunction,
} from "remotion";
import { TEMPLATES, sampleBroadcast } from "../lib/fixtures";
import type { BroadcastData, TemplateId } from "../lib/types";
import { ChogWrapped } from "./compositions/ChogWrapped";
import { MemeClip } from "./compositions/MemeClip";
import { PfpFlex } from "./compositions/PfpFlex";
import { PriceAlert } from "./compositions/PriceAlert";
import { Summon } from "./compositions/Summon";
import { withBgm } from "./lib/bgm";

/** Composition id per template — the landing + dashboard import this. */
export const COMPOSITION_IDS: Record<TemplateId, string> = {
  summon: "summon",
  "price-alert": "price-alert",
  "pfp-flex": "pfp-flex",
  "meme-clip": "meme-clip",
  "chog-wrapped": "chog-wrapped",
};

/**
 * Fixture-driven preview data: sampleBroadcast() stamped with `now`,
 * merged with any overrides (custom captions, a different Chog, live market…).
 */
export function broadcastFor(
  t: TemplateId,
  over?: Partial<BroadcastData>
): BroadcastData {
  const base = sampleBroadcast();
  return {
    ...base,
    generatedAt: new Date().toISOString(),
    ...over,
    custom: { ...base.custom, ...(over?.custom ?? {}) },
  };
}

const metaFor = (
  id: TemplateId
): CalculateMetadataFunction<BroadcastData> => {
  return ({ props }) => {
    const tpl = TEMPLATES.find((x) => x.id === id);
    if (!tpl) throw new Error(`Unknown template id: ${id}`);
    return {
      width: tpl.width,
      height: tpl.height,
      fps: tpl.fps,
      durationInFrames: tpl.durationInFrames,
      props,
    };
  };
};

const REGISTRY: {
  id: TemplateId;
  component: React.FC<BroadcastData>;
}[] = [
  { id: "summon", component: Summon },
  { id: "price-alert", component: PriceAlert },
  { id: "pfp-flex", component: PfpFlex },
  { id: "meme-clip", component: MemeClip },
  { id: "chog-wrapped", component: ChogWrapped },
];

export const RemotionRoot: React.FC = () => {
  const defaultProps = sampleBroadcast();
  return (
    <>
      {REGISTRY.map(({ id, component }) => (
        <Composition
          key={id}
          id={COMPOSITION_IDS[id]}
          component={withBgm(component)}
          calculateMetadata={metaFor(id)}
          defaultProps={defaultProps}
          width={1920}
          height={1080}
          fps={30}
          durationInFrames={540}
        />
      ))}
    </>
  );
};
