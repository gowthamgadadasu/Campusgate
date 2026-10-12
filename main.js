/**
 * CampusGate - Academic Event Permission Portal
 * Frontend Interactions, Password Toggle & UI Helpers
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavbarScroll();
  initMobileMenu();
  initPasswordToggles();
  initAuthForms();
  initForgotPasswordModal();
});

/* --------------------------------------------------------------------------
   1. Navbar Scroll Effect
   -------------------------------------------------------------------------- */
function initNavbarScroll() {
  const header = document.querySelector('.cg-header');
  if (!header) return;

  const handleScroll = () => {
    if (window.scrollY > 20) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
}

/* --------------------------------------------------------------------------
   2. Mobile Navigation Toggle
   -------------------------------------------------------------------------- */
function initMobileMenu() {
  const toggleBtn = document.querySelector('.cg-mobile-toggle');
  const navMenu = document.querySelector('.cg-nav-menu');
  if (!toggleBtn || !navMenu) return;

  toggleBtn.addEventListener('click', () => {
    const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
    toggleBtn.setAttribute('aria-expanded', !isExpanded);
    navMenu.classList.toggle('mobile-open');
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!toggleBtn.contains(e.target) && !navMenu.contains(e.target)) {
      navMenu.classList.remove('mobile-open');
      toggleBtn.setAttribute('aria-expanded', 'false');
    }
  });
}

/* --------------------------------------------------------------------------
   3. Password Visibility Toggle (Show / Hide)
   -------------------------------------------------------------------------- */
function initPasswordToggles() {
  const toggleButtons = document.querySelectorAll('.cg-password-toggle');

  toggleButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const inputId = btn.getAttribute('data-target');
      const input = document.getElementById(inputId);
      if (!input) return;

      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';

      // Update Aria Label
      btn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');

      // Update Eye Icon
      if (isPassword) {
        // Eye Slash (Hidden state)
        btn.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
          </svg>
        `;
      } else {
        // Eye (Visible state)
        btn.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        `;
      }
    });
  });
}

/* --------------------------------------------------------------------------
   4. Form Validation & Frontend-Only Demo Submission
   -------------------------------------------------------------------------- */
function initAuthForms() {
  const forms = document.querySelectorAll('.cg-auth-form');

  forms.forEach((form) => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const emailInput = form.querySelector('input[type="email"], input[name="email"], input[name="username"]');
      const passwordInput = form.querySelector('input[type="password"], input[type="text"][name="password"]');
      const roleName = form.getAttribute('data-role') || 'User';

      if (!emailInput || !passwordInput) return;

      const emailVal = emailInput.value.trim();
      const passVal = passwordInput.value.trim();

      // Basic frontend validation
      if (!emailVal) {
        showToast('Validation Error', 'Please enter your Official College Email.', 'error');
        emailInput.focus();
        return;
      }

      if (!passVal) {
        showToast('Validation Error', 'Please enter your password.', 'error');
        passwordInput.focus();
        return;
      }

      if (!isValidEmail(emailVal)) {
        showToast('Invalid Email Format', 'Please provide a valid institutional email address (e.g. name@college.edu).', 'error');
        emailInput.focus();
        return;
      }

      // Success Demo feedback
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
          <svg class="cg-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="2" x2="12" y2="6"></line>
            <line x1="12" y1="18" x2="12" y2="22"></line>
            <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
            <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
            <line x1="2" y1="12" x2="6" y2="12"></line>
            <line x1="18" y1="12" x2="22" y2="12"></line>
            <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
            <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
          </svg>
          Authenticating...
        `;

        setTimeout(() => {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalText;
          showToast(
            'Sign In Successful',
            `Authenticated as ${roleName} (${emailVal}). Redirecting to portal...`,
            'success'
          );

          // Redirect to appropriate dashboard
          setTimeout(() => {
            if (roleName === 'Student') {
              window.location.href = 'student-dashboard.html';
            } else if (roleName === 'Proctor') {
              window.location.href = 'proctor-dashboard.html';
            } else if (roleName.includes('In-Charge')) {
              window.location.href = 'incharge-dashboard.html';
            }
          }, 700);
        }, 600);
      }
    });
  });
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* --------------------------------------------------------------------------
   5. Toast Notification System
   -------------------------------------------------------------------------- */
function showToast(title, message, type = 'info') {
  let container = document.querySelector('.cg-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'cg-toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `cg-toast ${type}`;

  const iconSvg = type === 'success' 
    ? `<svg class="cg-toast-icon" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`
    : type === 'error'
    ? `<svg class="cg-toast-icon" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`
    : `<svg class="cg-toast-icon" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;

  toast.innerHTML = `
    ${iconSvg}
    <div class="cg-toast-content">
      <div class="cg-toast-title">${escapeHtml(title)}</div>
      <div class="cg-toast-message">${escapeHtml(message)}</div>
    </div>
    <button class="cg-toast-close" aria-label="Close message">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
    </button>
  `;

  container.appendChild(toast);

  const closeBtn = toast.querySelector('.cg-toast-close');
  closeBtn.addEventListener('click', () => {
    toast.remove();
  });

  setTimeout(() => {
    if (toast.parentNode) {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }
  }, 4500);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/* --------------------------------------------------------------------------
   6. Forgot Password Demo Modal
   -------------------------------------------------------------------------- */
function initForgotPasswordModal() {
  const modal = document.getElementById('cg-forgot-modal');
  const triggerLinks = document.querySelectorAll('.cg-forgot-pwd-link');
  if (!modal || triggerLinks.length === 0) return;

  const closeBtn = modal.querySelector('.cg-modal-close');
  const resetForm = document.getElementById('cg-reset-form');

  triggerLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      modal.classList.add('active');
    });
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.classList.remove('active');
    });
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('active');
    }
  });

  if (resetForm) {
    resetForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const emailInput = document.getElementById('reset-email');
      const email = emailInput ? emailInput.value.trim() : '';
      if (!email || !isValidEmail(email)) {
        showToast('Invalid Email', 'Please enter a valid official college email.', 'error');
        return;
      }
      modal.classList.remove('active');
      showToast(
        'Password Reset Sent',
        `A secure recovery verification link has been dispatched to ${email}.`,
        'success'
      );
      if (emailInput) emailInput.value = '';
    });
  }
}
