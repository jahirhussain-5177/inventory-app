const Validator = {
  clearErrors() {
    document.querySelectorAll('.field-error').forEach(el => el.textContent = '');
    document.querySelectorAll('.form-group.error').forEach(el => el.classList.remove('error'));
  }
};
