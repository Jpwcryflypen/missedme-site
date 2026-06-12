// MissedMe — scroll-driven profile demo + reveals
(() => {
  const section = document.getElementById('how');
  const card = document.getElementById('gcard');
  if (!section || !card) return;

  const ratingEl = document.getElementById('ratingNum');
  const starsEl = document.getElementById('starsFill');
  const countEl = document.getElementById('reviewCount');
  const rankEl = document.getElementById('rankBadge');
  const ticks = Array.from(document.querySelectorAll('.tick'));
  const steps = Array.from(document.querySelectorAll('.s-step'));

  const START = { rating: 3.9, reviews: 9 };
  const END = { rating: 4.9, reviews: 86 };

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ease = t => t * t * (3 - 2 * t);

  function progress() {
    const rect = section.getBoundingClientRect();
    const total = rect.height - window.innerHeight;
    if (total <= 0) return 1;
    return Math.min(1, Math.max(0, -rect.top / total));
  }

  function render(p) {
    const e = ease(p);
    const rating = START.rating + (END.rating - START.rating) * e;
    const reviews = Math.round(START.reviews + (END.reviews - START.reviews) * e);
    ratingEl.textContent = rating.toFixed(1);
    countEl.textContent = `(${reviews} reviews)`;
    starsEl.style.width = `${(rating / 5) * 100}%`;

    let rank, cls;
    if (p < 0.33) { rank = 'Page 2 of results — invisible'; cls = 'rank-low'; }
    else if (p < 0.7) { rank = 'Page 1 — below the map pack'; cls = 'rank-mid'; }
    else { rank = 'Top 3 — in the map pack'; cls = 'rank-high'; }
    if (!rankEl.classList.contains(cls)) {
      rankEl.className = `gcard-rank ${cls}`;
      rankEl.textContent = rank;
    }

    ticks.forEach(t => t.classList.toggle('on', p >= parseFloat(t.dataset.at)));

    const idx = p < 0.33 ? 0 : p < 0.7 ? 1 : 2;
    steps.forEach((s, i) => s.classList.toggle('active', i === idx));

    card.classList.toggle('gcard-glow', p >= 0.7);
  }

  if (reduced) {
    render(1);
  } else {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { render(progress()); ticking = false; });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    render(progress());
  }

  // Scroll reveals
  const revealTargets = document.querySelectorAll('.info-card, .check-list li, .trade, .offer-box, .signup-form');
  if (!reduced && 'IntersectionObserver' in window) {
    revealTargets.forEach(el => el.classList.add('reveal'));
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.15 });
    revealTargets.forEach(el => io.observe(el));
  }
})();
