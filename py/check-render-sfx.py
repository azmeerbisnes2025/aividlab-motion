#!/usr/bin/env python3
"""Verify the rendered MP4 actually contains the SFX hits (not just BGM).

Extracts the AAC track to 48k mono float, computes a per-100ms RMS curve and a
high-band (>=700 Hz) energy curve, then reports the peaks. Expected SFX times
come from the normalized spec (scene starts, accounting for ~0.45s transition
overlap) plus the `at` offset.
Usage: python3 py/check-render-sfx.py out/sfx-test.mp4 out/sfx-test.json
"""
import json
import subprocess
import sys
from pathlib import Path

import numpy as np

mp4, spec_path = sys.argv[1], sys.argv[2]
spec = json.loads(Path(spec_path).read_text())
if "scenes" not in spec:  # validate output shape
    spec = spec.get("spec", spec)
fps = spec.get("fps", 30)
tr = 0 if spec.get("transition") == "none" else spec.get("transitionDuration", 0.45)
DUR = {"hook": 2.5, "kinetic": 3.5, "logo": 2.5, "stat": 3, "product": 4, "bullets": 4, "compare": 4,
       "quote": 4, "steps": 4.5, "chart": 4, "price": 3.5, "image": 3, "cta": 3, "ugc": 0}

raw = subprocess.run(
    ["ffmpeg", "-v", "error", "-i", mp4, "-f", "f32le", "-ac", "1", "-"],
    capture_output=True,
).stdout
a = np.frombuffer(raw, np.float32)
sr = 48000

# scene start times on the output timeline
at, starts = 0.0, []
for i, s in enumerate(spec["scenes"]):
    if i > 0:
        at -= tr
    starts.append(at)
    at += s.get("duration") or DUR.get(s["type"], 3)
def sfx_of(s):
    v = s.get("sfx")
    return v if isinstance(v, dict) else {}

expect = [(t + sfx_of(s).get("at", 0), s["type"], sfx_of(s).get("src", ""))
          for s, t in zip(spec["scenes"], starts) if s.get("sfx")]

win = int(sr * 0.05)  # 50 ms
n = len(a) // win
rms = np.array([np.sqrt((a[i * win:(i + 1) * win] ** 2).mean()) for i in range(n)])
# high-band energy via simple DFT bins per window (cheap, 20ms windows -> 2400 bins)
hb = np.zeros(n)
freqs = np.fft.rfftfreq(win, 1 / sr)
hi = freqs >= 700
for i in range(n):
    w = a[i * win:(i + 1) * win] * np.hanning(win)
    sp = np.abs(np.fft.rfft(w)) ** 2
    hb[i] = sp[hi].sum()

rms /= rms.max() + 1e-12
hb /= hb.max() + 1e-12
t = np.arange(n) * 0.05

print(f"render: {len(a)/sr:.2f}s audio, {n} windows")
print("expected SFX hits:")
fails = 0
for tt, kind, src in expect:
    # 300 ms window around the hit
    m = (t >= tt - 0.1) & (t <= tt + 0.35)
    peak_rms = rms[m].max() if m.any() else 0
    peak_hb = hb[m].max() if m.any() else 0
    base_rms = np.median(rms)
    base_hb = np.median(hb)
    ok = peak_rms > base_rms * 1.25 or peak_hb > base_hb * 1.25
    if not ok:
        fails += 1
    print(f"  {'OK ' if ok else 'WEAK'} t={tt:5.2f}s {kind:6s} {src:20s} rms={peak_rms:.3f}/{base_rms:.3f} hi={peak_hb:.3f}/{base_hb:.3f}")
print(f"\n{'ALL SFX AUDIBLE' if not fails else f'{fails} WEAK/MISSING HITS'}")
sys.exit(1 if fails else 0)
