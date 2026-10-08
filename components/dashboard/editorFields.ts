import type { TemplateId } from "../../lib/types";

export type EditorField = {
  key: string;
  label: string;
  placeholder: string;
  maxLength: number;
  hint?: string;
};

/** Live-editable custom props, per template. Keys are frozen (see AGENTS_CONTRACT). */
export const EDITOR_FIELDS: Record<TemplateId, EditorField[]> = {
  summon: [],
  "price-alert": [
    {
      key: "alertText",
      label: "Alert line",
      placeholder: "$CHOG just moved — the Chog called it first",
      maxLength: 90,
      hint: "Injected into the lower-third ticker",
    },
  ],
  "pfp-flex": [
    {
      key: "caption",
      label: "Caption",
      placeholder: "Certified Chog. Traits don't lie.",
      maxLength: 90,
      hint: "Renders under the trait stack",
    },
  ],
  "meme-clip": [
    {
      key: "topText",
      label: "Top text",
      placeholder: "PRICE DIPS 15%",
      maxLength: 60,
      hint: "Impact caps, top letterbox",
    },
    {
      key: "bottomText",
      label: "Bottom text",
      placeholder: "CHOG DOESN'T FLINCH",
      maxLength: 60,
      hint: "Impact caps, bottom letterbox",
    },
  ],
  "chog-wrapped": [
    {
      key: "month",
      label: "Month",
      placeholder: "MARCH 2026",
      maxLength: 24,
      hint: "Recap period stamped on the slate",
    },
    {
      key: "headline",
      label: "Headline",
      placeholder: "Top 3% of all Chogs this month",
      maxLength: 90,
      hint: "Sits above the stats block",
    },
  ],
};

/** Seed values so the monitor shows a composed frame instead of blanks. */
export const DEFAULT_CUSTOM: Record<TemplateId, Record<string, string>> = {
  summon: {},
  "price-alert": { alertText: "$CHOG moved +12.4% in 1h — the Chog called it first" },
  "pfp-flex": { caption: "Certified Chog. Traits don't lie." },
  "meme-clip": { topText: "PRICE DIPS 15%", bottomText: "CHOG DOESN'T FLINCH" },
  "chog-wrapped": {
    month: "MARCH 2026",
    headline: "Top 3% of all Chogs — rank #42 of 1969",
  },
};
