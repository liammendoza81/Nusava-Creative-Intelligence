// SKU Breakdown view — flavor-level table + concentration pie + family bars.
(function () {
  var u = window.Utils;

  function render(root, data) {
    var sb = data.sku_breakdown;
    root.innerHTML = '';
    root.appendChild(u.el('h2', { class: 'section-title' }, 'SKU Breakdown'));
    root.appendChild(u.el('p', { class: 'section-sub' },
      sb.rows.length + ' active SKU rows across ' + sb.weeks.length
      + ' weeks. Subtotal rows include parent-listing rows that TikTok exports as un-flavored ("(unattributed)").'));

    // Side-by-side: pie of family share + bar of flavor share within top family
    var twoCol = u.el('div', { class: 'row-2col' });
    var pieCard = u.el('div', { class: 'card' });
    pieCard.innerHTML = '<div class="card-header"><h3 class="card-title">Family share of GMV (8-wk)</h3></div>'
      + '<div class="chart-wrap"><canvas id="sku-pie-canvas"></canvas></div>';
    var barCard = u.el('div', { class: 'card' });
    barCard.innerHTML = '<div class="card-header"><h3 class="card-title">Top 10 flavor variants (8-wk total GMV)</h3></div>'
      + '<div class="chart-wrap"><canvas id="sku-top-canvas"></canvas></div>';
    twoCol.appendChild(pieCard);
    twoCol.appendChild(barCard);
    root.appendChild(twoCol);

    // Full SKU table
    var tblCard = u.el('div', { class: 'card' });
    tblCard.innerHTML = '<div class="card-header"><h3 class="card-title">Per-SKU performance — '
      + sb.weeks.length + ' weeks · GMV / WoW% / DSR</h3></div>' + buildSkuTable(sb);
    root.appendChild(tblCard);

    requestAnimationFrame(function () {
      renderPie(sb);
      renderTopBar(sb);
    });
  }

  function buildSkuTable(sb) {
    var weeks = sb.weeks;
    var html = '<div class="tbl-wrap"><table class="tbl numeric-cell">';
    // Two-row header
    html += '<thead class="two-row"><tr class="group">'
      + '<th rowspan="2" class="left">Product</th>'
      + '<th rowspan="2" class="left">Flavor</th>'
      + '<th rowspan="2">Total GMV</th>'
      + '<th rowspan="2">% Share</th>';
    for (var w = 0; w < weeks.length; w++) {
      html += '<th colspan="3">' + u.escapeHtml(weeks[w]) + '</th>';
    }
    html += '<th rowspan="2">Avg WoW%<br>W2–W' + weeks.length + '</th>';
    html += '</tr><tr>';
    for (var w2 = 0; w2 < weeks.length; w2++) {
      html += '<th>GMV</th><th>WoW%</th><th>DSR</th>';
    }
    html += '</tr></thead><tbody>';

    // Group SKU rows by product family, with subtotal row after each family
    var byFamily = {};
    sb.rows.forEach(function (r) { (byFamily[r.product] = byFamily[r.product] || []).push(r); });
    var familyOrder = sb.family_totals.map(function (f) {
      return (f.product || '').replace(/^\s*◆\s*/, '').replace(/\s+TOTAL\s*$/, '');
    });
    // Fallback: alphabetical if family_totals empty
    if (!familyOrder.length) familyOrder = Object.keys(byFamily);

    var familyTotalByName = {};
    sb.family_totals.forEach(function (f) {
      var name = (f.product || '').replace(/^\s*◆\s*/, '').replace(/\s+TOTAL\s*$/, '');
      familyTotalByName[name] = f;
    });

    familyOrder.forEach(function (fam, idx) {
      var rows = byFamily[fam] || [];
      // SKU rows
      rows.forEach(function (r) {
        html += '<tr><td class="left">' + u.escapeHtml(r.product) + '</td>'
          + '<td class="left">' + u.escapeHtml(r.flavor || '') + '</td>'
          + '<td>' + u.fmtCurrency(r.total_gmv) + '</td>'
          + '<td>' + u.fmtPct(r.share, { decimals: 2 }) + '</td>';
        r.weekly.forEach(function (w) {
          html += '<td>' + u.fmtCurrency(w.gmv) + '</td>'
            + '<td>' + u.wowCell(w.wow) + '</td>'
            + '<td>' + u.fmtNumber(w.dsr, { decimals: 1 }) + '</td>';
        });
        html += '<td>' + u.wowCell(r.avg_wow_w2_wn) + '</td></tr>';
      });

      // Family TOTAL row
      var ft = familyTotalByName[fam];
      if (ft) {
        html += '<tr class="subtotal"><td class="left" colspan="2">' + u.escapeHtml(ft.product) + '</td>'
          + '<td>' + u.fmtCurrency(ft.total_gmv) + '</td>'
          + '<td>' + u.fmtPct(ft.share, { decimals: 2 }) + '</td>';
        ft.weekly.forEach(function (w) {
          html += '<td>' + u.fmtCurrency(w.gmv) + '</td>'
            + '<td>' + u.wowCell(w.wow) + '</td>'
            + '<td>' + u.fmtNumber(w.dsr, { decimals: 1 }) + '</td>';
        });
        html += '<td>' + u.wowCell(ft.avg_wow_w2_wn) + '</td></tr>';
      }
      // Spacer row between families (visual breathing room)
      if (idx < familyOrder.length - 1) {
        html += '<tr class="divider"><td colspan="' + (4 + weeks.length * 3 + 1) + '"></td></tr>';
      }
    });

    // Grand total
    var gt = sb.grand_total;
    html += '<tr class="grand-total"><td class="left" colspan="2">' + u.escapeHtml(gt.product) + '</td>'
      + '<td>' + u.fmtCurrency(gt.total_gmv) + '</td>'
      + '<td>' + u.fmtPct(gt.share, { decimals: 1 }) + '</td>';
    gt.weekly.forEach(function (w) {
      html += '<td>' + u.fmtCurrency(w.gmv) + '</td>'
        + '<td>' + u.wowCell(w.wow) + '</td>'
        + '<td>' + u.fmtNumber(w.dsr, { decimals: 1 }) + '</td>';
    });
    html += '<td>' + u.wowCell(gt.avg_wow_w2_wn) + '</td></tr>';

    html += '</tbody></table></div>';
    return html;
  }

  function renderPie(sb) {
    var canvas = document.getElementById('sku-pie-canvas');
    if (!canvas || !window.Chart) return;
    var fts = sb.family_totals.slice().sort(function (a, b) { return b.total_gmv - a.total_gmv; });
    new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: fts.map(function (f) {
          return (f.product || '').replace(/^\s*◆\s*/, '').replace(/\s+TOTAL\s*$/, '');
        }),
        datasets: [{
          data: fts.map(function (f) { return f.total_gmv; }),
          backgroundColor: ['#0284c7', '#6366f1', '#16a34a', '#d97706', '#dc2626', '#7c3aed', '#0891b2'],
          borderColor: '#ffffff',
          borderWidth: 2,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right', labels: { boxWidth: 12, padding: 10 } },
          tooltip: {
            callbacks: {
              label: function (ctx) {
                var total = ctx.dataset.data.reduce(function (a, b) { return a + b; }, 0);
                var pct = total ? (ctx.parsed / total) : 0;
                return ctx.label + ': ' + window.Utils.fmtCurrency(ctx.parsed) + ' (' + window.Utils.fmtPct(pct) + ')';
              }
            }
          }
        }
      }
    });
  }

  function renderTopBar(sb) {
    var canvas = document.getElementById('sku-top-canvas');
    if (!canvas || !window.Chart) return;
    var top = sb.rows.slice().sort(function (a, b) { return b.total_gmv - a.total_gmv; }).slice(0, 10);
    new Chart(canvas, {
      type: 'bar',
      data: {
        labels: top.map(function (r) {
          var f = r.flavor || '(unattributed)';
          return r.product + ' / ' + f;
        }),
        datasets: [{
          data: top.map(function (r) { return r.total_gmv; }),
          backgroundColor: 'rgba(2, 132, 199, 0.85)',
          borderRadius: 4,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        scales: {
          x: { ticks: { callback: function (v) { return window.Utils.fmtCurrencyCompact(v); } } }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: { label: function (ctx) { return window.Utils.fmtCurrency(ctx.parsed.x); } }
          }
        }
      }
    });
  }

  window.Views = window.Views || {};
  window.Views.tiktok_sku_breakdown = { render: render };
})();
