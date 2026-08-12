// MissedMe private client setup page (/start)
(() => {
  'use strict';

  function readInvitationToken(hash) {
    const rawHash = String(hash || '').replace(/^#/, '');
    if (!rawHash) return '';
    const token = new URLSearchParams(rawHash).get('invite') || '';
    return /^[A-Za-z0-9_-]{20,256}$/.test(token) ? token : '';
  }

  function captureAndScrubInvitation(locationLike, historyLike) {
    const token = readInvitationToken(locationLike && locationLike.hash);
    const pathname = locationLike && locationLike.pathname ? locationLike.pathname : '/start';
    try {
      historyLike.replaceState(null, '', pathname);
    } catch (_error) {
      // A navigation policy can prevent history replacement in a test or embedded view.
    }
    return token;
  }

  const capturedInvitationToken = typeof window !== 'undefined'
    ? captureAndScrubInvitation(window.location, window.history)
    : '';

  const API_BASE = 'https://onboard.missedme.ai';
  const API_TIMEOUT_MS = 20000;
  const CUSTOMER_LIMITS = Object.freeze({
    maxFileBytes: 5 * 1024 * 1024,
    maxRows: 5000,
    maxBatchRows: 100,
    maxBatchBytes: 128 * 1024,
    maxCellChars: 240
  });

  const OFFER_ALIASES = Object.freeze({
    reviews: 'reviews',
    review: 'reviews',
    ai_conversations: 'voice-chat',
    'ai-conversations': 'voice-chat',
    voice: 'voice-chat',
    'voice-chat': 'voice-chat',
    reviews_ai_conversations: 'reviews-ai-conversations',
    'reviews-ai-conversations': 'reviews-ai-conversations',
    'reviews-voice-chat': 'reviews-ai-conversations',
    managed_website: 'website',
    'managed-website': 'website',
    website: 'website',
    ai_assessment: 'assessment',
    'ai-assessment': 'assessment',
    assessment: 'assessment'
  });

  const IDENTITY_FIELDS = Object.freeze([
    {
      name: 'legalBusinessName',
      label: 'Legal business name',
      placeholder: 'Example Plumbing LLC',
      required: true,
      autocomplete: 'organization',
      maxlength: 200,
      description: 'Use the name on your IRS EIN letter or W-9. It may be different from the name customers know.'
    },
    {
      name: 'ein',
      label: 'Federal tax ID (EIN)',
      placeholder: '12-3456789',
      required: true,
      inputmode: 'numeric',
      autocomplete: 'off',
      maxlength: 10,
      description: 'This is the 9-digit number on your IRS EIN letter, W-9, or business tax return. Do not enter a Social Security number.'
    }
  ]);

  const REVIEW_FIELDS = Object.freeze([
    {
      name: 'googleReviewUrl',
      label: 'Google Business Profile link',
      placeholder: 'Paste the Google or Google Maps link for your business',
      required: true,
      type: 'url',
      maxlength: 2048,
      description: 'Send us the normal Google or Google Maps link. We will create and test the direct review link for you.'
    },
    {
      name: 'approvedMessage',
      label: 'Message you are approving',
      placeholder: 'Choose one of the messages above, or write your own.',
      required: true,
      kind: 'textarea',
      maxlength: 1200,
      description: 'We fill in the customer name, business name, and review link. We send you a test before anything goes to customers.'
    },
    {
      name: 'approverName',
      label: 'Who is approving this message?',
      placeholder: 'Full name',
      required: true,
      autocomplete: 'name',
      maxlength: 120,
      description: 'Usually this is the owner or manager completing this setup.'
    }
  ]);

  const REVIEW_MESSAGE_TEMPLATES = Object.freeze([
    {
      id: 'friendly',
      label: 'Friendly',
      copy: businessName => `Hi [First name], this is ${businessName}. Thanks for choosing us. Would you take a minute to leave us an honest Google review? [Review link] Reply STOP to opt out.`
    },
    {
      id: 'short',
      label: 'Short',
      copy: businessName => `Hi [First name], this is ${businessName}. Would you mind leaving us an honest Google review about your experience? [Review link] Reply STOP to opt out.`
    }
  ]);

  const SERVICES = Object.freeze({
    reviews: {
      label: 'Google review setup',
      headline: 'Let\'s get your review system ready.',
      lead: 'The easiest way to finish is a 15-minute setup call with John. If you would rather do it yourself, the form is below.',
      overviewTitle: 'What we need from you',
      overviewText: 'Fill in what you know. If you are missing something, choose the help option in that section.',
      needs: [
        'The business name and federal tax ID used for texting approval',
        'The normal Google listing for the business',
        'The message you want customers to receive',
        'A customer list with names and phone numbers or email addresses'
      ],
      summaryTitle: 'We will verify the setup before any customer is contacted.',
      summaryText: 'Text requests stay off until the business, message, customer list, campaign, and assigned number pass the required checks.',
      formTitle: 'Finish your review setup',
      formIntro: 'Fill in what you know. If you are missing something, use the help option in that section. Nothing goes to customers until John checks it and sends you a test.',
      includesReviews: true,
      detailsTitle: '',
      detailsFields: [],
      nextSteps: [
        'We verify the legal business details, Google review link, message approval, and customer eligibility.',
        'We submit the business texting registration and attach the approved campaign to its assigned number.',
        'We send a test to you after approval. Customer review requests stay off until every required check is complete.'
      ],
      promiseLabel: 'How we handle your customer information',
      promiseTitle: 'Your customer information stays private.',
      promiseText: 'We use it only for your review service. We do not sell it, reuse it for another business, or place the original file in an email.'
    },
    'voice-chat': {
      label: 'Backup voice and website chat setup',
      headline: 'Let\'s get your backup assistant set up.',
      lead: 'Tell us how calls and website messages should be handled when your team cannot answer.',
      overviewTitle: 'What we need from you',
      overviewText: 'Think through the questions a real customer asks when they call. Plain answers are enough. We will turn them into the working assistant.',
      needs: [
        'When the assistant should answer',
        'What it can answer, collect, route, or schedule',
        'When it should stop and hand the conversation to a person'
      ],
      summaryTitle: 'We will build the first call and chat flow for you to test.',
      summaryText: 'You will hear it, try the handoff, and approve the behavior before customers reach it.',
      formTitle: 'Tell us how calls and messages should work',
      formIntro: 'Use the same answers you would give a new employee. We will check the flow with you before it is activated.',
      includesReviews: false,
      detailsTitle: 'Calls and website messages',
      detailsFields: [
        { name: 'businessPhone', label: 'Business phone number customers call', placeholder: '(602) 555-0134', type: 'tel', required: true, maxlength: 40 },
        { name: 'answeringRules', label: 'When should the assistant answer?', placeholder: 'For example: after four rings, after hours, or only when nobody on the team answers', required: true, kind: 'textarea' },
        { name: 'servicesHoursArea', label: 'What services, hours, and service area should it know?', placeholder: 'Give us the basics a customer usually asks about', required: true, kind: 'textarea' },
        { name: 'assistantTasks', label: 'What should it be allowed to do?', placeholder: 'Collect job details, answer questions, route emergencies, book an estimate, or something else', required: true, kind: 'textarea' },
        { name: 'handoffRules', label: 'When should it hand the conversation to a person?', placeholder: 'List anything it should never answer or decide on its own', kind: 'textarea' },
        { name: 'textFollowUp', label: 'Should it send any text follow-up?', placeholder: 'Tell us what you want sent. We will collect the required registration details before automated text is enabled.', kind: 'textarea' },
        { name: 'calendarWebsite', label: 'Website or scheduling calendar', placeholder: 'Paste a link if one already exists', type: 'url', maxlength: 2048 }
      ],
      nextSteps: [
        'We turn your answers into the first call and website chat flow.',
        'You test the assistant with normal questions and difficult situations.',
        'We make the changes you approve before it handles customer calls or messages.',
        'If you want automated text follow-up, we collect and verify the separate business registration details before enabling it.'
      ],
      promiseLabel: 'How we set up the assistant',
      promiseTitle: 'It only does what you approve.',
      promiseText: 'The assistant follows the services, scheduling rules, and handoff limits you give us. We test those rules with you before it goes live.'
    },
    'reviews-ai-conversations': {
      label: 'Reviews and backup AI setup',
      headline: 'Let\'s get both services set up.',
      lead: 'The easiest way to finish is a 15-minute setup call with John. If you would rather do it yourself, the form is below.',
      overviewTitle: 'What we need from you',
      overviewText: 'This one setup covers the review follow-up and the first version of the backup assistant.',
      needs: [
        'The business information, Google listing, message choice, and customer list',
        'When the assistant should answer and what it may handle',
        'When it should stop and hand the conversation to a person'
      ],
      summaryTitle: 'We will verify both setups before either one is activated.',
      summaryText: 'The review messages and assistant stay off until the required checks and your approval are complete.',
      formTitle: 'Add the review, call, and website message details',
      formIntro: 'Fill in what you know. If you are missing something, use the help option in that section. Nothing goes live until John checks it with you.',
      includesReviews: true,
      detailsTitle: 'Calls and website messages',
      detailsFields: [
        { name: 'businessPhone', label: 'Business phone number customers call', placeholder: '(602) 555-0134', type: 'tel', required: true, maxlength: 40 },
        { name: 'answeringRules', label: 'When should the assistant answer?', placeholder: 'For example: after four rings, after hours, or only when nobody on the team answers', required: true, kind: 'textarea' },
        { name: 'servicesHoursArea', label: 'What services, hours, and service area should it know?', placeholder: 'Give us the basics a customer usually asks about', required: true, kind: 'textarea' },
        { name: 'assistantTasks', label: 'What should it be allowed to do?', placeholder: 'Collect job details, answer questions, route emergencies, book an estimate, or something else', required: true, kind: 'textarea' },
        { name: 'handoffRules', label: 'When should it hand the conversation to a person?', placeholder: 'List anything it should never answer or decide on its own', kind: 'textarea' },
        { name: 'textFollowUp', label: 'Should it send any text follow-up after a call?', placeholder: 'Tell us the exact follow-up you want us to prepare.', kind: 'textarea' },
        { name: 'calendarWebsite', label: 'Website or scheduling calendar', placeholder: 'Paste a link if one already exists', type: 'url', maxlength: 2048 }
      ],
      nextSteps: [
        'We verify the review setup and build the first phone and website chat flow.',
        'You test the assistant and confirm the exact review message, answers, scheduling rules, and handoff limits.',
        'The assistant and customer review requests stay off until their required checks are complete.'
      ],
      promiseLabel: 'How we handle both services',
      promiseTitle: 'Nothing goes live before the checks and your approval are complete.',
      promiseText: 'We use your customer information only for your review service. The assistant follows the services, scheduling rules, and handoff limits you approve.'
    },
    website: {
      label: 'Website setup',
      headline: 'Let\'s get the website details together.',
      lead: 'Add the information people need to understand the business and take the next step.',
      overviewTitle: 'What we need from you',
      overviewText: 'You do not need finished copy. Tell us what the business does, where it works, and what you want a visitor to do next.',
      needs: [
        'Your services and service area',
        'The main action you want visitors to take',
        'The current website and any examples you want us to review'
      ],
      summaryTitle: 'We will turn the information into a first website draft.',
      summaryText: 'You will review the working draft before anything replaces your current website or domain.',
      formTitle: 'Tell us what the website needs to do',
      formIntro: 'Give us the working details. Finished marketing copy is not required.',
      includesReviews: false,
      detailsTitle: 'Website details',
      detailsFields: [
        { name: 'currentWebsite', label: 'Current website', placeholder: 'Paste the link, or write none', required: true, maxlength: 2048 },
        { name: 'googleProfile', label: 'Google Business Profile link', placeholder: 'Paste the Google listing link if you have it handy', type: 'url', maxlength: 2048 },
        { name: 'servicesArea', label: 'What services do you offer, and where do you work?', placeholder: 'List the work you want more of and the cities or areas you serve', required: true, kind: 'textarea' },
        { name: 'primaryAction', label: 'What should a visitor do next?', placeholder: 'Call, request an estimate, book an appointment, visit the shop, or something else', required: true },
        { name: 'positioning', label: 'What should someone understand about your business right away?', placeholder: 'What makes customers choose you?', kind: 'textarea' },
        { name: 'exampleSites', label: 'Any websites you like?', placeholder: 'Paste links if you have examples', kind: 'textarea' }
      ],
      nextSteps: [
        'We review the business details and current site.',
        'We build the first working draft and check it on a phone and computer.',
        'You review the draft before we discuss connecting the domain or replacing the current site.'
      ],
      promiseLabel: 'How we handle the current website',
      promiseTitle: 'Nothing changes until you approve it.',
      promiseText: 'We build and review the new version separately. We do not replace your current site or change the domain before you approve the draft.'
    },
    assessment: {
      label: 'AI assessment intake',
      headline: 'Let\'s get the assessment ready.',
      lead: 'Tell us how work moves through the business now, where time gets lost, and which parts keep pulling people away from better work.',
      overviewTitle: 'What we need from you',
      overviewText: 'There is no need to diagnose the problem yourself. Describe the work as it actually happens, including the awkward manual parts.',
      needs: [
        'The repeatable work that takes the most time',
        'The tools and people involved in that work',
        'What a useful result would change for the business'
      ],
      summaryTitle: 'We listen first, then review what would actually help.',
      summaryText: 'We do not make recommendations during the intake. We review the workflow afterward and deliver the findings separately.',
      formTitle: 'Give us a starting point for the assessment',
      formIntro: 'Describe the process the way it works today. It does not need to sound polished.',
      includesReviews: false,
      detailsTitle: 'Current workflow',
      detailsFields: [
        { name: 'website', label: 'Business website', placeholder: 'Paste the link if you have one', type: 'url', maxlength: 2048 },
        { name: 'teamSize', label: 'How many people work in the business?', placeholder: 'A rough number is fine', maxlength: 40 },
        { name: 'timeDrain', label: 'What work takes up more time than it should?', placeholder: 'Describe what happens and who has to handle it', required: true, kind: 'textarea' },
        { name: 'workflow', label: 'Walk us through that work from start to finish', placeholder: 'What starts it, what happens next, and where does it usually slow down?', required: true, kind: 'textarea' },
        { name: 'tools', label: 'Which tools or software are involved?', placeholder: 'Email, spreadsheets, CRM, accounting, scheduling, phone, paper, or anything else', kind: 'textarea' },
        { name: 'weeklyHours', label: 'About how many hours a week does this take?', placeholder: 'A rough estimate is fine', maxlength: 80 },
        { name: 'goal', label: 'What would a useful result change for you?', placeholder: 'Tell us what you want to be easier, faster, or more reliable', required: true, kind: 'textarea' }
      ],
      nextSteps: [
        'We use these notes to prepare for the intake conversation.',
        'During the call, we ask how the work actually happens and listen for the full process.',
        'After the call, we review the workflow and deliver the findings and options separately.'
      ],
      promiseLabel: 'How the assessment works',
      promiseTitle: 'We do not force a tool into the process.',
      promiseText: 'The assessment starts with the way the business already works. Recommendations come after we understand the workflow, the time involved, and the result you need.'
    }
  });

  class SafeApiError extends Error {
    constructor(code, options = {}) {
      super(code);
      this.name = 'SafeApiError';
      this.code = code || 'request_failed';
      this.field = options.field || '';
      this.retryable = Boolean(options.retryable);
      this.status = Number(options.status || 0);
    }
  }

  function serviceKeyForOffer(offerId) {
    return OFFER_ALIASES[String(offerId || '').trim().toLowerCase()] || '';
  }

  function serviceRequiresIdentity(serviceKey) {
    return serviceKey === 'reviews'
      || serviceKey === 'voice-chat'
      || serviceKey === 'reviews-ai-conversations';
  }

  function sanitizeCell(value, maxLength = CUSTOMER_LIMITS.maxCellChars) {
    return String(value == null ? '' : value)
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, maxLength);
  }

  function normalizeHeader(value) {
    return sanitizeCell(value).toLowerCase().replace(/[^a-z0-9]+/g, '');
  }

  function parseCsv(text) {
    const input = String(text || '').replace(/^\uFEFF/, '');
    const rows = [];
    let row = [];
    let cell = '';
    let quoted = false;

    for (let index = 0; index < input.length; index += 1) {
      const character = input[index];
      if (quoted) {
        if (character === '"') {
          if (input[index + 1] === '"') {
            cell += '"';
            index += 1;
          } else {
            quoted = false;
          }
        } else {
          cell += character;
        }
        continue;
      }

      if (character === '"' && cell.length === 0) {
        quoted = true;
      } else if (character === ',') {
        row.push(cell);
        cell = '';
      } else if (character === '\n' || character === '\r') {
        if (character === '\r' && input[index + 1] === '\n') index += 1;
        row.push(cell);
        if (row.some(value => String(value).trim())) rows.push(row);
        row = [];
        cell = '';
      } else {
        cell += character;
      }
    }

    if (quoted) throw new SafeApiError('csv_unclosed_quote');
    row.push(cell);
    if (row.some(value => String(value).trim())) rows.push(row);
    return rows;
  }

  function findHeaderIndex(headers, aliases) {
    const normalizedAliases = new Set(aliases.map(normalizeHeader));
    return headers.findIndex(header => normalizedAliases.has(normalizeHeader(header)));
  }

  function normalizePhone(value) {
    const original = sanitizeCell(value, 40);
    if (!original) return '';
    if (/[A-Za-z]/.test(original)) return '';
    if (original.startsWith('+')) {
      if (!/^\+1[0-9(). -]*$/.test(original)) return '';
      const digits = original.slice(1).replace(/[^0-9]/g, '');
      return digits.length === 11 && digits.startsWith('1') ? `+${digits}` : '';
    }
    if (!/^[0-9(). -]+$/.test(original)) return '';
    const digits = original.replace(/[^0-9]/g, '');
    return digits.length === 10 ? `+1${digits}` : '';
  }

  function normalizeEmail(value) {
    const email = sanitizeCell(value, 254).toLowerCase();
    if (!email) return '';
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '';
  }

  function splitFullName(value) {
    const fullName = sanitizeCell(value, 200);
    if (!fullName) return { firstName: '', lastName: '' };
    const pieces = fullName.split(' ');
    return {
      firstName: sanitizeCell(pieces.shift() || '', 100),
      lastName: sanitizeCell(pieces.join(' '), 100)
    };
  }

  function normalizeCustomerCsv(text, limits = CUSTOMER_LIMITS) {
    const parsedRows = parseCsv(text);
    if (parsedRows.length < 2) throw new SafeApiError('csv_needs_header_and_rows');
    if (parsedRows.length - 1 > limits.maxRows) throw new SafeApiError('csv_too_many_rows');

    const headers = parsedRows[0];
    const indexes = {
      firstName: findHeaderIndex(headers, ['first name', 'firstname', 'first', 'given name', 'customer first name']),
      lastName: findHeaderIndex(headers, ['last name', 'lastname', 'last', 'surname', 'family name', 'customer last name']),
      fullName: findHeaderIndex(headers, ['full name', 'fullname', 'name', 'customer name', 'client name']),
      phone: findHeaderIndex(headers, ['phone', 'phone number', 'phonenumber', 'mobile', 'mobile phone', 'cell', 'cell phone']),
      email: findHeaderIndex(headers, ['email', 'email address', 'emailaddress', 'customer email'])
    };

    const hasName = indexes.fullName >= 0 || indexes.firstName >= 0 || indexes.lastName >= 0;
    const hasContact = indexes.phone >= 0 || indexes.email >= 0;
    if (!hasName || !hasContact) throw new SafeApiError('csv_missing_columns');

    const customers = [];
    const seen = new Set();
    let rejected = 0;
    let duplicates = 0;

    for (const sourceRow of parsedRows.slice(1)) {
      let firstName = indexes.firstName >= 0 ? sanitizeCell(sourceRow[indexes.firstName], 100) : '';
      let lastName = indexes.lastName >= 0 ? sanitizeCell(sourceRow[indexes.lastName], 100) : '';
      if ((!firstName && !lastName) && indexes.fullName >= 0) {
        ({ firstName, lastName } = splitFullName(sourceRow[indexes.fullName]));
      }

      const phoneSource = indexes.phone >= 0 ? sanitizeCell(sourceRow[indexes.phone], 40) : '';
      const emailSource = indexes.email >= 0 ? sanitizeCell(sourceRow[indexes.email], 254) : '';
      const phone = normalizePhone(phoneSource);
      const email = normalizeEmail(emailSource);
      const hadInvalidPhone = Boolean(phoneSource) && !phone;
      const hadInvalidEmail = Boolean(emailSource) && !email;

      if ((!firstName && !lastName) || (!phone && !email) || (hadInvalidPhone && !email) || (hadInvalidEmail && !phone)) {
        rejected += 1;
        continue;
      }

      const dedupeKey = phone || email;
      if (seen.has(dedupeKey)) {
        duplicates += 1;
        continue;
      }
      seen.add(dedupeKey);
      customers.push({ firstName, lastName, phone, email });
    }

    if (!customers.length) throw new SafeApiError('csv_no_usable_contacts');
    return { customers, rejected, duplicates, sourceRows: parsedRows.length - 1 };
  }

  function utf8ByteLength(value) {
    if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(value).length;
    return Buffer.byteLength(value, 'utf8');
  }

  function createBatchId(cryptoLike) {
    if (cryptoLike && typeof cryptoLike.randomUUID === 'function') return cryptoLike.randomUUID();
    const bytes = new Uint8Array(16);
    if (cryptoLike && typeof cryptoLike.getRandomValues === 'function') cryptoLike.getRandomValues(bytes);
    else throw new SafeApiError('secure_random_unavailable');
    return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  function buildCustomerBatches(customers, batchId, limits = CUSTOMER_LIMITS) {
    const chunks = [];
    let current = [];

    for (const customer of customers) {
      const candidate = [...current, customer];
      const probe = JSON.stringify({
        batchId,
        batchIndex: 99999,
        totalBatches: 99999,
        customers: candidate
      });
      const tooManyRows = candidate.length > limits.maxBatchRows;
      const tooManyBytes = utf8ByteLength(probe) > limits.maxBatchBytes;
      if ((tooManyRows || tooManyBytes) && current.length) {
        chunks.push(current);
        current = [customer];
      } else if (tooManyRows || tooManyBytes) {
        throw new SafeApiError('customer_row_too_large');
      } else {
        current = candidate;
      }
    }
    if (current.length) chunks.push(current);

    return chunks.map((rows, index) => ({
      batchId,
      batchIndex: index,
      totalBatches: chunks.length,
      customers: rows
    }));
  }

  function normalizeEin(value) {
    const digits = String(value || '').replace(/\D/g, '');
    return digits.length === 9 ? digits : '';
  }

  function safeErrorMessage(error, context = 'form') {
    const code = error && error.code ? error.code : 'request_failed';
    const messages = {
      invitation_missing: 'This setup link is incomplete. Ask John for a new private setup link.',
      invitation_invalid: 'This setup link is not valid. Ask John for a new private setup link.',
      invitation_expired: 'This setup link has expired. Ask John for a new private setup link.',
      invitation_used: 'This setup link has already been used. Open the original link on the same device, or ask John for a new one.',
      session_expired: 'This private setup session has expired. Ask John for a new setup link.',
      unauthorized: 'This private setup session is no longer active. Ask John for a new setup link.',
      rate_limited: 'There were too many attempts. Wait a few minutes, then try again.',
      network_error: 'We could not reach the secure setup service. Keep this page open and try again.',
      request_timeout: 'The secure connection took too long. Keep this page open and try again.',
      invalid_ein: 'Enter the nine digits of the business EIN.',
      invalid_google_review_url: 'Paste the Google or Google Maps link for the correct business.',
      csv_file_too_large: 'Choose a customer list smaller than 5 MB.',
      csv_wrong_file_type: 'Choose a customer list saved as CSV. If you use Excel or Google Sheets, download it as CSV or book a setup call.',
      csv_unclosed_quote: 'The customer list could not be read. Export it again or book a setup call.',
      csv_needs_header_and_rows: 'The customer list needs column names and at least one customer.',
      csv_too_many_rows: 'The customer list can contain up to 5,000 customers at a time.',
      csv_missing_columns: 'The customer list needs a name column and at least one phone or email column.',
      csv_no_usable_contacts: 'We could not find a usable customer with a name and a valid phone number or email.',
      customer_row_too_large: 'One customer row is too large. Shorten that row and try again.',
      customer_batch_rejected: 'One customer batch could not be accepted. Check the list and try again.',
      customer_list_required: 'Choose the customer list before sending the setup, or use the help option in that section.',
      secure_random_unavailable: 'This browser cannot prepare the customer list securely. Try a current version of Chrome, Safari, Edge, or Firefox.',
      validation_error: 'Check the highlighted setup detail and try again.',
      unsupported_offer: 'This setup link does not match a supported MissedMe service. Ask John for a new link.',
      already_submitted: 'This setup was already received.'
    };
    if (messages[code]) return messages[code];
    return context === 'access'
      ? 'We could not open this private setup session. Keep the page open and try again.'
      : 'We could not send the setup. Your entries are still on this page, so you can try again.';
  }

  function normalizeIntakePayload(payload) {
    const source = payload && (payload.intake || payload.onboarding || payload.data || payload);
    const offerId = source && (source.offerId || source.offer_id);
    const serviceKey = serviceKeyForOffer(offerId);
    if (!serviceKey) throw new SafeApiError('unsupported_offer');
    const contact = source.contact || source.prefill || {};
    return {
      id: sanitizeCell(source.id || source.intakeId || '', 100),
      offerId: String(offerId),
      serviceKey,
      status: sanitizeCell(source.status || source.onboardingStatus || 'in_progress', 80),
      progress: source.progress || {},
      contact: {
        name: sanitizeCell(contact.name || source.contactName || '', 120),
        businessName: sanitizeCell(contact.businessName || source.businessName || '', 160),
        phone: sanitizeCell(contact.phone || source.contactPhone || '', 40),
        email: sanitizeCell(contact.email || source.contactEmail || '', 254)
      }
    };
  }

  function buildSubmissionPayloadForService(serviceKey, identityValues, reviewValues, packageValues, approvalValues = {}) {
    const payload = {};
    if (serviceRequiresIdentity(serviceKey)) {
      const ein = normalizeEin(identityValues && identityValues.ein);
      if (!ein) throw new SafeApiError('invalid_ein', { field: 'ein' });
      payload.legalBusinessName = sanitizeCell(identityValues && identityValues.legalBusinessName, 200);
      payload.ein = ein;
    }

    if (serviceKey === 'reviews' || serviceKey === 'reviews-ai-conversations') {
      Object.assign(payload, {
        googleReviewUrl: String(reviewValues && reviewValues.googleReviewUrl || '').trim(),
        approvedMessage: String(reviewValues && reviewValues.approvedMessage || '').trim(),
        approverName: sanitizeCell(reviewValues && reviewValues.approverName, 120),
        messageApproved: Boolean(approvalValues.messageApproved),
        customerConsentAttested: Boolean(approvalValues.customerConsentAttested),
        customerBatchId: String(approvalValues.customerBatchId || '')
      });
    }
    if (serviceKey === 'voice-chat' || serviceKey === 'reviews-ai-conversations') payload.voice = packageValues || {};
    if (serviceKey === 'website') payload.website = packageValues || {};
    if (serviceKey === 'assessment') payload.assessment = packageValues || {};
    return payload;
  }

  const exported = {
    CUSTOMER_LIMITS,
    REVIEW_MESSAGE_TEMPLATES,
    buildCustomerBatches,
    captureAndScrubInvitation,
    normalizeCustomerCsv,
    normalizeEin,
    normalizeIntakePayload,
    normalizePhone,
    parseCsv,
    readInvitationToken,
    safeErrorMessage,
    serviceKeyForOffer,
    serviceRequiresIdentity,
    buildSubmissionPayloadForService,
    utf8ByteLength
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = exported;
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  let invitationToken = capturedInvitationToken;
  let intake = null;
  let service = null;
  let customerState = null;
  let submitting = false;

  const elements = {
    accessSection: document.getElementById('accessSection'),
    accessPanel: document.getElementById('accessPanel'),
    accessSpinner: document.getElementById('accessSpinner'),
    accessTitle: document.getElementById('accessTitle'),
    accessMessage: document.getElementById('accessMessage'),
    accessRetry: document.getElementById('accessRetry'),
    content: document.getElementById('onboardingContent'),
    steps: document.getElementById('onboardSteps'),
    form: document.getElementById('onboardForm'),
    serviceFields: document.getElementById('serviceFields'),
    submitButton: document.getElementById('submitButton'),
    formStatus: document.getElementById('formStatus'),
    submitProgress: document.getElementById('submitProgress'),
    progressTrack: document.getElementById('progressTrack'),
    progressCount: document.getElementById('progressCount'),
    progressTitle: document.getElementById('progressTitle'),
    progressText: document.getElementById('progressText'),
    successBanner: document.getElementById('successBanner'),
    successTitle: document.getElementById('successTitle'),
    successMessage: document.getElementById('successMessage'),
    inviteBusiness: document.getElementById('inviteBusiness'),
    inviteContact: document.getElementById('inviteContact'),
    selectedHelpPanel: document.getElementById('selectedHelpPanel'),
    selectedHelpText: document.getElementById('selectedHelpText'),
    onboardWhatSection: document.getElementById('onboardWhatSection'),
    serviceSummarySection: document.getElementById('serviceSummarySection')
  };

  function setText(id, text) {
    const element = document.getElementById(id);
    if (element) element.textContent = text;
  }

  function renderList(id, items) {
    const list = document.getElementById(id);
    if (!list) return;
    list.replaceChildren(...items.map(item => {
      const listItem = document.createElement('li');
      listItem.textContent = item;
      return listItem;
    }));
  }

  function apiRequest(path, options = {}) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), API_TIMEOUT_MS);
    const headers = new Headers(options.headers || {});
    headers.set('Accept', 'application/json');
    if (options.body !== undefined) headers.set('Content-Type', 'application/json');

    return fetch(`${API_BASE}${path}`, {
      method: options.method || 'GET',
      credentials: 'include',
      cache: 'no-store',
      referrerPolicy: 'no-referrer',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: controller.signal
    }).then(async response => {
      let payload = null;
      try {
        payload = await response.json();
      } catch (_error) {
        throw new SafeApiError('invalid_response', { status: response.status });
      }
      if (!response.ok || !payload || payload.ok === false) {
        const error = payload && payload.error ? payload.error : {};
        throw new SafeApiError(error.code || (response.status === 401 ? 'unauthorized' : 'request_failed'), {
          field: error.field,
          retryable: error.retryable,
          status: response.status
        });
      }
      return payload;
    }).catch(error => {
      if (error instanceof SafeApiError) throw error;
      if (error && error.name === 'AbortError') throw new SafeApiError('request_timeout', { retryable: true });
      throw new SafeApiError('network_error', { retryable: true });
    }).finally(() => window.clearTimeout(timeout));
  }

  function setAccessState(kind, title, message, canRetry = false) {
    elements.accessPanel.dataset.state = kind;
    elements.accessSpinner.hidden = kind !== 'loading';
    elements.accessTitle.textContent = title;
    elements.accessMessage.textContent = message;
    elements.accessRetry.hidden = !canRetry;
  }

  function markCurrentStep(stepName) {
    if (!elements.steps) return;
    elements.steps.querySelectorAll('[data-step]').forEach(step => {
      const active = step.dataset.step === stepName;
      step.classList.toggle('ob-now', active);
      step.classList.toggle('ob-done', stepName === 'review' && !active);
    });
  }

  function createDescription(text, inputId) {
    const description = document.createElement('span');
    description.className = 'field-description';
    description.id = `${inputId}-description`;
    description.textContent = text;
    return description;
  }

  function createField(field) {
    const wrapper = document.createElement('div');
    wrapper.className = field.fullWidth === false ? '' : 'field-full';
    const label = document.createElement('label');
    const inputId = `field-${field.name}`;
    label.htmlFor = inputId;
    label.append(document.createTextNode(field.label));

    if (!field.required) {
      const optional = document.createElement('span');
      optional.className = 'label-opt';
      optional.textContent = ' (optional)';
      label.append(optional);
    }

    const control = document.createElement(field.kind === 'textarea' ? 'textarea' : 'input');
    control.id = inputId;
    control.name = field.name;
    control.required = Boolean(field.required);
    control.placeholder = field.placeholder || '';
    control.dataset.label = field.label;
    control.maxLength = Number(field.maxlength || (field.kind === 'textarea' ? 3000 : 500));
    if (field.autocomplete) control.autocomplete = field.autocomplete;
    if (field.inputmode) control.inputMode = field.inputmode;

    if (control instanceof HTMLTextAreaElement) control.rows = 4;
    else control.type = field.type || 'text';

    label.append(control);
    if (field.description) {
      const description = createDescription(field.description, inputId);
      control.setAttribute('aria-describedby', description.id);
      label.append(description);
    }
    wrapper.append(label);
    return wrapper;
  }

  function createCheckbox(name, text) {
    const label = document.createElement('label');
    label.className = 'check-control';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.name = name;
    input.id = `field-${name}`;
    input.required = true;
    input.dataset.label = text;
    const copy = document.createElement('span');
    copy.textContent = text;
    label.append(input, copy);
    return label;
  }

  function createHelpChoice(name, text, topic) {
    const label = document.createElement('label');
    label.className = 'setup-help-choice';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.name = name;
    input.id = `field-${name}`;
    input.dataset.setupHelp = topic;
    const copy = document.createElement('span');
    copy.textContent = text;
    label.append(input, copy);
    return label;
  }

  function createMessageChoice(template, businessName) {
    const label = document.createElement('label');
    label.className = 'message-choice';
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'messageStyle';
    input.value = template.id;
    input.required = true;
    const copy = document.createElement('span');
    const title = document.createElement('strong');
    title.textContent = template.label;
    const preview = document.createElement('small');
    preview.textContent = template.copy(businessName);
    copy.append(title, preview);
    label.append(input, copy);
    return label;
  }

  function createIdentitySection() {
    const fieldset = document.createElement('fieldset');
    fieldset.className = 'form-section identity-section';
    const legend = document.createElement('legend');
    legend.textContent = 'Business information for texting approval';
    const intro = document.createElement('p');
    intro.className = 'form-section-intro';
    intro.textContent = 'Phone carriers ask for this before they allow a business to send review texts.';
    const grid = document.createElement('div');
    grid.className = 'service-field-grid';
    grid.append(...IDENTITY_FIELDS.map(createField));
    const help = createHelpChoice(
      'helpBusinessIdentity',
      'I need help finding the legal business name or EIN.',
      'business name or EIN'
    );
    fieldset.append(legend, intro, grid, help);
    return fieldset;
  }

  function createReviewSection() {
    const fieldset = document.createElement('fieldset');
    fieldset.className = 'form-section review-setup-section';
    const legend = document.createElement('legend');
    legend.textContent = 'Google listing and customer message';
    const intro = document.createElement('p');
    intro.className = 'form-section-intro';
    intro.textContent = 'Send us the normal Google listing, then choose the message you want your customers to receive.';
    const grid = document.createElement('div');
    grid.className = 'service-field-grid';
    grid.append(createField(REVIEW_FIELDS[0]));

    const googleHelp = document.createElement('details');
    googleHelp.className = 'field-help-details field-full';
    const googleSummary = document.createElement('summary');
    googleSummary.textContent = 'How do I find my Google listing?';
    const googleInstructions = document.createElement('p');
    googleInstructions.textContent = 'Open Google or Google Maps, find your business, tap Share, then Copy link. Paste that link above.';
    googleHelp.append(googleSummary, googleInstructions);

    const googleHelpChoice = createHelpChoice(
      'helpGoogleListing',
      'I need help finding my Google listing.',
      'Google listing'
    );
    googleHelpChoice.classList.add('field-full');

    const messageBlock = document.createElement('div');
    messageBlock.className = 'message-template-block field-full';
    const messageHeading = document.createElement('h3');
    messageHeading.textContent = 'Choose the message your customers will get';
    const messageIntro = document.createElement('p');
    messageIntro.textContent = 'You do not have to write this yourself. Pick one, or choose your own wording.';
    const businessName = intake?.contact?.businessName || 'your business';
    const choices = document.createElement('div');
    choices.className = 'message-choice-grid';
    choices.append(...REVIEW_MESSAGE_TEMPLATES.map(template => createMessageChoice(template, businessName)));
    const customChoice = document.createElement('label');
    customChoice.className = 'message-choice';
    const customRadio = document.createElement('input');
    customRadio.type = 'radio';
    customRadio.name = 'messageStyle';
    customRadio.value = 'custom';
    customRadio.required = true;
    const customCopy = document.createElement('span');
    const customTitle = document.createElement('strong');
    customTitle.textContent = 'Use different wording';
    const customPreview = document.createElement('small');
    customPreview.textContent = 'Write or edit the message below.';
    customCopy.append(customTitle, customPreview);
    customChoice.append(customRadio, customCopy);
    choices.append(customChoice);
    messageBlock.append(messageHeading, messageIntro, choices);

    grid.append(
      googleHelp,
      googleHelpChoice,
      messageBlock,
      createField(REVIEW_FIELDS[1]),
      createField(REVIEW_FIELDS[2])
    );

    const messageApproval = createCheckbox(
      'messageApproved',
      'I approve the message selected above. I understand that John will send me a test before it goes to customers.'
    );

    const messageHelpChoice = createHelpChoice(
      'helpReviewMessage',
      'I want John to help me choose the message.',
      'review message'
    );

    const listField = document.createElement('div');
    listField.className = 'customer-list-field';
    const listLabel = document.createElement('label');
    listLabel.htmlFor = 'customerCsv';
    listLabel.textContent = 'Customer list';
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.id = 'customerCsv';
    fileInput.name = 'customerCsv';
    fileInput.accept = '.csv,text/csv';
    fileInput.setAttribute('aria-describedby', 'customerCsvHelp customerCsvStatus');
    const help = document.createElement('span');
    help.className = 'field-description';
    help.id = 'customerCsvHelp';
    help.textContent = 'Choose a CSV exported from Excel, Google Sheets, or your customer system. It needs each customer\'s name and a phone number, email address, or both.';
    const templateLink = document.createElement('a');
    templateLink.className = 'customer-template-link';
    templateLink.href = 'customer-list-template.csv';
    templateLink.download = 'missedme-customer-list-template.csv';
    templateLink.textContent = 'Download a simple customer list example';
    const status = document.createElement('span');
    status.className = 'file-status';
    status.id = 'customerCsvStatus';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.textContent = 'No customer list added yet.';
    listLabel.append(fileInput, help, templateLink, status);
    listField.append(listLabel);

    const customerHelpChoice = createHelpChoice(
      'helpCustomerList',
      'I need help getting my customer list ready.',
      'customer list'
    );

    const consent = createCheckbox(
      'customerConsentAttested',
      'I confirm these are real customers who agreed to receive messages from my business. I removed anyone who opted out or asked us to stop.'
    );

    const listWarning = document.createElement('p');
    listWarning.className = 'customer-list-warning';
    listWarning.textContent = 'Do not use purchased, scraped, unrelated, opted-out, or STOP contacts.';

    fieldset.append(
      legend,
      intro,
      grid,
      messageApproval,
      messageHelpChoice,
      listField,
      customerHelpChoice,
      consent,
      listWarning
    );
    return fieldset;
  }

  function createDetailsSection(title, fields) {
    const fieldset = document.createElement('fieldset');
    fieldset.className = 'form-section';
    const legend = document.createElement('legend');
    legend.textContent = title;
    const grid = document.createElement('div');
    grid.className = 'service-field-grid';
    grid.append(...fields.map(createField));
    fieldset.append(legend, grid);
    return fieldset;
  }

  function formatEinInput(input) {
    const digits = input.value.replace(/\D/g, '').slice(0, 9);
    input.value = digits.length > 2 ? `${digits.slice(0, 2)}-${digits.slice(2)}` : digits;
  }

  function setFileStatus(message, isError = false) {
    const status = document.getElementById('customerCsvStatus');
    if (!status) return;
    status.textContent = message;
    status.classList.toggle('is-error', isError);
    status.classList.toggle('is-ready', !isError && Boolean(customerState));
  }

  function selectedHelpTopics() {
    return Array.from(elements.form.querySelectorAll('[data-setup-help]:checked'))
      .map(control => sanitizeCell(control.dataset.setupHelp, 80))
      .filter(Boolean);
  }

  function updateSelectedHelpPanel() {
    const topics = selectedHelpTopics();
    elements.selectedHelpPanel.hidden = topics.length === 0;
    if (!topics.length) return;
    elements.selectedHelpText.textContent = `You asked for help with ${topics.join(', ')}. Book a 15-minute call or call John now. Have your EIN, be able to open your Google Business Profile, and have access to your customer list. You do not need to make a spreadsheet first.`;
  }

  function wireReviewMessageChoices() {
    const approvedMessage = document.getElementById('field-approvedMessage');
    if (!approvedMessage) return;
    const businessName = intake?.contact?.businessName || 'your business';
    const templateValues = Object.fromEntries(
      REVIEW_MESSAGE_TEMPLATES.map(template => [template.id, template.copy(businessName)])
    );
    const choices = Array.from(elements.form.querySelectorAll('input[name="messageStyle"]'));
    choices.forEach(choice => {
      choice.addEventListener('change', () => {
        if (!choice.checked) return;
        if (choice.value === 'custom') {
          if (approvedMessage.dataset.templateId) approvedMessage.value = '';
          approvedMessage.dataset.templateId = '';
          approvedMessage.focus();
          return;
        }
        approvedMessage.value = templateValues[choice.value] || '';
        approvedMessage.dataset.templateId = choice.value;
      });
    });
    approvedMessage.addEventListener('input', () => {
      const selected = elements.form.querySelector('input[name="messageStyle"]:checked');
      if (!selected || selected.value === 'custom') return;
      const expected = templateValues[selected.value] || '';
      if (approvedMessage.value !== expected) {
        const custom = elements.form.querySelector('input[name="messageStyle"][value="custom"]');
        if (custom) custom.checked = true;
        approvedMessage.dataset.templateId = '';
      }
    });
  }

  async function prepareCustomerCsv(fileInput) {
    const file = fileInput.files && fileInput.files[0];
    customerState = null;
    setFileStatus('Checking the customer list.');
    try {
      if (!file) throw new SafeApiError('customer_list_required');
      const filename = String(file.name || '').toLowerCase();
      if (!filename.endsWith('.csv')) throw new SafeApiError('csv_wrong_file_type');
      if (file.size > CUSTOMER_LIMITS.maxFileBytes) throw new SafeApiError('csv_file_too_large');
      const normalized = normalizeCustomerCsv(await file.text());
      const batchId = createBatchId(window.crypto);
      const batches = buildCustomerBatches(normalized.customers, batchId);
      customerState = {
        batchId,
        rows: normalized.customers,
        batches
      };
      const ignored = normalized.rejected + normalized.duplicates;
      const ignoredCopy = ignored ? ` ${ignored.toLocaleString()} duplicate or unusable row${ignored === 1 ? ' was' : 's were'} left out.` : '';
      setFileStatus(`${normalized.customers.length.toLocaleString()} customer${normalized.customers.length === 1 ? '' : 's'} ready.${ignoredCopy}`);
    } catch (error) {
      setFileStatus(safeErrorMessage(error), true);
    } finally {
      fileInput.value = '';
    }
  }

  function renderService() {
    document.title = `${service.label} | MissedMe`;
    setText('serviceLabel', service.label);
    setText('welcomeHeadline', intake.contact.businessName ? `Let\'s get ${intake.contact.businessName} set up.` : service.headline);
    setText('welcomeLead', service.lead);
    setText('overviewTitle', service.overviewTitle);
    setText('overviewText', service.overviewText);
    setText('summaryTitle', service.summaryTitle);
    setText('summaryText', service.summaryText);
    setText('formTitle', service.formTitle);
    setText('formIntro', service.formIntro);
    setText('promiseLabel', service.promiseLabel);
    setText('promiseTitle', service.promiseTitle);
    setText('promiseText', service.promiseText);
    elements.onboardWhatSection.hidden = Boolean(service.includesReviews);
    elements.serviceSummarySection.hidden = Boolean(service.includesReviews);
    setText(
      'privacyText',
      service.includesReviews
        ? 'We do not put your EIN or customer list in a link, email, or browser storage. The original customer spreadsheet stays on your device. Only the contact details needed for setup go through this private session.'
        : serviceRequiresIdentity(intake.serviceKey)
          ? 'We do not put your EIN or setup details in a link, email, or browser storage. They are sent only through this private setup session.'
          : 'We do not put your setup details in a link, email, or browser storage. They are sent only through this private setup session.'
    );
    renderList('setupNeeds', service.needs);
    renderList('nextSteps', service.nextSteps);

    const sections = [];
    if (serviceRequiresIdentity(intake.serviceKey)) sections.push(createIdentitySection());
    if (service.includesReviews) sections.push(createReviewSection());
    if (service.detailsFields.length) sections.push(createDetailsSection(service.detailsTitle, service.detailsFields));
    elements.serviceFields.replaceChildren(...sections);

    elements.inviteBusiness.textContent = intake.contact.businessName || 'Business name not provided';
    const contactParts = [intake.contact.name, intake.contact.email, intake.contact.phone].filter(Boolean);
    elements.inviteContact.textContent = contactParts.length ? contactParts.join(' | ') : 'Contact details not provided';

    const einInput = document.getElementById('field-ein');
    if (einInput) einInput.addEventListener('input', () => formatEinInput(einInput));
    const approverInput = document.getElementById('field-approverName');
    if (approverInput && !approverInput.value) approverInput.value = intake.contact.name || '';
    const fileInput = document.getElementById('customerCsv');
    if (fileInput) fileInput.addEventListener('change', () => prepareCustomerCsv(fileInput));
    elements.form.querySelectorAll('[data-setup-help]').forEach(control => {
      control.addEventListener('change', updateSelectedHelpPanel);
    });
    wireReviewMessageChoices();
    updateSelectedHelpPanel();
  }

  function isCompletedStatus(status) {
    return ['submitted', 'registration_pending', 'ready_to_send', 'active'].includes(String(status || '').toLowerCase());
  }

  function showReadyIntake(payload) {
    intake = normalizeIntakePayload(payload);
    service = SERVICES[intake.serviceKey];
    renderService();
    elements.accessSection.hidden = true;
    elements.content.hidden = false;
    if (elements.steps) elements.steps.hidden = true;
    if (isCompletedStatus(intake.status)) showSuccess(intake.status);
    else {
      markCurrentStep('business');
      const firstField = elements.serviceFields.querySelector('input:not([type="hidden"]), textarea');
      if (firstField) window.requestAnimationFrame(() => firstField.focus({ preventScroll: true }));
    }
  }

  async function resumeSession() {
    const payload = await apiRequest('/v1/onboarding');
    showReadyIntake(payload);
    return true;
  }

  async function openInvitation() {
    setAccessState('loading', 'Checking your setup link', 'This should only take a moment.');
    try {
      if (invitationToken) {
        try {
          const payload = await apiRequest('/v1/invitations/exchange', {
            method: 'POST',
            body: { invitationToken }
          });
          invitationToken = '';
          showReadyIntake(payload);
          return;
        } catch (exchangeError) {
          try {
            await resumeSession();
            invitationToken = '';
            return;
          } catch (_resumeError) {
            throw exchangeError;
          }
        }
      }

      try {
        await resumeSession();
      } catch (error) {
        if (error.code === 'unauthorized' || error.status === 401) throw new SafeApiError('invitation_missing');
        throw error;
      }
    } catch (error) {
      const retryable = Boolean(invitationToken) && (error.retryable || ['network_error', 'request_timeout', 'rate_limited'].includes(error.code));
      setAccessState('error', 'We could not open this setup', safeErrorMessage(error, 'access'), retryable);
      invitationToken = retryable ? invitationToken : '';
    }
  }

  function collectNamedValues(fields) {
    return Object.fromEntries(fields.map(field => {
      const control = elements.form.elements.namedItem(field.name);
      return [field.name, control ? String(control.value || '').trim() : ''];
    }));
  }

  function buildSubmissionPayload() {
    const identityValues = serviceRequiresIdentity(intake.serviceKey) ? collectNamedValues(IDENTITY_FIELDS) : null;
    const reviewValues = service.includesReviews ? collectNamedValues(REVIEW_FIELDS) : null;
    const packageValues = collectNamedValues(service.detailsFields);
    return buildSubmissionPayloadForService(intake.serviceKey, identityValues, reviewValues, packageValues, {
      messageApproved: service.includesReviews && elements.form.elements.namedItem('messageApproved').checked,
      customerConsentAttested: service.includesReviews && elements.form.elements.namedItem('customerConsentAttested').checked,
      customerBatchId: service.includesReviews && customerState ? customerState.batchId : ''
    });
  }

  function setSubmissionProgress(percent, title, text) {
    const bounded = Math.max(0, Math.min(100, Math.round(percent)));
    elements.submitProgress.hidden = false;
    elements.progressTrack.value = bounded;
    elements.progressTrack.textContent = `${bounded}%`;
    elements.progressCount.textContent = `${bounded}%`;
    elements.progressTitle.textContent = title;
    elements.progressText.textContent = text;
  }

  async function sendCustomerBatches() {
    if (!service.includesReviews) return;
    if (!customerState || !customerState.batches.length) throw new SafeApiError('customer_list_required', { field: 'customerCsv' });

    for (let index = 0; index < customerState.batches.length; index += 1) {
      const percent = 15 + ((index / customerState.batches.length) * 60);
      setSubmissionProgress(percent, 'Sending the customer list', `Sending part ${index + 1} of ${customerState.batches.length}.`);
      const response = await apiRequest('/v1/onboarding/customer-batches', {
        method: 'POST',
        body: customerState.batches[index]
      });
      const rejected = Number(response.totalRejected || response.rejected || 0);
      const errors = Array.isArray(response.errors) ? response.errors : [];
      if (rejected > 0 || errors.length > 0) throw new SafeApiError('customer_batch_rejected', { field: 'customerCsv' });
    }
  }

  function focusErrorField(fieldName) {
    if (!fieldName) return;
    const control = document.getElementById(`field-${fieldName}`) || elements.form.elements.namedItem(fieldName);
    if (control && typeof control.focus === 'function') control.focus();
  }

  function clearSensitiveState() {
    if (customerState && Array.isArray(customerState.rows)) customerState.rows.length = 0;
    if (customerState && Array.isArray(customerState.batches)) customerState.batches.length = 0;
    customerState = null;
    elements.form.reset();
    elements.serviceFields.replaceChildren();
  }

  function showSuccess(status) {
    markCurrentStep('review');
    clearSensitiveState();
    elements.form.hidden = true;
    elements.successBanner.hidden = false;
    if (String(status).toLowerCase() === 'active') {
      elements.successTitle.textContent = 'Your setup is active.';
      elements.successMessage.textContent = 'The approved service is active. John will contact you if anything needs attention.';
    } else {
      elements.successTitle.textContent = 'We received your setup.';
      elements.successMessage.textContent = 'John will verify the details and contact you if anything needs to be corrected before activation.';
    }
    elements.successBanner.focus();
  }

  async function submitForm(event) {
    event.preventDefault();
    if (submitting) return;

    elements.formStatus.textContent = '';
    elements.formStatus.classList.remove('is-error');
    const helpTopics = selectedHelpTopics();
    const missingCustomerList = service.includesReviews && (!customerState || !customerState.rows.length);
    if (helpTopics.length && (!elements.form.checkValidity() || missingCustomerList)) {
      elements.formStatus.textContent = 'Book a 15-minute call or call John now to finish the items you marked for help.';
      elements.formStatus.classList.add('is-error');
      elements.selectedHelpPanel.hidden = false;
      elements.selectedHelpPanel.focus();
      return;
    }
    if (!elements.form.checkValidity()) {
      elements.form.reportValidity();
      return;
    }
    if (service.includesReviews && (!customerState || !customerState.rows.length)) {
      const error = new SafeApiError('customer_list_required');
      elements.formStatus.textContent = safeErrorMessage(error);
      elements.formStatus.classList.add('is-error');
      const fileInput = document.getElementById('customerCsv');
      if (fileInput) fileInput.focus();
      return;
    }

    submitting = true;
    elements.submitButton.disabled = true;
    elements.submitButton.textContent = 'Sending the setup...';
    try {
      const payload = buildSubmissionPayload();
      setSubmissionProgress(8, 'Checking the setup details', 'Nothing has been activated yet.');
      await sendCustomerBatches();
      setSubmissionProgress(82, 'Sending your setup for review', 'Saving the business details and your approval.');
      const response = await apiRequest('/v1/onboarding/submit', {
        method: 'POST',
        body: payload
      });
      setSubmissionProgress(100, 'Setup received', 'The required checks can begin.');
      showSuccess(response.status || (response.intake && response.intake.status) || 'submitted');
    } catch (error) {
      elements.submitProgress.hidden = true;
      elements.formStatus.textContent = safeErrorMessage(error);
      elements.formStatus.classList.add('is-error');
      focusErrorField(error.field);
    } finally {
      submitting = false;
      elements.submitButton.disabled = false;
      elements.submitButton.textContent = 'Send to John for review';
    }
  }

  elements.accessRetry.addEventListener('click', openInvitation);
  elements.form.addEventListener('submit', submitForm);
  openInvitation();
})();
