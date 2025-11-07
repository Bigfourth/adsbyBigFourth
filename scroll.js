  /**
   * XadScroll v5 - Lazy Load Ads on Scroll
   * - Hiển thị ads khi scroll đến vị trí
   * - Chèn sau paragraph trước heading
   * - Chỉ trong khu vực bài viết được chọn
   */

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
        
        // Khu vực bài viết
        articleSelector: 'article',
        
        // Chèn sau element này (thường là <p>)
        insertAfterSelector: 'p',
        
        // Chèn trước element này (thường là <h2>, <h3>)
        insertBeforeSelector: 'h2, h3',
        
        // Khoảng cách tối thiểu giữa các ads (px)
        minDistance: 800,
        
        // Số paragraph tối thiểu giữa các ads
        minParagraphs: 2,
        
        // Bỏ qua n headings đầu tiên
        skipFirstHeadings: 1,
        
        // Số ads tối đa trên trang
        maxAdsPerPage: 5,
        
        // Độ dài nội dung tối thiểu sau heading (ký tự)
        minContentLength: 300,
        
        // Khoảng cách từ viewport để bắt đầu load (px)
        lazyLoadMargin: 300,
        
        // Enable Single Request Architecture
        enableSRA: false,
        
        // Targeting
        targeting: {},
        
        // Debug mode
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
        this.setupGPTEventListeners();
        googletag.enableServices();

        this.log('XadScroll v5 initialized', 'success');
        this.initialized = true;
        
        // Tạo placeholders cho ads
        this.createAdPlaceholders();
        
        // Setup Intersection Observer cho lazy loading
        this.setupLazyLoading();
      });
    }

    setupGPTEventListeners() {
      googletag.pubads().addEventListener('slotRenderEnded', (event) => {
        const slotId = event.slot.getSlotElementId();
        const isEmpty = event.isEmpty;
        this.log(`Slot ${slotId} rendered. Empty: ${isEmpty}`, isEmpty ? 'warn' : 'success');
        
        // Xóa background placeholder khi ad đã load
        const element = document.getElementById(slotId);
        if (element && !isEmpty) {
          element.style.background = 'transparent';
          element.style.border = 'none';
        }
      });

      googletag.pubads().addEventListener('slotOnload', (event) => {
        const slotId = event.slot.getSlotElementId();
        this.log(`Slot ${slotId} loaded`, 'success');
      });
    }

    createAdPlaceholders() {
      const article = document.querySelector(this.config.articleSelector);
      if (!article) {
        this.log(`Article not found: ${this.config.articleSelector}`, 'error');
        return;
      }

      this.log('Creating ad placeholders...', 'info');

      // Tìm tất cả headings trong bài viết
      const headings = article.querySelectorAll(this.config.insertBeforeSelector);
      let adsInserted = 0;
      let lastAdPosition = 0;

      headings.forEach((heading, index) => {
        // Bỏ qua n headings đầu tiên
        if (index < this.config.skipFirstHeadings) return;
        
        // Đã đủ số ads
        if (adsInserted >= this.config.maxAdsPerPage) return;

        const currentPosition = this.getElementPosition(heading);
        
        // Kiểm tra khoảng cách với ad trước đó
        if (currentPosition - lastAdPosition < this.config.minDistance) return;

        // Kiểm tra số paragraphs giữa ad trước và vị trí hiện tại
        const paragraphsBetween = this.countParagraphsBetween(lastAdPosition, currentPosition);
        if (paragraphsBetween < this.config.minParagraphs) return;

        // Kiểm tra độ dài nội dung sau heading
        const contentAfter = this.getContentAfterHeading(heading);
        if (contentAfter.length < this.config.minContentLength) return;

        // Tìm paragraph ngay trước heading này
        const paragraphBefore = this.findParagraphBeforeHeading(heading);
        if (!paragraphBefore) return;

        // Tạo div placeholder cho ad
        const placeholder = document.createElement("div");
        placeholder.id = `xadscroll-ad-${adsInserted}`;
        placeholder.setAttribute('data-ad-index', adsInserted);
        placeholder.setAttribute('data-loaded', 'false');
        
        // Chèn sau paragraph, trước heading
        paragraphBefore.insertAdjacentElement('afterend', placeholder);

        // Lưu thông tin slot
        this.adSlots.push({
          id: adsInserted,
          divId: placeholder.id,
          element: placeholder,
          gptSlot: null,
          loaded: false
        });

        adsInserted++;
        lastAdPosition = currentPosition;
      });

      this.log(`Created ${adsInserted} ad placeholders`, 'success');
    }

    findParagraphBeforeHeading(heading) {
      let element = heading.previousElementSibling;
      
      // Tìm ngược lên để tìm paragraph phù hợp
      while (element) {
        if (element.matches(this.config.insertAfterSelector)) {
          return element;
        }
        element = element.previousElementSibling;
      }
      
      return null;
    }

    setupLazyLoading() {
      // Sử dụng Intersection Observer để detect khi placeholder vào viewport
      const observerOptions = {
        root: null,
        rootMargin: `${this.config.lazyLoadMargin}px`,
        threshold: 0
      };

      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
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
      }, observerOptions);

      // Observe tất cả placeholders
      this.adSlots.forEach(slot => {
        this.observer.observe(slot.element);
      });

      this.log('Lazy loading setup complete', 'success');
    }

    loadAd(adIndex) {
      const slot = this.adSlots[adIndex];
      if (!slot || slot.loaded) return;

      this.log(`Loading ad ${adIndex}...`, 'info');

      googletag.cmd.push(() => {
        // Define slot
        const adSize = this.getAdSize();
        const gptSlot = googletag
          .defineSlot(this.adUnit, adSize, slot.divId)
          .addService(googletag.pubads());

        // Apply targeting
        if (Object.keys(this.config.targeting).length > 0) {
          gptSlot.setConfig({
            targeting: this.config.targeting
          });
        }

        // Display ad
        googletag.display(slot.divId);

        // Update slot info
        slot.gptSlot = gptSlot;
        slot.loaded = true;

        this.log(`Ad ${adIndex} displayed`, 'success');
      });
    }

    getAdSize() {
      if (!this.config.responsive) return this.config.adSize;
      const isMobile = window.innerWidth < this.config.mobileBreakpoint;
      return isMobile ? this.config.mobileAdSize : this.config.adSize;
    }

    getElementPosition(element) {
      return element.getBoundingClientRect().top + window.scrollY;
    }

    countParagraphsBetween(startPos, endPos) {
      const article = document.querySelector(this.config.articleSelector);
      if (!article) return 0;
      
      const paragraphs = article.querySelectorAll(this.config.insertAfterSelector);
      let count = 0;
      
      paragraphs.forEach(p => {
        const pPos = this.getElementPosition(p);
        if (pPos > startPos && pPos < endPos) count++;
      });
      
      return count;
    }

    getContentAfterHeading(heading) {
      let content = '';
      let nextElement = heading.nextElementSibling;
      
      while (nextElement && !nextElement.matches(this.config.insertBeforeSelector)) {
        if (nextElement.matches(this.config.insertAfterSelector)) {
          content += nextElement.textContent;
        }
        nextElement = nextElement.nextElementSibling;
      }
      
      return content;
    }

    refresh() {
      googletag.cmd.push(() => {
        const loadedSlots = this.adSlots
          .filter(s => s.loaded && s.gptSlot)
          .map(s => s.gptSlot);
        
        if (loadedSlots.length > 0) {
          googletag.pubads().refresh(loadedSlots);
          this.log(`Refreshed ${loadedSlots.length} ads`, 'success');
        }
      });
    }

    log(message, type = 'info') {
      if (!this.config.debug) return;
      const styles = {
        info: 'color: #3498db',
        success: 'color: #27ae60',
        warn: 'color: #f39c12',
        error: 'color: #e74c3c'
      };
      console.log(`%c[XadScroll v5] ${message}`, styles[type] || styles.info);
    }

    destroy() {
      if (this.observer) {
        this.observer.disconnect();
      }

      this.adSlots.forEach(slot => {
        if (slot.gptSlot) {
          googletag.destroySlots([slot.gptSlot]);
        }
        if (slot.element && slot.element.parentNode) {
          slot.element.parentNode.removeChild(slot.element);
        }
      });

      this.adSlots = [];
      this.log('Destroyed', 'info');
    }
  }

  window.XadScroll = function(adUnit, options) {
    return new XadScroll(adUnit, options);
  };

})(window);
