(function(window) {
  'use strict';
  window.googletag = window.googletag || { cmd: [] };

  class XadScroll {
    constructor(adUnit, options = {}) {
      this.adUnit = adUnit;
      this.config = {
        adSize: [728, 90],
        mobileAdSize: [300, 250],
        responsive: true,
        mobileBreakpoint: 768,
        articleSelector: 'article',
        insertSelector: 'h2, h3',
        minDistance: 600,
        maxAdsPerPage: 5,
        lazyLoadMargin: 300,
        targeting: {},
        debug: false,
        ...options
      };
      this.adSlots = [];
      this.observer = null;
      this.initialized = false;
      this.init();
    }

    init() {
      if (this.initialized) return;
      googletag.cmd.push(() => {
        googletag.pubads().enableSingleRequest(); 
        googletag.pubads().collapseEmptyDivs();
        googletag.enableServices();
        this.initialized = true;
        this.createPlaceholders();
        this.setupLazyObserver();
        this.loadFirstAdImmediately(); 
      });
    }

    createPlaceholders() {
      const article = document.querySelector(this.config.articleSelector);
      if (!article) return;
      const targets = article.querySelectorAll(this.config.insertSelector);
      let count = 0;
      targets.forEach((el) => {
        if (count >= this.config.maxAdsPerPage) return;
        const placeholder = document.createElement('div');
        placeholder.id = `xadscroll-ad-${count}`;
        placeholder.className = 'xadscroll-placeholder';
        placeholder.setAttribute('data-ad-index', count);
        placeholder.setAttribute('data-loaded', 'false');
        el.insertAdjacentElement('beforebegin', placeholder);
        this.adSlots.push({ id: count, divId: placeholder.id, element: placeholder, loaded: false });
        count++;
      });
      this.log(`Created ${count} placeholders`, 'info');
    }

    setupLazyObserver() {
      const options = { root: null, rootMargin: `${this.config.lazyLoadMargin}px`, threshold: 0 };
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const placeholder = entry.target;
            const adIndex = parseInt(placeholder.getAttribute('data-ad-index'));
            const isLoaded = placeholder.getAttribute('data-loaded') === 'true';
            if (!isLoaded) {
              this.loadAd(adIndex);
              placeholder.setAttribute('data-loaded', 'true');
              this.observer.unobserve(placeholder);
            }
          }
        });
      }, options);
      this.adSlots.forEach((slot) => {
        if (slot.id !== 0) this.observer.observe(slot.element); // ❌ không observe ad 0
      });
    }

    loadFirstAdImmediately() {
      const first = this.adSlots[0];
      if (!first) return;
      this.log('Loading first ad immediately...', 'info');
      this.loadAd(0);
      first.element.setAttribute('data-loaded', 'true');
    }

    loadAd(i) {
      const slot = this.adSlots[i];
      if (!slot || slot.loaded) return;
      this.log(`Loading ad ${i}...`, 'info');
      googletag.cmd.push(() => {
        const adSize = this.getAdSize();
        const gptSlot = googletag.defineSlot(this.adUnit, adSize, slot.divId)
          .addService(googletag.pubads());
        if (Object.keys(this.config.targeting).length > 0) {
          for (const [k, v] of Object.entries(this.config.targeting)) {
            gptSlot.setTargeting(k, v);
          }
        }
        googletag.display(slot.divId);
        slot.loaded = true;
        slot.gptSlot = gptSlot;
        this.log(`Ad ${i} displayed`, 'success');
      });
    }

    getAdSize() {
      return window.innerWidth < this.config.mobileBreakpoint
        ? this.config.mobileAdSize
        : this.config.adSize;
    }

    log(msg, type = 'info') {
      if (!this.config.debug) return;
      const colors = {
        info: '#3498db',
        success: '#27ae60',
        warn: '#f39c12',
        error: '#e74c3c'
      };
      console.log(`%c[XadScroll] ${msg}`, `color:${colors[type] || '#555'}`);
    }
  }

  window.XadScroll = (adUnit, options) => new XadScroll(adUnit, options);
})(window);
