/* =========================================================
   Nusava — Alerts & Automation View
   Active alerts, Slack digest config, automation rules,
   and a daily digest preview.
   ========================================================= */

window.Views = window.Views || {};

window.Views.alerts = {

  render: function () {
    var html = '<div class="tab-pane">';

    html += '<div class="page-title"><h1>Alerts & Automation</h1>' +
      '<div class="subtitle">Live alerts, Slack digest configuration, and automation rules for creator management.</div></div>';

    // ── Active Alerts ──────────────────────────────────────────
    var alerts = this._buildAlerts();
    var crit   = alerts.filter(function (a) { return a.level === 'critical'; }).length;
    var warn   = alerts.filter(function (a) { return a.level === 'warning'; }).length;
    var info   = alerts.filter(function (a) { return a.level === 'info'; }).length;

    html += '<div class="kpi-grid">';
    html += kpiCard('Critical Alerts', crit, 'Require immediate action', crit > 0 ? 'red' : 'green');
    html += kpiCard('Warnings', warn, 'Monitor closely', warn > 0 ? 'yellow' : 'green');
    html += kpiCard('Info', info, 'FYI — no action needed', 'blue');
    html += kpiCard('Agencies Monitored', CONFIG.agencies.length, 'Automated threshold checks', 'purple');
    html += '</div>';

    html += '<div class="section-header"><span class="section-title">Active Alerts</span>' +
      '<span class="section-meta">Auto-generated from current month data</span></div>';

    if (alerts.length === 0) {
      html += '<div class="alert alert-green" style="margin-bottom:24px"><span class="alert-icon">✅</span><div>No alerts — all agencies are within normal thresholds.</div></div>';
    } else {
      html += '<div style="display:flex;flex-direction:column;gap:10px;margin-bottom:24px">';
      alerts.forEach(function (a) {
        var cls = a.level === 'critical' ? 'alert-red' : a.level === 'warning' ? 'alert-yellow' : 'alert-blue';
        var icon = a.level === 'critical' ? '🚨' : a.level === 'warning' ? '⚠️' : 'ℹ️';
        html += '<div class="alert ' + cls + '" style="justify-content:space-between">';
        html += '<div style="display:flex;gap:10px;align-items:flex-start"><span class="alert-icon">' + icon + '</span>';
        html += '<div><strong>' + a.title + '</strong><div style="margin-top:3px">' + a.body + '</div></div></div>';
        html += '<span style="font-size:11px;color:inherit;opacity:.7;white-space:nowrap;margin-left:16px">' + a.agency + '</span>';
        html += '</div>';
      });
      html += '</div>';
    }

    // ── Slack Digest ──────────────────────────────────────────
    html += '<div class="section-header" style="margin-top:8px"><span class="section-title">Slack Daily Digest</span>' +
      '<span class="section-meta">Configure what gets sent and where</span></div>';

    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px">';

    // Config card
    html += '<div class="chart-card">';
    html += '<div class="chart-title">Configuration</div>';
    html += '<div class="chart-sub">Set your Slack webhook and digest schedule</div>';
    html += '<div style="display:flex;flex-direction:column;gap:12px;margin-top:8px">';

    html += '<div>';
    html += '<label style="font-size:11px;font-weight:600;color:var(--gray-500);text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:5px">Slack Webhook URL</label>';
    html += '<input type="text" style="width:100%;padding:8px 12px;border:1px solid var(--gray-200);border-radius:7px;font-size:13px;font-family:monospace;color:var(--gray-700)" ' +
      'placeholder="https://hooks.slack.com/services/…" id="slack-webhook">';
    html += '</div>';

    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">';
    html += '<div><label style="font-size:11px;font-weight:600;color:var(--gray-500);text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:5px">Channel</label>' +
      '<input type="text" style="width:100%;padding:8px 12px;border:1px solid var(--gray-200);border-radius:7px;font-size:13px" placeholder="#creator-ops" id="slack-channel"></div>';
    html += '<div><label style="font-size:11px;font-weight:600;color:var(--gray-500);text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:5px">Send Time</label>' +
      '<select style="width:100%;padding:8px 12px;border:1px solid var(--gray-200);border-radius:7px;font-size:13px" id="slack-time">' +
      '<option>8:00 AM</option><option>9:00 AM</option><option selected>10:00 AM</option>' +
      '<option>12:00 PM</option><option>6:00 PM</option></select></div>';
    html += '</div>';

    html += '<div><label style="font-size:11px;font-weight:600;color:var(--gray-500);text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:8px">Include in digest</label>';
    html += '<div style="display:flex;flex-direction:column;gap:6px">';
    [
      ['digest-gmv',    'Daily GMV by agency',         true ],
      ['digest-alerts', 'Active alerts',               true ],
      ['digest-top',    'Top 3 creators of the day',   true ],
      ['digest-eval',   'Creator evaluation summary',  false],
      ['digest-aff',    'New organic affiliates',      false]
    ].forEach(function (row) {
      html += '<label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer">' +
        '<input type="checkbox" id="' + row[0] + '"' + (row[2] ? ' checked' : '') + ' style="width:14px;height:14px">' +
        row[1] + '</label>';
    });
    html += '</div></div>';

    html += '<div style="display:flex;gap:10px">';
    html += '<button class="btn btn-primary" id="save-slack-btn" style="flex:1">Save Configuration</button>';
    html += '<button class="btn btn-outline" id="test-slack-btn">Send Test</button>';
    html += '</div>';

    html += '</div></div>'; // config card

    // Preview card
    html += '<div class="chart-card">';
    html += '<div class="chart-title">Digest Preview</div>';
    html += '<div class="chart-sub">What today\'s message would look like in Slack</div>';
    html += '<div id="digest-preview">' + this._buildDigestPreview() + '</div>';
    html += '</div>';

    html += '</div>'; // grid

    // ── Automation Rules ──────────────────────────────────────────
    html += '<div class="section-header"><span class="section-title">Automation Rules</span>' +
      '<span class="section-meta">Threshold-based triggers — evaluated each time data refreshes</span></div>';

    html += '<div class="table-card"><div class="table-scroll"><table class="data-table">';
    html += '<thead><tr><th>Rule</th><th>Condition</th><th>Action</th><th>Scope</th><th>Status</th></tr></thead><tbody>';

    var rules = [
      { name: 'GMV Spike Alert',       cond: 'GMV in any month > 2× previous month',      action: 'Post alert + flag in dashboard',       scope: 'All agencies',  active: true  },
      { name: 'Creator Going Cold',    cond: 'Creator GMV drops > 50% month-over-month',  action: 'Add to REVIEW queue + Slack alert',    scope: 'All agencies',  active: true  },
      { name: 'Delivery Miss',         cond: 'Video delivery rate < 80% of target',       action: 'Warning alert on agency overview',     scope: 'All agencies',  active: true  },
      { name: 'Perf Rate Drop',        cond: 'Performing creator rate < 25%',             action: 'Critical alert + Slack message',       scope: 'All agencies',  active: true  },
      { name: 'New High Organic',      cond: 'Open affiliate L30 GMV > $10K',             action: 'Auto-flag as Target in affiliates tab', scope: 'Open affiliates', active: true  },
      { name: 'ROI Below Break-Even',  cond: 'Monthly ROI < break-even threshold',        action: 'Red highlight + critical alert',       scope: 'All agencies',  active: true  },
      { name: 'Narrative Waning',      cond: 'Narrative GMV/video drops 3 months in row', action: 'Tag as Waning in Narrative view',      scope: 'Narratives',    active: false },
      { name: 'Monthly Summary',       cond: 'Last day of each campaign month',           action: 'Full digest with MoM comparison',      scope: 'All agencies',  active: false }
    ];

    rules.forEach(function (r) {
      html += '<tr>';
      html += '<td><strong>' + r.name + '</strong></td>';
      html += '<td style="font-size:12px;color:var(--gray-500)">' + r.cond + '</td>';
      html += '<td style="font-size:12px">' + r.action + '</td>';
      html += '<td style="font-size:12px;color:var(--gray-500)">' + r.scope + '</td>';
      html += '<td><span style="display:inline-block;padding:2px 10px;border-radius:20px;font-size:11px;font-weight:700;' +
        (r.active ? 'background:#d1fae5;color:#065f46' : 'background:var(--gray-100);color:var(--gray-500)') + '">' +
        (r.active ? '● Active' : '○ Inactive') + '</span></td>';
      html += '</tr>';
    });

    html += '</tbody></table></div></div>';

    html += '</div>';
    document.getElementById('main-content').innerHTML = html;

    // Buttons
    var saveBtn = document.getElementById('save-slack-btn');
    var testBtn = document.getElementById('test-slack-btn');
    if (saveBtn) saveBtn.addEventListener('click', function () {
      saveBtn.textContent = '✓ Saved';
      saveBtn.disabled = true;
      setTimeout(function () { saveBtn.textContent = 'Save Configuration'; saveBtn.disabled = false; }, 2000);
    });
    if (testBtn) testBtn.addEventListener('click', function () {
      testBtn.textContent = '📨 Sent!';
      setTimeout(function () { testBtn.textContent = 'Send Test'; }, 2000);
    });
  },

  /* Generate alerts by scanning real agency data */
  _buildAlerts: function () {
    var alerts = [];

    CONFIG.agencies.forEach(function (ag) {
      var raw = U.getAgencyData(ag.id);
      if (!raw || !raw.months || raw.months.length === 0) return;

      var months = raw.months.map(function (m) { return U.enrich(m); });
      var latest = months[months.length - 1];
      var prev   = months.length >= 2 ? months[months.length - 2] : null;
      var be     = U.getBreakEven();

      // ROI below break-even
      if (latest.roi != null && latest.roi < be) {
        alerts.push({
          level: 'critical',
          agency: ag.short,
          title: ag.short + ' ROI Below Break-Even',
          body:  'Latest month ROI is ' + U.fmtX(latest.roi) + ' — below break-even of ' + be.toFixed(2) + 'x at current gross margin.'
        });
      }

      // Performing rate < 25%
      if (latest.perfRate < CONFIG.perfRate.warn) {
        alerts.push({
          level: 'critical',
          agency: ag.short,
          title: ag.short + ' Low Performing Creator Rate',
          body:  U.fmtPct(latest.perfRate) + ' of creators are generating GMV (' + latest.performing + '/' + latest.creators + '). Target ≥ 25%.'
        });
      }

      // Delivery miss
      if (latest.delRate < 0.8) {
        alerts.push({
          level: 'warning',
          agency: ag.short,
          title: ag.short + ' Delivery Miss',
          body:  'Only ' + U.fmtPct(latest.delRate) + ' of target videos delivered (' + latest.delivered + ' of ' + latest.targetVids + ' target).'
        });
      }

      // GMV spike (>2× prev)
      if (prev && latest.gmv > prev.gmv * 2) {
        alerts.push({
          level: 'info',
          agency: ag.short,
          title: ag.short + ' GMV Spike Detected',
          body:  'Latest GMV (' + U.fmt$(latest.gmv) + ') is more than 2× previous month (' + U.fmt$(prev.gmv) + '). Verify for one-time contributors.'
        });
      }

      // GMV drop > 30%
      if (prev && prev.gmv > 0 && latest.gmv < prev.gmv * 0.7) {
        alerts.push({
          level: 'warning',
          agency: ag.short,
          title: ag.short + ' GMV Drop',
          body:  'GMV fell ' + Math.round((1 - latest.gmv / prev.gmv) * 100) + '% from ' + U.fmt$(prev.gmv) + ' to ' + U.fmt$(latest.gmv) + ' this month.'
        });
      }
    });

    return alerts;
  },

  _buildDigestPreview: function () {
    var lines = [];
    var today = new Date();
    var dateStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

    lines.push('<div style="font-family:monospace;font-size:12px;background:#1a1d21;color:#d1d5db;border-radius:8px;padding:16px;line-height:1.8">');
    lines.push('<div style="color:#4ade80;font-weight:700;margin-bottom:6px">🟢 Nusava Creator Intelligence</div>');
    lines.push('<div style="color:#9ca3af">Daily Digest — ' + dateStr + '</div>');
    lines.push('<div style="border-top:1px solid #374151;margin:10px 0"></div>');

    // Agency GMV summaries
    lines.push('<div style="color:#f9fafb;font-weight:700;margin-bottom:4px">📊 Latest Month GMV</div>');
    CONFIG.agencies.forEach(function (ag) {
      var raw = U.getAgencyData(ag.id);
      if (!raw || !raw.months || raw.months.length === 0) return;
      var latest = U.enrich(raw.months[raw.months.length - 1]);
      lines.push('<div>  <span style="color:#9ca3af">' + ag.short.padEnd(12) + '</span> <strong style="color:#f9fafb">' + U.fmt$(latest.gmv) + '</strong> <span style="color:#9ca3af">· ROI ' + U.fmtX(latest.roi) + '</span></div>');
    });

    lines.push('<div style="border-top:1px solid #374151;margin:10px 0"></div>');

    // Alerts
    var alerts = this._buildAlerts();
    if (alerts.length > 0) {
      lines.push('<div style="color:#fbbf24;font-weight:700;margin-bottom:4px">⚠️ ' + alerts.length + ' Alert' + (alerts.length !== 1 ? 's' : '') + '</div>');
      alerts.slice(0, 3).forEach(function (a) {
        var icon = a.level === 'critical' ? '🚨' : '⚠️';
        lines.push('<div>  ' + icon + ' <span style="color:#f9fafb">' + a.title + '</span></div>');
      });
      if (alerts.length > 3) lines.push('<div style="color:#9ca3af">  + ' + (alerts.length - 3) + ' more…</div>');
    } else {
      lines.push('<div style="color:#4ade80">✅ No alerts — all within thresholds</div>');
    }

    lines.push('<div style="border-top:1px solid #374151;margin:10px 0"></div>');
    lines.push('<div style="color:#9ca3af;font-size:11px">Nusava Creator Intelligence · nusava-platform</div>');
    lines.push('</div>');

    return lines.join('\n');
  }
};
