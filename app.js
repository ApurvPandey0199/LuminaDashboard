/**
 * Application Engine - Feed, Dashboard CRUD, Modals, Search & Filtering
 * Built with Vanilla JavaScript & LocalStorage
 * Featuring Canvas Image Compression and Quota-Safe Storage
 */

// Initial Seed Data for a vibrant first impression
const SAMPLE_POSTS = [
  {
    id: 'post_seed_1',
    title: 'The Future of Web Development: Vanilla vs Modern Frameworks',
    description: `As the JavaScript ecosystem matures, browser standards have advanced tremendously. Today's web platform natively supports modules, Web Crypto API, CSS custom properties, grid layouts, and smooth animations without requiring heavy dependencies.

While frameworks like React, Vue, and Angular provide powerful abstractions for enterprise-scale teams, mastering the foundations of HTML, CSS, and Vanilla JavaScript remains the most valuable skill any frontend developer can cultivate. You enjoy faster load times, zero build overhead, and maximum control over execution and rendering.`,
    coverImage: '',
    status: 'Active',
    authorId: 'user_demo_01',
    authorName: 'Apurv Pandey',
    authorEmail: 'demo@example.com',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString()
  },
  {
    id: 'post_seed_2',
    title: 'Mastering Browser Storage: LocalStorage, SessionStorage & IndexedDB',
    description: `Persisting client-side state is crucial for seamless web applications. While LocalStorage provides a synchronous, key-value storage engine limited to roughly 5MB of string data, it is remarkably efficient for caching user preferences, session indicators, and offline-first prototypes.

In this deep dive, we examine serialization strategies, storing base64 media, quota limits, and when to graduate from LocalStorage to IndexedDB for large offline databases.`,
    coverImage: '',
    status: 'Active',
    authorId: 'user_demo_01',
    authorName: 'Apurv Pandey',
    authorEmail: 'demo@example.com',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
  },
  {
    id: 'post_seed_3',
    title: 'Web Crypto API: Secure In-Browser Hashing & Cryptography',
    description: `Security in browser applications begins with treating user credentials with utmost caution. Never store passwords in plain text, even in local mock databases. 

The native Web Crypto API (window.crypto.subtle) offers hardware-accelerated, non-blocking implementations of cryptographic algorithms like SHA-256, AES-GCM, and RSA. With just a few lines of asynchronous code, you can digest input strings into secure hexadecimal digests.`,
    coverImage: '',
    status: 'Active',
    authorId: 'user_demo_01',
    authorName: 'Apurv Pandey',
    authorEmail: 'demo@example.com',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString()
  },
  {
    id: 'post_seed_4',
    title: '[Draft] Upcoming Features in CSS: View Transitions & Subgrid',
    description: `An internal draft discussing how CSS Subgrid and the View Transitions API unlock native-feeling page navigation in multi-page architectures. This post remains inactive while draft revisions are finalized.`,
    coverImage: '',
    status: 'Inactive',
    authorId: 'user_demo_01',
    authorName: 'Apurv Pandey',
    authorEmail: 'demo@example.com',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString()
  }
];

/**
 * Compress an image file using an offscreen HTML5 Canvas.
 * Reduces 3MB-10MB images to ~30KB-60KB lightweight Base64 so hundreds of posts
 * can be stored in LocalStorage without hitting quota limits!
 * @param {File} file
 * @param {number} maxWidth
 * @param {number} maxHeight
 * @param {number} quality
 * @returns {Promise<string>} Compressed Base64 Data URL
 */
function compressImage(file, maxWidth = 800, maxHeight = 500, quality = 0.72) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve('');
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Export as optimized JPEG
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      img.onerror = () => reject(new Error('Image decode error'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('File read error'));
    reader.readAsDataURL(file);
  });
}

/**
 * Fetch all posts from LocalStorage and sanitize any legacy oversized items
 * @returns {Array<Object>}
 */
function getAllPosts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.POSTS);
    if (!raw) {
      seedSamplePostsIfEmpty();
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.POSTS) || '[]');
    }
    const posts = JSON.parse(raw);

    // Sanitize any existing bloated base64 strings (>100KB) to prevent QuotaExceededError
    let needsSanitization = false;
    const sanitized = posts.map(post => {
      if (post.coverImage && post.coverImage.length > 120000) {
        needsSanitization = true;
        return { ...post, coverImage: '' };
      }
      return post;
    });

    if (needsSanitization) {
      try {
        localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(sanitized));
      } catch (e) {
        console.warn('Could not save sanitized posts', e);
      }
      return sanitized;
    }

    return posts;
  } catch (err) {
    console.error('Failed to parse posts from localStorage', err);
    return [];
  }
}

/**
 * Save posts array to LocalStorage with automatic QuotaExceeded recovery
 * @param {Array<Object>} posts
 * @returns {boolean} Success status
 */
function saveAllPosts(posts) {
  try {
    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
    return true;
  } catch (err) {
    console.error('Storage write error:', err);
    if (err.name === 'QuotaExceededError' || err.code === 22 || err.number === -2147024882) {
      showToast('Storage quota reached! Optimizing media...', 'warning');
      // Gracefully rescue quota by stripping older bulky images
      const rescued = posts.map((p, idx) => {
        if (idx > 3 && p.coverImage && p.coverImage.length > 30000) {
          return { ...p, coverImage: '' };
        }
        return p;
      });
      try {
        localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(rescued));
        showToast('Saved successfully with optimized storage!', 'success');
        return true;
      } catch (retryErr) {
        showToast('Local browser storage is full. Please delete some old posts.', 'error');
        return false;
      }
    }
    showToast('Failed to save post: ' + err.message, 'error');
    return false;
  }
}

/**
 * Seed initial sample posts if none exist
 */
function seedSamplePostsIfEmpty() {
  const existing = localStorage.getItem(STORAGE_KEYS.POSTS);
  if (!existing) {
    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(SAMPLE_POSTS));
  }
}

/**
 * Helper to generate an aesthetically pleasing SVG cover placeholder
 * @param {string} title
 * @returns {string} Data URI SVG
 */
function getDefaultCover(title) {
  const cleanTitle = (title || 'Blog Article').substring(0, 32);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1e1b4b" />
        <stop offset="50%" stop-color="#312e81" />
        <stop offset="100%" stop-color="#0f172a" />
      </linearGradient>
      <linearGradient id="glow" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#6366f1" stop-opacity="0.35" />
        <stop offset="100%" stop-color="#06b6d4" stop-opacity="0.1" />
      </linearGradient>
    </defs>
    <rect width="800" height="450" fill="url(#grad)" />
    <rect width="800" height="450" fill="url(#glow)" />
    <circle cx="700" cy="80" r="140" fill="#6366f1" opacity="0.12" />
    <circle cx="100" cy="380" r="160" fill="#06b6d4" opacity="0.1" />
    <text x="400" y="210" fill="#ffffff" font-family="'Space Grotesk', system-ui, sans-serif" font-size="28" font-weight="700" text-anchor="middle">
      ${cleanTitle.replace(/&/g, '&amp;').replace(/</g, '&lt;')}
    </text>
    <text x="400" y="260" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="16" text-anchor="middle" letter-spacing="2">
      LUMINA ARTICLE
    </text>
  </svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

/**
 * Format ISO timestamp into a human-friendly date (e.g. "Sep 9, 2026")
 * @param {string} isoString
 * @returns {string}
 */
function formatDate(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Calculate approximate reading time
 * @param {string} text
 * @returns {string} e.g. "2 min read"
 */
function calculateReadingTime(text) {
  const words = (text || '').trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

/* ==========================================================================
   PUBLIC FEED MODULE (index.html)
   ========================================================================== */

let currentSearchTerm = '';
let currentSortOrder = 'newest';

/**
 * Initialize Public Blog Feed
 */
function initPublicFeed() {
  updateNavigation();
  seedSamplePostsIfEmpty();

  const searchInput = document.getElementById('search-input');
  const sortSelect = document.getElementById('sort-select');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearchTerm = e.target.value.trim().toLowerCase();
      renderFeedPosts();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentSortOrder = e.target.value;
      renderFeedPosts();
    });
  }

  renderFeedPosts();
  initModalHandlers();
  setupDeleteModal();
}

/**
 * Render Public Posts according to Search & Sort criteria
 */
function renderFeedPosts() {
  const gridContainer = document.getElementById('posts-grid');
  const postCountLabel = document.getElementById('post-count-label');
  if (!gridContainer) return;

  const allPosts = getAllPosts();
  const session = getCurrentSession();

  // 1. Filter only Active posts for the public feed
  let filtered = allPosts.filter(post => post.status === 'Active');

  // 2. Apply Live Search Filter
  if (currentSearchTerm) {
    filtered = filtered.filter(post => {
      const matchTitle = (post.title || '').toLowerCase().includes(currentSearchTerm);
      const matchDesc = (post.description || '').toLowerCase().includes(currentSearchTerm);
      const matchAuthor = (post.authorName || '').toLowerCase().includes(currentSearchTerm);
      return matchTitle || matchDesc || matchAuthor;
    });
  }

  // 3. Apply Sorting
  filtered.sort((a, b) => {
    const timeA = new Date(a.createdAt).getTime() || 0;
    const timeB = new Date(b.createdAt).getTime() || 0;
    return currentSortOrder === 'newest' ? timeB - timeA : timeA - timeB;
  });

  if (postCountLabel) {
    postCountLabel.textContent = `Showing ${filtered.length} ${filtered.length === 1 ? 'article' : 'articles'}`;
  }

  if (filtered.length === 0) {
    gridContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔍</div>
        <h3 class="empty-state-title">No articles found</h3>
        <p class="empty-state-desc">
          ${currentSearchTerm ? `No posts matched "${escapeHtml(currentSearchTerm)}". Try searching for another keyword or clear the search.` : 'There are currently no active posts published on this blog.'}
        </p>
        ${currentSearchTerm ? `<button class="btn btn-secondary btn-sm" onclick="clearSearch()">Clear Search</button>` : ''}
      </div>
    `;
    return;
  }

  gridContainer.innerHTML = filtered.map(post => {
    const coverSrc = post.coverImage || getDefaultCover(post.title);
    const authorInitials = (post.authorName || 'U').charAt(0).toUpperCase();
    const readTime = calculateReadingTime(post.description);
    const formattedDate = formatDate(post.createdAt);

    // Quick action buttons if author is logged in
    const actionControls = session ? `
      <div class="feed-card-actions" onclick="event.stopPropagation();">
        <a href="dashboard.html?edit=${post.id}" class="btn btn-secondary btn-sm" title="Edit Article">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          Edit
        </a>
        <button class="btn btn-danger btn-sm" onclick="confirmDeletePost('${post.id}')" title="Delete Article">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          Delete
        </button>
      </div>
    ` : '';

    return `
      <article class="post-card" data-id="${post.id}" onclick="openPostModal('${post.id}')">
        <div class="post-card-thumb-wrap">
          <img src="${coverSrc}" alt="${escapeHtml(post.title)}" class="post-card-thumb" loading="lazy" />
        </div>
        <div class="post-card-content">
          <div class="post-card-meta-top">
            <span>${formattedDate}</span>
            <span>• ${readTime}</span>
          </div>
          <h2 class="post-card-title">${escapeHtml(post.title)}</h2>
          <p class="post-card-desc">${escapeHtml(post.description)}</p>
          <div class="post-card-footer">
            <div class="author-chip">
              <div class="author-avatar">${authorInitials}</div>
              <span class="author-name">${escapeHtml(post.authorName || 'Anonymous')}</span>
            </div>
            ${actionControls || `
              <span class="read-more-link">
                Read Article
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </span>
            `}
          </div>
        </div>
      </article>
    `;
  }).join('');
}

/**
 * Clear search input
 */
function clearSearch() {
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.value = '';
    currentSearchTerm = '';
    renderFeedPosts();
  }
}

/**
 * Post Reader Modal Handling
 */
function initModalHandlers() {
  const modalBackdrop = document.getElementById('post-reader-modal');
  const closeBtn = document.getElementById('btn-close-reader');

  if (modalBackdrop && closeBtn) {
    closeBtn.addEventListener('click', closePostModal);
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) {
        closePostModal();
      }
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modalBackdrop.classList.contains('active')) {
        closePostModal();
      }
    });
  }
}

/**
 * Open Modal to read full post
 * @param {string} postId
 */
function openPostModal(postId) {
  const posts = getAllPosts();
  const post = posts.find(p => p.id === postId);
  if (!post) return;

  const modalBackdrop = document.getElementById('post-reader-modal');
  const coverEl = document.getElementById('modal-post-cover');
  const titleEl = document.getElementById('modal-post-title');
  const authorEl = document.getElementById('modal-post-author');
  const dateEl = document.getElementById('modal-post-date');
  const readTimeEl = document.getElementById('modal-post-readtime');
  const contentEl = document.getElementById('modal-post-content');
  const modalActionsEl = document.getElementById('modal-post-actions');

  if (!modalBackdrop) return;

  const coverSrc = post.coverImage || getDefaultCover(post.title);
  if (coverEl) coverEl.src = coverSrc;
  if (titleEl) titleEl.textContent = post.title;
  if (authorEl) authorEl.textContent = `By ${post.authorName || 'Anonymous'}`;
  if (dateEl) dateEl.textContent = formatDate(post.createdAt);
  if (readTimeEl) readTimeEl.textContent = calculateReadingTime(post.description);
  if (contentEl) contentEl.textContent = post.description;

  // If logged in, provide quick Edit & Delete buttons inside the reader modal
  const session = getCurrentSession();
  if (modalActionsEl) {
    if (session) {
      modalActionsEl.innerHTML = `
        <a href="dashboard.html?edit=${post.id}" class="btn btn-secondary btn-sm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          Edit Article
        </a>
        <button class="btn btn-danger btn-sm" onclick="closePostModal(); confirmDeletePost('${post.id}')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          Delete Article
        </button>
      `;
    } else {
      modalActionsEl.innerHTML = '';
    }
  }

  modalBackdrop.classList.add('active');
  document.body.style.overflow = 'hidden';
}

/**
 * Close Post Reader Modal
 */
function closePostModal() {
  const modalBackdrop = document.getElementById('post-reader-modal');
  if (modalBackdrop) {
    modalBackdrop.classList.remove('active');
    document.body.style.overflow = '';
  }
}

/* ==========================================================================
   DASHBOARD MODULE (dashboard.html)
   ========================================================================== */

let activeEditPostId = null;
let currentUploadedBase64Image = null;
let postPendingDeletionId = null;
let dashboardFilterMode = 'all'; // 'all' (all articles) | 'my' (only current user)

/**
 * Initialize Dashboard screen
 */
function initDashboard() {
  const session = requireAuth();
  if (!session) return;

  updateNavigation();

  const welcomeName = document.getElementById('dash-welcome-name');
  const userEmailChip = document.getElementById('dash-user-email');
  if (welcomeName) welcomeName.textContent = session.userName;
  if (userEmailChip) userEmailChip.textContent = session.userEmail;

  setupImageUploader();
  setupPostForm(session);
  setupDeleteModal();

  // Check if URL has ?edit=postId parameter to auto-load edit
  const urlParams = new URLSearchParams(window.location.search);
  const editId = urlParams.get('edit');
  if (editId) {
    setTimeout(() => {
      editPost(editId);
    }, 150);
  }

  refreshDashboardView(session);
}

/**
 * Set up File Upload with Canvas image compression preview
 */
function setupImageUploader() {
  const fileInput = document.getElementById('post-cover-input');
  const previewContainer = document.getElementById('upload-preview-container');
  const previewImg = document.getElementById('upload-preview-img');
  const removeBtn = document.getElementById('btn-remove-image');
  const uploadPrompt = document.getElementById('upload-prompt');

  if (!fileInput) return;

  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, WebP)', 'error');
      fileInput.value = '';
      return;
    }

    try {
      showToast('Compressing image for fast storage...', 'info');
      // Compress to ~30-50KB using HTML5 Canvas
      const compressedBase64 = await compressImage(file, 800, 500, 0.72);
      currentUploadedBase64Image = compressedBase64;
      if (previewImg) previewImg.src = currentUploadedBase64Image;
      if (previewContainer) previewContainer.style.display = 'block';
      if (uploadPrompt) uploadPrompt.style.display = 'none';
      showToast('Cover image ready!', 'success');
    } catch (err) {
      console.error('Image compression error:', err);
      showToast('Could not process image. Try another file.', 'error');
    }
  });

  if (removeBtn) {
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      clearImageSelection();
    });
  }
}

/**
 * Clear image upload state
 */
function clearImageSelection() {
  const fileInput = document.getElementById('post-cover-input');
  const previewContainer = document.getElementById('upload-preview-container');
  const previewImg = document.getElementById('upload-preview-img');
  const uploadPrompt = document.getElementById('upload-prompt');

  currentUploadedBase64Image = null;
  if (fileInput) fileInput.value = '';
  if (previewImg) previewImg.src = '';
  if (previewContainer) previewContainer.style.display = 'none';
  if (uploadPrompt) uploadPrompt.style.display = 'flex';
}

/**
 * Set up Post Create / Edit Form submission
 * Allows creating UNLIMITED posts, editing existing posts, and updating effortlessly.
 * @param {Object} session
 */
function setupPostForm(session) {
  const postForm = document.getElementById('post-form');
  const cancelEditBtn = document.getElementById('btn-cancel-edit');

  if (postForm) {
    postForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const titleInput = document.getElementById('post-title');
      const descInput = document.getElementById('post-desc');
      const statusCheckbox = document.getElementById('post-status-toggle');

      const title = (titleInput?.value || '').trim();
      const description = (descInput?.value || '').trim();
      const status = statusCheckbox?.checked ? 'Active' : 'Inactive';

      if (!title) {
        showToast('Please provide an article title.', 'error');
        titleInput?.focus();
        return;
      }
      if (!description) {
        showToast('Please write some content for the article.', 'error');
        descInput?.focus();
        return;
      }

      const allPosts = getAllPosts();

      if (activeEditPostId) {
        // Edit Mode: Update existing post
        const postIndex = allPosts.findIndex(p => p.id === activeEditPostId);
        if (postIndex === -1) {
          showToast('Article not found.', 'error');
          return;
        }

        allPosts[postIndex].title = title;
        allPosts[postIndex].description = description;
        allPosts[postIndex].status = status;
        if (currentUploadedBase64Image !== null) {
          allPosts[postIndex].coverImage = currentUploadedBase64Image;
        }
        allPosts[postIndex].updatedAt = new Date().toISOString();

        const saved = saveAllPosts(allPosts);
        if (saved) {
          showToast('Article updated successfully!', 'success');
          resetPostForm();
          refreshDashboardView(session);
        }
      } else {
        // Create Mode: Create new post (can create multiple in a row!)
        const newPost = {
          id: 'post_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
          title: title,
          description: description,
          coverImage: currentUploadedBase64Image || '',
          status: status,
          authorId: session.userId,
          authorName: session.userName,
          authorEmail: session.userEmail,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        allPosts.unshift(newPost);
        const saved = saveAllPosts(allPosts);
        if (saved) {
          showToast('Article published successfully!', 'success');
          resetPostForm();
          refreshDashboardView(session);
          titleInput?.focus();
        }
      }
    });
  }

  if (cancelEditBtn) {
    cancelEditBtn.addEventListener('click', () => {
      resetPostForm();
    });
  }
}

/**
 * Reset form back to Create mode
 */
function resetPostForm() {
  activeEditPostId = null;
  const postForm = document.getElementById('post-form');
  const formTitle = document.getElementById('form-card-title');
  const submitBtn = document.getElementById('btn-submit-post');
  const cancelBtn = document.getElementById('btn-cancel-edit');
  const statusToggle = document.getElementById('post-status-toggle');

  if (postForm) postForm.reset();
  clearImageSelection();

  if (statusToggle) statusToggle.checked = true;
  if (formTitle) formTitle.textContent = 'Create New Post';
  if (submitBtn) {
    submitBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
      Publish Post
    `;
  }
  if (cancelBtn) cancelBtn.style.display = 'none';
}

/**
 * Populate form for editing an existing post
 * @param {string} postId
 */
function editPost(postId) {
  const session = getCurrentSession();
  if (!session) return;

  const allPosts = getAllPosts();
  const post = allPosts.find(p => p.id === postId);
  if (!post) {
    showToast('Article not found.', 'error');
    return;
  }

  activeEditPostId = post.id;

  const titleInput = document.getElementById('post-title');
  const descInput = document.getElementById('post-desc');
  const statusToggle = document.getElementById('post-status-toggle');
  const formTitle = document.getElementById('form-card-title');
  const submitBtn = document.getElementById('btn-submit-post');
  const cancelBtn = document.getElementById('btn-cancel-edit');

  if (titleInput) titleInput.value = post.title;
  if (descInput) descInput.value = post.description;
  if (statusToggle) statusToggle.checked = (post.status === 'Active');

  if (post.coverImage) {
    currentUploadedBase64Image = post.coverImage;
    const previewContainer = document.getElementById('upload-preview-container');
    const previewImg = document.getElementById('upload-preview-img');
    const uploadPrompt = document.getElementById('upload-prompt');
    if (previewImg) previewImg.src = post.coverImage;
    if (previewContainer) previewContainer.style.display = 'block';
    if (uploadPrompt) uploadPrompt.style.display = 'none';
  } else {
    clearImageSelection();
  }

  if (formTitle) formTitle.textContent = 'Edit Article';
  if (submitBtn) {
    submitBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
      Update Article
    `;
  }
  if (cancelBtn) cancelBtn.style.display = 'inline-flex';

  document.getElementById('post-form-card')?.scrollIntoView({ behavior: 'smooth' });
}

/**
 * Setup Delete Confirmation Modal
 */
function setupDeleteModal() {
  const modal = document.getElementById('confirm-delete-modal');
  const cancelBtn = document.getElementById('btn-cancel-delete');
  const confirmBtn = document.getElementById('btn-confirm-delete');

  if (cancelBtn) {
    cancelBtn.addEventListener('click', closeDeleteModal);
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeDeleteModal();
    });
  }

  if (confirmBtn) {
    confirmBtn.addEventListener('click', () => {
      const session = getCurrentSession();
      if (!session || !postPendingDeletionId) {
        closeDeleteModal();
        return;
      }

      const allPosts = getAllPosts();
      const updatedPosts = allPosts.filter(p => p.id !== postPendingDeletionId);
      const saved = saveAllPosts(updatedPosts);

      if (saved) {
        if (activeEditPostId === postPendingDeletionId) {
          resetPostForm();
        }

        postPendingDeletionId = null;
        closeDeleteModal();
        showToast('Article deleted successfully', 'success');

        // If on dashboard, refresh view
        if (typeof refreshDashboardView === 'function' && document.getElementById('dash-post-list')) {
          refreshDashboardView(session);
        }
        // If on public feed, refresh feed
        if (typeof renderFeedPosts === 'function' && document.getElementById('posts-grid')) {
          renderFeedPosts();
        }
      }
    });
  }
}

/**
 * Open Delete confirmation dialog
 * @param {string} postId
 */
function confirmDeletePost(postId) {
  postPendingDeletionId = postId;
  const modal = document.getElementById('confirm-delete-modal');
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

/**
 * Close Delete confirmation dialog
 */
function closeDeleteModal() {
  postPendingDeletionId = null;
  const modal = document.getElementById('confirm-delete-modal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

/**
 * Toggle dashboard filter between 'all' and 'my'
 * @param {'all'|'my'} mode
 */
function setDashboardFilter(mode) {
  dashboardFilterMode = mode;
  const session = getCurrentSession();
  if (session) {
    refreshDashboardView(session);
  }
}

/**
 * Refresh Dashboard Statistics and Posts List
 * @param {Object} session
 */
function refreshDashboardView(session) {
  const allPosts = getAllPosts();

  // Metrics calculation
  const totalCount = allPosts.length;
  const activeCount = allPosts.filter(p => p.status === 'Active').length;
  const inactiveCount = allPosts.filter(p => p.status === 'Inactive').length;

  const totalEl = document.getElementById('stat-total-posts');
  const activeEl = document.getElementById('stat-active-posts');
  const inactiveEl = document.getElementById('stat-inactive-posts');
  const postListContainer = document.getElementById('dash-post-list');

  if (totalEl) totalEl.textContent = totalCount;
  if (activeEl) activeEl.textContent = activeCount;
  if (inactiveEl) inactiveEl.textContent = inactiveCount;

  if (!postListContainer) return;

  // Filter posts based on toggle mode
  const displayedPosts = dashboardFilterMode === 'my'
    ? allPosts.filter(p => p.authorId === session.userId || p.authorEmail === session.userEmail)
    : allPosts;

  // Filter tab controls HTML
  const myCount = allPosts.filter(p => p.authorId === session.userId || p.authorEmail === session.userEmail).length;
  const filterTabsHtml = `
    <div class="dash-filter-tabs" style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
      <button type="button" class="btn ${dashboardFilterMode === 'all' ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="setDashboardFilter('all')">
        All Articles (${allPosts.length})
      </button>
      <button type="button" class="btn ${dashboardFilterMode === 'my' ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="setDashboardFilter('my')">
        My Articles (${myCount})
      </button>
    </div>
  `;

  if (displayedPosts.length === 0) {
    postListContainer.innerHTML = `
      ${filterTabsHtml}
      <div class="empty-state" style="padding: 2.5rem 1rem;">
        <div class="empty-state-icon">✍️</div>
        <h4 class="empty-state-title">No articles found</h4>
        <p class="empty-state-desc">${dashboardFilterMode === 'my' ? "You haven't authored any posts yet. Publish your first article using the form on the left, or switch to 'All Articles' to manage existing ones." : "No articles on the platform. Create one now!"}</p>
      </div>
    `;
    return;
  }

  postListContainer.innerHTML = `
    ${filterTabsHtml}
    <div class="dash-post-list-inner" style="display: flex; flex-direction: column; gap: 0.9rem;">
      ${displayedPosts.map(post => {
        const thumb = post.coverImage || getDefaultCover(post.title);
        const dateFormatted = formatDate(post.createdAt);
        const badgeClass = post.status === 'Active' ? 'badge-active' : 'badge-inactive';
        const isAuthor = (post.authorId === session.userId || post.authorEmail === session.userEmail);

        return `
          <div class="dash-post-item" id="item-${post.id}">
            <div class="dash-post-info">
              <img src="${thumb}" alt="" class="dash-post-thumb" />
              <div class="dash-post-details">
                <h4 class="dash-post-title" title="${escapeHtml(post.title)}">${escapeHtml(post.title)}</h4>
                <div class="dash-post-meta">
                  <span class="badge ${badgeClass}">${post.status}</span>
                  ${isAuthor ? '<span class="badge badge-pill" style="font-size: 0.7rem;">Your Post</span>' : `<span style="font-size: 0.78rem; color: var(--text-dim);">By ${escapeHtml(post.authorName || 'Author')}</span>`}
                  <span>• ${dateFormatted}</span>
                </div>
              </div>
            </div>
            <div class="dash-post-actions">
              <button class="btn btn-secondary btn-sm" onclick="editPost('${post.id}')" title="Edit Article">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                Edit
              </button>
              <button class="btn btn-danger btn-sm" onclick="confirmDeletePost('${post.id}')" title="Delete Article">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                Delete
              </button>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}
