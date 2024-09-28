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
