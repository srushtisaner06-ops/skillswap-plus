export function renderNotificationBell() {
  return `
    <div class="relative shrink-0" id="notification-center-root">
      <button
        id="notification-bell"
        class="relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-neutral-100 hover:text-zinc-900"
        type="button"
        aria-label="Open notifications"
        aria-expanded="false"
        aria-controls="notification-panel"
      >
        <span class="material-symbols-outlined text-[22px]">notifications</span>
        <span id="notification-badge" class="hidden absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1 bg-red-500 text-white text-[10px] font-black rounded-full items-center justify-center leading-none"></span>
      </button>
      <div id="notification-panel" class="hidden absolute right-0 top-[calc(100%+0.5rem)] z-[80] w-[min(24rem,calc(100vw-2rem))] bg-white border border-zinc-100 shadow-2xl shadow-zinc-200/70 rounded-2xl overflow-hidden" role="dialog" aria-label="Notifications"></div>
    </div>
  `;
}
