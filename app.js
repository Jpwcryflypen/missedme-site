(() => {
  const serviceSelect = document.getElementById('serviceSelect');
  const recurringWorkField = document.getElementById('recurringWorkField');
  const recurringWorkSelect = document.getElementById('weeklyRecurringWork');
  const packageLinks = document.querySelectorAll('.package-link[data-package]');

  const syncAssessmentFields = () => {
    if (!serviceSelect || !recurringWorkField || !recurringWorkSelect) return;
    const selectedService = serviceSelect.value;
    const isAssessment = !selectedService
      || selectedService.startsWith('$')
      || selectedService === 'Not sure yet';

    recurringWorkField.hidden = !isAssessment;
    recurringWorkSelect.required = isAssessment;
    recurringWorkField.closest('.form-row')?.classList.toggle('single-field', !isAssessment);

    if (isAssessment && recurringWorkSelect.value === 'Not applicable to my request') {
      recurringWorkSelect.value = '';
    } else if (!isAssessment) {
      recurringWorkSelect.value = 'Not applicable to my request';
    }
  };

  packageLinks.forEach((link) => {
    link.addEventListener('click', () => {
      if (!serviceSelect) return;
      const requestedPackage = link.dataset.package;
      const matchingOption = Array.from(serviceSelect.options).find(
        (option) => option.value === requestedPackage,
      );
      if (matchingOption) {
        serviceSelect.value = requestedPackage;
        syncAssessmentFields();
      }
    });
  });

  serviceSelect?.addEventListener('change', syncAssessmentFields);
  syncAssessmentFields();
})();
