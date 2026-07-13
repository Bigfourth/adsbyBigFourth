/**
 * adsticky v1.0 — universal sticky ad library (GPT)
 *
 * API:
 *   adsticky(adUnitPath, position [, options])
 *
 *   position: 'bottom' | 'top' | 'left' | 'right'
 *
 * Defaults:
 *   - bottom/top : max height 100px. Sizes: mobile [320x50, 320x100], desktop [728x90, 320x100, 320x50]
 *   - left/right : vertical banner, anchored from bottom with offset 110px
 *                  (sits above the bottom sticky). Sizes: [160x600, 120x600].
 *                  Auto-skipped when viewport < 1200px (no room on mobile).
 *   - Auto refresh: 60s of ACTIVE VIEWABLE time (tab visible + slot >=50% in view)
 *   - maxRefreshes: 10 per slot. Close = destroy + stop. Collapse = pause refresh.
 *
 * options (all optional):
 *   { sizeMapping, refreshInterval, maxRefreshes, offset, zIndex, bg, kv }
 *
 * Examples:
 *   adsticky('/22796784223/site_sticky_bottom', 'bottom');                    // size mapping mặc định
 *   adsticky('/22796784223/site_sticky_top',    'top', { refreshInterval: 45 });
 *   adsticky('/22796784223/site_sticky_right',  'right', [[300, 600], [300, 250]]); // sizes cố định
 *   adsticky('/22796784223/site_sticky_left',   'left',  { sizes: [[160, 600]], offset: 200 });
 */
(function (win, doc) {
  'use strict';

  win.googletag = win.googletag || { cmd: [] };

  var COUNTER = 0;
  var REGISTRY = {}; // divId -> instance state
  var ENGINE_STARTED = false;
  var LISTENERS_BOUND = false;
  var TAB_VISIBLE = !doc.hidden;

  var DEFAULTS = {
    refreshInterval: 60,
    maxRefreshes: 10,
    zIndex: 2147483641,
    bg: '#fafafa',
    offset: 110,         // left/right: distance from bottom (px), clears the bottom sticky
    kv: null,            // extra targeting: { key: 'value' | ['a','b'] }
    sra: true,           // enable SRA if page hasn't enabled services yet
    sizeMapping: null    // override: [ [[minW,minH],[sizes]], ... ] largest first
  };

  // GPT size mapping per position — evaluated by GPT on every fetch/refresh
  function defaultMapping(position) {
    if (position === 'left' || position === 'right') {
      return [
        [[1500, 0], [[300, 600], [300, 250], [160, 600], [120, 600]]], // wide desktop
        [[1200, 0], [[160, 600], [120, 600]]],
        [[0, 0], []]                              // below 1200: no ad served
      ];
    }
    // top / bottom — max height 100
    return [
      [[768, 0], [[728, 90], [320, 100], [320, 50]]],  // tablet/desktop
      [[0, 0],   [[320, 100], [320, 50]]]              // mobile
    ];
  }

  // shrink/grow wrapper to the creative actually rendered
  function resizeWrap(st, w, h) {
    st.w = w; st.h = h; // collapse transform uses live dims
    if (st.position === 'bottom' || st.position === 'top') {
      st.wrap.style.height = (h + 5) + 'px';       // width stays 100%
    } else {
      st.wrap.style.width = w + 'px';
      st.wrap.style.height = h + 'px';
    }
  }

  // sizes valid for CURRENT viewport (for wrapper geometry)
  function activeSizes(mapping, vw) {
    for (var i = 0; i < mapping.length; i++) {
      if (vw >= mapping[i][0][0]) return mapping[i][1];
    }
    return [];
  }

  // union of all sizes across mapping (for defineSlot)
  function allSizes(mapping) {
    var seen = {}, out = [];
    mapping.forEach(function (m) {
      m[1].forEach(function (s) {
        var k = s[0] + 'x' + s[1];
        if (!seen[k]) { seen[k] = 1; out.push(s); }
      });
    });
    return out;
  }

  function maxDim(sizes, idx) {
    return sizes.reduce(function (m, s) { return Math.max(m, s[idx]); }, 0);
  }

  /* ---------------- shared GPT listeners + refresh ticker ---------------- */
  function bindGlobal() {
    if (LISTENERS_BOUND) return;
    LISTENERS_BOUND = true;

    doc.addEventListener('visibilitychange', function () {
      TAB_VISIBLE = !doc.hidden;
    });

    googletag.cmd.push(function () {
      var pubads = googletag.pubads();

      pubads.addEventListener('slotRenderEnded', function (e) {
        var st = REGISTRY[e.slot.getSlotElementId()];
        if (!st) return;
        if (e.isEmpty) {
          st.filled = false;
          if (st.refreshCount === 0) st.wrap.style.display = 'none'; // hide on first no-fill
        } else {
          st.filled = true;
          // fit wrapper to ACTUAL rendered creative size (multi-size slots)
          if (e.size && typeof e.size[0] === 'number') {
            resizeWrap(st, e.size[0], e.size[1]);
          }
          if (!st.closed) st.wrap.style.display = 'block';
        }
      });

      pubads.addEventListener('slotVisibilityChanged', function (e) {
        var st = REGISTRY[e.slot.getSlotElementId()];
        if (st) st.viewable = e.inViewPercentage >= 50;
      });
    });
  }

  function startEngine() {
    if (ENGINE_STARTED) return;
    ENGINE_STARTED = true;

    setInterval(function () {
      if (!TAB_VISIBLE) return;
      var due = [];

      Object.keys(REGISTRY).forEach(function (id) {
        var st = REGISTRY[id];
        if (st.closed || st.collapsed || !st.filled || !st.viewable) return;
        if (st.refreshCount >= st.cfg.maxRefreshes) return;

        st.elapsed++;
        if (st.elapsed >= st.cfg.refreshInterval) {
          st.elapsed = 0;
          st.refreshCount++;
          due.push(st);
        }
      });

      if (due.length) {
        googletag.cmd.push(function () {
          due.forEach(function (st) {
            st.slot.setTargeting('refresh', String(st.refreshCount));
          });
          googletag.pubads().refresh(due.map(function (st) { return st.slot; }));
        });
      }
    }, 1000);
  }

  /* ---------------- geometry per position ---------------- */
  function wrapperCss(position, cfg, w, h) {
    var base = 'position:fixed;z-index:' + cfg.zIndex + ';background:' + cfg.bg +
               ';box-shadow:0 0 4px rgba(0,0,0,.15);transition:transform .4s;display:none;';
    switch (position) {
      case 'bottom':
        return base + 'left:0;bottom:0;width:100%;height:' + (h + 5) + 'px;text-align:center;';
      case 'top':
        return base + 'left:0;top:0;width:100%;height:' + (h + 5) + 'px;text-align:center;';
      case 'left':
        return base + 'left:0;bottom:' + cfg.offset + 'px;width:' + w + 'px;height:' + h + 'px;';
      case 'right':
        return base + 'right:0;bottom:' + cfg.offset + 'px;width:' + w + 'px;height:' + h + 'px;';
    }
  }

  // collapse translate direction per position
  function collapseTransform(position, w, h) {
    switch (position) {
      case 'bottom': return 'translateY(' + (h + 5) + 'px)';
      case 'top':    return 'translateY(-' + (h + 5) + 'px)';
      case 'left':   return 'translateX(-' + w + 'px)';
      case 'right':  return 'translateX(' + w + 'px)';
    }
  }

  // control bar placement (collapse tab + close) per position
  function controlCss(position, cfg) {
    var btn = 'position:absolute;cursor:pointer;background:' + cfg.bg +
              ';border:1px solid #d4d4d4;font:13px/19px sans-serif;color:#616161;text-align:center;';
    switch (position) {
      case 'bottom':
        return {
          tab:   btn + 'top:-21px;left:0;width:56px;height:21px;border-bottom:none;border-radius:6px 6px 0 0;',
          close: btn + 'top:-21px;right:0;width:32px;height:21px;border-bottom:none;border-radius:6px 6px 0 0;'
        };
      case 'top':
        return {
          tab:   btn + 'bottom:-21px;left:0;width:56px;height:21px;border-top:none;border-radius:0 0 6px 6px;',
          close: btn + 'bottom:-21px;right:0;width:32px;height:21px;border-top:none;border-radius:0 0 6px 6px;'
        };
      case 'left':
        return {
          tab:   btn + 'right:-21px;top:0;width:21px;height:56px;border-left:none;border-radius:0 6px 6px 0;line-height:56px;',
          close: btn + 'right:-21px;bottom:0;width:21px;height:32px;border-left:none;border-radius:0 6px 6px 0;line-height:32px;'
        };
      case 'right':
        return {
          tab:   btn + 'left:-21px;top:0;width:21px;height:56px;border-right:none;border-radius:6px 0 0 6px;line-height:56px;',
          close: btn + 'left:-21px;bottom:0;width:21px;height:32px;border-right:none;border-radius:6px 0 0 6px;line-height:32px;'
        };
    }
  }

  var CHEVRON = {
    bottom: ['\u2304', '\u2303'], // ⌄ ⌃
    top:    ['\u2303', '\u2304'],
    left:   ['\u2039', '\u203A'], // ‹ ›
    right:  ['\u203A', '\u2039']
  };

  /* ---------------- main ---------------- */
  function adsticky(adUnitPath, position, options) {
    position = String(position || 'bottom').toLowerCase();
    if (['bottom', 'top', 'left', 'right'].indexOf(position) === -1) {
      return console.warn('[adsticky] invalid position:', position);
    }

    var vw = win.innerWidth;

    // shorthand: adsticky(unit, 'right', [[300,600],[300,250]])
    if (Array.isArray(options)) options = { sizes: options };
    var cfg = Object.assign({}, DEFAULTS, options || {});

    // priority: explicit sizes (fixed, any viewport) > custom sizeMapping > position default
    var mapping = cfg.sizes
      ? [[[0, 0], cfg.sizes]]
      : (cfg.sizeMapping || defaultMapping(position));
    var curSizes = activeSizes(mapping, vw);

    // no sizes for this viewport (e.g. side sticky on mobile) -> skip entirely
    if (!curSizes.length) return;

    var w = maxDim(curSizes, 0);
    var h = maxDim(curSizes, 1);
    var divId = 'adsticky_' + position + '_' + (++COUNTER);

    /* --- DOM --- */
    var wrap = doc.createElement('div');
    wrap.id = divId + '_wrap';
    wrap.style.cssText = wrapperCss(position, cfg, w, h);

    var css = controlCss(position, cfg);
    var tab = doc.createElement('div');
    tab.style.cssText = css.tab;
    tab.textContent = CHEVRON[position][0];
    tab.setAttribute('aria-label', 'Collapse ad');

    var closeBtn = doc.createElement('div');
    closeBtn.style.cssText = css.close;
    closeBtn.textContent = '\u2715';
    closeBtn.setAttribute('aria-label', 'Close ad');

    var adDiv = doc.createElement('div');
    adDiv.id = divId;
    adDiv.style.cssText = (position === 'bottom' || position === 'top')
      ? 'display:inline-block;position:relative;top:5px;'
      : 'display:block;';

    wrap.appendChild(tab);
    wrap.appendChild(closeBtn);
    wrap.appendChild(adDiv);

    var mount = function () { doc.body.appendChild(wrap); };
    if (doc.body) mount();
    else doc.addEventListener('DOMContentLoaded', mount);

    /* --- state --- */
    var st = REGISTRY[divId] = {
      cfg: cfg, wrap: wrap, slot: null,
      position: position, w: w, h: h,      // live dims, updated on each render
      closed: false, collapsed: false,
      viewable: false, filled: false,
      elapsed: 0, refreshCount: 0
    };

    /* --- GPT --- */
    bindGlobal();
    googletag.cmd.push(function () {
      // standalone-safe: enable SRA only if services not yet enabled by the page
      if (cfg.sra && !win.googletag.pubadsReady) {
        try { googletag.pubads().enableSingleRequest(); } catch (err) {}
      }

      st.slot = googletag.defineSlot(adUnitPath, allSizes(mapping), divId)
        .addService(googletag.pubads());

      var msb = googletag.sizeMapping();
      mapping.forEach(function (m) { msb.addSize(m[0], m[1]); });
      st.slot.defineSizeMapping(msb.build());

      st.slot.setTargeting('refresh', '0');
      st.slot.setTargeting('pos', position);
      if (cfg.kv) Object.keys(cfg.kv).forEach(function (k) {
        st.slot.setTargeting(k, cfg.kv[k]);
      });
      googletag.enableServices(); // no-op if already enabled
      googletag.display(divId);
    });
    startEngine();

    /* --- controls --- */
    tab.addEventListener('click', function () {
      st.collapsed = !st.collapsed;
      wrap.style.transform = st.collapsed
        ? collapseTransform(position, st.w, st.h)  // live dims after resize
        : 'none';
      tab.textContent = CHEVRON[position][st.collapsed ? 1 : 0];
    });

    closeBtn.addEventListener('click', function () {
      st.closed = true;
      googletag.cmd.push(function () { googletag.destroySlots([st.slot]); });
      wrap.parentNode && wrap.parentNode.removeChild(wrap);
      delete REGISTRY[divId];
    });

    return divId;
  }

  win.adsticky = adsticky;
})(window, document);
