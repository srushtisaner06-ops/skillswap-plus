/* ═══════════════════════════════════════════
   SkillSwap+ — Sidebar Navigation Component
   Connected to API auth
   ═══════════════════════════════════════════ */

import { store } from '../state.js';
import { logout } from '../services/auth.service.js';

const navItems = [
  { icon: 'dashboard', label: 'Overview', path: '#/dashboard' },
  { icon: 'explore', label: 'Marketplace', path: '#/marketplace' },
  { icon: 'add_circle', label: 'Create Session', path: '#/create-session' },
  { icon: 'videocam', label: 'Sessions', path: '#/session' },
  { icon: 'forum', label: 'Community', path: '#/community' },
  { icon: 'assignment', label: 'Assignments', path: '#/assignments' },
  { icon: 'person', label: 'Profile', path: '#/profile' },
  { icon: 'card_giftcard', label: 'Refer & Earn', path: '#/referral' },
  { icon: 'settings', label: 'Settings', path: '#/settings' },
];

export function renderSidebar() {
  const currentHash = window.location.hash || '#/';
  const user = store.getUserSafe();
  const credits = store.get('credits') || 0;

  const tier = user?.tier || 'Starter';
  const creditDisplay = credits || 0;

  return `
    <aside class="h-screen w-72 fixed left-0 top-0 bg-[#f6f3f2] flex flex-col z-50 font-['Inter'] tracking-tight antialiased -translate-x-full lg:translate-x-0 transition-transform" id="app-sidebar" aria-label="Primary navigation">
      <!-- Logo -->
      <div class="p-6 pb-2">
        <div class="px-2">
          <h1 class="text-xl font-black text-[#1c1b1b] tracking-tighter">SkillSwap+</h1>
          <p class="text-[10px] uppercase tracking-widest text-[#1c1b1b]/50 mt-1" id="sidebar-tier">${tier} Tier</p>
        </div>
      </div>

      <!-- Credit Display -->
      <div class="px-6 py-3">
        <div class="flex items-center gap-2 bg-violet-50 px-4 py-2.5 rounded-full border border-violet-100">
          <span class="material-symbols-outlined material-fill text-violet-600 text-sm">generating_tokens</span>
          <span class="text-violet-700 font-bold text-sm" id="sidebar-credits">${creditDisplay} Credits</span>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 px-4 py-4 overflow-y-auto no-scrollbar space-y-1" aria-label="Main">
        ${navItems.map(item => `
          <a href="${item.path}" class="sidebar-link ${currentHash === item.path ? 'active' : ''}" data-nav="${item.path}">
            <span class="material-symbols-outlined">${item.icon}</span>
            <span>${item.label}</span>
          </a>
        `).join('')}
      </nav>

      <!-- Bottom Section -->
      <div class="mt-auto p-6 space-y-4">
        <div class="p-4 rounded-2xl bg-white/40 border border-white/60 shadow-sm">
          <p class="text-[10px] font-bold text-[#6927ef] uppercase mb-1">Brand Mission</p>
          <p class="text-xs text-zinc-600 font-medium italic leading-snug">"Learn without money. Teach to earn."</p>
        </div>

        <a href="#/create-session" class="block w-full py-3 bg-[#6927ef] text-white rounded-full text-xs font-bold text-center hover:shadow-lg hover:shadow-[#6927ef]/30 transition-all btn-press">Create Session</a>

        <div class="flex flex-col gap-1 border-t border-zinc-200 pt-4">
          <a href="#/settings" class="sidebar-link">
            <span class="material-symbols-outlined">help_outline</span>
            <span>Support</span>
          </a>
          <button class="sidebar-link text-red-500 hover:text-red-600 w-full" id="signout-btn">
            <span class="material-symbols-outlined">logout</span>
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  `;
}

export function initSidebar() {
  const signOutBtn = document.getElementById('signout-btn');
  if (signOutBtn) {
    signOutBtn.addEventListener('click', async () => {
      await logout();
    });
  }

  // Update credits in real time
  store.on('credits', (credits) => {
    const el = document.getElementById('sidebar-credits');
    if (el) el.textContent = `${credits} Credits`;
  });
}
