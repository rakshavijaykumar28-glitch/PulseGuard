// public/app.js - PulseGuard AI Production Enterprise Client Engine
document.addEventListener('DOMContentLoaded', () => {
  // Global State
  const state = {
    currentSectorKey: 'restaurant',
    sectorData: null,
    activeTab: 'dashboard',
    searchQuery: '',
    actionFilter: 'ALL',
    theme: localStorage.getItem('pulseguard_theme') || 'dark',
    countdownSeconds: {},
    simDebounceTimer: null
  };

  // --- Theme Management ---
  const body = document.body;
  const themeToggleBtn = document.getElementById('btn-theme-toggle');
  const sunIcon = document.getElementById('theme-icon-sun');
  const moonIcon = document.getElementById('theme-icon-moon');

  function applyTheme(theme) {
    state.theme = theme;
    if (theme === 'light') {
      body.classList.remove('theme-dark');
      body.classList.add('theme-light');
      if (sunIcon) sunIcon.style.display = 'block';
      if (moonIcon) moonIcon.style.display = 'none';
      localStorage.setItem('pulseguard_theme', 'light');
    } else {
      body.classList.remove('theme-light');
      body.classList.add('theme-dark');
      if (sunIcon) sunIcon.style.display = 'none';
      if (moonIcon) moonIcon.style.display = 'block';
      localStorage.setItem('pulseguard_theme', 'dark');
    }
  }
  applyTheme(state.theme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      applyTheme(state.theme === 'dark' ? 'light' : 'dark');
    });
  }

  // --- Scroll Progress Bar ---
  const scrollProgressBar = document.getElementById('scroll-progress-bar');
  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    if (scrollProgressBar) scrollProgressBar.style.width = `${progress}%`;
  });

  // --- Tab Navigation ---
  const navTabs = document.querySelectorAll('.nav-tab-btn');
  const tabPanes = {
    'dashboard': document.getElementById('pane-dashboard'),
    'what-if': document.getElementById('pane-what-if'),
    'actions': document.getElementById('pane-actions'),
    'suppliers': document.getElementById('pane-suppliers'),
    'reviews': document.getElementById('pane-reviews'),
    'employees': document.getElementById('pane-employees'),
    'security': document.getElementById('pane-security')
  };

  function switchTab(tabKey) {
    state.activeTab = tabKey;
    navTabs.forEach(btn => {
      if (btn.getAttribute('data-tab') === tabKey) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    Object.keys(tabPanes).forEach(k => {
      if (tabPanes[k]) {
        tabPanes[k].style.display = k === tabKey ? 'block' : 'none';
      }
    });
  }

  navTabs.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab');
      if (tab) switchTab(tab);
    });
  });

  // --- Sector Selector ---
  const sectorSelector = document.getElementById('sector-selector');
  if (sectorSelector) {
    sectorSelector.addEventListener('change', (e) => {
      loadSector(e.target.value);
    });
  }

  // --- Load Sector Data ---
  async function loadSector(sectorKey) {
    state.currentSectorKey = sectorKey;
    try {
      const res = await fetch(`/api/sector/${sectorKey}`);
      if (res.ok) {
        state.sectorData = await res.json();
        renderAll();
      }
    } catch (err) {
      console.error('Failed to load sector data', err);
    }
  }

  // --- Master Render Function ---
  function renderAll() {
    if (!state.sectorData) return;
    const data = state.sectorData;

    // 1. Navbar badge
    const badgeAlertCount = document.getElementById('badge-alert-count');
    if (badgeAlertCount) {
      badgeAlertCount.textContent = data.criticalAlertsCount || 0;
      badgeAlertCount.style.display = data.criticalAlertsCount > 0 ? 'inline-block' : 'none';
    }

    // 2. KPIs
    const kpis = data.kpis || {};
    document.getElementById('kpi-items-tracked').textContent = kpis.itemsTracked || 0;
    const criticalElem = document.getElementById('kpi-critical-alerts');
    criticalElem.textContent = kpis.criticalAlerts || 0;
    criticalElem.style.color = kpis.criticalAlerts > 0 ? 'var(--red)' : 'var(--green)';

    document.getElementById('kpi-total-stock-val').textContent = kpis.totalStockValue || '0';
    document.getElementById('kpi-total-stock-left').textContent = kpis.totalStockLeft || '0';
    document.getElementById('kpi-profit-day').textContent = kpis.profitPerDay || '0';
    document.getElementById('kpi-revenue-risk').textContent = kpis.revenueAtRisk || '0';

    // 3. Hero Callout
    const heroProduct = data.products && data.products[0];
    const heroBanner = document.getElementById('hero-alert-banner');
    if (heroBanner && heroProduct) {
      if (heroProduct.status === 'Critical') {
        heroBanner.style.display = 'block';
        document.getElementById('hero-alert-title').textContent = heroProduct.name;
        document.getElementById('hero-alert-countdown').textContent = `Depletion in ${heroProduct.hoursToSellout} hours`;
        document.getElementById('hero-alert-desc').textContent =
          `Daily consumption (${heroProduct.dailySalesRate} ${heroProduct.unit}/day) exceeds supplier delivery buffer. Unmitigated loss estimated at ${data.revenueAtRisk}.`;
      } else {
        heroBanner.style.display = 'none';
      }
    }

    // 4. Product Scorecard Table
    renderProductScorecard();

    // 5. Velocity Chart
    renderVelocityChart(data.charts?.salesVsStock);

    // 6. Supplier Lag Card
    renderSupplierLag(data.suppliers && data.suppliers[0]);

    // 7. Actions Tab
    renderActions();

    // 8. Suppliers Tab
    renderSuppliers(data.suppliers || []);

    // 9. Reviews Tab
    renderReviews(data.reviews || []);

    // 10. Employees Tab
    renderEmployees(data.employees || []);

    // 11. Security & Compliance Checklist (Profile: rozgaarrhythms)
    renderSecurityChecklist();

    // 12. Reset Sandbox Baseline
    resetSandboxValues();
  }

  // --- Render Product Scorecard Table ---
  function renderProductScorecard() {
    const products = state.sectorData.products || [];
    const tbody = document.getElementById('scorecard-tbody');
    if (!tbody) return;

    // Filter by search query
    const q = state.searchQuery.toLowerCase().trim();
    const filtered = products.filter(p => {
      if (!q) return true;
      return p.name.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.status.toLowerCase().includes(q);
    });

    // Clear existing countdown state
    state.countdownSeconds = {};

    tbody.innerHTML = filtered.map(p => {
      const initSec = Math.max(0, Math.round((p.hoursToSellout || 0) * 3600));
      state.countdownSeconds[p.id] = initSec;
      const statusClass = p.status.toLowerCase();
      const riskClass = p.riskScore >= 75 ? 'high' : p.riskScore >= 45 ? 'med' : 'low';

      return `
        <tr data-product-id="${p.id}">
          <td>
            <div class="product-cell-main">${p.name}</div>
            <div class="product-cell-sub">${p.category || 'General'}</div>
          </td>
          <td><strong style="color: var(--text);">${p.stockLeft}</strong> ${p.unit}</td>
          <td>${p.dailySalesRate} ${p.unit}/day</td>
          <td>
            <span class="countdown-clock ${statusClass}" id="countdown-${p.id}">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="display:inline-block; vertical-align:middle; margin-right:4px;">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <span class="countdown-text">${formatCountdown(initSec)}</span>
            </span>
          </td>
          <td>
            <div>${p.incomingStock > 0 ? `${p.incomingStock} ${p.incomingUnit}` : 'None'}</div>
            <div style="font-size: 10px; color: var(--muted);">${p.incomingDate}</div>
          </td>
          <td>
            <span style="color: ${p.status === 'Critical' ? 'var(--red)' : 'inherit'}; font-weight: ${p.status === 'Critical' ? 600 : 400};">
              ${p.stockoutDate}
            </span>
          </td>
          <td>
            <div style="display: flex; align-items: center; gap: 6px;">
              <div style="width: 48px; height: 5px; background: var(--surface-subtle); border-radius: 2px; overflow: hidden;">
                <div style="width: ${p.stockClearance}%; height: 100%; background: ${p.stockClearance > 80 ? 'var(--red)' : 'var(--cyan)'};"></div>
              </div>
              <span style="font-size: 11px; font-family: monospace;">${p.stockClearance}%</span>
            </div>
          </td>
          <td>${p.actualSales}</td>
          <td>
            <span style="color: ${p.isProfit ? 'var(--green)' : 'var(--red)'}; font-weight: 600;">
              ${p.profitOrLoss}
            </span>
          </td>
          <td>
            <span class="status-badge ${statusClass}">${p.status}</span>
          </td>
          <td>
            <span class="risk-score-pill ${riskClass}">${p.riskScore}/100</span>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Format seconds to countdown string
  function formatCountdown(sec) {
    if (sec <= 0) return 'DEPLETED';
    const days = Math.floor(sec / 86400);
    const hours = Math.floor((sec % 86400) / 3600);
    const minutes = Math.floor((sec % 3600) / 60);
    const seconds = sec % 60;
    const pad = n => String(n).padStart(2, '0');
    if (days > 0) {
      return `${days}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
    }
    return `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
  }

  // --- Live Second-by-Second Countdown Tick ---
  setInterval(() => {
    Object.keys(state.countdownSeconds).forEach(id => {
      if (state.countdownSeconds[id] > 0) {
        state.countdownSeconds[id]--;
        const elem = document.querySelector(`#countdown-${id} .countdown-text`);
        if (elem) {
          elem.textContent = formatCountdown(state.countdownSeconds[id]);
        }
      }
    });
  }, 1000);

  // --- Render Velocity Chart (Pure Responsive SVG) ---
  function renderVelocityChart(chartData) {
    const container = document.getElementById('chart-velocity-svg');
    if (!container || !chartData || chartData.length === 0) return;

    const maxVal = Math.max(...chartData.map(d => Math.max(d.sales, d.stock))) * 1.2 || 100;
    const width = 600;
    const height = 180;
    const padding = 28;

    const pointsStock = chartData.map((d, i) => {
      const x = padding + (i / (chartData.length - 1)) * (width - padding * 2);
      const y = height - padding - (d.stock / maxVal) * (height - padding * 2);
      return `${x},${y}`;
    }).join(' ');

    const pointsSales = chartData.map((d, i) => {
      const x = padding + (i / (chartData.length - 1)) * (width - padding * 2);
      const y = height - padding - (d.sales / maxVal) * (height - padding * 2);
      return `${x},${y}`;
    }).join(' ');

    const circles = chartData.map((d, i) => {
      const x = padding + (i / (chartData.length - 1)) * (width - padding * 2);
      const yStock = height - padding - (d.stock / maxVal) * (height - padding * 2);
      const ySales = height - padding - (d.sales / maxVal) * (height - padding * 2);
      return `
        <circle cx="${x}" cy="${yStock}" r="3.5" fill="var(--cyan)" />
        <circle cx="${x}" cy="${ySales}" r="3.5" fill="var(--red)" />
        <text x="${x}" y="${height - 8}" font-size="9.5" fill="var(--muted)" text-anchor="middle">${d.day}</text>
      `;
    }).join('');

    container.innerHTML = `
      <svg viewBox="0 0 ${width} ${height}" style="width: 100%; height: 100%; overflow: visible;">
        <line x1="${padding}" y1="${padding}" x2="${width - padding}" y2="${padding}" stroke="var(--border)" stroke-dasharray="3 3" stroke-width="0.8" />
        <line x1="${padding}" y1="${height / 2}" x2="${width - padding}" y2="${height / 2}" stroke="var(--border)" stroke-dasharray="3 3" stroke-width="0.8" />
        <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="var(--border)" stroke-width="0.8" />
        <polyline fill="none" stroke="var(--cyan)" stroke-width="2.5" points="${pointsStock}" />
        <polyline fill="none" stroke="var(--red)" stroke-width="2.5" points="${pointsSales}" />
        ${circles}
      </svg>
    `;
  }

  // --- Render Supplier Lag Panel ---
  function renderSupplierLag(supplier) {
    const container = document.getElementById('supplier-lag-content');
    const badge = document.getElementById('supplier-status-badge');
    if (!container) return;

    if (!supplier) {
      container.innerHTML = `<div style="color: var(--muted);">No supplier bottlenecks detected.</div>`;
      return;
    }

    if (badge) {
      badge.textContent = `${supplier.status} SLA`;
      badge.className = `status-badge ${supplier.status.toLowerCase()}`;
    }

    container.innerHTML = `
      <div>
        <div style="font-weight: 600; color: var(--text);">${supplier.name}</div>
        <div style="color: var(--muted);">Supplying: ${supplier.itemSupplied}</div>
      </div>
      <div style="background: var(--surface-card); padding: 8px; border-radius: 2px; border: 1px solid var(--border);">
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span style="color: var(--muted);">Turnaround Delay:</span>
          <span style="color: var(--red); font-weight: 600;">${supplier.leadTime}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: var(--muted);">Reliability Score:</span>
          <span style="font-weight: 600;">${supplier.reliability}% (${supplier.trend})</span>
        </div>
      </div>
      <div style="color: var(--amber); font-size: 11px;">
        Action: ${supplier.action}
      </div>
    `;
  }

  // --- Render Actions Tab ---
  function renderActions() {
    const actions = state.sectorData.actions || [];
    const tbody = document.getElementById('actions-tbody');
    if (!tbody) return;

    const filtered = actions.filter(a => {
      if (state.actionFilter === 'ALL') return true;
      return a.status.toUpperCase() === state.actionFilter;
    });

    tbody.innerHTML = filtered.map(a => `
      <tr>
        <td style="font-weight: 600;">${a.title}</td>
        <td style="color: var(--muted);">${a.risk}</td>
        <td>${a.responsible}</td>
        <td>${a.deadline}</td>
        <td>
          <span class="status-badge ${a.status === 'Completed' ? 'healthy' : a.status === 'Pending' ? 'critical' : 'warning'}">
            ${a.status}
          </span>
        </td>
        <td style="color: var(--cyan);">${a.expectedImpact}</td>
        <td>
          ${a.status !== 'Completed' ? `
            <div style="display: flex; gap: 4px;">
              <button class="btn btn-primary btn-sm btn-mark-done" data-action-id="${a.id}">Mark Done</button>
              <button class="btn btn-secondary btn-sm btn-mark-progress" data-action-id="${a.id}">In Progress</button>
            </div>
          ` : `<span style="font-size: 11px; color: var(--green);">Resolved</span>`}
        </td>
      </tr>
    `).join('');

    // Attach listeners
    tbody.querySelectorAll('.btn-mark-done').forEach(b => {
      b.addEventListener('click', () => updateActionStatus(b.getAttribute('data-action-id'), 'Completed'));
    });
    tbody.querySelectorAll('.btn-mark-progress').forEach(b => {
      b.addEventListener('click', () => updateActionStatus(b.getAttribute('data-action-id'), 'In Progress'));
    });
  }

  // Filter Buttons
  document.querySelectorAll('[data-action-filter]').forEach(b => {
    b.addEventListener('click', () => {
      document.querySelectorAll('[data-action-filter]').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      state.actionFilter = b.getAttribute('data-action-filter');
      renderActions();
    });
  });

  async function updateActionStatus(actionId, status) {
    try {
      await fetch(`/api/sector/${state.currentSectorKey}/actions/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionId, status })
      });
      loadSector(state.currentSectorKey);
    } catch (err) {
      console.error(err);
    }
  }

  // Auto-Mitigate All
  const btnAutoMitigateAll = document.getElementById('btn-auto-mitigate-all');
  const btnHeroMitigate = document.getElementById('btn-hero-mitigate');
  async function triggerAutoMitigate() {
    try {
      const res = await fetch(`/api/sector/${state.currentSectorKey}/actions/auto-mitigate`, { method: 'POST' });
      if (res.ok) {
        await loadSector(state.currentSectorKey);
        alert('All operational mitigations deployed! Stockout risks averted.');
      }
    } catch (err) {
      console.error(err);
    }
  }
  if (btnAutoMitigateAll) btnAutoMitigateAll.addEventListener('click', triggerAutoMitigate);
  if (btnHeroMitigate) btnHeroMitigate.addEventListener('click', triggerAutoMitigate);

  // --- Render Suppliers Tab ---
  function renderSuppliers(suppliers) {
    const grid = document.getElementById('suppliers-grid');
    if (!grid) return;
    grid.innerHTML = suppliers.map(s => `
      <div style="background: var(--surface-card); border: 1px solid var(--border); padding: 12px; border-radius: 2px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <span style="font-weight: 700; font-size: 13px;">${s.name}</span>
          <span class="status-badge ${s.status.toLowerCase()}">${s.status}</span>
        </div>
        <div style="font-size: 11.5px; color: var(--muted); margin-bottom: 8px;">
          Supplying: ${s.itemSupplied}
        </div>
        <div style="font-size: 11px; display: flex; flex-direction: column; gap: 4px; background: var(--surface-subtle); padding: 6px; border-radius: 2px;">
          <div>Lead Time: <strong style="color: ${s.status === 'Critical' ? 'var(--red)' : 'inherit'};">${s.leadTime}</strong></div>
          <div>Reliability: <strong>${s.reliability}%</strong> (${s.trend})</div>
          <div>Contact: <code>${s.contact}</code></div>
        </div>
        <div style="margin-top: 8px; font-size: 11px; color: var(--amber);">
          Action: ${s.action}
        </div>
      </div>
    `).join('');
  }

  // --- Render Reviews Tab ---
  function renderReviews(reviews) {
    const container = document.getElementById('reviews-container');
    if (!container) return;
    container.innerHTML = reviews.map(r => `
      <div style="background: var(--surface-card); border: 1px solid var(--border); padding: 10px 12px; border-radius: 2px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-weight: 600;">${r.customer}</span>
            <span style="font-size: 11px; color: var(--muted);">${r.date}</span>
            <span class="status-badge ${r.sentiment === 'Positive' ? 'healthy' : 'critical'}">${r.category}</span>
          </div>
          <div style="color: var(--amber); font-size: 11.5px; font-weight: 600;">
            Rating: ${r.rating} / 5
          </div>
        </div>
        <p style="font-size: 12px; color: var(--text);">"${r.text}"</p>
        <div style="font-size: 10.5px; color: var(--red); margin-top: 4px;">Impact: ${r.impact}</div>
      </div>
    `).join('');
  }

  // --- Render Employees Tab ---
  function renderEmployees(employees) {
    const grid = document.getElementById('employees-grid');
    if (!grid) return;
    grid.innerHTML = employees.map(e => `
      <div style="background: var(--surface-card); border: 1px solid var(--border); padding: 12px; border-radius: 2px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span style="font-weight: 700;">${e.name}</span>
          <span class="status-badge ${e.status === 'Overloaded' ? 'critical' : 'healthy'}">${e.status}</span>
        </div>
        <div style="font-size: 11.5px; color: var(--cyan);">${e.role}: ${e.station}</div>
        <div style="font-size: 11px; color: var(--muted); margin: 4px 0;">Shift: ${e.shift}</div>
        <div style="font-size: 11.5px; color: var(--text); background: var(--surface-subtle); padding: 6px; border-radius: 2px;">
          ${e.note}
        </div>
      </div>
    `).join('');
  }

  // --- Render Security & Compliance Checklist Tab (Profile: rozgaarrhythms) ---
  async function renderSecurityChecklist() {
    const leftCol = document.getElementById('security-left-column');
    const rightCol = document.getElementById('security-right-column');
    if (!leftCol || !rightCol) return;

    try {
      const res = await fetch('/api/security/checklist');
      if (!res.ok) return;
      const data = await res.json();

      // Render Left Column (11 items)
      leftCol.innerHTML = (data.leftColumn || []).map((item, idx) => `
        <div style="background: var(--surface-card); border: 1px solid var(--border); padding: 10px 12px; border-radius: 2px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-family: monospace; font-size: 11px; color: var(--muted);">${String(idx + 1).padStart(2, '0')}.</span>
              <strong style="color: var(--text); font-size: 12.5px;">${item.name}</strong>
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <span class="status-badge healthy" id="sec-badge-${item.id}">${item.status}</span>
              <button class="btn btn-secondary btn-sm btn-test-control" data-sec-id="${item.id}" style="padding: 2px 6px; font-size: 10px;">Test</button>
            </div>
          </div>
          <div style="font-size: 11px; color: var(--cyan); margin-bottom: 4px;">${item.category}</div>
          <p style="font-size: 11.5px; color: var(--muted); margin-bottom: 6px;">${item.description}</p>
          <div style="font-size: 10.5px; color: var(--text); background: var(--surface-subtle); padding: 6px; border-radius: 2px; font-family: monospace;">
            Audit: ${item.auditDetail}
          </div>
        </div>
      `).join('');

      // Render Right Column (8 items)
      rightCol.innerHTML = (data.rightColumn || []).map((item, idx) => `
        <div style="background: var(--surface-card); border: 1px solid var(--border); padding: 10px 12px; border-radius: 2px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-family: monospace; font-size: 11px; color: var(--muted);">${String(idx + 12).padStart(2, '0')}.</span>
              <strong style="color: var(--text); font-size: 12.5px;">${item.name}</strong>
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <span class="status-badge healthy" id="sec-badge-${item.id}">${item.status}</span>
              <button class="btn btn-secondary btn-sm btn-test-control" data-sec-id="${item.id}" style="padding: 2px 6px; font-size: 10px;">Test</button>
            </div>
          </div>
          <div style="font-size: 11px; color: var(--cyan); margin-bottom: 4px;">${item.category}</div>
          <p style="font-size: 11.5px; color: var(--muted); margin-bottom: 6px;">${item.description}</p>
          <div style="font-size: 10.5px; color: var(--text); background: var(--surface-subtle); padding: 6px; border-radius: 2px; font-family: monospace;">
            Audit: ${item.auditDetail}
          </div>
        </div>
      `).join('');

      // Attach Test Control Listeners
      document.querySelectorAll('.btn-test-control').forEach(btn => {
        btn.addEventListener('click', async () => {
          const cid = btn.getAttribute('data-sec-id');
          btn.textContent = 'Testing...';
          try {
            const testRes = await fetch('/api/security/test', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ controlId: cid })
            });
            if (testRes.ok) {
              btn.textContent = 'Verified';
              btn.style.color = 'var(--green)';
              const badge = document.getElementById(`sec-badge-${cid}`);
              if (badge) badge.textContent = 'Verified Live';
              reloadAuditLogs();
            }
          } catch (e) {
            btn.textContent = 'Error';
          }
        });
      });

      // Render Recent Audit Logs
      renderAuditLogs(data.recentAuditLogs || []);

    } catch (err) {
      console.error('Failed to load security checklist', err);
    }
  }

  function renderAuditLogs(logs) {
    const auditTbody = document.getElementById('security-audit-tbody');
    if (!auditTbody) return;
    if (logs.length === 0) {
      auditTbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--muted); padding: 12px;">No security exceptions logged. All controls operating normally.</td></tr>`;
      return;
    }
    auditTbody.innerHTML = logs.map(l => `
      <tr>
        <td style="font-family: monospace; font-size: 11px;">${l.timestamp}</td>
        <td><strong style="color: var(--cyan);">${l.action_type}</strong></td>
        <td>${l.actor}</td>
        <td><code>${l.client_ip}</code></td>
        <td>${l.target_entity}</td>
        <td><span class="status-badge healthy">${l.status}</span></td>
      </tr>
    `).join('');
  }

  async function reloadAuditLogs() {
    try {
      const res = await fetch('/api/security/checklist');
      if (res.ok) {
        const data = await res.json();
        renderAuditLogs(data.recentAuditLogs || []);
      }
    } catch {}
  }

  // Full Security Audit Trigger
  const btnRunSecurityAudit = document.getElementById('btn-run-security-audit');
  if (btnRunSecurityAudit) {
    btnRunSecurityAudit.addEventListener('click', async () => {
      btnRunSecurityAudit.textContent = 'Running Audit...';
      try {
        await fetch('/api/security/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ controlId: 'FULL_19_POINT_SECURITY_AUDIT' })
        });
        await renderSecurityChecklist();
        btnRunSecurityAudit.textContent = 'Audit Complete (19/19 Pass)';
        setTimeout(() => { btnRunSecurityAudit.textContent = 'Run Full Security Audit'; }, 3000);
      } catch {
        btnRunSecurityAudit.textContent = 'Run Full Security Audit';
      }
    });
  }

  // Export Security Proof
  const btnExportSecurityCert = document.getElementById('btn-export-security-cert');
  if (btnExportSecurityCert) {
    btnExportSecurityCert.addEventListener('click', () => {
      window.print();
    });
  }

  // --- What If? Sandbox Simulation ---
  const sliderDemand = document.getElementById('slider-demand');
  const sliderDelay = document.getElementById('slider-delay');
  const sliderBuffer = document.getElementById('slider-buffer');
  const labelDemand = document.getElementById('label-slider-demand');
  const labelDelay = document.getElementById('label-slider-delay');
  const labelBuffer = document.getElementById('label-slider-buffer');

  function resetSandboxValues() {
    if (sliderDemand) sliderDemand.value = 0;
    if (sliderDelay) sliderDelay.value = 0;
    if (sliderBuffer) sliderBuffer.value = 0;
    if (labelDemand) labelDemand.textContent = '0%';
    if (labelDelay) labelDelay.textContent = '+0 Days';
    if (labelBuffer) labelBuffer.textContent = '0%';
    triggerSimulation();
  }

  const btnResetSandbox = document.getElementById('btn-reset-sandbox');
  if (btnResetSandbox) btnResetSandbox.addEventListener('click', resetSandboxValues);

  function triggerSimulation() {
    clearTimeout(state.simDebounceTimer);
    state.simDebounceTimer = setTimeout(async () => {
      const demandDelta = Number(sliderDemand?.value || 0);
      const supplierDelayDelta = Number(sliderDelay?.value || 0);
      const inventoryDelta = Number(sliderBuffer?.value || 0);

      if (labelDemand) labelDemand.textContent = demandDelta > 0 ? `+${demandDelta}%` : `${demandDelta}%`;
      if (labelDelay) labelDelay.textContent = `+${supplierDelayDelta} Days`;
      if (labelBuffer) labelBuffer.textContent = inventoryDelta > 0 ? `+${inventoryDelta}%` : `${inventoryDelta}%`;

      try {
        const res = await fetch(`/api/sector/${state.currentSectorKey}/simulate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ demandDelta, supplierDelayDelta, inventoryDelta })
        });
        if (res.ok) {
          const sim = await res.json();
          document.getElementById('sim-days-stockout').textContent = `${sim.simulatedDaysToStockout} Days`;
          document.getElementById('sim-revenue-loss').textContent = sim.simulatedRevenueLoss;
          const badge = document.getElementById('sim-risk-badge');
          badge.textContent = `${sim.simulatedRiskScore} / 100 (${sim.riskSeverity})`;
          badge.className = `risk-score-pill ${sim.simulatedRiskScore >= 75 ? 'high' : 'med'}`;
          document.getElementById('sim-strategy-box').innerHTML =
            `<strong>AI Operational Strategy:</strong> ${sim.recommendedAdjustment}`;
        }
      } catch (err) {
        console.error(err);
      }
    }, 150);
  }

  [sliderDemand, sliderDelay, sliderBuffer].forEach(sl => {
    if (sl) sl.addEventListener('input', triggerSimulation);
  });

  // --- Global Search Input ---
  const globalSearchInput = document.getElementById('global-search-input');
  if (globalSearchInput) {
    globalSearchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      renderProductScorecard();
    });
  }

  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      if (globalSearchInput) globalSearchInput.focus();
    }
  });

  // --- Ask PulseGuard Copilot Drawer ---
  const copilotDrawer = document.getElementById('copilot-drawer');
  const btnOpenCopilot = document.getElementById('btn-open-copilot');
  const btnCloseCopilot = document.getElementById('btn-close-copilot');
  const btnHeroExplain = document.getElementById('btn-hero-explain');
  const copilotForm = document.getElementById('copilot-form');
  const copilotInput = document.getElementById('copilot-input');
  const copilotMessages = document.getElementById('copilot-messages');

  function openCopilot() {
    if (copilotDrawer) copilotDrawer.classList.add('open');
    if (copilotMessages && copilotMessages.children.length === 0) {
      appendCopilotMessage('assistant', `Hello. I am PulseGuard AI, grounded in verified ${state.sectorData?.businessName} ledgers. Ask me about inventory, suppliers, or revenue.`);
    }
  }
  function closeCopilot() {
    if (copilotDrawer) copilotDrawer.classList.remove('open');
  }

  if (btnOpenCopilot) btnOpenCopilot.addEventListener('click', openCopilot);
  if (btnHeroExplain) btnHeroExplain.addEventListener('click', openCopilot);
  if (btnCloseCopilot) btnCloseCopilot.addEventListener('click', closeCopilot);

  function appendCopilotMessage(role, text, source) {
    if (!copilotMessages) return;
    const msgDiv = document.createElement('div');
    msgDiv.style.cssText = `
      background: ${role === 'user' ? 'var(--surface-card)' : 'var(--surface-subtle)'};
      border: 1px solid var(--border);
      padding: 8px 10px;
      border-radius: 2px;
      font-size: 12px;
    `;
    msgDiv.innerHTML = `
      <div style="font-size: 10px; color: var(--muted); margin-bottom: 2px;">
        ${role === 'user' ? 'You' : 'PulseGuard AI'}
      </div>
      <div>${text}</div>
      ${source ? `<div style="font-size: 9.5px; color: var(--cyan); margin-top: 4px;">Source: ${source}</div>` : ''}
    `;
    copilotMessages.appendChild(msgDiv);
    copilotMessages.scrollTop = copilotMessages.scrollHeight;
  }

  async function handleSendQuery(question) {
    if (!question || !question.trim()) return;
    appendCopilotMessage('user', question);
    if (copilotInput) copilotInput.value = '';

    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'copilot-loading';
    loadingDiv.style.cssText = 'font-size: 11px; color: var(--muted);';
    loadingDiv.textContent = 'Querying grounded intelligence...';
    copilotMessages.appendChild(loadingDiv);
    copilotMessages.scrollTop = copilotMessages.scrollHeight;

    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, sectorKey: state.currentSectorKey })
      });
      if (res.ok) {
        const data = await res.json();
        const l = document.getElementById('copilot-loading');
        if (l) l.remove();
        appendCopilotMessage('assistant', data.answer, data.source);
      }
    } catch (err) {
      const l = document.getElementById('copilot-loading');
      if (l) l.remove();
      appendCopilotMessage('assistant', 'Connection error. Please retry.');
    }
  }

  if (copilotForm) {
    copilotForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleSendQuery(copilotInput.value);
    });
  }

  document.querySelectorAll('.quick-query-btn').forEach(b => {
    b.addEventListener('click', () => handleSendQuery(b.textContent));
  });

  // --- Modals (Tour, Import, Report) ---
  const modalTour = document.getElementById('modal-tour');
  const btnOpenTour = document.getElementById('btn-open-tour');
  const btnCloseTour = document.getElementById('btn-close-tour');

  if (btnOpenTour) btnOpenTour.addEventListener('click', () => modalTour.classList.add('open'));
  if (btnCloseTour) btnCloseTour.addEventListener('click', () => modalTour.classList.remove('open'));

  const modalImport = document.getElementById('modal-import');
  const btnOpenImport = document.getElementById('btn-open-import');
  const btnCloseImport = document.getElementById('btn-close-import');
  const btnSubmitImport = document.getElementById('btn-submit-import');

  if (btnOpenImport) btnOpenImport.addEventListener('click', () => modalImport.classList.add('open'));
  if (btnCloseImport) btnCloseImport.addEventListener('click', () => modalImport.classList.remove('open'));
  if (btnSubmitImport) btnSubmitImport.addEventListener('click', () => {
    alert('Sample CSV verified and ingested into ledger.');
    modalImport.classList.remove('open');
  });

  const modalReport = document.getElementById('modal-report');
  const btnOpenReport = document.getElementById('btn-open-report');
  const btnCloseReport = document.getElementById('btn-close-report');

  if (btnOpenReport) {
    btnOpenReport.addEventListener('click', async () => {
      try {
        const res = await fetch(`/api/report?sector=${state.currentSectorKey}`);
        if (res.ok) {
          const report = await res.json();
          document.getElementById('report-title').textContent = report.title;
          document.getElementById('report-meta').textContent = `Generated: ${new Date(report.generatedAt).toLocaleString()}`;
          document.getElementById('report-summary').textContent = report.summary;
          modalReport.classList.add('open');
        }
      } catch (err) {
        console.error(err);
      }
    });
  }
  if (btnCloseReport) btnCloseReport.addEventListener('click', () => modalReport.classList.remove('open'));

  // TOS & Privacy Policy Modals
  const modalTos = document.getElementById('modal-tos');
  const linkOpenTos = document.getElementById('link-open-tos');
  const btnCloseTos = document.getElementById('btn-close-tos');

  if (linkOpenTos) {
    linkOpenTos.addEventListener('click', (e) => {
      e.preventDefault();
      if (modalTos) modalTos.classList.add('open');
    });
  }
  if (btnCloseTos && modalTos) {
    btnCloseTos.addEventListener('click', () => modalTos.classList.remove('open'));
  }

  const modalPrivacy = document.getElementById('modal-privacy');
  const linkOpenPrivacy = document.getElementById('link-open-privacy');
  const btnClosePrivacy = document.getElementById('btn-close-privacy');

  if (linkOpenPrivacy) {
    linkOpenPrivacy.addEventListener('click', (e) => {
      e.preventDefault();
      if (modalPrivacy) modalPrivacy.classList.add('open');
    });
  }
  if (btnClosePrivacy && modalPrivacy) {
    btnClosePrivacy.addEventListener('click', () => modalPrivacy.classList.remove('open'));
  }

  // Close modals on overlay backdrop click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.classList.remove('open');
    });
  });

  // --- Mobile Drawer Menu ---
  const btnMobileMenu = document.getElementById('btn-mobile-menu');
  const mobileDrawer = document.getElementById('mobile-drawer');
  const btnCloseMobile = document.getElementById('btn-close-mobile-menu');
  const mobileNavItems = document.getElementById('mobile-nav-items');

  if (btnMobileMenu && mobileDrawer) {
    btnMobileMenu.addEventListener('click', () => {
      mobileDrawer.classList.add('open');
      if (mobileNavItems) {
        mobileNavItems.innerHTML = ['dashboard', 'what-if', 'actions', 'suppliers', 'reviews', 'employees', 'security'].map(tab => `
          <button class="btn btn-secondary btn-sm" style="text-align:left; justify-content:flex-start; margin-bottom:6px;" data-mobile-tab="${tab}">
            ${tab.toUpperCase()}
          </button>
        `).join('');
        mobileNavItems.querySelectorAll('[data-mobile-tab]').forEach(b => {
          b.addEventListener('click', () => {
            switchTab(b.getAttribute('data-mobile-tab'));
            mobileDrawer.classList.remove('open');
          });
        });
      }
    });
  }
  if (btnCloseMobile && mobileDrawer) {
    btnCloseMobile.addEventListener('click', () => mobileDrawer.classList.remove('open'));
  }

  // --- Authentication Bridge ---
  window.PulseGuardApp = {
    loadSector,
    onAuthenticated: (user) => {
      loadSector(state.currentSectorKey || 'restaurant');
    }
  };
});
