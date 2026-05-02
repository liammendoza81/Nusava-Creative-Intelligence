// Formatting + small helpers used by every view.
// All exposed via window.* (no ES modules — works on file:// without a server).

(function () {
  function fmtCurrency(v, opts) {
    if (v === null || v === undefined || Number.isNaN(v)) return '—';
    var decimals = (opts && opts.decimals != null) ? opts.decimals : 0;
    var sign = v < 0 ? '-' : '';
    var abs = Math.abs(v).toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    return sign + '$' + abs;
  }

  function fmtCurrencyCompact(v) {
    if (v === null || v === undefined || Number.isNaN(v)) return '—';
    var sign = v < 0 ? '-' : '';
    var n = Math.abs(v);
    if (n >= 1e6) return sign + '$' + (n / 1e6).toFixed(2) + 'M';
    if (n >= 1e3) return sign + '$' + (n / 1e3).toFixed(1) + 'K';
    return sign + '$' + n.toFixed(0);
  }

  function fmtPct(v, opts) {
    // Standardized to 2-decimal cap (was 1). Caller can still override via opts.decimals.
    if (v === null || v === undefined || Number.isNaN(v)) return '—';
    var decimals = (opts && opts.decimals != null) ? opts.decimals : 2;
    var sign = v > 0 ? '+' : '';
    return sign + (v * 100).toFixed(decimals) + '%';
  }

  function fmtNumber(v, opts) {
    if (v === null || v === undefined || Number.isNaN(v)) return '—';
    var decimals = (opts && opts.decimals != null) ? opts.decimals : 0;
    return v.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }

  function fmtMultiplier(v) {
    if (v === null || v === undefined || Number.isNaN(v)) return '—';
    return v.toFixed(2) + 'x';
  }

  // WoW%-style cell with color coding
  function wowCell(v, opts) {
    if (v === null || v === undefined || Number.isNaN(v)) return '<span class="wow-flat">—</span>';
    var cls = 'wow-flat';
    if (v > 0.001) cls = 'wow-pos';
    if (v < -0.001) cls = 'wow-neg';
    return '<span class="' + cls + '">' + fmtPct(v, opts) + '</span>';
  }

  // Some metrics are "lower is better" (CPO, decay) — invert the WoW color.
  function wowCellInverted(v, opts) {
    if (v === null || v === undefined || Number.isNaN(v)) return '<span class="wow-flat">—</span>';
    var cls = 'wow-flat';
    if (v > 0.001) cls = 'wow-neg';
    if (v < -0.001) cls = 'wow-pos';
    return '<span class="' + cls + '">' + fmtPct(v, opts) + '</span>';
  }

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Convert markdown-ish text to safe HTML (very small subset: paragraphs, lists, **bold**)
  function mdToHtml(md) {
    if (!md) return '';
    var blocks = md.split(/\n{2,}/);
    var out = [];
    for (var i = 0; i < blocks.length; i++) {
      var b = blocks[i].trim();
      if (!b) continue;
      var lines = b.split('\n');
      // List?
      if (/^\s*([-*]|\d+\.)\s/.test(lines[0])) {
        var ordered = /^\s*\d+\./.test(lines[0]);
        var tag = ordered ? 'ol' : 'ul';
        var items = lines.map(function (l) {
          return '<li>' + applyInline(escapeHtml(l.replace(/^\s*([-*]|\d+\.)\s+/, ''))) + '</li>';
        }).join('');
        out.push('<' + tag + '>' + items + '</' + tag + '>');
      } else {
        out.push('<p>' + applyInline(escapeHtml(b).replace(/\n/g, '<br>')) + '</p>');
      }
    }
    return out.join('\n');
  }

  function applyInline(s) {
    return s
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code>$1</code>');
  }

  function el(tag, attrs, children) {
    var e = document.createElement(tag);
    if (attrs) {
      for (var k in attrs) {
        if (k === 'class') e.className = attrs[k];
        else if (k === 'html') e.innerHTML = attrs[k];
        else e.setAttribute(k, attrs[k]);
      }
    }
    if (children) {
      if (typeof children === 'string') e.textContent = children;
      else if (Array.isArray(children)) {
        children.forEach(function (c) {
          if (c == null) return;
          e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
        });
      }
    }
    return e;
  }

  window.Utils = {
    fmtCurrency: fmtCurrency,
    fmtCurrencyCompact: fmtCurrencyCompact,
    fmtPct: fmtPct,
    fmtNumber: fmtNumber,
    fmtMultiplier: fmtMultiplier,
    wowCell: wowCell,
    wowCellInverted: wowCellInverted,
    escapeHtml: escapeHtml,
    mdToHtml: mdToHtml,
    el: el,
  };
})();
