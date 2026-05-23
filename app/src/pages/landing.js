/* ═══════════════════════════════════════════
   SkillSwap+ — Landing Page
   With real Login / Register form tabs
   ═══════════════════════════════════════════ */

import { register, login, googleLogin, isAuthenticated } from '../services/auth.service.js';
import { getProfile } from '../services/user.service.js';
import { store } from '../state.js';
import { showToast } from '../components/toast.js';

export function renderLanding(container) {
  // If already authenticated, redirect to dashboard
  if (isAuthenticated()) {
    window.location.hash = '/dashboard';
    return;
  }

  container.innerHTML = `
    <!-- Top Navigation -->
    <nav class="fixed top-0 w-full z-50 bg-[#fcf9f8]/70 backdrop-blur-xl shadow-[0_20px_40px_rgba(28,27,27,0.03)] border-b border-surface-variant/20">
      <div class="flex justify-between items-center h-20 px-8 w-full max-w-full mx-auto">
        <div class="flex items-center gap-8">
          <span class="text-xl font-black tracking-tighter text-[#1c1b1b]">SkillSwap+</span>
          <div class="hidden md:flex gap-2 items-center">
            <a class="text-[#6927ef] font-semibold bg-white/50 rounded-full px-4 py-2 text-sm" href="#/marketplace">Browse</a>
            <a class="text-[#1c1b1b]/60 hover:text-[#1c1b1b] px-4 py-2 transition-colors text-sm font-medium" href="#/community">Community</a>
            <a class="text-[#1c1b1b]/60 hover:text-[#1c1b1b] px-4 py-2 transition-colors text-sm font-medium" href="#/dashboard">Dashboard</a>
          </div>
        </div>
        <div class="flex items-center gap-4">
          <a href="#/mentor-apply" class="px-6 py-2.5 rounded-full text-[#1c1b1b]/60 hover:bg-white/30 transition-all text-sm font-medium">Become a Mentor</a>
          <a href="#" id="nav-get-started" class="px-6 py-2.5 rounded-full bg-primary text-white font-bold btn-press shadow-lg shadow-primary/20 text-sm">Get Started</a>
        </div>
      </div>
    </nav>

    <main class="pt-20">
      <!-- Hero Section -->
      <section class="relative min-h-[calc(100vh-80px)] flex items-center justify-center overflow-hidden px-8 py-16">
        <div class="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]"></div>
        <div class="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-secondary/5 rounded-full blur-[100px]"></div>
        <div class="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center z-10">
          <div class="space-y-10 stagger-children">
            <h1 class="text-6xl md:text-7xl xl:text-8xl tracking-tight leading-[0.85]">
              <div class="flex flex-col gap-1">
                <span class="text-[#111] font-black">Learn</span>
                <span class="text-[#111] font-black">Anything.</span>
                <span class="text-[#111] font-black">Teach Everything.</span>
                <span class="gradient-text font-[900] text-[1.1em] mt-2">Earn Credits.</span>
              </div>
            </h1>
            <div class="space-y-4">
              <p class="text-2xl text-on-surface-variant max-w-xl leading-relaxed font-medium">
                Learn without money. Teach to earn. No cash, just skills. Earn credits by teaching and spend them to master something new.
              </p>
              <div class="flex flex-wrap gap-3">
                <div class="flex items-center gap-2 bg-white/60 backdrop-blur-sm border border-surface-variant/30 px-4 py-2 rounded-full shadow-sm">
                  <span class="material-symbols-outlined material-fill text-primary text-sm">swap_horiz</span>
                  <span class="text-sm font-bold text-on-surface">10,000+ exchanges completed</span>
                </div>
                <div class="flex items-center gap-2 bg-white/60 backdrop-blur-sm border border-surface-variant/30 px-4 py-2 rounded-full shadow-sm">
                  <span class="material-symbols-outlined material-fill text-secondary text-sm">groups</span>
                  <span class="text-sm font-bold text-on-surface">5,000+ active learners</span>
                </div>
              </div>
            </div>
            <div class="flex flex-col sm:flex-row gap-4">
              <a href="#" id="hero-get-started" class="px-10 py-5 bg-primary text-white rounded-full font-black text-lg shadow-xl shadow-primary/25 hover:-translate-y-1 transition-all btn-press inline-block text-center">
                Get Started
              </a>
              <a href="#/marketplace" class="px-10 py-5 bg-white text-on-surface border border-surface-variant rounded-full font-bold text-lg hover:bg-surface-container-low transition-all btn-press inline-block text-center">
                Explore Skills
              </a>
            </div>
          </div>

          <!-- Auth Card -->
          <div class="flex justify-center lg:justify-end slide-in-right">
            <div class="glass-panel p-10 rounded-xl w-full max-w-md border border-white/40 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)]">
              <div class="mb-6">
                <h2 class="text-2xl font-black text-on-surface">Begin Your Journey</h2>
                <div class="mt-2 inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full">
                  <span class="material-symbols-outlined material-fill text-sm">stars</span>
                  <span class="text-xs font-bold uppercase tracking-wider">Get 10 free credits on signup</span>
                </div>
              </div>

              <!-- Tab Switcher -->
              <div class="flex bg-zinc-100 rounded-full p-1 mb-6" id="auth-tabs" role="tablist">
                <button class="auth-tab flex-1 py-2.5 rounded-full text-sm font-bold transition-all bg-white text-zinc-900 shadow-sm" data-tab="register" role="tab" aria-selected="true" aria-controls="register-form" tabindex="0">Sign Up</button>
                <button class="auth-tab flex-1 py-2.5 rounded-full text-sm font-bold transition-all text-zinc-400" data-tab="login" role="tab" aria-selected="false" aria-controls="login-form" tabindex="-1">Log In</button>
              </div>

              <!-- Register Form -->
              <form class="space-y-4" id="register-form" role="tabpanel" aria-labelledby="auth-tabs">
                <div>
                  <label class="text-[10px] uppercase tracking-[0.1em] text-on-surface-variant font-black block mb-2 px-1">Full Name</label>
                  <input id="reg-name" class="w-full p-4 bg-surface-container-low/50 rounded-lg border border-transparent focus:border-primary/20 focus:bg-white transition-all outline-none" placeholder="Alex Rivera" type="text" required />
                </div>
                <div>
                  <label class="text-[10px] uppercase tracking-[0.1em] text-on-surface-variant font-black block mb-2 px-1">Email Address</label>
                  <input id="reg-email" class="w-full p-4 bg-surface-container-low/50 rounded-lg border border-transparent focus:border-primary/20 focus:bg-white transition-all outline-none" placeholder="alex@skillswap.plus" type="email" required />
                </div>
                <div>
                  <label class="text-[10px] uppercase tracking-[0.1em] text-on-surface-variant font-black block mb-2 px-1">Password</label>
                  <input id="reg-password" class="w-full p-4 bg-surface-container-low/50 rounded-lg border border-transparent focus:border-primary/20 focus:bg-white transition-all outline-none" placeholder="Min 6 characters" type="password" required minlength="6" />
                </div>
                <div>
                  <label class="text-[10px] uppercase tracking-[0.1em] text-on-surface-variant font-black block mb-2 px-1">Confirm Password</label>
                  <input id="reg-confirm-password" class="w-full p-4 bg-surface-container-low/50 rounded-lg border border-transparent focus:border-primary/20 focus:bg-white transition-all outline-none" placeholder="Re-enter password" type="password" required minlength="6" />
                </div>
                <button type="submit" id="register-btn" class="w-full py-4 bg-primary text-white font-black text-lg rounded-full shadow-lg shadow-primary/30 mt-4 btn-press flex items-center justify-center gap-2">
                  Join Now
                </button>
                <p class="text-xs text-center text-outline mt-4">Join 50,000+ creators sharing knowledge today.</p>
              </form>

              <!-- Login Form (hidden by default) -->
              <form class="space-y-4 hidden" id="login-form" role="tabpanel" aria-labelledby="auth-tabs" aria-hidden="true">
                <div>
                  <label class="text-[10px] uppercase tracking-[0.1em] text-on-surface-variant font-black block mb-2 px-1">Email Address</label>
                  <input id="login-email" class="w-full p-4 bg-surface-container-low/50 rounded-lg border border-transparent focus:border-primary/20 focus:bg-white transition-all outline-none" placeholder="alex@skillswap.plus" type="email" required />
                </div>
                <div>
                  <label class="text-[10px] uppercase tracking-[0.1em] text-on-surface-variant font-black block mb-2 px-1">Password</label>
                  <input id="login-password" class="w-full p-4 bg-surface-container-low/50 rounded-lg border border-transparent focus:border-primary/20 focus:bg-white transition-all outline-none" placeholder="Enter your password" type="password" required />
                </div>
                <button type="submit" id="login-btn" class="w-full py-4 bg-primary text-white font-black text-lg rounded-full shadow-lg shadow-primary/30 mt-4 btn-press flex items-center justify-center gap-2">
                  Log In
                </button>
                <p class="text-xs text-center text-outline mt-4">Welcome back! Enter your credentials to continue.</p>
              </form>

              <!-- Divider -->
              <div class="flex items-center gap-4 my-5">
                <div class="flex-1 h-px bg-zinc-200"></div>
                <span class="text-xs text-zinc-400 font-bold uppercase tracking-wider">or</span>
                <div class="flex-1 h-px bg-zinc-200"></div>
              </div>

              <!-- Google Sign-In -->
              <button id="google-signin-btn" class="w-full py-4 bg-white text-zinc-700 font-bold text-base rounded-full shadow-md border border-zinc-200 btn-press flex items-center justify-center gap-3 hover:shadow-lg hover:bg-zinc-50 transition-all">
                <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#34A853" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#FBBC05" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
                Sign in with Google
              </button>
              <p class="text-[11px] text-center text-zinc-400 mt-3 flex items-center justify-center gap-1">
                <span class="material-symbols-outlined text-emerald-500 text-xs">verified</span>
                Secure authentication powered by Google
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- How It Works -->
      <section class="py-24 bg-surface-container-low/40">
        <div class="max-w-7xl mx-auto px-8">
          <div class="flex flex-col md:flex-row justify-between items-end mb-20 gap-4 text-center md:text-left">
            <div class="w-full md:w-auto">
              <span class="text-xs uppercase tracking-[0.3em] text-primary font-black">The Process</span>
              <h2 class="text-5xl font-black text-on-surface mt-4 tracking-tight">How It Works</h2>
            </div>
            <p class="text-on-surface-variant max-w-md text-lg leading-relaxed">Our ecosystem is built on the principle of mutual evolution. Every interaction adds value.</p>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-10 stagger-children">
            <div class="group bg-white p-12 rounded-[2.5rem] border border-surface-variant/20 shadow-sm card-hover">
              <div class="w-20 h-20 rounded-2xl bg-primary/5 flex items-center justify-center mb-10 group-hover:scale-110 transition-transform duration-500">
                <span class="material-symbols-outlined text-primary text-4xl">record_voice_over</span>
              </div>
              <h3 class="text-3xl font-black mb-6 text-on-surface">Teach</h3>
              <p class="text-on-surface-variant leading-relaxed text-lg">Share your expertise—from AI to pottery—and earn credits instantly for every session you host.</p>
              <div class="mt-8 pt-8 border-t border-surface-container flex items-center gap-2 text-primary font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                <span>List a skill</span>
                <span class="material-symbols-outlined text-sm">arrow_forward</span>
              </div>
            </div>
            <div class="group bg-white p-12 rounded-[2.5rem] border border-surface-variant/20 shadow-sm card-hover">
              <div class="w-20 h-20 rounded-2xl bg-secondary/5 flex items-center justify-center mb-10 group-hover:scale-110 transition-transform duration-500">
                <span class="material-symbols-outlined text-secondary text-4xl">school</span>
              </div>
              <h3 class="text-3xl font-black mb-6 text-on-surface">Learn</h3>
              <p class="text-on-surface-variant leading-relaxed text-lg">Spend credits to unlock 1-on-1 sessions with verified experts. No cash needed.</p>
              <div class="mt-8 pt-8 border-t border-surface-container flex items-center gap-2 text-secondary font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                <span>Find a mentor</span>
                <span class="material-symbols-outlined text-sm">arrow_forward</span>
              </div>
            </div>
            <div class="group bg-white p-12 rounded-[2.5rem] border border-surface-variant/20 shadow-sm card-hover">
              <div class="w-20 h-20 rounded-2xl bg-violet-50 flex items-center justify-center mb-10 group-hover:scale-110 transition-transform duration-500">
                <span class="material-symbols-outlined text-violet-600 text-4xl">query_stats</span>
              </div>
              <h3 class="text-3xl font-black mb-6 text-on-surface">Grow</h3>
              <p class="text-on-surface-variant leading-relaxed text-lg">Build a verified portfolio of skills. Each swap enhances your standing in the community.</p>
              <div class="mt-8 pt-8 border-t border-surface-container flex items-center gap-2 text-violet-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                <span>View progress</span>
                <span class="material-symbols-outlined text-sm">arrow_forward</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Trending Exchanges -->
      <section class="py-24 px-8 max-w-7xl mx-auto">
        <div class="text-center mb-20">
          <h2 class="text-5xl font-black text-on-surface tracking-tight">Trending Exchanges</h2>
          <p class="text-on-surface-variant mt-6 text-xl">Discover what your peers are trading today</p>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          ${[
      { skill1: 'UI/UX', skill2: 'Python', sessions: 12, badge: 'High Demand', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDs-lVDt5rC158mkldd5uNXuv0G3WHCZlYD8V_awMLT4g8_YSABNP5YtRUd-4BJhN9hCtT2OXM6S_sN9ZYmJ98hp2yBKoHRlxtfacVegQmg1LwzihSOUQIQfY-eqp4hPVUHvBudyLT9GvWZQBuuYMVzMxONvkJNho7y_KlJtxFROw1NFTvVy_ATBIRzBsJAid-zI9QgLDpLM0XvbpJjOI2b2zXUDzcztWN7zJJ963dgJMYvaNdpFjnp9Z2ay2lT4avU7m491OcE7w' },
      { skill1: 'Fine Art', skill2: 'Marketing', sessions: 8, img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC3oV0PjG1rUBLjWXHIH7gUt2rmuijvbK02trbgpbNcQN5LEJsJEorykL3J2tV5l8rcaqESWwdNL1Y5KRJK26F1bERjFw8Ma3JMf_wlDAXcPjAEsQqANorf8XMKm7NHYF6_m-QgIkeX0adlvKbLq8jLuNsLVxAf1IioC2T0kBoxGLodtzfV1-LvfrZKFolixtoIwcG_iucLc50lLYD83anI93t4yosTNB23xMa_eYw1y5vbVtwNtBDt3eyp6ZiP8vN3TvbMyIkwhQ' },
      { skill1: 'SQL', skill2: 'Copywriting', sessions: 15, img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCClHAiDZ6yvotw29PBVP20gW2n7hZrUCNjdLd4fBKcSIt8QlWjw9pfjQWV3UdyUEbpP_KnsrLzHHfef7ADnbnCmVBlzraob6JxVLdoQRnC0LlVKWo7U7W9AsmLeenXW0zuNrUcP9TymUqpyI2xuYPgLD0EwMVQOWnUaDV30NmZ16epcxgC8gMFHkjLI7I_tsdAID2F3wu5rq-kL07PzSaVSStVKWrWdRUl_efjkiNw84R4LBQAcxVtO92AQ-K4zEZOO14cSvUxkg' },
      { skill1: 'Fitness', skill2: 'Finance', sessions: 21, img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDymVAtYxaUiI0klvl3MrGaLz5Zga2zwZhJJAtKb4mkwsEmNJUncCB8rwXAVdhZj3BU1aY7ZxZIX0n2gW8zyPuVEL9vSbtpDH9q3bOy839VFlNU_wFuY4SMrWCvDjd-CM7ZVx10qd8gPetz1D4sa8rlm5ckUOVqgvWjg_lYrduZDEC8-yA2-7sCXd5jxRIWW_izUfRnw2j0Ma_Uj82aCYasuCl118OgkV8Uep39lT_7GAF3h44y49YYGdwt-vdeJpvHxfWZR_GXTA' }
    ].map(card => `
            <div class="group relative aspect-[4/5] overflow-hidden rounded-3xl bg-surface-container shadow-lg card-hover">
              <img class="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80" src="${card.img}" alt="${card.skill1} exchange" />
              <div class="absolute inset-0 bg-gradient-to-t from-on-surface via-on-surface/40 to-transparent"></div>
              <div class="absolute bottom-0 left-0 p-8 w-full">
                ${card.badge ? `<span class="bg-primary/90 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black text-white uppercase tracking-[0.15em] mb-4 inline-block">${card.badge}</span>` : ''}
                <p class="text-white font-black text-2xl">${card.skill1} <span class="text-primary-container">↔</span> ${card.skill2}</p>
                <p class="text-white/60 text-sm mt-2 flex items-center gap-2">
                  <span class="material-symbols-outlined text-sm">group</span> ${card.sessions} active sessions
                </p>
              </div>
            </div>
          `).join('')}
        </div>
      </section>

      <!-- Testimonials -->
      <section class="py-24 bg-surface-container-lowest overflow-hidden">
        <div class="max-w-7xl mx-auto px-8 mb-16 text-center md:text-left">
          <h2 class="text-5xl font-black tracking-tight">Trusted by the Community</h2>
        </div>
        <div class="flex gap-8 px-8 overflow-x-auto no-scrollbar pb-12 snap-x">
          ${[
      { name: 'Sarah Chen', role: 'Product Designer', quote: '"SkillSwap+ allowed me to trade my design mentorship for high-level Python lessons. It\'s the most frictionless learning experience I\'ve ever had."', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCmsNl-IUnPO981prGkehS44Gq8wXNSLqFm_zuCrMly0-40i_b8_yspbo6W7SLQ80zLVTvfa58Bkvy6MVGG9Kdgupe6jbiKff6gW9QudyvUu4dsCqp6V8uhyfvdMLQfmw2xAurorTY5fUljFdAP_XE6lRrDJqVh8PDfrDxp9usw9l08q66-lpP8WMgWxBbQ5BIbMrjyqpziYsS2aV5YKef24I4ZKLIomNh_dliV0zCIBhXra92jpSFB8JwCqtZHyGotODEu1HO8Rw' },
      { name: 'Marcus Thorne', role: 'Full-stack Dev', quote: '"The quality of masters here is insane. I learned more about public speaking in two swaps than I did in a full college semester."', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDTK6FnIAvdLPGSb0rsoNtz5XhqoJ-UiJuCyVjtiJyxM0dze2oG5xWjiKlF_DK0uZpk9JzathC0ElD4pri5EPwE2DpiPietdTEPmBlsEak-ME0e0aFnY2cN4ZQbJ65DBNzeYFgpxDrmKULXv-87JoVzXvMtf4zGp3eP2pyZW6bWA1a8VQljFPwlcac-XJ3DvEkYfNNFQA-tuFSH1yzBeIvCeVMA-vOZCaQncWv9pmrCLRayky9pFtrFWsgJOADniPNS7-FvEvJFlA' },
      { name: 'Elena Rodriguez', role: 'Marketing Lead', quote: '"Finally, a platform that values expertise as a currency. The community is supportive and the UX is just stunning."', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBC_g91qBz6t9Mg-6GlLrsCqjZiIBSDoaecFdazAlQJCIdXXtVlTOhLcAv2qVzj6CF_YIQ2mCc1i8cZKkczkKXoBeOJl2xsF6bvIb_f6vDZ-taFHEGh1i8zPIYeweIQkweCVUcyem61A7tFSVaGSTN6sP6Ig4U0rZ68Vhx5EjhrWfmO3aH-gATtOBFh15HbRKCYu_tiU8lXDOXmVFauRdiSF_hf19XSKJzVYmkS2Dfd4BwrzSjy9L1iSP_xFZMOaF7Eb4l2WZCPHQ' }
    ].map(t => `
            <div class="min-w-[450px] bg-white p-10 rounded-3xl snap-center border border-surface-variant/10 shadow-sm">
              <div class="flex items-center gap-5 mb-8">
                <img class="w-16 h-16 rounded-full object-cover ring-4 ring-primary/5" src="${t.img}" alt="${t.name}" />
                <div>
                  <p class="font-black text-lg">${t.name}</p>
                  <p class="text-sm text-on-surface-variant">${t.role}</p>
                </div>
              </div>
              <div class="flex gap-1 text-amber-400 mb-6">
                ${'<span class="material-symbols-outlined material-fill">star</span>'.repeat(5)}
              </div>
              <p class="text-xl italic text-on-surface leading-relaxed font-medium">${t.quote}</p>
            </div>
          `).join('')}
        </div>
      </section>
    </main>

    <!-- Footer -->
    <footer class="w-full py-16 bg-white border-t border-surface-variant/10">
      <div class="flex flex-col md:flex-row justify-between items-start px-12 gap-16 max-w-7xl mx-auto">
        <div class="max-w-xs">
          <span class="text-2xl font-black text-[#1c1b1b] mb-6 block tracking-tighter">SkillSwap+</span>
          <p class="text-zinc-500 leading-relaxed mb-8">Empowering the world to share mastery without barriers.</p>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-12 flex-1">
          <div class="flex flex-col gap-4">
            <span class="text-on-surface font-black text-xs uppercase tracking-[0.2em]">Platform</span>
            <a class="text-zinc-500 hover:text-primary transition-colors text-sm" href="#/marketplace">Browse Skills</a>
            <a class="text-zinc-500 hover:text-primary transition-colors text-sm" href="#/community">Community Forum</a>
          </div>
          <div class="flex flex-col gap-4">
            <span class="text-on-surface font-black text-xs uppercase tracking-[0.2em]">Company</span>
            <a class="text-zinc-500 hover:text-primary transition-colors text-sm" href="#">Privacy Policy</a>
            <a class="text-zinc-500 hover:text-primary transition-colors text-sm" href="#">Terms of Service</a>
          </div>
          <div class="flex flex-col gap-4">
            <span class="text-on-surface font-black text-xs uppercase tracking-[0.2em]">Support</span>
            <a class="text-zinc-500 hover:text-primary transition-colors text-sm" href="#">Help Center</a>
            <a class="text-zinc-500 hover:text-primary transition-colors text-sm" href="#">Contact Us</a>
          </div>
        </div>
      </div>
      <div class="mt-16 pt-8 px-12 border-t border-surface-variant/10 text-center">
        <p class="text-zinc-400 text-sm">© 2026 SkillSwap+. All rights reserved.</p>
      </div>
    </footer>
  `;

  // ─── Tab Switching Logic ────────────────
  const tabs = document.querySelectorAll('.auth-tab');
  const registerForm = document.getElementById('register-form');
  const loginForm = document.getElementById('login-form');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      tabs.forEach(t => {
        t.classList.remove('bg-white', 'text-zinc-900', 'shadow-sm');
        t.classList.add('text-zinc-400');
        t.setAttribute('aria-selected', 'false');
        t.setAttribute('tabindex', '-1');
      });
      tab.classList.add('bg-white', 'text-zinc-900', 'shadow-sm');
      tab.classList.remove('text-zinc-400');
      tab.setAttribute('aria-selected', 'true');
      tab.setAttribute('tabindex', '0');

      if (target === 'register') {
        registerForm.classList.remove('hidden');
        registerForm.removeAttribute('aria-hidden');
        loginForm.classList.add('hidden');
        loginForm.setAttribute('aria-hidden', 'true');
      } else {
        registerForm.classList.add('hidden');
        registerForm.setAttribute('aria-hidden', 'true');
        loginForm.classList.remove('hidden');
        loginForm.removeAttribute('aria-hidden');
      }
    });
  });

  // ─── "Get Started" buttons → scroll to form ──
  const scrollToForm = (e) => {
    e.preventDefault();
    document.querySelector('.glass-panel')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };
  document.getElementById('nav-get-started')?.addEventListener('click', scrollToForm);
  document.getElementById('hero-get-started')?.addEventListener('click', scrollToForm);

  // ─── Google Sign-In Handler ────────────────
  document.getElementById('google-signin-btn')?.addEventListener('click', () => {
    const btn = document.getElementById('google-signin-btn');

    // Check if Google Identity Services is loaded
    if (typeof google === 'undefined' || !google.accounts) {
      showToast('Google Sign-In is loading. Please try again in a moment.', 'error');
      return;
    }

    // Initialize and prompt Google One Tap / popup
    google.accounts.id.initialize({
      client_id: window.__GOOGLE_CLIENT_ID || '',
      callback: async (response) => {
        btn.disabled = true;
        btn.innerHTML = '<span class="material-symbols-outlined animate-spin text-sm">refresh</span> Signing in...';

        try {
          const result = await googleLogin(response.credential);
          if (result?.error) throw new Error(result.error);

          const profile = await getProfile();
          store.setUserFromAPI(profile);

          showToast('Welcome to SkillSwap+! 🎉', 'success');
          window.location.hash = '/dashboard';
        } catch (err) {
          showToast(err.message || 'Google sign-in failed. Please try again.', 'error');
          btn.disabled = false;
          btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#34A853" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#FBBC05" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg> Sign in with Google';
        }
      }
    });

    google.accounts.id.prompt((notification) => {
      // If One Tap is dismissed or not available, show popup
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        google.accounts.oauth2.initCodeClient({
          client_id: window.__GOOGLE_CLIENT_ID || '',
          scope: 'email profile',
          ux_mode: 'popup',
          callback: () => { }
        });
      }
    });
  });

  // ─── Register Handler ─────────────────────
  registerForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const confirmPassword = document.getElementById('reg-confirm-password').value;

    // Client-side password confirmation
    if (password !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }

    const btn = document.getElementById('register-btn');
    btn.disabled = true;
    btn.innerHTML = '<span class="material-symbols-outlined animate-spin text-sm">refresh</span> Creating account...';

    try {
      const regRes = await register(name, email, password);
      if (regRes?.error) throw new Error(regRes.error);

      const profile = await getProfile();
      store.setUserFromAPI(profile);

      showToast(`Welcome to SkillSwap+, ${name}! 🎉`, 'success');
      window.location.hash = '/dashboard';
    } catch (err) {
      showToast(err.message || 'Registration failed. Please try again.', 'error');
      btn.disabled = false;
      btn.innerHTML = 'Join Now';
    }
  });

  // ─── Login Handler ────────────────────────
  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    const btn = document.getElementById('login-btn');
    btn.disabled = true;
    btn.innerHTML = '<span class="material-symbols-outlined animate-spin text-sm">refresh</span> Logging in...';

    try {
      const loginRes = await login(email, password);
      if (loginRes?.error) throw new Error(loginRes.error);

      const profile = await getProfile();
      store.setUserFromAPI(profile);

      showToast('Welcome back! 👋', 'success');
      window.location.hash = '/dashboard';
    } catch (err) {
      showToast(err.message || 'Invalid credentials. Please try again.', 'error');
      btn.disabled = false;
      btn.innerHTML = 'Log In';
    }
  });
}
