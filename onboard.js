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
      placeholder: 'The exact name registered for the business',
      required: true,
      autocomplete: 'organization',
      maxlength: 200
    },
    {
      name: 'ein',
      label: 'Employer Identification Number (EIN)',
      placeholder: '12-3456789',
      required: true,
      inputmode: 'numeric',
      autocomplete: 'off',
      maxlength: 10,
      description: 'We use this only for the required business verification. It is not placed in a link, email, or browser storage.'
    }
  ]);

  const REVIEW_FIELDS = Object.freeze([
    {
      name: 'googleReviewUrl',
      label: 'Direct Google review link',
      placeholder: 'Paste the link that opens the Google review form',
      required: true,
      type: 'url',
      maxlength: 2048,
      description: 'Open the link in another tab first and make sure it goes to the correct business.'
    },
    {
      name: 'approvedMessage',
      label: 'Exact review request you approve',
      placeholder: 'Type the exact message customers should receive.',
      required: true,
      kind: 'textarea',
      maxlength: 1200,
      description: 'Nothing is rewritten after you approve it. If the wording changes, you will approve the new version first.'
    },
    {
      name: 'approverName',
      label: 'Name of the person approving this message',
      placeholder: 'Full name',
      required: true,
      autocomplete: 'name',
      maxlength: 120
    }
  ]);

  const SERVICES = Object.freeze({
    reviews: {
      label: 'Google review setup',
      headline: 'Let\'s get your review system set up.',
      lead: 'Add the business details, the exact message you approve, and the customers who are eligible to receive it.',
      overviewTitle: 'What we need from you',
      overviewText: 'You do not need to clean up a large spreadsheet first. A CSV with a name and either a phone number or email for each customer is enough.',
      needs: [
        'The legal business name and EIN used for business texting registration',
        'The direct Google review link for the correct business',
        'The exact review request wording and the person approving it',
        'A CSV of real customers the business is allowed to contact'
      ],
      summaryTitle: 'We will verify the setup before any customer is contacted.',
      summaryText: 'Text requests stay off until the business, message, customer list, campaign, and assigned number pass the required checks.',
      formTitle: 'Add the review setup details',
      formIntro: 'The CSV is read on this page and sent as normalized contact fields. The original file is not uploaded.',
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
      lead: 'Add the approved review setup and tell us how calls and website messages should work when your team cannot answer.',
      overviewTitle: 'What we need from you',
      overviewText: 'This one setup covers the review follow-up and the first version of the backup assistant.',
      needs: [
        'The legal business details, direct Google review link, approved message, and eligible customer list',
        'When the assistant should answer and what it may handle',
        'When it should stop and hand the conversation to a person'
      ],
      summaryTitle: 'We will verify both setups before either one is activated.',
      summaryText: 'The review messages and assistant stay off until the required checks and your approval are complete.',
      formTitle: 'Add the review, call, and website message details',
      formIntro: 'The customer CSV is converted into normalized contact fields here. The original file is not uploaded.',
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
      invalid_google_review_url: 'Check the direct Google review link and try again.',
      csv_file_too_large: 'Choose a CSV smaller than 5 MB.',
      csv_wrong_file_type: 'Choose a CSV file.',
      csv_unclosed_quote: 'The CSV has an unfinished quoted field. Export it again and retry.',
      csv_needs_header_and_rows: 'The CSV needs a header row and at least one customer.',
      csv_too_many_rows: 'The CSV can contain up to 5,000 customer rows at a time.',
      csv_missing_columns: 'The CSV needs a name column and at least one phone or email column.',
      csv_no_usable_contacts: 'We could not find a usable customer with a name and a valid phone number or email.',
      customer_row_too_large: 'One customer row is too large. Shorten that row and try again.',
      customer_batch_rejected: 'One customer batch could not be accepted. Check the list and try again.',
      customer_list_required: 'Choose the eligible customer CSV before sending the setup.',
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
    inviteContact: document.getElementById('inviteContact')
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
    elements.steps.querySelectorAll('[data-step]').forEach(step => {
      const active = step.dataset.step === stepName;
      step.classList.toggle('ob-now', active);
      step.classList.toggle('ob-done', !active && stepName !== 'details' && step.dataset.step === 'details');
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

  function createIdentitySection() {
    const fieldset = document.createElement('fieldset');
    fieldset.className = 'form-section identity-section';
    const legend = document.createElement('legend');
    legend.textContent = 'Legal business details';
    const intro = document.createElement('p');
    intro.className = 'form-section-intro';
    intro.textContent = 'Enter these exactly as they appear on the official business records. We use them only for setup and required registration checks.';
    const grid = document.createElement('div');
    grid.className = 'service-field-grid';
    grid.append(...IDENTITY_FIELDS.map(createField));
    fieldset.append(legend, intro, grid);
    return fieldset;
  }

  function createReviewSection() {
    const fieldset = document.createElement('fieldset');
    fieldset.className = 'form-section review-setup-section';
    const legend = document.createElement('legend');
    legend.textContent = 'Review request setup';
    const intro = document.createElement('p');
    intro.className = 'form-section-intro';
    intro.textContent = 'Approve the exact message and add only customers this business is allowed to contact.';
    const grid = document.createElement('div');
    grid.className = 'service-field-grid';
    grid.append(...REVIEW_FIELDS.map(createField));

    const messageApproval = createCheckbox(
      'messageApproved',
      'I approve the exact review request written above. I understand that I will approve it again if the wording changes.'
    );

    const listField = document.createElement('div');
    listField.className = 'customer-list-field';
    const listLabel = document.createElement('label');
    listLabel.htmlFor = 'customerCsv';
    listLabel.textContent = 'Eligible customer CSV';
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.id = 'customerCsv';
    fileInput.name = 'customerCsv';
    fileInput.accept = '.csv,text/csv';
    fileInput.setAttribute('aria-describedby', 'customerCsvHelp customerCsvStatus');
    const help = document.createElement('span');
    help.className = 'field-description';
    help.id = 'customerCsvHelp';
    help.textContent = 'Use a CSV with First Name and Last Name, or Full Name, plus Phone, Email, or both. Up to 5,000 customers and 5 MB.';
    const status = document.createElement('span');
    status.className = 'file-status';
    status.id = 'customerCsvStatus';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.textContent = 'No customer list has been prepared yet.';
    listLabel.append(fileInput, help, status);
    listField.append(listLabel);

    const consent = createCheckbox(
      'customerConsentAttested',
      'I confirm each person is a real customer who gave this business permission to contact them through the phone number or email included for this review request. This list does not include purchased, scraped, unrelated, opted-out, or STOP contacts.'
    );

    fieldset.append(legend, intro, grid, messageApproval, listField, consent);
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
      setFileStatus(`${normalized.customers.length.toLocaleString()} eligible customer${normalized.customers.length === 1 ? '' : 's'} ready.${ignoredCopy}`);
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
    setText(
      'privacyText',
      service.includesReviews
        ? 'We do not put your EIN or customer list in a link, email, or browser storage. The customer file is read here, converted into the required contact fields, and then cleared from the file input.'
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
    const fileInput = document.getElementById('customerCsv');
    if (fileInput) fileInput.addEventListener('change', () => prepareCustomerCsv(fileInput));
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
    elements.steps.hidden = false;
    if (isCompletedStatus(intake.status)) showSuccess(intake.status);
    else {
      markCurrentStep('details');
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
      setSubmissionProgress(percent, 'Sending the eligible customers', `Sending batch ${index + 1} of ${customerState.batches.length}.`);
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
      setSubmissionProgress(82, 'Sending the approved setup', 'Saving the business details and approval.');
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
      elements.submitButton.textContent = 'Send the setup details';
    }
  }

  elements.accessRetry.addEventListener('click', openInvitation);
  elements.form.addEventListener('submit', submitForm);
  openInvitation();
})();
