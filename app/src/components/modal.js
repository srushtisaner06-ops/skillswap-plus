/* ═══════════════════════════════════════════
   SkillSwap+ — Modal Component
   ═══════════════════════════════════════════ */

export function showModal(content, options = {}) {
  const container = document.getElementById('modal-container');
  if (!container) return;

  const { onClose, showCloseBtn = true, maxWidth = 'max-w-lg' } = options;
  const previousActiveElement = document.activeElement;

  container.innerHTML = `
    <div class="modal-backdrop" id="modal-backdrop" role="presentation">
      <div class="flex items-center justify-center min-h-screen p-4">
        <div class="modal-content bg-white rounded-3xl p-8 shadow-2xl ${maxWidth} w-full relative" id="modal-body" role="dialog" aria-modal="true" aria-label="Dialog" tabindex="-1">
          ${showCloseBtn ? `
            <button id="modal-close-btn" class="absolute top-4 right-4 p-2 hover:bg-zinc-100 rounded-full transition-colors" type="button" aria-label="Close dialog">
              <span class="material-symbols-outlined">close</span>
            </button>
          ` : ''}
          ${content}
        </div>
      </div>
    </div>
  `;

  const closeModal = () => {
    const backdrop = document.getElementById('modal-backdrop');
    if (backdrop) {
      backdrop.style.animation = 'fadeOut 200ms ease-in forwards';
      setTimeout(() => {
        container.innerHTML = '';
        previousActiveElement?.focus?.();
        if (onClose) onClose();
      }, 200);
    }
  };

  const modalBody = document.getElementById('modal-body');
  const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  const focusable = () => Array.from(modalBody?.querySelectorAll(focusableSelector) || []).filter((el) => !el.disabled && el.offsetParent !== null);
  setTimeout(() => {
    const first = focusable()[0] || modalBody;
    first?.focus?.();
  }, 0);

  // Close on backdrop click
  document.getElementById('modal-backdrop')?.addEventListener('click', (e) => {
    if (e.target.id === 'modal-backdrop' || e.target.closest('#modal-backdrop') === e.target) {
      closeModal();
    }
  });

  // Close button
  document.getElementById('modal-close-btn')?.addEventListener('click', closeModal);

  document.addEventListener('keydown', function onModalKeydown(e) {
    if (!document.getElementById('modal-backdrop')) {
      document.removeEventListener('keydown', onModalKeydown);
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      closeModal();
      document.removeEventListener('keydown', onModalKeydown);
      return;
    }

    if (e.key !== 'Tab') return;
    const items = focusable();
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  return closeModal;
}

export function closeModal() {
  const container = document.getElementById('modal-container');
  if (container) {
    const backdrop = container.querySelector('.modal-backdrop');
    if (backdrop) {
      backdrop.style.animation = 'fadeOut 200ms ease-in forwards';
      setTimeout(() => { container.innerHTML = ''; }, 200);
    }
  }
}
