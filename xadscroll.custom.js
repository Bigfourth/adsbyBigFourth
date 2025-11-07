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
        insertSelector: 'h2, h3', // bạn có thể đổi thành bất kỳ thẻ nào
        minDistance: 600,
        maxAdsPerPage: 5,
        lazyLoadMargin: 300,
        enableSRA: false,
        targeting: {},
        debug: false,
        ...options
      };
      this.adSlots = [];
      this.initialized = false;
      this.observer = null;
      this.init();
    }

    init() {
      if (this.initialized) return;
      googletag.cmd.push(() => {
        googletag.setConfig({ singleRequest: this.config.enableSRA });
        googletag.enableServices();
        this.initialized = true;
        this.createAdPlaceholders();
        this.setupLazyLoading();
      });
    }

    createAdPlaceholders() {
      const article = document.querySelector(this.config.articleSelector);
      if (!article) return;
      const inserts = article.querySelectorAll(this.config.insertSelector);
      let count = 0;
      inserts.forEach((el, idx) => {
        if (count >= this.config.maxAdsPerPage) return;
        const placeholder = document.createElement("div");
        placeholder.id = `xadscroll-ad-${count}`;
        placeholder.setAttribute('data-ad-index', count);
        placeholder.setAttribute('data-loaded', 'false');
        el.insertAdjacentElement('beforebegin', placeholder);
        this.adSlots.push({ id: count, divId: placeholder.id, element: placeholder, gptSlot: null, loaded: false });
        count++;
      });
    }

    setupLazyLoading() {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const i = parseInt(el.getAttribute('data-ad-index'));
            if (el.getAttribute('data-loaded') === 'true') return;
            this.loadAd(i);
            el.setAttribute('data-loaded', 'true');
            observer.unobserve(el);
          }
        });
      }, { root: null, rootMargin: `${this.config.lazyLoadMargin}px`, threshold: 0 });

      this.adSlots.forEach(slot => observer.observe(slot.element));
    }

    loadAd(i) {
      const slot = this.adSlots[i];
      if (!slot) return;
      googletag.cmd.push(() => {
        const size = this.getAdSize();
        const s = googletag.defineSlot(this.adUnit, size, slot.divId).addService(googletag.pubads());
        if (Object.keys(this.config.targeting).length > 0) s.setConfig({ targeting: this.config.targeting });
        googletag.display(slot.divId);
        slot.gptSlot = s;
        slot.loaded = true;
      });
    }

    getAdSize() {
      return window.innerWidth < this.config.mobileBreakpoint
        ? this.config.mobileAdSize
        : this.config.adSize;
    }
  }

  window.XadScroll = (adUnit, options) => new XadScroll(adUnit, options);
})(window);
