// MissedMe — private onboarding page (/start)
(() => {
  const params = new URLSearchParams(location.search);

  // Personalize via link params: /start?b=Torres%20Tree%20Care&n=Mike
  const biz = params.get('b');
  const first = params.get('n');
  const headline = document.getElementById('welcomeHeadline');
  const bizField = document.getElementById('bizField');
  if (headline && (first || biz)) {
    headline.textContent = `Welcome aboard${first ? ', ' + first : ''}. Let's get ${biz ? biz : 'your company'} more reviews.`;
  }
  if (bizField && biz) bizField.value = biz;

  // Keep personalization through the post-submit redirect
  const nextUrl = document.getElementById('nextUrl');
  if (nextUrl && (biz || first)) {
    const u = new URL(nextUrl.value);
    if (biz) u.searchParams.set('b', biz);
    if (first) u.searchParams.set('n', first);
    u.searchParams.set('done', '1');
    nextUrl.value = u.toString();
  }

  // Success banner after FormSubmit redirects back
  if (params.get('done') === '1') {
    const banner = document.getElementById('successBanner');
    if (banner) {
      banner.hidden = false;
      banner.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  // Path picker → show matching panel, record choice, scroll to form
  const cards = Array.from(document.querySelectorAll('.path-card'));
  const panels = Array.from(document.querySelectorAll('.panel'));
  const pathField = document.getElementById('pathField');
  const pathNames = {
    'panel-file': 'Has a file',
    'panel-software': 'In software',
    'panel-nolist': 'No list yet',
    'panel-notsure': 'Wants a call'
  };
  cards.forEach(card => {
    card.addEventListener('click', () => {
      cards.forEach(c => c.classList.toggle('active', c === card));
      panels.forEach(p => { p.hidden = p.id !== card.dataset.panel; });
      if (pathField) pathField.value = pathNames[card.dataset.panel] || '';
      document.getElementById('send').scrollIntoView({ behavior: 'smooth' });
    });
  });

  // Software picker → show export steps for that tool
  const toolSelect = document.getElementById('toolSelect');
  if (toolSelect) {
    toolSelect.addEventListener('change', () => {
      document.querySelectorAll('.tool-steps').forEach(el => {
        el.hidden = el.id !== `steps-${toolSelect.value}`;
      });
    });
  }
})();
