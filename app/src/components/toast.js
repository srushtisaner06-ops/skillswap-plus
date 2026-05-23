/* ═══════════════════════════════════════════
   SkillSwap+ — Toast Notification Component
   ═══════════════════════════════════════════ */

const icons = {
  success: 'check_circle',
  error: 'error',
  info: 'info',
  warning: 'warning'
};

const colors = {
  success: 'bg-emerald-500',
  error: 'bg-red-500',
  info: 'bg-violet-600',
  warning: 'bg-amber-500'
};

export function showToast(message, type = 'success', duration = 3000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast-enter flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border border-white/20 ${colors[type]} text-white min-w-[300px] max-w-[420px]`;
  toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
  toast.innerHTML = `
    <span class="material-symbols-outlined material-fill text-lg">${icons[type]}</span>
    <p class="text-sm font-semibold flex-1">${message}</p>
    <button class="opacity-60 hover:opacity-100 transition-opacity" aria-label="Dismiss notification" onclick="this.closest('.toast-enter, .toast-exit').remove()">
      <span class="material-symbols-outlined text-sm">close</span>
    </button>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.remove('toast-enter');
    toast.classList.add('toast-exit');
    setTimeout(() => toast.remove(), 200);
  }, duration);
}
