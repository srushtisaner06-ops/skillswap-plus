import { store } from '../state.js';
import { showToast } from '../components/toast.js';
import { renderEmptyState, renderErrorState } from '../components/status-state.js';

const showcaseMentors = [
  {
    name: 'Elena Rossi',
    role: 'Product design mentor',
    skills: ['Design Systems', 'Figma'],
    avatar: 'https://ui-avatars.com/api/?name=Elena+Rossi&background=7c3aed&color=fff'
  },
  {
    name: 'Marcus Thorne',
    role: 'Full-stack mentor',
    skills: ['React', 'DevOps'],
    avatar: 'https://ui-avatars.com/api/?name=Marcus+Thorne&background=0284c7&color=fff'
  },
  {
    name: 'Sarah Jenkins',
    role: 'Startup mentor',
    skills: ['Fundraising', 'Product Strategy'],
    avatar: 'https://ui-avatars.com/api/?name=Sarah+Jenkins&background=059669&color=fff'
  }
];

function renderShowcaseMentor(mentor) {
  return `
    <div class="bg-white rounded-2xl border border-zinc-100 p-6 shadow-sm">
      <div class="flex items-center gap-4 mb-5">
        <img class="w-14 h-14 rounded-xl object-cover" src="${mentor.avatar}" alt="${mentor.name}" />
        <div>
          <h3 class="font-black text-zinc-900">${mentor.name}</h3>
          <p class="text-xs text-zinc-500">${mentor.role}</p>
        </div>
      </div>
      <div class="flex flex-wrap gap-2 mb-5">
        ${mentor.skills.map(skill => `<span class="bg-zinc-100 text-zinc-600 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase">${skill}</span>`).join('')}
      </div>
      <button class="scroll-live-sessions w-full bg-primary text-white py-3 rounded-full text-xs font-black shadow-lg shadow-primary/20">
        View Live Sessions
      </button>
    </div>
  `;
}

function renderSessionCard(session) {
  const currentUserId = store.getUserSafe()?._id;
  const hostId = session.host?._id || session.host;
  const participantIds = (session.participants || []).map((participant) => participant?._id || participant);
  const isOwnSession = currentUserId && hostId && String(hostId) === String(currentUserId);
  const isAlreadyParticipant = currentUserId && participantIds.some((id) => String(id) === String(currentUserId));
  const hostName = session.host?.name || 'Mentor';
  const hostAvatar = session.host?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(hostName)}&background=6927ef&color=fff`;
  const sessionDate = session.date ? new Date(session.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }) : 'TBD';
  const spotsLeft = Math.max((session.maxParticipants || 1) - ((session.participants || []).length), 0);
  const bookingDisabled = isOwnSession || isAlreadyParticipant || spotsLeft <= 0;
  const bookingLabel = isOwnSession
    ? 'Your Session'
    : isAlreadyParticipant
      ? 'Already Joined'
      : spotsLeft <= 0
        ? 'Full'
        : 'Request Booking';

  return `
    <article class="bg-white rounded-2xl border border-zinc-100 p-6 shadow-sm hover:shadow-xl hover:shadow-zinc-200/40 transition-all">
      <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
        <div class="flex items-center gap-4">
          <img class="w-12 h-12 rounded-xl object-cover" src="${hostAvatar}" alt="${hostName}" />
          <div>
            <h3 class="font-black text-zinc-900">${session.title}</h3>
            <p class="text-xs text-zinc-500">${hostName} • ${session.skillCategory || 'General'}</p>
          </div>
        </div>
        <span class="self-start bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-[9px] font-black uppercase">${session.status}</span>
      </div>
      <p class="text-sm text-zinc-500 line-clamp-2 mb-5">${session.description || 'No description provided.'}</p>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5 text-xs">
        <div class="bg-zinc-50 rounded-xl p-3">
          <p class="text-zinc-400 font-black uppercase text-[9px]">Date</p>
          <p class="font-bold text-zinc-800">${sessionDate}</p>
        </div>
        <div class="bg-zinc-50 rounded-xl p-3">
          <p class="text-zinc-400 font-black uppercase text-[9px]">Time</p>
          <p class="font-bold text-zinc-800">${session.startTime || '--:--'}-${session.endTime || '--:--'}</p>
        </div>
        <div class="bg-zinc-50 rounded-xl p-3">
          <p class="text-zinc-400 font-black uppercase text-[9px]">Escrow</p>
          <p class="font-bold text-primary">${session.creditsRequired} credits</p>
        </div>
        <div class="bg-zinc-50 rounded-xl p-3">
          <p class="text-zinc-400 font-black uppercase text-[9px]">Spots</p>
          <p class="font-bold text-zinc-800">${spotsLeft} left</p>
        </div>
      </div>
      <button class="book-session-btn w-full bg-primary text-white py-3 rounded-full text-sm font-black shadow-lg shadow-primary/20 disabled:opacity-60 disabled:cursor-not-allowed" data-session-id="${session._id}" ${bookingDisabled ? 'disabled' : ''}>
        ${bookingLabel}
      </button>
    </article>
  `;
}

export async function renderMarketplace(container) {
  const credits = store.get('credits') || 0;

  container.innerHTML = `
    <div class="min-h-screen px-4 sm:px-6 lg:px-12 py-12 max-w-[1400px] mx-auto">
      <header class="mb-12 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <nav class="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-4">
            <span>Marketplace</span>
            <span class="material-symbols-outlined text-[10px]">chevron_right</span>
            <span class="text-primary">Real Bookings</span>
          </nav>
          <h1 class="text-4xl lg:text-5xl font-black tracking-tight text-zinc-900 mb-4">Book real skill sessions.</h1>
          <p class="text-zinc-500 text-base lg:text-lg max-w-2xl leading-relaxed">Credits are reserved in escrow when you request a session and released to the mentor only after completion.</p>
        </div>
        <div class="bg-white px-6 py-4 rounded-2xl shadow-sm border border-zinc-100">
          <span class="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Available Balance</span>
          <span class="text-xl font-black text-zinc-900" id="marketplace-credits">${credits} Credits</span>
        </div>
      </header>

      <section class="mb-12 rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4 flex items-start gap-3">
        <span class="material-symbols-outlined text-emerald-600">verified</span>
        <div>
          <p class="text-sm font-black text-emerald-800">Backend-driven booking lifecycle</p>
          <p class="text-xs text-emerald-700 mt-1">Request → escrow reserved → mentor accepts → Jitsi link generated → completion releases credits.</p>
        </div>
      </section>

      <section class="mb-14">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-black text-zinc-900">Mentor Highlights</h2>
          <span class="text-xs text-zinc-400 font-bold">Book from live sessions below</span>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          ${showcaseMentors.map(renderShowcaseMentor).join('')}
        </div>
      </section>

      <section id="api-sessions-section">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-black text-zinc-900">Available Sessions</h2>
          <span class="text-xs text-zinc-400 font-bold" id="sessions-count">Loading...</span>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6" id="api-sessions-grid">
          <div class="h-48 bg-zinc-100 rounded-2xl animate-pulse"></div>
          <div class="h-48 bg-zinc-100 rounded-2xl animate-pulse"></div>
        </div>
      </section>
    </div>
  `;

  document.querySelectorAll('.scroll-live-sessions').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('api-sessions-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  await loadApiSessions();

  return store.on('credits', (c) => {
    const el = document.getElementById('marketplace-credits');
    if (el) el.textContent = `${c} Credits`;
  });
}

async function loadApiSessions() {
  const grid = document.getElementById('api-sessions-grid');
  const countEl = document.getElementById('sessions-count');

  try {
    const { getSessions } = await import('../services/session.service.js');
    const data = await getSessions({ status: 'open' });
    const sessions = data?.sessions || [];

    if (countEl) countEl.textContent = `${sessions.length} session${sessions.length === 1 ? '' : 's'} available`;
    if (!grid) return;

    if (sessions.length === 0) {
      grid.innerHTML = `
        <div class="lg:col-span-2">
          ${renderEmptyState({
            icon: 'event_busy',
            title: 'No open sessions right now',
            message: 'When mentors publish sessions, they will appear here with real booking and escrow support.',
            actionHref: '#/create-session',
            actionLabel: 'Create a session'
          })}
        </div>
      `;
      return;
    }

    grid.innerHTML = sessions.map(renderSessionCard).join('');
    document.querySelectorAll('.book-session-btn').forEach(btn => {
      btn.addEventListener('click', async () => handleBookSession(btn));
    });
  } catch (err) {
    if (countEl) countEl.textContent = 'Error loading';
    if (grid) {
      grid.innerHTML = `
        <div class="lg:col-span-2">
          ${renderErrorState({
            title: 'Unable to fetch sessions',
            message: 'Check your connection or API server, then try again.',
            retryId: 'retry-sessions'
          })}
        </div>
      `;
      document.getElementById('retry-sessions')?.addEventListener('click', loadApiSessions);
    }
  }
}

async function handleBookSession(btn) {
  if (btn.dataset.pending === 'true') return;

  const sessionId = btn.dataset.sessionId;
  const originalText = btn.textContent;
  btn.dataset.pending = 'true';
  btn.disabled = true;
  btn.setAttribute('aria-busy', 'true');
  btn.textContent = 'Reserving escrow...';

  try {
    const { createBooking } = await import('../services/booking.service.js');
    await createBooking(sessionId);
    const { fetchProfile, fetchMyBookings } = await import('../services/data.layer.js');
    await Promise.all([fetchProfile(), fetchMyBookings()]);
    btn.textContent = 'Requested';
    btn.classList.remove('bg-primary');
    btn.classList.add('bg-zinc-300', 'text-zinc-600');
    showToast('Booking requested. Credits are now reserved in escrow.', 'success');
  } catch (err) {
    btn.disabled = false;
    btn.removeAttribute('aria-busy');
    delete btn.dataset.pending;
    btn.textContent = originalText;
    showToast(err.message || 'Failed to request booking', 'error');
  }
}
