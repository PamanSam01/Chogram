#!/usr/bin/env python3
"""CHOGRAM BGM generator — three 20.0 s seamless stereo loops, loudnorm -16 LUFS.

Pure stdlib synthesis (no numpy on this box): tone-by-tone DSP into L/R float
buffers, then ffmpeg two-pass linear loudnorm -> libmp3lame mp3.

Presets (all A minor, all exactly 20.000 s so the loop wraps cleanly):
  broadcast   96 BPM  dark broadcast synth — the original CHOGRAM score, unchanged.
  trenches   126 BPM  harder kick pump, 16th arp at full tilt, off-beat bass stabs.
              (128 BPM is the design target; 126 chosen because 42 beats = exactly
               20.000 s — 128 BPM yields 42.667 beats and would break the loop.)
  float       84 BPM  airy 7-bar pad-heavy cut, sparse soft hats, gentle kick,
              ~0.7x energy (also played at lower Remotion volume, see remotion/lib/bgm.tsx).

Every rhythmic element is placed on grids that divide the 20.0 s loop
(beats, half-beats, 16ths) and every chord length divides 20.0 s, so all three
files loop without a click. Master: soft-clip + 80 ms edge fades (masks the
mp3 seam), then ffmpeg loudnorm I=-16 (two-pass linear, constant gain).

Run:  python3 scripts/make-bgm.py            # regenerates ALL three mp3s
      python3 scripts/make-bgm.py float      # regenerate just one preset
"""
import json
import math
import os
import random
import struct
import subprocess
import sys
import tempfile
import wave

SR = 44100
TOTAL = 20.0                     # seconds — exact loop length for every preset
N = int(SR * TOTAL)
FADE = int(SR * 0.08)            # 80 ms edge fades (as shipped in v1)

# progression: Am - F - C - G  (root | chord tones)
CHORDS = [
    (55.00, [220.00, 261.63, 329.63]),   # A2 | A3 C4 E4
    (43.65, [174.61, 220.00, 261.63]),   # F2 | F3 A3 C4
    (65.41, [261.63, 329.63, 392.00]),   # C3 | C4 E4 G4
    (49.00, [196.00, 246.94, 293.66]),   # G2 | G3 B3 D4
]
ARP_PATTERN = [0, 1, 2, 3, 2, 1]  # index into [root*2, t1, t2, t1*2]

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = {
    "broadcast": os.path.join(ROOT, "public", "audio", "bgm.mp3"),
    "trenches": os.path.join(ROOT, "public", "audio", "bgm-trenches.mp3"),
    "float": os.path.join(ROOT, "public", "audio", "bgm-float.mp3"),
}

# Per-preset voice parameters. `beats` must satisfy beats * 60/bpm == 20 s —
# beat length is derived as TOTAL/beats so the grid wraps exactly at the loop point.
SPEC = {
    "broadcast": dict(
        bpm=96.0, beats=32, chord_beats=8, seed=1337,
        kick=dict(amp=0.95, length=0.16, f0=96.0, drop=58.0, curve=1.4),
        sub=dict(amp=0.5, base=0.55, depth=0.45, span=0.8, curve=1.6),
        stab=0.0,
        arp=dict(div=4, amp=0.16, oct_amp=0.0, attack=0.004, decay=0.85),
        pad=dict(g1=0.045, g2=0.03, g3=0.0, base=0.6, depth=0.4, cycles=2),
        hat=dict(grid=0.5, length=0.05, amp=0.22, attack=0.002, decay=0.045),
        clap=0.30,
        echo=dict(fb=0.34, gain=0.22),
    ),
    "trenches": dict(
        bpm=126.0, beats=42, chord_beats=10, seed=4242,
        kick=dict(amp=1.15, length=0.13, f0=112.0, drop=74.0, curve=1.2),
        sub=dict(amp=0.55, base=0.40, depth=0.60, span=0.85, curve=1.8),
        stab=0.42,
        arp=dict(div=4, amp=0.26, oct_amp=0.07, attack=0.003, decay=0.9),
        pad=dict(g1=0.035, g2=0.025, g3=0.0, base=0.55, depth=0.45, cycles=2),
        hat=dict(grid=0.5, length=0.05, amp=0.26, attack=0.002, decay=0.045),
        clap=0.36,
        echo=dict(fb=0.44, gain=0.28),
    ),
    "float": dict(
        bpm=84.0, beats=28, chord_beats=7, seed=8080,
        kick=dict(amp=0.5, length=0.24, f0=84.0, drop=46.0, curve=2.0),
        sub=dict(amp=0.34, base=0.75, depth=0.25, span=0.7, curve=1.4),
        stab=0.0,
        arp=dict(div=2, amp=0.09, oct_amp=0.0, attack=0.005, decay=0.7),
        pad=dict(g1=0.06, g2=0.04, g3=0.022, base=0.7, depth=0.3, cycles=1),
        hat=dict(grid=1.0, length=0.06, amp=0.10, attack=0.003, decay=0.055),
        clap=0.13,
        echo=dict(fb=0.30, gain=0.26),
    ),
}


def env_ad(t, a, d, curve=2.0):
    if t < 0:
        return 0.0
    if t < a:
        return t / a
    x = (t - a) / d
    return (1.0 - x) ** curve if x < 1.0 else 0.0


def tri(f, t, ph=0.0):
    """soft saw: sine + 2 harmonics"""
    w = 2 * math.pi * f * t + ph
    return math.sin(w) + 0.30 * math.sin(2 * w) + 0.12 * math.sin(3 * w)


def render(preset):
    """Synth one preset -> (L, R, info). Pure stdlib, no numpy."""
    s = SPEC[preset]
    beats = s["beats"]
    # derive beat length from the fixed 20.0 s loop so every grid wraps exactly
    if abs(beats * (60.0 / s["bpm"]) - TOTAL) > 1e-9:
        raise SystemExit(f"preset {preset}: beats={beats} @ {s['bpm']} BPM does not fill {TOTAL}s")
    BEAT = TOTAL / beats
    chord_beats = s["chord_beats"]
    CHORD_LEN = chord_beats * BEAT
    # chord index must be continuous across the loop point: the last beat either
    # starts a fresh Am cycle (idx 0) or the progression boundary sits exactly on
    # the seam with G (idx 3) as the last chord.
    idx_end = ((beats - 1) // chord_beats) % 4
    if not (idx_end == 0 or (idx_end == 3 and beats % chord_beats == 0)):
        raise SystemExit(
            f"preset {preset}: chord cycle ({chord_beats} beats) does not wrap at {TOTAL}s"
        )

    k_amp, k_len, k_f0, k_drop, k_curve = (
        s["kick"]["amp"], s["kick"]["length"], s["kick"]["f0"], s["kick"]["drop"], s["kick"]["curve"]
    )
    sub_amp, pb, pd, ps, pc = (
        s["sub"]["amp"], s["sub"]["base"], s["sub"]["depth"], s["sub"]["span"], s["sub"]["curve"]
    )
    stab_g = s["stab"]
    a_div, a_amp, a_oct, a_att, a_dec = (
        s["arp"]["div"], s["arp"]["amp"], s["arp"]["oct_amp"], s["arp"]["attack"], s["arp"]["decay"]
    )
    p1, p2, p3 = s["pad"]["g1"], s["pad"]["g2"], s["pad"]["g3"]
    sw_b, sw_d, sw_c = s["pad"]["base"], s["pad"]["depth"], s["pad"]["cycles"]
    h_grid, h_len, h_amp, h_att, h_dec = (
        s["hat"]["grid"], s["hat"]["length"], s["hat"]["amp"], s["hat"]["attack"], s["hat"]["decay"]
    )
    clap_amp = s["clap"]
    echo_fb, echo_gain = s["echo"]["fb"], s["echo"]["gain"]

    random.seed(s["seed"])
    noise = [random.uniform(-1, 1) for _ in range(SR)]  # 1s noise tile, wraps

    L = [0.0] * N
    R = [0.0] * N
    ARP = [0.0] * N  # dry arp/hat/clap/stab buffer for echo send

    two_pi = 2 * math.pi
    bar4 = BEAT * 4
    arp_step = BEAT / a_div          # broadcast/trenches: 16ths, float: 8ths
    hat_step = BEAT * h_grid         # broadcast/trenches: half-beat, float: full beat
    stab_win = 0.14

    for i in range(N):
        t = i / SR
        beat_pos = t % BEAT          # position in beat
        bar_pos = t % bar4
        ci = int(t / CHORD_LEN) % 4
        root, tones = CHORDS[ci]

        # ---- kick pulse: pitch-drop sine on every beat ----
        kp = beat_pos / k_len
        if kp < 1.0:
            kf = k_f0 - k_drop * kp
            kick = math.sin(two_pi * kf * beat_pos) * ((1.0 - kp) ** k_curve) * k_amp
        else:
            kick = 0.0

        # ---- sub bass: sustained root, pump with beat ----
        pump = pb + pd * max(0.0, 1.0 - beat_pos / (BEAT * ps)) ** pc
        sub = math.sin(two_pi * root * t) * sub_amp * pump

        # ---- off-beat bass stab (trenches): half-beat punch ----
        stab = 0.0
        if stab_g:
            hb = beat_pos - BEAT * 0.5
            if 0.0 <= hb < stab_win:
                stab = tri(root * 2.0, t) * env_ad(hb, 0.004, 0.11, 2.0) * stab_g

        # ---- arp: preset grid (16ths broadcast/trenches, 8ths float) ----
        sp = t % arp_step
        step = int(t / arp_step)
        arp_notes = [tones[0], tones[1], tones[2], tones[0] * 2]  # 1-3-5-8
        note = arp_notes[ARP_PATTERN[step % len(ARP_PATTERN)]] * (2.0 if (step // 6) % 2 else 1.0)
        a_env = env_ad(sp, a_att, arp_step * a_dec)
        arp = tri(note, t) * a_env * a_amp
        if a_oct:
            arp += tri(note * 2.0, t) * a_env * a_oct

        # ---- pad: chord tones, detuned L/R, slow swell ----
        pad_env = sw_b + sw_d * math.sin(two_pi * t / TOTAL * sw_c)
        pad = 0.0
        for k, f in enumerate(tones):
            pad += math.sin(two_pi * f * 0.5 * t + k) * p1
            pad += math.sin(two_pi * f * 0.5 * t * 1.004 + k * 2) * p2
            if p3:
                pad += math.sin(two_pi * f * t + k) * p3
        pad *= pad_env

        # ---- tick hats: differentiated noise (HP feel) ----
        hp = t % hat_step
        if hp < h_len:
            n0 = noise[i % SR]
            n1 = noise[(i - 1) % SR]
            hat = (n0 - n1) * env_ad(hp, h_att, h_dec, 3.0) * h_amp
        else:
            hat = 0.0

        # ---- snare-ish clap on beats 2 & 4 ----
        if bar_pos >= BEAT and (int((bar_pos - BEAT) / BEAT) % 2 == 0) and bar_pos % (BEAT * 2) >= BEAT:
            cp = bar_pos % BEAT
            if cp < 0.09:
                n0 = noise[(i * 7) % SR]
                clap = n0 * env_ad(cp, 0.004, 0.07, 2.5) * clap_amp
            else:
                clap = 0.0
        else:
            clap = 0.0

        arp_dry = arp + clap + hat + stab
        ARP[i] = arp_dry
        L[i] = kick + sub + pad * 1.06 + arp_dry
        R[i] = kick + sub + pad * 0.94 + arp_dry

    # ---- echo send on arp/hats/stab (feedback per preset) ----
    d = int(SR * BEAT / 2)
    send = ARP[:]
    for i in range(d, N):
        send[i] += send[i - d] * echo_fb
    for i in range(N):
        e = send[i] * echo_gain
        L[i] += e * 1.1
        R[i] += e * 0.9

    # ---- cross-feed tiny slap for width ----
    slap = int(SR * 0.021)
    for i in range(N - 1, slap, -1):
        L[i] += R[i - slap] * 0.10
        R[i] += L[i - slap] * 0.10

    # ---- master: fade edges, soft clip, normalize ----
    peak = 0.0
    for i in range(N):
        g = 1.0
        if i < FADE:
            g = i / FADE
        if i > N - FADE:
            g = (N - i) / FADE
        for ch in (L, R):
            x = math.tanh(ch[i] * 1.25) * g
            ch[i] = x
            a = abs(x)
            if a > peak:
                peak = a

    scale = 0.89 / peak if peak > 0 else 1.0
    for i in range(N):
        L[i] *= scale
        R[i] *= scale

    info = dict(bpm=60.0 * beats / TOTAL, beats=beats, beat=BEAT, chord=CHORD_LEN, peak=peak)
    return L, R, info


def write_wav(L, R, path):
    frames = bytearray()
    pack = struct.pack
    for i in range(N):
        v = int(max(-1.0, min(1.0, L[i])) * 32767)
        frames += pack("<h", v)
        v = int(max(-1.0, min(1.0, R[i])) * 32767)
        frames += pack("<h", v)
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(bytes(frames))


def _loudnorm_filter(wav_path):
    """Two-pass linear loudnorm (-16 LUFS): constant gain preserves the loop."""
    base = ["ffmpeg", "-hide_banner", "-nostdin", "-y", "-i", wav_path]
    try:
        p = subprocess.run(
            base + ["-af", "loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"],
            capture_output=True, text=True,
        )
        err = p.stderr or ""
        blk = err[err.rfind("{"): err.rfind("}") + 1]
        m = json.loads(blk)
        off = m.get("target_offset", "0")
        if off in ("-inf", "inf", "nan"):
            off = "0"
        return (
            "loudnorm=I=-16:TP=-1.5:LRA=11"
            f":measured_I={m['input_i']}:measured_TP={m['input_tp']}"
            f":measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}"
            f":offset={off}:linear=true"
        )
    except Exception:
        # fallback: single-pass dynamic loudnorm still lands at -16 LUFS
        return "loudnorm=I=-16:TP=-1.5:LRA=11"


def encode(wav_path, out_path):
    af = _loudnorm_filter(wav_path)
    subprocess.run(
        ["ffmpeg", "-hide_banner", "-nostdin", "-y", "-i", wav_path,
         "-af", af, "-ar", "44100", "-ac", "2", "-c:a", "libmp3lame", "-b:a", "192k",
         out_path],
        check=True, capture_output=True, text=True,
    )


def generate(preset, out_path):
    """Synth one preset, loudnorm to -16 LUFS, write mp3 at out_path."""
    if preset not in SPEC:
        raise SystemExit(f"unknown preset {preset!r} — choose from {', '.join(SPEC)}")
    L, R, info = render(preset)
    os.makedirs(os.path.dirname(out_path) or ".", exist_ok=True)
    fd, wav_path = tempfile.mkstemp(suffix=".wav", prefix=f"chog-bgm-{preset}-")
    os.close(fd)
    try:
        write_wav(L, R, wav_path)
        encode(wav_path, out_path)
    finally:
        try:
            os.unlink(wav_path)
        except OSError:
            pass
    size = os.path.getsize(out_path)
    print(
        f"[make-bgm] {preset:9s} -> {os.path.relpath(out_path, ROOT)}  "
        f"{info['bpm']:.0f} BPM · {info['beats']} beats · {TOTAL:.1f}s · "
        f"peak {info['peak']:.3f} · {size} bytes",
        flush=True,
    )
    return out_path


def main():
    names = sys.argv[1:] or list(SPEC)
    for name in names:
        generate(name, OUT[name])
    print(f"[make-bgm] done: {len(names)} file(s)")


if __name__ == "__main__":
    main()
