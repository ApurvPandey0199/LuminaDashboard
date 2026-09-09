/**
 * Auth Module - Vanilla JavaScript with Web Crypto API & LocalStorage
 * Handles SHA-256 password hashing, token generation, session lifecycle, and route guards.
 */

const STORAGE_KEYS = {
  USERS: 'blog_users',
  SESSION: 'blog_session',
  POSTS: 'blog_posts'
};

// Session lifetime: 24 Hours in milliseconds
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000;

/**
 * Hash password using browser's native Web Crypto API (SHA-256)
 * @param {string} password
 * @returns {Promise<string>} Hexadecimal hash string
 */
async function hashPassword(password) {
  if (!password) return '';
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate a cryptographically secure random token string
 * @returns {string}
 */
function generateSecureToken() {
  if (window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID() + '-' + Date.now().toString(36);
  }
  const array = new Uint8Array(24);
  window.crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('') + '-' + Date.now().toString(36);
}

/**
 * Get all registered users from localStorage
 * @returns {Array<Object>}
 */
function getUsers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Failed to parse users from localStorage', err);
    return [];
  }
}

/**
 * Save users array to localStorage
 * @param {Array<Object>} users
 */
function saveUsers(users) {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
}

/**
 * Register a new user
 * @param {string} name
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{success: boolean, message: string, user?: Object}>}
 */
async function signup(name, email, password) {
  const trimmedName = (name || '').trim();
  const trimmedEmail = (email || '').trim().toLowerCase();
  const cleanPassword = password || '';

  if (!trimmedName) {
    return { success: false, message: 'Please enter your full name.' };
  }
  if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    return { success: false, message: 'Please provide a valid email address.' };
  }
  if (cleanPassword.length < 6) {
    return { success: false, message: 'Password must be at least 6 characters long.' };
  }

  const users = getUsers();
  const existingUser = users.find(u => u.email === trimmedEmail);
  if (existingUser) {
    return { success: false, message: 'An account with this email already exists. Please log in.' };
  }

  const passwordHash = await hashPassword(cleanPassword);
  const newUser = {
    id: 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    name: trimmedName,
    email: trimmedEmail,
    passwordHash: passwordHash,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  saveUsers(users);

  return { success: true, message: 'Registration successful! You can now log in.', user: newUser };
}

/**
 * Log in a user by verifying SHA-256 password hash and creating an expiring session token
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{success: boolean, message: string, session?: Object}>}
 */
async function login(email, password) {
  const trimmedEmail = (email || '').trim().toLowerCase();
  const cleanPassword = password || '';

  if (!trimmedEmail || !cleanPassword) {
    return { success: false, message: 'Please provide both email and password.' };
  }

  const users = getUsers();
  const user = users.find(u => u.email === trimmedEmail);
  if (!user) {
    return { success: false, message: 'Invalid credentials. User not found.' };
  }

  const inputHash = await hashPassword(cleanPassword);
  if (inputHash !== user.passwordHash) {
    return { success: false, message: 'Invalid password. Please check and try again.' };
  }

  // Create session with random token and expiry
  const sessionToken = generateSecureToken();
  const expiresAt = Date.now() + SESSION_DURATION_MS;

  const session = {
    token: sessionToken,
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    expiresAt: expiresAt
  };

  localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));

  return { success: true, message: `Welcome back, ${user.name}!`, session };
}

/**
 * Get active session. Returns null if missing or expired.
 * @returns {Object|null}
 */
function getCurrentSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSION);
    if (!raw) return null;
    const session = JSON.parse(raw);

    // Check expiry
    if (!session || !session.token || !session.expiresAt || Date.now() > session.expiresAt) {
      logout();
      return null;
    }
    return session;
  } catch (err) {
    console.error('Failed to read session', err);
    logout();
    return null;
  }
}

/**
 * Log out user by clearing session
 */
function logout() {
  localStorage.removeItem(STORAGE_KEYS.SESSION);
}

/**
 * Route guard: Redirect to auth.html if user is not authenticated
 * @param {string} redirectUrl
 */
function requireAuth(redirectUrl = 'auth.html') {
  const session = getCurrentSession();
  if (!session) {
    const currentPath = encodeURIComponent(window.location.pathname.split('/').pop() || 'dashboard.html');
    window.location.href = `${redirectUrl}?redirect=${currentPath}`;
    return false;
  }
  return session;
}

/**
 * Redirect already logged-in users away from auth page
 * @param {string} targetUrl
 */
function redirectIfLoggedIn(targetUrl = 'dashboard.html') {
  const session = getCurrentSession();
  if (session) {
    window.location.href = targetUrl;
  }
}

/**
 * Update site navigation dynamically based on authentication state
 */
function updateNavigation() {
  const navActions = document.getElementById('nav-actions');
  if (!navActions) return;

  const session = getCurrentSession();

  if (session) {
    const firstInitial = (session.userName || 'U').charAt(0).toUpperCase();
    navActions.innerHTML = `
      <div class="nav-user-pill" title="${session.userEmail}">
        <div class="user-avatar-initial">${firstInitial}</div>
        <span>${escapeHtml(session.userName)}</span>
      </div>
      <a href="dashboard.html" class="btn btn-secondary btn-sm" id="nav-dash-btn">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
        Dashboard
      </a>
      <button class="btn btn-outline btn-sm" id="nav-logout-btn">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
        Logout
      </button>
    `;

    document.getElementById('nav-logout-btn')?.addEventListener('click', () => {
      logout();
      showToast('Logged out successfully', 'info');
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 500);
    });
  } else {
    navActions.innerHTML = `
      <a href="auth.html?mode=login" class="btn btn-outline btn-sm">Sign In</a>
      <a href="auth.html?mode=signup" class="btn btn-primary btn-sm">Create Account</a>
    `;
  }
}

/**
 * Seed initial demo user if database is empty
 */
async function seedDefaultUserIfEmpty() {
  const users = getUsers();
  if (users.length === 0) {
    const demoPasswordHash = await hashPassword('Demo@123');
    const demoUser = {
      id: 'user_demo_01',
      name: 'Apurv Pandey',
      email: 'demo@example.com',
      passwordHash: demoPasswordHash,
      createdAt: new Date().toISOString()
    };
    saveUsers([demoUser]);
    console.log('Seeded default demo user: demo@example.com / Demo@123');
  }
}

/**
 * Safe HTML escape utility
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Toast Notification system
 * @param {string} message
 * @param {'success'|'error'|'info'} type
 */
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const iconMap = {
    success: '<svg width="18" height="18" fill="none" stroke="#10b981" viewBox="0 0 24 24" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>',
    error: '<svg width="18" height="18" fill="none" stroke="#ef4444" viewBox="0 0 24 24" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
    info: '<svg width="18" height="18" fill="none" stroke="#6366f1" viewBox="0 0 24 24" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'
  };

  toast.innerHTML = `
    <span>${iconMap[type] || ''}</span>
    <span style="flex:1;">${escapeHtml(message)}</span>
  `;

  container.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Ensure default user is seeded on load
seedDefaultUserIfEmpty();
