/* =========================================================
   Nusava — Narrative Intelligence View
   Classifies creator content into repeatable narrative
   families. Each family shows avg GMV/video, volume, and
   a Winning / Waning / Has Potential momentum tag.

   DATA SOURCE: Populate _narratives[] from a TikTok Shop
   video-level export enriched with narrative tags.
   Cruva API integration point: CONFIG.CRUVA_API_KEY.
   ========================================================= */

window.Views = window.Views || {};

window.Views.narrative = {

  _filter: 'all',   // 'all' | 'winning' | 'waning' | 'potential'

  /* ── Narrative families (replace with live video export data) ── */
  _narratives: [
    {
      id: 'before-after',
      name: 'Before / After',
      description: 'Creator shows visible transformation after using Nusava. High emotional hook.',
      momentum: 'winning',
      videos: 248,
      avg_gmv_video: 312.40,
      total_gmv: 77475,
      trend: [180, 220, 270, 290, 310, 340],
      topCreator: 'didi_finds',
      topCreatorGMV: 28400,
      tags: ['transformation', 'results', 'proof'],
      notes: 'Strongest converter. Works especially well with weight/energy claims.'
    },
    {
      id: 'taste-test',
      name: 'Taste Test / Reaction',
      description: 'Creator tries product on camera — emphasises flavour or texture surprise.',
      momentum: 'winning',
      videos: 194,
      avg_gmv_video: 284.20,
      total_gmv: 55135,
      trend: [200, 240, 260, 280, 290, 300],
      topCreator: 'arrayofthreads',
      topCreatorGMV: 19800,
      tags: ['unboxing', 'first-impression', 'flavour'],
      notes: 'High share rate. Works well when creator is genuinely surprised.'
    },
    {
      id: 'routine',
      name: 'Daily Routine / Stack',
      description: 'Creator shows Nusava as part of morning/workout/evening routine.',
      momentum: 'winning',
      videos: 182,
      avg_gmv_video: 265.80,
      total_gmv: 48375,
      trend: [220, 235, 250, 260, 265, 270],
      topCreator: 'grant.easten',
      topCreatorGMV: 22100,
      tags: ['lifestyle', 'routine', 'stack'],
      notes: 'Best for retention buyers. Drives repeat purchase.'
    },
    {
      id: 'comparison',
      name: 'Comparison / Why I Switched',
      description: 'Creator compares Nusava to a competitor and explains why they prefer it.',
      momentum: 'potential',
      videos: 67,
      avg_gmv_video: 198.40,
      total_gmv: 13293,
      trend: [80, 110, 140, 160, 175, 195],
      topCreator: 'kokoterashop',
      topCreatorGMV: 8200,
      tags: ['comparison', 'switch', 'competitor'],
      notes: 'Fast-growing narrative. Needs careful compliance check on claims.'
    },
    {
      id: 'tutorial',
      name: 'How to Use / Tutorial',
      description: 'Step-by-step demo on mixing, dosing, or combining products.',
      momentum: 'potential',
      videos: 89,
      avg_gmv_video: 144.60,
      total_gmv: 12869,
      trend: [120, 130, 140, 145, 142, 148],
      topCreator: 'niknak2188',
      topCreatorGMV: 5400,
      tags: ['tutorial', 'how-to', 'education'],
      notes: 'Lower conversion than emotional content but strong in re-engagement.'
    },
    {
      id: 'haul',
      name: 'Haul / Multi-Product',
      description: 'Creator shows multiple Nusava products in one video.',
      momentum: 'waning',
      videos: 143,
      avg_gmv_video: 98.20,
      total_gmv: 14043,
      trend: [240, 200, 170, 155, 130, 110],
      topCreator: 'calikellydeals',
      topCreatorGMV: 4800,
      tags: ['haul', 'multi-product', 'bundle'],
      notes: 'Declining per-video GMV. Over-saturated format — rotate out.'
    },
    {
      id: 'ugc-lifestyle',
      name: 'UGC Lifestyle / Aesthetic',
      description: 'Soft aesthetic content featuring Nusava without hard sell.',
      momentum: 'waning',
      videos: 211,
      avg_gmv_video: 62.40,
      total_gmv: 13166,
      trend: [180, 160, 140, 110, 80, 70],
      topCreator: 'mellag',
      topCreatorGMV: 2100,
      tags: ['aesthetic', 'lifestyle', 'soft-sell'],
      notes: 'Views are high but conversion is dropping. Best as awareness, not CTA.'
    },
    {
      id: 'question-answer',
      name: 'Q&A / FAQ',
      description: 'Creator answers common questions about Nusava ingredients or science.',
      momentum: 'potential',
      videos: 44,
      avg_gmv_video: 172.80,
      total_gmv: 7603,
      trend: [50, 80, 110, 130, 155, 170],
      topCreator: 'Jamison904',
      topCreatorGMV: 3100,
      tags: ['education', 'faq', 'ingredient'],
      notes: 'New and growing. High credibility signal for supplement category.'
    }
  ],

  render: function () {
    var self = this;
    var narratives = this._narratives;

    var counts = { all: narratives.length, winning: 0, waning: 0, potential: 0 };
    narratives.forEach(function (n) { counts[n.momentum]++; });

    var topByGMV = narratives.slice().sort(function (a, b) { return b.total_gmv - a.total_gmv; })[0];
    var topByEff = narratives.slice().sort(function (a, b) { return b.avg_gmv_video - a.avg_gmv_video; })[0];
    var totalVideos = narratives.reduce(function (s, n) { return s + n.videos; }, 0);
    var totalGMV = narratives.reduce(function (s, n) { return s + n.total_gmv; }, 0);

    var html = '<div class="tab-pane">';

    html += '<div class="page-title"><h1>Narrative Intelligence</h1>' +
      '<div class="subtitle">Content families driving conversion — identify what\'s working, what\'s waning, and what to scale.</div></div>';

    // KPI strip
    html += '<div class="kpi-grid">';
    html += kpiCard('Narrative Families', narratives.length, totalVideos + ' total videos tracked', 'blue');
    html += kpiCard('Winning', counts.winning, 'Trending up in GMV/video', 'green');
    html += kpiCard('Has Potential', counts.potential, 'Rising — scale now', 'orange');
    html += kpiCard('Waning', counts.waning, 'Declining efficiency', 'red');
    html += kpiCard('Top Narrative GMV', U.fmt$(topByGMV ? topByGMV.total_gmv : 0), topByGMV ? topByGMV.name : '', 'blue');
    html += kpiCard('Best GMV / Video', topByEff ? '$' + topByEff.avg_gmv_video.toFixed(0) : '—', topByEff ? topByEff.name : '', 'green');
    html += '</div>';

    // Data source notice
    html += '<div class="alert-bar"><div class="alert alert-blue"><span class="alert-icon">ℹ️</span>' +
      '<div><strong>Data Source:</strong> Narrative tags are applied manually or via Cruva. ' +
      'Export video-level GMV from TikTok Shop Creator Center and tag each video with a narrative family. ' +
      'Sample data shown — update <code>js/views/narrative.js → _narratives[]</code> with live data.</div></div></div>';

    // Filter chips
    html += '<div class="filter-chips" style="margin-bottom:20px">';
    ['all','winning','waning','potential'].forEach(function (f) {
      var labels = {
        all: 'All Narratives (' + counts.all + ')',
        winning: '🟢 Winning (' + counts.winning + ')',
        waning: '🔴 Waning (' + counts.waning + ')',
        potential: '🟡 Has Potential (' + counts.potential + ')'
      };
      html += '<button class="filter-chip ' + (self._filter === f ? 'active' : '') + '" data-nfilter="' + f + '">' + labels[f] + '</button>';
    });
    html += '</div>';

    // Cards grid
    html += '<div id="narrative-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px;margin-bottom:24px">';
    html += this._renderCards(narratives, self._filter);
    html += '</div>';

    // Comparison table
    html += '<div class="section-header"><span class="section-title">Narrative Comparison</span>' +
      '<span class="section-meta">All families ranked by GMV / video</span></div>';
    html += '<div class="table-card"><div class="table-scroll"><table class="data-table">';
    html += '<thead><tr><th>Narrative</th><th>Momentum</th><th>Videos</th><th>Total GMV</th><th>Avg GMV / Video</th><th>Top Creator</th><th>Tags</th></tr></thead><tbody>';

    narratives.slice().sort(function (a, b) { return b.avg_gmv_video - a.avg_gmv_video; }).forEach(function (n) {
      html += '<tr>';
      html += '<td><strong>' + n.name + '</strong></td>';
      html += '<td>' + momentumBadge(n.momentum) + '</td>';
      html += '<td>' + n.videos + '</td>';
      html += '<td>' + U.fmt$(n.total_gmv) + '</td>';
      html += '<td><strong>$' + n.avg_gmv_video.toFixed(2) + '</strong></td>';
      html += '<td class="text-muted">@' + n.topCreator + '</td>';
      html += '<td style="white-space:normal">' + n.tags.map(function (t) {
        return '<span style="display:inline-block;padding:1px 7px;background:var(--gray-100);border-radius:4px;font-size:11px;margin:1px">' + t + '</span>';
      }).join('') + '</td>';
      html += '</tr>';
    });
    html += '</tbody></table></div></div>';

    html += '</div>';
    document.getElementById('main-content').innerHTML = html;

    // Filter chips
    document.querySelectorAll('[data-nfilter]').forEach(function (chip) {
      chip.addEventListener('click', function () {
        self._filter = chip.getAttribute('data-nfilter');
        document.querySelectorAll('[data-nfilter]').forEach(function (c) {
          c.classList.toggle('active', c.getAttribute('data-nfilter') === self._filter);
        });
        var grid = document.getElementById('narrative-grid');
        if (grid) grid.innerHTML = self._renderCards(narratives, self._filter);
      });
    });
  },

  _renderCards: function (narratives, filter) {
    var filtered = filter === 'all' ? narratives : narratives.filter(function (n) { return n.momentum === filter; });
    if (filtered.length === 0) {
      return '<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon">📝</div><h3>No narratives match</h3></div>';
    }

    return filtered.sort(function (a, b) { return b.avg_gmv_video - a.avg_gmv_video; }).map(function (n) {
      var trendDir = n.trend[n.trend.length - 1] > n.trend[0] ? '↑' : n.trend[n.trend.length - 1] < n.trend[0] ? '↓' : '→';
      var trendColor = n.momentum === 'winning' ? 'var(--green)' : n.momentum === 'waning' ? 'var(--red)' : 'var(--yellow)';
      var borderColor = n.momentum === 'winning' ? 'var(--green)' : n.momentum === 'waning' ? 'var(--red)' : 'var(--yellow)';

      // Mini sparkline bars
      var maxTrend = Math.max.apply(null, n.trend);
      var sparks = n.trend.map(function (v) {
        var h = Math.max(3, Math.round((v / maxTrend) * 24));
        return '<span style="width:5px;height:' + h + 'px;background:' + trendColor + ';border-radius:2px 2px 0 0;opacity:.7;display:inline-block"></span>';
      }).join('');

      var card = '<div style="background:var(--white);border-radius:var(--radius);box-shadow:var(--shadow);padding:18px;border-top:3px solid ' + borderColor + '">';
      card += '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">';
      card += '<div><div style="font-size:14px;font-weight:700;color:var(--gray-900)">' + n.name + '</div>';
      card += '<div style="font-size:11px;color:var(--gray-500);margin-top:2px">' + n.videos + ' videos · ' + U.fmt$(n.total_gmv) + ' total GMV</div></div>';
      card += momentumBadge(n.momentum);
      card += '</div>';

      card += '<div style="font-size:12px;color:var(--gray-500);margin-bottom:14px">' + n.description + '</div>';

      // Metrics row
      card += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">';
      card += '<div style="background:var(--gray-50);border-radius:7px;padding:10px">';
      card += '<div style="font-size:10px;font-weight:600;color:var(--gray-500);text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px">Avg GMV / Video</div>';
      card += '<div style="font-size:20px;font-weight:800;color:var(--gray-900)">$' + n.avg_gmv_video.toFixed(0) + '</div>';
      card += '</div>';
      card += '<div style="background:var(--gray-50);border-radius:7px;padding:10px">';
      card += '<div style="font-size:10px;font-weight:600;color:var(--gray-500);text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px">6-Month Trend</div>';
      card += '<div style="display:flex;align-items:flex-end;gap:2px;height:28px">' + sparks + '</div>';
      card += '<div style="font-size:11px;color:' + trendColor + ';font-weight:700;margin-top:2px">' + trendDir + ' GMV/video</div>';
      card += '</div>';
      card += '</div>';

      // Top creator
      card += '<div style="font-size:12px;margin-bottom:10px">';
      card += '<span style="color:var(--gray-500)">Top Creator: </span><strong>@' + n.topCreator + '</strong>';
      card += '<span style="color:var(--gray-500)"> · ' + U.fmt$(n.topCreatorGMV) + '</span>';
      card += '</div>';

      // Notes
      card += '<div style="font-size:11px;color:var(--gray-500);background:var(--gray-50);border-radius:6px;padding:8px 10px;border-left:3px solid ' + borderColor + '">' + n.notes + '</div>';

      card += '</div>';
      return card;
    }).join('');
  }
};

function momentumBadge(m) {
  if (m === 'winning')   return '<span style="display:inline-block;padding:3px 10px;border-radius:5px;font-size:11px;font-weight:700;background:#d1fae5;color:#065f46">🟢 Winning</span>';
  if (m === 'waning')    return '<span style="display:inline-block;padding:3px 10px;border-radius:5px;font-size:11px;font-weight:700;background:#fee2e2;color:#991b1b">🔴 Waning</span>';
  if (m === 'potential') return '<span style="display:inline-block;padding:3px 10px;border-radius:5px;font-size:11px;font-weight:700;background:#fef3c7;color:#92400e">🟡 Potential</span>';
  return '';
}
