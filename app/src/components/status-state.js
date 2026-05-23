export function renderInlineLoader(message = 'Loading...') {
  return `
    <div class="flex items-center justify-center gap-3 rounded-2xl border border-zinc-100 bg-white p-6 text-sm text-zinc-500" role="status" aria-live="polite">
      <span class="h-4 w-4 rounded-full border-2 border-zinc-200 border-t-primary animate-spin"></span>
      <span>${message}</span>
    </div>
  `;
}

export function renderEmptyState({ icon = 'inbox', title, message, actionHref = '', actionLabel = '' }) {
  return `
    <div class="text-center py-14 bg-white rounded-2xl border border-zinc-100 shadow-sm flex flex-col items-center justify-center">
      <div class="w-14 h-14 bg-zinc-50 rounded-full flex items-center justify-center mb-4">
        <span class="material-symbols-outlined text-3xl text-zinc-300">${icon}</span>
      </div>
      <h3 class="text-lg font-black text-zinc-900">${title}</h3>
      <p class="text-sm text-zinc-500 mt-2 max-w-md">${message}</p>
      ${actionHref && actionLabel ? `<a href="${actionHref}" class="mt-6 bg-primary text-white px-5 py-2.5 rounded-full font-black text-xs shadow-lg shadow-primary/20 btn-press">${actionLabel}</a>` : ''}
    </div>
  `;
}

export function renderErrorState({ title = 'Something went wrong', message = 'Please try again.', retryId = '' }) {
  return `
    <div class="text-center py-12 bg-white rounded-2xl border border-red-100 shadow-sm">
      <span class="material-symbols-outlined text-red-400 text-4xl mb-3">wifi_off</span>
      <h3 class="text-lg font-black text-zinc-900">${title}</h3>
      <p class="text-sm text-zinc-500 mt-2">${message}</p>
      ${retryId ? `<button id="${retryId}" class="mt-5 px-5 py-2.5 rounded-full bg-zinc-900 text-white text-xs font-black btn-press" type="button">Retry</button>` : ''}
    </div>
  `;
}
