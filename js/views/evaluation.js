/* =========================================================
   Nusava — Evaluation View (standalone, called from agency.js)
   Implements the creator evaluation logic & card rendering.
   ========================================================= */

window.Views = window.Views || {};

window.Views.evaluation = {

  /* Current filter state */
  _filter: 'all',

  render: function (agencyId, container) {
    var rules   = CONFIG.evaluation;
    var raw     = U.getAgencyData(agencyId);
    var agCfg   = U.getAgencyConfig(agencyId);

    if (!raw || !raw.creatorEvaluation || raw.creatorEvaluation.length === 0) {
      container.innerHTML = '<div class="placeholder-card"><div class="ph-icon">📋</div><h3>No Evaluation Data</h3><p>Add creator data to <code>data/' + agencyId + '.js</code> → <code>creatorEvaluation</code> array.</p></div>';
      return;
    }

    // Run evaluation algorithm on each creator
    var results = raw.creatorEvaluation.map(function (creator) {
      var evalResult = U.evaluateCreator(creator);
      return Object.assign({}, creator, { eval: evalResult });
    });

    // Sort: ADVANCE first, then REVIEW, then DROP; within each group, by score desc
    var order = { ADVANCE: 0, REVIEW: 1, DROP: 2 };
    results.sort(function (a, b) {
      if (order[a.eval.status] !== order[b.eval.status]) return order[a.eval.status] - order[b.eval.status];
      return b.eval.score - a.eval.score;
    });

    var counts = { ADVANCE: 0, REVIEW: 0, DROP: 0 };
    results.forEach(function (r) { counts[r.eval.status]++; });

    var self = this;
    self._filter = self._filter || 'all';

    // Build HTML
    var html = '';

    // Rules block
    html += '<div class="eval-rules">';
    html += '<strong>Evaluation Rules:</strong> ≥' + rules.minVideos + ' shoppable videos this month ';
    html += 'AND ($' + rules.minGMV_monthly.toLocaleString() + '+ GMV this month ';
    html += 'OR $' + rules.minGMV_rolling3m.toLocaleString() + '+ GMV in last 3 months combined)';
    html += '</div>';

    // Summary counts
    html += '<div class="eval-summary">';
    html += '<div class="eval-count all"   data-filter="all"     style="cursor:pointer">All <strong>' + results.length + '</strong></div>';
    html += '<div class="eval-count advance" data-filter="ADVANCE" style="cursor:pointer">✓ Advance <strong>' + counts.ADVANCE + '</strong></div>';
    html += '<div class="eval-count review"  data-filter="REVIEW"  style="cursor:pointer">⟳ Review <strong>' + counts.REVIEW  + '</strong></div>';
    html += '<div class="eval-count drop"    data-filter="DROP"    style="cursor:pointer">✕ Drop <strong>' + counts.DROP    + '</strong></div>';
    html += '</div>';

    // Filter chips
    html += '<div class="filter-chips">';
    html += '<button class="filter-chip ' + (self._filter === 'all'     ? 'active' : '') + '" data-filter="all">All</button>';
    html += '<button class="filter-chip advance ' + (self._filter === 'ADVANCE' ? 'active' : '') + '" data-filter="ADVANCE">Advance</button>';
    html += '<button class="filter-chip review '  + (self._filter === 'REVIEW'  ? 'active' : '') + '" data-filter="REVIEW">Review</button>';
    html += '<button class="filter-chip drop '    + (self._filter === 'DROP'    ? 'active' : '') + '" data-filter="DROP">Drop</button>';
    html += '</div>';

    // Export button
    html += '<div class="flex-between mb-16">';
    html += '<span class="text-sm text-muted">' + results.length + ' creators evaluated · Latest month</span>';
    html += '<button class="btn btn-outline" id="eval-export-btn">⬇ Export CSV</button>';
    html += '</div>';

    // Creator cards
    html += '<div class="eval-grid" id="eval-cards-grid">';
    html += this._renderCards(results, self._filter);
    html += '</div>';

    container.innerHTML = html;

    // Event listeners
    var grid = document.getElementById('eval-cards-grid');
    var exportBtn = document.getElementById('eval-export-btn');

    // Filter clicks
    container.querySelectorAll('[data-filter]').forEach(function (el) {
      el.addEventListener('click', function () {
        var f = el.getAttribute('data-filter');
        self._filter = f;
        // Update active states on chips
        container.querySelectorAll('.filter-chip').forEach(function (chip) {
          chip.classList.toggle('active', chip.getAttribute('data-filter') === f);
        });
        if (grid) grid.innerHTML = self._renderCards(results, f);
      });
    });

    // Export CSV
    if (exportBtn) {
      exportBtn.addEventListener('click', function () {
        self._exportCSV(results, agCfg.short);
      });
    }
  },

  _renderCards: function (results, filter) {
    var rules = CONFIG.evaluation;
    var visible = filter === 'all'
      ? results
      : results.filter(function (r) { return r.eval.status === filter; });

    if (visible.length === 0) {
      return '<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon">🔍</div><h3>No creators match this filter</h3></div>';
    }

    return visible.map(function (r) {
      var ev = r.eval;
      var statusLower = ev.status.toLowerCase();
      var rolling = (r.gmv_current || 0) + (r.gmv_prev1 || 0) + (r.gmv_prev2 || 0);

      var meetsVideos  = (r.videos_current || 0) >= rules.minVideos;
      var meetsGMVNow  = (r.gmv_current  || 0) >= rules.minGMV_monthly;
      var meetsRolling = rolling >= rules.minGMV_rolling3m;

      var checkV  = meetsVideos  ? '<span class="check-icon pass">✓</span>' : '<span class="check-icon fail">✗</span>';
      var checkGM = meetsGMVNow  ? '<span class="check-icon pass">✓</span>' : '<span class="check-icon fail">✗</span>';
      var checkR  = meetsRolling ? '<span class="check-icon pass">✓</span>' : '<span class="check-icon fail">✗</span>';

      var html = '<div class="eval-card ' + ev.status + '">';
      html += '<div class="eval-card-header">';
      html += '<div><div class="eval-creator-name">' + (r.name || r.username) + '</div><div class="eval-creator-handle">@' + r.username + '</div></div>';
      html += '<span class="badge ' + statusLower + '">' + ev.status + '</span>';
      html += '</div>';

      html += '<div class="eval-metrics">';
      html += '<div class="eval-metric-row"><span class="eval-metric-label">Videos (need ≥' + rules.minVideos + ')</span><span class="eval-metric-value">' + checkV + ' ' + (r.videos_current || 0) + '</span></div>';
      html += '<div class="eval-metric-row"><span class="eval-metric-label">GMV this month (≥$' + rules.minGMV_monthly + ')</span><span class="eval-metric-value">' + checkGM + ' ' + U.fmt$(r.gmv_current || 0) + '</span></div>';
      html += '<div class="eval-metric-row"><span class="eval-metric-label">Rolling 3-month (≥$' + rules.minGMV_rolling3m + ')</span><span class="eval-metric-value">' + checkR + ' ' + U.fmt$(rolling) + '</span></div>';
      html += '</div>';

      html += '<div class="eval-reason">' + ev.reasons.join(' · ') + '</div>';
      html += '</div>';
      return html;
    }).join('');
  },

  _exportCSV: function (results, agencyName) {
    var rules = CONFIG.evaluation;
    var rows = [
      ['Creator Name', 'Username', 'Status', 'Score', 'Videos (M)', 'GMV (M)', 'GMV (M-1)', 'GMV (M-2)', 'Rolling 3M GMV', 'Meets Videos', 'Meets GMV Monthly', 'Meets GMV Rolling', 'Reasons']
    ];

    results.forEach(function (r) {
      var rolling = (r.gmv_current || 0) + (r.gmv_prev1 || 0) + (r.gmv_prev2 || 0);
      rows.push([
        r.name || r.username,
        r.username,
        r.eval.status,
        r.eval.score,
        r.videos_current || 0,
        (r.gmv_current  || 0).toFixed(2),
        (r.gmv_prev1    || 0).toFixed(2),
        (r.gmv_prev2    || 0).toFixed(2),
        rolling.toFixed(2),
        (r.videos_current || 0) >= rules.minVideos ? 'YES' : 'NO',
        (r.gmv_current  || 0) >= rules.minGMV_monthly   ? 'YES' : 'NO',
        rolling >= rules.minGMV_rolling3m ? 'YES' : 'NO',
        '"' + r.eval.reasons.join('; ').replace(/"/g, '""') + '"'
      ]);
    });

    var csv = rows.map(function (row) { return row.join(','); }).join('\n');
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    var url  = URL.createObjectURL(blob);
    var a    = document.createElement('a');
    a.href     = url;
    a.download = (agencyName || 'agency') + '-creator-evaluation.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
};
