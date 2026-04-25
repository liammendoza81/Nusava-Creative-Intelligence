/* =========================================================
   Nusava — Creator Search & Vetting View
   Search across ALL creators on all agency rosters.
   Filters: agency, eval status, GMV range, niche, keyword.
   ========================================================= */

window.Views = window.Views || {};

window.Views.search = {

  _query:      '',
  _agFilter:   'all',
  _statusFilter: 'all',
  _gmvMin:     0,
  _gmvMax:     Infinity,
  _sortBy:     'gmv',

  /* Build a flat master list from all agency creatorEvaluation arrays */
  _buildMasterList: function () {
    var list = [];
    CONFIG.agencies.forEach(function (ag) {
      var raw = U.getAgencyData(ag.id);
      if (!raw) return;

      // Evaluation records
      if (raw.creatorEvaluation && raw.creatorEvaluation.length) {
        raw.creatorEvaluation.forEach(function (cr) {
          var ev = U.evaluateCreator(cr);
          var rolling = (cr.gmv_current || 0) + (cr.gmv_prev1 || 0) + (cr.gmv_prev2 || 0);
          list.push({
            name:        cr.name || cr.username,
            username:    cr.username,
            agency:      ag.id,
            agencyName:  ag.short,
            agencyColor: ag.color,
            status:      ev.status,
            gmv_current: cr.gmv_current || 0,
            gmv_rolling: rolling,
            videos:      cr.videos_current || 0,
            score:       ev.score,
            reasons:     ev.reasons
          });
        });
      }
    });
    return list;
  },

  render: function () {
    var self = this;
    var master = this._buildMasterList();

    // Aggregate counts
    var counts = { all: master.length, ADVANCE: 0, REVIEW: 0, DROP: 0 };
    master.forEach(function (c) { if (counts[c.status] != null) counts[c.status]++; });
    var totalGMV = master.reduce(function (s, c) { return s + c.gmv_current; }, 0);
    var topCreator = master.slice().sort(function (a, b) { return b.gmv_current - a.gmv_current; })[0];

    var html = '<div class="tab-pane">';

    html += '<div class="page-title"><h1>Creator Search & Vetting</h1>' +
      '<div class="subtitle">Search and filter across all ' + master.length + ' creators on every agency roster.</div></div>';

    // KPIs
    html += '<div class="kpi-grid">';
    html += kpiCard('Total Creators', master.length, 'Across all agencies', 'blue');
    html += kpiCard('Advance', counts.ADVANCE, 'Meeting all thresholds', 'green');
    html += kpiCard('Review', counts.REVIEW, 'Partially qualifying', 'yellow');
    html += kpiCard('Drop', counts.DROP, 'Below thresholds', 'red');
    html += kpiCard('Top Creator GMV', topCreator ? U.fmt$(topCreator.gmv_current) : '—', topCreator ? '@' + topCreator.username : '', 'orange');
    html += kpiCard('Combined GMV (Latest)', U.fmt$(totalGMV), 'All active creators', 'purple');
    html += '</div>';

    // Search bar + filters
    html += '<div style="background:var(--white);border-radius:var(--radius);box-shadow:var(--shadow);padding:16px 20px;margin-bottom:20px">';

    // Keyword search
    html += '<div style="display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end">';
    html += '<div style="flex:1;min-width:200px"><label style="font-size:11px;font-weight:600;color:var(--gray-500);text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:5px">Search</label>' +
      '<div class="search-wrap" style="max-width:100%"><span class="search-icon">🔍</span>' +
      '<input type="text" class="search-bar" id="cs-query" placeholder="Name or @username…" value="' + self._query + '" style="width:100%"></div></div>';

    // Agency filter
    html += '<div><label style="font-size:11px;font-weight:600;color:var(--gray-500);text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:5px">Agency</label>' +
      '<select id="cs-agency" class="month-select">' +
      '<option value="all">All Agencies</option>';
    CONFIG.agencies.forEach(function (ag) {
      html += '<option value="' + ag.id + '"' + (self._agFilter === ag.id ? ' selected' : '') + '>' + ag.short + '</option>';
    });
    html += '</select></div>';

    // Status filter
    html += '<div><label style="font-size:11px;font-weight:600;color:var(--gray-500);text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:5px">Eval Status</label>' +
      '<select id="cs-status" class="month-select">' +
      '<option value="all"' + (self._statusFilter === 'all' ? ' selected' : '') + '>All Statuses</option>' +
      '<option value="ADVANCE"' + (self._statusFilter === 'ADVANCE' ? ' selected' : '') + '>Advance</option>' +
      '<option value="REVIEW"' + (self._statusFilter === 'REVIEW' ? ' selected' : '') + '>Review</option>' +
      '<option value="DROP"' + (self._statusFilter === 'DROP' ? ' selected' : '') + '>Drop</option>' +
      '</select></div>';

    // Min GMV filter
    html += '<div><label style="font-size:11px;font-weight:600;color:var(--gray-500);text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:5px">Min GMV (Latest Month)</label>' +
      '<select id="cs-gmvmin" class="month-select">' +
      ['0','100','500','1000','5000','10000'].map(function (v) {
        return '<option value="' + v + '"' + (String(self._gmvMin) === v ? ' selected' : '') + '>' + (v === '0' ? 'Any' : '$' + Number(v).toLocaleString() + '+') + '</option>';
      }).join('') + '</select></div>';

    // Sort
    html += '<div><label style="font-size:11px;font-weight:600;color:var(--gray-500);text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:5px">Sort By</label>' +
      '<select id="cs-sort" class="month-select">' +
      '<option value="gmv"' + (self._sortBy === 'gmv' ? ' selected' : '') + '>GMV (Latest)</option>' +
      '<option value="rolling"' + (self._sortBy === 'rolling' ? ' selected' : '') + '>Rolling 3M GMV</option>' +
      '<option value="videos"' + (self._sortBy === 'videos' ? ' selected' : '') + '>Video Count</option>' +
      '<option value="score"' + (self._sortBy === 'score' ? ' selected' : '') + '>Eval Score</option>' +
      '</select></div>';

    html += '</div>'; // flex row
    html += '</div>'; // filter card

    // Results
    html += '<div id="cs-results">' + this._renderResults(master) + '</div>';

    html += '</div>';
    document.getElementById('main-content').innerHTML = html;

    // Wire up all filters
    var self2 = this;
    function refresh() {
      self2._query        = (document.getElementById('cs-query')  || {}).value || '';
      self2._agFilter     = (document.getElementById('cs-agency') || {}).value || 'all';
      self2._statusFilter = (document.getElementById('cs-status') || {}).value || 'all';
      self2._gmvMin       = parseInt((document.getElementById('cs-gmvmin') || {}).value || '0', 10);
      self2._sortBy       = (document.getElementById('cs-sort')   || {}).value || 'gmv';
      var el = document.getElementById('cs-results');
      if (el) el.innerHTML = self2._renderResults(master);
    }

    ['cs-query','cs-agency','cs-status','cs-gmvmin','cs-sort'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener(id === 'cs-query' ? 'input' : 'change', refresh);
    });
  },

  _renderResults: function (master) {
    var self = this;
    var q    = (self._query || '').toLowerCase();

    var filtered = master.filter(function (c) {
      if (q && !c.name.toLowerCase().includes(q) && !c.username.toLowerCase().includes(q)) return false;
      if (self._agFilter !== 'all' && c.agency !== self._agFilter) return false;
      if (self._statusFilter !== 'all' && c.status !== self._statusFilter) return false;
      if (c.gmv_current < (self._gmvMin || 0)) return false;
      return true;
    });

    var sortKey = { gmv: 'gmv_current', rolling: 'gmv_rolling', videos: 'videos', score: 'score' }[self._sortBy] || 'gmv_current';
    filtered.sort(function (a, b) { return b[sortKey] - a[sortKey]; });

    var html = '<div class="flex-between mb-16">';
    html += '<span class="text-sm text-muted">' + filtered.length + ' creator' + (filtered.length !== 1 ? 's' : '') + ' found</span>';
    html += '<button class="btn btn-outline" id="cs-export-btn">⬇ Export CSV</button>';
    html += '</div>';

    if (filtered.length === 0) {
      return html + '<div class="empty-state"><div class="empty-state-icon">🔍</div><h3>No creators match</h3><p>Try adjusting your filters.</p></div>';
    }

    html += '<div class="table-card"><div class="table-scroll"><table class="data-table">';
    html += '<thead><tr><th>#</th><th>Creator</th><th>Agency</th><th>Status</th>' +
      '<th>Videos</th><th>GMV (Latest)</th><th>Rolling 3M</th><th>Score</th><th>Reason</th></tr></thead><tbody>';

    filtered.forEach(function (c, i) {
      var statusLower = c.status.toLowerCase();
      var badgeCls = statusLower === 'advance' ? 'advance' : statusLower === 'review' ? 'review' : 'drop';

      html += '<tr>';
      html += '<td style="color:var(--gray-400);font-size:12px">' + (i + 1) + '</td>';
      html += '<td><strong>' + c.name + '</strong><div style="font-size:11px;color:var(--gray-400)">@' + c.username + '</div></td>';
      html += '<td><span style="display:inline-flex;align-items:center;gap:5px">' +
        '<span style="width:8px;height:8px;border-radius:50%;background:' + c.agencyColor + ';flex-shrink:0"></span>' +
        c.agencyName + '</span></td>';
      html += '<td><span class="badge ' + badgeCls + '">' + c.status + '</span></td>';
      html += '<td>' + c.videos + '</td>';
      html += '<td><strong>' + U.fmt$(c.gmv_current) + '</strong></td>';
      html += '<td>' + U.fmt$(c.gmv_rolling) + '</td>';
      html += '<td><span style="display:inline-block;width:32px;height:32px;border-radius:50%;background:var(--gray-100);text-align:center;line-height:32px;font-size:11px;font-weight:700">' + c.score + '</span></td>';
      html += '<td style="max-width:200px;white-space:normal;font-size:11px;color:var(--gray-500)">' + (c.reasons[0] || '—') + '</td>';
      html += '</tr>';
    });

    html += '</tbody></table></div></div>';

    // Re-wire export after DOM update
    setTimeout(function () {
      var btn = document.getElementById('cs-export-btn');
      if (btn) btn.addEventListener('click', function () {
        var rows = [['#','Creator','Username','Agency','Status','Videos','GMV Latest','Rolling 3M','Score']];
        filtered.forEach(function (c, i) {
          rows.push([i+1, c.name, '@'+c.username, c.agencyName, c.status, c.videos,
            c.gmv_current.toFixed(2), c.gmv_rolling.toFixed(2), c.score]);
        });
        var csv = rows.map(function (r) { return r.join(','); }).join('\n');
        var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a'); a.href = url; a.download = 'nusava-creator-search.csv';
        document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
      });
    }, 60);

    return html;
  }
};
