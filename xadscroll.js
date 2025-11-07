/**
 * XadScroll - Smart Ad Insertion with Lazy Loading
 * Version: 1.0.1
 * Author: Your Name
 * Usage: XadScroll('/6355419/Travel');
 */

(function(window) {
  'use strict';

  window.googletag = window.googletag || { cmd: [] };

  class XadScroll {
    constructor(adUnit, options = {}) {
      this.adUnit = adUnit;
      
      this.config = {
        adSize: [728, 90],               // PC: 728x90
        mobileAdSize: [300, 250],        // Mobile: 300x250
        responsive: true,                
        mobileBreakpoint: 768,           
        articleSelector: 'article',      
        headingSelector: 'h2, h3',       
        minDistance: 800,                
        minParagraphs: 2,                
        skipFirstHeadings: 1,            
        maxAdsPerPage: 5,                
        minContentLength: 300,           
        lazyLoadMargin: 500,             
        enableSRA: false,                
        targeting: {},                   
        debug: false,                    
        ...options
      };

      this.adSlots = [];
      this.loadedAds = new Set();
      this.initialized = false;

      this.init();
    }

    init() {
      if (this.initialized) {
        this.log('Already initialized', 'warn');
        return;
      }

      googletag.cmd.push(() => {
        googletag.setConfig({ 
          singleRequest: this.config.enableSRA 
        });
        googletag.enableServices();

        this.log('XadScroll initialized', 'success');
        this.initialized = true;

        this.prepareAdSlots();
        this.checkAndLoadAds();
        this.attachScrollListener();
      });
    }

    prepareAdSlots() {
      const article = document.querySelector(this.config.articleSelector);
      if (!article) {
        this.log('Article element not found', 'error');
        return;
      }

      const headings = article.querySelectorAll(this.config.headingSelector);
      let adsInserted = 0;
      let lastAdPosition = 0;

      headings.forEach((heading, index) => {
        if (index < this.config.skipFirstHeadings) return;
        if (adsInserted >= this.config.maxAdsPerPage) return;

        const currentPosition = this.getElementPosition(heading);
        if (currentPosition - lastAdPosition < this.config.minDistance) return;

        const paragraphsBetween = this.countParagraphsBetween(lastAdPosition, currentPosition);
        if (paragraphsBetween < this.config.minParagraphs) return;

        const contentAfter = this.getContentAfterHeading(heading);
        if (contentAfter.length < this.config.minContentLength) return;

        const placeholder = this.createAdPlaceholder(heading, adsInserted);
        this.adSlots.push({
          id: adsInserted,
          element: placeholder,
          loaded: false
        });

        adsInserted++;
        lastAdPosition = currentPosition;
      });

      this.log(`Prepared ${adsInserted} ad slots`, 'info');
    }

    createAdPlaceholder(heading, index) {
      const placeholder = document.createElement("div");
      placeholder.className = "xadscroll-placeholder";
      placeholder.id = `xadscroll-slot-${index}`;
      placeholder.setAttribute('data-ad-index', index);
      placeholder.innerHTML = `
        <div class="xadscroll-loading">
          <div class="xadscroll-spinner"></div>
        </div>
      `;
      
      heading.insertAdjacentElement('afterend', placeholder);
      return placeholder;
    }

    checkAndLoadAds() {
      const scrollPosition = window.scrollY + window.innerHeight;

      this.adSlots.forEach(slot => {
        if (slot.loaded) return;

        const slotPosition = this.getElementPosition(slot.element);
        const shouldLoad = scrollPosition >= (slotPosition - this.config.lazyLoadMargin);

        if (shouldLoad) {
          this.loadAd(slot);
        }
      });
    }

    loadAd(slot) {
      googletag.cmd.push(() => {
        this.log(`Loading ad ${slot.id}...`, 'info');
        
        const adSize = this.getAdSize();

        const gptSlot = googletag
          .defineSlot(this.adUnit, adSize)
          .addService(googletag.pubads());
        
        if (Object.keys(this.config.targeting).length > 0) {
          gptSlot.setConfig({
            targeting: this.config.targeting
          });
        }

        const adDiv = document.createElement("div");
        adDiv.id = gptSlot.getSlotElementId();
        adDiv.className = "xadscroll-container xadscroll-loaded";
        
        slot.element.replaceWith(adDiv);
        
        googletag.display(gptSlot);
        
        slot.loaded = true;
        slot.gptSlot = gptSlot;
        this.loadedAds.add(slot.id);
        
        this.log(`Ad ${slot.id} loaded (${this.loadedAds.size}/${this.adSlots.length})`, 'success');
      });
    }

    attachScrollListener() {
      let scrollTimeout;
      const handleScroll = () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => this.checkAndLoadAds(), 100);
      };

      window.addEventListener('scroll', handleScroll, { passive: true });
      window.addEventListener('resize', () => this.checkAndLoadAds(), { passive: true });
    }

    getAdSize() {
      if (!this.config.responsive) {
        return this.config.adSize;
      }

      const isMobile = window.innerWidth < this.config.mobileBreakpoint;
      return isMobile ? this.config.mobileAdSize : this.config.adSize;
    }

    getElementPosition(element) {
      return element.getBoundingClientRect().top + window.scrollY;
    }

    countParagraphsBetween(startPos, endPos) {
      const article = document.querySelector(this.config.articleSelector);
      const paragraphs = article.querySelectorAll('p');
      let count = 0;
      
      paragraphs.forEach(p => {
        const pPos = this.getElementPosition(p);
        if (pPos > startPos && pPos < endPos) {
          count++;
        }
      });
      
      return count;
    }

    getContentAfterHeading(heading) {
      let content = '';
      let nextElement = heading.nextElementSibling;
      
      while (nextElement && !nextElement.matches(this.config.headingSelector)) {
        if (nextElement.tagName === 'P') {
          content += nextElement.textContent;
        }
        nextElement = nextElement.nextElementSibling;
      }
      
      return content;
    }

    log(message, type = 'info') {
      if (!this.config.debug) return;

      const styles = {
        info: 'color: #3498db',
        success: 'color: #27ae60',
        warn: 'color: #f39c12',
        error: 'color: #e74c3c'
      };

      console.log(`%c[XadScroll] ${message}`, styles[type] || styles.info);
    }

    refresh() {
      googletag.cmd.push(() => {
        const slots = this.adSlots
          .filter(slot => slot.loaded && slot.gptSlot)
          .map(slot => slot.gptSlot);
        
        if (slots.length > 0) {
          googletag.pubads().refresh(slots);
          this.log(`Refreshed ${slots.length} ads`, 'info');
        }
      });
    }

    destroy() {
      this.adSlots.forEach(slot => {
        if (slot.loaded && slot.gptSlot) {
          googletag.destroySlots([slot.gptSlot]);
        }
        if (slot.element && slot.element.parentNode) {
          slot.element.remove();
        }
      });

      this.adSlots = [];
      this.loadedAds.clear();
      this.log('Destroyed', 'info');
    }
  }

  window.XadScroll = function(adUnit, options) {
    return new XadScroll(adUnit, options);
  };

  const injectCSS = () => {
    if (document.getElementById('xadscroll-styles')) return;

    const style = document.createElement('style');
    style.id = 'xadscroll-styles';
    style.textContent = `
      .xadscroll-placeholder {
        margin: 30px auto;
        padding: 40px 15px;
        background: linear-gradient(135deg, #f8f8f8 0%, #e8e8e8 100%);
        border: 2px dashed #ccc;
        border-radius: 8px;
        text-align: center;
        min-height: 90px;
        display: flex;
        align-items: center;
        justify-content: center;
        max-width: 728px;
      }

      .xadscroll-container {
        margin: 30px auto;
        padding: 15px;
        background: linear-gradient(135deg, #fff9e6 0%, #ffe6cc 100%);
        border: 2px solid #ffb347;
        border-radius: 8px;
        text-align: center;
        min-height: 90px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        max-width: 728px;
      }

      .xadscroll-container.xadscroll-loaded {
        animation: xadscroll-fadeIn 0.5s ease-in;
      }

      @keyframes xadscroll-fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .xadscroll-loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
      }

      .xadscroll-spinner {
        width: 30px;
        height: 30px;
        border: 3px solid #f3f3f3;
        border-top: 3px solid #999;
        border-radius: 50%;
        animation: xadscroll-spin 1s linear infinite;
      }

      @keyframes xadscroll-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      @media (max-width: 768px) {
        .xadscroll-placeholder,
        .xadscroll-container {
          max-width: 300px;
          min-height: 250px;
        }
      }
    `;
    document.head.appendChild(style);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectCSS);
  } else {
    injectCSS();
  }

})(window);
