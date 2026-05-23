/* ═══════════════════════════════════════════
   SkillSwap+ — User Profile Page
   With proper badge system & demo mode support
   ═══════════════════════════════════════════ */

import { store } from '../state.js';
import { showToast } from '../components/toast.js';
import { fetchProfile, saveProfile, fetchProjects, fetchResumes, fetchProfileCompletion } from '../services/data.layer.js';

// Color palette for badges — uses inline styles to avoid Tailwind purge issues
const colorMap = {
  violet: { bg: '#f5f3ff', ring: '#e8e0ff', text: '#7c3aed', lightBg: '#ede9fe' },
  emerald: { bg: '#ecfdf5', ring: '#a7f3d0', text: '#059669', lightBg: '#d1fae5' },
  sky: { bg: '#f0f9ff', ring: '#bae6fd', text: '#0284c7', lightBg: '#e0f2fe' },
  amber: { bg: '#fffbeb', ring: '#fde68a', text: '#d97706', lightBg: '#fef3c7' },
  rose: { bg: '#fff1f2', ring: '#fecdd3', text: '#e11d48', lightBg: '#ffe4e6' },
  blue: { bg: '#eff6ff', ring: '#bfdbfe', text: '#2563eb', lightBg: '#dbeafe' },
  orange: { bg: '#fff7ed', ring: '#fed7aa', text: '#ea580c', lightBg: '#ffedd5' }
};

// All available badges in the system
const allBadges = [
  { name: 'Quick Learner', icon: 'bolt', color: 'violet', desc: 'Completed 5 sessions in a week', requirement: 'Complete 5 sessions in a single week' },
  { name: 'Community Contributor', icon: 'volunteer_activism', color: 'emerald', desc: 'Helped 10+ users', requirement: 'Teach 10 different users' },
  { name: 'Python Master', icon: 'code', color: 'sky', desc: 'Achieved expert level in Python', requirement: 'Reach 80%+ proficiency in Python' },
  { name: 'Teaching Pro', icon: 'school', color: 'amber', desc: 'Taught 25+ sessions', requirement: 'Host and complete 25 sessions' },
  { name: 'Early Adopter', icon: 'rocket_launch', color: 'rose', desc: 'Joined during beta', requirement: 'Register before public launch' },
  { name: 'Streak Master', icon: 'local_fire_department', color: 'orange', desc: 'Maintained a 30-day streak', requirement: 'Log in for 30 consecutive days' },
  { name: 'Top Rated', icon: 'star', color: 'amber', desc: 'Achieved 4.8+ rating', requirement: 'Maintain 4.8+ average rating with 10+ reviews' },
  { name: 'Polyglot', icon: 'translate', color: 'blue', desc: 'Mastered 5+ skills', requirement: 'Achieve 70%+ in 5 different skills' },
  { name: 'Credit Whale', icon: 'generating_tokens', color: 'violet', desc: 'Earned 500+ credits', requirement: 'Accumulate 500 lifetime credits earned' },
];

export async function renderProfile(container) {
  // Show loading
  // Show structured skeleton loading
  container.innerHTML = `
    <div class="pt-12 px-12 pb-24 max-w-[1200px] mx-auto animate-pulse">
      <div class="h-64 bg-zinc-200 rounded-3xl w-full mb-12"></div>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div class="lg:col-span-2 space-y-8">
          <div class="grid grid-cols-4 gap-4"><div class="h-32 bg-zinc-100 rounded-2xl"></div><div class="h-32 bg-zinc-100 rounded-2xl"></div><div class="h-32 bg-zinc-100 rounded-2xl"></div><div class="h-32 bg-zinc-100 rounded-2xl"></div></div>
          <div class="h-64 bg-zinc-100 rounded-2xl"></div>
          <div class="h-48 bg-zinc-100 rounded-2xl"></div>
        </div>
        <div class="space-y-6">
          <div class="h-80 bg-zinc-100 rounded-2xl"></div>
          <div class="h-40 bg-zinc-100 rounded-2xl"></div>
        </div>
      </div>
    </div>
  `;

  // Fetch latest profile through data layer
  let user;
  const profileRes = await fetchProfile();
  if (profileRes.error) {
    showToast('Failed to load profile. Please try again.', 'error');
  }
  const [projectsRes, resumesRes, completionRes] = await Promise.allSettled([
    fetchProjects({ limit: 6 }),
    fetchResumes(),
    fetchProfileCompletion()
  ]);
  user = store.getUserSafe();

  const credits = store.get('credits') || 0;
  const displayUser = user || store.getUserSafe();
  const avatar = displayUser?.avatar || 'https://ui-avatars.com/api/?name=User&background=6927ef&color=fff';
  const projects = projectsRes.status === 'fulfilled' && !projectsRes.value.error ? projectsRes.value.data || [] : [];
  const resumes = resumesRes.status === 'fulfilled' && !resumesRes.value.error ? resumesRes.value.data || [] : [];
  const completion = completionRes.status === 'fulfilled' && !completionRes.value.error ? completionRes.value.data : null;

  // Determine which badges are earned vs locked
  const earnedBadgeNames = (displayUser?.badges || []).map(b => b?.name || '');
  const earnedBadges = displayUser?.badges || [];
  const lockedBadges = (allBadges || []).filter(b => !earnedBadgeNames.includes(b.name));

  container.innerHTML = `
    <div class="pt-12 px-12 pb-24 max-w-[1200px] mx-auto">
      <!-- Profile Header -->
      <div class="bg-gradient-to-br from-primary to-primary-container rounded-3xl p-10 text-white relative overflow-hidden mb-12">
        <div class="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-[80px]"></div>
        <div class="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8 stagger-children">
          <img class="w-28 h-28 rounded-3xl object-cover shadow-2xl border-4 border-white/20" src="${avatar}" alt="${displayUser.name}" />
          <div class="flex-1 text-center md:text-left">
            <h1 class="text-4xl font-black tracking-tight mb-1">${displayUser?.name || 'User'}</h1>
            <p class="text-white/70 text-lg mb-4">${displayUser?.role || 'Member'}</p>
            <div class="flex flex-wrap justify-center md:justify-start gap-3">
              <span class="bg-white/20 px-4 py-1.5 rounded-full text-xs font-bold">Level ${displayUser?.level || 1}</span>
              <span class="bg-white/20 px-4 py-1.5 rounded-full text-xs font-bold">${displayUser?.tier || 'Starter'} Tier</span>
              <span class="bg-white/20 px-4 py-1.5 rounded-full text-xs font-bold">${credits} Credits</span>
              ${displayUser?.rating > 0 ? `<span class="bg-white/20 px-4 py-1.5 rounded-full text-xs font-bold">★ ${displayUser.rating.toFixed(1)}</span>` : ''}
            </div>
          </div>
          <button id="edit-profile-btn" class="bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-full font-bold text-sm hover:bg-white/30 transition-all btn-press flex items-center gap-2">
            <span class="material-symbols-outlined text-sm">edit</span> Edit Profile
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 stagger-children">
        <!-- Left Column -->
        <div class="lg:col-span-2 space-y-8">
          <!-- Stats Grid -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            ${[
              { label: 'Sessions Taught', value: displayUser.stats?.sessionsTaught || 0, icon: 'record_voice_over', color: colorMap.violet },
              { label: 'Sessions Attended', value: displayUser.stats?.sessionsAttended || 0, icon: 'school', color: colorMap.sky },
              { label: 'Credits Earned', value: displayUser.stats?.creditsEarned || 0, icon: 'generating_tokens', color: colorMap.emerald },
              { label: 'Rating', value: displayUser.rating > 0 ? '★ ' + displayUser.rating.toFixed(1) : 'N/A', icon: 'star', color: colorMap.amber }
            ].map(s => `
              <div class="bg-white rounded-2xl p-6 border border-zinc-100 shadow-sm text-center card-hover">
                <div class="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style="background:${s.color.bg}">
                  <span class="material-symbols-outlined" style="color:${s.color.text}">${s.icon}</span>
                </div>
                <p class="text-2xl font-black text-zinc-900">${s.value}</p>
                <p class="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mt-1">${s.label}</p>
              </div>
            `).join('')}
          </div>

          ${completion ? `
            <div class="bg-white rounded-2xl p-8 border border-zinc-100 shadow-sm">
              <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
                <div>
                  <h3 class="text-lg font-black text-zinc-900 flex items-center gap-2">
                    <span class="material-symbols-outlined text-primary">task_alt</span>
                    Profile Completion
                  </h3>
                  <p class="text-xs text-zinc-400 mt-1">Calculated from profile, skills, resumes, and projects.</p>
                </div>
                <span class="text-3xl font-black text-primary">${completion.percentage || 0}%</span>
              </div>
              <div class="xp-bar mb-5">
                <div class="xp-bar-fill" style="width: ${completion.percentage || 0}%"></div>
              </div>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                ${Object.entries(completion.sections || {}).map(([name, value]) => `
                  <div class="bg-zinc-50 rounded-xl border border-zinc-100 p-3">
                    <p class="text-[10px] font-black uppercase tracking-widest text-zinc-400">${name}</p>
                    <p class="text-lg font-black text-zinc-900">${value}%</p>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Skills -->
          <div class="bg-white rounded-2xl p-8 border border-zinc-100 shadow-sm">
            <h3 class="text-lg font-black text-zinc-900 mb-6 flex items-center gap-2">
              <span class="material-symbols-outlined text-primary">psychology</span>
              Skills & Proficiency
            </h3>
            <div class="space-y-6">
              ${(displayUser.skills && displayUser.skills.length > 0) ? displayUser.skills.map(s => `
                <div>
                  <div class="flex justify-between mb-2">
                    <span class="text-sm font-bold text-zinc-800">${s.name}</span>
                    <span class="text-xs font-black text-primary">${s.level}%</span>
                  </div>
                  <div class="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                    <div class="h-full bg-gradient-to-r from-primary to-primary-container rounded-full transition-all duration-1000" style="width: ${s.level}%"></div>
                  </div>
                </div>
              `).join('') : `
                <div class="text-center py-8">
                  <span class="material-symbols-outlined text-3xl text-zinc-300 mb-2">psychology</span>
                  <p class="text-zinc-400 text-sm">No skills added yet. Edit your profile to add skills!</p>
                </div>
              `}
            </div>
          </div>

          <!-- Bio -->
          <div class="bg-white rounded-2xl p-8 border border-zinc-100 shadow-sm">
            <h3 class="text-lg font-black text-zinc-900 mb-6 flex items-center gap-2">
              <span class="material-symbols-outlined text-primary">person</span>
              About
            </h3>
            <p class="text-zinc-600 leading-relaxed">${displayUser.bio || 'No bio yet. Click "Edit Profile" to tell the community about yourself!'}</p>
          </div>
          <div class="bg-white rounded-2xl p-8 border border-zinc-100 shadow-sm">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-lg font-black text-zinc-900 flex items-center gap-2">
                <span class="material-symbols-outlined text-primary">work</span>
                Projects & Resources
              </h3>
              <span class="text-xs font-black text-primary">${projects.length}</span>
            </div>
            ${projects.length > 0 ? `
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                ${projects.slice(0, 4).map(item => `
                  <a href="${item.url || '#/profile'}" class="block bg-zinc-50 rounded-xl border border-zinc-100 p-4 hover:bg-white hover:shadow-sm transition-all">
                    <div class="flex items-center gap-2 mb-2">
                      <span class="material-symbols-outlined text-sm text-primary">${item.type === 'resource' ? 'library_books' : 'work'}</span>
                      <span class="text-[10px] font-black uppercase tracking-widest text-zinc-400">${item.type || 'project'}</span>
                    </div>
                    <h4 class="font-black text-sm text-zinc-900 mb-1">${item.title}</h4>
                    <p class="text-xs text-zinc-500 line-clamp-2">${item.description || 'No description added yet.'}</p>
                  </a>
                `).join('')}
              </div>
            ` : `
              <div class="text-center py-8">
                <span class="material-symbols-outlined text-3xl text-zinc-300 mb-2">work</span>
                <p class="text-zinc-400 text-sm">No saved projects or resources yet.</p>
              </div>
            `}
          </div>
        </div>

        <!-- Right Column -->
        <div class="space-y-6">
          <div class="bg-white rounded-2xl p-8 border border-zinc-100 shadow-sm">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-lg font-black text-zinc-900">Resumes</h3>
              <span class="text-xs font-black text-primary">${resumes.length}</span>
            </div>
            <div class="space-y-3">
              ${resumes.length > 0 ? resumes.slice(0, 3).map(resume => `
                <div class="p-4 rounded-xl bg-zinc-50 border border-zinc-100">
                  <div class="flex items-center justify-between gap-3 mb-2">
                    <p class="text-sm font-bold text-zinc-900">${resume.title}</p>
                    ${resume.isPrimary ? '<span class="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[9px] font-black uppercase">Primary</span>' : ''}
                  </div>
                  <p class="text-[10px] text-zinc-400 uppercase font-bold tracking-widest">${resume.targetRole || 'General profile'}</p>
                  <div class="flex items-center justify-between mt-3">
                    <span class="text-xs text-zinc-500">${resume.status || 'draft'}</span>
                    <span class="text-sm font-black text-primary">${resume.score || 0}/100</span>
                  </div>
                </div>
              `).join('') : `
                <div class="text-center py-6">
                  <span class="material-symbols-outlined text-3xl text-zinc-300 mb-2">description</span>
                  <p class="text-zinc-400 text-xs">No resumes saved yet.</p>
                </div>
              `}
            </div>
          </div>
          <!-- Badges — Earned -->
          <div class="bg-white rounded-2xl p-8 border border-zinc-100 shadow-sm">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-lg font-black text-zinc-900">Badges Earned</h3>
              <span class="text-xs font-black text-primary">${earnedBadges.length} / ${allBadges.length}</span>
            </div>
            <div class="grid grid-cols-3 gap-4">
              ${earnedBadges.map(b => {
                const c = colorMap[b.color] || colorMap.violet;
                return `
                <div class="flex flex-col items-center gap-2 p-4 rounded-xl border cursor-pointer group transition-all hover:scale-105" style="background:${c.bg};border-color:${c.ring}">
                  <div class="w-12 h-12 rounded-full flex items-center justify-center shadow-sm" style="background:${c.lightBg}">
                    <span class="material-symbols-outlined material-fill" style="color:${c.text}">${b.icon || 'stars'}</span>
                  </div>
                  <span class="text-[10px] font-bold text-zinc-600 text-center leading-tight">${b.name}</span>
                </div>
              `}).join('')}
              ${earnedBadges.length === 0 ? `
                <div class="col-span-3 text-center py-6">
                  <span class="material-symbols-outlined text-3xl text-zinc-300 mb-2">military_tech</span>
                  <p class="text-zinc-400 text-xs">Complete sessions and activities to earn badges!</p>
                </div>
              ` : ''}
            </div>
          </div>

          <!-- Badges — Locked -->
          <div class="bg-white rounded-2xl p-8 border border-zinc-100 shadow-sm">
            <h3 class="text-lg font-black text-zinc-900 mb-6 flex items-center gap-2">
              <span class="material-symbols-outlined text-zinc-400">lock</span>
              Locked Badges
            </h3>
            <div class="space-y-3">
              ${lockedBadges.slice(0, 5).map(b => {
                const c = colorMap[b.color] || colorMap.violet;
                return `
                <div class="flex items-center gap-4 p-3 rounded-xl bg-zinc-50 border border-zinc-100 opacity-60 hover:opacity-80 transition-opacity">
                  <div class="w-10 h-10 rounded-full bg-zinc-200 flex items-center justify-center shrink-0">
                    <span class="material-symbols-outlined text-zinc-400">${b.icon || 'stars'}</span>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-xs font-bold text-zinc-600">${b.name}</p>
                    <p class="text-[10px] text-zinc-400 truncate">${b.requirement}</p>
                  </div>
                  <span class="material-symbols-outlined text-zinc-300 text-sm">lock</span>
                </div>
              `}).join('')}
            </div>
          </div>

          <!-- XP Progress -->
          <div class="bg-white rounded-2xl p-8 border border-zinc-100 shadow-sm">
            <h3 class="text-lg font-black text-zinc-900 mb-4">Level Progress</h3>
            <div class="text-center mb-6">
              <div class="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary-container flex items-center justify-center mx-auto mb-3">
                <span class="text-white text-3xl font-black">${displayUser.level || 1}</span>
              </div>
              <p class="text-zinc-500 text-sm">${displayUser.xp || 0} / ${displayUser.xpMax || 1000} XP</p>
            </div>
            <div class="xp-bar mb-4">
              <div class="xp-bar-fill" style="width: ${((displayUser.xp || 0) / (displayUser.xpMax || 1000)) * 100}%"></div>
            </div>
            <p class="text-xs text-zinc-400 text-center">${(displayUser.xpMax || 1000) - (displayUser.xp || 0)} XP to next level</p>
          </div>

          <!-- Quick Actions -->
          <div class="bg-white rounded-2xl p-8 border border-zinc-100 shadow-sm">
            <h3 class="text-lg font-black text-zinc-900 mb-4">Quick Actions</h3>
            <div class="space-y-3">
              <a href="#/marketplace" class="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-50 transition-colors">
                <span class="material-symbols-outlined text-primary">explore</span>
                <span class="text-sm font-medium">Browse Mentors</span>
              </a>
              <a href="#/mentor-apply" class="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-50 transition-colors">
                <span class="material-symbols-outlined text-primary">school</span>
                <span class="text-sm font-medium">Start Teaching</span>
              </a>
              <a href="#/settings" class="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-50 transition-colors">
                <span class="material-symbols-outlined text-primary">settings</span>
                <span class="text-sm font-medium">Account Settings</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Edit profile button
  document.getElementById('edit-profile-btn')?.addEventListener('click', () => {
    showEditProfileModal(displayUser);
  });
}

/**
 * Show a modal to edit profile fields.
 */
function showEditProfileModal(user) {
  const modalContainer = document.getElementById('modal-container');
  if (!modalContainer) return;

  modalContainer.innerHTML = `
    <div class="modal-backdrop" id="modal-backdrop">
      <div class="flex items-center justify-center min-h-screen p-4">
        <div class="modal-content bg-white rounded-3xl p-8 shadow-2xl max-w-lg w-full relative">
          <button id="modal-close-btn" class="absolute top-4 right-4 p-2 hover:bg-zinc-100 rounded-full transition-colors">
            <span class="material-symbols-outlined">close</span>
          </button>
          <h3 class="text-xl font-black text-zinc-900 mb-6">Edit Profile</h3>
          <form id="edit-profile-form" class="space-y-4">
            <div>
              <label class="text-[10px] uppercase tracking-[0.1em] text-zinc-500 font-black block mb-2">Name</label>
              <input id="edit-name" class="w-full p-3 bg-zinc-50 rounded-xl border border-zinc-100 focus:border-primary/30 focus:bg-white transition-all outline-none text-sm" value="${user.name}" />
            </div>
            <div>
              <label class="text-[10px] uppercase tracking-[0.1em] text-zinc-500 font-black block mb-2">Bio</label>
              <textarea id="edit-bio" class="w-full p-3 bg-zinc-50 rounded-xl border border-zinc-100 focus:border-primary/30 focus:bg-white transition-all outline-none text-sm h-24 resize-none">${user.bio || ''}</textarea>
            </div>
            <div>
              <label class="text-[10px] uppercase tracking-[0.1em] text-zinc-500 font-black block mb-2">Skills Wanted (comma-separated)</label>
              <input id="edit-skills-wanted" class="w-full p-3 bg-zinc-50 rounded-xl border border-zinc-100 focus:border-primary/30 focus:bg-white transition-all outline-none text-sm" value="${(user.skillsWanted || []).join(', ')}" placeholder="e.g. React, Python, Public Speaking" />
            </div>
            <button type="submit" id="save-profile-btn" class="w-full py-3 bg-primary text-white rounded-full font-bold text-sm shadow-lg shadow-primary/20 mt-4 btn-press flex items-center justify-center gap-2">
              Save Changes
            </button>
          </form>
        </div>
      </div>
    </div>
  `;

  // Close modal
  const closeModal = () => { modalContainer.innerHTML = ''; };
  document.getElementById('modal-close-btn')?.addEventListener('click', closeModal);
  document.getElementById('modal-backdrop')?.addEventListener('click', (e) => {
    if (e.target.id === 'modal-backdrop') closeModal();
  });

  // Save handler
  document.getElementById('edit-profile-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('save-profile-btn');
    btn.disabled = true;
    btn.innerHTML = '<span class="material-symbols-outlined animate-spin text-sm">refresh</span> Saving...';

    const name = document.getElementById('edit-name').value.trim();
    const bio = document.getElementById('edit-bio').value.trim();
    const skillsWanted = document.getElementById('edit-skills-wanted').value.split(',').map(s => s.trim()).filter(Boolean);

    const res = await saveProfile({ name, bio, skillsWanted });
    if (res.error) {
      showToast('Something went wrong. Try again.', 'error');
      btn.disabled = false;
      btn.innerHTML = 'Save Changes';
    } else {
      showToast('Profile updated!', 'success');
      closeModal();
      const inner = document.getElementById('page-content') || document.getElementById('page-inner');
      if (inner) renderProfile(inner);
    }
  });
}
