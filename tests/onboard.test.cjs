const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const onboarding = require(path.join(projectRoot, 'onboard.js'));

test('reads only a bounded base64url invitation token', () => {
  const token = 'abc_DEF-1234567890abc_DEF-1234567890abc';
  assert.equal(onboarding.readInvitationToken(`#invite=${token}`), token);
  assert.equal(onboarding.readInvitationToken('#invite=short'), '');
  assert.equal(onboarding.readInvitationToken('#invite=contains%20spaces-and-is-long-enough'), '');
  assert.equal(onboarding.readInvitationToken(''), '');
});

test('captures the fragment token and immediately removes query and hash data', () => {
  const token = 'abc_DEF-1234567890abc_DEF-1234567890abc';
  const calls = [];
  const captured = onboarding.captureAndScrubInvitation(
    { pathname: '/start', search: '?b=PrivateBusiness', hash: `#invite=${token}` },
    { replaceState: (...args) => calls.push(args) }
  );

  assert.equal(captured, token);
  assert.deepEqual(calls, [[null, '', '/start']]);
  assert.equal(JSON.stringify(calls).includes('PrivateBusiness'), false);
  assert.equal(JSON.stringify(calls).includes(token), false);
});

test('maps every checkout offer to the correct onboarding surface', () => {
  assert.equal(onboarding.serviceKeyForOffer('reviews'), 'reviews');
  assert.equal(onboarding.serviceKeyForOffer('ai_conversations'), 'voice-chat');
  assert.equal(onboarding.serviceKeyForOffer('reviews_ai_conversations'), 'reviews-ai-conversations');
  assert.equal(onboarding.serviceKeyForOffer('managed_website'), 'website');
  assert.equal(onboarding.serviceKeyForOffer('ai_assessment'), 'assessment');
  assert.equal(onboarding.serviceKeyForOffer('unknown'), '');
});

test('requires business identity only for reviews, voice, and the combined package', () => {
  assert.equal(onboarding.serviceRequiresIdentity('reviews'), true);
  assert.equal(onboarding.serviceRequiresIdentity('voice-chat'), true);
  assert.equal(onboarding.serviceRequiresIdentity('reviews-ai-conversations'), true);
  assert.equal(onboarding.serviceRequiresIdentity('website'), false);
  assert.equal(onboarding.serviceRequiresIdentity('assessment'), false);
});

test('parses quoted CSV values, escaped quotes, and embedded line breaks', () => {
  const rows = onboarding.parseCsv('Full Name,Phone,Email\r\n"Smith, Jane",6025550111,jane@example.com\r\n"Lee ""LJ"" Jones",,"lee\nteam@example.com"');
  assert.equal(rows.length, 3);
  assert.deepEqual(rows[1], ['Smith, Jane', '6025550111', 'jane@example.com']);
  assert.equal(rows[2][0], 'Lee "LJ" Jones');
  assert.equal(rows[2][2], 'lee\nteam@example.com');
});

test('normalizes eligible contacts and leaves duplicates and unusable rows out', () => {
  const csv = [
    'First Name,Last Name,Phone Number,Email Address',
    'Jane,Smith,(602) 555-0111,JANE@EXAMPLE.COM',
    'Jane,Smith,602-555-0111,jane@example.com',
    'Alex,Rivera,,alex@example.com',
    'No,Contact,not-a-phone,not-an-email'
  ].join('\n');
  const result = onboarding.normalizeCustomerCsv(csv);

  assert.deepEqual(result.customers, [
    { firstName: 'Jane', lastName: 'Smith', phone: '+16025550111', email: 'jane@example.com' },
    { firstName: 'Alex', lastName: 'Rivera', phone: '', email: 'alex@example.com' }
  ]);
  assert.equal(result.duplicates, 1);
  assert.equal(result.rejected, 1);
  assert.equal(result.sourceRows, 4);
});

test('customer phones match the secure server US-only boundary', () => {
  assert.equal(onboarding.normalizePhone('(602) 555-0111'), '+16025550111');
  assert.equal(onboarding.normalizePhone('+1 (602) 555-0111'), '+16025550111');
  assert.equal(onboarding.normalizePhone('602-555-0111 ext 2'), '');
  assert.equal(onboarding.normalizePhone('+44 20 7946 0958'), '');
  assert.equal(onboarding.normalizePhone('1 602 555 0111'), '');
});

test('customer names stay inside the secure server field limit', () => {
  const longName = 'A'.repeat(125);
  const result = onboarding.normalizeCustomerCsv([
    'First Name,Last Name,Phone Number',
    `${longName},${longName},602-555-0111`
  ].join('\n'));

  assert.equal(result.customers[0].firstName.length, 100);
  assert.equal(result.customers[0].lastName.length, 100);
});

test('requires a name column and at least one contact column', () => {
  assert.throws(
    () => onboarding.normalizeCustomerCsv('Company,Street\nExample,Main'),
    error => error.code === 'csv_missing_columns'
  );
});

test('creates zero-based batches within both API bounds', () => {
  const customers = Array.from({ length: 237 }, (_, index) => ({
    firstName: `Customer${index}`,
    lastName: 'Example',
    phone: `+1602555${String(index).padStart(4, '0')}`,
    email: `customer${index}@example.com`
  }));
  const batchId = '0f4b9331-4f89-4a93-a6ba-262aa76c366f';
  const batches = onboarding.buildCustomerBatches(customers, batchId);

  assert.equal(batches.length, 3);
  assert.deepEqual(batches.map(batch => batch.batchIndex), [0, 1, 2]);
  assert.ok(batches.every(batch => batch.totalBatches === 3));
  assert.ok(batches.every(batch => batch.customers.length <= 100));
  assert.ok(batches.every(batch => onboarding.utf8ByteLength(JSON.stringify(batch)) <= 128 * 1024));
  assert.equal(batches.flatMap(batch => batch.customers).length, customers.length);
});

test('normalizes a valid EIN and rejects every other digit count', () => {
  assert.equal(onboarding.normalizeEin('12-3456789'), '123456789');
  assert.equal(onboarding.normalizeEin('12345678'), '');
  assert.equal(onboarding.normalizeEin('1234567890'), '');
});

test('normalizes the Worker intake response without exposing sensitive fields', () => {
  const intake = onboarding.normalizeIntakePayload({
    ok: true,
    intake: {
      id: 'intake_123',
      offerId: 'reviews_ai_conversations',
      businessName: 'Example Plumbing',
      contact: { name: 'Jordan', email: 'jordan@example.com', phone: '+16025550111' },
      requirements: ['businessIdentity', 'reviewSetup', 'customerList', 'voiceSetup'],
      status: 'in_progress',
      progress: { completed: 0, total: 4, missing: ['businessIdentity'] }
    }
  });

  assert.equal(intake.serviceKey, 'reviews-ai-conversations');
  assert.equal(intake.contact.businessName, 'Example Plumbing');
  assert.equal('ein' in intake, false);
  assert.equal('customers' in intake, false);
});

test('builds the exact package-specific submit contracts', () => {
  const identity = { legalBusinessName: 'Example Services LLC', ein: '12-3456789' };
  const reviews = {
    googleReviewUrl: 'https://g.page/r/example/review',
    approvedMessage: 'Would you share an honest review?',
    approverName: 'Jamie Owner'
  };
  const approval = {
    messageApproved: true,
    customerConsentAttested: true,
    customerBatchId: 'batch_123'
  };

  assert.deepEqual(onboarding.buildSubmissionPayloadForService('reviews', identity, reviews, {}, approval), {
    legalBusinessName: 'Example Services LLC',
    ein: '123456789',
    googleReviewUrl: 'https://g.page/r/example/review',
    approvedMessage: 'Would you share an honest review?',
    approverName: 'Jamie Owner',
    messageApproved: true,
    customerConsentAttested: true,
    customerBatchId: 'batch_123'
  });

  const voice = { businessPhone: '+16025550111', answeringRules: 'After four rings' };
  const combined = onboarding.buildSubmissionPayloadForService('reviews-ai-conversations', identity, reviews, voice, approval);
  assert.deepEqual(combined.voice, voice);
  assert.equal(combined.customerBatchId, 'batch_123');

  const website = { currentWebsite: 'none', servicesArea: 'Plumbing in Phoenix', primaryAction: 'Call' };
  assert.deepEqual(onboarding.buildSubmissionPayloadForService('website', identity, null, website), { website });

  const assessment = { timeDrain: 'Scheduling', workflow: 'Calls then a paper calendar', goal: 'Fewer missed appointments' };
  assert.deepEqual(onboarding.buildSubmissionPayloadForService('assessment', identity, null, assessment), { assessment });

  const voiceOnly = onboarding.buildSubmissionPayloadForService('voice-chat', identity, null, voice);
  assert.deepEqual(voiceOnly.voice, voice);
  assert.equal('customerBatchId' in voiceOnly, false);
  assert.equal('googleReviewUrl' in voiceOnly, false);
});

test('offers plain review messages without making the client write one from scratch', () => {
  const templates = onboarding.REVIEW_MESSAGE_TEMPLATES;
  assert.deepEqual(templates.map(template => template.id), ['friendly', 'short']);
  for (const template of templates) {
    const message = template.copy('Example Plumbing');
    assert.match(message, /Example Plumbing/);
    assert.match(message, /honest Google review/);
    assert.match(message, /\[Review link\]/);
    assert.match(message, /Reply STOP to opt out\./);
  }
});

test('the review setup has working self-serve and 15-minute help paths', () => {
  const script = fs.readFileSync(path.join(projectRoot, 'onboard.js'), 'utf8');
  const html = fs.readFileSync(path.join(projectRoot, 'start.html'), 'utf8');
  const template = fs.readFileSync(path.join(projectRoot, 'customer-list-template.csv'), 'utf8');

  assert.match(html, /Book a 15-minute setup call with John/);
  assert.match(html, /Your business EIN/);
  assert.match(html, /wherever you keep your customer names and contact information/);
  assert.match(html, /You do not need to make or clean up a spreadsheet first/);
  assert.match(html, /Pick a setup time/);
  assert.match(html, /calendar\.google\.com\/calendar\/u\/0\/appointments\/schedules\//);
  assert.match(html, /target="_blank" rel="noreferrer"/);
  assert.match(html, /I will finish it myself/);
  assert.doesNotMatch(html, /Setup progress/);
  assert.match(script, /Google Business Profile link/);
  assert.match(script, /I need help finding my Google listing/);
  assert.match(script, /I want John to help me choose the message/);
  assert.match(script, /I need help getting my customer list ready/);
  assert.match(script, /customer-list-template\.csv/);
  assert.doesNotMatch(script, /Eligible customer CSV/);
  assert.doesNotMatch(script, /Exact review request you approve/);
  assert.match(template, /^First Name,Last Name,Phone,Email/m);
});

test('static onboarding code has no sensitive fallback or browser persistence path', () => {
  const script = fs.readFileSync(path.join(projectRoot, 'onboard.js'), 'utf8');
  const html = fs.readFileSync(path.join(projectRoot, 'start.html'), 'utf8');
  const combined = `${script}\n${html}`;

  for (const forbidden of [
    /mailto:/i,
    /FormSubmit/i,
    /localStorage/,
    /sessionStorage/,
    /indexedDB/,
    /console\./,
    /window\.location\.search/,
    /new FormData/,
    /customerCount/
  ]) {
    assert.equal(forbidden.test(combined), false, `forbidden pattern found: ${forbidden}`);
  }

  assert.ok(script.indexOf('captureAndScrubInvitation(window.location, window.history)') < script.indexOf("const API_BASE = 'https://onboard.missedme.ai'"));
  assert.match(script, /credentials:\s*'include'/);
  assert.match(script, /cache:\s*'no-store'/);
  assert.match(script, /referrerPolicy:\s*'no-referrer'/);
  assert.match(script, /\/v1\/invitations\/exchange/);
  assert.match(script, /\/v1\/onboarding\/customer-batches/);
  assert.match(script, /\/v1\/onboarding\/submit/);
  assert.match(script, /payload\.voice = packageValues/);
  assert.match(script, /payload\.website = packageValues/);
  assert.match(script, /payload\.assessment = packageValues/);
  assert.match(html, /connect-src https:\/\/onboard\.missedme\.ai/);
  assert.match(html, /form-action 'none'/);
  assert.match(html, /<meta name="referrer" content="no-referrer">/);
  assert.match(script, /opted-out, or STOP contacts/);
});

test('the customer file is parsed locally and only normalized batches enter request bodies', () => {
  const script = fs.readFileSync(path.join(projectRoot, 'onboard.js'), 'utf8');
  assert.match(script, /normalizeCustomerCsv\(await file\.text\(\)\)/);
  assert.match(script, /fileInput\.value = ''/);
  assert.doesNotMatch(script, /body:\s*file/);
  assert.doesNotMatch(script, /body:\s*await file\.text/);
  assert.doesNotMatch(script, /originalFile|rawFile|fileContent/);
});

test('the privacy policy describes the temporary encrypted intake accurately', () => {
  const privacy = fs.readFileSync(path.join(projectRoot, 'privacy.html'), 'utf8');
  assert.match(privacy, /original file is not uploaded or retained/i);
  assert.match(privacy, /EINs and normalized customer contact fields.*encrypted/i);
  assert.match(privacy, /abandoned drafts 30 days after their last activity/i);
  assert.match(privacy, /submitted records 30 days after submission/i);
  assert.match(privacy, /do not ask for an EIN or customer list when the selected service does not need it/i);
});
