# Video Pipeline Setup — One Evening, Maybe Two

The Claude-native editing stack, as actually practiced in mid-2026. Budget two evenings for setup. Video #1 through the pipeline will take longer than editing by hand — breakeven arrives around video #3-4. That's normal; don't judge it on week one.

## The Nate Herk verdict (what you asked about)

**~50% real, and the real half is the half you want.** Verified: Herk publicly went all-in on Claude + HyperFrames in April 2026 — his `hyperframes-student-kit` repo (500★) contains 12 finished projects including 9:16 talking-head shorts with motion graphics and karaoke captions, driven by Claude Code slash commands. His demoed stack is exactly: **Claude Code as orchestrator, `video-use` for cuts, HyperFrames for the lower thirds and flying text.** So yes — the lower thirds, titles, and animated text you saw are Claude-driven, no SaaS editor involved.

**Unverified:** that his flagship long-form videos ship through this with no human editor. A professional editor publicly called his demo "motion graphics generation, not editing," and his own community openly asks what his real system is. The honest consensus from every credible practitioner (including the ones selling the dream): **AI gets you 80% of the way; the last 20% — pacing, taste, comic timing — is you, in a 30-90 minute review pass.** Which is exactly what our pipeline assumes.

## Install (Linux/macOS, no GPU needed)

```bash
# 1. video-use (cuts, captions, render, QA)
git clone https://github.com/browser-use/video-use ~/Developer/video-use
cd ~/Developer/video-use && uv sync
ln -s ~/Developer/video-use ~/.claude/skills/video-use

# 2. ffmpeg + Node 22+ (HyperFrames needs Node)
# (brew install ffmpeg node / apt equivalents)

# 3. HyperFrames + its agent skills
npx skills add heygen-com/hyperframes   # includes /talking-head-recut, /short-form-video

# 4. ElevenLabs key for Scribe transcription (~$0.22/hr of audio ≈ $2/mo at our volume)
echo "ELEVENLABS_API_KEY=..." >> ~/Developer/video-use/.env
# Free fallback: whisperX locally ($0, slightly worse diarization, more setup)

# 5. Optional escape hatch: buttercut (rough cut → Premiere/FCPXML for human finishing)
# github.com/barefootford/buttercut
```

## Project structure

```
creator-system/
  pipeline/
    style.json                    # caption font/colors/size, brand hex, lower-third spec
    BACKLOG.md                    # one improvement note per shipped video
    templates/hyperframes/        # lower-third.html, title-card.html, stat-callout.html
                                  # (fork nateherkai/hyperframes-student-kit as a start)
  projects/
    2026-07-09-chatgpt-never-heard-of-you/
      raw/                        # camera files
      edit/                       # cutlist.md, edl.json, meme-suggestions.md, final.mp4
      REVIEW.md
```

## Costs (real numbers)

| Item | Cost |
|---|---|
| Transcription (Scribe, ~2hr raw/week) | ~$2/mo |
| video-use, HyperFrames, ffmpeg, buttercut | $0 (MIT/Apache) |
| Claude tokens | $0 marginal on your existing plan (edit sessions are token-heavy — schedule renders off-peak if limits bite). API-metered would be ~$5-20/long-form. |
| Remotion (if ever needed over HyperFrames) | $0 — free for solo creators |
| **Total new spend** | **~$2/mo** (vs the $43-50/mo Descript+Vizard stack we skipped) |

## What this stack does NOT do (so you don't fight it)

1. **The scrub-and-nudge loop.** SaaS timelines let you drag a cut 3 frames left instantly; here, an iteration is a prompt + a re-render. Mitigation: approve the cut list AS TEXT before rendering (the leverage point), and only scrub flagged boundaries.
2. **Zooms/punch-ins and b-roll insertion** — not built into video-use; improvised versions are unreliable. v1 ships without them; it's the top BACKLOG item.
3. **Multicam** — doesn't exist here. One camera, which is what we're doing anyway.
4. **Frame-perfect cuts** — word timestamps are ±120ms; the agent is instructed to cut on breath valleys, and you nudge the 3-10 that still land wrong.

## Distribution note (from the repurposing research)

When cross-posting gets tedious, the automation-native publishers are Blotato ($29/mo), upload-post ($16/mo), or self-hosted Postiz ($0) — all n8n/Claude-friendly. Don't buy any of them until manual posting actually hurts (14-day rule applies to tools too).
