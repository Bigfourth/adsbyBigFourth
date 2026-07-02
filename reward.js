/*!
 * content-gate.js v2.0.0 — Lock the page after X% of its height, unlock with a GPT rewarded ad.
 * No selectors, no div counting. Works on any page by measuring real pixel height.
 *
 * v2.0.0 changes:
 *  - FIX: no-fill while user is waiting (pendingShow) now resolves via handleNoFill()
 *  - FIX: GPT race condition — uses googletag.cmd.push instead of apiReady check,
 *         so the gate no longer falls into sim mode when gpt.js loads late
 *  - FIX: load timeout (CFG.loadTimeoutMs) — button never stuck on "Loading ad…"
 *  - FIX: handleNoFill resets state to 'idle' so the next click retries a fresh slot
 *  - NEW: CFG.forceRefresh for sites running Prebid / disableInitialLoad()
 *  - NEW: opaque veil fallback when backdrop-filter is unsupported
 *
 * Usage:
 *   ContentGate.init({
 *     adUnitPath: '/NETWORK_CODE/rewarded_unlock',  // required
 *     unlockAtPercent: 30
 *   });
 */
window.ContentGate = (function () {
  'use strict';

  var CFG = {
    adUnitPath: '',             // REQUIRED — GAM rewarded ad unit, e.g. '/22796784223/rewarded_unlock'
    unlockAtPercent: 30,        // lock everything below this % of total page height
    minPageHeight: 0,           // 0 = gate runs on EVERY page; set e.g. 1200 to skip short pages
    rememberUnlock: false,      // true = remember unlock for the session
    storageKey: 'cg_unlocked',
    onNoFill: 'unlock',         // 'unlock' | 'keep-locked' | function()
    onReward: null,             // optional fn(payload)
    simulateWhenUnavailable: true, // show fake ad when GPT is absent (dev/test)
    simulateSeconds: 5,
    loadTimeoutMs: 8000,        // max wait after user clicks Unlock before treating as no-fill
    forceRefresh: false,        // true if the page uses disableInitialLoad() (e.g. Prebid)
    texts: {
      title: 'The rest of this article is locked',
      sub: 'Watch one short ad to unlock and keep reading.',
      btn: 'Unlock',
      loading: 'Loading ad…',
      toast: 'Unlocked — enjoy the rest!'
    }
  };

  var rewardedSlot = null, makeVisibleFn = null;
  var slotState = 'idle';   // idle | loading | ready | shown | sim
  var pendingShow = false, unlocked = false, loadTimer = null;
  var els = {}, gateTop = 0;

  /* ---------------------------------------------------------------- styles */

  function injectStyles() {
    if (document.getElementById('cg-styles')) return;
    var css = ''
    + '.cg-veil{position:absolute;left:0;right:0;z-index:9000;pointer-events:auto;'
    +   'background:rgba(248,247,244,.30);backdrop-filter:blur(7px);-webkit-backdrop-filter:blur(7px);'
    +   '-webkit-mask-image:linear-gradient(180deg,transparent 0,#000 90px);'
    +   'mask-image:linear-gradient(180deg,transparent 0,#000 90px)}'
    /* fallback: no backdrop-filter support -> near-opaque veil so text is unreadable */
    + '@supports not ((backdrop-filter:blur(7px)) or (-webkit-backdrop-filter:blur(7px))){'
    +   '.cg-veil{background:rgba(248,247,244,.96)}}'
    + '.cg-veil.cg-hide{display:none}'
    + '.cg-bar{position:fixed;left:0;right:0;bottom:0;z-index:9050;transform:translateY(120%);'
    +   'transition:transform .45s cubic-bezier(.2,.8,.2,1);padding:48px 16px 16px;pointer-events:none;'
    +   'background:linear-gradient(180deg,rgba(22,19,16,0),#161310 38%);'
    +   'font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,sans-serif}'
    + '.cg-bar.cg-show{transform:translateY(0);pointer-events:auto}'
    + '.cg-card{max-width:560px;margin:0 auto;background:#161310;color:#F8F4EC;'
    +   'border:1px solid rgba(255,255,255,.08);border-radius:14px;box-shadow:0 18px 50px -12px rgba(0,0,0,.55);'
    +   'padding:16px 18px;display:flex;align-items:center;gap:16px}'
    + '.cg-ico{flex:none;width:46px;height:46px;border-radius:12px;display:grid;place-items:center;color:#161310;'
    +   'background:linear-gradient(135deg,#F0A500,#E8762B)}'
    + '.cg-txt{flex:1;min-width:0}'
    + '.cg-title{font-size:15px;font-weight:700;margin:0 0 2px;line-height:1.3}'
    + '.cg-sub{font-size:12.5px;color:rgba(248,244,236,.62);margin:0;line-height:1.4}'
    + '.cg-btn{flex:none;cursor:pointer;border:0;font-family:inherit;font-weight:700;font-size:14px;color:#161310;'
    +   'background:linear-gradient(135deg,#F0A500,#E8762B);padding:13px 20px;border-radius:11px;'
    +   'display:inline-flex;align-items:center;gap:8px;white-space:nowrap;transition:transform .15s,box-shadow .15s}'
    + '.cg-btn:hover{transform:translateY(-1px);box-shadow:0 8px 20px -6px #E8762B}'
    + '.cg-btn[disabled]{opacity:.55;cursor:progress;box-shadow:none;transform:none}'
    + '.cg-spin{width:15px;height:15px;border:2px solid rgba(22,19,16,.35);border-top-color:#161310;'
    +   'border-radius:50%;animation:cg-rot .7s linear infinite}'
    + '@keyframes cg-rot{to{transform:rotate(360deg)}}'
    + '.cg-toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%) translateY(20px);background:#1C1B1A;'
    +   'color:#fff;font-family:Inter,system-ui,sans-serif;font-size:13.5px;font-weight:500;padding:12px 18px;'
    +   'border-radius:11px;z-index:9070;opacity:0;pointer-events:none;transition:opacity .3s,transform .3s;'
    +   'box-shadow:0 12px 32px -8px rgba(0,0,0,.4)}'
    + '.cg-toast.cg-show{opacity:1;transform:translateX(-50%) translateY(0)}'
    + '.cg-sim{position:fixed;inset:0;z-index:9080;display:none;align-items:center;justify-content:center;padding:20px;'
    +   'background:rgba(12,10,8,.86);backdrop-filter:blur(4px);font-family:Inter,system-ui,sans-serif}'
    + '.cg-sim.cg-show{display:flex}'
    + '.cg-sim__box{width:100%;max-width:420px;background:#0E0C0A;color:#fff;border:1px solid rgba(255,255,255,.1);'
    +   'border-radius:18px;overflow:hidden;text-align:center}'
    + '.cg-sim__c{aspect-ratio:16/10;display:grid;place-items:center;background:#14110D}'
    + '.cg-sim__c h3{margin:0;font-size:18px;font-weight:700}'
    + '.cg-sim__c p{margin:6px 0 0;font-size:13px;color:rgba(255,255,255,.6)}'
    + '.cg-sim__foot{padding:14px 16px;display:flex;justify-content:space-between;align-items:center;gap:12px}'
    + '.cg-sim__btn{border:0;cursor:pointer;font-family:inherit;font-weight:700;font-size:14px;padding:11px 18px;'
    +   'border-radius:10px;color:#161310;background:linear-gradient(135deg,#F0A500,#E8762B)}'
    + '.cg-sim__btn[disabled]{opacity:.4;cursor:not-allowed;filter:grayscale(.4)}';
    var s = document.createElement('style');
    s.id = 'cg-styles'; s.textContent = css;
    document.head.appendChild(s);
  }

  /* ------------------------------------------------------------------- UI */

  function buildBar() {
    var bar = document.createElement('div');
    bar.className = 'cg-bar';
    bar.innerHTML =
      '<div class="cg-card">'
      + '<div class="cg-ico"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
      +   'stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/>'
      +   '<path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg></div>'
      + '<div class="cg-txt"><p class="cg-title"></p><p class="cg-sub"></p></div>'
      + '<button class="cg-btn" id="cg-unlock"><span class="cg-btn-label"></span></button>'
      + '</div>';
    document.body.appendChild(bar);

    bar.querySelector('.cg-title').textContent = CFG.texts.title;
    bar.querySelector('.cg-sub').textContent = CFG.texts.sub;

    var toast = document.createElement('div');
    toast.className = 'cg-toast';
    var toastSpan = document.createElement('span');
    toastSpan.textContent = CFG.texts.toast;
    toast.appendChild(toastSpan);
    document.body.appendChild(toast);

    els.bar = bar;
    els.btn = bar.querySelector('#cg-unlock');
    els.btnLabel = bar.querySelector('.cg-btn-label');
    els.btnLabel.textContent = CFG.texts.btn;
    els.toast = toast;
    els.btn.addEventListener('click', onUnlockClick);
  }

  function setBtnLoading(loading) {
    els.btn.disabled = !!loading;
    els.btnLabel.textContent = loading ? CFG.texts.loading : CFG.texts.btn;
  }

  /* ------------------------------------------------------------------ gate */

  function pageHeight() {
    var b = document.body, h = document.documentElement;
    return Math.max(b.scrollHeight, b.offsetHeight, h.clientHeight, h.scrollHeight, h.offsetHeight);
  }

  function placeVeil() {
    var total = pageHeight();
    gateTop = Math.round(total * (CFG.unlockAtPercent / 100));
    if (!els.veil) {
      els.veil = document.createElement('div');
      els.veil.className = 'cg-veil';
      document.body.appendChild(els.veil);
      els.veil.addEventListener('mousedown', function (e) { e.preventDefault(); });
    }
    els.veil.style.top = gateTop + 'px';
    els.veil.style.height = (total - gateTop) + 'px';
  }

  function buildGate() {
    if (pageHeight() < CFG.minPageHeight) return false;
    placeVeil();
    els.ro = ('ResizeObserver' in window) ? new ResizeObserver(function () { if (!unlocked) placeVeil(); }) : null;
    if (els.ro) els.ro.observe(document.body);
    window.addEventListener('load', function () { if (!unlocked) placeVeil(); });
    return true;
  }

  function watchScroll() {
    function onScroll() {
      if (unlocked) return;
      var viewBottom = window.scrollY + window.innerHeight;
      if (viewBottom >= gateTop + 40) {
        els.bar.classList.add('cg-show');
        prepareRewarded();
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ------------------------------------------------------------- GPT layer */

  function clearLoadTimer() {
    if (loadTimer) { clearTimeout(loadTimer); loadTimer = null; }
  }

  function armLoadTimer() {
    clearLoadTimer();
    loadTimer = setTimeout(function () {
      loadTimer = null;
      // Still waiting after N seconds -> treat as no-fill
      if (pendingShow && slotState !== 'shown') {
        pendingShow = false;
        destroyRewarded();
        handleNoFill();
      }
    }, CFG.loadTimeoutMs);
  }

  function prepareRewarded() {
    if (slotState !== 'idle') return;

    // GPT is "present" if the tag stub or full API exists. Do NOT gate on apiReady:
    // gpt.js may still be loading — cmd.push queues our setup until it is ready.
    var hasGpt = !!(window.googletag && (window.googletag.cmd || window.googletag.apiReady));
    if (!hasGpt) { slotState = CFG.simulateWhenUnavailable ? 'sim' : 'idle'; return; }

    slotState = 'loading';
    window.googletag.cmd.push(function () {
      var gt = window.googletag;

      // Runs only after gpt.js is fully loaded — safe to check enums here.
      if (!gt.enums || !gt.enums.OutOfPageFormat || gt.enums.OutOfPageFormat.REWARDED === undefined) {
        slotState = CFG.simulateWhenUnavailable ? 'sim' : 'idle';
        if (pendingShow) {
          pendingShow = false; clearLoadTimer();
          if (slotState === 'sim') { setBtnLoading(false); showSimAd(); }
          else handleNoFill();
        }
        return;
      }

      rewardedSlot = gt.defineOutOfPageSlot(CFG.adUnitPath, gt.enums.OutOfPageFormat.REWARDED);
      if (!rewardedSlot) {
        // Browser/page doesn't support the rewarded format (rare)
        slotState = 'idle';
        if (pendingShow) { pendingShow = false; clearLoadTimer(); handleNoFill(); }
        return;
      }
      rewardedSlot.addService(gt.pubads());

      gt.pubads().addEventListener('rewardedSlotReady', function (ev) {
        if (ev.slot !== rewardedSlot) return;
        makeVisibleFn = ev.makeRewardedVisible;
        slotState = 'ready';
        clearLoadTimer();
        if (pendingShow) { pendingShow = false; showRewarded(); }
      });

      gt.pubads().addEventListener('rewardedSlotGranted', function (ev) {
        if (ev.slot === rewardedSlot) grantReward(ev.payload || null);
      });

      gt.pubads().addEventListener('rewardedSlotClosed', function (ev) {
        if (ev.slot === rewardedSlot) { destroyRewarded(); setBtnLoading(false); }
      });

      gt.pubads().addEventListener('slotRenderEnded', function (ev) {
        if (ev.slot !== rewardedSlot || !ev.isEmpty) return;
        // No fill. If the user is waiting, resolve now instead of leaving the
        // button stuck on "Loading ad…" forever.
        clearLoadTimer();
        destroyRewarded();
        if (pendingShow) { pendingShow = false; handleNoFill(); }
        else slotState = 'idle';
      });

      gt.enableServices();
      gt.display(rewardedSlot);
      // Pages using disableInitialLoad() (e.g. Prebid) never fetch on display();
      // an explicit refresh is required for the rewarded slot.
      if (CFG.forceRefresh) gt.pubads().refresh([rewardedSlot]);
    });
  }

  function showRewarded() {
    clearLoadTimer();
    setBtnLoading(false);
    slotState = 'shown';
    if (typeof makeVisibleFn === 'function') makeVisibleFn();
  }

  function destroyRewarded() {
    if (rewardedSlot && window.googletag && window.googletag.cmd) {
      var s = rewardedSlot;
      window.googletag.cmd.push(function () { window.googletag.destroySlots([s]); });
    }
    rewardedSlot = null; makeVisibleFn = null;
    if (slotState !== 'sim') slotState = 'idle';
  }

  function handleNoFill() {
    setBtnLoading(false);
    // State is already back to 'idle' (destroyRewarded) so the next click
    // retries with a fresh slot when onNoFill keeps the page locked.
    if (typeof CFG.onNoFill === 'function') return CFG.onNoFill();
    if (CFG.onNoFill === 'unlock') grantReward(null);
  }

  /* --------------------------------------------------------------- sim ad */

  function showSimAd() {
    var ov = document.getElementById('cg-sim');
    if (!ov) {
      ov = document.createElement('div'); ov.id = 'cg-sim'; ov.className = 'cg-sim';
      ov.innerHTML = '<div class="cg-sim__box"><div class="cg-sim__c"><div><h3>Your ad goes here</h3>'
        + '<p>Simulated rewarded — GPT unavailable</p></div></div><div class="cg-sim__foot">'
        + '<span id="cg-sim-count"></span>'
        + '<button class="cg-sim__btn" id="cg-sim-close" disabled>Claim reward</button></div></div>';
      document.body.appendChild(ov);
    }
    ov.classList.add('cg-show');
    var left = CFG.simulateSeconds, count = ov.querySelector('#cg-sim-count'), close = ov.querySelector('#cg-sim-close');
    close.disabled = true; count.textContent = 'Playing… ' + left + 's';
    var t = setInterval(function () {
      left--;
      if (left > 0) count.textContent = 'Playing… ' + left + 's';
      else { clearInterval(t); count.textContent = 'Ad finished'; close.disabled = false; }
    }, 1000);
    close.onclick = function () { ov.classList.remove('cg-show'); grantReward(null); };
  }

  /* ------------------------------------------------------------ user click */

  function onUnlockClick() {
    if (unlocked) return;
    if (slotState === 'ready') return showRewarded();
    if (slotState === 'sim')   { setBtnLoading(false); return showSimAd(); }
    if (slotState === 'idle')  prepareRewarded();
    // GPT stub missing entirely and sim disabled -> prepareRewarded left state 'idle'
    if (slotState === 'sim')   { setBtnLoading(false); return showSimAd(); }
    if (slotState === 'idle')  return handleNoFill();
    // slotState === 'loading' -> wait for ready/no-fill, with a hard timeout
    pendingShow = true;
    setBtnLoading(true);
    armLoadTimer();
  }

  /* --------------------------------------------------------------- unlock */

  function grantReward(payload) {
    if (unlocked) return;
    unlocked = true;
    clearLoadTimer();
    if (els.veil) els.veil.classList.add('cg-hide');
    if (els.bar) els.bar.classList.remove('cg-show');
    if (els.ro) els.ro.disconnect();
    if (els.toast) {
      els.toast.classList.add('cg-show');
      setTimeout(function () { els.toast.classList.remove('cg-show'); }, 2600);
    }
    destroyRewarded();
    if (CFG.rememberUnlock) { try { sessionStorage.setItem(CFG.storageKey, '1'); } catch (e) {} }
    if (typeof CFG.onReward === 'function') CFG.onReward(payload);
  }

  /* ----------------------------------------------------------------- init */

  function init(opts) {
    opts = opts || {};
    for (var k in opts) {
      if (!opts.hasOwnProperty(k)) continue;
      if (k === 'texts') { for (var t in opts.texts) if (opts.texts.hasOwnProperty(t)) CFG.texts[t] = opts.texts[t]; }
      else CFG[k] = opts[k];
    }
    if (!CFG.adUnitPath) {
      console.warn('[ContentGate] adUnitPath is required — gate not initialized.');
      return;
    }
    function start() {
      if (CFG.rememberUnlock) {
        try { if (sessionStorage.getItem(CFG.storageKey) === '1') { unlocked = true; return; } } catch (e) {}
      }
      injectStyles();
      if (!buildGate()) return;
      buildBar();
      watchScroll();
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
    else start();
  }

  return { init: init, _grant: grantReward, _cfg: CFG, version: '2.0.0' };
})();
