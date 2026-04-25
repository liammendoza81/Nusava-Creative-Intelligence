/* =========================================================
   Nusava — Open & Target Affiliates View
   Tracks organic affiliates: Active, Flagged for Outreach,
   Recruited. Pulls creators from all agency data files plus
   a static open-affiliate list.
   ========================================================= */

window.Views = window.Views || {};

window.Views.affiliates = {

  _filter: 'all',   // 'all' | 'open' | 'target' | 'recruited'
  _search: '',

  /* ── Sample open-affiliate pool (replace with Cruva / TikTok data) ── */
  _openAffiliates: [
    { name: 'Vanessa Lowe',     username: 'vanessafindsit',   status: 'open',      l30gmv: 18420, followers: 124000, niche: 'Wellness',   notes: 'Consistent 3–5 posts/week on health supplements' },
    { name: 'Trevor Moss',      username: 'trevortrysstuff',  status: 'open',      l30gmv: 11840, followers: 87500,  niche: 'Fitness',    notes: 'Crossover audience with Nusava core demo' },
    { name: 'Alicia Tan',       username: 'aliciashoplog',    status: 'target',    l30gmv: 34100, followers: 218000, niche: 'Lifestyle',  notes: 'High-volume shopper content, very conversion-focused' },
    { name: 'Marco Rivera',     username: 'marco.buys',       status: 'target',    l30gmv: 27840, followers: 163000, niche: 'Fitness',    notes: 'Multiple viral supplement videos in L60 days' },
    { name: 'Dana Wei',         username: 'danafinds_',       status: 'open',      l30gmv: 8920,  followers: 52000,  niche: 'Wellness',   notes: 'Nano creator, high engagement rate (~9%)' },
    { name: 'James Portillo',   username: 'jamesshops247',    status: 'recruited', l30gmv: 41200, followers: 290000, niche: 'Health',     notes: 'Joined Creatify M5 — was open affiliate M1–M4' },
    { name: 'Priya Sharma',     username: 'priyasfinds',      status: 'target',    l30gmv: 19340, followers: 141000, niche: 'Wellness',   notes: 'Audience overlap >70% with existing top creators' },
    { name: 'Chad Briggs',      username: 'chadbuysit',       status: 'open',      l30gmv: 6240,  followers: 34800,  niche: 'Lifestyle',  notes: 'New creator — trending upward for 3 months' },
    { name: 'Sofia Reyes',      username: 'sofialiftsmore',   status: 'recruited', l30gmv: 22800, followers: 178000, niche: 'Fitness',    notes: 'Joined THC M3 after organic $15K month' },
    { name: 'Tanya Brooks',     username: 'tanyabuysbeauty',  status: 'open',      l30gmv: 4180,  followers: 29100,  niche: 'Beauty',     notes: 'Adjacent niche, worth monitoring for Q3' },
    { name: 'Kevin Chan',       username: 'kevinchanshops',   status: 'target',    l30gmv: 38600, followers: 247000, niche: 'Health',     notes: 'Declined outreach M4 — retry with better offer' },
    { name: 'Melissa Ford',     username: 'melissafindsmore', status: 'open',      l30gmv: 9810,  followers: 68000,  niche: 'Wellness',   notes: 'Focuses on gut health content — direct fit' }
  ],

  render: function () {
    var self = this;
    var affiliates = this._openAffiliates;

    var counts = { all: affiliates.length, open: 0, target: 0, recruited: 0 };
    affiliates.forEach(function (a) { counts[a.status]++; });

    var totalOpenGMV = affiliates
      .filter(function (a) { return a.status === 'open' || a.status === 'target'; })
      .reduce(function (s, a) { return s + a.l30gmv; }, 0);

    var topTarget = affiliates
      .filter(function (a) { return a.status === 'target'; })
      .sort(function (a, b) { return b.l30gmv - a.l30gmv; })[0];

    var html = '<div class="tab-pane">';

    html += '<div class="page-title"><h1>Open & Target Affiliates</h1>' +
      '<div class="subtitle">Organic affiliates promoting Nusava outside agency contracts — monitor, flag, and recruit top performers.</div></div>';

    // KPI strip
    html += '<div class="kpi-grid">';
    html += kpiCard('Open Affiliates', counts.open, 'Generating GMV organically', 'blue');
    html += kpiCard('Flagged for Outreach', counts.target, 'Prioritised for recruitment', 'orange');
    html += kpiCard('Recruited', counts.recruited, 'Converted to agency roster', 'green');
    html += kpiCard('Combined L30 GMV', U.fmt$(totalOpenGMV), 'Open + target affiliates', 'purple');
    html += kpiCard('Top Target GMV', topTarget ? U.fmt$(topTarget.l30gmv) : '—', topTarget ? '@' + topTarget.username : '', 'orange');
    html += '</div>';

    // Info banner
    html += '<div class="alert-bar"><div class="alert alert-blue"><span class="alert-icon">ℹ️</span>' +
      '<div><strong>Data Source:</strong> Connect Cruva API or paste a TikTok Shop open-affiliate export into ' +
      '<code>js/views/affiliates.js → _openAffiliates</code> to populate live data. ' +
      'Sample records shown below.</div></div></div>';

    // Filter chips
    html += '<div class="filter-chips" style="margin-bottom:16px">';
    ['all','open','target','recruited'].forEach(function (f) {
      var labels = { all: 'All (' + counts.all + ')', open: 'Open (' + counts.open + ')', target: '⭐ Target (' + counts.target + ')', recruited: '✓ Recruited (' + counts.recruited + ')' };
      html += '<button class="filter-chip ' + (self._filter === f ? 'active' : '') + '" data-filter="' + f + '">' + labels[f] + '</button>';
    });
    html += '</div>';

    // Search + export row
    html += '<div class="flex-between mb-16">';
    html += '<div class="search-wrap"><span class="search-icon">🔍</span>' +
      '<input type="text" class="search-bar" id="aff-search" placeholder="Search by name or @username…" value="' + self._search + '"></div>';
    html += '<button class="btn btn-outline" id="aff-export-btn">⬇ Export CSV</button>';
    html += '</div>';

    // Table
    html += '<div class="table-card"><div class="table-scroll"><table class="data-table" id="aff-table">';
    html += '<thead><tr><th>Creator</th><th>Username</th><th>Status</th><th>Niche</th><th>Followers</th><th>L30 GMV</th><th>Notes</th><th>Action</th></tr></thead>';
    html += '<tbody id="aff-tbody">' + this._renderRows(affiliates, self._filter, self._search) + '</tbody>';
    html += '</table></div></div>';

    html += '</div>';
    document.getElementById('main-content').innerHTML = html;

    // Bind filter chips
    document.querySelectorAll('.filter-chip[data-filter]').forEach(function (chip) {
      chip.addEventListener('click', function () {
        self._filter = chip.getAttribute('data-filter');
        document.querySelectorAll('.filter-chip[data-filter]').forEach(function (c) {
          c.classList.toggle('active', c.getAttribute('data-filter') === self._filter);
        });
        var tbody = document.getElementById('aff-tbody');
        if (tbody) tbody.innerHTML = self._renderRows(affiliates, self._filter, self._search);
      });
    });

    // Bind search
    var searchEl = document.getElementById('aff-search');
    if (searchEl) {
      searchEl.addEventListener('input', function () {
        self._search = this.value.toLowerCase();
        var tbody = document.getElementById('aff-tbody');
        if (tbody) tbody.innerHTML = self._renderRows(affiliates, self._filter, self._search);
      });
    }

    // Export CSV
    var exportBtn = document.getElementById('aff-export-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', function () {
        var rows = [['Creator', 'Username', 'Status', 'Niche', 'Followers', 'L30 GMV', 'Notes']];
        affiliates.forEach(function (a) {
          rows.push([a.name, '@' + a.username, a.status, a.niche, a.followers, a.l30gmv.toFixed(2), '"' + a.notes.replace(/"/g, '""') + '"']);
        });
        var csv = rows.map(function (r) { return r.join(','); }).join('\n');
        var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a'); a.href = url; a.download = 'nusava-affiliates.csv';
        document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
      });
    }

    // Flag-for-outreach buttons
    document.querySelectorAll('.flag-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var idx = parseInt(btn.getAttribute('data-idx'));
        if (affiliates[idx].status === 'open') {
          affiliates[idx].status = 'target';
          btn.closest('tr').querySelector('.status-cell').innerHTML = statusBadge('target');
          btn.textContent = '✓ Flagged';
          btn.disabled = true;
        }
      });
    });
  },

  _renderRows: function (affiliates, filter, search) {
    var filtered = affiliates.filter(function (a, i) {
      a._idx = i;
      var matchFilter = filter === 'all' || a.status === filter;
      var matchSearch = !search || a.name.toLowerCase().includes(search) || a.username.toLowerCase().includes(search);
      return matchFilter && matchSearch;
    });

    if (filtered.length === 0) {
      return '<tr><td colspan="8" style="text-align:center;padding:32px;color:var(--gray-400)">No affiliates match this filter.</td></tr>';
    }

    return filtered.sort(function (a, b) { return b.l30gmv - a.l30gmv; }).map(function (a) {
      var actionBtn = a.status === 'open'
        ? '<button class="btn btn-outline flag-btn" data-idx="' + a._idx + '" style="padding:4px 10px;font-size:11px">⭐ Flag</button>'
        : a.status === 'target'
        ? '<button class="btn btn-ghost" style="padding:4px 10px;font-size:11px;cursor:default" disabled>Reach Out ↗</button>'
        : '<span class="text-muted" style="font-size:11px">✓ In Agency</span>';

      return '<tr>' +
        '<td><strong>' + a.name + '</strong></td>' +
        '<td class="text-muted">@' + a.username + '</td>' +
        '<td class="status-cell">' + statusBadge(a.status) + '</td>' +
        '<td>' + a.niche + '</td>' +
        '<td>' + Number(a.followers).toLocaleString() + '</td>' +
        '<td><strong>' + U.fmt$(a.l30gmv) + '</strong></td>' +
        '<td style="max-width:240px;white-space:normal;font-size:12px;color:var(--gray-500)">' + a.notes + '</td>' +
        '<td>' + actionBtn + '</td>' +
        '</tr>';
    }).join('');
  }
};

function statusBadge(status) {
  var map = {
    open:      '<span class="badge pending">Open</span>',
    target:    '<span style="display:inline-block;padding:3px 10px;border-radius:5px;font-size:11px;font-weight:700;background:#fff7ed;color:#c2410c;border:1px solid #fdba74">⭐ Target</span>',
    recruited: '<span class="badge advance">Recruited</span>'
  };
  return map[status] || status;
}
