#!/usr/bin/env python3
"""UGC pre-pass for aividlab-motion.

Given a talking-head / UGC clip it:
  1. probes duration + resolution (ffprobe)
  2. transcribes word-level timestamps (faster-whisper, local, free)
  3. computes "keep" segments that cut dead air / long pauses (auto jump-cut)

Prints JSON to stdout: {duration,width,height,words:[{w,s,e}],segments:[{from,to}]}
Usage: python3 py/ugc_prep.py clip.mp4 [--model small] [--lang ms] [--no-cut] [--max-gap 0.45]
"""
import argparse, json, subprocess, sys


def probe(path):
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
         "stream=width,height:stream_side_data=rotation:format=duration", "-of", "json", path],
        capture_output=True, text=True, check=True).stdout
    j = json.loads(out)
    st = (j.get("streams") or [{}])[0]
    w, h = st.get("width", 1080), st.get("height", 1920)
    rot = 0
    for sd in st.get("side_data_list", []) or []:
        rot = abs(int(sd.get("rotation", 0) or 0))
    if rot in (90, 270):
        w, h = h, w
    return float(j["format"]["duration"]), w, h


def transcribe(path, model_name, lang):
    from faster_whisper import WhisperModel
    m = WhisperModel(model_name, device="cpu", compute_type="int8")
    segs, info = m.transcribe(path, language=lang, word_timestamps=True, vad_filter=True,
                              vad_parameters={"min_silence_duration_ms": 300})
    words = []
    for s in segs:
        for w in (s.words or []):
            t = w.word.strip()
            if t:
                words.append({"w": t, "s": round(w.start, 3), "e": round(w.end, 3)})
    return words, info.language


def keep_segments(words, duration, max_gap=0.45, pad=0.12, min_len=0.35):
    """Merge speech into segments; any silence > max_gap gets cut out."""
    if not words:
        return [{"from": 0.0, "to": round(duration, 3)}]
    segs = []
    cur_s, cur_e = max(0.0, words[0]["s"] - pad), words[0]["e"]
    for w in words[1:]:
        if w["s"] - cur_e > max_gap:
            segs.append([cur_s, min(duration, cur_e + pad)])
            cur_s = max(0.0, w["s"] - pad)
        cur_e = max(cur_e, w["e"])
    segs.append([cur_s, min(duration, cur_e + pad)])
    # fix overlaps from padding + drop micro segments
    out = []
    for a, b in segs:
        if out and a <= out[-1][1]:
            out[-1][1] = max(out[-1][1], b)
        elif b - a >= min_len:
            out.append([a, b])
    return [{"from": round(a, 3), "to": round(b, 3)} for a, b in out] or [{"from": 0.0, "to": round(duration, 3)}]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("--model", default="small")
    ap.add_argument("--lang", default=None)
    ap.add_argument("--no-cut", action="store_true")
    ap.add_argument("--no-captions", action="store_true")
    ap.add_argument("--max-gap", type=float, default=0.45)
    a = ap.parse_args()
    dur, w, h = probe(a.video)
    words, lang = ([], None) if (a.no_captions and a.no_cut) else transcribe(a.video, a.model, a.lang)
    segs = [{"from": 0.0, "to": round(dur, 3)}] if a.no_cut else keep_segments(words, dur, a.max_gap)
    json.dump({"duration": dur, "width": w, "height": h, "language": lang,
               "words": words, "segments": segs}, sys.stdout)


if __name__ == "__main__":
    main()
