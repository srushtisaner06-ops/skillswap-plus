/* ═══════════════════════════════════════════
   SkillSwap+ — Main Application Entry
   With API-first initialization
   ═══════════════════════════════════════════ */

import { router } from './router.js';
import { store } from './state.js';
import { isAuthenticated } from './services/auth.service.js';
import { fetchProfile, performLogout } from './services/data.layer.js';
import { renderSidebar, initSidebar } from './components/sidebar.js';
import { initChatbot } from './components/chatbot.js';
import { renderNotificationBell } from './components/notification-center.js';
import { renderLanding } from './pages/landing.js';
import { renderDashboard } from './pages/dashboard.js';
import { renderMarketplace } from './pages/marketplace.js';
import { renderSession } from './pages/session.js';
import { renderCommunity } from './pages/community.js';
import { renderAssignments } from './pages/assignments.js';
import { renderProfile } from './pages/profile.js';
import { renderSettings } from './pages/settings.js';
import { renderMentorApply } from './pages/mentor-apply.js';
import { renderCreateSession } from './pages/create-session.js';
import { renderReferral } from './pages/referral.js';
import { showToast } from './components/toast.js';

// Pages that use the sidebar layout
const sidebarPages = ['/dashboard', '/marketplace', '/session', '/community', '/assignments', '/profile', '/settings', '/mentor-apply', '/create-session', '/referral'];

/**
 * Fetch the user profile from API and populate state.
 * Called on app init if a token exists.
 */
async function initUserFromAPI() {
  if (!isAuthenticated()) return false;

  // Data layer handles demo vs live mode internally
  const res = await fetchProfile();
  return !res.error;
}

// Router setup
router.onBeforeNavigate = (hash) => {
  const needsSidebar = sidebarPages.includes(hash);
  const sidebarEl = document.getElementById('app-sidebar') || document.getElementById('sidebar');
  const mainEl = document.getElementById('page-content');
  const headerEl = document.getElementById('persistent-header');
  
  if (sidebarEl) {
    if (needsSidebar) {
      sidebarEl.classList.remove('-translate-x-full');
      sidebarEl.classList.add('translate-x-0');

      // Update sidebar credits + tier from latest state
      const user = store.getUserSafe();
      const credits = store.get('credits') || 0;
      const tierEl = document.getElementById('sidebar-tier');
      if (tierEl) tierEl.textContent = `${user?.tier || 'Starter'} Tier`;
      const creditsEl = document.getElementById('sidebar-credits');
      if (creditsEl) creditsEl.textContent = `${credits} Credits`;

      // Update sidebar active state
      document.querySelectorAll('.sidebar-link').forEach(link => {
        const href = link.getAttribute('href') || link.getAttribute('data-nav');
        if (href === '#' + hash) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      });
      if(mainEl) {
        mainEl.classList.add('lg:ml-72');
      }

      // Show and update persistent header
      if (headerEl) {
        headerEl.classList.remove('hidden');
        headerEl.classList.add('lg:ml-72');
        updateHeaderContent();
      }
    } else {
      sidebarEl.classList.remove('translate-x-0');
      sidebarEl.classList.add('-translate-x-full');
      if(mainEl) {
        mainEl.classList.remove('lg:ml-72');
      }
      // Hide header on non-sidebar pages (landing)
      if (headerEl) {
        headerEl.classList.add('hidden');
        headerEl.classList.remove('lg:ml-72');
      }
    }
  }
};

// Register routes
router
  .register('/', (c) => {
    renderLanding(c);
  })
  .register('/dashboard', (c) => {
    return renderDashboard(c);
  })
  .register('/marketplace', (c) => {
    return renderMarketplace(c);
  })
  .register('/session', (c) => {
    return renderSession(c);
  })
  .register('/community', (c) => {
    renderCommunity(c);
  })
  .register('/assignments', (c) => {
    renderAssignments(c);
  })
  .register('/profile', (c) => {
    renderProfile(c);
  })
  .register('/settings', (c) => {
    renderSettings(c);
  })
  .register('/mentor-apply', (c) => {
    renderMentorApply(c);
  })
  .register('/create-session', (c) => {
    renderCreateSession(c);
  })
  .register('/referral', (c) => {
    renderReferral(c);
  });

/**
 * Update persistent header content with latest user data.
 * Called once on route change — no DOM churn.
 */
function updateHeaderContent() {
  const headerEl = document.getElementById('persistent-header');
  if (!headerEl) return;

  const user = store.getUserSafe();
  const credits = store.get('credits') || 0;
  const avatar = user?.avatar || 'https://ui-avatars.com/api/?name=U&background=6927ef&color=fff';

  headerEl.innerHTML = `
    <button id="mobile-menu-btn" class="lg:hidden inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white border border-zinc-100 text-zinc-700 shadow-sm" type="button" aria-label="Open navigation" aria-controls="app-sidebar" aria-expanded="false">
      <span class="material-symbols-outlined text-xl">menu</span>
    </button>
    <div class="relative w-full max-w-md" id="global-search-root">
      <span class="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-zinc-400 text-lg pointer-events-none">search</span>
      <input
        id="global-search-input"
        class="bg-surface-container-low border-none rounded-full pl-10 pr-10 py-2 w-full text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
        placeholder="Search skills, mentors..."
        type="search"
        autocomplete="off"
        aria-label="Search sessions, mentors, and skills"
        aria-expanded="false"
        aria-controls="global-search-dropdown"
        aria-autocomplete="list"
      />
      <button id="global-search-clear" class="hidden absolute right-2 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-700 rounded-full" type="button" aria-label="Clear search">
        <span class="material-symbols-outlined text-base">close</span>
      </button>
      <div id="global-search-dropdown" class="hidden absolute left-0 right-0 top-[calc(100%+0.5rem)] z-[80] bg-white border border-zinc-100 shadow-2xl shadow-zinc-200/70 rounded-2xl overflow-hidden max-h-[70vh]" role="listbox" aria-label="Search results"></div>
    </div>
    <div class="flex shrink-0 items-center gap-3 sm:gap-4">
      <div class="flex items-center gap-2 bg-violet-50 px-4 py-2 rounded-full border border-violet-100 tooltip relative">
        <span class="material-symbols-outlined material-fill text-violet-600 text-sm">generating_tokens</span>
        <span class="text-violet-700 font-bold text-sm" id="header-credits">${credits} Credits</span>
      </div>
      ${renderNotificationBell()}
      <div class="h-9 w-9 shrink-0 rounded-full overflow-hidden border border-zinc-200">
        <img alt="User avatar" class="w-full h-full object-cover" src="${avatar}" />
      </div>
    </div>
  `;

  // Listen for credit updates
  store.on('credits', (c) => {
    const el = document.getElementById('header-credits');
    if (el) el.textContent = `${c} Credits`;
  });

  initGlobalSearch();
  initNotificationCenter();
  initMobileNavigation();
}

function initMobileNavigation() {
  const sidebar = document.getElementById('app-sidebar');
  const button = document.getElementById('mobile-menu-btn');
  if (!sidebar || !button || button.dataset.ready === 'true') return;
  button.dataset.ready = 'true';

  let backdrop = document.getElementById('mobile-sidebar-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.id = 'mobile-sidebar-backdrop';
    backdrop.className = 'mobile-sidebar-backdrop lg:hidden';
    document.body.appendChild(backdrop);
  }

  const close = () => {
    sidebar.classList.remove('translate-x-0');
    sidebar.classList.add('-translate-x-full');
    backdrop.classList.remove('open');
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-label', 'Open navigation');
  };

  const open = () => {
    sidebar.classList.remove('-translate-x-full');
    sidebar.classList.add('translate-x-0');
    backdrop.classList.add('open');
    button.setAttribute('aria-expanded', 'true');
    button.setAttribute('aria-label', 'Close navigation');
  };

  button.addEventListener('click', () => {
    const isOpen = button.getAttribute('aria-expanded') === 'true';
    if (isOpen) close();
    else open();
  });

  backdrop.addEventListener('click', close);
  sidebar.querySelectorAll('a[href^="#/"]').forEach((link) => {
    link.addEventListener('click', () => {
      if (window.matchMedia('(max-width: 1023px)').matches) close();
    });
  });
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatNotificationTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString('en', { month: 'short', day: 'numeric' });
}

function initGlobalSearch() {
  const root = document.getElementById('global-search-root');
  const input = document.getElementById('global-search-input');
  const dropdown = document.getElementById('global-search-dropdown');
  const clearBtn = document.getElementById('global-search-clear');
  if (!root || !input || !dropdown || root.dataset.ready === 'true') return;
  root.dataset.ready = 'true';

  const state = {
    timer: null,
    controller: null,
    activeIndex: -1,
    items: [],
    lastQuery: ''
  };

  const close = () => {
    dropdown.classList.add('hidden');
    input.setAttribute('aria-expanded', 'false');
    state.activeIndex = -1;
  };

  const open = () => {
    dropdown.classList.remove('hidden');
    input.setAttribute('aria-expanded', 'true');
  };

  const setActive = (index) => {
    state.activeIndex = index;
    dropdown.querySelectorAll('[role="option"]').forEach((el, i) => {
      const active = i === index;
      el.classList.toggle('bg-violet-50', active);
      el.setAttribute('aria-selected', active ? 'true' : 'false');
      if (active) el.scrollIntoView({ block: 'nearest' });
    });
  };

  const renderState = (content) => {
    dropdown.innerHTML = content;
    open();
  };

  const sectionMarkup = (title, items) => {
    if (!items.length) return '';
    return `
      <div class="py-2">
        <p class="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-400">${title}</p>
        ${items.map((item) => `
          <button class="search-result w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-violet-50 focus:bg-violet-50 focus:outline-none transition-colors" role="option" type="button" data-href="${escapeHtml(item.href || '#/marketplace')}" data-title="${escapeHtml(item.title || item.name)}" aria-selected="false">
            <span class="material-symbols-outlined text-primary text-xl mt-0.5">${item.type === 'session' ? 'event' : item.type === 'mentor' ? 'person' : 'sell'}</span>
            <span class="min-w-0">
              <span class="block text-sm font-black text-zinc-900 truncate">${escapeHtml(item.title || item.name)}</span>
              <span class="block text-xs text-zinc-500 truncate">${escapeHtml(describeSearchResult(item))}</span>
            </span>
          </button>
        `).join('')}
      </div>
    `;
  };

  const renderResults = (results) => {
    const sessions = results.sessions || [];
    const mentors = results.mentors || [];
    const skills = results.skills || [];
    state.items = [...sessions, ...mentors, ...skills];

    if (state.items.length === 0) {
      renderState(`
        <div class="px-5 py-8 text-center">
          <span class="material-symbols-outlined text-3xl text-zinc-300 mb-2">search_off</span>
          <p class="text-sm font-black text-zinc-800">No real matches found</p>
          <p class="text-xs text-zinc-500 mt-1">Try a skill, session title, or mentor name.</p>
        </div>
      `);
      return;
    }

    renderState(`
      <div class="max-h-[70vh] overflow-y-auto py-1">
        ${sectionMarkup('Sessions', sessions)}
        ${sectionMarkup('Mentors', mentors)}
        ${sectionMarkup('Skills', skills)}
      </div>
    `);

    dropdown.querySelectorAll('.search-result').forEach((btn, index) => {
      btn.addEventListener('mouseenter', () => setActive(index));
      btn.addEventListener('click', () => navigateSearchResult(btn));
    });
  };

  const runSearch = async () => {
    const query = input.value.trim();
    clearBtn.classList.toggle('hidden', query.length === 0);

    if (query.length < 2) {
      state.items = [];
      close();
      return;
    }

    if (state.controller) state.controller.abort();
    state.controller = new AbortController();
    state.lastQuery = query;

    renderState(`
      <div class="px-5 py-5 flex items-center gap-3 text-sm text-zinc-500">
        <span class="h-4 w-4 border-2 border-zinc-200 border-t-primary rounded-full animate-spin"></span>
        Searching real sessions, mentors, and skills...
      </div>
    `);

    try {
      const { globalSearch } = await import('./services/search.service.js');
      const results = await globalSearch(query, { signal: state.controller.signal });
      if (input.value.trim() === state.lastQuery) renderResults(results);
    } catch (error) {
      if (error.name === 'AbortError') return;
      renderState(`
        <div class="px-5 py-6 text-center">
          <span class="material-symbols-outlined text-3xl text-red-400 mb-2">wifi_off</span>
          <p class="text-sm font-black text-zinc-800">Search is unavailable</p>
          <p class="text-xs text-zinc-500 mt-1">${escapeHtml(error.message || 'Please try again.')}</p>
        </div>
      `);
    }
  };

  input.addEventListener('input', () => {
    window.clearTimeout(state.timer);
    state.timer = window.setTimeout(runSearch, 250);
  });

  input.addEventListener('focus', () => {
    if (input.value.trim().length >= 2 && dropdown.innerHTML) open();
  });

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      close();
      input.blur();
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (state.items.length) setActive((state.activeIndex + 1) % state.items.length);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (state.items.length) setActive((state.activeIndex - 1 + state.items.length) % state.items.length);
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      const selected = dropdown.querySelectorAll('.search-result')[state.activeIndex];
      if (selected) {
        navigateSearchResult(selected);
      } else if (input.value.trim().length > 0) {
        window.location.hash = '/marketplace';
        close();
      }
    }
  });

  clearBtn.addEventListener('click', () => {
    input.value = '';
    input.focus();
    close();
    clearBtn.classList.add('hidden');
  });

  document.addEventListener('pointerdown', (event) => {
    if (!root.contains(event.target)) close();
  });
}

function describeSearchResult(item) {
  const metadata = item.metadata || {};
  if (item.type === 'session') {
    return `${metadata.hostName || 'Mentor'} · ${metadata.category || 'Skill'} · ${metadata.creditsRequired || 0} credits`;
  }
  if (item.type === 'mentor') {
    const skills = (metadata.skills || []).join(', ');
    return skills || `${metadata.role || 'User'} · ${metadata.rating || 0} rating`;
  }
  return metadata.source === 'category' ? 'Skill category' : 'Skill used by real sessions or mentors';
}

function navigateSearchResult(button) {
  const href = button.dataset.href || '#/marketplace';
  window.location.hash = href.startsWith('#') ? href.slice(1) : href;
  document.getElementById('global-search-dropdown')?.classList.add('hidden');
  document.getElementById('global-search-input')?.setAttribute('aria-expanded', 'false');
}

function initNotificationCenter() {
  const root = document.getElementById('notification-center-root');
  const bell = document.getElementById('notification-bell');
  const panel = document.getElementById('notification-panel');
  const badge = document.getElementById('notification-badge');
  if (!root || !bell || !panel || !badge || root.dataset.ready === 'true') return;
  root.dataset.ready = 'true';

  let notifications = [];
  let unreadCount = 0;
  let isOpen = false;

  const updateBadge = () => {
    if (unreadCount > 0) {
      badge.textContent = unreadCount > 9 ? '9+' : String(unreadCount);
      badge.classList.remove('hidden');
      badge.classList.add('flex');
      bell.setAttribute('aria-label', `Open notifications, ${unreadCount} unread`);
    } else {
      badge.classList.add('hidden');
      badge.classList.remove('flex');
      bell.setAttribute('aria-label', 'Open notifications');
    }
  };

  const close = () => {
    panel.classList.add('hidden');
    bell.setAttribute('aria-expanded', 'false');
    isOpen = false;
  };

  const open = async () => {
    panel.classList.remove('hidden');
    bell.setAttribute('aria-expanded', 'true');
    isOpen = true;
    renderNotifications('loading');
    await loadNotifications();
    const first = panel.querySelector('button, a');
    if (first) first.focus();
  };

  const renderNotifications = (state = 'ready') => {
    if (state === 'loading') {
      panel.innerHTML = `
        <div class="p-4 border-b border-zinc-100 flex items-center justify-between">
          <p class="font-black text-zinc-900">Notifications</p>
        </div>
        <div class="px-5 py-6 flex items-center gap-3 text-sm text-zinc-500">
          <span class="h-4 w-4 border-2 border-zinc-200 border-t-primary rounded-full animate-spin"></span>
          Loading notifications...
        </div>
      `;
      return;
    }

    if (state === 'error') {
      panel.innerHTML = `
        <div class="p-4 border-b border-zinc-100 flex items-center justify-between">
          <p class="font-black text-zinc-900">Notifications</p>
          <button id="notification-close" class="p-1 rounded-full hover:bg-zinc-100" type="button" aria-label="Close notifications"><span class="material-symbols-outlined text-lg">close</span></button>
        </div>
        <div class="px-5 py-8 text-center">
          <span class="material-symbols-outlined text-3xl text-red-400 mb-2">wifi_off</span>
          <p class="text-sm font-black text-zinc-800">Unable to load notifications</p>
          <button id="notification-retry" class="mt-4 px-4 py-2 rounded-full bg-zinc-900 text-white text-xs font-black" type="button">Retry</button>
        </div>
      `;
      panel.querySelector('#notification-close')?.addEventListener('click', close);
      panel.querySelector('#notification-retry')?.addEventListener('click', open);
      return;
    }

    panel.innerHTML = `
      <div class="p-4 border-b border-zinc-100 flex items-center justify-between gap-3">
        <div>
          <p class="font-black text-zinc-900">Notifications</p>
          <p class="text-xs text-zinc-500" aria-live="polite">${unreadCount} unread</p>
        </div>
        <div class="flex items-center gap-1">
          <button id="notification-read-all" class="px-3 py-1.5 rounded-full text-xs font-black text-primary hover:bg-violet-50 disabled:text-zinc-300" type="button" ${unreadCount ? '' : 'disabled'}>Mark all read</button>
          <button id="notification-close" class="p-1.5 rounded-full hover:bg-zinc-100" type="button" aria-label="Close notifications"><span class="material-symbols-outlined text-lg">close</span></button>
        </div>
      </div>
      ${notifications.length === 0 ? `
        <div class="px-5 py-10 text-center">
          <span class="material-symbols-outlined text-4xl text-zinc-300 mb-2">notifications_off</span>
          <p class="text-sm font-black text-zinc-800">No notifications yet</p>
          <p class="text-xs text-zinc-500 mt-1">Booking, review, referral, and assignment updates will appear here.</p>
        </div>
      ` : `
        <div class="max-h-[24rem] overflow-y-auto" role="list">
          ${notifications.map((notification) => `
            <button class="notification-item w-full text-left px-4 py-3 flex gap-3 hover:bg-violet-50 focus:bg-violet-50 focus:outline-none transition-colors border-b border-zinc-50 last:border-b-0" type="button" role="listitem" data-id="${escapeHtml(notification._id)}" data-link="${escapeHtml(notification.link || notification.metadata?.href || notificationRoute(notification.type))}">
              <span class="material-symbols-outlined mt-0.5 ${notification.read ? 'text-zinc-300' : 'text-primary'}">${escapeHtml(notification.icon || 'info')}</span>
              <span class="min-w-0 flex-1">
                <span class="flex items-start justify-between gap-3">
                  <span class="block text-sm ${notification.read ? 'font-semibold text-zinc-600' : 'font-black text-zinc-900'} leading-snug">${escapeHtml(notification.message)}</span>
                  ${notification.read ? '' : '<span class="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" aria-label="Unread"></span>'}
                </span>
                <span class="block text-[11px] text-zinc-400 mt-1">${escapeHtml(formatNotificationTime(notification.createdAt))} · ${escapeHtml(notification.type || 'system')}</span>
              </span>
            </button>
          `).join('')}
        </div>
      `}
    `;

    panel.querySelector('#notification-close')?.addEventListener('click', close);
    panel.querySelector('#notification-read-all')?.addEventListener('click', markAllNotificationsRead);
    panel.querySelectorAll('.notification-item').forEach((item) => {
      item.addEventListener('click', () => handleNotificationClick(item));
    });
  };

  const loadNotifications = async () => {
    try {
      const { getNotifications } = await import('./services/notification.service.js');
      const result = await getNotifications({ limit: 8 });
      notifications = result.notifications || [];
      unreadCount = result.unreadCount || 0;
      store.setNotificationsFromAPI(notifications);
      updateBadge();
      renderNotifications();
    } catch (error) {
      renderNotifications('error');
    }
  };

  const refreshUnreadCount = async () => {
    try {
      const { getUnreadCount } = await import('./services/notification.service.js');
      unreadCount = await getUnreadCount();
      updateBadge();
    } catch (error) {
      updateBadge();
    }
  };

  const markAllNotificationsRead = async () => {
    const { markAllAsRead } = await import('./services/notification.service.js');
    await markAllAsRead();
    notifications = notifications.map((notification) => ({ ...notification, read: true }));
    unreadCount = 0;
    updateBadge();
    renderNotifications();
  };

  const handleNotificationClick = async (item) => {
    const id = item.dataset.id;
    const link = item.dataset.link || '#/dashboard';
    const notification = notifications.find((entry) => String(entry._id) === String(id));

    if (notification && !notification.read) {
      const { markAsRead } = await import('./services/notification.service.js');
      await markAsRead(id);
      notification.read = true;
      unreadCount = Math.max(unreadCount - 1, 0);
      updateBadge();
    }

    close();
    window.location.hash = link.startsWith('#') ? link.slice(1) : link;
  };

  bell.addEventListener('click', () => {
    if (isOpen) close();
    else open();
  });

  panel.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      close();
      bell.focus();
      return;
    }
    if (event.key !== 'Tab') return;

    const focusables = Array.from(panel.querySelectorAll('button, a, [tabindex]:not([tabindex="-1"])')).filter((el) => !el.disabled);
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  document.addEventListener('pointerdown', (event) => {
    if (!root.contains(event.target)) close();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isOpen) close();
  });

  refreshUnreadCount();
}

function notificationRoute(type) {
  if (String(type).includes('booking') || type === 'session') return '#/session';
  if (String(type).includes('review')) return '#/profile';
  if (String(type).includes('referral')) return '#/referral';
  if (String(type).includes('assignment')) return '#/assignments';
  return '#/dashboard';
}

// ─── Bootstrap ──────────────────────────────
(async function bootstrap() {
  // If user has a token, init user data from API
  if (isAuthenticated()) {
    const success = await initUserFromAPI();
    if (!success) {
      // Token invalid or API error — clear and stay on landing
      localStorage.removeItem('token');
    }
  }
  // Render sidebar once
  const sidebarEl = document.getElementById('sidebar');
  if (sidebarEl) {
    sidebarEl.outerHTML = renderSidebar();
    initSidebar();
  }

  // Initialize router (renders the current hash)
  const pageContainer = document.getElementById('page-content');
  if(pageContainer) {
    router.init(pageContainer);
  } else {
    router.init(document.getElementById('app'));
  }

  // Initialize AI chatbot on authenticated pages
  if (isAuthenticated()) {
    initChatbot();
  }
})();
