/* ═══════════════════════════════════════════
   SkillSwap+ — Dashboard Page
   ═══════════════════════════════════════════ */

import { store } from '../state.js';
import { showToast } from '../components/toast.js';

function bookingStatus(booking) {
  return String(booking?.status || '').toLowerCase();
}

function statusLabel(status) {
  return status === 'pending' ? 'awaiting acceptance' : status;
}

function renderPendingMentorActions(bookingId, compact = false) {
  const buttonClass = compact
    ? 'w-full py-2 rounded-full text-[10px] font-bold transition-all'
    : 'flex-1 py-2 rounded-full text-xs font-black transition-all';

  return `
    <div class="flex gap-2 w-full ${compact ? 'flex-col' : ''}">
      <button class="booking-action ${buttonClass} bg-emerald-600 text-white hover:bg-emerald-700" data-action="accept" data-booking-id="${bookingId}">Accept</button>
      <button class="booking-action ${buttonClass} bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50" data-action="reject" data-booking-id="${bookingId}">Reject</button>
    </div>
  `;
}

export async function renderDashboard(container) {
  const user = store.get('user');
  const credits = store.get('credits');

  // Show structured skeleton loading state
  container.innerHTML = `
    <div class="pt-12 px-12 pb-24 max-w-[1400px] mx-auto space-y-16">
      <div class="flex flex-col lg:flex-row justify-between items-start gap-12">
        <div class="max-w-2xl w-full">
          <div class="h-12 bg-zinc-200 rounded-xl w-3/4 mb-4 animate-pulse"></div>
          <div class="h-6 bg-zinc-100 rounded-lg w-1/2 mb-8 animate-pulse"></div>
          <div class="flex gap-4">
            <div class="h-12 w-40 bg-zinc-200 rounded-full animate-pulse"></div>
            <div class="h-12 w-40 bg-zinc-100 rounded-full animate-pulse"></div>
          </div>
        </div>
        <div class="w-full lg:w-96 h-64 bg-zinc-100 rounded-2xl animate-pulse"></div>
      </div>
      <div class="grid grid-cols-12 gap-12">
        <div class="col-span-12 lg:col-span-8 space-y-6">
          <div class="h-8 bg-zinc-200 rounded-lg w-1/3 animate-pulse"></div>
          <div class="grid grid-cols-2 gap-8">
            <div class="h-64 bg-zinc-100 rounded-2xl animate-pulse"></div>
            <div class="h-64 bg-zinc-100 rounded-2xl animate-pulse"></div>
          </div>
        </div>
        <div class="col-span-12 lg:col-span-4 space-y-8">
          <div class="h-32 bg-zinc-200 rounded-2xl animate-pulse"></div>
          <div class="h-80 bg-zinc-100 rounded-2xl animate-pulse"></div>
        </div>
      </div>
    </div>
  `;

  // Fetch real data from API
  let upcomingSessions = [];
  let notifications = store.get('notifications') || [];
  let activities = [];
  let recommendations = [];
  let analytics = null;
  let bookingData = { learning: [], mentoring: [] };

  try {
    const { getMySessions } = await import('../services/session.service.js');
    const { getNotifications } = await import('../services/notification.service.js');
    const { getDashboardAnalytics, getRecommendations, getActivity } = await import('../services/platform.service.js');
    const { getMyBookings } = await import('../services/booking.service.js');

    const [sessionsData, notifData, bookingsResult] = await Promise.allSettled([
      getMySessions(),
      getNotifications(),
      getMyBookings()
    ]);

    const [analyticsData, recommendationData, activityData] = await Promise.allSettled([
      getDashboardAnalytics(),
      getRecommendations({ limit: 4 }),
      getActivity({ limit: 6 })
    ]);

    if (sessionsData.status === 'fulfilled' && sessionsData.value) {
      const result = sessionsData.value;
      const hosting = Array.isArray(result.hosting) ? result.hosting : [];
      const attending = Array.isArray(result.attending) ? result.attending : [];
      const allSessions = [
        ...hosting.map(s => ({ ...s, role: 'hosting' })),
        ...attending.map(s => ({ ...s, role: 'attending' }))
      ];
      upcomingSessions = allSessions.filter(s =>
        s.status === 'open' || s.status === 'full' || s.status === 'upcoming'
      );
      store.setSessionsFromAPI(allSessions);
    }

    if (notifData.status === 'fulfilled') {
      const raw = notifData.value;
      notifications = Array.isArray(raw) ? raw : (raw?.notifications || []);
      store.setNotificationsFromAPI(notifications);
    }

    if (bookingsResult.status === 'fulfilled' && bookingsResult.value) {
      bookingData = bookingsResult.value;
      const bookingSessions = [
        ...(bookingData.mentoring || []).map(b => ({ booking: b, role: 'hosting' })),
        ...(bookingData.learning || []).map(b => ({ booking: b, role: 'attending' }))
      ]
        .filter(({ booking }) => ['accepted', 'pending'].includes(bookingStatus(booking)) && booking.session)
        .map(({ booking: b, role }) => ({
          ...b.session,
          bookingId: b._id,
          bookingStatus: bookingStatus(b),
          meetingUrl: b.meetingUrl,
          creditsReserved: b.creditsReserved,
          role,
          learner: b.learner,
          mentor: b.mentor
        }));
      if (bookingSessions.length > 0) {
        upcomingSessions = bookingSessions;
      }
    }

    if (analyticsData.status === 'fulfilled') {
      analytics = analyticsData.value;
    }
    if (recommendationData.status === 'fulfilled') {
      recommendations = Array.isArray(recommendationData.value) ? recommendationData.value : [];
    }
    if (activityData.status === 'fulfilled') {
      activities = Array.isArray(activityData.value) ? activityData.value : [];
    }
  } catch (err) {
    console.warn('Dashboard data fetch error:', err);
    // Fallback to local state
    upcomingSessions = (store.get('sessions') || []).filter(s =>
      s.status === 'open' || s.status === 'full' || s.status === 'upcoming'
    );
    notifications = store.get('notifications') || [];
  }

  // Use the latest data from state
  const displayUser = store.get('user') || user;
  const displayCredits = store.get('credits') || credits;
  const userName = displayUser?.name?.split(' ')[0] || 'User';
  const userLevel = displayUser?.level || 1;
  const userXp = displayUser?.xp || 0;
  const userXpMax = displayUser?.xpMax || 1000;
  const userStreak = displayUser?.streak || 0;
  const userBadges = displayUser?.badges || [];
  const summary = analytics?.summary || {};
  const completion = summary.profileCompletion ?? analytics?.profileCompletion?.percentage;
  const activityFeed = activities.length > 0 ? activities : notifications;
  const incomingBookings = (bookingData.mentoring || []).filter(b => bookingStatus(b) === 'pending');
  const mentoringBookings = (bookingData.mentoring || []).filter(b => ['accepted', 'completed', 'cancelled', 'rejected'].includes(bookingStatus(b)));
  const learningBookings = (bookingData.learning || []).filter(b => ['pending', 'accepted', 'completed', 'cancelled', 'rejected'].includes(bookingStatus(b)));
  const recommendationCards = recommendations.length > 0 ? recommendations.map((r, index) => ({
    title: r.title,
    category: r.category || 'Recommended',
    reason: r.reason,
    detail: r.detail || 'Based on your recent activity, profile, and learning goals.',
    mentor: r.sourceType === 'resume' ? 'Resume Coach' : r.sourceType === 'project' ? 'Project Guide' : 'SkillSwap+ AI',
    credits: r.credits || 0,
    img: [
      'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=900&q=80'
    ][index % 4],
    mentorImg: 'https://ui-avatars.com/api/?name=' + encodeURIComponent(r.sourceType || 'AI') + '&background=7c3aed&color=fff'
  })) : [
    {
      title: 'Advanced Three.js & Shaders',
      category: 'Development',
      reason: 'Matches your interest in Creative Coding and recent React completion.',
      detail: 'Our AI analyzed your 5 most recent workshop completions and identified a growing pattern in WebGL interest.',
      mentor: 'Elena Volkov',
      credits: 12,
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBh6hmgK7eJ-VPizGi5r9uMFAQj4H9QakDSA1HyXps7Y-7uBAqKymkY31_2TIiC9Jj1_lB7UtIw5aJDeBeUFQVYDogxvcZBXsR2LEps_vzWZ95O2ze9qCs0STWp0_sFJYxcypFIDFXalMFNBi2ObSstHHW9BjFBGDSlgofEvQqfpm9xTPZC439mnRf6phDfpttVMKAPuny8NJFj22ph2j979TKmnDG3w2CB5r1P-QVscRzQwoCp9UbsNiUnH0mKHWqHD6TFKqAqvQ',
      mentorImg: 'https://ui-avatars.com/api/?name=Elena+Volkov&background=7c3aed&color=fff'
    },
    {
      title: 'Spatial Design Systems',
      category: 'UI Design',
      reason: 'Popular among people with your Skill Profile (Product Designer).',
      detail: '85% of users with the "Product Designer" tag have added this workshop to their wishlist this week.',
      mentor: 'Sarah Chen',
      credits: 8,
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD95xttH7ol9zdnNsaHgkaT_Gsk6XavNkdFTjNN_jq-OfY3FhixNPEUj1kn0k8Uv2KuOHhyvnTtdaVPVlitdlitUynqJNXZrEitDth_C7TmIjlxYU98BrSDA0EZfbQO_pAMIx6eLEIh0dulnG6bpgMr5WW-VkB9ncQebRiTL60SSLyhI8OqLiNdELMZSAaiO3kjbOtgeG_SfNj0pTqx3RMzzSroI14ZUBqgRvhOxCz0-2CjkWdCcGjCr5HQXQbB1XYThrlqU9xU2Q',
      mentorImg: 'https://ui-avatars.com/api/?name=Sarah+Chen&background=059669&color=fff'
    }
  ];

  // Color map for Tailwind-safe badge colors
  const colorMap = {
    violet: { bg: '#f5f3ff', border: '#e8e0ff', text: '#7c3aed' },
    emerald: { bg: '#ecfdf5', border: '#a7f3d0', text: '#059669' },
    sky: { bg: '#f0f9ff', border: '#bae6fd', text: '#0284c7' },
    amber: { bg: '#fffbeb', border: '#fde68a', text: '#d97706' },
    rose: { bg: '#fff1f2', border: '#fecdd3', text: '#e11d48' }
  };

  container.innerHTML = `
    <div class="pt-12 px-12 pb-24 max-w-[1400px] mx-auto space-y-16 stagger-children">
      <!-- Welcome Header -->
      <div class="flex flex-col lg:flex-row justify-between items-start gap-12">
        <div class="max-w-2xl">
          <h2 class="text-5xl font-black tracking-tight text-zinc-900 mb-4">Welcome back, ${userName}</h2>
          <p class="text-zinc-500 text-lg">You have <span class="font-bold text-zinc-900">${upcomingSessions.length} session${upcomingSessions.length !== 1 ? 's' : ''}</span> upcoming. Ready to level up?</p>
          <div class="flex gap-4 mt-8">
            <a href="#/marketplace" class="bg-primary text-white px-8 py-3.5 rounded-full font-bold text-sm shadow-lg shadow-primary/20 hover:scale-105 btn-press inline-block">Explore Workshops</a>
            <a href="#/create-session" class="bg-white border border-zinc-200 px-8 py-3.5 rounded-full font-bold text-sm hover:bg-zinc-50 transition-all inline-block">Create Session</a>
          </div>
        </div>

        <!-- Growth Card -->
        <div class="w-full lg:w-96 glass-card rounded-2xl p-6 shadow-sm">
          <div class="flex justify-between items-center mb-6">
            <h3 class="font-black text-sm uppercase tracking-wider text-zinc-400">Your Growth</h3>
            <span class="bg-primary text-white px-3 py-1 rounded-full text-xs font-black shadow-sm">Lv. ${userLevel}</span>
          </div>
          <div class="space-y-6">
            <div class="space-y-3">
              <div class="flex justify-between text-xs mb-1">
                <span class="font-black text-zinc-900">Intermediate</span>
                <span class="text-zinc-400 font-bold">${userXp} / ${userXpMax} XP</span>
              </div>
              <div class="xp-bar">
                <div class="xp-bar-fill" style="width: ${(userXp / userXpMax) * 100}%"></div>
              </div>
            </div>
            <div class="flex justify-between items-center bg-zinc-50/80 rounded-xl p-3 border border-zinc-100">
              <div class="flex items-center gap-3">
                <span class="material-symbols-outlined material-fill text-orange-500">local_fire_department</span>
                <div class="text-xs">
                  <p class="font-bold text-zinc-900">${userStreak} Day Streak</p>
                  <p class="text-[10px] text-zinc-500">Keep it up!</p>
                </div>
              </div>
              <div class="flex -space-x-1.5">
                ${userBadges.slice(0, 3).map(b => {
    const c = colorMap[b.color] || colorMap.violet;
    return `
                  <div class="h-7 w-7 rounded-full border-2 border-white flex items-center justify-center shadow-sm" style="background:${c.bg}" title="${b.name || ''}">
                    <span class="material-symbols-outlined text-[11px]" style="color:${c.text}">${b.icon || 'stars'}</span>
                  </div>
                `}).join('')}
                ${userBadges.length === 0 ? '<span class="text-[10px] text-zinc-400">No badges yet</span>' : ''}
              </div>
            </div>
          </div>
        </div>
      </div>

      ${analytics ? `
        <section class="grid grid-cols-2 md:grid-cols-4 gap-4">
          ${[
            { label: 'Profile Complete', value: `${completion || 0}%`, icon: 'verified_user', color: colorMap.violet },
            { label: 'Projects', value: summary.projects || 0, icon: 'work', color: colorMap.sky },
            { label: 'Resumes', value: summary.resumes || 0, icon: 'description', color: colorMap.emerald },
            { label: 'Credits Flow', value: `+${summary.creditsEarned || 0} / -${summary.creditsSpent || 0}`, icon: 'monitoring', color: colorMap.amber }
          ].map(metric => `
            <div class="bg-white rounded-2xl border border-zinc-100 p-5 shadow-sm">
              <div class="flex items-center gap-3 mb-3">
                <div class="w-9 h-9 rounded-xl flex items-center justify-center" style="background:${metric.color.bg}">
                  <span class="material-symbols-outlined text-base" style="color:${metric.color.text}">${metric.icon}</span>
                </div>
                <span class="text-[10px] font-black uppercase tracking-widest text-zinc-400">${metric.label}</span>
              </div>
              <p class="text-2xl font-black text-zinc-900">${metric.value}</p>
            </div>
          `).join('')}
        </section>
      ` : ''}

      <!-- Main Grid -->
      <div class="grid grid-cols-12 gap-12">
        <!-- AI Recommendations -->
        <section class="col-span-12 lg:col-span-8">
          <div class="flex justify-between items-center mb-8">
            <h3 class="text-2xl font-black tracking-tight">AI Recommended for You</h3>
            <a href="#/marketplace" class="text-primary font-bold text-sm hover:underline">See all</a>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            ${recommendationCards.slice(0, 4).map(card => `
              <div class="group bg-white rounded-2xl p-6 border border-zinc-100 hover:border-primary/20 hover:shadow-2xl hover:shadow-zinc-200/50 transition-all duration-300">
                <div class="relative h-44 w-full rounded-xl overflow-hidden mb-5">
                  <img alt="${card.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="${card.img}" />
                  <div class="absolute top-3 left-3">
                    <span class="bg-black/60 backdrop-blur-md text-white text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded">${card.category}</span>
                  </div>
                </div>
                <h4 class="text-lg font-bold text-zinc-900 mb-2">${card.title}</h4>
                <div class="relative bg-violet-50/50 rounded-xl p-4 border border-violet-100 cursor-help transition-all hover:bg-violet-100/50 tooltip">
                  <p class="text-[10px] text-violet-700 font-black mb-1 flex items-center gap-1">
                    <span class="material-symbols-outlined text-xs">auto_awesome</span> WHY THIS?
                  </p>
                  <p class="text-[11px] text-violet-600 leading-relaxed font-medium">${card.reason}</p>
                  <div class="tooltip-text absolute bottom-full left-0 mb-3 w-full bg-zinc-900 text-white p-3 rounded-xl text-[10px] font-medium z-10 shadow-xl">
                    ${card.detail}
                    <div class="absolute -bottom-1 left-6 w-2 h-2 bg-zinc-900 rotate-45"></div>
                  </div>
                </div>
                <div class="flex items-center justify-between mt-5 pt-4 border-t border-zinc-50">
                  <div class="flex items-center gap-2">
                    <img alt="${card.mentor}" class="w-6 h-6 rounded-full" src="${card.mentorImg}" />
                    <span class="text-xs font-medium text-zinc-600">${card.mentor}</span>
                  </div>
                  <span class="text-primary font-black text-sm">${card.credits} Credits</span>
                </div>
              </div>
            `).join('')}
          </div>
        </section>

        <!-- Activity Feed -->
        <aside class="col-span-12 lg:col-span-4 space-y-8">
          <!-- Credit Card -->
          <div class="bg-gradient-to-br from-primary to-primary-container p-6 rounded-2xl text-white shadow-xl shadow-primary/20">
            <div class="flex items-center justify-between mb-4">
              <span class="text-xs font-bold uppercase tracking-widest opacity-70">Credit Balance</span>
              <span class="material-symbols-outlined material-fill text-sm opacity-70">account_balance_wallet</span>
            </div>
            <p class="text-4xl font-black" id="dashboard-credits">${displayCredits}</p>
            <p class="text-xs opacity-60 mt-1">Available for bookings</p>
            <div class="flex gap-3 mt-4">
              <a href="#/marketplace" class="text-[10px] font-bold bg-white/20 px-3 py-1.5 rounded-full hover:bg-white/30 transition-all">Spend Credits</a>
              <a href="#/create-session" class="text-[10px] font-bold bg-white/20 px-3 py-1.5 rounded-full hover:bg-white/30 transition-all">Earn More</a>
            </div>
          </div>

          <!-- Notifications -->
          <section class="bg-white rounded-2xl p-8 border border-zinc-100 shadow-sm">
            <div class="flex items-center justify-between mb-8">
              <h3 class="font-black text-lg">Activity</h3>
              <span class="h-6 w-6 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full font-bold">${activityFeed.length}</span>
            </div>
            <div class="space-y-6" id="notification-feed">
              ${activityFeed.length === 0 ? `
                <div class="flex flex-col items-center justify-center py-8 text-center">
                  <span class="material-symbols-outlined text-4xl text-zinc-200 mb-3">check_circle</span>
                  <p class="text-zinc-500 font-bold text-sm">You're all caught up</p>
                  <p class="text-[10px] text-zinc-400 uppercase tracking-widest mt-1">New booking, review, and credit updates will appear here.</p>
                </div>
              ` : activityFeed.slice(0, 5).map(n => {
      const nc = colorMap[n.color] || colorMap.violet;
      return `
                <div class="flex gap-4">
                  <div class="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style="background:${nc.bg}">
                    <span class="material-symbols-outlined text-lg" style="color:${nc.text}">${n.icon || 'info'}</span>
                  </div>
                  <div class="pt-1">
                    <p class="text-sm text-zinc-800 leading-snug">${n.message}</p>
                    <p class="text-[10px] text-zinc-400 mt-1 uppercase font-bold tracking-tighter">${n.time || (n.createdAt ? new Date(n.createdAt).toLocaleDateString() : 'Just now')}</p>
                  </div>
                </div>
              `}).join('')}
            </div>
          </section>
        </aside>

        ${(incomingBookings.length > 0 || learningBookings.length > 0 || mentoringBookings.length > 0) ? `
        <section class="col-span-12 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="bg-white rounded-2xl border border-zinc-100 p-6 shadow-sm">
            <div class="flex items-center justify-between mb-5">
              <h3 class="text-lg font-black text-zinc-900">Incoming Booking Requests</h3>
              <span class="text-xs font-black text-primary">${incomingBookings.length}</span>
            </div>
            ${incomingBookings.length === 0 ? `
              <p class="text-sm text-zinc-400 py-6 text-center">No pending learner requests.</p>
            ` : incomingBookings.map(b => `
              <div class="border border-zinc-100 rounded-xl p-4 mb-3 bg-zinc-50/60">
                <div class="flex items-start justify-between gap-4">
                  <div>
                    <p class="font-black text-sm text-zinc-900">${b.session?.title || 'Session'}</p>
                    <p class="text-xs text-zinc-500 mt-1">${b.learner?.name || 'Learner'} reserved ${b.creditsReserved} credits</p>
                  </div>
                  <span class="bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-[9px] font-black uppercase">awaiting acceptance</span>
                </div>
                <div class="mt-4">
                  ${renderPendingMentorActions(b._id)}
                </div>
              </div>
            `).join('')}
          </div>

          <div class="bg-white rounded-2xl border border-zinc-100 p-6 shadow-sm">
            <div class="flex items-center justify-between mb-5">
              <h3 class="text-lg font-black text-zinc-900">Mentoring Bookings</h3>
              <span class="text-xs font-black text-primary">${mentoringBookings.length}</span>
            </div>
            ${mentoringBookings.length === 0 ? `
              <p class="text-sm text-zinc-400 py-6 text-center">No accepted or completed mentor bookings yet.</p>
            ` : mentoringBookings.slice(0, 5).map(b => `
              <div class="border border-zinc-100 rounded-xl p-4 mb-3 bg-white">
                <div class="flex items-start justify-between gap-4">
                  <div>
                    <p class="font-black text-sm text-zinc-900">${b.session?.title || 'Session'}</p>
                    <p class="text-xs text-zinc-500 mt-1">${b.learner?.name || 'Learner'} - ${b.creditsReserved} credits</p>
                    ${b.meetingUrl ? `<a href="${b.meetingUrl}" target="_blank" class="text-xs font-black text-emerald-700 mt-2 inline-flex items-center gap-1"><span class="material-symbols-outlined text-sm">videocam</span> Meeting link</a>` : ''}
                  </div>
                  <span class="bg-zinc-100 text-zinc-600 px-2 py-1 rounded-full text-[9px] font-black uppercase">${statusLabel(bookingStatus(b))}</span>
                </div>
                ${bookingStatus(b) === 'accepted' ? `
                  <button class="booking-action mt-4 bg-zinc-900 text-white w-full py-2 rounded-full text-[10px] font-bold hover:bg-zinc-800 transition-all" data-action="complete" data-booking-id="${b._id}">
                    Complete & Release Credits
                  </button>
                ` : ''}
              </div>
            `).join('')}
          </div>

          <div class="bg-white rounded-2xl border border-zinc-100 p-6 shadow-sm">
            <div class="flex items-center justify-between mb-5">
              <h3 class="text-lg font-black text-zinc-900">Your Booking Status</h3>
              <span class="text-xs font-black text-primary">${learningBookings.length}</span>
            </div>
            ${learningBookings.length === 0 ? `
              <p class="text-sm text-zinc-400 py-6 text-center">No learner bookings yet.</p>
            ` : learningBookings.slice(0, 5).map(b => `
              <div class="flex items-center justify-between gap-4 border border-zinc-100 rounded-xl p-4 mb-3">
                <div>
                  <p class="font-black text-sm text-zinc-900">${b.session?.title || 'Session'}</p>
                  <p class="text-xs text-zinc-500 mt-1">${b.mentor?.name || 'Mentor'} • ${b.creditsReserved} credits escrowed</p>
                  ${b.meetingUrl ? `<a href="${b.meetingUrl}" target="_blank" class="text-xs font-black text-emerald-700 mt-2 inline-flex items-center gap-1"><span class="material-symbols-outlined text-sm">videocam</span> Join Jitsi Meet</a>` : ''}
                </div>
                <span class="bg-zinc-100 text-zinc-600 px-2 py-1 rounded-full text-[9px] font-black uppercase">${statusLabel(bookingStatus(b))}</span>
              </div>
            `).join('')}
          </div>
        </section>
        ` : ''}

        <!-- Upcoming Sessions -->
        <section class="col-span-12">
          <h3 class="text-2xl font-black tracking-tight mb-8">Your Upcoming Sessions</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6" id="sessions-grid">
            ${upcomingSessions.length === 0 ? `
              <div class="col-span-2 text-center py-16 bg-white rounded-2xl border border-zinc-100 shadow-sm flex flex-col items-center justify-center">
                <div class="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mb-4">
                  <span class="material-symbols-outlined text-3xl text-zinc-400">event_busy</span>
                </div>
                <h4 class="text-lg font-black text-zinc-900 mb-1">No upcoming sessions</h4>
                <p class="text-zinc-500 font-medium text-sm mb-6">Your schedule is completely clear.</p>
                <a href="#/marketplace" class="bg-primary text-white px-6 py-2.5 rounded-full font-bold text-sm hover:scale-105 transition-all shadow-lg shadow-primary/20 btn-press">Schedule a Session</a>
              </div>
            ` : upcomingSessions.map(s => {
        const hostName = s.host?.name || s.mentor || 'Instructor';
        const hostAvatar = s.host?.profilePicture || s.mentorAvatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(hostName) + '&background=6927ef&color=fff';
        const sessionDate = s.date ? new Date(s.date) : new Date();
        const meetLink = s.meetingUrl || '';
        const isPendingHostBooking = s.role === 'hosting' && s.bookingStatus === 'pending' && s.bookingId;
        return `
              <div class="glass-card rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 hover:shadow-xl hover:shadow-zinc-200/30 transition-all group">
                <div class="flex items-center gap-6 w-full">
                  <div class="h-16 w-16 bg-white/80 rounded-2xl flex flex-col items-center justify-center border border-zinc-100 shrink-0">
                    <span class="text-[10px] font-black uppercase text-zinc-400">${sessionDate.toLocaleDateString('en', { month: 'short' })}</span>
                    <span class="text-2xl font-black text-zinc-900 leading-none">${sessionDate.getDate()}</span>
                  </div>
                  <div>
                    <h5 class="font-bold text-lg text-zinc-900 group-hover:text-primary transition-colors">${s.title}</h5>
                    <div class="flex flex-wrap items-center gap-4 mt-2">
                      <div class="flex items-center gap-1.5 text-[11px] font-bold text-zinc-700 bg-white px-3 py-1.5 rounded-full border border-zinc-100 shadow-sm">
                        <span class="material-symbols-outlined text-sm text-primary">schedule</span>
                        ${s.startTime || s.time || '--:--'} - ${s.endTime || '--:--'}
                      </div>
                      <div class="flex items-center gap-1.5 text-[11px] font-bold text-zinc-500">
                        <img class="w-5 h-5 rounded-full" src="${hostAvatar}" alt="${hostName}" />
                        ${hostName}
                      </div>
                      ${s.role === 'hosting' ? '<span class="bg-emerald-100 text-emerald-700 text-[9px] font-black px-2 py-0.5 rounded-full uppercase">Teaching</span>' : ''}
                    </div>
                  </div>
                </div>
                <div class="flex flex-col gap-2 min-w-[140px]">
                  <a href="#/session" class="bg-primary text-white w-full py-2.5 rounded-full text-xs font-black hover:scale-105 transition-all shadow-md shadow-primary/20 text-center btn-press">View Session</a>
                  ${s.role === 'hosting' && s.bookingStatus === 'accepted' ? `<button class="booking-action bg-zinc-900 text-white w-full py-2 rounded-full text-[10px] font-bold hover:bg-zinc-800 transition-all" data-action="complete" data-booking-id="${s.bookingId}">
                    Complete & Release
                  </button>` : ''}
                  ${isPendingHostBooking ? renderPendingMentorActions(s.bookingId, true) : meetLink ? `<a href="${meetLink}" target="_blank" class="flex items-center justify-center gap-1.5 bg-emerald-50 text-emerald-700 w-full py-2 rounded-full text-[10px] font-bold border border-emerald-200 hover:bg-emerald-100 transition-all">
                    <span class="material-symbols-outlined text-xs">videocam</span>
                    Join Jitsi
                  </a>` : `<span class="flex items-center justify-center gap-1.5 bg-amber-50 text-amber-700 w-full py-2 rounded-full text-[10px] font-bold border border-amber-200">
                    <span class="material-symbols-outlined text-xs">hourglass_top</span>
                    Awaiting acceptance
                  </span>`}
                </div>
              </div>
            `}).join('')}
          </div>
        </section>
      </div>
    </div>
  `;

  // Live updates
  store.on('credits', (c) => {
    const el = document.getElementById('dashboard-credits');
    if (el) el.textContent = c;
  });

  document.querySelectorAll('.booking-action').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.bookingId;
      const action = btn.dataset.action;
      if (!id || btn.dataset.pending === 'true') return;

      const original = btn.textContent;
      const matchingButtons = document.querySelectorAll(`.booking-action[data-booking-id="${id}"]`);
      matchingButtons.forEach(actionBtn => {
        actionBtn.dataset.pending = 'true';
        actionBtn.disabled = true;
        actionBtn.setAttribute('aria-busy', 'true');
      });
      btn.textContent = action === 'accept' ? 'Accepting...' : action === 'reject' ? 'Rejecting...' : 'Working...';

      try {
        const service = await import('../services/booking.service.js');
        let updatedBooking = null;
        if (action === 'accept') updatedBooking = await service.acceptBooking(id);
        if (action === 'reject') updatedBooking = await service.rejectBooking(id);
        if (action === 'complete') updatedBooking = await service.completeBooking(id);

        const { getCredits } = await import('../services/credit.service.js');
        const { fetchProfile, fetchMyBookings } = await import('../services/data.layer.js');
        const [latestCredits] = await Promise.all([
          getCredits(),
          fetchProfile(),
          fetchMyBookings()
        ]);
        store.setCredits(latestCredits.credits || 0);

        const nextStatus = updatedBooking?.status || (action === 'complete' ? 'completed' : action === 'accept' ? 'accepted' : 'rejected');
        showToast(`Booking is now ${nextStatus}.`, 'success');
        await renderDashboard(container);
      } catch (err) {
        showToast(err.message || 'Booking action failed', 'error');
        matchingButtons.forEach(actionBtn => {
          actionBtn.disabled = false;
          actionBtn.removeAttribute('aria-busy');
          delete actionBtn.dataset.pending;
        });
        btn.textContent = original;
      }
    });
  });
}
