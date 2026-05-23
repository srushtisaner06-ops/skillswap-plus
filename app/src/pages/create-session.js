import { showToast } from '../components/toast.js';
import { createSession } from '../services/session.service.js';

const categories = [
  'Programming',
  'Design',
  'Marketing',
  'Data Science',
  'Languages',
  'Music',
  'Writing',
  'Business',
  'Photography',
  'Cooking',
  'Fitness',
  'Finance',
  'Public Speaking',
  'Leadership',
  'Other'
];

function todayValue() {
  return new Date().toISOString().split('T')[0];
}

function addMinutes(time, minutesToAdd) {
  const [hours, minutes] = time.split(':').map(Number);
  const total = hours * 60 + minutes + minutesToAdd;
  const endHours = Math.floor(total / 60);
  const endMinutes = total % 60;
  if (endHours > 23) return null;
  return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
}

function setFieldError(field, message = '') {
  const el = document.querySelector(`[data-error-for="${field}"]`);
  if (el) el.textContent = message;
}

function readForm() {
  const title = document.getElementById('session-title').value.trim();
  const description = document.getElementById('session-description').value.trim();
  const skillCategory = document.getElementById('session-category').value;
  const creditsRequired = Number(document.getElementById('session-credits').value);
  const maxParticipants = Number(document.getElementById('session-participants').value);
  const duration = Number(document.getElementById('session-duration').value);
  const date = document.getElementById('session-date').value;
  const startTime = document.getElementById('session-time').value;
  const tags = document.getElementById('session-tags').value
    .split(',')
    .map(tag => tag.trim())
    .filter(Boolean)
    .slice(0, 10);
  const endTime = startTime ? addMinutes(startTime, duration) : null;

  return { title, description, skillCategory, creditsRequired, maxParticipants, duration, date, startTime, endTime, tags };
}

function validateForm(data) {
  let valid = true;
  ['title', 'description', 'credits', 'participants', 'duration', 'date', 'time', 'tags'].forEach(key => setFieldError(key));

  if (data.title.length < 3) {
    setFieldError('title', 'Use at least 3 characters.');
    valid = false;
  }
  if (data.description.length < 10) {
    setFieldError('description', 'Describe what learners will get from the session.');
    valid = false;
  }
  if (!Number.isInteger(data.creditsRequired) || data.creditsRequired < 1 || data.creditsRequired > 100) {
    setFieldError('credits', 'Credits must be between 1 and 100.');
    valid = false;
  }
  if (!Number.isInteger(data.maxParticipants) || data.maxParticipants < 1 || data.maxParticipants > 20) {
    setFieldError('participants', 'Participants must be between 1 and 20.');
    valid = false;
  }
  if (!data.date) {
    setFieldError('date', 'Choose a date.');
    valid = false;
  }
  if (!data.startTime || !data.endTime) {
    setFieldError('time', 'Choose a start time that ends before midnight.');
    valid = false;
  }
  if (data.date && data.startTime) {
    const startsAt = new Date(`${data.date}T${data.startTime}:00`);
    if (startsAt <= new Date()) {
      setFieldError('time', 'Start time must be in the future.');
      valid = false;
    }
  }
  if (data.tags.some(tag => tag.length > 30)) {
    setFieldError('tags', 'Each tag must be 30 characters or fewer.');
    valid = false;
  }

  return valid;
}

export function renderCreateSession(container) {
  container.innerHTML = `
    <div class="min-h-screen px-4 sm:px-6 lg:px-12 py-12 max-w-[1100px] mx-auto">
      <div class="mb-10">
        <nav class="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-4">
          <a href="#/dashboard" class="hover:text-primary">Dashboard</a>
          <span class="material-symbols-outlined text-[10px]">chevron_right</span>
          <span class="text-primary">Create Session</span>
        </nav>
        <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <h1 class="text-4xl lg:text-5xl font-black tracking-tight text-zinc-900 mb-3">Create a real session.</h1>
            <p class="text-zinc-500 text-base lg:text-lg max-w-2xl">Publish a session to the marketplace. Learners can request a booking, credits are reserved in escrow, and you get paid after completion.</p>
          </div>
          <a href="#/marketplace" class="self-start lg:self-auto bg-white border border-zinc-200 px-5 py-3 rounded-full text-sm font-black text-zinc-700 hover:bg-zinc-50">View Marketplace</a>
        </div>
      </div>

      <form id="create-session-form" class="bg-white rounded-2xl border border-zinc-100 shadow-sm p-5 sm:p-8 lg:p-10 space-y-8">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="lg:col-span-2">
            <label class="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2" for="session-title">Session Title</label>
            <input id="session-title" class="w-full p-4 bg-zinc-50 rounded-xl border border-zinc-100 focus:bg-white focus:border-primary/30 outline-none text-sm font-medium" maxlength="100" placeholder="Intro to React Hooks" required />
            <p class="text-xs text-red-500 mt-1 min-h-4" data-error-for="title"></p>
          </div>

          <div class="lg:col-span-2">
            <label class="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2" for="session-description">Description</label>
            <textarea id="session-description" class="w-full min-h-36 p-4 bg-zinc-50 rounded-xl border border-zinc-100 focus:bg-white focus:border-primary/30 outline-none text-sm font-medium resize-y" maxlength="2000" placeholder="Explain who this is for, what learners will practice, and what they should prepare." required></textarea>
            <p class="text-xs text-red-500 mt-1 min-h-4" data-error-for="description"></p>
          </div>

          <div>
            <label class="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2" for="session-category">Skill Category</label>
            <select id="session-category" class="w-full p-4 bg-zinc-50 rounded-xl border border-zinc-100 focus:bg-white focus:border-primary/30 outline-none text-sm font-medium">
              ${categories.map(category => `<option value="${category}">${category}</option>`).join('')}
            </select>
          </div>

          <div>
            <label class="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2" for="session-credits">Credits Required</label>
            <input id="session-credits" type="number" min="1" max="100" value="5" class="w-full p-4 bg-zinc-50 rounded-xl border border-zinc-100 focus:bg-white focus:border-primary/30 outline-none text-sm font-medium" required />
            <p class="text-xs text-red-500 mt-1 min-h-4" data-error-for="credits"></p>
          </div>

          <div>
            <label class="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2" for="session-date">Date</label>
            <input id="session-date" type="date" min="${todayValue()}" class="w-full p-4 bg-zinc-50 rounded-xl border border-zinc-100 focus:bg-white focus:border-primary/30 outline-none text-sm font-medium" required />
            <p class="text-xs text-red-500 mt-1 min-h-4" data-error-for="date"></p>
          </div>

          <div>
            <label class="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2" for="session-time">Start Time</label>
            <input id="session-time" type="time" class="w-full p-4 bg-zinc-50 rounded-xl border border-zinc-100 focus:bg-white focus:border-primary/30 outline-none text-sm font-medium" required />
            <p class="text-xs text-red-500 mt-1 min-h-4" data-error-for="time"></p>
          </div>

          <div>
            <label class="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2" for="session-duration">Duration</label>
            <select id="session-duration" class="w-full p-4 bg-zinc-50 rounded-xl border border-zinc-100 focus:bg-white focus:border-primary/30 outline-none text-sm font-medium">
              <option value="30">30 minutes</option>
              <option value="45">45 minutes</option>
              <option value="60" selected>60 minutes</option>
              <option value="90">90 minutes</option>
              <option value="120">120 minutes</option>
            </select>
            <p class="text-xs text-red-500 mt-1 min-h-4" data-error-for="duration"></p>
          </div>

          <div>
            <label class="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2" for="session-participants">Max Participants</label>
            <input id="session-participants" type="number" min="1" max="20" value="1" class="w-full p-4 bg-zinc-50 rounded-xl border border-zinc-100 focus:bg-white focus:border-primary/30 outline-none text-sm font-medium" required />
            <p class="text-xs text-red-500 mt-1 min-h-4" data-error-for="participants"></p>
          </div>

          <div class="lg:col-span-2">
            <label class="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2" for="session-tags">Tags</label>
            <input id="session-tags" class="w-full p-4 bg-zinc-50 rounded-xl border border-zinc-100 focus:bg-white focus:border-primary/30 outline-none text-sm font-medium" placeholder="React, Hooks, Frontend" />
            <p class="text-xs text-zinc-400 mt-1">Comma-separated, up to 10 tags.</p>
            <p class="text-xs text-red-500 mt-1 min-h-4" data-error-for="tags"></p>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-zinc-100">
          <p class="text-xs text-zinc-500">Once published, learners can reserve credits and request your approval.</p>
          <button id="create-session-submit" type="submit" class="bg-primary text-white px-8 py-4 rounded-full text-sm font-black shadow-lg shadow-primary/20 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            <span class="material-symbols-outlined text-sm">add_circle</span>
            Publish Session
          </button>
        </div>
      </form>
    </div>
  `;

  document.getElementById('create-session-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = readForm();
    if (!validateForm(data)) {
      showToast('Please fix the highlighted fields.', 'warning');
      return;
    }

    const btn = document.getElementById('create-session-submit');
    const original = btn.innerHTML;
    btn.disabled = true;
    btn.setAttribute('aria-busy', 'true');
    btn.innerHTML = '<span class="material-symbols-outlined animate-spin text-sm">refresh</span> Publishing...';

    try {
      await createSession({
        title: data.title,
        description: data.description,
        skillCategory: data.skillCategory,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        creditsRequired: data.creditsRequired,
        maxParticipants: data.maxParticipants,
        tags: data.tags
      });

      showToast('Session published to the marketplace.', 'success');
      window.location.hash = '#/dashboard';
    } catch (err) {
      showToast(err.message || 'Failed to create session.', 'error');
      btn.disabled = false;
      btn.removeAttribute('aria-busy');
      btn.innerHTML = original;
    }
  });
}
