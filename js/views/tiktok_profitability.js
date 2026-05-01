// Profitability view — weekly CM trend + ROAS sensitivity + per-product table.
(function () {
  var u = window.Utils;

  function render(root, data) {
    var p = data.profitability;
    if (!p || !p.available) {
      root.innerHTML = '<div class="empty-state"><h3>Profitability data not available</h3>'
        + '<p>The local Profitability Calculator was not found or could not be parsed. '
        + 'Re-run <code>/weekly-tiktok-dashboard</code> after confirming the file exists.</p></div>';
      return;
    }

    root.innerHTML = '';
    root.appendChild(u.el('h2', { class: 'section-title' }, 'Profitability'));
    root.appendChild(u.el('p', { class: 'section-sub' },
      'Contribution margin per week (B12 + D3K2 — covers the 95% of GMV with unit-economics data). '
      + 'Bundles + B12 1PK aren\'t in the calculator and are excluded from these numbers.'));

    // KPI strip — latest week's CM + ROAS callout
    var lastWk = p.weekly_totals[p.weekly_totals.length - 1];
    var grid = u.el('div', { class: 'stat-grid' });
    grid.appendChild(makeStat('Latest GMV', u.fmtCurrency(lastWk.gmv), lastWk.week));
    grid.appendChild(makeStat('CM excl. ads', u.fmtCurrency(lastWk.cm_excl_ads),
      'Net revenue minus variable costs (excl. ad spend)'));
    grid.appendChild(makeStat('Allocated ad spend', u.fmtCurrency(lastWk.ad_spend),
      'Ad spend allocated to covered SKUs'));
    grid.appendChild(makeStat('CM after ads',
      coloredCurrency(lastWk.cm_after_ads),
      lastWk.cm_after_ads >= 0 ? 'Positive' : 'Negative — channel burning cash'));
    grid.appendChild(makeStat('CM after retainer',
      coloredCurrency(lastWk.cm_after_retainer),
      'Net of weekly retainer fixed costs'));
    root.appendChild(grid);

    // === Subscription block (NEW) ===
    var sub = p.subscription_block;
    if (sub && sub.available) {
      var subCard = u.el('div', { class: 'card' });
      subCard.innerHTML = '<div class="card-header"><h3 class="card-title">Subscription mix &mdash; recurring revenue uplift</h3>'
        + '<p class="card-sub">'
        + '<strong>' + u.fmtNumber(sub.active_subscriptions_latest) + '</strong> active subscriptions; '
        + '<strong>' + u.fmtPct(sub.recurring_share) + '</strong> of weekly subscription transactions are recurring (2nd+ purchase) — '
        + 'these orders skip ad spend and affiliate commission, dramatically improving CM per unit.'
        + '</p></div>'
        + buildSubscriptionTable(sub)
        + buildWeeklyUpliftTable(sub);
      // Insert immediately after the KPI strip
      root.appendChild(subCard);
    }

    // Weekly trend chart
    var trendCard = u.el('div', { class: 'card' });
    trendCard.innerHTML = '<div class="card-header"><h3 class="card-title">Weekly profit trajectory</h3>'
      + '<p class="card-sub">CM excl. ads (gross profit before ad spend) vs CM after ads vs CM after retainer.</p></div>'
      + '<div class="chart-wrap tall"><canvas id="profit-trend-canvas"></canvas></div>';
    root.appendChild(trendCard);

    // Per-product per-week heatmap-style table
    var prodCard = u.el('div', { class: 'card' });
    prodCard.innerHTML = '<div class="card-header"><h3 class="card-title">CM after ads — per product, per week</h3>'
      + '<p class="card-sub">Negative cells indicate the product is burning cash that week. '
      + 'D3K2 has been negative every week since W5 (1x-ROAS regime).</p></div>'
      + buildProductTable(p);
    root.appendChild(prodCard);

    // ROAS sensitivity
    var roasCard = u.el('div', { class: 'card' });
    roasCard.innerHTML = '<div class="card-header"><h3 class="card-title">ROAS sensitivity — CM per unit</h3>'
      + '<p class="card-sub">At the same volume, how does contribution margin per unit change as ROAS changes? '
      + 'Reference ROAS values are from the calculator. Negative cells = cash-burning per unit at that ROAS.</p></div>'
      + buildRoasTable(p);
    root.appendChild(roasCard);

    // Unit economics reference
    var ueCard = u.el('div', { class: 'card' });
    ueCard.innerHTML = '<div class="card-header"><h3 class="card-title">Unit economics reference</h3></div>'
      + buildUnitEconTable(p);
    root.appendChild(ueCard);

    requestAnimationFrame(function () { renderTrendChart(p); });
  }

  function makeStat(label, value, sub) {
    var d = u.el('div', { class: 'stat' });
    d.innerHTML = '<div class="stat-label">' + label + '</div>'
      + '<div class="stat-value">' + value + '</div>'
      + '<div class="stat-sub">' + (sub == null ? '' : sub) + '</div>';
    return d;
  }

  function coloredCurrency(v) {
    var color = v >= 0 ? 'var(--success)' : 'var(--danger)';
    return '<span style="color:' + color + '">' + u.fmtCurrency(v) + '</span>';
  }

  function buildProductTable(p) {
    var weeks = p.weekly_totals.map(function (w) { return w.week; });
    // Group by_product_week into product -> {week: cm_after_ads}
    var byProd = {};
    p.by_product_week.forEach(function (r) {
      (byProd[r.product] = byProd[r.product] || {})[r.week] = r;
    });

    var html = '<div class="tbl-wrap"><table class="tbl numeric-cell"><thead><tr>'
      + '<th class="left">Product</th>';
    weeks.forEach(function (w) { html += '<th>' + u.escapeHtml(w) + '</th>'; });
    html += '<th>Total</th></tr></thead><tbody>';

    Object.keys(byProd).sort().forEach(function (prod) {
      var rowTotal = 0;
      html += '<tr><td class="left"><strong>' + u.escapeHtml(prod) + '</strong></td>';
      weeks.forEach(function (w) {
        var r = byProd[prod][w];
        var v = r ? r.cm_after_ads : 0;
        rowTotal += v;
        var cls = v < 0 ? 'cell-danger-bg' : (v > 0 ? 'cell-success-bg' : '');
        html += '<td class="' + cls + '">' + (v === 0 ? '—' : u.fmtCurrency(v)) + '</td>';
      });
      html += '<td><strong>' + (rowTotal === 0 ? '—' : u.fmtCurrency(rowTotal)) + '</strong></td></tr>';
    });

    // Grand total row
    var grandTotal = 0;
    html += '<tr class="grand-total"><td class="left">GRAND TOTAL (covered SKUs)</td>';
    weeks.forEach(function (w) {
      var t = p.weekly_totals.find(function (wk) { return wk.week === w; });
      var v = t ? t.cm_after_ads : 0;
      grandTotal += v;
      html += '<td>' + u.fmtCurrency(v) + '</td>';
    });
    html += '<td>' + u.fmtCurrency(grandTotal) + '</td></tr>';

    html += '</tbody></table></div>';
    return html;
  }

  function buildRoasTable(p) {
    var html = '<div class="tbl-wrap"><table class="tbl numeric-cell"><thead><tr>'
      + '<th class="left">Product</th>'
      + '<th>Ref. ROAS</th>'
      + '<th>Ref. CM/unit</th>';
    p.roas_scenarios.forEach(function (r) { html += '<th>' + r.toFixed(1) + 'x</th>'; });
    html += '</tr></thead><tbody>';

    p.roas_sensitivity.forEach(function (s) {
      html += '<tr><td class="left"><strong>' + u.escapeHtml(s.product) + '</strong></td>'
        + '<td>' + s.reference_roas.toFixed(2) + 'x</td>'
        + '<td>' + u.fmtCurrency(s.reference_cm_per_unit, { decimals: 2 }) + '</td>';
      p.roas_scenarios.forEach(function (r) {
        var v = s.by_roas[r.toFixed(1)];
        if (v === undefined) v = s.by_roas[String(r)];
        if (v === undefined) v = s.by_roas[r];
        var cls = v < 0 ? 'cell-danger-bg' : (v > 0 ? 'cell-success-bg' : '');
        html += '<td class="' + cls + '">' + u.fmtCurrency(v, { decimals: 2 }) + '</td>';
      });
      html += '</tr>';
    });
    html += '</tbody></table></div>';
    return html;
  }

  function buildSubscriptionTable(sub) {
    var html = '<div class="tbl-wrap"><table class="tbl numeric-cell"><thead><tr>'
      + '<th class="left">Family</th>'
      + '<th>Sub share (last 3wk avg)</th>'
      + '<th>CM/unit first-time</th>'
      + '<th>CM/unit recurring</th>'
      + '<th>Uplift/unit (recurring vs first)</th>'
      + '<th>Blended CM/unit</th>'
      + '</tr></thead><tbody>';
    sub.family_rows.forEach(function (f) {
      html += '<tr><td class="left"><strong>' + u.escapeHtml(f.family) + '</strong></td>'
        + '<td>' + u.fmtPct(f.subscription_share) + '</td>'
        + '<td>' + u.fmtCurrency(f.cm_first_time_per_unit, { decimals: 2 }) + '</td>'
        + '<td><strong>' + u.fmtCurrency(f.cm_recurring_per_unit, { decimals: 2 }) + '</strong></td>'
        + '<td><span class="wow-pos">+' + u.fmtCurrency(f.uplift_per_unit, { decimals: 2 }) + '</span></td>'
        + '<td>' + u.fmtCurrency(f.blended_cm_per_unit, { decimals: 2 }) + '</td>'
        + '</tr>';
    });
    html += '</tbody></table></div>';
    return html;
  }

  function buildWeeklyUpliftTable(sub) {
    if (!sub.weekly_uplift || !sub.weekly_uplift.length) return '';
    var totalUplift = sub.weekly_uplift.reduce(function (acc, w) { return acc + w.uplift; }, 0);
    var html = '<p style="margin: 14px 0 6px; font-size:13px; color:var(--text-muted)">'
      + '<strong>CM uplift from recurring subscriptions, by week</strong> &mdash; total over 8 weeks: '
      + '<span class="wow-pos">+' + u.fmtCurrency(totalUplift) + '</span>'
      + '</p>'
      + '<div class="tbl-wrap"><table class="tbl numeric-cell"><thead><tr>';
    sub.weekly_uplift.forEach(function (w) { html += '<th>' + u.escapeHtml(w.week) + '</th>'; });
    html += '</tr></thead><tbody><tr>';
    sub.weekly_uplift.forEach(function (w) {
      html += '<td><span class="wow-pos">+' + u.fmtCurrency(w.uplift) + '</span></td>';
    });
    html += '</tr></tbody></table></div>';
    return html;
  }

  function buildUnitEconTable(p) {
    var html = '<div class="tbl-wrap"><table class="tbl numeric-cell"><thead><tr>'
      + '<th class="left">Product</th>'
      + '<th>Sale price</th>'
      + '<th>Discount</th>'
      + '<th>Net revenue/unit</th>'
      + '<th>COGS/unit</th>'
      + '<th>CM/unit excl. ads</th>'
      + '<th>CM/unit @ ref ROAS</th>'
      + '<th>CM%</th>'
      + '<th>Ref ROAS</th>'
      + '<th>Weekly retainer</th>'
      + '</tr></thead><tbody>';
    p.unit_economics.forEach(function (e) {
      html += '<tr><td class="left"><strong>' + u.escapeHtml(e.product) + '</strong></td>'
        + '<td>' + u.fmtCurrency(e.sale_price, { decimals: 2 }) + '</td>'
        + '<td>' + u.fmtPct(e.discount_pct) + '</td>'
        + '<td>' + u.fmtCurrency(e.net_revenue, { decimals: 2 }) + '</td>'
        + '<td>' + u.fmtCurrency(e.cogs, { decimals: 2 }) + '</td>'
        + '<td>' + u.fmtCurrency(e.cm_excluding_ads, { decimals: 2 }) + '</td>'
        + '<td>' + u.fmtCurrency(e.cm_at_ref_roas, { decimals: 2 }) + '</td>'
        + '<td>' + u.fmtPct(e.cm_pct_at_ref_roas) + '</td>'
        + '<td>' + e.reference_roas.toFixed(2) + 'x</td>'
        + '<td>' + u.fmtCurrency(e.weekly_retainer) + '/wk</td>'
        + '</tr>';
    });
    html += '</tbody></table></div>';
    return html;
  }

  function renderTrendChart(p) {
    var canvas = document.getElementById('profit-trend-canvas');
    if (!canvas || !window.Chart) return;
    var labels = p.weekly_totals.map(function (w) { return w.week; });

    new Chart(canvas, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'CM excl. ads',
            data: p.weekly_totals.map(function (w) { return w.cm_excl_ads; }),
            borderColor: '#0284c7',
            backgroundColor: 'rgba(2, 132, 199, 0.1)',
            tension: 0.25, pointRadius: 4, borderWidth: 2.5,
          },
          {
            label: 'CM after ads',
            data: p.weekly_totals.map(function (w) { return w.cm_after_ads; }),
            borderColor: '#16a34a',
            backgroundColor: 'rgba(22, 163, 74, 0.1)',
            tension: 0.25, pointRadius: 4, borderWidth: 2.5,
          },
          {
            label: 'CM after retainer',
            data: p.weekly_totals.map(function (w) { return w.cm_after_retainer; }),
            borderColor: '#dc2626',
            backgroundColor: 'rgba(220, 38, 38, 0.15)',
            tension: 0.25, pointRadius: 4, borderWidth: 2.5,
            borderDash: [4, 4],
          }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        scales: {
          y: { ticks: { callback: function (v) { return window.Utils.fmtCurrencyCompact(v); } } }
        },
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, padding: 14 } },
          tooltip: {
            callbacks: { label: function (ctx) {
              return ctx.dataset.label + ': ' + window.Utils.fmtCurrency(ctx.parsed.y);
            } }
          },
          annotation: {
            annotations: {
              zeroLine: {
                type: 'line', yMin: 0, yMax: 0,
                borderColor: '#9ca3af', borderWidth: 1, borderDash: [2, 2],
              }
            }
          }
        }
      }
    });
  }

  window.Views = window.Views || {};
  window.Views.tiktok_profitability = { render: render };
})();
