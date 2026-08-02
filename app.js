(() => {
  const serviceSelect = document.getElementById('serviceSelect');
  const assessmentFocusField = document.getElementById('assessmentFocusField');
  const assessmentFocusSelect = document.getElementById('assessmentFocus');
  const serviceLinks = document.querySelectorAll('.package-link[data-package]');

  const syncAssessmentFields = () => {
    if (!serviceSelect || !assessmentFocusField || !assessmentFocusSelect) return;
    const selectedService = serviceSelect.value;
    const needsAssessmentFocus = selectedService === 'Free 15-minute assessment'
      || selectedService === 'Not sure yet';

    assessmentFocusField.hidden = !needsAssessmentFocus;
    assessmentFocusSelect.required = needsAssessmentFocus;
    assessmentFocusField.closest('.form-row')?.classList.toggle('single-field', !needsAssessmentFocus);

    if (needsAssessmentFocus && assessmentFocusSelect.value === 'Not applicable to my request') {
      assessmentFocusSelect.value = '';
    } else if (!needsAssessmentFocus) {
      assessmentFocusSelect.value = 'Not applicable to my request';
    }
  };

  serviceLinks.forEach((link) => {
    link.addEventListener('click', () => {
      if (!serviceSelect) return;
      const requestedService = link.dataset.package;
      const matchingOption = Array.from(serviceSelect.options).find(
        (option) => option.value === requestedService,
      );
      if (matchingOption) {
        serviceSelect.value = requestedService;
        syncAssessmentFields();
      }
    });
  });

  serviceSelect?.addEventListener('change', syncAssessmentFields);
  syncAssessmentFields();
})();
