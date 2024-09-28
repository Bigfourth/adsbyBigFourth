function BFAdx(adUnit, adSize, mapping = [], elementSelector, insertPosition = 0, setMin = 0) {
  var element = document.body.querySelector(elementSelector);
  if (!element) return;

  checkGPTExists();
  window.googletag = window.googletag || { cmd: [] };
  var gptId = randomID();

  googletag.cmd.push(function() {
    var adSlot = googletag.defineSlot(adUnit, adSize, gptId).addService(googletag.pubads());

    if (mapping.length) {
      var sizeMapping = googletag.sizeMapping();
      mapping.forEach(function({ breakpoint, size }) {
        sizeMapping.addSize(breakpoint, Array.isArray(size) ? size : [size]);
      });
      adSlot.defineSizeMapping(sizeMapping.build());
    }

    googletag.pubads().enableSingleRequest();
    googletag.enableServices();
  });

  var minDimensions = setMin ? (Array.isArray(adSize[0]) || Array.isArray(adSize[1]) ? 
    adSize.reduce(function([minW, minH], [w, h]) {
      return [Math.min(minW, w), Math.min(minH, h)];
    }, [Infinity, Infinity]) : 
    adSize) : 
    [0, 0];

  var styleMin = 'min-width: ' + minDimensions[0] + 'px; min-height: ' + minDimensions[1] + 'px;';
  var adHtml = '<div class="bfv-banner-ad"><center><div id="' + gptId + '" style="' + styleMin + '"></div></center></div>';

  var insertMethods = ['beforeend', 'afterbegin', 'beforebegin', 'afterend'];
  element.insertAdjacentHTML(insertMethods[insertPosition] || insertMethods[0], adHtml);

  googletag.cmd.push(function() {
    googletag.display(gptId);
  });
}
function BFAdxInterstitial(adUnit) {
  checkGPTExists();
  window.googletag = window.googletag || { cmd: [] };

  googletag.cmd.push(function() {
    var interstitialSlot = googletag.defineOutOfPageSlot(adUnit, googletag.enums.OutOfPageFormat.INTERSTITIAL);
    
    if (interstitialSlot) {
      interstitialSlot.addService(googletag.pubads());
    }

    googletag.pubads().enableSingleRequest();
    googletag.enableServices();
    googletag.display(interstitialSlot);
  });
}
function BFAdxAutoAds(adUnit, start, end, adSize, mapping = [], elements, insertPosition = 2, setMin = 0, minScreen = 1, positionStart = 0, positionEnd = 0) {
  var elementsList = document.querySelectorAll(elements);
  if (elementsList.length == 0) return;

  var lastSpaceIndex = elements.lastIndexOf(' ');
  var elementStr = lastSpaceIndex === -1 ? elements : elements.slice(0, lastSpaceIndex).trim() + ' > ' + elements.slice(lastSpaceIndex + 1).trim();

  var minAd = 0, position = 1;

  for (var i = 0; i < elementsList.length; i++) {
    if (start > end) break;

    var element = elementStr + ':nth-of-type(' + (i + 1) + ')';

    if (insertPosition == 0 || insertPosition == 3) {
      if (i == 0 || elementsList[i].offsetTop + elementsList[i].clientHeight - minAd - (screen.height * minScreen) >= 0) {
        if (positionStart <= position++) {
          var adUnitToUse = adUnit + (start++);
          BFAdx(adUnitToUse, adSize, mapping, element, insertPosition, setMin);
          if (positionEnd != 0 && positionEnd < position) break;
        }
        if (i < elementsList.length - 1) minAd = elementsList[i + 1].offsetTop;
      }
    } else if (insertPosition == 1 || insertPosition == 2) {
      if (i == 0 || elementsList[i].offsetTop - minAd - (screen.height * minScreen) >= 0) {
        if (positionStart <= position++) {
          var adUnitToUse = adUnit + (start++);
          BFAdx(adUnitToUse, adSize, mapping, element, insertPosition, setMin);
          if (positionEnd != 0 && positionEnd < position) break;
        }
        minAd = elementsList[i].offsetTop;

        if (i < elementsList.length - 1) continue;
      }
      if (i == elementsList.length - 1 && elementsList[i].offsetTop + elementsList[i].clientHeight - minAd - (screen.height * minScreen) >= 0) {
        var adUnitToUse = adUnit + (start++);
        BFAdx(adUnitToUse, adSize, mapping, element, insertPosition == 1 ? 0 : 3, setMin);
      }
    }
  }
}

function BFAdxSticky(adUnit, adPosition = 0) {
  checkGPTExists();
  window.googletag = window.googletag || { cmd: [] };
  var anchorSlot;

  googletag.cmd.push(function() {
    anchorSlot = googletag.defineOutOfPageSlot(adUnit, document.body.clientWidth < 768 && adPosition != 0 ? googletag.enums.OutOfPageFormat.TOP_ANCHOR : googletag.enums.OutOfPageFormat.BOTTOM_ANCHOR);
    googletag.pubads().enableSingleRequest();
    googletag.enableServices();
  });

  googletag.cmd.push(function() {
    googletag.display(anchorSlot);
  });
}
function BFAdxInImage(adUnit, adSize, mapping = [], element, imageIndex = 1, marginBottom = 0) {
  var images = document.body.querySelectorAll(element);
  var image = images[imageIndex - 1];
  if (image === undefined) return;

  checkGPTExists();
  var gptId = randomID();
  window.googletag = window.googletag || { cmd: [] };

  googletag.cmd.push(function() {
    var adSlot = googletag.defineSlot(adUnit, adSize, gptId).addService(googletag.pubads());

    if (mapping.length) {
      var sizeMapping = googletag.sizeMapping();
      mapping.forEach(function({ breakpoint, size }) {
        var sizeArray = Array.isArray(size) ? size : [size];
        sizeMapping.addSize(breakpoint, sizeArray);
      });
      adSlot.defineSizeMapping(sizeMapping.build());
    }

    googletag.pubads().enableSingleRequest();
    googletag.enableServices();
  });

  var inImageAd = document.createElement("div");
  inImageAd.className = "bfv-inimage-ad";
  inImageAd.style.position = "relative";

  var adContainer = document.createElement("div");
  adContainer.style.position = "absolute";
  adContainer.style.bottom = marginBottom + "px";
  adContainer.style.zIndex = "10";
  adContainer.style.width = "100%";

  var divAdsCenter = document.createElement("center");
  var divAds = document.createElement("div");
  divAds.id = gptId;

  var closeButton = document.createElement("span");
  closeButton.innerHTML = "×";
  closeButton.style.cssText = "position:absolute;display:none;z-index:1;width:25px !important;height:25px !important;right:2px !important;top:-27px !important;cursor:pointer;font-size:20px;text-align:center;background:white;padding:2px;border-radius:20px;line-height:1;";

  divAdsCenter.appendChild(divAds);
  adContainer.appendChild(divAdsCenter);
  adContainer.appendChild(closeButton);
  inImageAd.appendChild(adContainer);
  image.insertAdjacentElement("afterend", inImageAd);

  googletag.cmd.push(function() {
    googletag.display(gptId);
  });

  var timeout = 0;
  var interval = setInterval(function() {
    var iframeAdx = divAds.querySelector("iframe");
    if (iframeAdx && iframeAdx.getAttribute("data-load-complete") == "true") {
      closeButton.style.display = "block";
      clearInterval(interval);
    }
    if (++timeout > 600) clearInterval(interval);
  }, 1000);

  closeButton.addEventListener("click", function() {
    inImageAd.style.visibility = "hidden";
  });
}
function BFAdxInImages(adUnit, start, end, adSize, mapping = [], elementSelector, imageIndices = [], marginBottom = 0) {
  const images = document.body.querySelectorAll(elementSelector);
  if (!images.length || start > end) return;

  imageIndices.forEach((imageIndex, i) => {
    if (imageIndices.length && !imageIndices.includes(i + 1)) return;
    BFAdxInImage(adUnit + start++, adSize, mapping, elementSelector, imageIndex, marginBottom);
  });
}

function BFAdxInPage(adUnit, elementSelector, marginTop = -1) {
  if (window.innerWidth >= 768) return;

  const adId = randomID();
  const adWidth = 300;
  const adHeight = 600;
  
  checkGPTExists();

  window.googletag = window.googletag || { cmd: [] };
  googletag.cmd.push(() => {
    googletag.defineSlot(adUnit, [adWidth, adHeight], adId).addService(googletag.pubads());
    googletag.pubads().enableSingleRequest();
    googletag.enableServices();
  });

  const parentElement = document.querySelector(elementSelector);
  const midpoint = Math.min(Math.floor(parentElement.childElementCount / 2), 4);
  parentElement.children[midpoint - 1].insertAdjacentHTML("afterend", "<div id='bfv-inpage-ad'></div>");

  const adHTML = `
    <div id="inpage-content-ad" style="overflow: hidden; position: relative; z-index: 2; width: 100%;">
      <div id="inpage-ad" style="display:none;">
        <div id='${adId}' style='min-width: ${adWidth}px; min-height: ${adHeight}px;'></div>
      </div>
    </div>`;
  
  document.getElementById("bfv-inpage-ad").insertAdjacentHTML("beforeend", adHTML);
  
  googletag.cmd.push(() => googletag.display(adId));

  window.addEventListener("scroll", () => {
    const inpageContentAd = document.getElementById("inpage-content-ad");
    if (!inpageContentAd) return;

    const top = inpageContentAd.getBoundingClientRect().top - marginTop;
    const bot = top > 0 ? adHeight : adHeight + top;

    inpageContentAd.style.height = `${adHeight}px`;
    document.getElementById("inpage-ad").style.cssText = `
      display: block;
      clip: rect(${top}px, ${adWidth}px, ${bot}px, 0px);
      left: ${(window.innerWidth - adWidth) / 2}px;
      top: ${marginTop}px;
      position: fixed;
      z-index: 10000;
    `;
  });
}

function BFAdxMultipleSize(adUnit, elementSelector, insertPosition = 0, marginTop = 0) {
  if (window.innerWidth >= 768) return;
  MultipleSizeAdd(adUnit, elementSelector, insertPosition);
  MultipleSizeScroll(marginTop);
}

function BFAdxMultipleSizes(adUnit, start, end, elementsSelector, insertPosition = 2, marginTop = 0, minScreen = 1, positionStart = 0, positionEnd = 0) {
  if (window.innerWidth >= 768) return;

  const elements = document.querySelectorAll(elementsSelector);
  if (!elements.length || start > end) return;

  let minAdOffset = 0, position = 1;

  elements.forEach((element, i) => {
    if (start > end) return;

    const elementSelector = `${elementsSelector}:nth-of-type(${i + 1})`;
    const elementTop = element.offsetTop;
    
    if (insertPosition === 0 || insertPosition === 3) {
      if (i === 0 || elementTop - minAdOffset - (screen.height * minScreen) >= 0) {
        if (positionStart <= position++) {
          MultipleSizeAdd(adUnit + start++, elementSelector, insertPosition);
          if (positionEnd && positionEnd < position) return;
        }
        minAdOffset = elementTop;
      }
    } else if (insertPosition === 1 || insertPosition === 2) {
      if (i === 0 || elementTop - minAdOffset - (screen.height * minScreen) >= 0) {
        if (positionStart <= position++) {
          MultipleSizeAdd(adUnit + start++, elementSelector, insertPosition);
          if (positionEnd && positionEnd < position) return;
        }
        minAdOffset = elementTop;
      }
    }
  });

  MultipleSizeScroll(marginTop);
}

function MultipleSizeAdd(adUnit, elementSelector, insertPosition = 0) {
  const element = document.body.querySelector(elementSelector);
  if (!element) return;

  checkGPTExists();

  const adId = randomID();
  const adSize = [[300, 250], [300, 600]];
  
  window.googletag = window.googletag || { cmd: [] };
  googletag.cmd.push(() => {
    googletag.defineSlot(adUnit, adSize, adId).addService(googletag.pubads());
    googletag.pubads().enableSingleRequest();
    googletag.enableServices();
  });

  const adHTML = `
    <div class="bfv-multiplesize" style="margin: 10px 0; width: calc(100%);">
      <span style="display: inline-block; width: 100%; font-size: 14px; text-align: center; color: #9e9e9e; background-color: #f1f1f1;">Ads By Netlink</span>
      <div class="ms-content-ad" style="position: relative; min-height: 600px;">
        <center class="ms-ad">
          <div id="${adId}"></div>
        </center>
      </div>
      <span style="display: inline-block; width: 100%; font-size: 14px; text-align: center; color: #9e9e9e; background-color: #f1f1f1;">Scroll to Continue</span>
    </div>`;

  element.insertAdjacentHTML(insertPosition === 1 ? "afterbegin" : insertPosition === 2 ? "beforebegin" : insertPosition === 3 ? "afterend" : "beforeend", adHTML);

  googletag.cmd.push(() => googletag.display(adId));
}

function MultipleSizeScroll(marginTop) {
  document.addEventListener("scroll", () => {
    const elements = document.getElementsByClassName("bfv-multiplesize");
    Array.from(elements).forEach(element => {
      const adDiv = element.querySelector(".ms-ad");
      const contentHeight = element.querySelector(".ms-content-ad").clientHeight;
      const adHeight = adDiv.clientHeight;
      const adRect = element.querySelector(".ms-content-ad").getBoundingClientRect();

      if (adHeight < contentHeight) {
        if (adRect.top >= marginTop) {
          adDiv.style.position = "";
        } else if (adRect.top < marginTop && Math.abs(adRect.top) + adHeight < contentHeight - marginTop) {
          adDiv.style.cssText = `position: fixed; top: ${marginTop}px; left: 50%; transform: translateX(-50%);`;
        } else if (Math.abs(adRect.top) + adHeight >= contentHeight - marginTop) {
          adDiv.style.cssText = `position: absolute; bottom: 0; left: 50%; transform: translateX(-50%);`;
        }
      } else {
        adDiv.style.position = "";
      }
    });
  });
}

function BFAdxFirstView(adUnit, adSize = [300, 600]) {
  if (window.innerWidth >= 768) return;

  checkGPTExists();

  const adId = randomID();
  window.googletag = window.googletag || { cmd: [] };
  googletag.cmd.push(() => {
    googletag.defineSlot(adUnit, adSize, adId).addService(googletag.pubads());
    googletag.pubads().enableSingleRequest();
    googletag.enableServices();
  });

  const adHTML = `
    <div class="bfv-firstview" style="display: block; position: fixed; width: 100%; height: 100vh; top: 0; left: 0; text-align: center; opacity: 1; background-color: rgba(255, 255, 255, 0.7); visibility: hidden; z-index: 2147483647;">
      <div class="bfv-firstview-close" style="display: none; position: absolute; width: 60px; height: 25px; top: 5%; right: 0; cursor: pointer; background: rgba(183, 183, 183, 0.71); padding: 2px; border-radius: 20px 0 0 20px; z-index: 99;">
        <span style="display: inline-block; color: #333;">X</span>
      </div>
      <div id="${adId}" style="min-width: 300px; min-height: 600px;"></div>
    </div>`;

  document.body.insertAdjacentHTML("beforeend", adHTML);

  googletag.cmd.push(() => googletag.display(adId));

  document.querySelector('.bfv-firstview-close').addEventListener('click', () => {
    document.querySelector('.bfv-firstview').style.display = "none";
  });
}

function BFAdsense(adClient, adSlot, adWidth = 300, adHeight = 600, position = 1) {
  if (window.innerWidth < 768) return;

  const adHTML = `
    <ins class="adsbygoogle"
      style="display:inline-block;width:${adWidth}px;height:${adHeight}px"
      data-ad-client="${adClient}"
      data-ad-slot="${adSlot}"></ins>`;

  const element = document.getElementsByClassName("bfv-adsense")[position - 1];
  if (!element) return;

  element.insertAdjacentHTML("beforeend", adHTML);
  (adsbygoogle = window.adsbygoogle || []).push({});
}

function BFAdsenseInPage(adClient, adSlot, marginTop = 0) {
  if (window.innerWidth < 768) return;

  const adId = randomID();
  const adHTML = `
    <ins class="adsbygoogle" id="${adId}"
      style="display:inline-block;width:300px;height:600px"
      data-ad-client="${adClient}"
      data-ad-slot="${adSlot}"></ins>`;

  const element = document.getElementById("inpage-content-ad");
  if (!element) return;

  element.insertAdjacentHTML("beforeend", adHTML);
  (adsbygoogle = window.adsbygoogle || []).push({});
}
function checkGPTExists() {
  var scripts = document.head.querySelectorAll('script[src="https://securepubads.g.doubleclick.net/tag/js/gpt.js"]');
  if (scripts.length > 0) {
    return true;
  } else {
    var gpt_script = document.createElement("script");
    gpt_script.src = "https://securepubads.g.doubleclick.net/tag/js/gpt.js";
    gpt_script.async = true;
    document.head.appendChild(gpt_script);

    return false;
  }
}

var ar = [];
function randomID() {
  var r = Date.now().toString();
  while (1) {
    if (!ar.includes(r)) {
      break;
    }
    r = Date.now().toString();
  }
  ar.push(r);

  return "div-gpt-ad-" + r + "-0";
}

function checkAdsenseJSExists(client_id) {
  var scripts = document.head.querySelectorAll('script[src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client='+client_id+'"]');
  if (scripts.length > 0) {
    return true;
  } else {
    var adsense_script = document.createElement("script");
    adsense_script.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client="+client_id;
    adsense_script.async = true;
    adsense_script.crossOrigin = "anonymous";
    document.head.appendChild(adsense_script);

    return false;
  }
}
