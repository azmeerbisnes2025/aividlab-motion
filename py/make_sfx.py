#!/usr/bin/env python3
"""Synthesize the built-in SFX set for aividlab-motion (no external assets, no paid APIs).

numpy -> 44.1kHz stereo WAV -> public/sfx/*.mp3 (libmp3lame)
Run:  python3 py/make_sfx.py
"""
import math
import subprocess
from pathlib import Path

import numpy as np

SR = 44100
OUT = Path(__file__).resolve().parent.parent / "public" / "sfx"

SECONDS = {
    "whoosh": 0.45,
    "ding": 1.30,
    "pop": 0.16,
    "rumble": 0.90,
}


def env(n, attack, release, exp=2.0):
    """Smooth attack/decay envelope, exp curve, peak 1.0."""
    a = int(SR * attack)
    r = int(SR * release)
    e = np.ones(n)
    if a > 0:
        e[:a] = np.linspace(0, 1, a) ** (1 / exp)
    if r > 0 and n - r > 0:
        e[-r:] = np.linspace(1, 0, r) ** exp
    return e


def whoosh():
    n = int(SR * SECONDS["whoosh"])
    t = np.arange(n) / SR
    # white noise -> sweeping bandpass (low cut rises then falls) = air rush
    noise = np.random.default_rng(7).standard_normal(n)
    # single-pole swept filter: centre freq 300Hz -> 3kHz -> 600Hz
    f = 300 + 2700 * np.sin(np.pi * t / SECONDS["whoosh"]) ** 2
    w = 2 * np.pi * f / SR
    a = np.exp(-w / 2)  # pole radius (narrow-ish band)
    lp = np.zeros(n)
    bp = np.zeros(n)
    for i in range(n):
        lp[i] = noise[i] + a[i] * lp[i - 1]
        bp[i] = (1 - a[i]) * (lp[i] - (lp[i - 1] if i else 0))
    out = bp * env(n, 0.10, 0.30, 1.5)
    out = out / (np.max(np.abs(out)) + 1e-9) * 0.95
    return np.column_stack([out, out])


def ding():
    n = int(SR * SECONDS["ding"])
    t = np.arange(n) / SR
    f0, f1 = 880.0, 1760.0
    e0 = np.exp(-t * 3.0) * 0.85
    e1 = np.exp(-t * 6.5) * 0.35
    out = np.sin(2 * np.pi * f0 * t) * e0 + np.sin(2 * np.pi * f1 * t) * e1
    out *= env(n, 0.004, SECONDS["ding"] - 0.01, 1.0)
    out = out / (np.max(np.abs(out)) + 1e-9) * 0.9
    return np.column_stack([out, out])


def pop():
    n = int(SR * SECONDS["pop"])
    t = np.arange(n) / SR
    # pitch drops 520 -> 150 Hz over the blip = mouth pop / bubble
    f = 520 * np.exp(-t * 18)
    ph = 2 * np.pi * np.cumsum(f) / SR
    out = np.sin(ph) * env(n, 0.002, 0.12, 1.4)
    click = (np.random.default_rng(3).standard_normal(n)) * env(n, 0.001, 0.03, 1.0) * 0.25
    out = out + click
    out = out / (np.max(np.abs(out)) + 1e-9) * 0.95
    return np.column_stack([out, out])


def rumble():
    n = int(SR * SECONDS["rumble"])
    t = np.arange(n) / SR
    rng = np.random.default_rng(11)
    # 55 Hz drone + filtered brown noise, slow swell then decay = cinematic sub hit
    drone = np.sin(2 * np.pi * 55 * t) * 0.6 + np.sin(2 * np.pi * 82.5 * t) * 0.18
    brown = np.cumsum(rng.standard_normal(n))
    brown = brown / (np.max(np.abs(brown)) + 1e-9)
    # one-pole lowpass at ~120 Hz
    a = math.exp(-2 * math.pi * 120 / SR)
    lp = np.zeros(n)
    for i in range(n):
        lp[i] = brown[i] + a * lp[i - 1] if i else brown[i]
    lp = lp / (np.max(np.abs(lp)) + 1e-9) * 0.7
    out = (drone * 0.7 + lp * 0.55) * env(n, 0.05, 0.55, 1.8)
    out = out / (np.max(np.abs(out)) + 1e-9) * 0.95
    return np.column_stack([out, out])


BUILDERS = {"whoosh": whoosh, "ding": ding, "pop": pop, "rumble": rumble}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for name, fn in BUILDERS.items():
        wav = OUT / f"{name}.wav"
        audio = fn()
        pcm = (audio * 32767).astype(np.int16)
        with open(wav, "wb") as fh:
            fh.write(b"RIFF")
            fh.write((36 + pcm.nbytes).to_bytes(4, "little"))
            fh.write(b"WAVEfmt ")
            fh.write((16).to_bytes(4, "little"))
            fh.write((1).to_bytes(2, "little"))  # PCM
            fh.write((2).to_bytes(2, "little"))  # stereo
            fh.write(SR.to_bytes(4, "little"))
            fh.write((SR * 4).to_bytes(4, "little"))
            fh.write((4).to_bytes(2, "little"))
            fh.write((16).to_bytes(2, "little"))
            fh.write(b"data")
            fh.write(pcm.nbytes.to_bytes(4, "little"))
            fh.write(pcm.tobytes())
        mp3 = OUT / f"{name}.mp3"
        r = subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "error", "-i", str(wav),
             "-c:a", "libmp3lame", "-b:a", "192k", str(mp3)],
            capture_output=True, text=True,
        )
        if r.returncode != 0:
            raise SystemExit(f"ffmpeg failed for {name}: {r.stderr}")
        wav.unlink()
        print(f"{name}: {mp3} ({SECONDS[name]:.2f}s, {mp3.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
