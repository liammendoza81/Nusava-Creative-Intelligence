// Insights view — leadership narrative + structured risks + movers callouts.
(function () {
  var u = window.Utils;

  function sevClass(sev) {
    var s = (sev || '').toLowerCase();
    if (s === 'high')   return 'sev-high';
    if (s === 'medium') return 'sev-medium';
    if (s === 'low')    return 'sev-low';
    return '';
  }

  function render(root, data) {
    var ins = data.insights;
    var meta = data.meta;
    root.innerHTML = '';
    root.appendChild(u.el('h2', { class: 'section-title' }, 'Executive Insights'));
    root.appendChild(u.el('p', { class: 'section-sub' },
      'Generated ' + new Date(meta.generated_at).toLocaleString()
      + (meta.is_partial_week ? ' · ' + meta.days_in_week + '-day reporting window' : '')));

    // === Action Required alerts (from action_plan) — top priority ===
    var ap = data.action_plan;
    if (ap && ap.available && ap.urgent_alerts && ap.urgent_alerts.length) {
      var alertsCard = u.el('div', { class: 'callout danger' });
      var html = '<p style="margin:0 0 8px"><strong>Action required this week — ' + ap.urgent_alerts.length
        + ' urgent alert' + (ap.urgent_alerts.length === 1 ? '' : 's') + '</strong></p>'
        + '<ul style="margin:4px 0 0; padding-left:22px; line-height:1.55;">';
      ap.urgent_alerts.forEach(function (a) {
        html += '<li><strong>' + u.escapeHtml(a.headline) + '</strong> — ' + u.escapeHtml(a.detail)
          + '<br><em style="font-size:12px; color:#7f1d1d">→ ' + u.escapeHtml(a.action) + '</em></li>';
      });
      html += '</ul>'
        + '<p style="margin:10px 0 0; font-size:12px;"><a href="#action_plan" style="color:#7f1d1d; font-weight:600">'
        + 'View full bi-weekly action plan →</a></p>';
      alertsCard.innerHTML = html;
      root.appendChild(alertsCard);
    }

    // Partial-week banner
    if (meta.is_partial_week) {
      var banner = u.el('div', { class: 'callout warn' });
      banner.innerHTML = '<p><strong>Partial-week caveat.</strong> The latest reporting window is '
        + meta.days_in_week + ' days. Headline WoW comparisons partly reflect day-count and any campaign push, not pure baseline demand.</p>';
      root.appendChild(banner);
    }

    // Top movers strip
    var moversCard = u.el('div', { class: 'card' });
    moversCard.innerHTML = '<div class="card-header"><h3 class="card-title">Top WoW movers (this week)</h3></div>'
      + buildMovers(ins);
    root.appendChild(moversCard);

    // Narrative sections
    var sectionDefs = [
      { key: 'what_happened',         label: 'What happened',        warn: false },
      { key: 'why_it_matters',        label: 'Why it matters',       warn: false },
      { key: 'risks',                 label: 'Risks',                warn: true  },
      { key: 'recommended_actions',   label: 'Recommended actions',  warn: false },
      { key: 'forecast_outlook',      label: 'Forecast outlook',     warn: false },
      { key: 'q2_scenario_position',  label: 'Q2 scenario position', warn: false },
      { key: 'inventory_action_needed', label: 'Inventory action needed', warn: true },
    ];
    sectionDefs.forEach(function (def) {
      var body = ins.sections[def.key];
      if (!body) return;
      var card = u.el('div', { class: 'insight-section' + (def.warn ? ' warn' : '') });
      card.innerHTML = '<h3>' + u.escapeHtml(def.label) + '</h3>' + u.mdToHtml(body);
      root.appendChild(card);
    });

    // Structured inventory risks (independent of narrative)
    if (ins.inventory_risks && ins.inventory_risks.length) {
      var risksCard = u.el('div', { class: 'card' });
      risksCard.innerHTML = '<div class="card-header"><h3 class="card-title">Inventory risks ('
        + ins.inventory_risks.length + ')</h3>'
        + '<p class="card-sub">Sorted by severity. HIGH ones are cashflow-protection priority.</p></div>'
        + buildRisks(ins.inventory_risks);
      root.appendChild(risksCard);
    }

    // Anomalies (compact)
    if (ins.anomaly_summary && ins.anomaly_summary.length) {
      var anomCard = u.el('div', { class: 'card' });
      anomCard.innerHTML = '<div class="card-header"><h3 class="card-title">Detected anomalies (deduped per SKU+week)</h3></div>'
        + '<ul style="margin:0; padding-left:22px; line-height:1.6;">'
        + ins.anomaly_summary.map(function (a) {
          return '<li>' + u.escapeHtml(a) + '</li>';
        }).join('') + '</ul>';
      root.appendChild(anomCard);
    }
  }

  function buildMovers(ins) {
    function row(m, dir) {
      var cls = dir === 'up' ? 'wow-pos' : 'wow-neg';
      var arrow = dir === 'up' ? '▲' : '▼';
      return '<tr><td class="left">' + arrow + ' ' + u.escapeHtml(m.label) + '</td>'
        + '<td>' + u.fmtCurrency(m.prev_gmv) + '</td>'
        + '<td>' + u.fmtCurrency(m.curr_gmv) + '</td>'
        + '<td><span class="' + cls + '">' + u.fmtPct(m.wow_pct) + '</span></td>'
        + '<td><span class="' + cls + '">' + (m.abs_delta >= 0 ? '+' : '') + u.fmtCurrency(m.abs_delta) + '</span></td>'
        + '</tr>';
    }
    var html = '<div class="tbl-wrap"><table class="tbl numeric-cell">'
      + '<thead><tr><th class="left">SKU</th><th>Prev</th><th>Curr</th><th>WoW%</th><th>Δ</th></tr></thead><tbody>';
    (ins.sku_top_movers_up || []).slice(0, 5).forEach(function (m) { html += row(m, 'up'); });
    if ((ins.sku_top_movers_up || []).length && (ins.sku_top_movers_down || []).length) {
      html += '<tr class="divider"><td colspan="5"></td></tr>';
    }
    (ins.sku_top_movers_down || []).slice(0, 5).forEach(function (m) { html += row(m, 'down'); });
    html += '</tbody></table></div>';
    return html;
  }

  function buildRisks(risks) {
    var html = '<div>';
    risks.forEach(function (r) {
      html += '<div class="risk-row">'
        + '<span class="sev ' + sevClass(r.severity) + '">' + u.escapeHtml(r.severity) + '</span>'
        + '<div class="risk-text">'
        + '<strong>' + u.escapeHtml(r.flag) + '</strong> · ' + u.escapeHtml(r.sku_label || '')
        + '<div>' + u.escapeHtml(r.detail || '') + '</div>'
        + '<div class="risk-action">→ ' + u.escapeHtml(r.action || '') + '</div>'
        + '</div>'
        + '<span></span>'
        + '</div>';
    });
    html += '</div>';
    return html;
  }

  window.Views = window.Views || {};
  window.Views.tiktok_insights = { render: render };
})();
