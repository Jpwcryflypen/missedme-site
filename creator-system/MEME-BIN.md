# The Meme Bin

A local folder of evergreen reaction clips/GIFs/images, organized by emotion, so meme placement takes 10 minutes per video instead of a doom-scroll. The video-editor agent reads this index to suggest placements; you approve. **Long-form only — never in Shorts** (a Content ID claim blocks a Short outright; in long-form the worst common case is that video's ad revenue gets shared).

## Folder structure
```
meme-bin/
  disaster/      # things going wrong
  mind-blown/    # genuine wow moments
  suspicious/    # "that seems wrong" beats
  money/         # cost, greed, getting paid
  waiting/       # slow things, loading, delays
  confidence/    # unearned swagger, "trust me"
  chaos/         # everything at once
  deadpan/       # the look into camera
  index.md       # one line per file: filename | emotion | when to use | source
```

## Starter set (~40 — evergreen-absurdist tier, ages slowly)
Pull these first; add 2-3 per week from the trend brief's "safe to use" list, retire anything that starts feeling like a 2023 LinkedIn post.

**disaster:** This Is Fine dog · Michael Scott "NO GOD PLEASE NO"* · elmo fire · Titanic band playing · "well that escalated quickly" energy clips · demolition/collapse b-roll
**mind-blown:** Vince McMahon escalating reaction · galaxy brain · Tim & Eric mind blown · "he can't keep getting away with it"
**suspicious:** Fry squinting · red string conspiracy board (Charlie) · doubt (LA Noire) · side-eye Chloe
**money:** money printer go brrr · Mr. Krabs money eyes · "shut up and take my money" · rubbing hands
**waiting:** Skeleton waiting · Pablo Escobar waiting · loading bar b-roll · tumbleweed
**confidence:** "I am the captain now" · saluting Leo · "hold my beer" energy · confident toddler clips
**chaos:** community fire GIF (Troy pizza) · everything is on fire compilations · panic office b-roll
**deadpan:** Jim Halpert look* · blinking white guy · monkey puppet side-eye · stone-face reaction pool

\* Office-sourced clips: fine as *visual cutaways* (universally read), but never build a *joke* on loving The Office — that's the millennial-cringe line. The clip is a tool, not a personality.

**AI-niche specials** (your audience's in-joke layer): robot fail compilations · "the clanker did WHAT" beats · agent-deletes-the-database energy · HAL 9000 red eye · Clippy.

## Sourcing workflow (10 min/week, inside batch day)
1. Trend brief lists this week's safe additions → grab 2-3
2. Sources: GIPHY/Tenor (drag out the MP4), KYM entry pages (canonical versions), yt-dlp for specific clips (keep ≤3s, crop/overlay — see rules)
3. Rename descriptively, add one line to `index.md`, drop in the emotion folder
4. Monthly: delete anything you cringed at last use

## The copyright rules (from the July 2026 research — be relaxed, but follow these)
1. **Long-form only.** Shorts get face/text/zooms/platform-library sounds — nothing else.
2. **≤3 seconds, cropped or PiP, with your caption/context on top.** Short, transformed inserts rarely even get Content ID matched; commentary framing is your fair-use posture.
3. Expect the occasional claim on recognizable clips — it diverts that video's ad money, it is NOT a strike. Your revenue is offers/workshops/community anyway; claims are a rounding error.
4. GIPHY GIFs are technically licensed non-commercial; enforcement is effectively nonexistent. Music is DIFFERENT — never use commercial music; YouTube's audio library or licensed tracks only.
5. If a specific clip gets manually claimed twice, retire it. Don't fight rights-holders; swap memes.
