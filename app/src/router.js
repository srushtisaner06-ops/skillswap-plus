/* ═══════════════════════════════════════════
   SkillSwap+ — Client-Side Router
   With auth protection for dashboard pages
   ═══════════════════════════════════════════ */

import { isAuthenticated } from './services/auth.service.js';

// Routes that require authentication
const protectedRoutes = [
  '/dashboard', '/marketplace', '/session',
  '/community', '/assignments', '/profile',
  '/settings', '/mentor-apply', '/create-session', '/referral'
];

class Router {
  constructor() {
    this.routes = {};
    this.currentRoute = null;
    this.currentCleanup = null;
    this.container = null;
    this.onBeforeNavigate = null;
    window.addEventListener('hashchange', () => this._resolve());
  }

  init(container) {
    this.container = container;
    this._resolve();
  }

  register(path, handler) {
    this.routes[path] = handler;
    return this;
  }

  navigate(path) {
    window.location.hash = path;
  }

  getCurrentRoute() {
    return this.currentRoute;
  }

  async _resolve() {
    const hash = window.location.hash.slice(1) || '/';
    const route = this.routes[hash];

    if (!route) {
      if (this.routes['/']) {
        window.location.hash = '/';
      }
      return;
    }

    // ─── Auth Guard ─────────────────────────
    if (protectedRoutes.includes(hash) && !isAuthenticated()) {
      window.location.hash = '/';
      return;
    }

    if (hash === this.currentRoute) return;

    // Run cleanup from previous page
    if (this.currentCleanup && typeof this.currentCleanup === 'function') {
      try {
        this.currentCleanup();
      } catch (e) {
        console.error('[Router] Cleanup failed:', e);
      }
    }

    // Always resolve the page content container, never touch the permanent layout structure
    const pageContainer = document.getElementById('page-content');
    
    // Animate out current content
    if (pageContainer && pageContainer.children.length > 0) {
      pageContainer.classList.add('page-exit');
      await new Promise(r => setTimeout(r, 150));
      pageContainer.classList.remove('page-exit');
    }

    // FORCE clear ONLY page content, preserving sidebar and layout
    if (pageContainer) {
      pageContainer.innerHTML = '';
    }

    this.currentRoute = hash;

    // Callback before nav (for layout changes)
    if (this.onBeforeNavigate) {
      try {
        this.onBeforeNavigate(hash);
      } catch (e) {
        console.error('[Router] onBeforeNavigate failed:', e);
      }
    }

    // ─── SAFE RENDER ENTRY ───────────────────
    try {
      if (pageContainer) {
        const result = await route(pageContainer);
        
        // Store cleanup function if returned
        if (result && typeof result === 'function') {
          this.currentCleanup = result;
        } else {
          this.currentCleanup = null;
        }
      }
    } catch (error) {
      console.error('[Router] Fatal Component Render Crash:', error);
      if (pageContainer) {
        pageContainer.innerHTML = `
          <div class="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center">
            <span class="material-symbols-outlined text-red-500 text-6xl mb-4">error</span>
            <h2 class="text-2xl font-black text-zinc-900 mb-2">Well, this is awkward.</h2>
            <p class="text-zinc-500 mb-6">The ${hash} page crashed while trying to load.</p>
            <button onclick="window.history.back()" class="px-6 py-3 bg-zinc-900 text-white rounded-full font-bold text-sm">Go Back</button>
          </div>
        `;
      }
    }

    // Animate in new content
    if (pageContainer) {
      pageContainer.classList.add('page-enter');
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          pageContainer.classList.remove('page-enter');
          pageContainer.focus({ preventScroll: true });
        });
      });
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
}

export const router = new Router();
