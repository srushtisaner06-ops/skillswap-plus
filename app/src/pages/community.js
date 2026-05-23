import { store } from '../state.js';
import { showToast } from '../components/toast.js';
import {
  createCommunityPost,
  createPostComment,
  deleteCommunityPost,
  getCommunityPosts,
  getPostComments,
  markSolvedAnswer,
  toggleCommentVote,
  togglePostVote
} from '../services/community.service.js';

const categories = [
  'General Discussion',
  'UI/UX Craft',
  'Frontend Masters',
  'Product Strategy',
  'Soft Skills',
  'Career',
  'Other'
];

const state = {
  posts: [],
  categoryCounts: [],
  page: 1,
  pages: 1,
  total: 0,
  category: '',
  sort: 'newest',
  loading: false,
  error: '',
  openPostId: null,
  commentsByPost: {}
};

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));
}

function timeAgo(value) {
  const then = new Date(value).getTime();
  if (!then) return '';
  const seconds = Math.max(Math.floor((Date.now() - then) / 1000), 1);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(value).toLocaleDateString('en', { month: 'short', day: 'numeric' });
}

function avatarFor(user) {
  const name = user?.name || 'User';
  return user?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6927ef&color=fff`;
}

function isCurrentUser(userOrId) {
  const id = userOrId?._id || userOrId;
  return id && String(id) === String(store.getUserSafe()?._id);
}

function renderCategoryList() {
  const countByName = new Map(state.categoryCounts.map((item) => [item.name, item.count]));
  return [
    { name: '', label: 'All Discussions', icon: 'forum' },
    ...categories.map((name) => ({ name, label: name, icon: categoryIcon(name) }))
  ].map((item) => {
    const active = state.category === item.name;
    const count = item.name ? countByName.get(item.name) || 0 : state.total;
    return `
      <button class="community-category group flex items-center justify-between gap-3 w-full ${active ? 'bg-white shadow-sm text-violet-600' : 'text-zinc-500 hover:bg-zinc-100/70'} rounded-full px-4 py-3 transition-all" data-category="${escapeHtml(item.name)}">
        <span class="flex items-center gap-3 min-w-0">
          <span class="material-symbols-outlined text-[20px]">${item.icon}</span>
          <span class="font-semibold text-sm truncate">${escapeHtml(item.label)}</span>
        </span>
        <span class="text-[10px] font-black bg-zinc-100 text-zinc-500 rounded-full px-2 py-0.5">${count}</span>
      </button>
    `;
  }).join('');
}

function categoryIcon(name) {
  return {
    'General Discussion': 'grid_view',
    'UI/UX Craft': 'design_services',
    'Frontend Masters': 'code',
    'Product Strategy': 'analytics',
    'Soft Skills': 'psychology',
    Career: 'work',
    Other: 'more_horiz'
  }[name] || 'forum';
}

function renderPostForm() {
  const user = store.getUserSafe();
  return `
    <form id="community-post-form" class="bg-surface-container-lowest p-5 rounded-lg shadow-sm border border-outline-variant/15 space-y-4">
      <div class="flex gap-4">
        <img alt="You" class="w-10 h-10 rounded-full object-cover" src="${avatarFor(user)}" />
        <div class="flex-1 grid gap-3">
          <input name="title" class="w-full px-4 py-3 bg-surface-container-low rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/30" placeholder="Ask a practical question or share a resource" minlength="5" maxlength="140" required />
          <textarea name="body" class="w-full min-h-24 px-4 py-3 bg-surface-container-low rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-y" placeholder="Add context, what you tried, links, or examples..." minlength="10" maxlength="3000" required></textarea>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-[180px_1fr_auto] gap-3">
        <select name="category" class="px-4 py-3 bg-surface-container-low rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/30">
          ${categories.map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join('')}
        </select>
        <input name="tags" class="px-4 py-3 bg-surface-container-low rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/30" placeholder="Tags, comma separated" maxlength="140" />
        <button class="bg-primary text-white px-6 py-3 rounded-full text-sm font-black shadow-lg shadow-primary/20 disabled:opacity-60" type="submit">
          Post
        </button>
      </div>
    </form>
  `;
}

function renderSolved(comment) {
  if (!comment) return '';
  return `
    <div class="mt-4 relative pl-6 border-l-4 border-emerald-500 bg-emerald-50/70 p-4 rounded-r-xl">
      <div class="absolute -left-[14px] top-4 bg-emerald-500 text-white rounded-full p-1 flex items-center justify-center">
        <span class="material-symbols-outlined text-sm">check</span>
      </div>
      <p class="text-[10px] font-black uppercase tracking-widest text-emerald-700 mb-2">Solved Answer</p>
      <div class="flex gap-3">
        <img alt="${escapeHtml(comment.author?.name || 'User')}" class="w-8 h-8 rounded-full object-cover" src="${avatarFor(comment.author)}" />
        <div>
          <p class="text-xs font-black text-zinc-900">${escapeHtml(comment.author?.name || 'User')}</p>
          <p class="text-sm text-zinc-700 mt-1 leading-relaxed">${escapeHtml(comment.body)}</p>
        </div>
      </div>
    </div>
  `;
}

function renderPost(post) {
  const ownPost = isCurrentUser(post.author);
  const open = state.openPostId === post._id;
  return `
    <article class="community-post bg-surface-container-lowest rounded-lg border border-outline-variant/15 shadow-sm overflow-hidden" data-post-id="${post._id}">
      <div class="p-4 sm:p-6 flex gap-4 sm:gap-6">
        <div class="flex flex-col items-center gap-1 bg-surface-container-low rounded-full p-1 h-fit">
          <button class="post-vote p-1 hover:text-primary transition-colors ${post.hasUpvoted ? 'text-primary' : 'text-zinc-500'}" data-post-id="${post._id}" aria-label="Upvote post">
            <span class="material-symbols-outlined ${post.hasUpvoted ? 'material-fill' : ''}">keyboard_arrow_up</span>
          </button>
          <span class="post-vote-count text-sm font-bold" data-post-id="${post._id}">${post.upvoteCount || 0}</span>
        </div>

        <div class="flex-1 min-w-0">
          <div class="flex flex-wrap items-center justify-between gap-3 mb-2">
            <div class="flex items-center gap-2 min-w-0">
              <img src="${avatarFor(post.author)}" class="w-6 h-6 rounded-full object-cover" alt="${escapeHtml(post.author?.name || 'User')}" />
              <span class="font-bold text-sm truncate">${escapeHtml(post.author?.name || 'User')}</span>
              ${post.author?.role === 'mentor' ? '<span class="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold">MENTOR</span>' : ''}
              <span class="text-outline text-xs">${timeAgo(post.createdAt)}</span>
            </div>
            ${ownPost ? `<button class="delete-post text-zinc-400 hover:text-red-600" data-post-id="${post._id}" aria-label="Delete post"><span class="material-symbols-outlined">delete</span></button>` : ''}
          </div>

          <div class="flex flex-wrap gap-2 mb-3">
            <span class="bg-zinc-100 text-zinc-600 px-2 py-1 rounded-full text-[10px] font-black uppercase">${escapeHtml(post.category)}</span>
            ${(post.tags || []).map((tag) => `<span class="bg-violet-50 text-primary px-2 py-1 rounded-full text-[10px] font-bold">#${escapeHtml(tag)}</span>`).join('')}
          </div>

          <h2 class="text-lg sm:text-xl font-black mb-3 tracking-tight text-zinc-900">${escapeHtml(post.title)}</h2>
          <p class="text-on-surface-variant leading-relaxed mb-4 whitespace-pre-line">${escapeHtml(post.body)}</p>

          <div class="flex flex-wrap gap-5">
            <button class="toggle-comments flex items-center gap-2 text-outline text-sm hover:text-primary transition-colors" data-post-id="${post._id}">
              <span class="material-symbols-outlined text-lg">chat_bubble</span>
              <span>${post.commentCount || 0} replies</span>
            </button>
            ${post.solvedComment ? `
              <span class="flex items-center gap-1 text-emerald-700 text-sm font-bold">
                <span class="material-symbols-outlined text-lg">check_circle</span>
                Solved
              </span>
            ` : ''}
          </div>

          ${renderSolved(post.solvedComment)}
          ${open ? renderCommentsPanel(post) : ''}
        </div>
      </div>
    </article>
  `;
}

function renderCommentsPanel(post) {
  const stateForPost = state.commentsByPost[post._id] || { loading: true, comments: [], error: '' };
  if (stateForPost.loading) {
    return `<div class="mt-5 border-t border-zinc-100 pt-5 text-sm text-zinc-500">Loading replies...</div>`;
  }
  if (stateForPost.error) {
    return `<div class="mt-5 border-t border-zinc-100 pt-5 text-sm text-red-600">${escapeHtml(stateForPost.error)}</div>`;
  }
  return `
    <div class="mt-5 border-t border-zinc-100 pt-5 space-y-4">
      <form class="comment-form flex gap-3" data-post-id="${post._id}">
        <img alt="You" class="w-8 h-8 rounded-full object-cover" src="${avatarFor(store.getUserSafe())}" />
        <div class="flex-1 flex gap-2">
          <input name="body" class="flex-1 px-4 py-2 bg-surface-container-low rounded-full text-sm outline-none focus:ring-2 focus:ring-primary/30" placeholder="Write a reply" minlength="2" maxlength="1500" required />
          <button class="bg-zinc-900 text-white rounded-full px-4 text-xs font-black" type="submit">Send</button>
        </div>
      </form>
      ${stateForPost.comments.length === 0 ? `<p class="text-sm text-zinc-400 py-4 text-center">No replies yet. A useful answer can start the thread.</p>` : stateForPost.comments.map((comment) => renderComment(comment, post)).join('')}
    </div>
  `;
}

function renderComment(comment, post) {
  const ownPost = isCurrentUser(post.author);
  const ownComment = isCurrentUser(comment.author);
  return `
    <div class="comment-block" data-comment-id="${comment._id}">
      <div class="flex gap-3">
        <img alt="${escapeHtml(comment.author?.name || 'User')}" class="w-8 h-8 rounded-full object-cover" src="${avatarFor(comment.author)}" />
        <div class="flex-1 bg-surface-container-low rounded-xl p-3">
          <div class="flex flex-wrap items-center justify-between gap-2 mb-1">
            <div class="flex items-center gap-2">
              <span class="font-black text-xs">${escapeHtml(comment.author?.name || 'User')}</span>
              ${comment.author?.role === 'mentor' ? '<span class="bg-primary text-white text-[8px] px-1.5 py-0.5 rounded font-black">MENTOR</span>' : ''}
              ${comment.isSolution ? '<span class="bg-emerald-100 text-emerald-700 text-[9px] px-2 py-0.5 rounded-full font-black">SOLUTION</span>' : ''}
              <span class="text-outline text-[10px]">${timeAgo(comment.createdAt)}</span>
            </div>
            ${ownComment ? `<button class="delete-comment text-zinc-400 hover:text-red-600" data-comment-id="${comment._id}" aria-label="Delete comment"><span class="material-symbols-outlined text-base">delete</span></button>` : ''}
          </div>
          <p class="text-sm text-on-surface-variant whitespace-pre-line">${escapeHtml(comment.body)}</p>
          <div class="flex flex-wrap items-center gap-4 mt-2">
            <button class="comment-vote text-[11px] font-bold ${comment.hasUpvoted ? 'text-primary' : 'text-zinc-500'} hover:text-primary" data-comment-id="${comment._id}">
              Helpful (${comment.upvoteCount || 0})
            </button>
            <button class="reply-toggle text-[11px] font-bold text-zinc-500 hover:text-primary" data-comment-id="${comment._id}">Reply</button>
            ${ownPost && !comment.isSolution ? `<button class="mark-solved text-[11px] font-bold text-emerald-700 hover:underline" data-post-id="${post._id}" data-comment-id="${comment._id}">Mark solved</button>` : ''}
          </div>
          <form class="reply-form hidden mt-3 flex gap-2" data-post-id="${post._id}" data-parent-comment="${comment._id}">
            <input name="body" class="flex-1 px-3 py-2 bg-white rounded-full text-xs outline-none focus:ring-2 focus:ring-primary/30" placeholder="Reply to this answer" minlength="2" maxlength="1500" required />
            <button class="bg-zinc-900 text-white rounded-full px-3 text-[10px] font-black" type="submit">Send</button>
          </form>
        </div>
      </div>
      ${(comment.replies || []).length ? `
        <div class="ml-11 mt-3 space-y-3 border-l-2 border-zinc-100 pl-4">
          ${comment.replies.map((reply) => renderReply(reply)).join('')}
        </div>
      ` : ''}
    </div>
  `;
}

function renderReply(reply) {
  const ownReply = isCurrentUser(reply.author);
  return `
    <div class="flex gap-3" data-comment-id="${reply._id}">
      <img alt="${escapeHtml(reply.author?.name || 'User')}" class="w-6 h-6 rounded-full object-cover" src="${avatarFor(reply.author)}" />
      <div class="flex-1 bg-white border border-zinc-100 rounded-xl p-3">
        <div class="flex justify-between gap-2 mb-1">
          <div class="flex items-center gap-2">
            <span class="font-bold text-xs">${escapeHtml(reply.author?.name || 'User')}</span>
            <span class="text-outline text-[10px]">${timeAgo(reply.createdAt)}</span>
          </div>
          ${ownReply ? `<button class="delete-comment text-zinc-400 hover:text-red-600" data-comment-id="${reply._id}" aria-label="Delete reply"><span class="material-symbols-outlined text-base">delete</span></button>` : ''}
        </div>
        <p class="text-xs text-on-surface-variant whitespace-pre-line">${escapeHtml(reply.body)}</p>
      </div>
    </div>
  `;
}

function renderFeed() {
  if (state.loading && state.posts.length === 0) {
    return `
      <div class="space-y-4">
        <div class="h-48 bg-zinc-100 rounded-lg animate-pulse"></div>
        <div class="h-48 bg-zinc-100 rounded-lg animate-pulse"></div>
      </div>
    `;
  }
  if (state.error) {
    return `
      <div class="bg-white rounded-lg border border-red-100 p-10 text-center">
        <span class="material-symbols-outlined text-red-500 text-4xl mb-3">error</span>
        <h3 class="font-black text-zinc-900">Community could not load</h3>
        <p class="text-sm text-zinc-500 mt-2">${escapeHtml(state.error)}</p>
        <button id="retry-community" class="mt-5 bg-zinc-900 text-white rounded-full px-5 py-2 text-sm font-bold">Retry</button>
      </div>
    `;
  }
  if (state.posts.length === 0) {
    return `
      <div class="bg-surface-container-lowest rounded-lg border border-outline-variant/15 shadow-sm flex flex-col items-center justify-center py-16 text-center px-6">
        <div class="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mb-4">
          <span class="material-symbols-outlined text-3xl text-zinc-400">forum</span>
        </div>
        <h4 class="text-lg font-black text-zinc-900 mb-1">No posts yet</h4>
        <p class="text-zinc-500 font-medium text-sm">Start the first real discussion in this category.</p>
      </div>
    `;
  }
  return `
    <div class="space-y-6">${state.posts.map(renderPost).join('')}</div>
    ${state.page < state.pages ? `
      <button id="load-more-community" class="w-full py-3 rounded-full bg-white border border-zinc-200 text-sm font-black text-zinc-700 hover:bg-zinc-50 disabled:opacity-60">
        ${state.loading ? 'Loading...' : 'Load more'}
      </button>
    ` : ''}
  `;
}

function render(container) {
  container.innerHTML = `
    <div class="pt-6 pb-20 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-12 gap-6 lg:gap-8">
      <aside class="col-span-12 lg:col-span-3 lg:sticky lg:top-8 h-fit">
        <div class="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible p-1">
          ${renderCategoryList()}
        </div>
      </aside>

      <section class="col-span-12 lg:col-span-6 space-y-6">
        ${renderPostForm()}
        <div class="flex gap-4 px-2 overflow-x-auto" role="tablist" aria-label="Community feed filters">
          ${['newest', 'top', 'unanswered', 'solved'].map((sort) => `
            <button class="sort-tab ${state.sort === sort ? 'tab-active text-primary' : 'text-outline'} text-xs font-bold tracking-widest uppercase pb-1" data-sort="${sort}">
              ${sort}
            </button>
          `).join('')}
        </div>
        <div id="community-feed">${renderFeed()}</div>
      </section>

      <aside class="hidden lg:block col-span-3 space-y-6 sticky top-8 h-fit">
        <div class="bg-surface-container-lowest rounded-lg border border-outline-variant/15 shadow-sm overflow-hidden">
          <div class="p-5 border-b border-surface-container-low">
            <h3 class="font-bold tracking-tight">Community Health</h3>
          </div>
          <div class="p-5 space-y-4">
            <div>
              <span class="text-2xl font-black text-zinc-900">${state.total}</span>
              <p class="text-[10px] uppercase tracking-widest text-outline font-bold">visible discussions</p>
            </div>
            <p class="text-sm text-zinc-500 leading-relaxed">Questions, answers, and solutions are powered by real member activity.</p>
          </div>
        </div>
      </aside>
    </div>
  `;
}

async function loadPosts(container, append = false) {
  state.loading = true;
  state.error = '';
  render(container);

  try {
    const result = await getCommunityPosts({
      page: state.page,
      limit: 10,
      category: state.category,
      sort: state.sort
    });
    state.posts = append ? [...state.posts, ...result.posts] : result.posts;
    state.categoryCounts = result.categories || [];
    state.total = result.pagination?.total || 0;
    state.pages = result.pagination?.pages || 1;
  } catch (err) {
    state.error = err.message || 'Failed to load community posts';
  } finally {
    state.loading = false;
    render(container);
  }
}

async function loadComments(container, postId) {
  state.commentsByPost[postId] = { loading: true, comments: [], error: '' };
  render(container);

  try {
    const result = await getPostComments(postId, { limit: 30 });
    state.commentsByPost[postId] = { loading: false, comments: result.comments || [], error: '' };
  } catch (err) {
    state.commentsByPost[postId] = { loading: false, comments: [], error: err.message || 'Failed to load replies' };
  }
  render(container);
}

function optimisticPost(data) {
  return {
    _id: `temp-${Date.now()}`,
    ...data,
    author: store.getUserSafe(),
    upvoteCount: 0,
    commentCount: 0,
    solvedComment: null,
    hasUpvoted: false,
    createdAt: new Date().toISOString()
  };
}

export async function renderCommunity(container) {
  state.page = 1;
  state.openPostId = null;
  state.commentsByPost = {};
  await loadPosts(container);

  container.addEventListener('click', async (event) => {
    const categoryBtn = event.target.closest('.community-category');
    if (categoryBtn) {
      state.category = categoryBtn.dataset.category || '';
      state.page = 1;
      state.posts = [];
      await loadPosts(container);
      return;
    }

    const sortBtn = event.target.closest('.sort-tab');
    if (sortBtn) {
      state.sort = sortBtn.dataset.sort || 'newest';
      state.page = 1;
      state.posts = [];
      await loadPosts(container);
      return;
    }

    if (event.target.closest('#retry-community')) {
      await loadPosts(container);
      return;
    }

    if (event.target.closest('#load-more-community')) {
      state.page += 1;
      await loadPosts(container, true);
      return;
    }

    const toggleComments = event.target.closest('.toggle-comments');
    if (toggleComments) {
      const postId = toggleComments.dataset.postId;
      state.openPostId = state.openPostId === postId ? null : postId;
      if (state.openPostId && !state.commentsByPost[postId]) {
        await loadComments(container, postId);
      } else {
        render(container);
      }
      return;
    }

    const postVote = event.target.closest('.post-vote');
    if (postVote) {
      const postId = postVote.dataset.postId;
      const post = state.posts.find((item) => item._id === postId);
      if (!post || post._id.startsWith('temp-')) return;
      const previous = { hasUpvoted: post.hasUpvoted, upvoteCount: post.upvoteCount };
      post.hasUpvoted = !post.hasUpvoted;
      post.upvoteCount = Math.max((post.upvoteCount || 0) + (post.hasUpvoted ? 1 : -1), 0);
      render(container);
      try {
        const vote = await togglePostVote(postId);
        post.hasUpvoted = vote.hasUpvoted;
        post.upvoteCount = vote.upvoteCount;
      } catch (err) {
        Object.assign(post, previous);
        showToast(err.message || 'Vote failed', 'error');
      }
      render(container);
      return;
    }

    const commentVote = event.target.closest('.comment-vote');
    if (commentVote) {
      const commentId = commentVote.dataset.commentId;
      try {
        await toggleCommentVote(commentId);
        await loadComments(container, state.openPostId);
      } catch (err) {
        showToast(err.message || 'Vote failed', 'error');
      }
      return;
    }

    const replyToggle = event.target.closest('.reply-toggle');
    if (replyToggle) {
      const form = container.querySelector(`.reply-form[data-parent-comment="${replyToggle.dataset.commentId}"]`);
      form?.classList.toggle('hidden');
      form?.querySelector('input')?.focus();
      return;
    }

    const solved = event.target.closest('.mark-solved');
    if (solved) {
      try {
        await markSolvedAnswer(solved.dataset.postId, solved.dataset.commentId);
        showToast('Answer marked as solved.', 'success');
        await loadPosts(container);
        state.openPostId = solved.dataset.postId;
        await loadComments(container, solved.dataset.postId);
      } catch (err) {
        showToast(err.message || 'Could not mark solved answer', 'error');
      }
      return;
    }

    const deletePostBtn = event.target.closest('.delete-post');
    if (deletePostBtn) {
      try {
        await deleteCommunityPost(deletePostBtn.dataset.postId);
        state.posts = state.posts.filter((post) => post._id !== deletePostBtn.dataset.postId);
        render(container);
        showToast('Post removed.', 'success');
      } catch (err) {
        showToast(err.message || 'Could not delete post', 'error');
      }
      return;
    }

    const deleteCommentBtn = event.target.closest('.delete-comment');
    if (deleteCommentBtn) {
      try {
        await deleteCommunityComment(deleteCommentBtn.dataset.commentId);
        const post = state.posts.find((item) => item._id === state.openPostId);
        if (post) post.commentCount = Math.max((post.commentCount || 1) - 1, 0);
        await loadComments(container, state.openPostId);
        showToast('Comment removed.', 'success');
      } catch (err) {
        showToast(err.message || 'Could not delete comment', 'error');
      }
    }
  });

  container.addEventListener('submit', async (event) => {
    const postForm = event.target.closest('#community-post-form');
    if (postForm) {
      event.preventDefault();
      const formData = new FormData(postForm);
      const data = {
        title: formData.get('title'),
        body: formData.get('body'),
        category: formData.get('category'),
        tags: String(formData.get('tags') || '').split(',').map((tag) => tag.trim()).filter(Boolean)
      };
      const temp = optimisticPost(data);
      state.posts = [temp, ...state.posts];
      render(container);
      try {
        const created = await createCommunityPost(data);
        state.posts = state.posts.map((post) => post._id === temp._id ? created : post);
        showToast('Post published.', 'success');
      } catch (err) {
        state.posts = state.posts.filter((post) => post._id !== temp._id);
        showToast(err.message || 'Could not publish post', 'error');
      }
      render(container);
      return;
    }

    const commentForm = event.target.closest('.comment-form, .reply-form');
    if (commentForm) {
      event.preventDefault();
      const postId = commentForm.dataset.postId;
      const parentComment = commentForm.dataset.parentComment || null;
      const body = new FormData(commentForm).get('body');
      const post = state.posts.find((item) => item._id === postId);
      if (post) post.commentCount = (post.commentCount || 0) + 1;
      commentForm.reset();
      render(container);
      try {
        await createPostComment(postId, { body, parentComment });
        await loadComments(container, postId);
      } catch (err) {
        if (post) post.commentCount = Math.max((post.commentCount || 1) - 1, 0);
        showToast(err.message || 'Could not add reply', 'error');
        render(container);
      }
    }
  });
}
