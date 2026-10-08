// Single adapter point between the dashboard and agent A's Remotion compositions.
// If an export name or file name changes, only this file needs touching.
import type React from "react";
import type { BroadcastData, TemplateId } from "../../lib/types";

import { Summon } from "../../remotion/compositions/Summon";
import { PriceAlert } from "../../remotion/compositions/PriceAlert";
import { PfpFlex } from "../../remotion/compositions/PfpFlex";
import { MemeClip } from "../../remotion/compositions/MemeClip";
import { ChogWrapped } from "../../remotion/compositions/ChogWrapped";
import { withBgm } from "../../remotion/lib/bgm";

/** Composition components take plain BroadcastData props (remotion contract). */
export type CompositionComponent = React.ComponentType<BroadcastData>;

const MAP: Record<TemplateId, CompositionComponent> = {
  summon: withBgm(Summon as unknown as CompositionComponent),
  "price-alert": withBgm(PriceAlert as unknown as CompositionComponent),
  "pfp-flex": withBgm(PfpFlex as unknown as CompositionComponent),
  "meme-clip": withBgm(MemeClip as unknown as CompositionComponent),
  "chog-wrapped": withBgm(ChogWrapped as unknown as CompositionComponent),
};

export function compositionFor(id: TemplateId): CompositionComponent {
  return MAP[id];
}
