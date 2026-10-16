// public/app.js - PulseGuard Personal Budget & Expense Manager Core Engine with 20 Advanced Features
(function () {
  'use strict';

  // --- Storage Keys ---
  const STORAGE_KEYS = {
    TRANSACTIONS: 'pulseguard_transactions',
    BUDGETS: 'pulseguard_budgets',
    CATEGORIES: 'pulseguard_categories',
    CURRENCY: 'pulseguard_currency',
    THEME: 'pulseguard_theme',
    COOKIE_ACCEPTED: 'pulseguard_cookie_accepted',
    PASSCODE: 'pulseguard_passcode',
    UTM: 'pulseguard_utm'
  };

  // --- Currency Formats ---
  const CURRENCIES = {
    USD: { symbol: '$', code: 'USD', locale: 'en-US' },
    EUR: { symbol: '€', code: 'EUR', locale: 'de-DE' },
    GBP: { symbol: '£', code: 'GBP', locale: 'en-GB' },
    INR: { symbol: '₹', code: 'INR', locale: 'en-IN' },
    CAD: { symbol: 'C$', code: 'CAD', locale: 'en-CA' },
    AUD: { symbol: 'A$', code: 'AUD', locale: 'en-AU' },
    JPY: { symbol: '¥', code: 'JPY', locale: 'ja-JP' }
  };

  // --- App State ---
  const state = {
    transactions: [],
    monthlyBudgets: {},
    categories: [],
    currentMonth: '2026-10', // Default context: October 2026
    currency: 'USD',
    theme: 'light', // Default context: Warm off-white paper canvas (#faf8f5)
    activeTab: 'dashboard',
    lastUpdated: Date.now(),
    txFilters: {
      search: '',
      type: 'all',
      category: 'all',
      sort: 'date-desc',
      page: 1,
      pageSize: 10
    },
    editingTxId: null,
    pendingCsvImport: null,
    confirmPromiseResolve: null,
    sqlConnected: false,
    dbStatus: null
  };

  // --- SQL Database Client API Layer ---
  const SQL_API = {
    async getStatus() {
      try {
        const res = await fetch('/api/db/status');
        if (!res.ok) throw new Error('Status failed');
        return await res.json();
      } catch (e) {
        return null;
      }
    },
    async getAllData() {
      try {
        const res = await fetch('/api/data');
        if (!res.ok) throw new Error('Fetch data failed');
        return await res.json();
      } catch (e) {
        return null;
      }
    },
    async addTransaction(tx) {
      try {
        const res = await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(tx)
        });
        if (!res.ok) throw new Error('Insert failed');
        return await res.json();
      } catch (e) {
        console.warn('[SQL] Offline fallback for insert:', e);
        return tx;
      }
    },
    async updateTransaction(id, tx) {
      try {
        const res = await fetch(`/api/transactions/${encodeURIComponent(id)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(tx)
        });
        if (!res.ok) throw new Error('Update failed');
        return await res.json();
      } catch (e) {
        console.warn('[SQL] Offline fallback for update:', e);
        return tx;
      }
    },
    async deleteTransaction(id) {
      try {
        const res = await fetch(`/api/transactions/${encodeURIComponent(id)}`, {
          method: 'DELETE'
        });
        if (!res.ok) throw new Error('Delete failed');
        return await res.json();
      } catch (e) {
        console.warn('[SQL] Offline fallback for delete:', e);
        return { success: true, id };
      }
    },
    async upsertBudget(month, categoryId, amount) {
      try {
        const res = await fetch('/api/budgets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ month, categoryId, amount })
        });
        if (!res.ok) throw new Error('Budget upsert failed');
        return await res.json();
      } catch (e) {
        console.warn('[SQL] Offline fallback for budget:', e);
        return { month, categoryId, amount };
      }
    },
    async importCsv(transactions, mode) {
      try {
        const res = await fetch('/api/import-csv', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transactions, mode })
        });
        if (!res.ok) throw new Error('Batch import failed');
        return await res.json();
      } catch (e) {
        console.warn('[SQL] Offline fallback for CSV import:', e);
        return { success: true, count: transactions.length };
      }
    },
    async resetDemo() {
      try {
        const res = await fetch('/api/reset-demo', { method: 'POST' });
        if (!res.ok) throw new Error('Reset demo failed');
        return await res.json();
      } catch (e) {
        console.warn('[SQL] Offline fallback for demo reset:', e);
        return { success: true };
      }
    },
    async clearAll() {
      try {
        const res = await fetch('/api/clear-all', { method: 'POST' });
        if (!res.ok) throw new Error('Clear all failed');
        return await res.json();
      } catch (e) {
        console.warn('[SQL] Offline fallback for wipe:', e);
        return { success: true };
      }
    },
    async saveSetting(key, value) {
      try {
        await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, value })
        });
      } catch (e) {
        // Silent fallback
      }
    }
  };

  async function syncWithSqlDatabase(showToastNotice = false) {
    const badge = document.getElementById('sql-db-badge');
    const badgeText = document.getElementById('sql-db-text');

    if (badgeText) badgeText.textContent = 'Connecting...';

    const status = await SQL_API.getStatus();
    if (status && status.healthy) {
      state.sqlConnected = true;
      state.dbStatus = status;

      const data = await SQL_API.getAllData();
      if (data && data.transactions) {
        state.transactions = data.transactions;
        if (data.categories && data.categories.length > 0) {
          state.categories = data.categories;
        }
        if (data.monthlyBudgets) {
          state.monthlyBudgets = data.monthlyBudgets;
        }

        // Cache in browser storage for instant offline fallback
        try {
          localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(state.transactions));
          localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(state.monthlyBudgets));
          localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(state.categories));
        } catch (e) {}

        if (badge) badge.classList.add('active');
        if (badgeText) badgeText.textContent = 'SQL Connected';
        updateSqlStatusCard(status);
        renderAll();
        if (showToastNotice) {
          showToast(`Synchronized ${data.transactions.length} records with SQLite.`, 'success');
        }
        return;
      }
    }

    // Offline / fallback state
    state.sqlConnected = false;
    if (badge) badge.classList.remove('active');
    if (badgeText) badgeText.textContent = 'Offline Cache';
    updateSqlStatusCard(null);
    if (showToastNotice) {
      showToast('Operating in browser offline storage mode.', 'info');
    }
  }

  function updateSqlStatusCard(status) {
    const statTx = document.getElementById('sql-stat-tx');
    const statCat = document.getElementById('sql-stat-cat');
    const statBudgets = document.getElementById('sql-stat-budgets');
    const metaSize = document.getElementById('sql-meta-size');
    const metaStatus = document.getElementById('sql-meta-status');
    const enginePill = document.getElementById('sql-engine-pill');

    if (status && status.healthy) {
      if (statTx) statTx.textContent = status.tables.transactions != null ? status.tables.transactions : state.transactions.length;
      if (statCat) statCat.textContent = status.tables.categories != null ? status.tables.categories : state.categories.length;
      if (statBudgets) statBudgets.textContent = status.tables.monthly_budgets != null ? status.tables.monthly_budgets : Object.keys(state.monthlyBudgets).length;
      if (metaSize) metaSize.textContent = `${Math.round(status.fileSizeBytes / 1024)} KB`;
      if (metaStatus) {
        metaStatus.textContent = 'Connected (WAL)';
        metaStatus.style.color = 'var(--accent)';
      }
      if (enginePill) {
        enginePill.textContent = 'SQLite 3 Active';
        enginePill.style.background = 'var(--surface-card)';
        enginePill.style.color = 'var(--text-main)';
      }
    } else {
      if (statTx) statTx.textContent = state.transactions.length;
      if (statCat) statCat.textContent = state.categories.length;
      if (statBudgets) statBudgets.textContent = Object.keys(state.monthlyBudgets).length;
      if (metaStatus) {
        metaStatus.textContent = 'Local Cache Only';
        metaStatus.style.color = 'var(--text-dim)';
      }
      if (enginePill) {
        enginePill.textContent = 'Offline Browser Mode';
        enginePill.style.background = 'var(--surface-hover)';
        enginePill.style.color = 'var(--text-dim)';
      }
    }
  }

  // --- Initialization ---
  function init() {
    captureUtmParameters(); // 14. UTM Tracking
    loadSettings();
    loadData();
    initCookieBanner();     // 2. Cookie Banner
    initLastUpdatedSync();  // 18. Last Updated Date
    initPasscodeLock();     // 13. Password Visibility Toggle
    setupEventListeners();
    updateMonthDisplay();
    updatePageTitle();      // 5. Dynamic Page Title
    const copyYear = document.getElementById('copyright-year');
    if (copyYear) copyYear.textContent = new Date().getFullYear();
    renderAll();
    syncWithSqlDatabase(false); // Connect & sync with SQLite database
  }

  // --- 14. UTM Tracking ---
  function captureUtmParameters() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
      const captured = {};
      let hasUtm = false;

      utmKeys.forEach(k => {
        if (urlParams.has(k)) {
          captured[k] = urlParams.get(k);
          hasUtm = true;
        }
      });

      if (hasUtm) {
        captured.capturedAt = new Date().toISOString();
        localStorage.setItem(STORAGE_KEYS.UTM, JSON.stringify(captured));
      }

      // Display in UI
      const savedUtm = localStorage.getItem(STORAGE_KEYS.UTM);
      const pill = document.getElementById('utm-status-pill');
      const details = document.getElementById('utm-details-content');

      if (savedUtm && pill && details) {
        const parsed = JSON.parse(savedUtm);
        pill.textContent = parsed.utm_campaign || parsed.utm_source || 'Active';
        pill.style.background = 'var(--primary-subtle)';
        pill.style.color = 'var(--primary)';
        details.innerHTML = `
          <strong>Source:</strong> ${escapeHtml(parsed.utm_source || 'N/A')} &bull;
          <strong>Medium:</strong> ${escapeHtml(parsed.utm_medium || 'N/A')} &bull;
          <strong>Campaign:</strong> ${escapeHtml(parsed.utm_campaign || 'N/A')}
        `;
      }
    } catch (e) {
      console.warn('UTM tracking error:', e);
    }
  }

  // --- 2. Simple Cookie / Storage Banner ---
  function initCookieBanner() {
    const banner = document.getElementById('cookie-banner');
    if (!banner) return;
    const accepted = localStorage.getItem(STORAGE_KEYS.COOKIE_ACCEPTED);
    if (accepted === 'true') {
      banner.style.display = 'none';
    } else {
      banner.style.display = 'flex';
    }

    const btnAccept = document.getElementById('btn-cookie-accept');
    if (btnAccept) {
      btnAccept.addEventListener('click', () => {
        localStorage.setItem(STORAGE_KEYS.COOKIE_ACCEPTED, 'true');
        banner.style.display = 'none';
        showToast('Storage preferences saved.', 'info');
      });
    }

    const btnPrefs = document.getElementById('btn-cookie-preferences');
    if (btnPrefs) {
      btnPrefs.addEventListener('click', () => {
        showToast('All storage is 100% local inside your browser. No external cookies used.', 'info');
      });
    }
  }

  // --- 18. Last Updated Date / Sync Tracker ---
  function initLastUpdatedSync() {
    updateLastUpdatedText();
    setInterval(updateLastUpdatedText, 30000); // Check every 30s
  }

  function markDataUpdated() {
    state.lastUpdated = Date.now();
    updateLastUpdatedText();
  }

  function updateLastUpdatedText() {
    const textEl = document.getElementById('last-updated-text');
    if (!textEl) return;
    const diffSec = Math.floor((Date.now() - state.lastUpdated) / 1000);

    if (diffSec < 10) {
      textEl.textContent = 'Synced just now';
    } else if (diffSec < 60) {
      textEl.textContent = `Synced ${diffSec}s ago`;
    } else if (diffSec < 3600) {
      const mins = Math.floor(diffSec / 60);
      textEl.textContent = `Synced ${mins}m ago`;
    } else {
      const hours = Math.floor(diffSec / 3600);
      textEl.textContent = `Synced ${hours}h ago`;
    }
  }

  // --- 13. Password / Passcode Visibility Toggle ---
  function initPasscodeLock() {
    const input = document.getElementById('vault-passcode');
    const toggleBtn = document.getElementById('btn-toggle-pw');
    const eyeIcon = document.getElementById('pw-icon-eye');
    const eyeOffIcon = document.getElementById('pw-icon-eye-off');
    const saveBtn = document.getElementById('btn-save-passcode');
    const clearBtn = document.getElementById('btn-clear-passcode');
    const pill = document.getElementById('passcode-status-pill');

    const savedPass = localStorage.getItem(STORAGE_KEYS.PASSCODE);
    if (savedPass && pill) {
      pill.textContent = 'Protected';
      pill.style.background = 'var(--surface-card)';
      pill.style.color = 'var(--ink)';
      if (input) input.value = savedPass;
    }

    if (toggleBtn && input && eyeIcon && eyeOffIcon) {
      toggleBtn.addEventListener('click', () => {
        const isPassword = input.getAttribute('type') === 'password';
        input.setAttribute('type', isPassword ? 'text' : 'password');
        eyeIcon.style.display = isPassword ? 'none' : 'block';
        eyeOffIcon.style.display = isPassword ? 'block' : 'none';
      });
    }

    if (saveBtn && input) {
      saveBtn.addEventListener('click', () => {
        const val = input.value.trim();
        if (!val) {
          showToast('Please enter a passcode to save.', 'warning');
          return;
        }
        localStorage.setItem(STORAGE_KEYS.PASSCODE, val);
        if (pill) {
          pill.textContent = 'Protected';
          pill.style.background = 'var(--surface-card)';
          pill.style.color = 'var(--ink)';
        }
        showToast('Local passcode saved.', 'success');
      });
    }

    if (clearBtn && input) {
      clearBtn.addEventListener('click', () => {
        localStorage.removeItem(STORAGE_KEYS.PASSCODE);
        input.value = '';
        if (pill) {
          pill.textContent = 'Unset';
          pill.style.background = 'var(--surface-hover)';
          pill.style.color = 'var(--text-dim)';
        }
        showToast('Passcode removed.', 'info');
      });
    }
  }

  // --- Load Data from LocalStorage ---
  function loadData() {
    try {
      const storedTx = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS) || localStorage.getItem('budgetpulse_transactions');
      const storedBudgets = localStorage.getItem(STORAGE_KEYS.BUDGETS) || localStorage.getItem('budgetpulse_budgets');
      const storedCategories = localStorage.getItem(STORAGE_KEYS.CATEGORIES) || localStorage.getItem('budgetpulse_categories');

      if (storedTx && storedBudgets && storedCategories) {
        state.transactions = JSON.parse(storedTx);
        state.monthlyBudgets = JSON.parse(storedBudgets);
        state.categories = JSON.parse(storedCategories);
      } else {
        // First-time load: populate with realistic starter data
        if (window.BUDGET_SAMPLE_DATA) {
          state.transactions = [...window.BUDGET_SAMPLE_DATA.transactions];
          state.monthlyBudgets = { ...window.BUDGET_SAMPLE_DATA.monthlyBudgets };
          state.categories = [...window.BUDGET_SAMPLE_DATA.categories];
          saveData();
        }
      }
    } catch (e) {
      console.error('Error loading budget data from localStorage:', e);
      if (window.BUDGET_SAMPLE_DATA) {
        state.transactions = [...window.BUDGET_SAMPLE_DATA.transactions];
        state.monthlyBudgets = { ...window.BUDGET_SAMPLE_DATA.monthlyBudgets };
        state.categories = [...window.BUDGET_SAMPLE_DATA.categories];
      }
    }
  }

  // --- Save Data to LocalStorage ---
  function saveData() {
    try {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(state.transactions));
      localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(state.monthlyBudgets));
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(state.categories));
      markDataUpdated(); // 18. update sync timestamp
    } catch (e) {
      console.error('Error saving budget data to localStorage:', e);
      showToast('Error saving data to browser storage', 'danger');
    }
  }

  // --- Load & Save Settings ---
  function loadSettings() {
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || localStorage.getItem('budgetpulse_theme') || 'light';
    const savedCurrency = localStorage.getItem(STORAGE_KEYS.CURRENCY) || localStorage.getItem('budgetpulse_currency') || 'USD';
    setTheme(savedTheme);
    setCurrency(savedCurrency);
  }

  // --- 1. Dark Mode Toggle ---
  function setTheme(theme, syncSql = true) {
    state.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
    if (syncSql) {
      SQL_API.saveSetting('theme', theme);
    }
    const sunIcon = document.getElementById('theme-sun-icon');
    const moonIcon = document.getElementById('theme-moon-icon');
    if (sunIcon && moonIcon) {
      if (theme === 'light') {
        sunIcon.style.display = 'block';
        moonIcon.style.display = 'none';
      } else {
        sunIcon.style.display = 'none';
        moonIcon.style.display = 'block';
      }
    }
  }

  function setCurrency(currCode, syncSql = true) {
    if (!CURRENCIES[currCode]) currCode = 'USD';
    state.currency = currCode;
    localStorage.setItem(STORAGE_KEYS.CURRENCY, currCode);
    if (syncSql) {
      SQL_API.saveSetting('currency', currCode);
    }
    const select = document.getElementById('currency-select');
    if (select && select.value !== currCode) {
      select.value = currCode;
    }
    // Update currency symbol indicators in UI
    document.querySelectorAll('.currency-symbol').forEach(el => {
      el.textContent = CURRENCIES[currCode].symbol;
    });
  }

  // --- Currency Formatter ---
  function formatCurrency(amount) {
    const cfg = CURRENCIES[state.currency] || CURRENCIES.USD;
    const abs = Math.abs(amount || 0);
    const formatted = abs.toLocaleString(cfg.locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    return `${cfg.symbol}${formatted}`;
  }

  // --- Month Helpers ---
  function formatMonthTitle(ymString) {
    if (!ymString) return '';
    const [year, month] = ymString.split('-');
    const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  function getPreviousMonth(ymString) {
    const [year, month] = ymString.split('-').map(Number);
    const date = new Date(year, month - 2, 1);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }

  function getNextMonth(ymString) {
    const [year, month] = ymString.split('-').map(Number);
    const date = new Date(year, month, 1);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }

  function updateMonthDisplay() {
    const el = document.getElementById('current-month-text');
    if (el) {
      el.textContent = formatMonthTitle(state.currentMonth);
    }
    const expEl = document.getElementById('export-curr-month-name');
    if (expEl) {
      expEl.textContent = formatMonthTitle(state.currentMonth);
    }
    const bgtMonth = document.getElementById('budget-month-target');
    if (bgtMonth) {
      bgtMonth.textContent = formatMonthTitle(state.currentMonth);
    }
  }

  // --- Data Calculations Engine ---
  function getMonthData(ymString) {
    const txs = state.transactions.filter(t => t.date && t.date.startsWith(ymString));
    let totalIncome = 0;
    let totalExpenses = 0;
    const categorySpending = {}; // catId -> amount

    txs.forEach(t => {
      const amt = Number(t.amount) || 0;
      if (t.type === 'income') {
        totalIncome += amt;
      } else {
        totalExpenses += amt;
        categorySpending[t.categoryId] = (categorySpending[t.categoryId] || 0) + amt;
      }
    });

    const netSavings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

    // Monthly Budget Limits for this month
    const budgets = state.monthlyBudgets[ymString] || (window.BUDGET_SAMPLE_DATA ? window.BUDGET_SAMPLE_DATA.defaultBudgetLimits : {});
    let totalBudget = 0;
    Object.values(budgets).forEach(limit => {
      totalBudget += Number(limit) || 0;
    });

    const budgetRemaining = totalBudget - totalExpenses;
    const budgetUtilization = totalBudget > 0 ? (totalExpenses / totalBudget) * 100 : 0;

    return {
      transactions: txs,
      totalIncome,
      totalExpenses,
      netSavings,
      savingsRate,
      categorySpending,
      budgets,
      totalBudget,
      budgetRemaining,
      budgetUtilization
    };
  }

  // --- Master Render Function ---
  function renderAll() {
    renderDashboard();
    renderTransactionsLedger();
    renderBudgets();
  }

  // --- 6. Loading Animation Trigger on Month Change ---
  function switchMonthWithAnimation(newMonth) {
    const skeleton = document.getElementById('dashboard-loading-skeleton');
    const container = document.getElementById('dashboard-metrics-container');

    if (skeleton && container && state.activeTab === 'dashboard') {
      skeleton.style.display = 'grid';
      container.style.display = 'none';
      state.currentMonth = newMonth;
      updateMonthDisplay();

      setTimeout(() => {
        skeleton.style.display = 'none';
        container.style.display = 'grid';
        renderAll();
      }, 150);
    } else {
      state.currentMonth = newMonth;
      updateMonthDisplay();
      renderAll();
    }
  }

  // --- Render Dashboard ---
  function renderDashboard() {
    const current = getMonthData(state.currentMonth);
    const prevMonthStr = getPreviousMonth(state.currentMonth);
    const prev = getMonthData(prevMonthStr);

    // 1. Stat Cards
    const elIncome = document.getElementById('stat-total-income');
    const elExpenses = document.getElementById('stat-total-expenses');
    const elSavings = document.getElementById('stat-net-savings');
    const elRemaining = document.getElementById('stat-budget-remaining');

    if (elIncome) elIncome.textContent = formatCurrency(current.totalIncome);
    if (elExpenses) elExpenses.textContent = formatCurrency(current.totalExpenses);
    if (elSavings) {
      elSavings.textContent = (current.netSavings < 0 ? '-' : '+') + formatCurrency(current.netSavings);
      elSavings.className = 'stat-card-value ' + (current.netSavings >= 0 ? 'savings' : 'expense');
    }
    if (elRemaining) {
      elRemaining.textContent = (current.budgetRemaining < 0 ? '-' : '') + formatCurrency(Math.abs(current.budgetRemaining));
      elRemaining.className = 'stat-card-value ' + (current.budgetRemaining >= 0 ? 'income' : 'expense');
    }

    // Subtexts
    const elIncomeComp = document.getElementById('stat-income-compare');
    if (elIncomeComp) {
      if (prev.totalIncome > 0) {
        const diff = ((current.totalIncome - prev.totalIncome) / prev.totalIncome) * 100;
        const sign = diff >= 0 ? '+' : '';
        elIncomeComp.textContent = `${sign}${diff.toFixed(1)}% vs ${formatMonthTitle(prevMonthStr)}`;
        elIncomeComp.className = 'stat-card-subtext ' + (diff >= 0 ? 'positive' : 'negative');
      } else {
        elIncomeComp.textContent = `Baseline comparison`;
        elIncomeComp.className = 'stat-card-subtext';
      }
    }

    const elExpComp = document.getElementById('stat-expenses-compare');
    if (elExpComp) {
      if (prev.totalExpenses > 0) {
        const diff = ((current.totalExpenses - prev.totalExpenses) / prev.totalExpenses) * 100;
        const sign = diff >= 0 ? '+' : '';
        elExpComp.textContent = `${sign}${diff.toFixed(1)}% vs ${formatMonthTitle(prevMonthStr)}`;
        elExpComp.className = 'stat-card-subtext ' + (diff <= 0 ? 'positive' : 'negative');
      } else {
        elExpComp.textContent = `Baseline comparison`;
        elExpComp.className = 'stat-card-subtext';
      }
    }

    const elSavingsRate = document.getElementById('stat-savings-rate');
    if (elSavingsRate) {
      elSavingsRate.textContent = `${current.savingsRate.toFixed(1)}% savings rate of income`;
      elSavingsRate.className = 'stat-card-subtext ' + (current.savingsRate >= 20 ? 'positive' : (current.savingsRate >= 0 ? '' : 'negative'));
    }

    const elUtil = document.getElementById('stat-budget-utilization');
    if (elUtil) {
      elUtil.textContent = `${current.budgetUtilization.toFixed(0)}% of monthly budget allocated spent`;
      elUtil.className = 'stat-card-subtext ' + (current.budgetUtilization <= 100 ? 'positive' : 'negative');
    }

    // Editorial Showcase Hero Vignette Updates
    const edHeadline = document.getElementById('editorial-headline-text');
    if (edHeadline) edHeadline.textContent = `${formatMonthTitle(state.currentMonth)} Executive Ledger`;

    const edSavings = document.getElementById('editorial-savings-rate');
    if (edSavings) edSavings.textContent = `${current.savingsRate.toFixed(1)}%`;

    const edBudgetAlert = document.getElementById('editorial-budget-alert-pill');
    if (edBudgetAlert) {
      let overCount = 0;
      Object.entries(current.budgets).forEach(([catId, lim]) => {
        if (lim > 0 && (current.categorySpending[catId] || 0) > lim) overCount++;
      });
      edBudgetAlert.textContent = overCount === 0 ? 'All Benchmarks Intact' : `${overCount} Over-Budget Alert${overCount > 1 ? 's' : ''}`;
    }

    // 2. Plain-English Insights
    renderInsights(current, prev, prevMonthStr);

    // 3. Category Donut Chart
    renderCategoryDonut(current);

    // 4. Month-over-Month Trend Chart
    renderTrendChart();
  }

  // --- Plain-English Financial Insights Engine ---
  function renderInsights(current, prev, prevMonthStr) {
    const grid = document.getElementById('insights-grid');
    const countLabel = document.getElementById('insights-count-label');
    if (!grid) return;

    const insights = [];

    // Check each category against budget limits
    const expenseCategories = state.categories.filter(c => c.type === 'expense');

    expenseCategories.forEach(cat => {
      const spent = current.categorySpending[cat.id] || 0;
      const limit = current.budgets[cat.id] || 0;

      if (limit > 0) {
        if (spent > limit) {
          const overAmt = spent - limit;
          const overPct = Math.round((overAmt / limit) * 100);
          insights.push({
            type: 'danger',
            priority: 100 + overPct,
            headline: `${cat.name} is ${overPct}% over budget`,
            description: `${formatCurrency(spent)} spent of ${formatCurrency(limit)} budget (${formatCurrency(overAmt)} over target). Consider cutting discretionary spending here.`
          });
        } else if (spent / limit >= 0.85) {
          const utilPct = Math.round((spent / limit) * 100);
          const rem = limit - spent;
          insights.push({
            type: 'warning',
            priority: 70 + utilPct,
            headline: `${cat.name} nearing limit at ${utilPct}%`,
            description: `${formatCurrency(spent)} of ${formatCurrency(limit)} limit used. Only ${formatCurrency(rem)} left for the rest of ${formatMonthTitle(state.currentMonth)}.`
          });
        }
      }
    });

    // Savings achievement or deficit
    if (current.totalIncome > 0) {
      if (current.savingsRate >= 20) {
        insights.push({
          type: 'success',
          priority: 85,
          headline: `Healthy savings rate of ${current.savingsRate.toFixed(1)}%`,
          description: `You saved ${formatCurrency(current.netSavings)} this month. This meets the recommended 50/30/20 balanced financial rule!`
        });
      } else if (current.netSavings < 0) {
        insights.push({
          type: 'danger',
          priority: 95,
          headline: `Negative cash flow: Expenses exceed income`,
          description: `You are running a deficit of ${formatCurrency(Math.abs(current.netSavings))} this month. Review your non-essential spending.`
        });
      }
    }

    // Month-over-Month Category Trend Comparison
    expenseCategories.forEach(cat => {
      const currSpent = current.categorySpending[cat.id] || 0;
      const prevSpent = prev.categorySpending[cat.id] || 0;

      if (prevSpent >= 50 && currSpent > 0) {
        const diffPct = Math.round(((currSpent - prevSpent) / prevSpent) * 100);
        if (diffPct <= -10) {
          insights.push({
            type: 'success',
            priority: 60,
            headline: `${cat.name} spending decreased by ${Math.abs(diffPct)}%`,
            description: `You spent ${formatCurrency(currSpent)} compared to ${formatCurrency(prevSpent)} in ${formatMonthTitle(prevMonthStr)}. Great job managing costs!`
          });
        } else if (diffPct >= 25 && currSpent - prevSpent > 40) {
          insights.push({
            type: 'info',
            priority: 50,
            headline: `${cat.name} spending increased by ${diffPct}%`,
            description: `Rose from ${formatCurrency(prevSpent)} in ${formatMonthTitle(prevMonthStr)} to ${formatCurrency(currSpent)} this month.`
          });
        }
      }
    });

    // Largest spending category
    let topCat = null;
    let topAmt = 0;
    Object.entries(current.categorySpending).forEach(([catId, amt]) => {
      if (amt > topAmt) {
        topAmt = amt;
        topCat = expenseCategories.find(c => c.id === catId);
      }
    });

    if (topCat && current.totalExpenses > 0) {
      const sharePct = Math.round((topAmt / current.totalExpenses) * 100);
      insights.push({
        type: 'info',
        priority: 40,
        headline: `${topCat.name} represents ${sharePct}% of your spending`,
        description: `Your highest expense driver this month is ${topCat.name} at ${formatCurrency(topAmt)} of ${formatCurrency(current.totalExpenses)} total.`
      });
    }

    // Sort by priority descending and take top 4
    insights.sort((a, b) => b.priority - a.priority);
    const topInsights = insights.slice(0, 4);

    if (countLabel) {
      countLabel.textContent = `${topInsights.length} actionable insight${topInsights.length === 1 ? '' : 's'}`;
    }

    if (topInsights.length === 0) {
      grid.innerHTML = `
        <div class="insight-card info" style="grid-column: 1 / -1;">
          <div class="insight-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
          </div>
          <div class="insight-content">
            <div class="insight-headline">All budgets in good health</div>
            <div class="insight-desc">No overspending or anomalies detected for ${formatMonthTitle(state.currentMonth)}. Keep logging your transactions to maintain visibility.</div>
          </div>
        </div>
      `;
      return;
    }

    grid.innerHTML = topInsights.map(item => {
      let iconSvg = '';
      if (item.type === 'danger') {
        iconSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
      } else if (item.type === 'warning') {
        iconSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
      } else if (item.type === 'success') {
        iconSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
      } else {
        iconSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
      }

      const headlineHtml = item.headline.replace(/(\d+%\s+over\s+budget)/i, '<span class="insight-accent-highlight">$1</span>');

      return `
        <div class="insight-card ${item.type}">
          <div class="insight-icon">${iconSvg}</div>
          <div class="insight-content">
            <div class="insight-headline">${headlineHtml}</div>
            <div class="insight-desc">${item.description}</div>
          </div>
        </div>
      `;
    }).join('');
  }

  // --- Render Category Spending Donut Chart ---
  function renderCategoryDonut(current) {
    const svg = document.getElementById('donut-svg');
    const legend = document.getElementById('donut-legend');
    const centerVal = document.getElementById('donut-center-val');
    const totalCount = document.getElementById('donut-total-count');
    if (!svg || !legend) return;

    if (centerVal) centerVal.textContent = formatCurrency(current.totalExpenses);

    const expenseCategories = state.categories.filter(c => c.type === 'expense');
    const slices = [];
    const INK_TONES = ['#141414', '#36322e', '#57514a', '#756e64', '#948b7f', '#aea597', '#c7bfb2', '#dbd4c8'];

    expenseCategories.forEach(cat => {
      const amt = current.categorySpending[cat.id] || 0;
      if (amt > 0) {
        const limit = current.budgets[cat.id] || 0;
        const isOverBudget = limit > 0 && amt > limit;
        slices.push({
          id: cat.id,
          name: cat.name,
          isOverBudget: isOverBudget,
          amount: amt,
          percentage: current.totalExpenses > 0 ? (amt / current.totalExpenses) * 100 : 0
        });
      }
    });

    slices.sort((a, b) => b.amount - a.amount);

    // Assign exactly ONE accent slice (the over-budget category, or top driver); others get quiet ink tones
    const hasOverBudget = slices.some(s => s.isOverBudget);
    let toneIdx = 0;
    slices.forEach((slice, idx) => {
      if ((hasOverBudget && slice.isOverBudget) || (!hasOverBudget && idx === 0)) {
        slice.color = 'var(--accent)';
      } else {
        slice.color = INK_TONES[toneIdx % INK_TONES.length];
        toneIdx++;
      }
    });

    if (totalCount) {
      totalCount.textContent = `${slices.length} Active Categories`;
    }

    if (slices.length === 0 || current.totalExpenses <= 0) {
      svg.innerHTML = `
        <circle cx="100" cy="100" r="75" fill="none" stroke="var(--border)" stroke-width="24" />
      `;
      legend.innerHTML = `
        <div style="font-size: 11.5px; color: var(--text-dim); padding: 12px 0;">
          No expense transactions recorded for ${formatMonthTitle(state.currentMonth)}.
        </div>
      `;
      return;
    }

    // Generate SVG Arcs
    const cx = 100;
    const cy = 100;
    const outerR = 80;
    const innerR = 54;
    let accumulatedAngle = -90; // Start at 12 o'clock

    let pathsHtml = '';

    slices.forEach((slice, idx) => {
      const angle = (slice.percentage / 100) * 360;
      const startAngle = accumulatedAngle;
      const endAngle = accumulatedAngle + Math.min(angle, 359.99);
      accumulatedAngle += angle;

      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;

      const x1Outer = cx + outerR * Math.cos(startRad);
      const y1Outer = cy + outerR * Math.sin(startRad);
      const x2Outer = cx + outerR * Math.cos(endRad);
      const y2Outer = cy + outerR * Math.sin(endRad);

      const x1Inner = cx + innerR * Math.cos(endRad);
      const y1Inner = cy + innerR * Math.sin(endRad);
      const x2Inner = cx + innerR * Math.cos(startRad);
      const y2Inner = cy + innerR * Math.sin(startRad);

      const largeArcFlag = angle > 180 ? 1 : 0;

      const pathData = [
        `M ${x1Outer} ${y1Outer}`,
        `A ${outerR} ${outerR} 0 ${largeArcFlag} 1 ${x2Outer} ${y2Outer}`,
        `L ${x1Inner} ${y1Inner}`,
        `A ${innerR} ${innerR} 0 ${largeArcFlag} 0 ${x2Inner} ${y2Inner}`,
        'Z'
      ].join(' ');

      pathsHtml += `
        <path d="${pathData}" fill="${slice.color}" data-cat="${slice.id}">
          <title>${slice.name}: ${formatCurrency(slice.amount)} (${slice.percentage.toFixed(1)}%)</title>
        </path>
      `;
    });

    svg.innerHTML = pathsHtml;

    // Render Donut Legend
    legend.innerHTML = slices.map(s => `
      <div class="donut-legend-item">
        <div class="legend-left">
          <span class="legend-color-dot" style="background: ${s.color};"></span>
          <span class="legend-name">${s.name}</span>
        </div>
        <div class="legend-right">
          <span class="legend-val">${formatCurrency(s.amount)}</span>
          <span class="legend-pct">${s.percentage.toFixed(0)}%</span>
        </div>
      </div>
    `).join('');
  }

  // --- Render Month-over-Month Trend Chart (Pure SVG) ---
  function renderTrendChart() {
    const svg = document.getElementById('trend-svg');
    if (!svg) return;

    // Collect last 6 months
    const months = [];
    let cur = state.currentMonth;
    for (let i = 0; i < 6; i++) {
      months.unshift(cur);
      cur = getPreviousMonth(cur);
    }

    const data = months.map(m => {
      const d = getMonthData(m);
      const [year, month] = m.split('-');
      const label = new Date(Number(year), Number(month) - 1, 1).toLocaleDateString('en-US', { month: 'short' });
      return {
        month: m,
        label,
        income: d.totalIncome,
        expenses: d.totalExpenses,
        savings: d.netSavings
      };
    });

    let maxVal = 1000;
    data.forEach(d => {
      maxVal = Math.max(maxVal, d.income, d.expenses);
    });
    maxVal = Math.ceil(maxVal / 1000) * 1000;

    const width = svg.clientWidth || 600;
    const height = 240;
    const padLeft = 55;
    const padRight = 20;
    const padTop = 20;
    const padBottom = 35;

    const chartW = width - padLeft - padRight;
    const chartH = height - padTop - padBottom;

    let svgHtml = '';

    // Horizontal Grid Lines
    const gridSteps = 4;
    for (let i = 0; i <= gridSteps; i++) {
      const val = (maxVal / gridSteps) * i;
      const y = padTop + chartH - (val / maxVal) * chartH;
      svgHtml += `
        <line x1="${padLeft}" y1="${y}" x2="${width - padRight}" y2="${y}" stroke="var(--border)" stroke-dasharray="2,2" stroke-width="1" />
        <text x="${padLeft - 8}" y="${y + 3}" text-anchor="end" fill="var(--text-dim)" font-size="10" font-family="monospace">
          ${CURRENCIES[state.currency].symbol}${(val / 1000).toFixed(val >= 1000 ? 1 : 0)}k
        </text>
      `;
    }

    // Render Bars and Savings Line
    const groupW = chartW / data.length;
    const barW = Math.max(8, Math.min(22, (groupW - 20) / 2));
    const savingsPoints = [];

    data.forEach((d, idx) => {
      const groupX = padLeft + idx * groupW;
      const midX = groupX + groupW / 2;

      // Income bar
      const incH = (d.income / maxVal) * chartH;
      const incY = padTop + chartH - incH;
      const incX = midX - barW - 2;

      // Expense bar
      const expH = (d.expenses / maxVal) * chartH;
      const expY = padTop + chartH - expH;
      const expX = midX + 2;

      // Savings line coordinate
      const savY = padTop + chartH - Math.max(0, (d.savings / maxVal) * chartH);
      savingsPoints.push({ x: midX, y: savY, savings: d.savings });

      const isCurrentMonth = d.month === state.currentMonth;

      // Month Label on X axis
      svgHtml += `
        <text x="${midX}" y="${height - 10}" text-anchor="middle" fill="${isCurrentMonth ? 'var(--ink)' : 'var(--text-muted)'}" font-size="11" font-weight="${isCurrentMonth ? '600' : '400'}">
          ${d.label}
        </text>
      `;

      // Income Rect (Authoritative 30% Ink)
      svgHtml += `
        <rect x="${incX}" y="${incY}" width="${barW}" height="${Math.max(2, incH)}" fill="var(--ink)" opacity="${isCurrentMonth ? '1' : '0.85'}" rx="1">
          <title>${d.label} Income: ${formatCurrency(d.income)}</title>
        </rect>
      `;

      // Expense Rect (10% Accent Scarcity)
      svgHtml += `
        <rect x="${expX}" y="${expY}" width="${barW}" height="${Math.max(2, expH)}" fill="var(--accent)" opacity="${isCurrentMonth ? '1' : '0.85'}" rx="1">
          <title>${d.label} Expenses: ${formatCurrency(d.expenses)}</title>
        </rect>
      `;
    });

    // Render Savings Trend Line over bars
    if (savingsPoints.length > 1) {
      const pathD = savingsPoints.map((pt, idx) => (idx === 0 ? `M ${pt.x} ${pt.y}` : `L ${pt.x} ${pt.y}`)).join(' ');
      svgHtml += `
        <path d="${pathD}" fill="none" stroke="var(--ink)" stroke-width="2" />
      `;
      savingsPoints.forEach(pt => {
        svgHtml += `
          <circle cx="${pt.x}" cy="${pt.y}" r="3" fill="var(--surface)" stroke="var(--ink)" stroke-width="2">
            <title>Net Savings: ${formatCurrency(pt.savings)}</title>
          </circle>
        `;
      });
    }

    svg.innerHTML = svgHtml;
  }

  // --- Render Transactions Ledger Tab ---
  function renderTransactionsLedger() {
    const tbody = document.getElementById('ledger-tbody');
    const countBadge = document.getElementById('badge-tx-count');
    const paginationInfo = document.getElementById('tx-pagination-info');
    const paginationButtons = document.getElementById('tx-pagination-buttons');
    if (!tbody) return;

    // Filter transactions
    const q = state.txFilters.search.toLowerCase().trim();
    let filtered = state.transactions.filter(t => {
      if (!t.date || !t.date.startsWith(state.currentMonth)) {
        return false;
      }
      if (state.txFilters.type !== 'all' && t.type !== state.txFilters.type) {
        return false;
      }
      if (state.txFilters.category !== 'all' && t.categoryId !== state.txFilters.category) {
        return false;
      }
      if (q) {
        const cat = state.categories.find(c => c.id === t.categoryId);
        const catName = cat ? cat.name.toLowerCase() : '';
        const desc = (t.description || '').toLowerCase();
        const notes = (t.notes || '').toLowerCase();
        const method = (t.paymentMethod || '').toLowerCase();
        if (!desc.includes(q) && !notes.includes(q) && !catName.includes(q) && !method.includes(q)) {
          return false;
        }
      }
      return true;
    });

    // Sort transactions
    filtered.sort((a, b) => {
      if (state.txFilters.sort === 'date-desc') return new Date(b.date) - new Date(a.date);
      if (state.txFilters.sort === 'date-asc') return new Date(a.date) - new Date(b.date);
      if (state.txFilters.sort === 'amount-desc') return Number(b.amount) - Number(a.amount);
      if (state.txFilters.sort === 'amount-asc') return Number(a.amount) - Number(b.amount);
      return 0;
    });

    if (countBadge) {
      countBadge.textContent = filtered.length;
    }

    // Pagination
    const totalCount = filtered.length;
    const pageSize = state.txFilters.pageSize;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    if (state.txFilters.page > totalPages) state.txFilters.page = totalPages;
    const startIdx = (state.txFilters.page - 1) * pageSize;
    const pageItems = filtered.slice(startIdx, startIdx + pageSize);

    if (paginationInfo) {
      if (totalCount === 0) {
        paginationInfo.textContent = `No transactions found for ${formatMonthTitle(state.currentMonth)}`;
      } else {
        paginationInfo.textContent = `Showing ${startIdx + 1} - ${Math.min(startIdx + pageSize, totalCount)} of ${totalCount} transactions`;
      }
    }

    if (paginationButtons) {
      paginationButtons.innerHTML = `
        <button class="btn btn-secondary btn-sm" id="btn-tx-prev-page" ${state.txFilters.page <= 1 ? 'disabled style="opacity:0.5;cursor:default;"' : ''}>Prev</button>
        <span style="font-size:11.5px; padding: 4px 6px; color: var(--text-muted);">Page ${state.txFilters.page} of ${totalPages}</span>
        <button class="btn btn-secondary btn-sm" id="btn-tx-next-page" ${state.txFilters.page >= totalPages ? 'disabled style="opacity:0.5;cursor:default;"' : ''}>Next</button>
      `;

      const prevBtn = document.getElementById('btn-tx-prev-page');
      if (prevBtn && state.txFilters.page > 1) {
        prevBtn.addEventListener('click', () => {
          state.txFilters.page--;
          renderTransactionsLedger();
        });
      }
      const nextBtn = document.getElementById('btn-tx-next-page');
      if (nextBtn && state.txFilters.page < totalPages) {
        nextBtn.addEventListener('click', () => {
          state.txFilters.page++;
          renderTransactionsLedger();
        });
      }
    }

    if (pageItems.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 32px 14px; color: var(--text-dim);">
            No transactions matching criteria for ${formatMonthTitle(state.currentMonth)}.
            <br>
            <button class="btn btn-primary btn-sm" style="margin-top: 10px;" id="btn-empty-add-tx">+ Add Transaction</button>
          </td>
        </tr>
      `;
      const emptyBtn = document.getElementById('btn-empty-add-tx');
      if (emptyBtn) emptyBtn.addEventListener('click', openAddTransactionModal);
      return;
    }

    tbody.innerHTML = pageItems.map(t => {
      const cat = state.categories.find(c => c.id === t.categoryId) || { name: 'Uncategorized', color: '#64748b' };
      const isIncome = t.type === 'income';

      return `
        <tr data-id="${t.id}">
          <td style="font-family: monospace; font-size: 11.5px; color: var(--text-muted);">${t.date}</td>
          <td>
            <span class="tx-type-tag ${isIncome ? 'income' : 'expense'}">${t.type}</span>
          </td>
          <td>
            <span style="display: inline-flex; align-items: center; gap: 6px;">
              <span style="width: 8px; height: 8px; border-radius: 2px; background: ${cat.color};"></span>
              <span style="font-weight: 600;">${cat.name}</span>
            </span>
          </td>
          <td>
            <div style="font-weight: 600; color: var(--text-main);">${escapeHtml(t.description || '')}</div>
            ${t.notes ? `<div style="font-size: 11px; color: var(--text-dim);">${escapeHtml(t.notes)}</div>` : ''}
          </td>
          <td style="color: var(--text-muted); font-size: 11.5px;">${t.paymentMethod || 'Other'}</td>
          <td style="text-align: right;">
            <span class="tx-amount ${isIncome ? 'income' : 'expense'}">
              ${isIncome ? '+' : '-'}${formatCurrency(t.amount)}
            </span>
          </td>
          <td style="text-align: center;">
            <div style="display: flex; align-items: center; justify-content: center; gap: 6px;">
              <button class="btn-icon-action btn-edit-tx" data-id="${t.id}" title="Edit Transaction" style="width: 24px; height: 24px;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>
              <button class="btn-icon-action btn-del-tx" data-id="${t.id}" title="Delete Transaction" style="width: 24px; height: 24px; color: var(--danger);">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('.btn-edit-tx').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        openEditTransactionModal(id);
      });
    });

    tbody.querySelectorAll('.btn-del-tx').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        deleteTransaction(id);
      });
    });
  }

  // --- Render Monthly Budgets Tab ---
  function renderBudgets() {
    const grid = document.getElementById('budget-cards-grid');
    const totalSumEl = document.getElementById('total-budgeted-sum');
    const totalSpentEl = document.getElementById('total-budgeted-spent');
    const totalLeftPill = document.getElementById('total-budget-left-pill');
    const totalBar = document.getElementById('total-budget-bar');
    const statusBadge = document.getElementById('badge-budget-status');
    if (!grid) return;

    const current = getMonthData(state.currentMonth);
    const expenseCategories = state.categories.filter(c => c.type === 'expense');

    if (totalSumEl) totalSumEl.textContent = formatCurrency(current.totalBudget);
    if (totalSpentEl) totalSpentEl.textContent = formatCurrency(current.totalExpenses);

    if (totalLeftPill) {
      if (current.budgetRemaining >= 0) {
        totalLeftPill.textContent = `(Remaining: ${formatCurrency(current.budgetRemaining)})`;
        totalLeftPill.style.color = 'var(--ink)';
      } else {
        totalLeftPill.textContent = `(Over Budget by ${formatCurrency(Math.abs(current.budgetRemaining))})`;
        totalLeftPill.style.color = 'var(--accent)';
      }
    }

    if (totalBar) {
      const pct = Math.min(100, Math.max(0, current.budgetUtilization));
      totalBar.style.width = `${pct}%`;
      totalBar.className = 'progress-bar-fill ' + (current.budgetUtilization > 100 ? 'danger' : 'normal');
    }

    if (statusBadge) {
      if (current.budgetRemaining < 0) {
        statusBadge.textContent = 'Over Budget';
        statusBadge.style.color = 'var(--accent)';
      } else {
        statusBadge.textContent = 'On Track';
        statusBadge.style.color = 'var(--ink)';
      }
    }

    grid.innerHTML = expenseCategories.map(cat => {
      const spent = current.categorySpending[cat.id] || 0;
      const limit = current.budgets[cat.id] || 0;
      const remaining = limit - spent;
      const pct = limit > 0 ? (spent / limit) * 100 : 0;

      let statusClass = 'under';
      let statusLabel = 'On Track';
      let barClass = 'normal';

      if (limit === 0) {
        statusClass = 'under';
        statusLabel = 'No Limit';
      } else if (spent > limit) {
        statusClass = 'over';
        statusLabel = 'Over Budget';
        barClass = 'danger';
      } else if (pct >= 85) {
        statusClass = 'warning';
        statusLabel = 'Near Limit';
        barClass = 'warning';
      }

      const barWidth = Math.min(100, Math.max(0, pct));

      return `
        <div class="budget-card" data-cat-id="${cat.id}">
          <div class="budget-card-top">
            <div class="budget-card-cat">
              <span style="width: 10px; height: 10px; border-radius: 2px; background: ${cat.color};"></span>
              <span>${cat.name}</span>
            </div>
            <span class="budget-status-pill ${statusClass}">${statusLabel}</span>
          </div>

          <div class="budget-amounts-row">
            <div class="budget-spent-val">${formatCurrency(spent)}</div>
            <div class="budget-limit-val">of ${limit > 0 ? formatCurrency(limit) : 'No Budget Set'}</div>
          </div>

          <div class="progress-track">
            <div class="progress-bar-fill ${barClass}" style="width: ${barWidth}%;"></div>
          </div>

          <div class="budget-card-bottom">
            <span class="budget-left-text ${remaining >= 0 ? 'positive' : 'negative'}">
              ${remaining >= 0 ? `${formatCurrency(remaining)} left` : `${formatCurrency(Math.abs(remaining))} over budget`}
            </span>
            <button class="btn-edit-budget btn-open-edit-budget" data-id="${cat.id}" data-name="${escapeHtml(cat.name)}" data-limit="${limit}">
              Edit Limit
            </button>
          </div>
        </div>
      `;
    }).join('');

    grid.querySelectorAll('.btn-open-edit-budget').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const catId = e.currentTarget.getAttribute('data-id');
        const catName = e.currentTarget.getAttribute('data-name');
        const catLimit = e.currentTarget.getAttribute('data-limit');
        openEditBudgetModal(catId, catName, catLimit);
      });
    });
  }

  // --- 17. In-App Confirmation Modal Helper ---
  function showConfirmModal({ title, message, proceedLabel = 'Proceed', proceedDanger = true }) {
    return new Promise((resolve) => {
      const modal = document.getElementById('modal-confirm');
      const titleEl = document.getElementById('confirm-modal-title');
      const bodyEl = document.getElementById('confirm-modal-body');
      const btnProceed = document.getElementById('btn-confirm-proceed');
      const btnCancel = document.getElementById('btn-confirm-cancel');
      const btnClose = document.getElementById('btn-close-confirm-modal');

      if (!modal) {
        resolve(window.confirm(message));
        return;
      }

      if (titleEl) titleEl.textContent = title;
      if (bodyEl) bodyEl.textContent = message;
      if (btnProceed) {
        btnProceed.textContent = proceedLabel;
        btnProceed.className = proceedDanger ? 'btn btn-danger' : 'btn btn-primary';
      }

      const cleanup = () => {
        closeModal('modal-confirm');
        btnProceed.removeEventListener('click', onProceed);
        btnCancel.removeEventListener('click', onCancel);
        btnClose.removeEventListener('click', onCancel);
      };

      const onProceed = () => {
        cleanup();
        resolve(true);
      };

      const onCancel = () => {
        cleanup();
        resolve(false);
      };

      btnProceed.addEventListener('click', onProceed);
      btnCancel.addEventListener('click', onCancel);
      btnClose.addEventListener('click', onCancel);

      openModal('modal-confirm');
    });
  }

  // --- CRUD: Transactions ---
  function openAddTransactionModal() {
    state.editingTxId = null;
    const modalTitle = document.getElementById('modal-tx-title');
    const form = document.getElementById('form-transaction');
    const txIdInput = document.getElementById('tx-id');
    const dateInput = document.getElementById('tx-date');
    const amtInput = document.getElementById('tx-amount');

    // Reset error & success states
    clearFormFeedback('tx-form-error', 'tx-form-success');

    if (modalTitle) modalTitle.textContent = 'Add Transaction';
    if (form) form.reset();
    if (txIdInput) txIdInput.value = '';

    const today = new Date().toISOString().split('T')[0];
    const defaultDate = today.startsWith(state.currentMonth) ? today : `${state.currentMonth}-01`;
    if (dateInput) dateInput.value = defaultDate;

    setModalTxType('expense');
    openModal('modal-transaction');
    if (amtInput) amtInput.focus();
  }

  function openEditTransactionModal(id) {
    const tx = state.transactions.find(t => t.id === id);
    if (!tx) return;

    state.editingTxId = id;
    clearFormFeedback('tx-form-error', 'tx-form-success');

    const modalTitle = document.getElementById('modal-tx-title');
    const txIdInput = document.getElementById('tx-id');
    const dateInput = document.getElementById('tx-date');
    const amtInput = document.getElementById('tx-amount');
    const descInput = document.getElementById('tx-desc');
    const methodInput = document.getElementById('tx-method');
    const notesInput = document.getElementById('tx-notes');

    if (modalTitle) modalTitle.textContent = 'Edit Transaction';
    if (txIdInput) txIdInput.value = tx.id;
    if (dateInput) dateInput.value = tx.date;
    if (amtInput) amtInput.value = tx.amount;
    if (descInput) descInput.value = tx.description || '';
    if (methodInput) methodInput.value = tx.paymentMethod || 'Credit Card';
    if (notesInput) notesInput.value = tx.notes || '';

    setModalTxType(tx.type);
    const catSelect = document.getElementById('tx-category');
    if (catSelect) catSelect.value = tx.categoryId;

    openModal('modal-transaction');
  }

  function setModalTxType(type) {
    const btnExpense = document.getElementById('toggle-type-expense');
    const btnIncome = document.getElementById('toggle-type-income');
    const catSelect = document.getElementById('tx-category');

    if (type === 'income') {
      btnIncome.className = 'type-toggle-btn active income';
      btnExpense.className = 'type-toggle-btn';
    } else {
      btnExpense.className = 'type-toggle-btn active expense';
      btnIncome.className = 'type-toggle-btn';
    }

    if (catSelect) {
      const cats = state.categories.filter(c => c.type === type);
      catSelect.innerHTML = cats.map(c => `
        <option value="${c.id}">${c.name}</option>
      `).join('');
    }
  }

  // 15 & 16. Form State Feedback Helpers
  function showFormError(errorElId, message) {
    const errEl = document.getElementById(errorElId);
    if (errEl) {
      errEl.textContent = message;
      errEl.style.display = 'block';
    }
  }

  function showFormSuccess(successElId, message) {
    const succEl = document.getElementById(successElId);
    if (succEl) {
      succEl.textContent = message;
      succEl.style.display = 'block';
    }
  }

  function clearFormFeedback(errorElId, successElId) {
    const errEl = document.getElementById(errorElId);
    const succEl = document.getElementById(successElId);
    if (errEl) errEl.style.display = 'none';
    if (succEl) succEl.style.display = 'none';
  }

  function saveTransactionFromForm(e) {
    e.preventDefault();
    clearFormFeedback('tx-form-error', 'tx-form-success');

    const id = document.getElementById('tx-id').value;
    const isIncome = document.getElementById('toggle-type-income').classList.contains('active');
    const type = isIncome ? 'income' : 'expense';
    const amount = parseFloat(document.getElementById('tx-amount').value);
    const date = document.getElementById('tx-date').value;
    const categoryId = document.getElementById('tx-category').value;
    const description = document.getElementById('tx-desc').value.trim();
    const paymentMethod = document.getElementById('tx-method').value;
    const notes = document.getElementById('tx-notes').value.trim();

    // 16. Form Error State validation
    if (!amount || amount <= 0) {
      showFormError('tx-form-error', 'Amount must be a positive number greater than 0.');
      document.getElementById('tx-amount').classList.add('input-error');
      return;
    }
    if (!date) {
      showFormError('tx-form-error', 'Please select a valid transaction date.');
      document.getElementById('tx-date').classList.add('input-error');
      return;
    }
    if (!description) {
      showFormError('tx-form-error', 'Description/payee cannot be empty.');
      document.getElementById('tx-desc').classList.add('input-error');
      return;
    }

    if (id) {
      // Edit
      const index = state.transactions.findIndex(t => t.id === id);
      const updatedTx = {
        id,
        type,
        amount,
        date,
        categoryId,
        description,
        paymentMethod,
        notes
      };
      if (index !== -1) {
        state.transactions[index] = {
          ...state.transactions[index],
          ...updatedTx
        };
      }
      saveData();
      SQL_API.updateTransaction(id, updatedTx).then(() => SQL_API.getStatus().then(updateSqlStatusCard));
    } else {
      // Add
      const newTx = {
        id: 'tx-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        type,
        amount,
        date,
        categoryId,
        description,
        paymentMethod,
        notes
      };
      state.transactions.unshift(newTx);
      saveData();
      SQL_API.addTransaction(newTx).then(() => SQL_API.getStatus().then(updateSqlStatusCard));
    }

    // 15. Form Success State
    showFormSuccess('tx-form-success', 'Transaction saved successfully!');
    setTimeout(() => {
      closeModal('modal-transaction');
      renderAll();
      showToast(id ? 'Transaction updated.' : 'Transaction added.', 'success');
    }, 400);
  }

  async function deleteTransaction(id) {
    const tx = state.transactions.find(t => t.id === id);
    if (!tx) return;

    // 17. Custom Confirmation Modal
    const confirmed = await showConfirmModal({
      title: 'Delete Transaction',
      message: `Are you sure you want to delete "${tx.description}" (${formatCurrency(tx.amount)})? This cannot be undone.`,
      proceedLabel: 'Delete',
      proceedDanger: true
    });

    if (confirmed) {
      state.transactions = state.transactions.filter(t => t.id !== id);
      saveData();
      renderAll();
      showToast('Transaction deleted.', 'info');
      SQL_API.deleteTransaction(id).then(() => SQL_API.getStatus().then(updateSqlStatusCard));
    }
  }

  // --- CRUD: Category Budgets ---
  function openEditBudgetModal(catId, catName, currentLimit) {
    const idInput = document.getElementById('budget-cat-id');
    const nameEl = document.getElementById('budget-cat-name');
    const limitInput = document.getElementById('budget-limit-input');
    clearFormFeedback('budget-form-error', 'budget-form-success');

    if (idInput) idInput.value = catId;
    if (nameEl) nameEl.textContent = catName;
    if (limitInput) limitInput.value = currentLimit || 0;

    openModal('modal-edit-budget');
    if (limitInput) limitInput.focus();
  }

  function saveBudgetFromForm(e) {
    e.preventDefault();
    clearFormFeedback('budget-form-error', 'budget-form-success');

    const catId = document.getElementById('budget-cat-id').value;
    const limit = parseFloat(document.getElementById('budget-limit-input').value);

    if (isNaN(limit) || limit < 0) {
      showFormError('budget-form-error', 'Budget limit cannot be negative.');
      return;
    }

    if (!state.monthlyBudgets[state.currentMonth]) {
      state.monthlyBudgets[state.currentMonth] = {};
    }

    state.monthlyBudgets[state.currentMonth][catId] = limit;
    saveData();
    SQL_API.upsertBudget(state.currentMonth, catId, limit).then(() => SQL_API.getStatus().then(updateSqlStatusCard));

    showFormSuccess('budget-form-success', 'Budget limit updated!');
    setTimeout(() => {
      closeModal('modal-edit-budget');
      renderAll();
      showToast(`Budget limit updated for ${formatMonthTitle(state.currentMonth)}.`, 'success');
    }, 400);
  }

  function copyPreviousMonthBudgets() {
    const prevMonthStr = getPreviousMonth(state.currentMonth);
    const prevBudgets = state.monthlyBudgets[prevMonthStr] || (window.BUDGET_SAMPLE_DATA ? window.BUDGET_SAMPLE_DATA.defaultBudgetLimits : null);

    if (!prevBudgets) {
      showToast(`No budgets found in ${formatMonthTitle(prevMonthStr)} to copy.`, 'warning');
      return;
    }

    state.monthlyBudgets[state.currentMonth] = { ...prevBudgets };
    saveData();
    renderAll();
    showToast(`Copied budget limits from ${formatMonthTitle(prevMonthStr)}!`, 'success');
  }

  // --- 9. Copy Monthly Summary to Clipboard ---
  function copyMonthlySummaryToClipboard() {
    const current = getMonthData(state.currentMonth);
    const topCats = Object.entries(current.categorySpending)
      .map(([id, amt]) => {
        const cat = state.categories.find(c => c.id === id);
        return { name: cat ? cat.name : id, amt };
      })
      .sort((a, b) => b.amt - a.amt)
      .slice(0, 3);

    const summaryText = [
      `PulseGuard Monthly Financial Statement - ${formatMonthTitle(state.currentMonth)}`,
      `----------------------------------------------------`,
      `Total Income:      ${formatCurrency(current.totalIncome)}`,
      `Total Expenses:    ${formatCurrency(current.totalExpenses)}`,
      `Net Cash Flow:     ${current.netSavings >= 0 ? '+' : '-'}${formatCurrency(current.netSavings)} (${current.savingsRate.toFixed(1)}% savings rate)`,
      `Total Budget:      ${formatCurrency(current.totalBudget)}`,
      `Remaining Budget:  ${formatCurrency(current.budgetRemaining)} (${current.budgetUtilization.toFixed(0)}% spent)`,
      `Top Spending Categories:`,
      ...topCats.map((c, i) => `  ${i + 1}. ${c.name}: ${formatCurrency(c.amt)}`),
      `----------------------------------------------------`,
      `Generated from private storage in PulseGuard.`
    ].join('\n');

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(summaryText).then(() => {
        const label = document.getElementById('btn-copy-summary-text');
        if (label) {
          label.textContent = 'Copied!';
          setTimeout(() => { label.textContent = 'Copy Summary'; }, 2000);
        }
        showToast('Monthly summary copied to clipboard!', 'success');
      }).catch(() => {
        fallbackCopyText(summaryText);
      });
    } else {
      fallbackCopyText(summaryText);
    }
  }

  function fallbackCopyText(text) {
    const area = document.createElement('textarea');
    area.value = text;
    document.body.appendChild(area);
    area.select();
    document.execCommand('copy');
    document.body.removeChild(area);
    showToast('Monthly summary copied to clipboard!', 'success');
  }

  // --- 3. Global Site Search ---
  function handleGlobalSearch(query) {
    const dropdown = document.getElementById('global-search-results');
    if (!dropdown) return;
    const q = (query || '').toLowerCase().trim();

    if (!q) {
      dropdown.style.display = 'none';
      dropdown.innerHTML = '';
      return;
    }

    const results = [];

    // Search transactions
    state.transactions.slice(0, 50).forEach(t => {
      const desc = (t.description || '').toLowerCase();
      const notes = (t.notes || '').toLowerCase();
      const cat = state.categories.find(c => c.id === t.categoryId);
      const catName = cat ? cat.name.toLowerCase() : '';

      if (desc.includes(q) || notes.includes(q) || catName.includes(q)) {
        results.push({
          type: 'Transaction',
          title: t.description || 'Transaction',
          sub: `${t.date} &bull; ${catName} &bull; ${formatCurrency(t.amount)}`,
          action: () => {
            switchTab('transactions');
            state.txFilters.search = t.description;
            const searchInput = document.getElementById('tx-search');
            if (searchInput) searchInput.value = t.description;
            renderTransactionsLedger();
          }
        });
      }
    });

    // Search categories
    state.categories.forEach(c => {
      if (c.name.toLowerCase().includes(q)) {
        results.push({
          type: 'Category',
          title: c.name,
          sub: `${c.type.toUpperCase()} category`,
          action: () => {
            switchTab('budgets');
          }
        });
      }
    });

    // Search FAQs
    const faqs = [
      { q: 'How is data stored?', tab: 'faq' },
      { q: 'What is 50/30/20 budget framework?', tab: 'faq' },
      { q: 'Supported CSV column formats', tab: 'faq' },
      { q: 'How insights work', tab: 'faq' },
      { q: 'Switch currencies & print', tab: 'faq' }
    ];
    faqs.forEach(f => {
      if (f.q.toLowerCase().includes(q)) {
        results.push({
          type: 'FAQ Guide',
          title: f.q,
          sub: 'Help center article',
          action: () => switchTab('faq')
        });
      }
    });

    if (results.length === 0) {
      dropdown.innerHTML = `<div style="padding: 12px; font-size: 11.5px; color: var(--text-dim); text-align: center;">No matches found for &ldquo;${escapeHtml(q)}&rdquo;</div>`;
      dropdown.style.display = 'flex';
      return;
    }

    dropdown.innerHTML = results.slice(0, 6).map((r, i) => `
      <div class="search-result-item" data-index="${i}">
        <div>
          <div style="font-weight: 600; color: var(--text-main);">${escapeHtml(r.title)}</div>
          <div style="font-size: 10.5px; color: var(--text-dim);">${r.sub}</div>
        </div>
        <span class="badge-pill" style="font-size: 9px;">${r.type}</span>
      </div>
    `).join('');

    dropdown.style.display = 'flex';

    dropdown.querySelectorAll('.search-result-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.getAttribute('data-index'), 10);
        if (results[idx] && results[idx].action) {
          results[idx].action();
          dropdown.style.display = 'none';
        }
      });
    });
  }

  // --- 5. Dynamic Page Title Manager ---
  function updatePageTitle(tab = state.activeTab) {
    const monthTitle = formatMonthTitle(state.currentMonth);
    const titles = {
      dashboard: `PulseGuard | Financial Dashboard (${monthTitle})`,
      transactions: `PulseGuard | Transactions Ledger (${monthTitle})`,
      budgets: `PulseGuard | Monthly Category Budgets (${monthTitle})`,
      io: `PulseGuard | CSV Import, Export & SQL Backup`,
      faq: `PulseGuard | FAQ & Security Guide`
    };
    document.title = titles[tab] || 'PulseGuard - Personal Budget & Expense Manager';
  }

  // --- Tab Switch Helper ---
  function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(b => {
      const isTarget = b.getAttribute('data-tab') === tab;
      b.classList.toggle('active', isTarget);
      b.setAttribute('aria-selected', isTarget ? 'true' : 'false');
    });
    document.querySelectorAll('.mobile-nav-item').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-tab') === tab);
    });
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));

    const panel = document.getElementById(`panel-${tab}`);
    if (panel) panel.classList.add('active');
    state.activeTab = tab;
    updatePageTitle(tab);

    if (tab === 'dashboard') {
      renderDashboard();
    } else if (tab === 'io') {
      SQL_API.getStatus().then(updateSqlStatusCard);
    }
  }

  // --- CSV Import & Export ---
  function exportTransactionsCsv() {
    const range = document.getElementById('export-range-select').value;
    let list = state.transactions;

    if (range === 'current') {
      list = state.transactions.filter(t => t.date && t.date.startsWith(state.currentMonth));
    }

    if (list.length === 0) {
      showToast('No transactions to export for the selected range.', 'warning');
      return;
    }

    const headers = ['Date', 'Type', 'Category', 'Description', 'Amount', 'PaymentMethod', 'Notes'];
    const rows = list.map(t => {
      const cat = state.categories.find(c => c.id === t.categoryId) || { name: 'Other' };
      return [
        t.date,
        t.type,
        `"${cat.name.replace(/"/g, '""')}"`,
        `"${(t.description || '').replace(/"/g, '""')}"`,
        Number(t.amount || 0).toFixed(2),
        `"${(t.paymentMethod || '').replace(/"/g, '""')}"`,
        `"${(t.notes || '').replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvContent = headers.join(',') + '\n' + rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `budget-transactions-${range === 'current' ? state.currentMonth : 'all'}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Exported ${list.length} transactions as CSV.`, 'success');
  }

  function downloadSampleCsv() {
    const sampleCsv = `Date,Type,Category,Description,Amount,PaymentMethod,Notes\n` +
      `2026-10-01,income,Salary,TechWorks Bi-Weekly Payroll,2400.00,Direct Deposit,First pay period\n` +
      `2026-10-01,expense,Housing,Monthly Apartment Rent,1650.00,Bank Transfer,Oct rent\n` +
      `2026-10-02,expense,Dining,Sushi Bistro Dinner,94.00,Credit Card,Dinner with friends\n` +
      `2026-10-03,expense,Groceries,Trader Joe's Groceries,115.40,Debit Card,Weekly produce\n` +
      `2026-10-05,expense,Utilities,Fiber Gigabit Internet,70.00,Credit Card,Monthly internet bill\n`;

    const blob = new Blob([sampleCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_budget_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Sample CSV template downloaded.', 'info');
  }

  function handleCsvFileSelect(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
      parseAndPreviewCsv(e.target.result);
    };
    reader.readAsText(file);
  }

  function parseAndPreviewCsv(text) {
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length <= 1) {
      showToast('CSV file is empty or contains no data rows.', 'danger');
      return;
    }

    const header = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/["']/g, ''));
    const parsedRecords = [];

    for (let i = 1; i < lines.length; i++) {
      const row = parseCsvRow(lines[i]);
      if (row.length < 3) continue;

      let date = '';
      let type = 'expense';
      let categoryName = 'Miscellaneous';
      let description = '';
      let amount = 0;
      let method = 'Credit Card';
      let notes = '';

      header.forEach((col, idx) => {
        const val = (row[idx] || '').trim();
        if (col.includes('date')) date = val;
        else if (col.includes('type')) type = val.toLowerCase().includes('inc') ? 'income' : 'expense';
        else if (col.includes('cat')) categoryName = val;
        else if (col.includes('desc') || col.includes('payee') || col.includes('name')) description = val;
        else if (col.includes('amount') || col.includes('total') || col.includes('cost')) {
          amount = parseFloat(val.replace(/[^0-9.-]/g, '')) || 0;
        }
        else if (col.includes('method') || col.includes('account')) method = val;
        else if (col.includes('note')) notes = val;
      });

      if (date && date.includes('/')) {
        const parts = date.split('/');
        if (parts.length === 3 && parts[2].length === 4) {
          date = `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
        }
      }

      if (!date) date = new Date().toISOString().split('T')[0];
      if (!description) description = 'Imported Transaction';

      let cat = state.categories.find(c => c.name.toLowerCase() === categoryName.toLowerCase());
      if (!cat) {
        cat = state.categories.find(c => c.type === type) || state.categories[0];
      }

      parsedRecords.push({
        id: 'tx-imp-' + Date.now() + '-' + i,
        date,
        type,
        categoryId: cat ? cat.id : 'cat-misc',
        categoryName: cat ? cat.name : categoryName,
        description,
        amount: Math.abs(amount),
        paymentMethod: method,
        notes
      });
    }

    if (parsedRecords.length === 0) {
      showToast('Could not find valid transaction rows in CSV.', 'danger');
      return;
    }

    state.pendingCsvImport = parsedRecords;

    const summary = document.getElementById('csv-preview-summary');
    const tbody = document.getElementById('csv-preview-tbody');
    if (summary) {
      summary.textContent = `Parsed ${parsedRecords.length} records. Review first 5 sample rows below:`;
    }
    if (tbody) {
      tbody.innerHTML = parsedRecords.slice(0, 5).map(r => `
        <tr>
          <td>${r.date}</td>
          <td><span class="tx-type-tag ${r.type}">${r.type}</span></td>
          <td>${escapeHtml(r.categoryName)}</td>
          <td>${escapeHtml(r.description)}</td>
          <td style="text-align: right; font-weight: 700;">${formatCurrency(r.amount)}</td>
        </tr>
      `).join('');
    }

    openModal('modal-csv-preview');
  }

  function parseCsvRow(text) {
    const result = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (c === '"') {
        if (inQuotes && text[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === ',' && !inQuotes) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += c;
      }
    }
    result.push(cur.trim());
    return result;
  }

  function confirmCsvImport() {
    if (!state.pendingCsvImport || state.pendingCsvImport.length === 0) return;
    const mode = document.getElementById('csv-import-mode').value;

    const cleanedRecords = state.pendingCsvImport.map(r => ({
      id: r.id,
      date: r.date,
      type: r.type,
      categoryId: r.categoryId,
      description: r.description,
      amount: r.amount,
      paymentMethod: r.paymentMethod,
      notes: r.notes
    }));

    if (mode === 'replace') {
      state.transactions = cleanedRecords;
    } else {
      state.transactions = [...cleanedRecords, ...state.transactions];
    }

    saveData();
    closeModal('modal-csv-preview');
    state.pendingCsvImport = null;
    renderAll();
    showToast(`Successfully imported ${cleanedRecords.length} transactions!`, 'success');
    SQL_API.importCsv(cleanedRecords, mode).then(() => SQL_API.getStatus().then(updateSqlStatusCard));
  }

  // --- JSON Backup & Restore ---
  function exportJsonBackup() {
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      transactions: state.transactions,
      monthlyBudgets: state.monthlyBudgets,
      categories: state.categories,
      currency: state.currency
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pulseguard-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Full JSON backup exported.', 'success');
  }

  function handleJsonRestoreFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const data = JSON.parse(e.target.result);
        if (data.transactions && Array.isArray(data.transactions)) {
          state.transactions = data.transactions;
          if (data.monthlyBudgets) state.monthlyBudgets = data.monthlyBudgets;
          if (data.categories) state.categories = data.categories;
          if (data.currency) setCurrency(data.currency);
          saveData();
          renderAll();
          showToast('Backup restored successfully!', 'success');
          // Also sync restored transactions to SQL database
          SQL_API.importCsv(data.transactions, 'replace').then(() => SQL_API.getStatus().then(updateSqlStatusCard));
        } else {
          showToast('Invalid backup file format.', 'danger');
        }
      } catch (err) {
        showToast('Error reading backup file.', 'danger');
      }
    };
    reader.readAsText(file);
  }

  async function resetDemoData() {
    const confirmed = await showConfirmModal({
      title: 'Restore Sample Data',
      message: 'Restore starter sample data? This will replace your current data with the realistic multi-month demo set.',
      proceedLabel: 'Restore',
      proceedDanger: false
    });

    if (confirmed) {
      if (window.BUDGET_SAMPLE_DATA) {
        state.transactions = [...window.BUDGET_SAMPLE_DATA.transactions];
        state.monthlyBudgets = { ...window.BUDGET_SAMPLE_DATA.monthlyBudgets };
        state.categories = [...window.BUDGET_SAMPLE_DATA.categories];
        saveData();
        renderAll();
        showToast('Starter sample data restored.', 'info');
        SQL_API.resetDemo().then(() => SQL_API.getStatus().then(updateSqlStatusCard));
      }
    }
  }

  async function clearAllData() {
    const confirmed = await showConfirmModal({
      title: 'Wipe All Data',
      message: 'Are you sure you want to permanently wipe all transaction and budget records from your browser storage and SQL database? This action cannot be reversed.',
      proceedLabel: 'Wipe Everything',
      proceedDanger: true
    });

    if (confirmed) {
      state.transactions = [];
      state.monthlyBudgets = {};
      saveData();
      renderAll();
      showToast('All records cleared.', 'info');
      SQL_API.clearAll().then(() => SQL_API.getStatus().then(updateSqlStatusCard));
    }
  }

  // --- Modal Helpers ---
  function openModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('open');
  }

  function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('open');
  }

  // --- Toast System ---
  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 200ms ease';
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 200);
    }, 3200);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // --- Setup Event Listeners ---
  function setupEventListeners() {
    // 8. Scroll Progress Bar & 4. Back to Top Button
    const progressBar = document.getElementById('scroll-progress-bar');
    const backToTopBtn = document.getElementById('btn-back-to-top');

    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (progressBar && scrollHeight > 0) {
        const pct = Math.min(100, Math.max(0, (scrollY / scrollHeight) * 100));
        progressBar.style.width = pct + '%';
      }

      if (backToTopBtn) {
        if (scrollY > 200) {
          backToTopBtn.classList.add('visible');
        } else {
          backToTopBtn.classList.remove('visible');
        }
      }
    });

    if (backToTopBtn) {
      backToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    // 3. Global Site Search
    const searchInput = document.getElementById('global-site-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        handleGlobalSearch(e.target.value);
      });
      // Close search dropdown on click outside
      document.addEventListener('click', (e) => {
        const wrapper = document.querySelector('.header-search-wrapper');
        const dropdown = document.getElementById('global-search-results');
        if (dropdown && wrapper && !wrapper.contains(e.target)) {
          dropdown.style.display = 'none';
        }
      });
    }

    // 5. Mobile Menu Drawer
    const mobileToggleBtn = document.getElementById('btn-toggle-mobile-menu');
    const mobileDrawer = document.getElementById('mobile-menu-drawer');
    const closeMobileBtn = document.getElementById('btn-close-mobile-menu');
    const mobileAddTxBtn = document.getElementById('btn-mobile-add-tx');

    if (mobileToggleBtn && mobileDrawer) {
      mobileToggleBtn.addEventListener('click', () => {
        mobileDrawer.classList.toggle('open');
      });
    }
    if (closeMobileBtn && mobileDrawer) {
      closeMobileBtn.addEventListener('click', () => {
        mobileDrawer.classList.remove('open');
      });
    }
    if (mobileAddTxBtn && mobileDrawer) {
      mobileAddTxBtn.addEventListener('click', () => {
        mobileDrawer.classList.remove('open');
        openAddTransactionModal();
      });
    }

    document.querySelectorAll('.mobile-nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const tab = e.currentTarget.getAttribute('data-tab');
        switchTab(tab);
        if (mobileDrawer) mobileDrawer.classList.remove('open');
      });
    });

    // 20. Floating Contact Button & Drawer
    const contactBtn = document.getElementById('btn-floating-contact');
    const contactDrawer = document.getElementById('drawer-contact');
    const closeContactBtn = document.getElementById('btn-close-contact-drawer');
    const formContact = document.getElementById('form-contact');

    if (contactBtn && contactDrawer) {
      contactBtn.addEventListener('click', () => {
        contactDrawer.classList.toggle('open');
      });
    }
    if (closeContactBtn && contactDrawer) {
      closeContactBtn.addEventListener('click', () => {
        contactDrawer.classList.remove('open');
      });
    }

    if (formContact) {
      formContact.addEventListener('submit', (e) => {
        e.preventDefault();
        clearFormFeedback('contact-form-error', 'contact-form-success');
        const name = document.getElementById('contact-name').value.trim();
        const email = document.getElementById('contact-email').value.trim();
        const message = document.getElementById('contact-message').value.trim();

        if (!name || !email || !message) {
          showFormError('contact-form-error', 'Please fill in all required contact fields.');
          return;
        }

        showFormSuccess('contact-form-success', `Thank you ${name}! Your feedback has been recorded locally.`);
        setTimeout(() => {
          formContact.reset();
          clearFormFeedback('contact-form-error', 'contact-form-success');
          if (contactDrawer) contactDrawer.classList.remove('open');
          showToast('Message sent! Thank you for your feedback.', 'success');
        }, 1500);
      });
    }

    // 9. Copy Monthly Summary Button
    const copySummaryBtn = document.getElementById('btn-copy-monthly-summary');
    if (copySummaryBtn) {
      copySummaryBtn.addEventListener('click', copyMonthlySummaryToClipboard);
    }

    // Navigation Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = e.currentTarget.getAttribute('data-tab');
        switchTab(tab);
      });
    });

    // Month Navigation with 6. Loading Animation
    const prevBtn = document.getElementById('btn-prev-month');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        const newMonth = getPreviousMonth(state.currentMonth);
        switchMonthWithAnimation(newMonth);
      });
    }

    const nextBtn = document.getElementById('btn-next-month');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        const newMonth = getNextMonth(state.currentMonth);
        switchMonthWithAnimation(newMonth);
      });
    }

    const currentMonthBtn = document.getElementById('btn-current-month');
    if (currentMonthBtn) {
      currentMonthBtn.addEventListener('click', () => {
        switchMonthWithAnimation('2026-10');
      });
    }

    // Currency Selector
    const currSelect = document.getElementById('currency-select');
    if (currSelect) {
      currSelect.addEventListener('change', (e) => {
        setCurrency(e.target.value);
        renderAll();
      });
    }

    // 1. Theme Toggle
    const themeBtn = document.getElementById('btn-theme-toggle');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
        setTheme(nextTheme);
        renderTrendChart();
      });
    }

    // Add Transaction Modals
    const addTxBtn = document.getElementById('btn-open-add-tx');
    if (addTxBtn) addTxBtn.addEventListener('click', openAddTransactionModal);

    const toolbarAddBtn = document.getElementById('btn-toolbar-add-tx');
    if (toolbarAddBtn) toolbarAddBtn.addEventListener('click', openAddTransactionModal);

    const closeTxModalBtn = document.getElementById('btn-close-tx-modal');
    if (closeTxModalBtn) closeTxModalBtn.addEventListener('click', () => closeModal('modal-transaction'));

    const cancelTxBtn = document.getElementById('btn-cancel-tx');
    if (cancelTxBtn) cancelTxBtn.addEventListener('click', () => closeModal('modal-transaction'));

    // Modal Tx Type Toggles
    const toggleExpense = document.getElementById('toggle-type-expense');
    if (toggleExpense) {
      toggleExpense.addEventListener('click', () => setModalTxType('expense'));
    }
    const toggleIncome = document.getElementById('toggle-type-income');
    if (toggleIncome) {
      toggleIncome.addEventListener('click', () => setModalTxType('income'));
    }

    // Form Submissions
    const formTx = document.getElementById('form-transaction');
    if (formTx) formTx.addEventListener('submit', saveTransactionFromForm);

    const formBudget = document.getElementById('form-edit-budget');
    if (formBudget) formBudget.addEventListener('submit', saveBudgetFromForm);

    const closeBudgetModalBtn = document.getElementById('btn-close-budget-modal');
    if (closeBudgetModalBtn) closeBudgetModalBtn.addEventListener('click', () => closeModal('modal-edit-budget'));

    const cancelBudgetBtn = document.getElementById('btn-cancel-budget');
    if (cancelBudgetBtn) cancelBudgetBtn.addEventListener('click', () => closeModal('modal-edit-budget'));

    const copyBudgetBtn = document.getElementById('btn-copy-prev-budget');
    if (copyBudgetBtn) copyBudgetBtn.addEventListener('click', copyPreviousMonthBudgets);

    // Ledger Filters
    const ledgerSearchInput = document.getElementById('tx-search');
    if (ledgerSearchInput) {
      ledgerSearchInput.addEventListener('input', (e) => {
        state.txFilters.search = e.target.value;
        state.txFilters.page = 1;
        renderTransactionsLedger();
      });
    }

    const typeFilter = document.getElementById('tx-type-filter');
    if (typeFilter) {
      typeFilter.addEventListener('change', (e) => {
        state.txFilters.type = e.target.value;
        state.txFilters.page = 1;
        renderTransactionsLedger();
      });
    }

    const catFilter = document.getElementById('tx-category-filter');
    if (catFilter) {
      catFilter.innerHTML = `<option value="all">All Categories</option>` +
        state.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
      catFilter.addEventListener('change', (e) => {
        state.txFilters.category = e.target.value;
        state.txFilters.page = 1;
        renderTransactionsLedger();
      });
    }

    const sortFilter = document.getElementById('tx-sort-filter');
    if (sortFilter) {
      sortFilter.addEventListener('change', (e) => {
        state.txFilters.sort = e.target.value;
        state.txFilters.page = 1;
        renderTransactionsLedger();
      });
    }

    const quickExportBtn = document.getElementById('btn-quick-export-csv');
    if (quickExportBtn) quickExportBtn.addEventListener('click', exportTransactionsCsv);

    const runExportBtn = document.getElementById('btn-run-export-csv');
    if (runExportBtn) runExportBtn.addEventListener('click', exportTransactionsCsv);

    const sampleCsvBtn = document.getElementById('btn-download-sample-csv');
    if (sampleCsvBtn) sampleCsvBtn.addEventListener('click', downloadSampleCsv);

    // CSV Dropzone
    const dropzone = document.getElementById('csv-dropzone');
    const fileInput = document.getElementById('csv-file-input');
    if (dropzone && fileInput) {
      dropzone.addEventListener('click', () => fileInput.click());
      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          handleCsvFileSelect(e.target.files[0]);
        }
      });

      dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('drag-over');
      });
      dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag-over'));
      dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('drag-over');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          handleCsvFileSelect(e.dataTransfer.files[0]);
        }
      });
    }

    // CSV Preview Modal Actions
    const closeCsvPreview = document.getElementById('btn-close-csv-preview');
    if (closeCsvPreview) closeCsvPreview.addEventListener('click', () => closeModal('modal-csv-preview'));

    const cancelImport = document.getElementById('btn-cancel-import');
    if (cancelImport) cancelImport.addEventListener('click', () => closeModal('modal-csv-preview'));

    const confirmImport = document.getElementById('btn-confirm-import');
    if (confirmImport) confirmImport.addEventListener('click', confirmCsvImport);

    // Backup & Restore
    const exportJsonBtn = document.getElementById('btn-export-json-backup');
    if (exportJsonBtn) exportJsonBtn.addEventListener('click', exportJsonBackup);

    const jsonFileInput = document.getElementById('json-file-input');
    const importJsonBtn = document.getElementById('btn-import-json-backup');
    if (jsonFileInput && importJsonBtn) {
      importJsonBtn.addEventListener('click', () => jsonFileInput.click());
      jsonFileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          handleJsonRestoreFile(e.target.files[0]);
        }
      });
    }

    const resetDemoBtn = document.getElementById('btn-reset-demo-data');
    if (resetDemoBtn) resetDemoBtn.addEventListener('click', resetDemoData);

    const clearAllBtn = document.getElementById('btn-clear-all-data');
    if (clearAllBtn) clearAllBtn.addEventListener('click', clearAllData);

    // SQL Database Sync Listeners
    const syncSqlBtn = document.getElementById('btn-sync-sql');
    if (syncSqlBtn) syncSqlBtn.addEventListener('click', () => syncWithSqlDatabase(true));

    const sqlBadgeEl = document.getElementById('sql-db-badge');
    if (sqlBadgeEl) sqlBadgeEl.addEventListener('click', () => syncWithSqlDatabase(true));

    // 10. Print Statement Button
    const printBtn = document.getElementById('btn-export-statement');
    if (printBtn) printBtn.addEventListener('click', () => window.print());

    // Keyboard Shortcuts (N for new tx, Ctrl+K or / for search, Esc for close modal)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeModal('modal-transaction');
        closeModal('modal-edit-budget');
        closeModal('modal-csv-preview');
        closeModal('modal-confirm');
        const contactDrawerEl = document.getElementById('drawer-contact');
        if (contactDrawerEl) contactDrawerEl.classList.remove('open');
        const mobileDrawerEl = document.getElementById('mobile-menu-drawer');
        if (mobileDrawerEl) mobileDrawerEl.classList.remove('open');
        const dropdown = document.getElementById('global-search-results');
        if (dropdown) dropdown.style.display = 'none';
      }

      // Ctrl+K or Cmd+K or / for Search
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        const searchBox = document.getElementById('global-site-search');
        if (searchBox) {
          searchBox.focus();
          searchBox.select();
        }
      }

      // N for new transaction when not typing in an input
      if ((e.key === 'n' || e.key === 'N') && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
        e.preventDefault();
        openAddTransactionModal();
      }
    });

    // 17. Clickable Brand Logo & Title
    const brandLink = document.getElementById('brand-logo-link');
    if (brandLink) {
      brandLink.addEventListener('click', (e) => {
        e.preventDefault();
        switchTab('dashboard');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    // 7. Footer Navigation Tab Links
    document.querySelectorAll('.footer-link-btn[data-tab]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = e.currentTarget.getAttribute('data-tab');
        switchTab(tab);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });

    // Footer Contact Drawer Trigger
    const openFooterContact = document.getElementById('btn-open-footer-contact');
    const contactDrawerEl = document.getElementById('drawer-contact');
    if (openFooterContact && contactDrawerEl) {
      openFooterContact.addEventListener('click', () => {
        contactDrawerEl.classList.add('open');
      });
    }

    // Privacy & Storage Terms Modal Triggers
    const btnPrivacy = document.getElementById('btn-open-privacy-modal');
    const btnTerms = document.getElementById('btn-open-terms-modal');
    const btnClosePrivacy = document.getElementById('btn-close-privacy-modal');
    const btnDismissPrivacy = document.getElementById('btn-dismiss-privacy-modal');

    if (btnPrivacy) btnPrivacy.addEventListener('click', () => openModal('modal-privacy-terms'));
    if (btnTerms) btnTerms.addEventListener('click', () => openModal('modal-privacy-terms'));
    if (btnClosePrivacy) btnClosePrivacy.addEventListener('click', () => closeModal('modal-privacy-terms'));
    if (btnDismissPrivacy) btnDismissPrivacy.addEventListener('click', () => closeModal('modal-privacy-terms'));

    window.addEventListener('resize', () => {
      if (state.activeTab === 'dashboard') {
        renderTrendChart();
      }
    });
  }

  // --- Run on DOM Ready ---
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
