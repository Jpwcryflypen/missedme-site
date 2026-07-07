# MissedMe site

Marketing + onboarding site for **MissedMe** — a done-for-you Google reviews service for
home-service trades (landscapers, plumbers, electricians, roofers, tree services). The pitch:
the customer sends their past-customer list, MissedMe asks each one for an honest Google review.

## What this is (and isn't)

- **Plain static site.** Hand-written HTML/CSS/JS. **No build step, no framework, no
  package.json, no dependencies, no tests.** Don't add a bundler, npm, or a framework unless
  explicitly asked — the whole point is that it stays deployable as flat files.
- **Hosted on GitHub Pages** at the custom domain in `CNAME` (`missedme.ai`). Pushing to the
  default branch deploys. There is no CI/build — what's in the repo is what ships.

## Files

- `index.html` — main landing page. Sections by `id`: `hero`, `problem`, `how` (scroll-driven
  Google-profile demo), `offer`, `profile`, `who`, `faq`, `signup`.
- `start.html` — private onboarding page served at `/start`. Path-picker cards reveal panels;
  a software `<select>` reveals per-tool export steps.
- `privacy.html`, `terms.html` — legal pages.
- `app.js` — drives `index.html`: the scroll-linked profile animation in `#how` (rating 3.9→4.9,
  reviews 9→86, rank badge) plus `IntersectionObserver` scroll reveals.
- `onboard.js` — drives `start.html`: URL-param personalization, path-picker → panel toggling,
  tool-step switching, and the post-submit success banner.
- `styles.css` — all styling. Single stylesheet, no preprocessor.

## Conventions

- **Vanilla JS only.** Each script is a single IIFE that bails early if its target elements are
  missing (`if (!section || !card) return;`). Keep that guard pattern — pages share no JS.
- **Respect `prefers-reduced-motion`.** `app.js` renders the final state immediately instead of
  animating when it's set. Any new motion must honor this.
- **Forms post to FormSubmit**, not a backend: `action="https://formsubmit.co/john@missedme.ai"`.
  There is no server. The comment in `index.html` notes the action is meant to be swapped to a
  GHL endpoint later — don't "fix" it to point somewhere else without being asked.
- **Onboarding personalization** flows through query params: `/start?b=Business%20Name&n=First`.
  `onboard.js` reads `b`/`n`, threads them through the post-submit redirect, and shows the success
  banner when `done=1`. Preserve that round-trip if you touch the form or redirect.
- Copy is deliberately plain-spoken and trade-focused. Match that voice — no corporate filler.

## Verifying changes

There are no unit tests. The fast first pass is `scripts/verify.sh` (dependency-free): it runs
`node --check` on the JS, validates every internal link/anchor across all HTML pages
(`scripts/check_html.py`), and does a headless Chromium render smoke test of each page. Run it
after any change — it should print `ALL CHECKS PASSED`.

That catches broken links and syntax errors but **not** layout or behavior. For anything visual or
interactive, also **verify in a browser** — Chromium + Playwright are available in this
environment. After the change, open the affected page and confirm:

- The page renders with no console errors.
- Scroll animation in `#how` runs and reaches the "Top 3 — in the map pack" end state (index).
- On `start.html`, clicking a path card reveals the right panel and the software `<select>` swaps
  the export steps.
- Personalization: load `start.html?b=Torres%20Tree%20Care&n=Mike&done=1` and confirm the headline
  personalizes and the success banner shows.

Local preview: `python3 -m http.server` from the repo root, then visit the page.
