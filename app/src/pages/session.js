/* ═══════════════════════════════════════════
   SkillSwap+ — Session / Join Page
   Works in both API and Demo mode
   With Google Meet integration
   ═══════════════════════════════════════════ */

import { store } from '../state.js';
import { showToast } from '../components/toast.js';
import { fetchMyBookings } from '../services/data.layer.js';
import { renderInlineLoader } from '../components/status-state.js';

let countdownInterval = null;

function renderPendingMentorActions(bookingId) {
  return `
    <div class="mt-10 flex flex-col sm:flex-row justify-center gap-3">
      <button class="booking-action px-10 py-4 bg-emerald-600 text-white font-black rounded-full shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all btn-press" data-action="accept" data-booking-id="${bookingId}">
        Accept
      </button>
      <button class="booking-action px-10 py-4 bg-white text-zinc-700 font-black rounded-full border border-zinc-200 hover:bg-zinc-50 transition-all btn-press" data-action="reject" data-booking-id="${bookingId}">
        Reject
      </button>
    </div>
  `;
}

export async function renderSession(container) {
  // Show loading
  container.innerHTML = `
    <div class="pt-12 px-12 pb-24 max-w-[1200px] mx-auto flex items-center justify-center min-h-[60vh]">
      ${renderInlineLoader('Loading your booked sessions...')}
    </div>
  `;

  // Fetch bookings through data layer. Meeting URLs are backend-generated only
  // after mentor acceptance.
  let allSessions = [];
  const res = await fetchMyBookings();
  if (!res.error && res.data) {
    const { mentoring = [], learning = [] } = res.data;
    allSessions = [
      ...mentoring.map(b => ({ ...(b.session || {}), booking: b, role: 'hosting', meetingUrl: b.meetingUrl, bookingStatus: String(b.status || '').toLowerCase() })),
      ...learning.map(b => ({ ...(b.session || {}), booking: b, role: 'attending', meetingUrl: b.meetingUrl, bookingStatus: String(b.status || '').toLowerCase() }))
    ].filter(s => s._id);
    store.setSessionsFromAPI(allSessions);
  } else {
    allSessions = store.get('sessions') || [];
  }

  const upcomingSessions = allSessions.filter(s =>
    s.bookingStatus === 'accepted' || s.bookingStatus === 'pending'
  );
  const nextSession = upcomingSessions[0] || null;

  // Calculate countdown to next session
  const sessionDateTime = nextSession && nextSession.date
    ? new Date(`${nextSession.date.split('T')[0]}T${nextSession.startTime || nextSession.time || '00:00'}:00`)
    : null;

  const meetLink = nextSession?.meetingUrl || '';
  const pendingHostBookingId = nextSession?.role === 'hosting' && nextSession?.bookingStatus === 'pending'
    ? nextSession.booking?._id
    : '';

  container.innerHTML = `
    <div class="pt-12 px-12 pb-24 max-w-[1200px] mx-auto">
      <nav class="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-8">
        <a href="#/dashboard" class="hover:text-primary transition-colors">Dashboard</a>
        <span class="material-symbols-outlined text-[10px]">chevron_right</span>
        <span class="text-primary">Session</span>
      </nav>

      ${nextSession ? (() => {
        const hostName = nextSession.host?.name || nextSession.mentor || 'Instructor';
        const hostAvatar = nextSession.host?.profilePicture || nextSession.mentorAvatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(hostName) + '&background=6927ef&color=fff';
        const sessionDate = nextSession.date ? new Date(nextSession.date) : new Date();
        return `
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <!-- Main Session Area -->
          <div class="lg:col-span-2 space-y-8 stagger-children">
            <!-- Session Header -->
            <div class="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-3xl p-10 text-white relative overflow-hidden">
              <div class="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px]"></div>
              <div class="relative z-10">
                <div class="flex items-center gap-3 mb-6">
                  <span class="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                    <span class="w-2 h-2 bg-emerald-400 rounded-full pulse"></span>
                    ${nextSession.role === 'hosting' ? 'You\'re Teaching' : 'Upcoming Session'}
                  </span>
                </div>
                <h1 class="text-4xl font-black tracking-tight mb-4">${nextSession.title}</h1>
                <div class="flex flex-wrap items-center gap-6 text-sm text-zinc-400">
                  <div class="flex items-center gap-2">
                    <img class="w-8 h-8 rounded-full border-2 border-white/20" src="${hostAvatar}" alt="${hostName}" />
                    <span class="font-bold text-white">${hostName}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-sm">calendar_today</span>
                    ${sessionDate.toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-sm">schedule</span>
                    ${nextSession.startTime || nextSession.time || '--:--'} - ${nextSession.endTime || '--:--'}
                  </div>
                </div>
                ${nextSession.description ? `<p class="text-zinc-400 mt-4 text-sm leading-relaxed">${nextSession.description}</p>` : ''}
              </div>
            </div>

            <!-- Countdown -->
            <div class="bg-white border border-zinc-100 rounded-3xl p-10 text-center shadow-sm">
              <p class="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-4">Session Starts In</p>
              <div class="flex justify-center gap-6" id="countdown-display">
                <div class="text-center">
                  <span class="text-5xl font-black text-zinc-900 block" id="cd-days">--</span>
                  <span class="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Days</span>
                </div>
                <span class="text-5xl font-black text-zinc-300">:</span>
                <div class="text-center">
                  <span class="text-5xl font-black text-zinc-900 block" id="cd-hours">--</span>
                  <span class="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Hours</span>
                </div>
                <span class="text-5xl font-black text-zinc-300">:</span>
                <div class="text-center">
                  <span class="text-5xl font-black text-zinc-900 block" id="cd-mins">--</span>
                  <span class="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Mins</span>
                </div>
                <span class="text-5xl font-black text-zinc-300">:</span>
                <div class="text-center">
                  <span class="text-5xl font-black text-primary block" id="cd-secs">--</span>
                  <span class="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Secs</span>
                </div>
              </div>

              <!-- Meeting Button -->
              ${pendingHostBookingId ? renderPendingMentorActions(pendingHostBookingId) : meetLink ? `<a href="${meetLink}" target="_blank" id="join-meeting-btn" class="mt-10 px-12 py-5 bg-primary text-white font-black text-lg rounded-full shadow-xl shadow-primary/25 hover:-translate-y-1 transition-all btn-press inline-flex items-center gap-3">
                <span class="material-symbols-outlined">videocam</span>
                Join via Jitsi Meet
              </a>
              <p class="text-xs text-zinc-400 mt-3">Opens Jitsi Meet in a new tab</p>` : `
              <div class="mt-10 px-8 py-5 bg-amber-50 text-amber-700 font-black rounded-full inline-flex items-center gap-3 border border-amber-200">
                <span class="material-symbols-outlined">hourglass_top</span>
                Waiting for mentor acceptance
              </div>`}

              <!-- Meet Link Display -->
              ${meetLink ? `<div class="mt-6 bg-zinc-50 rounded-2xl p-4 border border-zinc-100 inline-flex items-center gap-3">
                <span class="material-symbols-outlined text-emerald-500 text-sm">link</span>
                <code class="text-xs text-zinc-600 font-mono" id="meet-link-text">${meetLink}</code>
                <button id="copy-meet-link" class="text-primary text-xs font-bold hover:underline">Copy</button>
              </div>` : ''}
            </div>

            <!-- Session Preparation -->
            <div class="bg-white border border-zinc-100 rounded-3xl p-8 shadow-sm">
              <h3 class="text-lg font-black text-zinc-900 mb-6">Session Preparation</h3>
              <div class="space-y-4">
                ${[
                  { icon: 'check_circle', text: 'Ensure stable internet connection', done: true },
                  { icon: 'check_circle', text: 'Test your microphone and camera', done: true },
                  { icon: 'radio_button_unchecked', text: 'Review pre-session materials', done: false },
                  { icon: 'radio_button_unchecked', text: 'Prepare questions for the mentor', done: false }
                ].map(item => `
                  <div class="flex items-center gap-4 p-3 rounded-xl ${item.done ? 'bg-emerald-50/50' : 'bg-zinc-50'} border ${item.done ? 'border-emerald-100' : 'border-zinc-100'}">
                    <span class="material-symbols-outlined ${item.done ? 'material-fill text-emerald-500' : 'text-zinc-300'}">${item.icon}</span>
                    <span class="text-sm ${item.done ? 'text-zinc-600 line-through' : 'font-medium text-zinc-800'}">${item.text}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- Sidebar Info -->
          <div class="space-y-6 stagger-children">
            <!-- Mentor Card -->
            <div class="bg-white border border-zinc-100 rounded-3xl p-8 shadow-sm">
              <h4 class="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-6">${nextSession.role === 'hosting' ? 'You\'re the Host' : 'Your Mentor'}</h4>
              <div class="flex flex-col items-center text-center">
                <img class="w-20 h-20 rounded-2xl object-cover mb-4 shadow-lg" src="${hostAvatar}" alt="${hostName}" />
                <h4 class="font-black text-lg mb-1">${hostName}</h4>
                <p class="text-xs text-zinc-500">Session Expert</p>
                <div class="flex gap-1 text-amber-400 mt-3">
                  ${'<span class="material-symbols-outlined material-fill text-sm">star</span>'.repeat(5)}
                </div>
              </div>
            </div>

            <!-- Meet Info Card -->
            <div class="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200 rounded-3xl p-8 shadow-sm">
              <h4 class="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-4">Meeting Info</h4>
              <div class="space-y-3">
                <div class="flex items-center gap-3 text-sm">
                  <span class="material-symbols-outlined text-emerald-600 text-lg">videocam</span>
                  <span class="font-medium text-zinc-700">${pendingHostBookingId ? 'Action required' : meetLink ? 'Jitsi Meet' : 'Pending acceptance'}</span>
                </div>
                <div class="flex items-center gap-3 text-sm">
                  <span class="material-symbols-outlined text-emerald-600 text-lg">schedule</span>
                  <span class="font-medium text-zinc-700">${nextSession.startTime || nextSession.time || '--:--'} - ${nextSession.endTime || '--:--'}</span>
                </div>
                <div class="flex items-center gap-3 text-sm">
                  <span class="material-symbols-outlined text-emerald-600 text-lg">generating_tokens</span>
                  <span class="font-medium text-zinc-700">${nextSession.credits || 0} Credits</span>
                </div>
              </div>
              ${meetLink ? `<a href="${meetLink}" target="_blank" class="mt-6 w-full py-3 bg-emerald-600 text-white rounded-full text-xs font-bold text-center hover:bg-emerald-700 transition-all btn-press flex items-center justify-center gap-2">
                <span class="material-symbols-outlined text-sm">open_in_new</span>
                Open Meet Link
              </a>` : ''}
            </div>

            <!-- Session Notes -->
            <div class="bg-white border border-zinc-100 rounded-3xl p-8 shadow-sm">
              <h4 class="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-6">Quick Notes</h4>
              <textarea class="w-full h-32 p-4 bg-zinc-50 border border-zinc-100 rounded-xl text-sm resize-none focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="Write your notes here..."></textarea>
            </div>

            <!-- Other Sessions -->
            <div class="bg-white border border-zinc-100 rounded-3xl p-8 shadow-sm">
              <h4 class="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-4">All Sessions</h4>
              <div class="space-y-3">
                ${upcomingSessions.map(s => {
                  const sHost = s.host?.name || s.mentor || 'Instructor';
                  const sAvatar = s.host?.profilePicture || s.mentorAvatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(sHost) + '&background=6927ef&color=fff';
                  return `
                  <div class="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 border border-zinc-100">
                    <img class="w-8 h-8 rounded-lg" src="${sAvatar}" alt="${sHost}" />
                    <div class="flex-1 min-w-0">
                      <p class="text-xs font-bold truncate">${s.title}</p>
                      <p class="text-[10px] text-zinc-400">${s.date ? new Date(s.date).toLocaleDateString() : ''} at ${s.startTime || s.time || '--:--'}</p>
                    </div>
                  </div>
                `}).join('')}
                ${upcomingSessions.length === 0 ? '<p class="text-zinc-400 text-xs text-center">No sessions</p>' : ''}
              </div>
            </div>
          </div>
        </div>
      `})() : `
        <div class="text-center py-32">
          <span class="material-symbols-outlined text-6xl text-zinc-300 mb-6">event_busy</span>
          <h2 class="text-3xl font-black text-zinc-900 mb-4">No Sessions Scheduled</h2>
          <p class="text-zinc-500 mb-8">Book a session with a mentor to get started</p>
          <a href="#/marketplace" class="px-8 py-4 bg-primary text-white rounded-full font-bold btn-press shadow-lg shadow-primary/20 inline-block">Browse Mentors</a>
        </div>
      `}
    </div>
  `;

  // Start countdown
  if (sessionDateTime) {
    startCountdown(sessionDateTime);
  }

  // Copy meet link
  document.getElementById('copy-meet-link')?.addEventListener('click', () => {
    const linkText = document.getElementById('meet-link-text')?.textContent || meetLink;
    navigator.clipboard.writeText(linkText).then(() => {
      showToast('Meet link copied to clipboard!', 'success');
    }).catch(() => {
      showToast('Failed to copy link', 'error');
    });
  });

  document.querySelectorAll('.booking-action').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.bookingId;
      const action = btn.dataset.action;
      const original = btn.textContent;
      const matchingButtons = document.querySelectorAll(`.booking-action[data-booking-id="${id}"]`);

      matchingButtons.forEach(actionBtn => {
        actionBtn.disabled = true;
        actionBtn.setAttribute('aria-busy', 'true');
        actionBtn.classList.add('opacity-60', 'cursor-not-allowed');
      });
      btn.textContent = action === 'accept' ? 'Accepting...' : 'Rejecting...';

      try {
        const service = await import('../services/booking.service.js');
        if (action === 'accept') await service.acceptBooking(id);
        if (action === 'reject') await service.rejectBooking(id);
        await fetchMyBookings();
        showToast(action === 'accept' ? 'Booking accepted. Jitsi link is ready.' : 'Booking rejected.', 'success');
        await renderSession(container);
      } catch (err) {
        showToast(err.message || 'Booking action failed', 'error');
        matchingButtons.forEach(actionBtn => {
          actionBtn.disabled = false;
          actionBtn.removeAttribute('aria-busy');
          actionBtn.classList.remove('opacity-60', 'cursor-not-allowed');
        });
        btn.textContent = original;
      }
    });
  });

  // Cleanup
  return () => {
    if (countdownInterval) clearInterval(countdownInterval);
  };
}

function startCountdown(targetDate) {
  if (countdownInterval) clearInterval(countdownInterval);

  function update() {
    const now = new Date();
    const diff = targetDate - now;

    if (diff <= 0) {
      document.getElementById('cd-days').textContent = '00';
      document.getElementById('cd-hours').textContent = '00';
      document.getElementById('cd-mins').textContent = '00';
      document.getElementById('cd-secs').textContent = '00';
      const btn = document.getElementById('join-meeting-btn');
      if (btn) {
        btn.classList.remove('bg-primary', 'shadow-primary/25');
        btn.classList.add('bg-emerald-500', 'animate-pulse', 'shadow-emerald-500/25');
        btn.innerHTML = '<span class="material-symbols-outlined">videocam</span> Join Now — Session is Live!';
      }
      clearInterval(countdownInterval);
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const mins = Math.floor((diff / (1000 * 60)) % 60);
    const secs = Math.floor((diff / 1000) % 60);

    const dEl = document.getElementById('cd-days');
    const hEl = document.getElementById('cd-hours');
    const mEl = document.getElementById('cd-mins');
    const sEl = document.getElementById('cd-secs');

    if (dEl) dEl.textContent = String(days).padStart(2, '0');
    if (hEl) hEl.textContent = String(hours).padStart(2, '0');
    if (mEl) mEl.textContent = String(mins).padStart(2, '0');
    if (sEl) sEl.textContent = String(secs).padStart(2, '0');
  }

  update();
  countdownInterval = setInterval(update, 1000);
}
