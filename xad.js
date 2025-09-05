//=================================================
// GPT Script Loader
//=================================================
const ensureGPTScript = () => {
  if (!document.head.querySelector('script[src="https://securepubads.g.doubleclick.net/tag/js/gpt.js"]')) {
    const script = document.createElement("script");
    script.src = "https://securepubads.g.doubleclick.net/tag/js/gpt.js";
    script.async = true;
    document.head.appendChild(script);
    return false;
  }
  return true;
};

//=================================================
// Adsense Script Loader
//=================================================
const ensureAdsenseScript = (clientId) => {
  const selector = `script[src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}"]`;
  if (!document.head.querySelector(selector)) {
    const script = document.createElement("script");
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`;
    script.async = true;
    script.crossOrigin = "anonymous";
    document.head.appendChild(script);
    return false;
  }
  return true;
};

//=================================================
// Random ID Generator for Ad Slots
//=================================================
const usedIDs = new Set();
const generateRandomID = () => {
  let id;
  do {
    id = "xad-gpt-ad-" + Math.random().toString().slice(2) + "-0";
  } while (usedIDs.has(id));
  usedIDs.add(id);
  return id;
};

//=================================================
// Helper to Insert Ad HTML and Initialize GPT Ad Slot
//=================================================
const insertAdSlot = (adUnit, adSize, elementSelector, insertPosition = "beforeend", mapping = [], setMinSize = false) => {
  const element = document.body.querySelector(elementSelector);
  if (!element) return;

  ensureGPTScript();

  const gptId = generateRandomID();
  window.googletag = window.googletag || { cmd: [] };

  googletag.cmd.push(() => {
    const adSlot = googletag.defineSlot(adUnit, adSize, gptId).addService(googletag.pubads());

    if (mapping.length) {
      const sizeMapping = googletag.sizeMapping();
      mapping.forEach(({ breakpoint, size }) => {
        const sizeArr = Array.isArray(size) ? size : [size];
        sizeMapping.addSize(breakpoint, sizeArr);
      });
      adSlot.defineSizeMapping(sizeMapping.build());
    }

    googletag.pubads().enableSingleRequest();
    googletag.enableServices();
  });

  let styleMin = "";
  if (setMinSize) {
    const sizes = Array.isArray(adSize[0]) ? adSize : [adSize];
    const minWidth = Math.min(...sizes.map(s => s[0]));
    const minHeight = Math.min(...sizes.map(s => s[1]));
    styleMin = `min-width: ${minWidth}px; min-height: ${minHeight}px;`;
  }

  const html = `
    <div class="xad-banner-ad">
      <center><div id="${gptId}" style="${styleMin}"></div></center>
    </div>`;

  element.insertAdjacentHTML(insertPosition, html);

  googletag.cmd.push(() => googletag.display(gptId));
};

//=================================================
// Ad Slot - Display Single Banner
// Params: 
//   _adUnit: string
//   _adSize: [width, height] or array array
//   _mapping: [{breakpoint, size}], optional
//   _element: string selector where to insert
//   _insertPosition: string 'beforeend', 'afterbegin', etc.
//   _setMin: boolean, if true sets min-width/min-height for div
//=================================================
function XadAdx(_adUnit, _adSize, _mapping = [], _element, _insertPosition = "beforeend", _set_min = false) {
  insertAdSlot(_adUnit, _adSize, _element, _insertPosition, _mapping, _set_min);
}

//=================================================
// Interstitial Ad
//=================================================
function XadAdxInterstitial(_adUnit) {
  ensureGPTScript();
  window.googletag = window.googletag || { cmd: [] };
  googletag.cmd.push(() => {
    const slot = googletag.defineOutOfPageSlot(_adUnit, googletag.enums.OutOfPageFormat.INTERSTITIAL);
    if (slot) {
      slot.addService(googletag.pubads());
      googletag.pubads().enableSingleRequest();
      googletag.enableServices();
      googletag.display(slot);
    }
  });
}

//=================================================
// Auto Ads between elements with scroll and viewport handling
//=================================================
function XadAdxAutoAds(_adUnit, _start, _end, _adSize, _mapping = [], _elements, _insertPosition = 2, _set_min = false, _minScreen = 1, _position_start = 0, _position_end = 0) {
  const elements = document.querySelectorAll(_elements);
  if (!elements.length) return;

  const lastSpaceIndex = _elements.lastIndexOf(' ');
  const _elementStr =
    lastSpaceIndex === -1
      ? _elements
      : `${_elements.slice(0, lastSpaceIndex).trim()} > ${_elements.slice(lastSpaceIndex + 1).trim()}`;

  let minAd = 0;
  let position = 1;

  for (let i = 0; i < elements.length; i++) {
    if (_start > _end) break;
    const elSelector = `${_elementStr}:nth-of-type(${i + 1})`;

    if (_insertPosition === 0 || _insertPosition === 3) {
      if (
        i === 0 ||
        elements[i].offsetTop + elements[i].clientHeight - minAd - screen.height * _minScreen >= 0
      ) {
        if (_position_start <= position++) {
          const adUnit = _adUnit + _start++;
          XadAdx(adUnit, _adSize, _mapping, elSelector, _insertPosition, _set_min);
          if (_position_end !== 0 && _position_end < position) break;
        }
        if (i < elements.length - 1) minAd = elements[i + 1].offsetTop;
      }
    } else if (_insertPosition === 1 || _insertPosition === 2) {
      if (i === 0 || elements[i].offsetTop - minAd - screen.height * _minScreen >= 0) {
        if (_position_start <= position++) {
          const adUnit = _adUnit + _start++;
          XadAdx(adUnit, _adSize, _mapping, elSelector, _insertPosition, _set_min);
          if (_position_end !== 0 && _position_end < position) break;
        }
        minAd = elements[i].offsetTop;
        if (i < elements.length - 1) continue;
      }
      if (
        i === elements.length - 1 &&
        elements[i].offsetTop + elements[i].clientHeight - minAd - screen.height * _minScreen >= 0
      ) {
        const adUnit = _adUnit + _start++;
        XadAdx(adUnit, _adSize, _mapping, elSelector, _insertPosition === 1 ? "beforeend" : "afterend", _set_min);
      }
    }
  }
}

//=================================================
// Sticky Ads (bottom or top anchor based on screen width and position)
//=================================================
function XadAdxSticky(_adUnit, _adPosition = 0) {
  ensureGPTScript();
  window.googletag = window.googletag || { cmd: [] };
  googletag.cmd.push(() => {
    const slot = googletag.defineOutOfPageSlot(
      _adUnit,
      document.body.clientWidth < 768 && _adPosition !== 0
        ? googletag.enums.OutOfPageFormat.TOP_ANCHOR
        : googletag.enums.OutOfPageFormat.BOTTOM_ANCHOR
    );
    if (slot) {
      slot.addService(googletag.pubads());
      googletag.pubads().enableSingleRequest();
      googletag.enableServices();
      googletag.display(slot);
    }
  });
}

//=================================================
// In-image ad under a specified image
//=================================================
function XadAdxInImage(_adUnit, _adSize, _mapping = [], _element, _imageIndex = 1, _marginBottom = 0) {
  const images = document.body.querySelectorAll(_element);
  const image = images[_imageIndex - 1];
  if (!image) return;

  ensureGPTScript();
  const gptId = generateRandomID();
  window.googletag = window.googletag || { cmd: [] };

  googletag.cmd.push(() => {
    const adSlot = googletag.defineSlot(_adUnit, _adSize, gptId).addService(googletag.pubads());
    if (_mapping.length) {
      const sizeMapping = googletag.sizeMapping();
      _mapping.forEach(({ breakpoint, size }) => {
        const sizeArr = Array.isArray(size) ? size : [size];
        sizeMapping.addSize(breakpoint, sizeArr);
      });
      adSlot.defineSizeMapping(sizeMapping.build());
    }
    googletag.pubads().enableSingleRequest();
    googletag.enableServices();
  });

  // Create ad container
  const container = document.createElement("div");
  container.className = "xad-inimage-ad";
  container.style.position = "relative";

  const adWrapper = document.createElement("div");
  adWrapper.style.cssText = `position:absolute;bottom:${_marginBottom}px;z-index:10;width:100%;`;

  const centerDiv = document.createElement("center");
  const adDiv = document.createElement("div");
  adDiv.id = gptId;

  const closeBtn = document.createElement("span");
  closeBtn.innerHTML = "×";
  closeBtn.style.cssText =
    "position:absolute;display:none;z-index:1;width:25px;height:25px;right:2px;top:-27px;cursor:pointer;font-size:20px;text-align:center;background:white;padding:2px;border-radius:20px;line-height:1;";

  centerDiv.appendChild(adDiv);
  adWrapper.appendChild(centerDiv);
  adWrapper.appendChild(closeBtn);
  container.appendChild(adWrapper);

  image.insertAdjacentElement("afterend", container);

  googletag.cmd.push(() => googletag.display(gptId));

  let timeout = 0;
  const interval = setInterval(() => {
    const iframeAd = adDiv.querySelector("iframe");
    if (iframeAd && iframeAd.getAttribute("data-load-complete") === "true") {
      closeBtn.style.display = "block";
      clearInterval(interval);
    }
    if (++timeout > 600) clearInterval(interval);
  }, 1000);

  closeBtn.addEventListener("click", () => {
    container.style.visibility = "hidden";
  });
}

//=================================================
// In multiple selected images
//=================================================
function XadAdxInImages(_adUnit, _start, _end, _adSize, _mapping = [], _element, _imageIndexes = [], _marginBottom = 0) {
  const images = document.body.querySelectorAll(_element);
  if (!images.length) return;
  for (let i = 1; i <= images.length; i++) {
    if (_start > _end) break;
    if (_imageIndexes.length > 0 && !_imageIndexes.includes(i)) continue;
    const adUnit = _adUnit + _start++;
    XadAdxInImage(adUnit, _adSize, _mapping, _element, i, _marginBottom);
  }
}

//=================================================
// In-page mobile ad with scroll behavior
//=================================================
function XadAdxInPage(_adUnit, _element, _marginTop = -1) {
  if (window.innerWidth >= 768) return;

  const adWidth = 300;
  const adHeight = 600;
  const gptId = generateRandomID();

  ensureGPTScript();

  window.googletag = window.googletag || { cmd: [] };
  googletag.cmd.push(() => {
    googletag.defineSlot(_adUnit, [adWidth, adHeight], gptId).addService(googletag.pubads());
    googletag.pubads().enableSingleRequest();
    googletag.enableServices();
  });

  const parent = document.querySelectorAll(_element)[0];
  if (!parent) return;

  const midpoint = Math.min(Math.floor(parent.childElementCount / 2), 4);
  parent.children[midpoint - 1]?.insertAdjacentHTML("afterend", "<div id='xad-inpage-ad'></div>");

  const html = `
    <div id="inpage-content-ad" style="overflow:hidden;position:relative;z-index:2;width:100%;">
      <div id="inpage-ad" style="display:none;">
        <div id="${gptId}" style="min-width:${adWidth}px;min-height:${adHeight}px;"></div>
      </div>
    </div>`;

  document.getElementById("xad-inpage-ad")?.insertAdjacentHTML("beforeend", html);

  googletag.cmd.push(() => {
    googletag.display(gptId);
  });

  window.addEventListener("scroll", () => {
    const container = document.getElementById("inpage-content-ad");
    if (!container) return;

    const marginTop = _marginTop >= 0 ? _marginTop : (window.innerHeight - adHeight) / 2;
    const rect = container.getBoundingClientRect();
    const top = rect.top - marginTop;
    const bottom = top > 0 ? adHeight : adHeight + top;

    if (window.innerWidth < 768) {
      container.style.height = adHeight + "px";
      const adBlock = document.getElementById("inpage-ad");
      if (adBlock) {
        adBlock.style.cssText = `
          display:block;
          clip: rect(${top}px, ${adWidth}px, ${bottom}px, 0px);
          left:${(window.innerWidth - adWidth) / 2}px;
          top:${marginTop}px;
          position:fixed;
          z-index:10000;`;
      }
    }
  });
}

//=================================================
// Multiple size ads helper (mobile only)
//=================================================
function MultipleSizeAdd(_adUnit, _element, _insertPosition = "beforeend") {
  const element = document.body.querySelector(_element);
  if (!element) return;

  ensureGPTScript();

  const gptId = generateRandomID();
  const adSizes = [
    [300, 250],
    [300, 600]
  ];

  window.googletag = window.googletag || { cmd: [] };
  googletag.cmd.push(() => {
    googletag.defineSlot(_adUnit, adSizes, gptId).addService(googletag.pubads());
    googletag.pubads().enableSingleRequest();
    googletag.enableServices();
  });

  const html = `
    <div class="xad-multiplesize" style="margin:10px calc(50% - 50vw);">
      <span style="display:inline-block;width:100%;font-size:14px;text-align:center;color:#9e9e9e;background-color:#f1f1f1;">Ads By Xad</span>
      <div class="ms-content-ad" style="position:relative;min-height:600px;">
        <center class="ms-ad">
          <div id="${gptId}"></div>
        </center>
      </div>
      <span style="display:inline-block;width:100%;font-size:14px;text-align:center;color:#9e9e9e;background-color:#f1f1f1;">Scroll to Continue</span>
    </div>`;

  element.insertAdjacentHTML(_insertPosition, html);

  googletag.cmd.push(() => googletag.display(gptId));
}

function MultipleSizeScroll(_marginTop) {
  document.addEventListener("scroll", () => {
    const elements = document.getElementsByClassName("xad-multiplesize");
    for (const e of elements) {
      const msAd = e.querySelector(".ms-ad");
      const contentAd = e.querySelector(".ms-content-ad");
      if (!msAd || !contentAd) continue;

      const h = contentAd.clientHeight;
      const ch = msAd.clientHeight;
      const ap = contentAd.getBoundingClientRect().top;

      if (ch < h) {
        if (ap >= _marginTop) {
          msAd.style.position = "";
          msAd.style.top = "";
          msAd.style.bottom = "";
          msAd.style.left = "";
          msAd.style.transform = "";
        } else if (ap < _marginTop && Math.abs(ap) + ch < h - _marginTop) {
          msAd.style.position = "fixed";
          msAd.style.top = `${_marginTop}px`;
          msAd.style.bottom = "";
          msAd.style.left = "50%";
          msAd.style.transform = "translateX(-50%)";
        } else if (Math.abs(ap) + ch >= h - _marginTop) {
          msAd.style.position = "absolute";
          msAd.style.top = "";
          msAd.style.bottom = "0";
          msAd.style.left = "50%";
          msAd.style.transform = "translateX(-50%)";
        }
      } else {
        msAd.style.position = "";
        msAd.style.top = "";
        msAd.style.bottom = "";
        msAd.style.left = "";
        msAd.style.transform = "";
      }
    }
  });
}

function XadAdxMultipleSize(_adUnit, _element, _insertPosition = "beforeend", _marginTop = 0) {
  if (window.innerWidth >= 768) return;
  MultipleSizeAdd(_adUnit, _element, _insertPosition);
  MultipleSizeScroll(_marginTop);
}

function XadAdxMultipleSizes(
  _adUnit,
  _start,
  _end,
  _elements,
  _insertPosition = 2,
  _marginTop = 0,
  _minScreen = 1,
  _position_start = 0,
  _position_end = 0
) {
  if (window.innerWidth >= 768) return;
  const elements = document.querySelectorAll(_elements);
  if (!elements.length) return;

  const lastSpaceIndex = _elements.lastIndexOf(" ");
  const elementStr =
    lastSpaceIndex === -1 ? _elements : `${_elements.slice(0, lastSpaceIndex).trim()} > ${_elements.slice(lastSpaceIndex + 1).trim()}`;

  let minAd = 0;
  let position = 1;

  for (let i = 0; i < elements.length; i++) {
    if (_start > _end) break;
    const elSelector = `${elementStr}:nth-of-type(${i + 1})`;

    if (_insertPosition === 0 || _insertPosition === 3) {
      if (i === 0 || elements[i].offsetTop + elements[i].clientHeight - minAd - screen.height * _minScreen >= 0) {
        if (_position_start <= position++) {
          const adUnit = _adUnit + _start++;
          MultipleSizeAdd(adUnit, elSelector, _insertPosition);
          if (_position_end !== 0 && _position_end < position) break;
        }
        if (i < elements.length - 1) minAd = elements[i + 1].offsetTop;
      }
    } else if (_insertPosition === 1 || _insertPosition === 2) {
      if (i === 0 || elements[i].offsetTop - minAd - screen.height * _minScreen >= 0) {
        if (_position_start <= position++) {
          const adUnit = _adUnit + _start++;
          MultipleSizeAdd(adUnit, elSelector, _insertPosition);
          if (_position_end !== 0 && _position_end < position) break;
        }
        minAd = elements[i].offsetTop;
        if (i < elements.length - 1) continue;
      }
      if (i === elements.length - 1 && elements[i].offsetTop + elements[i].clientHeight - minAd - screen.height * _minScreen >= 0) {
        const adUnit = _adUnit + _start++;
        MultipleSizeAdd(adUnit, elSelector, _insertPosition === 1 ? "beforeend" : "afterend");
      }
    }
  }
  MultipleSizeScroll(_marginTop);
}

//=================================================
// First View Full Page Ad for Mobile only
//=================================================
function XadAdxFirstView(_adUnit, _adSize = [300, 600]) {
  if (window.innerWidth >= 768) return;

  ensureGPTScript();
  const gptId = generateRandomID();

  window.googletag = window.googletag || { cmd: [] };
  googletag.cmd.push(() => {
    googletag.defineSlot(_adUnit, _adSize, gptId).addService(googletag.pubads());
    googletag.pubads().enableSingleRequest();
    googletag.enableServices();
  });

  const html = `
    <div class="xad-firstview" style="display:block;position:fixed;width:100%;height:100vh;top:0;left:0;text-align:center;opacity:1;background-color:rgba(255,255,255,0.7);visibility:hidden;z-index:2147483647;">
      <div class="xad-firstview-close" style="display:none;position:absolute;width:60px;height:25px;top:80px;right:0;cursor:pointer;background:rgba(183,183,183,0.71);padding:2px;border-radius:20px 0 0 20px;z-index:9999;">
        <span style="position:absolute;font-size:15px;top:50%;left:50%;transform:translate(-50%, -50%);">close</span>
      </div>
      <div id="${gptId}" style="position:absolute;top:50%;left:50%;transform:translate(-50%, -50%);"></div>
    </div>`;

  document.body.insertAdjacentHTML("beforeend", html);

  googletag.cmd.push(() => googletag.display(gptId));

  const closeBtn = document.body.querySelector(".xad-firstview-close");
  const firstViewDiv = document.body.querySelector(".xad-firstview");

  closeBtn?.addEventListener("click", () => {
    firstViewDiv.style.display = "none";
  });

  let timer = 0;
  const interval = setInterval(() => {
    const iframe = document.getElementById(gptId)?.querySelector("iframe");
    if (iframe && iframe.getAttribute("data-load-complete") === "true") {
      firstViewDiv.style.visibility = "visible";
      closeBtn.style.display = "block";
      clearInterval(interval);
    }
    if (++timer > 600) clearInterval(interval);
  }, 1000);
}

//=================================================
// FirstView Extended (with pageView count and mobile/desktop display options)
//=================================================
function XadAdxFirstViewExt(_adUnit, _adSize = [300, 600], _isDisplay = 0, _pageView = [0]) {
  if ((_isDisplay === 1 && window.innerWidth < 768) || (_isDisplay === 2 && window.innerWidth >= 768)) return;

  let pageViewCount = parseInt(localStorage.getItem("pageViewCount")) || 0;
  const now = Date.now();
  if (pageViewCount === 0) {
    localStorage.setItem("expiry", now);
  } else if (now - Number(localStorage.getItem("expiry") || now) > 180000) {
    pageViewCount = 0;
    localStorage.setItem("expiry", now);
  }

  if (!Array.isArray(_pageView)) _pageView = [0];
  localStorage.setItem("pageViewCount", ++pageViewCount);

  if (_pageView.length !== 1 || !_pageView.includes(0)) {
    if (!_pageView.includes(pageViewCount)) return;
  }

  ensureGPTScript();

  const gptId = generateRandomID();
  window.googletag = window.googletag || { cmd: [] };
  googletag.cmd.push(() => {
    googletag.defineSlot(_adUnit, _adSize, gptId).addService(googletag.pubads());
    googletag.pubads().enableSingleRequest();
    googletag.enableServices();
  });

  const html = `
    <div class="xad-firstview" style="display:block;position:fixed;width:100%;height:100vh;top:0;left:0;text-align:center;opacity:1;background-color:rgba(255,255,255,0.7);visibility:hidden;z-index:2147483647;">
      <div class="xad-firstview-close" style="display:none;position:absolute;width:85px;height:25px;top:80px;right:0;cursor:pointer;background:rgba(0,112,186,1);padding:2px;border-radius:20px 0 0 20px;z-index:9999;">
        <span style="position:absolute;font-size:15px;top:50%;left:50%;transform:translate(-50%, -50%);color:white;">CLOSE</span>
      </div>
      <div id="${gptId}" style="position:absolute;top:50%;left:50%;transform:translate(-50%, -50%);"></div>
    </div>`;

  document.body.insertAdjacentHTML("beforeend", html);

  googletag.cmd.push(() => googletag.display(gptId));

  const closeBtn = document.body.querySelector(".xad-firstview-close");
  const firstViewDiv = document.body.querySelector(".xad-firstview");

  closeBtn?.addEventListener("click", () => {
    firstViewDiv.style.display = "none";
  });

  let timer = 0;
  const interval = setInterval(() => {
    const iframe = document.getElementById(gptId)?.querySelector("iframe");
    if (iframe && iframe.getAttribute("data-load-complete") === "true") {
      firstViewDiv.style.visibility = "visible";
      closeBtn.style.display = "block";
      clearInterval(interval);
    }
    if (++timer > 600) clearInterval(interval);
  }, 1000);
}

//=================================================
// Rewarded Ads
//=================================================
function XadAdxRewarded(_adUnit) {
  ensureGPTScript();
  window.googletag = window.googletag || { cmd: [] };

  let rewardedSlot;
  let rewardPayload;

  googletag.cmd.push(() => {
    rewardedSlot = googletag.defineOutOfPageSlot(_adUnit, googletag.enums.OutOfPageFormat.REWARDED);
    if (rewardedSlot) {
      rewardedSlot.addService(googletag.pubads());

      googletag.pubads().addEventListener("rewardedSlotReady", (event) => {
        event.makeRewardedVisible();
      });

      googletag.pubads().addEventListener("rewardedSlotClosed", () => {
        rewardPayload = null;
        if (rewardedSlot) googletag.destroySlots([rewardedSlot]);
        window.xad_rewarded_done = true;
      });

      googletag.pubads().addEventListener("rewardedSlotGranted", (event) => {
        rewardPayload = event.payload;
      });

      googletag.pubads().addEventListener("slotRenderEnded", (event) => {
        if (event.slot === rewardedSlot && event.isEmpty) {
          window.xad_rewarded_done = true;
        }
      });

      googletag.enableServices();
      googletag.display(rewardedSlot);
    } else {
      window.xad_rewarded_done = true;
    }
  });
}

function XadAdxRewardedExt(_adUnit, _isDisplay = 0, _pageView = [0]) {
  if ((_isDisplay === 1 && window.innerWidth < 768) || (_isDisplay === 2 && window.innerWidth >= 768)) return;

  let pageViewCount = parseInt(localStorage.getItem("pageViewCount")) || 0;
  const now = Date.now();
  if (pageViewCount === 0) {
    localStorage.setItem("expiry", now);
  } else if (now - Number(localStorage.getItem("expiry") || now) > 180000) {
    pageViewCount = 0;
    localStorage.setItem("expiry", now);
  }

  if (!Array.isArray(_pageView)) _pageView = [0];
  localStorage.setItem("pageViewCount", ++pageViewCount);

  if (_pageView.length !== 1 || !_pageView.includes(0)) {
    if (!_pageView.includes(pageViewCount)) return;
  }

  ensureGPTScript();

  let rewardedSlot;
  let rewardPayload;

  window.googletag = window.googletag || { cmd: [] };
  googletag.cmd.push(() => {
    rewardedSlot = googletag.defineOutOfPageSlot(_adUnit, googletag.enums.OutOfPageFormat.REWARDED);
    if (rewardedSlot) {
      rewardedSlot.addService(googletag.pubads());

      googletag.pubads().addEventListener("rewardedSlotReady", (event) => {
        event.makeRewardedVisible();
      });

      googletag.pubads().addEventListener("rewardedSlotClosed", () => {
        rewardPayload = null;
        if (rewardedSlot) googletag.destroySlots([rewardedSlot]);
        window.xad_rewarded_done = true;
      });

      googletag.pubads().addEventListener("rewardedSlotGranted", (event) => {
        rewardPayload = event.payload;
      });

      googletag.pubads().addEventListener("slotRenderEnded", (event) => {
        if (event.slot === rewardedSlot && event.isEmpty) {
          window.xad_rewarded_done = true;
        }
      });

      googletag.enableServices();
      googletag.display(rewardedSlot);
    } else {
      window.xad_rewarded_done = true;
    }
  });
}

//=================================================
// Catfish Sticky Banner (bottom bar banner visible after scroll and closable)
//=================================================
function XadAdxCatfish(_adUnit, _adSize = [320, 100], _isDisplay = 0, _pageView = [0], _bottom = 0) {
  if ((_isDisplay === 1 && window.innerWidth < 768) || (_isDisplay === 2 && window.innerWidth >= 768)) return;

  let pageViewCount = parseInt(localStorage.getItem("pageViewCount")) || 0;
  const now = Date.now();
  if (pageViewCount === 0) {
    localStorage.setItem("expiry", now);
  } else if (now - Number(localStorage.getItem("expiry") || now) > 180000) {
    pageViewCount = 0;
    localStorage.setItem("expiry", now);
  }

  if (!Array.isArray(_pageView)) _pageView = [0];
  localStorage.setItem("pageViewCount", ++pageViewCount);

  if (_pageView.length !== 1 || !_pageView.includes(0)) {
    if (!_pageView.includes(pageViewCount)) return;
  }

  ensureGPTScript();

  const gptId = generateRandomID();

  const html = `
    <div id="catfish-ad" class="catfish-hidden" style="position:fixed;bottom:-120px;left:0;width:100%;height:100px;background:#fff;z-index:1000;box-shadow:0 -2px 5px rgba(0, 0, 0, 0.2);transition:bottom 1.1s ease-in-out;display:flex;justify-content:center;align-items:center;bottom:${_bottom}px;">
      <button id="close-catfish" style="position:absolute;top:0;right:0;background:#D6DCD9;border:none;color:#BBC4BF;font-size:18px;cursor:pointer;width:20px;height:20px;">×</button>
      <div id="div-gpt-ad" style="min-width:${_adSize[0]}px;min-height:${_adSize[1]}px;"></div>
    </div>`;

  document.body.insertAdjacentHTML("beforeend", html);

  window.googletag = window.googletag || { cmd: [] };
  googletag.cmd.push(() => {
    googletag.defineSlot(_adUnit, _adSize, gptId).addService(googletag.pubads());
    googletag.pubads().enableSingleRequest();
    googletag.enableServices();
  });
  googletag.cmd.push(() => googletag.display(gptId));

  let isVisible = false;
  const catfishAd = document.getElementById("catfish-ad");
  const closeBtn = document.getElementById("close-catfish");

  window.addEventListener("scroll", () => {
    const iframe = document.getElementById(gptId)?.querySelector("iframe");
    if (window.scrollY > window.innerHeight * 1.5 && !isVisible && iframe?.getAttribute("data-load-complete") === "true") {
      catfishAd.style.display = "flex";
      isVisible = true;
    } else if (window.scrollY <= window.innerHeight * 1.5 && isVisible) {
      catfishAd.style.display = "none";
      isVisible = false;
    }
  });

  closeBtn?.addEventListener("click", () => {
    catfishAd.style.display = "none";
  });

  const style = document.createElement("style");
  style.innerHTML = `.catfish-hidden { display:none; }`;
  document.head.appendChild(style);
}

//=================================================
// Adsense banner (insertion with optional responsiveness)
//=================================================
function XadAdsense(_adClient, _adSlot, _adSize = [], _responsive = false, _element, _insertPosition = "beforeend") {
  const element = document.body.querySelector(_element);
  if (!element) return;

  ensureAdsenseScript(_adClient);

  const [adWidth, adHeight] = _adSize;
  const insAttributes = _responsive
    ? `
      style="display:block"
      data-ad-client="${_adClient}"
      data-ad-slot="${_adSlot}"
      data-ad-format="auto"
      data-full-width-responsive="true"`
    : `
      style="display:inline-block;width:${adWidth}px;height:${adHeight}px"
      data-ad-client="${_adClient}"
      data-ad-slot="${_adSlot}"`;

  const html = `
    <div class="xad-banner-ad">
      <center>
        <ins class="adsbygoogle"${insAttributes}></ins>
      </center>
    </div>`;

  element.insertAdjacentHTML(_insertPosition, html);

  (adsbygoogle = window.adsbygoogle || []).push({});
}

//=================================================
// Adsense InPage Mobile Ad with scroll effect
//=================================================
function XadAdsenseInPage(_adClient, _adSlot, _element, _marginTop = -1) {
  if (window.innerWidth >= 768) return;
  const adWidth = 300;
  const adHeight = 600;

  ensureAdsenseScript(_adClient);
  const parent = document.querySelectorAll(_element)[0];
  if (!parent) return;

  const midpoint = Math.min(Math.floor(document.querySelectorAll(_element).length / 2), 4);
  parent.children[midpoint - 1]?.insertAdjacentHTML("afterend", "<div id='xad-inpage-ad'></div>");

  const html = `
    <div id="inpage-content-ad" style="overflow:hidden;position:relative;z-index:2;width:100%;">
      <div id="inpage-ad" style="display:none;">
        <ins class="adsbygoogle" style="display:inline-block;width:${adWidth}px;height:${adHeight}px" data-ad-client="${_adClient}" data-ad-slot="${_adSlot}"></ins>
      </div>
    </div>`;

  document.getElementById("xad-inpage-ad")?.insertAdjacentHTML("beforeend", html);
  (adsbygoogle = window.adsbygoogle || []).push({});

  window.addEventListener("scroll", () => {
    const container = document.getElementById("inpage-content-ad");
    if (!container) return;

    const marginTop = _marginTop >= 0 ? _marginTop : (window.innerHeight - adHeight) / 2;
    const rect = container.getBoundingClientRect();
    const top = rect.top - marginTop;
    const bottom = top > 0 ? adHeight : adHeight + top;

    if (window.innerWidth < 768) {
      container.style.height = adHeight + "px";
      const adBlock = document.getElementById("inpage-ad");
      if (adBlock) {
        adBlock.style.cssText = `
          display:block;
          clip: rect(${top}px, ${adWidth}px, ${bottom}px, 0px);
          left:${(window.innerWidth - adWidth) / 2}px;
          top:${marginTop}px;
          position:fixed;
          z-index:10000;`;
      }
    }
  });
}

//=================================================
// Adsense First View (full page mobile)
//=================================================
function XadAdsenseFirstView(_adClient, _adSlot, _adSize = [300, 600]) {
  if (window.innerWidth >= 768) return;

  ensureAdsenseScript(_adClient);

  const [adWidth, adHeight] = _adSize;
  const html = `
    <div class="xad-firstview" style="display:block;position:fixed;width:100%;height:100vh;top:0;left:0;text-align:center;opacity:1;background-color:rgba(255,255,255,0.7);visibility:hidden;z-index:2147483647;">
      <div class="xad-firstview-close" style="display:none;position:absolute;width:160px;height:30px;top:5%;right:0;cursor:pointer;background:rgba(183,183,183,0.71);padding:2px;border-radius:20px 0 0 20px;z-index:9999;">
        <span style="position:absolute;font-size:20px;top:50%;left:50%;transform:translate(-50%,-50%);">Close</span>
      </div>
      <ins class="adsbygoogle" style="display:inline-block;width:${adWidth}px;height:${adHeight}px;position:absolute;top:50%;left:50%;transform:translate(-50%, -50%);" data-ad-client="${_adClient}" data-ad-slot="${_adSlot}"></ins>
    </div>`;

  document.body.insertAdjacentHTML("beforeend", html);
  (adsbygoogle = window.adsbygoogle || []).push({});

  const closeBtn = document.body.querySelector(".xad-firstview-close");
  const firstViewDiv = document.body.querySelector(".xad-firstview");

  closeBtn?.addEventListener("click", () => {
    firstViewDiv.style.display = "none";
  });

  let timer = 0;
  const interval = setInterval(() => {
    const ins = document.querySelector(".xad-firstview ins");
    if (ins?.getAttribute("data-ad-status") === "filled") {
      firstViewDiv.style.visibility = "visible";
      closeBtn.style.display = "block";
      clearInterval(interval);
    }
    if (++timer > 600) clearInterval(interval);
  }, 1000);
}
