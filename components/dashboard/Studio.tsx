"use client";

import { useState } from "react";
import type { BroadcastData, TemplateDef } from "../../lib/types";
import { EDITOR_FIELDS } from "./editorFields";
import { compositionFor } from "./compositions";
import type { BgmTrack } from "../../remotion/lib/bgm";
import { ProgramMonitor, ModalPlayer } from "./ProgramMonitor";
import { RenderPanel } from "./RenderPanel";
import { fmtDuration, fmtRes } from "./format";

type Props = {
  template: TemplateDef;
  inputProps: BroadcastData;
  draft: Record<string, string>;
  onField: (key: string, value: string) => void;
  bgm?: BgmTrack;
  onBgm?: (t: BgmTrack) => void;
};

/**
 * Studio: program monitor (live Player) + editor (custom inputProps) + render queue.
 * DOM order = mobile order: monitor → editor → export.
 */
export function Studio({ template, inputProps, draft, onField, bgm, onBgm }: Props) {
  const [replay, setReplay] = useState(false);
  const fields = EDITOR_FIELDS[template.id];
  const Component = compositionFor(template.id);

  return (
    <section className="studio" aria-label={`${template.name} studio`}>
      <div className="studio__head">
        <span className="micro">STUDIO · {template.id.toUpperCase()}</span>
        <span className="micro studio__head-right mono">
          {template.name} — {fmtRes(template.width, template.height)} · {template.fps}fps ·{" "}
          {fmtDuration(template.durationInFrames, template.fps)}
        </span>
      </div>

      <div className="studio__body">
        <div className="studio__monitor">
          <ProgramMonitor template={template} component={Component} inputProps={inputProps} />
        </div>

        <div className="studio__rail">
          <div className="editor">
            <div className="panel__head">
              <span className="micro">EDITOR</span>
              <span className="micro panel__head-right">inputProps.custom</span>
            </div>

            {fields.length === 0 ? (
              <div className="editor__origin">
                <p className="editor__origin-text">
                  This one is your origin film — replay it.
                </p>
                <button type="button" className="btn btn-primary" onClick={() => setReplay(true)}>
                  Replay Summon
                </button>
                <p className="micro editor__origin-note">
                  Every frame reads traits/rarity/holder from Chog #{inputProps.chog.tokenId}.
                </p>
              </div>
            ) : (
              <div className="editor__fields">
                {fields.map((f) => {
                  const value = draft[f.key] ?? "";
                  return (
                    <label className="field" key={f.key} htmlFor={`fld-${f.key}`}>
                      <span className="field__head">
                        <span className="micro">{f.label}</span>
                        <span className="micro field__count mono">
                          {value.length}/{f.maxLength}
                        </span>
                      </span>
                      <input
                        id={`fld-${f.key}`}
                        className="field__input mono"
                        type="text"
                        value={value}
                        placeholder={f.placeholder}
                        maxLength={f.maxLength}
                        autoComplete="off"
                        spellCheck={false}
                        onChange={(e) => onField(f.key, e.target.value)}
                      />
                      {f.hint ? <span className="micro field__hint">{f.hint}</span> : null}
                    </label>
                  );
                })}
                <p className="micro editor__live">
                  EDITS COMPOSE INTO THE MONITOR ON EACH KEYSTROKE
                </p>
              </div>
            )}
          </div>

          <RenderPanel template={template} broadcast={inputProps} bgm={bgm} onBgm={onBgm} />
        </div>
      </div>

      {replay ? (
        <ModalPlayer
          template={template}
          component={Component}
          inputProps={inputProps}
          onClose={() => setReplay(false)}
        />
      ) : null}
    </section>
  );
}
