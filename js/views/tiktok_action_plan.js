// Action Plan view — bi-weekly review summary.
// SKUs grouped into PO-action buckets with quantitative recommendations.
// Designed to be printable for the bi-weekly action meeting.
(function () {
  var u = window.Utils;

  var BUCKET_META = {
    URGENT_ACTION: {
      label: 'URGENT — act this week',
      color: 'var(--danger)',
      bg: 'var(--danger-bg)',
      sortPriority: 0,
    },
    RATIONALIZE: {
      label: 'RATIONALIZE — line/pricing decision',
      color: 'var(--danger)',
      bg: 'var(--danger-bg)',
      sortPriority: 1,
      description: 'Structurally CM-negative + persistent excess. Decide: raise price, cut discount, or discontinue.',
    },
    MARKDOWN: {
      label: 'MARKDOWN — sell down severe excess',
      color: 'var(--warn)',
      bg: 'var(--warn-bg)',
      sortPriority: 2,
      description: 'DOH ≥ 180 days. Run a 10-15% promo to clear excess over 4 weeks.',
    },
    PUSH_BACK_PO: {
      label: 'PUSH BACK PO — excess inventory',
      color: 'var(--warn)',
      bg: 'var(--warn-bg)',
      sortPriority: 3,
      description: 'DOH > 90d. Delay next PO 4-8 weeks; reduce reorder qty.',
    },
    PULL_FORWARD_PO: {
      label: 'PULL FORWARD PO — low cover',
      color: 'var(--primary-dark)',
      bg: 'var(--primary-bg)',
      sortPriority: 4,
      description: 'DOH < 30d on stable/growing demand. Accelerate next PO; coordinate 3PL transit.',
    },
    HOLD: {
      label: 'HOLD — no action this cycle',
      color: 'var(--success)',
      bg: 'var(--success-bg)',
      sortPriority: 5,
      description: 'In-policy band (30-90 DOH) with stable demand.',
    },
    MONITOR: {
      label: 'MONITOR — watch list',
      color: 'var(--info)',
      bg: 'var(--info-bg)',
      sortPriority: 6,
      description: 'Mixed signal or missing data. Confirm one more week before acting.',
    },
  };

  function render(root, data) {
    var ap = data.action_plan;
    if (!ap || !ap.available) {
      root.innerHTML = '<div class="empty-state"><h3>Action plan unavailable</h3>'
        + '<p>Re-run <code>/weekly-tiktok-dashboard</code>.</p></div>';
      return;
    }

    root.innerHTML = '';
    root.appendChild(u.el('h2', { class: 'section-title' }, 'Bi-weekly Action Plan'));
    root.appendChild(u.el('p', { class: 'section-sub' },
      'SKUs grouped by recommended PO action. Use this view in the bi-weekly action meeting. '
      + 'Generated ' + new Date(data.meta.generated_at).toLocaleString() + '.'));

    // ===== KPI strip =====
    var grid = u.el('div', { class: 'stat-grid' });
    var counts = {};
    Object.keys(ap.bucket_totals || {}).forEach(function (b) { counts[b] = ap.bucket_totals[b].count; });
    grid.appendChild(makeStat('Urgent alerts',
      String(ap.urgent_alerts.length),
      ap.urgent_alerts.length ? 'Act this week' : 'No urgent action'));
    grid.appendChild(makeStat('SKUs needing PO action',
      String((counts.PUSH_BACK_PO || 0) + (counts.PULL_FORWARD_PO || 0) + (counts.MARKDOWN || 0)),
      'Push-back + pull-forward + markdown'));
    grid.appendChild(makeStat('Excess inventory value',
      u.fmtCurrency(ap.total_excess_value),
      u.fmtNumber(ap.total_excess_units) + ' units above 90-day target (at COGS)'));
    grid.appendChild(makeStat('SKUs healthy',
      String((counts.HOLD || 0)),
      'In-policy 30-90 DOH band'));
    root.appendChild(grid);

    // ===== Urgent alerts (full detail, in case user lands here from anchor) =====
    if (ap.urgent_alerts && ap.urgent_alerts.length) {
      var urgentCard = u.el('div', { class: 'card' });
      urgentCard.innerHTML = '<div class="card-header"><h3 class="card-title" style="color:var(--danger)">'
        + 'Urgent alerts (' + ap.urgent_alerts.length + ')</h3>'
        + '<p class="card-sub">Real-time triggers — these need action this week, not at the bi-weekly review.</p></div>'
        + buildUrgentList(ap.urgent_alerts);
      root.appendChild(urgentCard);
    }

    // ===== Per-bucket sections =====
    var bucketsInOrder = ['RATIONALIZE', 'MARKDOWN', 'PUSH_BACK_PO', 'PULL_FORWARD_PO', 'HOLD', 'MONITOR'];
    bucketsInOrder.forEach(function (bucket) {
      var items = (ap.items || []).filter(function (it) { return it.bucket === bucket; });
      if (!items.length) return;
      var meta = BUCKET_META[bucket] || {};
      var totals = (ap.bucket_totals || {})[bucket] || {};

      var card = u.el('div', { class: 'card' });
      card.innerHTML = '<div class="card-header" style="border-left:4px solid ' + (meta.color || '#999') + '; padding-left:12px">'
        + '<div><h3 class="card-title">' + u.escapeHtml(meta.label || bucket) + ' '
        + '<span style="color:var(--text-muted); font-weight:400; font-size:13px">· '
        + items.length + ' SKU' + (items.length === 1 ? '' : 's')
        + (totals.excess_value ? ' · ' + u.fmtCurrency(totals.excess_value) + ' excess' : '')
        + '</span></h3>'
        + '<p class="card-sub">' + u.escapeHtml(meta.description || '') + '</p></div>'
        + '</div>'
        + buildBucketTable(items, bucket);
      root.appendChild(card);
    });

    // ===== Print hint =====
    var printHint = u.el('div', { class: 'card', style: 'background:#f9fafb; text-align:center; padding:14px; color:var(--text-muted); font-size:13px;' });
    printHint.innerHTML = 'Tip: Cmd+P to print this view as a PDF for the bi-weekly action meeting.';
    root.appendChild(printHint);
  }

  function makeStat(label, value, sub) {
    var d = u.el('div', { class: 'stat' });
    d.innerHTML = '<div class="stat-label">' + u.escapeHtml(label) + '</div>'
      + '<div class="stat-value">' + value + '</div>'
      + '<div class="stat-sub">' + (sub == null ? '' : u.escapeHtml(sub)) + '</div>';
    return d;
  }

  function buildUrgentList(alerts) {
    var html = '<div>';
    alerts.forEach(function (a) {
      html += '<div class="risk-row" style="grid-template-columns: auto 1fr;">'
        + '<span class="sev sev-high">' + u.escapeHtml(a.severity) + '</span>'
        + '<div class="risk-text">'
        + '<strong>' + u.escapeHtml(a.headline) + '</strong>'
        + '<div style="margin-top:4px">' + u.escapeHtml(a.detail) + '</div>'
        + '<div class="risk-action" style="margin-top:6px; color:var(--danger); font-weight:500">→ ' + u.escapeHtml(a.action) + '</div>'
        + '</div></div>';
    });
    html += '</div>';
    return html;
  }

  function buildBucketTable(items, bucket) {
    var showExcess = (bucket === 'PUSH_BACK_PO' || bucket === 'MARKDOWN' || bucket === 'RATIONALIZE');
    var html = '<div class="tbl-wrap"><table class="tbl numeric-cell">'
      + '<thead><tr>'
      + '<th class="left">SKU</th>'
      + '<th class="left">MAIN SKU</th>'
      + '<th>Stock</th>'
      + '<th>Velocity (u/wk)</th>'
      + '<th>Current DOH</th>'
      + (showExcess ? '<th>Excess units</th><th>Excess $ (COGS)</th>' : '')
      + '<th>CM/unit</th>'
      + '<th class="left">Rationale</th>'
      + '<th class="left">Recommended action</th>'
      + '</tr></thead><tbody>';
    items.forEach(function (it) {
      html += '<tr><td class="left"><strong>' + u.escapeHtml(it.sku_label) + '</strong></td>'
        + '<td class="left" style="font-family:monospace; font-size:11px">' + u.escapeHtml(it.main_sku || '—') + '</td>'
        + '<td>' + (it.stock_units != null ? u.fmtNumber(it.stock_units) : '—') + '</td>'
        + '<td>' + u.fmtNumber(it.weekly_velocity_units, { decimals: 0 }) + '</td>'
        + '<td>' + (it.current_doh != null ? Math.round(it.current_doh) : '—') + '</td>';
      if (showExcess) {
        html += '<td>' + (it.excess_units ? u.fmtNumber(it.excess_units) : '—') + '</td>'
          + '<td>' + (it.excess_value ? u.fmtCurrency(it.excess_value) : '—') + '</td>';
      }
      html += '<td>' + (it.cm_per_unit != null ? u.fmtCurrency(it.cm_per_unit, { decimals: 2 }) : '—') + '</td>'
        + '<td class="left" style="font-size:12px; max-width:280px; white-space:normal">' + u.escapeHtml(it.rationale) + '</td>'
        + '<td class="left" style="font-size:12px; max-width:340px; white-space:normal">' + u.escapeHtml(it.recommended_action) + '</td>'
        + '</tr>';
    });
    html += '</tbody></table></div>';
    return html;
  }

  window.Views = window.Views || {};
  window.Views.tiktok_action_plan = { render: render };
})();
