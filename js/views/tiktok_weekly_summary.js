// Weekly Summary view — KPI strip + 8-week table + GMV/Ad-spend trend chart.
(function () {
  var u = window.Utils;

  function render(root, data) {
    var ws = data.weekly_summary;
    var meta = data.meta;
    var lastRow = ws.rows[ws.rows.length - 1];

    root.innerHTML = '';

    // Section title
    root.appendChild(u.el('h2', { class: 'section-title' }, 'Weekly Summary'));
    root.appendChild(u.el('p', { class: 'section-sub' },
      'Headline metrics for the most recent reporting week + the trailing 8-week trend. '
      + (meta.is_partial_week ? '⚠ Latest week is a ' + meta.days_in_week + '-day window — WoW comparisons partly reflect day-count.' : '')
    ));

    // KPI strip — last week's headline numbers
    var statGrid = u.el('div', { class: 'stat-grid' });
    statGrid.appendChild(makeStat('Total GMV', u.fmtCurrency(lastRow.total_gmv), wowSub(lastRow.total_gmv_wow)));
    statGrid.appendChild(makeStat('Ad Spend',  u.fmtCurrency(lastRow.ad_spend),  wowSub(lastRow.ad_spend_wow, true)));
    statGrid.appendChild(makeStat('ROI',       u.fmtMultiplier(lastRow.roi),     '8-wk avg ' + u.fmtMultiplier(ws.totals.avg_weekly_roi)));
    statGrid.appendChild(makeStat('CPO',       u.fmtCurrency(lastRow.cpo, { decimals: 2 }), wowSub(lastRow.cpo_wow, true)));
    statGrid.appendChild(makeStat('Orders',    u.fmtNumber(lastRow.total_orders), wowSub(lastRow.total_orders_wow)));
    statGrid.appendChild(makeStat('Units',     u.fmtNumber(lastRow.units_sold),   wowSub(lastRow.units_sold_wow)));
    statGrid.appendChild(makeStat('DSR',       u.fmtNumber(lastRow.dsr, { decimals: 1 }) + ' u/d', wowSub(lastRow.dsr_wow)));
    root.appendChild(statGrid);

    // GMV + Ad spend trend chart
    var chartCard = u.el('div', { class: 'card' });
    chartCard.innerHTML = '<div class="card-header"><div><h3 class="card-title">GMV &amp; Ad Spend trend</h3>'
      + '<p class="card-sub">8 weekly periods · ⚡ = partial-week / campaign · ★ = decay anchor</p></div></div>'
      + '<div class="chart-wrap" id="ws-chart"><canvas id="ws-chart-canvas"></canvas></div>';
    root.appendChild(chartCard);

    // 8-week summary table
    var tblCard = u.el('div', { class: 'card' });
    tblCard.innerHTML = '<div class="card-header"><h3 class="card-title">All 8 weeks</h3></div>'
      + buildSummaryTable(ws);
    root.appendChild(tblCard);

    // Render chart after the canvas is in the DOM
    requestAnimationFrame(function () { renderTrendChart(ws); });
  }

  function makeStat(label, value, sub) {
    var d = u.el('div', { class: 'stat' });
    d.innerHTML = '<div class="stat-label">' + label + '</div>'
      + '<div class="stat-value">' + value + '</div>'
      + '<div class="stat-sub">' + (sub == null ? '' : sub) + '</div>';
    return d;
  }

  function wowSub(v, inverted) {
    if (v === null || v === undefined) return 'WoW —';
    return 'WoW ' + (inverted ? u.wowCellInverted(v) : u.wowCell(v));
  }

  function buildSummaryTable(ws) {
    var rows = ws.rows;
    var html = '<div class="tbl-wrap"><table class="tbl numeric-cell"><thead>'
      + '<tr><th class="left">Week</th><th class="left">Date Range</th><th class="center">Days</th>'
      + '<th>Total GMV</th><th>WoW%</th>'
      + '<th>Ad Spend</th><th>WoW%</th>'
      + '<th>ROI</th>'
      + '<th>CPO</th><th>WoW%</th>'
      + '<th>Orders</th><th>WoW%</th>'
      + '<th>Units</th><th>WoW%</th>'
      + '<th>DSR</th><th>WoW%</th>'
      + '</tr></thead><tbody>';

    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      html += '<tr>'
        + '<td class="left"><strong>' + u.escapeHtml(r.week) + '</strong></td>'
        + '<td class="left">' + u.escapeHtml(r.date_range) + '</td>'
        + '<td class="center">' + r.days + '</td>'
        + '<td>' + u.fmtCurrency(r.total_gmv) + '</td>'
        + '<td>' + u.wowCell(r.total_gmv_wow) + '</td>'
        + '<td>' + u.fmtCurrency(r.ad_spend) + '</td>'
        + '<td>' + u.wowCell(r.ad_spend_wow) + '</td>'
        + '<td>' + u.fmtMultiplier(r.roi) + '</td>'
        + '<td>' + u.fmtCurrency(r.cpo, { decimals: 2 }) + '</td>'
        + '<td>' + u.wowCellInverted(r.cpo_wow) + '</td>'
        + '<td>' + u.fmtNumber(r.total_orders) + '</td>'
        + '<td>' + u.wowCell(r.total_orders_wow) + '</td>'
        + '<td>' + u.fmtNumber(r.units_sold) + '</td>'
        + '<td>' + u.wowCell(r.units_sold_wow) + '</td>'
        + '<td>' + u.fmtNumber(r.dsr, { decimals: 1 }) + '</td>'
        + '<td>' + u.wowCell(r.dsr_wow) + '</td>'
        + '</tr>';
    }

    var avg = ws.avg_wow;
    html += '<tr class="subtotal"><td class="left" colspan="3"><em>Avg WoW% (W2–W' + rows.length + ')</em></td>'
      + '<td></td><td>' + u.wowCell(avg.total_gmv_wow) + '</td>'
      + '<td></td><td>' + u.wowCell(avg.ad_spend_wow) + '</td>'
      + '<td></td>'
      + '<td></td><td>' + u.wowCellInverted(avg.cpo_wow) + '</td>'
      + '<td></td><td>' + u.wowCell(avg.total_orders_wow) + '</td>'
      + '<td></td><td>' + u.wowCell(avg.units_sold_wow) + '</td>'
      + '<td></td><td>' + u.wowCell(avg.dsr_wow) + '</td>'
      + '</tr>';

    var t = ws.totals;
    html += '<tr class="grand-total"><td class="left" colspan="3">8-wk totals</td>'
      + '<td>' + u.fmtCurrency(t.total_gmv_8wk) + '</td><td>—</td>'
      + '<td>' + u.fmtCurrency(t.total_ad_spend_8wk) + '</td><td>—</td>'
      + '<td>' + u.fmtMultiplier(t.avg_weekly_roi) + '</td>'
      + '<td>' + u.fmtCurrency(t.blended_cpo_8wk, { decimals: 2 }) + '</td><td>—</td>'
      + '<td colspan="8"><em style="font-weight:400">Peak '+ u.fmtCurrency(t.peak_weekly_gmv) +' · Trough '+ u.fmtCurrency(t.trough_weekly_gmv) +' · W1→W6 decay '+ u.wowCell(t.wow_decay_w1_to_w6) +'</em></td>'
      + '</tr>';

    html += '</tbody></table></div>';
    return html;
  }

  function renderTrendChart(ws) {
    var canvas = document.getElementById('ws-chart-canvas');
    if (!canvas || !window.Chart) return;
    var rows = ws.rows;
    var labels = rows.map(function (r) { return r.week; });
    new Chart(canvas, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            type: 'bar',
            label: 'GMV',
            data: rows.map(function (r) { return r.total_gmv; }),
            backgroundColor: 'rgba(2, 132, 199, 0.85)',
            yAxisID: 'y',
            borderRadius: 4,
          },
          {
            type: 'bar',
            label: 'Ad Spend',
            data: rows.map(function (r) { return r.ad_spend; }),
            backgroundColor: 'rgba(99, 102, 241, 0.65)',
            yAxisID: 'y',
            borderRadius: 4,
          },
          {
            type: 'line',
            label: 'ROI',
            data: rows.map(function (r) { return r.roi; }),
            borderColor: 'rgba(220, 38, 38, 0.9)',
            backgroundColor: 'rgba(220, 38, 38, 0.1)',
            yAxisID: 'y2',
            tension: 0.25,
            pointRadius: 4,
            borderWidth: 2,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        scales: {
          y:  { beginAtZero: true, position: 'left',
                ticks: { callback: function (v) { return window.Utils.fmtCurrencyCompact(v); } } },
          y2: { beginAtZero: true, position: 'right', grid: { drawOnChartArea: false },
                ticks: { callback: function (v) { return v.toFixed(1) + 'x'; } } },
        },
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, padding: 14 } },
          tooltip: {
            callbacks: {
              label: function (ctx) {
                var v = ctx.parsed.y;
                if (ctx.dataset.label === 'ROI') return ctx.dataset.label + ': ' + v.toFixed(2) + 'x';
                return ctx.dataset.label + ': ' + window.Utils.fmtCurrency(v);
              }
            }
          }
        }
      }
    });
  }

  window.Views = window.Views || {};
  window.Views.tiktok_weekly_summary = { render: render };
})();
