// public/auth.js - PulseGuard Supabase Authentication & Session Engine
(function () {
  'use strict';

  const SUPABASE_URL = 'https://ppvullctudlfjqunkmad.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_kD5f5BdXu8f64Ty8GbU5zQ_skOCQrI-';

  let client = null;
  let currentUser = null;

  function getClient() {
    if (client) return client;
    if (window.supabaseClient) {
      client = window.supabaseClient;
      return client;
    }

    const sbLib = window.supabase || (typeof createClient === 'function' ? { createClient } : null);
    if (!sbLib || !sbLib.createClient) {
      console.warn('[PulseGuard Auth] Supabase library not yet loaded on window.');
      return null;
    }

    client = sbLib.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'pulseguard_supabase_session'
      }
    });

    window.supabaseClient = client;
    return client;
  }

  // Friendly error formatter without leaking sensitive details
  function formatAuthError(err) {
    if (!err) return 'An unexpected authentication error occurred.';
    const msg = (err.message || err.msg || String(err)).toLowerCase();

    if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
      return 'Invalid email or password. Please verify your credentials and try again.';
    }
    if (msg.includes('email not confirmed')) {
      return 'Please verify your email address before signing in. Check your inbox for the confirmation link.';
    }
    if (msg.includes('user already registered') || msg.includes('already registered')) {
      return 'An account with this email already exists. Please sign in instead.';
    }
    if (msg.includes('weak_password') || msg.includes('password should be at least')) {
      return 'Password must be at least 6 characters long.';
    }
    if (msg.includes('rate limit') || msg.includes('too many requests')) {
      return 'Too many login attempts. Please wait a moment and try again.';
    }
    if (msg.includes('network') || msg.includes('failed to fetch')) {
      return 'Network connection issue. Please check your internet connection.';
    }
    return err.message || 'Authentication request could not be completed.';
  }

  // Sync authenticated user with server audit records
  async function syncSessionToServer(user) {
    if (!user || !user.email) return;
    try {
      await fetch('/api/auth/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          name: user.user_metadata?.full_name || user.email.split('@')[0],
          userId: user.id
        })
      });
    } catch (e) {
      // Non-blocking background sync
    }
  }

  // --- UI Controller ---
  const AuthUI = {
    views: {
      login: 'auth-view-login',
      signup: 'auth-view-signup',
      forgot: 'auth-view-forgot',
      recovery: 'auth-view-recovery'
    },

    showView(viewKey) {
      Object.keys(this.views).forEach(key => {
        const el = document.getElementById(this.views[key]);
        if (el) el.style.display = key === viewKey ? 'block' : 'none';
      });

      // Update tabs if switching between login and signup
      const tabLogin = document.getElementById('auth-tab-btn-login');
      const tabSignup = document.getElementById('auth-tab-btn-signup');
      if (tabLogin && tabSignup) {
        tabLogin.classList.toggle('active', viewKey === 'login');
        tabSignup.classList.toggle('active', viewKey === 'signup');
      }

      this.clearAllAlerts();
    },

    setLoading(btnId, isLoading, defaultText) {
      const btn = document.getElementById(btnId);
      if (!btn) return;
      btn.disabled = isLoading;
      if (isLoading) {
        btn.innerHTML = `<span class="btn-spinner" aria-hidden="true"></span> <span>Processing...</span>`;
      } else {
        btn.innerHTML = defaultText;
      }
    },

    showAlert(bannerId, message, type = 'error') {
      const banner = document.getElementById(bannerId);
      if (!banner) return;
      banner.className = `auth-alert-banner ${type}`;
      banner.style.display = 'flex';
      banner.innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0; margin-top:1px;">
          ${type === 'error'
            ? '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>'
            : '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>'}
        </svg>
        <span>${message}</span>
      `;
    },

    clearAlert(bannerId) {
      const banner = document.getElementById(bannerId);
      if (banner) {
        banner.style.display = 'none';
        banner.innerHTML = '';
      }
    },

    clearAllAlerts() {
      ['login-error-banner', 'signup-error-banner', 'signup-confirm-banner', 'forgot-error-banner', 'forgot-success-banner', 'recovery-error-banner', 'recovery-success-banner']
        .forEach(id => this.clearAlert(id));
    },

    showAuthenticated(user) {
      currentUser = user;
      const loadingScreen = document.getElementById('auth-loading-screen');
      const authContainer = document.getElementById('auth-container');
      const appShell = document.getElementById('app-shell');

      if (loadingScreen) loadingScreen.style.display = 'none';
      if (authContainer) authContainer.style.display = 'none';
      if (appShell) appShell.style.display = 'block';

      // Update User Badge in Navbar
      const badge = document.getElementById('user-profile-badge');
      const nameEl = document.getElementById('user-display-name');
      const avatarEl = document.getElementById('user-avatar-initials');

      if (badge) badge.style.display = 'flex';
      const name = user.user_metadata?.full_name || user.email.split('@')[0];
      if (nameEl) nameEl.textContent = name;
      if (avatarEl) avatarEl.textContent = (name[0] || 'U').toUpperCase();

      // Trigger app load if not already loaded
      if (window.PulseGuardApp && typeof window.PulseGuardApp.onAuthenticated === 'function') {
        window.PulseGuardApp.onAuthenticated(user);
      }
    },

    showUnauthenticated() {
      currentUser = null;
      const loadingScreen = document.getElementById('auth-loading-screen');
      const authContainer = document.getElementById('auth-container');
      const appShell = document.getElementById('app-shell');
      const badge = document.getElementById('user-profile-badge');

      if (loadingScreen) loadingScreen.style.display = 'none';
      if (appShell) appShell.style.display = 'none';
      if (authContainer) authContainer.style.display = 'flex';
      if (badge) badge.style.display = 'none';

      this.showView('login');
    }
  };

  // --- Password Toggle Helper ---
  function setupPasswordToggle(btnId, inputId) {
    const btn = document.getElementById(btnId);
    const input = document.getElementById(inputId);
    if (!btn || !input) return;

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const isPw = input.type === 'password';
      input.type = isPw ? 'text' : 'password';
      btn.setAttribute('aria-label', isPw ? 'Hide password' : 'Show password');
      btn.innerHTML = isPw
        ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`
        : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
    });
  }

  // --- Authentication Logic ---
  async function handleLoginSubmit(e) {
    e.preventDefault();
    AuthUI.clearAllAlerts();

    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
      AuthUI.showAlert('login-error-banner', 'Please enter both email and password.');
      return;
    }

    const sb = getClient();
    if (!sb) {
      AuthUI.showAlert('login-error-banner', 'Authentication client is unavailable. Please refresh.');
      return;
    }

    AuthUI.setLoading('btn-login-submit', true, 'Sign In');
    try {
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw error;

      if (data && data.session) {
        await syncSessionToServer(data.user);
        AuthUI.showAuthenticated(data.user);
      } else {
        throw new Error('Sign in completed but no session was returned.');
      }
    } catch (err) {
      AuthUI.showAlert('login-error-banner', formatAuthError(err));
    } finally {
      AuthUI.setLoading('btn-login-submit', false, 'Sign In');
    }
  }

  async function handleSignupSubmit(e) {
    e.preventDefault();
    AuthUI.clearAllAlerts();

    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm-password').value;
    const agreeTerms = document.getElementById('signup-agree-terms').checked;

    if (!name) {
      AuthUI.showAlert('signup-error-banner', 'Please enter your full name.');
      return;
    }
    if (!email) {
      AuthUI.showAlert('signup-error-banner', 'Please enter a valid work email.');
      return;
    }
    if (password.length < 6) {
      AuthUI.showAlert('signup-error-banner', 'Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      AuthUI.showAlert('signup-error-banner', 'Passwords do not match. Please re-enter.');
      return;
    }
    if (!agreeTerms) {
      AuthUI.showAlert('signup-error-banner', 'You must agree to the Terms of Service & Privacy Policy.');
      return;
    }

    const sb = getClient();
    if (!sb) {
      AuthUI.showAlert('signup-error-banner', 'Authentication service unavailable.');
      return;
    }

    AuthUI.setLoading('btn-signup-submit', true, 'Create Account');
    try {
      const { data, error } = await sb.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name }
        }
      });

      if (error) throw error;

      // Note: Do NOT treat successful signUp API response as proof of valid active session
      if (data && data.session) {
        // Direct auto-confirm active
        await syncSessionToServer(data.user);
        AuthUI.showAuthenticated(data.user);
      } else if (data && data.user) {
        // Email verification required
        AuthUI.showAlert(
          'signup-confirm-banner',
          `Verification email sent to <strong>${email}</strong>! Please check your inbox and click the confirmation link before signing in.`,
          'success'
        );
        document.getElementById('form-signup').reset();
      } else {
        throw new Error('Unable to complete registration. Please try again.');
      }
    } catch (err) {
      AuthUI.showAlert('signup-error-banner', formatAuthError(err));
    } finally {
      AuthUI.setLoading('btn-signup-submit', false, 'Create Account');
    }
  }

  async function handleForgotSubmit(e) {
    e.preventDefault();
    AuthUI.clearAllAlerts();

    const email = document.getElementById('forgot-email').value.trim();
    if (!email) {
      AuthUI.showAlert('forgot-error-banner', 'Please enter your registered email address.');
      return;
    }

    const sb = getClient();
    if (!sb) {
      AuthUI.showAlert('forgot-error-banner', 'Authentication service unavailable.');
      return;
    }

    AuthUI.setLoading('btn-forgot-submit', true, 'Send Reset Link');
    try {
      const redirectUrl = window.location.origin + window.location.pathname;
      const { error } = await sb.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl
      });
      if (error) throw error;

      AuthUI.showAlert(
        'forgot-success-banner',
        `Password recovery link has been dispatched to <strong>${email}</strong>. Check your inbox.`,
        'success'
      );
      document.getElementById('form-forgot').reset();
    } catch (err) {
      AuthUI.showAlert('forgot-error-banner', formatAuthError(err));
    } finally {
      AuthUI.setLoading('btn-forgot-submit', false, 'Send Reset Link');
    }
  }

  async function handleRecoverySubmit(e) {
    e.preventDefault();
    AuthUI.clearAllAlerts();

    const password = document.getElementById('recovery-password').value;
    const confirmPassword = document.getElementById('recovery-confirm-password').value;

    if (password.length < 6) {
      AuthUI.showAlert('recovery-error-banner', 'New password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      AuthUI.showAlert('recovery-error-banner', 'Passwords do not match.');
      return;
    }

    const sb = getClient();
    if (!sb) {
      AuthUI.showAlert('recovery-error-banner', 'Authentication service unavailable.');
      return;
    }

    AuthUI.setLoading('btn-recovery-submit', true, 'Update Password');
    try {
      const { data, error } = await sb.auth.updateUser({ password });
      if (error) throw error;

      AuthUI.showAlert('recovery-success-banner', 'Password updated successfully! Redirecting...', 'success');
      setTimeout(() => {
        window.location.hash = '';
        if (data.user) {
          AuthUI.showAuthenticated(data.user);
        } else {
          AuthUI.showView('login');
        }
      }, 1200);
    } catch (err) {
      AuthUI.showAlert('recovery-error-banner', formatAuthError(err));
    } finally {
      AuthUI.setLoading('btn-recovery-submit', false, 'Update Password');
    }
  }

  async function handleLogout() {
    const sb = getClient();
    if (sb) {
      try {
        await sb.auth.signOut();
      } catch (err) {
        console.warn('Sign out error:', err.message);
      }
    }
    AuthUI.showUnauthenticated();
  }

  // --- Session Initialization & State Listener ---
  async function initAuth() {
    // Check for recovery hash in URL
    const hash = window.location.hash;
    const isRecovery = hash && (hash.includes('type=recovery') || hash.includes('access_token='));

    // Check error in URL hash
    if (hash && hash.includes('error=')) {
      const params = new URLSearchParams(hash.replace('#', '?'));
      const errorDesc = params.get('error_description') || params.get('error') || 'Authentication link failed.';
      AuthUI.showUnauthenticated();
      AuthUI.showAlert('login-error-banner', decodeURIComponent(errorDesc.replace(/\+/g, ' ')));
      return;
    }

    const sb = getClient();
    if (!sb) {
      console.warn('[PulseGuard Auth] Supabase client could not be created.');
      AuthUI.showUnauthenticated();
      return;
    }

    // Subscribe to auth state transitions
    sb.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        const authContainer = document.getElementById('auth-container');
        const appShell = document.getElementById('app-shell');
        if (appShell) appShell.style.display = 'none';
        if (authContainer) authContainer.style.display = 'flex';
        AuthUI.showView('recovery');
        return;
      }

      if (event === 'SIGNED_IN' && session && session.user) {
        await syncSessionToServer(session.user);
        AuthUI.showAuthenticated(session.user);
      } else if (event === 'SIGNED_OUT') {
        AuthUI.showUnauthenticated();
      } else if (event === 'TOKEN_REFRESHED' && session && session.user) {
        currentUser = session.user;
      }
    });

    // Check initial active session
    try {
      const { data: { session }, error } = await sb.auth.getSession();
      if (error) throw error;

      if (isRecovery) {
        const authContainer = document.getElementById('auth-container');
        const appShell = document.getElementById('app-shell');
        if (appShell) appShell.style.display = 'none';
        if (authContainer) authContainer.style.display = 'flex';
        AuthUI.showView('recovery');
        return;
      }

      if (session && session.user) {
        await syncSessionToServer(session.user);
        AuthUI.showAuthenticated(session.user);
      } else {
        AuthUI.showUnauthenticated();
      }
    } catch (err) {
      console.warn('[PulseGuard Auth] Session lookup error:', err.message);
      AuthUI.showUnauthenticated();
    }
  }

  // --- Wire Event Listeners ---
  function setupAuthEvents() {
    // Tab toggles
    const tabLogin = document.getElementById('auth-tab-btn-login');
    const tabSignup = document.getElementById('auth-tab-btn-signup');
    if (tabLogin) tabLogin.addEventListener('click', () => AuthUI.showView('login'));
    if (tabSignup) tabSignup.addEventListener('click', () => AuthUI.showView('signup'));

    // Switch links
    const linkToSignup = document.getElementById('link-goto-signup');
    const linkToLogin = document.getElementById('link-goto-login');
    const linkForgot = document.getElementById('link-forgot-password');
    const linkForgotBack = document.getElementById('link-forgot-back-login');

    if (linkToSignup) linkToSignup.addEventListener('click', (e) => { e.preventDefault(); AuthUI.showView('signup'); });
    if (linkToLogin) linkToLogin.addEventListener('click', (e) => { e.preventDefault(); AuthUI.showView('login'); });
    if (linkForgot) linkForgot.addEventListener('click', (e) => { e.preventDefault(); AuthUI.showView('forgot'); });
    if (linkForgotBack) linkForgotBack.addEventListener('click', (e) => { e.preventDefault(); AuthUI.showView('login'); });

    // Terms / Privacy Modals from inside Auth
    const linkAuthTos = document.getElementById('auth-link-tos');
    const linkAuthPrivacy = document.getElementById('auth-link-privacy');
    const modalTos = document.getElementById('modal-tos');
    const modalPrivacy = document.getElementById('modal-privacy');

    if (linkAuthTos && modalTos) {
      linkAuthTos.addEventListener('click', (e) => { e.preventDefault(); modalTos.classList.add('open'); });
    }
    if (linkAuthPrivacy && modalPrivacy) {
      linkAuthPrivacy.addEventListener('click', (e) => { e.preventDefault(); modalPrivacy.classList.add('open'); });
    }

    // Password visibility toggles
    setupPasswordToggle('btn-toggle-login-pw', 'login-password');
    setupPasswordToggle('btn-toggle-signup-pw', 'signup-password');
    setupPasswordToggle('btn-toggle-confirm-pw', 'signup-confirm-password');

    // Forms
    const formLogin = document.getElementById('form-login');
    if (formLogin) formLogin.addEventListener('submit', handleLoginSubmit);

    const formSignup = document.getElementById('form-signup');
    if (formSignup) formSignup.addEventListener('submit', handleSignupSubmit);

    const formForgot = document.getElementById('form-forgot');
    if (formForgot) formForgot.addEventListener('submit', handleForgotSubmit);

    const formRecovery = document.getElementById('form-recovery');
    if (formRecovery) formRecovery.addEventListener('submit', handleRecoverySubmit);

    // Navbar Logout
    const btnLogout = document.getElementById('btn-auth-logout');
    if (btnLogout) btnLogout.addEventListener('click', handleLogout);
  }

  // Initialize once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setupAuthEvents();
      initAuth();
    });
  } else {
    setupAuthEvents();
    initAuth();
  }

  // Export public API
  window.PulseGuardAuth = {
    getClient,
    getUser: () => currentUser,
    signOut: handleLogout,
    initAuth
  };
})();
