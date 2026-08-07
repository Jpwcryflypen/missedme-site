// MissedMe private client setup page (/start)
(() => {
  const EMAIL = 'john@missedme.ai';
  const params = new URLSearchParams(window.location.search);

  const aliases = {
    review: 'reviews',
    reviews: 'reviews',
    gbp: 'reviews',
    voice: 'voice-chat',
    chat: 'voice-chat',
    'voice-chat': 'voice-chat',
    'ai-conversations': 'voice-chat',
    site: 'website',
    website: 'website',
    audit: 'assessment',
    assessment: 'assessment',
    'ai-assessment': 'assessment'
  };

  const services = {
    reviews: {
      label: 'Google review setup',
      headline: 'Let\'s get your review system set up.',
      lead: 'Tell us where your customer information lives and how you want review requests handled. Email can start first. Text messages start only after the business and campaign are approved by the carriers.',
      overviewTitle: 'What we need from you',
      overviewText: 'You do not need to clean up a spreadsheet or learn a new system first. Tell us what you have and where it lives.',
      needs: [
        'Where customer names, phone numbers, or emails are stored',
        'Your Google Business Profile link',
        'What permission is documented for email and text follow-up',
        'Who should approve the message before it goes out'
      ],
      summaryTitle: 'We will prepare the review request for your approval.',
      summaryText: 'Nothing goes out until you have seen the message and approved it.',
      formTitle: 'Tell us how your customer information is set up',
      fields: [
        { name: 'customer_source', label: 'Where does your customer information live?', placeholder: 'QuickBooks, Jobber, Housecall Pro, a spreadsheet, paper invoices, or somewhere else', required: true },
        { name: 'google_profile', label: 'Google Business Profile link', placeholder: 'Paste the Google listing link if you have it handy', type: 'url' },
        { name: 'customer_count', label: 'About how many past customers do you have?', placeholder: 'A rough estimate is fine' },
        { name: 'contact_permission', label: 'What permission do you have to contact these customers?', placeholder: 'Tell us whether you have documented email permission, text permission, both, or are not sure', required: true, kind: 'textarea' },
        { name: 'approval_contact', label: 'Who should approve the review request?', placeholder: 'Name, phone, or email' }
      ],
      attachmentTitle: 'Have a customer list to send?',
      attachmentText: 'After you click the button, your email app will open with these details filled in. Attach the list there before you send it. A spreadsheet, export, PDF, or clear photo is fine.',
      subject: 'MissedMe review setup',
      nextSteps: [
        'We review the list and confirm which contacts can receive email or text follow-up.',
        'We verify the Google review link and prepare the messages for your approval.',
        'Email requests can start first when the email setup and contact permission are ready.',
        'We register a business texting number and campaign. Carrier approval usually takes 10 to 15 days and can take longer.',
        'After approval, we send a test to you before the customer text sequence starts.'
      ],
      promiseLabel: 'How we handle your customer information',
      promiseTitle: 'Your customer information stays private.',
      promiseText: 'We use it only to set up and run your review service. We do not sell it or use it for another company.'
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
      summaryText: 'Voice can start before text approval. You will hear it, try the handoff, and approve the behavior before customers reach it.',
      formTitle: 'Tell us how calls and messages should work',
      fields: [
        { name: 'business_phone', label: 'Business phone number customers call', placeholder: '(602) 555-0134', type: 'tel', required: true },
        { name: 'answering_rules', label: 'When should the assistant answer?', placeholder: 'For example: after four rings, after hours, or only when nobody on the team answers', required: true, kind: 'textarea' },
        { name: 'services_hours_area', label: 'What services, hours, and service area should it know?', placeholder: 'Give us the basics a customer usually asks about', required: true, kind: 'textarea' },
        { name: 'assistant_tasks', label: 'What should it be allowed to do?', placeholder: 'Collect job details, answer questions, route emergencies, book an estimate, or something else', required: true, kind: 'textarea' },
        { name: 'handoff_rules', label: 'When should it hand the conversation to a person?', placeholder: 'List anything it should never answer or decide on its own', kind: 'textarea' },
        { name: 'text_follow_up', label: 'Should it send any text follow-up?', placeholder: 'Tell us what you want sent. Automated text stays off until the business campaign is approved.', kind: 'textarea' },
        { name: 'calendar_website', label: 'Website or scheduling calendar', placeholder: 'Paste a link if one already exists', type: 'url' }
      ],
      attachmentTitle: 'Have scripts, FAQs, or service documents?',
      attachmentText: 'After the email opens, attach anything the assistant should learn from. Do not send passwords or private account access in the email.',
      subject: 'MissedMe voice and chat setup',
      nextSteps: [
        'We turn your answers into the first call and website chat flow.',
        'You test the assistant with normal questions and difficult situations.',
        'We make the changes you approve before the assistant handles customer calls or messages.',
        'Inbound voice can launch without text approval. Any automated text follow-up stays off until the business campaign is carrier approved.'
      ],
      promiseLabel: 'How we set up the assistant',
      promiseTitle: 'It only does what you approve.',
      promiseText: 'The assistant follows the services, scheduling rules, and handoff limits you give us. We test those rules with you before it goes live.'
    },
    website: {
      label: 'Website setup',
      headline: 'Let\'s get the website details together.',
      lead: 'Send the information people need to understand the business and take the next step.',
      overviewTitle: 'What we need from you',
      overviewText: 'You do not need finished copy. Tell us what the business does, where it works, and what you want a visitor to do next.',
      needs: [
        'Your services and service area',
        'The main action you want visitors to take',
        'Any logo, photos, reviews, or existing website content you want us to use'
      ],
      summaryTitle: 'We will turn the information into a first website draft.',
      summaryText: 'You will review the working draft before anything replaces your current website or domain.',
      formTitle: 'Tell us what the website needs to do',
      fields: [
        { name: 'current_website', label: 'Current website', placeholder: 'Paste the link, or write none', required: true },
        { name: 'google_profile', label: 'Google Business Profile link', placeholder: 'Paste the Google listing link if you have it handy', type: 'url' },
        { name: 'services_area', label: 'What services do you offer, and where do you work?', placeholder: 'List the work you want more of and the cities or areas you serve', required: true, kind: 'textarea' },
        { name: 'primary_action', label: 'What should a visitor do next?', placeholder: 'Call, request an estimate, book an appointment, visit the shop, or something else', required: true },
        { name: 'positioning', label: 'What should someone understand about your business right away?', placeholder: 'What makes customers choose you?', kind: 'textarea' },
        { name: 'example_sites', label: 'Any websites you like?', placeholder: 'Paste links if you have examples' }
      ],
      attachmentTitle: 'Have a logo, photos, reviews, or brand files?',
      attachmentText: 'After the email opens, attach the files you want us to use. Do not email website, domain, or account passwords.',
      subject: 'MissedMe website setup',
      nextSteps: [
        'We review the business details, current site, and any files you attach.',
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
      fields: [
        { name: 'website', label: 'Business website', placeholder: 'Paste the link if you have one', type: 'url' },
        { name: 'team_size', label: 'How many people work in the business?', placeholder: 'A rough number is fine' },
        { name: 'time_drain', label: 'What work takes up more time than it should?', placeholder: 'Describe what happens and who has to handle it', required: true, kind: 'textarea' },
        { name: 'workflow', label: 'Walk us through that work from start to finish', placeholder: 'What starts it, what happens next, and where does it usually slow down?', required: true, kind: 'textarea' },
        { name: 'tools', label: 'Which tools or software are involved?', placeholder: 'Email, spreadsheets, CRM, accounting, scheduling, phone, paper, or anything else', kind: 'textarea' },
        { name: 'weekly_hours', label: 'About how many hours a week does this take?', placeholder: 'A rough estimate is fine' },
        { name: 'goal', label: 'What would a useful result change for you?', placeholder: 'Tell us what you want to be easier, faster, or more reliable', required: true, kind: 'textarea' }
      ],
      attachmentTitle: 'Have examples of the current process?',
      attachmentText: 'After the email opens, attach any sample document, screenshot, or report that would help us understand the workflow. Remove private customer information if it is not needed.',
      subject: 'MissedMe AI assessment intake',
      nextSteps: [
        'We use these notes to prepare for the intake conversation.',
        'During the call, we ask how the work actually happens and listen for the full process.',
        'After the call, we review the workflow and deliver the findings and options separately.'
      ],
      promiseLabel: 'How the assessment works',
      promiseTitle: 'We do not force a tool into the process.',
      promiseText: 'The assessment starts with the way the business already works. Recommendations come after we understand the workflow, the time involved, and the result you need.'
    }
  };

  const rawService = (params.get('service') || 'reviews').trim().toLowerCase();
  const serviceKey = aliases[rawService] || 'reviews';
  const service = services[serviceKey];
  document.title = `${service.label} | MissedMe`;

  const setText = (id, text) => {
    const element = document.getElementById(id);
    if (element) element.textContent = text;
  };

  const renderList = (id, items) => {
    const list = document.getElementById(id);
    if (!list) return;
    list.replaceChildren(...items.map(item => {
      const li = document.createElement('li');
      li.textContent = item;
      return li;
    }));
  };

  const createField = field => {
    const label = document.createElement('label');
    label.append(document.createTextNode(field.label));

    if (!field.required) {
      const optional = document.createElement('span');
      optional.className = 'label-opt';
      optional.textContent = ' (optional)';
      label.append(optional);
    }

    const control = document.createElement(field.kind === 'textarea' ? 'textarea' : 'input');
    control.name = field.name;
    control.required = Boolean(field.required);
    control.placeholder = field.placeholder || '';
    control.dataset.label = field.label;

    if (control instanceof HTMLTextAreaElement) {
      control.rows = 4;
    } else {
      control.type = field.type || 'text';
    }

    label.append(control);
    return label;
  };

  const serviceFields = document.getElementById('serviceFields');
  if (serviceFields) {
    serviceFields.replaceChildren(...service.fields.map(createField));
  }

  setText('serviceLabel', service.label);
  setText('welcomeHeadline', service.headline);
  setText('welcomeLead', service.lead);
  setText('overviewTitle', service.overviewTitle);
  setText('overviewText', service.overviewText);
  setText('summaryTitle', service.summaryTitle);
  setText('summaryText', service.summaryText);
  setText('formTitle', service.formTitle);
  setText('promiseLabel', service.promiseLabel);
  setText('promiseTitle', service.promiseTitle);
  setText('promiseText', service.promiseText);
  renderList('setupNeeds', service.needs);
  renderList('nextSteps', service.nextSteps);

  const serviceField = document.getElementById('serviceField');
  if (serviceField) serviceField.value = serviceKey;

  const attachmentNotice = document.getElementById('attachmentNotice');
  if (attachmentNotice) {
    const title = attachmentNotice.querySelector('strong');
    const text = attachmentNotice.querySelector('p');
    if (title) title.textContent = service.attachmentTitle;
    if (text) text.textContent = service.attachmentText;
  }

  const business = params.get('b');
  const firstName = params.get('n');
  const businessField = document.getElementById('bizField');
  const nameField = document.getElementById('nameField');

  if (businessField && business) businessField.value = business;
  if (nameField && firstName) nameField.value = firstName;
  if (firstName && business) setText('welcomeHeadline', `Let's get ${business} set up, ${firstName}.`);
  else if (business) setText('welcomeHeadline', `Let's get ${business} set up.`);
  else if (firstName) setText('welcomeHeadline', `${firstName}, let's get this set up.`);

  const form = document.getElementById('onboardForm');
  const status = document.getElementById('formStatus');
  const fallback = document.getElementById('emailFallback');

  const buildEmail = () => {
    const data = new FormData(form);
    const labels = new Map([
      ['service', 'Service'],
      ['name', 'Name'],
      ['business', 'Business'],
      ['phone', 'Phone'],
      ['email', 'Email'],
      ['notes', 'Additional notes'],
      ...service.fields.map(field => [field.name, field.label])
    ]);

    const lines = [
      'Hi John,',
      '',
      `Here are the setup details for ${service.label.toLowerCase()}.`,
      ''
    ];

    for (const [key, value] of data.entries()) {
      const cleanValue = String(value).trim();
      if (!cleanValue) continue;
      lines.push(`${labels.get(key) || key}: ${cleanValue}`);
      lines.push('');
    }

    lines.push('I will attach any relevant files to this email before sending it.');
    return `mailto:${EMAIL}?subject=${encodeURIComponent(service.subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
  };

  if (fallback) {
    fallback.href = `mailto:${EMAIL}?subject=${encodeURIComponent(service.subject)}`;
  }

  if (form) {
    form.addEventListener('submit', event => {
      event.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const emailLink = buildEmail();
      if (fallback) fallback.href = emailLink;
      if (status) status.textContent = 'Your email app should open now. Attach any relevant files, check the details, and send the email when you are ready.';
      window.location.href = emailLink;
    });
  }
})();
