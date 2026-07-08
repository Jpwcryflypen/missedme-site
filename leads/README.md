# MissedMe — Arizona lead research & scraper

Niche strategy for a GBP / reviews / website agency, plus a script that pulls
real, scored prospect lists from the Google Places API.

## Niche strategy (Phoenix metro, 2025–2026)

**The core trades are saturated *for marketing services*, not underserved.**
HVAC, plumbing, roofing, electrical, and pest control are the exact verticals
every marketing agency already chases ([Hook Agency](https://hookagency.com/blog/most-profitable-home-services-niches/)).
The businesses are proven buyers but they've heard the pitch 15 times.

**Low ticket is not a dealbreaker — frequency × retention beats ticket size.**
Recurring/maintenance services (pest plans, pool service, drain maintenance)
outperform one-off project work because recurring revenue smooths cash flow
and protects margins ([Hook Agency](https://hookagency.com/blog/most-profitable-home-services-niches/)).
Most home-service companies spend **$500–$10,000/month** on marketing
([WebFX](https://www.webfx.com/blog/home-services/home-services-marketing-benchmarks/)).

> Caveat: precise cost-per-lead / conversion figures floating around online are
> unverified agency-blog numbers and were discarded during fact-checking. Treat
> pricing below as industry-typical ranges, not hard data.

### Ranked niches to prospect — Phoenix metro, for a GBP/review/website agency

1. **Pool service** — highest per-capita pool density in the US, recurring
   monthly, review/proximity-driven, many weak sites. Best fit here.
2. **Garage door repair** — high ticket, urgent Google searches, no franchise
   wall at the top of results.
3. **Pest control** — big AZ scorpion/termite demand, recurring contracts, high
   retention. Target independents (franchises own the top).
4. **House cleaning / maid** — recurring, reviews are the whole trust sale,
   underserved. Filter for 3+ vans; skip solo operators (can't pay).
5. **Pressure washing / exterior** — cheap ops, weak digital, before/after sells.
6. **Restoration** — biggest tickets but insurance/referral-driven and less
   GBP-sensitive; wrong first target for a review/website pitch.

### Pricing to sell (industry-typical, not verified)

- GBP management: ~$300–$800/mo (or $500–$1,500 one-time setup)
- Review generation / reputation: ~$200–$500/mo
- Local SEO retainer: ~$500–$2,000/mo ($1,000–$1,500 common sweet spot)
- Website build (WordPress): $1,500–$5,000 one-time; $75–$200/mo care plan
- **Package to lead with:** $1,000–$2,500 build + $500–$1,000/mo retainer.

## The scraper

See `scrape-leads.mjs`. It hits the Google Places API (New), dedupes, and sorts
**most dire → least dire** by how weak each business's online presence is
(no website + few reviews floats to the top).

```bash
export GOOGLE_PLACES_API_KEY="your_key"
node scrape-leads.mjs                                  # pool service, Phoenix metro
NICHES="pest control,garage door repair" node scrape-leads.mjs
```

### What the API gives you directly (real data)
name · phone · website URL · **rating + review count** · address · hours ·
maps link · `has_website` flag · derived **dire_score**.

### What still needs manual/enrichment work
- **Owner name** — not in Google. Sources: AZ Corporation Commission
  (`ecorp.azcc.gov`, free), LinkedIn, Apollo.io. Expect 40–70% coverage.
- **Website-is-garbage** — the script flags *no* website; judging a *bad* website
  (dated, not mobile-friendly, Wix/GoDaddy template) needs an eyeball or a
  Lighthouse/PageSpeed pass. A follow-up script can automate the mobile/SSL check.
- **"Best time to contact"** — nobody has real per-business data on this. Rule of
  thumb for home-service owners: **7–8am or after 5pm, Tue–Thu.** Any list
  claiming a personalized best-time-to-call is fabricating it.

### Why the API instead of scraping
Yelp, Expertise, HomeGuide, Angi, and even many company sites return HTTP 403 to
automated fetches. The Places API is the only reliable, licensed way to get this
data at 500–1,000 scale. Cost for that volume is a few dollars (Google's monthly
free credit usually covers it).
