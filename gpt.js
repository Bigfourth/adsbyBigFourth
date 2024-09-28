function BFAdx(_adUnit, _adSize, _mapping = [], _element, _insertPosition=0, _set_min=0) {
  var element = document.body.querySelector(_element);
  if(element == null) return;

  checkGPTExists();

  var gpt_id = randomID();

  window.googletag = window.googletag || {cmd: []};
  googletag.cmd.push(function() {
    var adSlot = googletag.defineSlot(_adUnit, _adSize, gpt_id).addService(googletag.pubads());

    if(_mapping.length) {
      var mapping = googletag.sizeMapping();

      _mapping.forEach(({ breakpoint, size }) => {
          var sizeArray = Array.isArray(size) ? size : [size];
          mapping.addSize(breakpoint, sizeArray);
      });
      
      var finalMapping = mapping.build();

      adSlot.defineSizeMapping(finalMapping);
    }

    googletag.pubads().enableSingleRequest();
    googletag.enableServices();
  });

  var style_min = "";
  if(_set_min != 0) {
    var min_width = 0;
    var min_height = 0;
    if(!Array.isArray(_adSize[0]) && !Array.isArray(_adSize[1])) {
      min_width = _adSize[0];
      min_height = _adSize[1];
    } else {
      for (var i = 0; i < _adSize.length; i++) {
        min_width = _adSize[i][0] < min_width || min_width == 0 ? _adSize[i][0] : min_width
        min_height = _adSize[i][1] < min_height || min_height == 0 ? _adSize[i][1] : min_height
      }
    }
    style_min = "min-width: "+min_width+"px; min-height: "+min_height+"px;";
  }

  var html = `<div class="bfv-banner-ad">
      <center>
        <div id='${gpt_id}' style='${style_min}'></div>
      </center>
    </div>`;

  if(_insertPosition == 1) element.insertAdjacentHTML("afterbegin", html);
  else if(_insertPosition == 2) element.insertAdjacentHTML("beforebegin", html);
  else if(_insertPosition == 3) element.insertAdjacentHTML("afterend", html);
  else element.insertAdjacentHTML("beforeend", html);

  googletag.cmd.push(() => {
    googletag.display(gpt_id);
  });
}

function BFAdxInterstitial(_adUnit) {
  checkGPTExists();
  window.googletag = window.googletag || {cmd: []};
  var interstitialSlot;
  googletag.cmd.push(function() {
    interstitialSlot = googletag.defineOutOfPageSlot(_adUnit, googletag.enums.OutOfPageFormat.INTERSTITIAL);
    if (interstitialSlot) {
      interstitialSlot.addService(googletag.pubads());
    }

    googletag.pubads().enableSingleRequest();
    googletag.enableServices();
    googletag.display(interstitialSlot);
  });
}

function BFAdxAutoAds(_adUnit, _start, _end, _adSize, _mapping = [], _elements, _insertPosition=2, _set_min=0, _minScreen=1, _position_start=0, _position_end=0) {
  var elements = document.querySelectorAll(_elements);
  if(elements.length == 0) return;

  var lastSpaceIndex = _elements.lastIndexOf(' ');
  var _element_str = lastSpaceIndex === -1 ? _elements : _elements.slice(0, lastSpaceIndex).trim() + ' > ' + _elements.slice(lastSpaceIndex + 1).trim();

  var min_ad = 0;
  var position = 1;
  for (var i = 0; i < elements.length; i++) {
    if(_start > _end) break;

    var _element = _element_str+':nth-of-type('+(i+1)+')';

    if(_insertPosition == 0 || _insertPosition == 3) {
      if(i == 0 || elements[i].offsetTop + elements[i].clientHeight - min_ad - (screen.height * _minScreen) >= 0) {
        if(_position_start <= position++)  {
          var adUnit = _adUnit + (_start++);
          BFAdx(adUnit, _adSize, _mapping, _element, _insertPosition, _set_min);

          if(_position_end != 0 && _position_end < position) break;
        }

        if(i < elements.length - 1)
          min_ad = elements[i+1].offsetTop;
      }
    } else if(_insertPosition == 1 || _insertPosition == 2) {
      if(i == 0 || elements[i].offsetTop - min_ad - (screen.height * _minScreen) >= 0) {
        if(_position_start <= position++)  {
          var adUnit = _adUnit + (_start++);
          BFAdx(adUnit, _adSize, _mapping, _element, _insertPosition, _set_min);

          if(_position_end != 0 && _position_end < position) break;
        }
        
        min_ad = elements[i].offsetTop;

        if(i < elements.length - 1) continue;
      }

      if(i == elements.length - 1 && elements[i].offsetTop + elements[i].clientHeight - min_ad - (screen.height * _minScreen) >= 0) {
        var adUnit = _adUnit + (_start++);
        BFAdx(adUnit, _adSize, _mapping, _element, _insertPosition == 1 ? 0 : 3, _set_min);
      }
    }
  }
}

function BFAdxSticky(_adUnit, _adPosition=0) {
  checkGPTExists();

  window.googletag = window.googletag || { cmd: [] };
  var anchorSlot;
  googletag.cmd.push(() => {
    anchorSlot = googletag.defineOutOfPageSlot(_adUnit, document.body.clientWidth < 768 && _adPosition != 0 ? googletag.enums.OutOfPageFormat.TOP_ANCHOR : googletag.enums.OutOfPageFormat.BOTTOM_ANCHOR);
    googletag.pubads().enableSingleRequest();
    googletag.enableServices();
  });
  
  googletag.cmd.push(() => {
    googletag.display(anchorSlot);
  });
}

function BFAdxInImage(_adUnit, _adSize, _mapping = [], _element, _image = 1, _marginBottom=0) {
  var images = document.body.querySelectorAll(_element);
  var image = images[_image - 1];
  if(image == undefined) return;

  checkGPTExists();

  var gpt_id = randomID();

  window.googletag = window.googletag || { cmd: [] };
  googletag.cmd.push(function () {
    var adSlot = googletag.defineSlot(_adUnit, _adSize, gpt_id).addService(googletag.pubads());

    if(_mapping.length) {
      var mapping = googletag.sizeMapping();

      _mapping.forEach(({ breakpoint, size }) => {
          var sizeArray = Array.isArray(size) ? size : [size];
          mapping.addSize(breakpoint, sizeArray);
      });
      
      var finalMapping = mapping.build();

      adSlot.defineSizeMapping(finalMapping);
    }

    googletag.pubads().enableSingleRequest();
    googletag.enableServices();
  });

  var bfv_inImage = document.createElement("div");
  bfv_inImage.className = "bfv-inimage-ad";
  bfv_inImage.style.cssText = `position:relative;`;

  var inImage_Ad = document.createElement("div");
  inImage_Ad.style.cssText = `position:absolute;bottom:${_marginBottom}px;z-index:10;width:100%;`;

  var divAdsCenter = document.createElement("center");

  var divAds = document.createElement("div");
  divAds.id = gpt_id;

  var inImage_Close = document.createElement("span");
  inImage_Close.innerHTML = "×";
  inImage_Close.style.cssText = "position:absolute;display:none;z-index:1;width:25px !important;height:25px !important;right:2px !important;top:-27px !important;cursor:pointer;font-size:20px;text-align:center;background:white;padding:2px;border-radius:20px;line-height:1;";

  divAdsCenter.appendChild(divAds);
  inImage_Ad.appendChild(divAdsCenter);
  inImage_Ad.appendChild(inImage_Close);

  bfv_inImage.appendChild(inImage_Ad);

  image.insertAdjacentElement("afterend", bfv_inImage);

  googletag.cmd.push(function () {
    googletag.display(gpt_id);
  });

  var timeout = 0;
  var interval = setInterval(function () {
    var iframeAdx = divAds.querySelector("iframe");
    if (iframeAdx && iframeAdx.getAttribute("data-load-complete") == "true") {
      inImage_Close.style.display = "block";
      clearInterval(interval);
    }
    if(++timeout > 600) 
      clearInterval(interval);
  }, 1000);

  inImage_Close.addEventListener("click", function () {
    bfv_inImage.style.visibility = "hidden";
  });
}

function BFAdxInImages(_adUnit, _start, _end, _adSize, _mapping = [], _element, _image = [], _marginBottom=0) {
  var images = document.body.querySelectorAll(_element);
  if(images.length == 0) return;

  for (var i = 1; i <= images.length; i++) {
    if(_start > _end) break;

    if(_image.length > 0 && !_image.includes(i)) continue;

    var adUnit = _adUnit + (_start++);

    BFAdxInImage(adUnit, _adSize, _mapping, _element, i, _marginBottom);
  }
}

function BFAdxInPage(_adUnit, _element, _marginTop = -1) {
  if (window.innerWidth >= 768) return;

  var ad_width = 300;
  var ad_height = 600;
  var gpt_id = randomID();

  checkGPTExists();

  window.googletag = window.googletag || {cmd: []};
  googletag.cmd.push(function() {
    googletag.defineSlot(_adUnit, [ad_width, ad_height], gpt_id).addService(googletag.pubads());
    googletag.pubads().enableSingleRequest();
    googletag.enableServices();
  });

 var parent = document.querySelectorAll(_element)[0];
  var midpoint = Math.min(Math.floor(parent.childElementCount / 2), 4);
  parent.children[midpoint - 1].insertAdjacentHTML("afterend", "<div id='bfv-inpage-ad'></div>");

  var html = `<div id="inpage-content-ad" style="overflow: hidden; position: relative; z-index: 2; width: 100%;">
    <div id="inpage-ad" style="display:none;">
      <div id='${gpt_id}' style='min-width: ${ad_width}px; min-height: ${ad_height}px;'></div>
    </div>
  </div>`;
  document.getElementById("bfv-inpage-ad").insertAdjacentHTML("beforeend", html);

  googletag.cmd.push(() => {
    googletag.display(gpt_id);
  });

  window.addEventListener("scroll", function () {
    var inpageContentAds = document.getElementById("inpage-content-ad");
    if (!inpageContentAds) return;

    _marginTop >= 0 ? _marginTop : (window.innerHeight - ad_height) / 2;
    var top = inpageContentAds.getBoundingClientRect().top - _marginTop;
    var bot = top > 0 ? ad_height : ad_height + top;

    if (window.innerWidth < 768) {
      inpageContentAds.style.height = ad_height+"px";
      document.getElementById("inpage-ad").style.cssText = `
        display: block;
        clip: rect(${top}px, ${ad_width}px, ${bot}px, 0px);
        left: ${(window.innerWidth - ad_width) / 2}px;
        top: ${_marginTop}px;
        position: fixed;
        z-index: 10000;
      `;
    }
  });
}
function BFAdxMultipleSize(_adUnit, _element, _insertPosition=0, _marginTop=0) {
  if (window.innerWidth >= 768) return;

  MultipleSizeAdd(_adUnit, _element, _insertPosition);
  MultipleSizeScroll(_marginTop);
}
function BFAdxMultipleSizes(_adUnit, _start, _end, _elements, _insertPosition=2, _marginTop=0, _minScreen = 1, _position_start=0, _position_end=0) {
  if (window.innerWidth >= 768) return;

  var elements = document.querySelectorAll(_elements);
  if(elements.length == 0) return;

  var lastSpaceIndex = _elements.lastIndexOf(' ');
  var _element_str = lastSpaceIndex === -1 ? _elements : _elements.slice(0, lastSpaceIndex).trim() + ' > ' + _elements.slice(lastSpaceIndex + 1).trim();

  var min_ad = 0;
  var position = 1;
  for (var i = 0; i < elements.length; i++) {
    if(_start > _end) break;

    var _element = _element_str+':nth-of-type('+(i+1)+')';

    if(_insertPosition == 0 || _insertPosition == 3) {
      if(i == 0 || elements[i].offsetTop + elements[i].clientHeight - min_ad - (screen.height * _minScreen) >= 0) {
        if(_position_start <= position++)  {
          var adUnit = _adUnit + (_start++);
          MultipleSizeAdd(adUnit, _element, _insertPosition);

          if(_position_end != 0 && _position_end < position) break;
        }

        if(i < elements.length - 1)
          min_ad = elements[i+1].offsetTop;
      }
    } else if(_insertPosition == 1 || _insertPosition == 2) {
      if(i == 0 || elements[i].offsetTop - min_ad - (screen.height * _minScreen) >= 0) {
        if(_position_start <= position++)  {
          var adUnit = _adUnit + (_start++);
          MultipleSizeAdd(adUnit, _element, _insertPosition);

          if(_position_end != 0 && _position_end < position) break;
        }

        min_ad = elements[i].offsetTop;

        if(i < elements.length - 1) continue;
      }

      if(i == elements.length - 1 && elements[i].offsetTop + elements[i].clientHeight - min_ad - (screen.height * _minScreen) >= 0) {
        var adUnit = _adUnit + (_start++);
        MultipleSizeAdd(adUnit, _element, _insertPosition == 1 ? 0 : 3);
      }
    }
  }

  MultipleSizeScroll(_marginTop);
}
function MultipleSizeAdd(_adUnit, _element, _insertPosition=0) {
  var element = document.body.querySelector(_element);
  if(element == null) return;

  checkGPTExists();
  
  var gpt_id = randomID();
  var adSize = [[300, 250], [300, 600]];
  
  window.googletag = window.googletag || { cmd: [] };
  googletag.cmd.push(function () {
    googletag.defineSlot(_adUnit, adSize, gpt_id).addService(googletag.pubads());
    googletag.pubads().enableSingleRequest();
    googletag.enableServices();
  });

  var html = `<div class="bfv-multiplesize" style="margin-top:10px;margin-bottom:10px;margin-left:calc(50% - 50vw);margin-right:calc(50% - 50vw);">
      <span style="display: inline-block;width: 100%;font-size: 14px;text-align: center;color: #9e9e9e;background-color: #f1f1f1;">Ads By Netlink</span>
      <div class="ms-content-ad" style="position: relative;min-height: 600px;">
        <center class="ms-ad">
          <div id="${gpt_id}"></div>
        </center>
      </div>
      <span style="display: inline-block;width: 100%;font-size: 14px;text-align: center;color: #9e9e9e;background-color: #f1f1f1;">Scroll to Continue</span>
    </div>`;

  if(_insertPosition == 1) element.insertAdjacentHTML("afterbegin", html);
  else if(_insertPosition == 2) element.insertAdjacentHTML("beforebegin", html);
  else if(_insertPosition == 3) element.insertAdjacentHTML("afterend", html);
  else element.insertAdjacentHTML("beforeend", html);

  googletag.cmd.push(function () {
    googletag.display(gpt_id);
  });
}

function MultipleSizeScroll(_marginTop) {
  document.addEventListener("scroll", function (e) {
    var elements = document.getElementsByClassName("bfv-multiplesize");
    for (var i = 0; i < elements.length; i++) {
      var e = elements[i];

      var div = e.querySelector(".ms-ad");
      var h = e.querySelector(".ms-content-ad").clientHeight;
      var ch = e.querySelector(".ms-ad").clientHeight;

      var ap = e.querySelector(".ms-content-ad").getBoundingClientRect().top;
      if (ch < h) {
        if (ap >= _marginTop) {
          div.style.position = "";
          div.style.top = "";
          div.style.bottom = "";
          div.style.left = "";
          div.style.transform = "";
        } else if (ap < _marginTop && Math.abs(ap) + ch < h - _marginTop) {
          div.style.position = "fixed";
          div.style.top = _marginTop + "px";
          div.style.bottom = "";
          div.style.left = "50%";
          div.style.transform = "translateX(-50%)";
        } else if (Math.abs(ap) + ch >= h - _marginTop) {
          div.style.position = "absolute";
          div.style.top = "";
          div.style.bottom = "0";
          div.style.left = "50%";
          div.style.transform = "translateX(-50%)";
        }
      } else {
        div.style.position = "";
        div.style.top = "";
        div.style.bottom = "";
        div.style.left = "";
        div.style.transform = "";
      }
    }
  });
}

function BFAdxFirstView(_adUnit, _adSize = [300, 600]) {
  if (window.innerWidth >= 768) return;

  checkGPTExists();

  var gpt_id = randomID();

  window.googletag = window.googletag || {cmd: []};
  googletag.cmd.push(function() {
    googletag.defineSlot(_adUnit, _adSize, gpt_id).addService(googletag.pubads());
    googletag.pubads().enableSingleRequest();
    googletag.enableServices();
  });

  var html = `<div class="bfv-firstview" style="display: block; position: fixed; width: 100%; height: 100vh; top: 0px; left: 0px; text-align: center; opacity: 1; background-color: rgba(255, 255, 255, 0.7); visibility: hidden; z-index: 2147483647;">
      <div class="bfv-firstview-close" style="display: none; position: absolute; width: 60px !important; height: 25px !important; top: 30% !important; right: 0px !important; cursor: pointer; background: rgba(183, 183, 183, 0.71); padding: 2px; border-radius: 20px 0px 0px 20px; z-index: 99;">
        <span style="position: absolute; font-size: 15px; top: 50%; left: 50%; transform: translate(-50%, -50%);">close</span>
      </div>
      <div id="${gpt_id}" style="position: absolute; top: 50%; transform: translate(-50%, -50%); left: 50%;"></div>
    </div>`;
  document.body.insertAdjacentHTML("beforeend", html);

  googletag.cmd.push(function() {
    googletag.display(gpt_id);
  });

  document.body.querySelector('.bfv-firstview-close').addEventListener("click", function () {
    document.body.querySelector('.bfv-firstview').style.display = "none";
  });

  var timer = 0
  var interval = setInterval(() => {
    var ads = document.getElementById(gpt_id).querySelector("iframe");
    if (ads && ads.getAttribute("data-load-complete") == "true") {
      clearInterval(interval);

      document.body.querySelector('.bfv-firstview').style.visibility = "visible";
      document.body.querySelector('.bfv-firstview-close').style.display = "block";
    }

    if(++timer > 600) {
      clearInterval(interval);
    }
  }, 1000);
}

function BFAdxRewarded(_adUnit) {
  checkGPTExists();

  window.googletag = window.googletag || { cmd: [] }; 
  var rewardedSlot; 
  var rewardPayload;
  googletag.cmd.push(() => { 
    rewardedSlot = googletag.defineOutOfPageSlot(_adUnit, googletag.enums.OutOfPageFormat.REWARDED); 
    if (rewardedSlot) { 
      rewardedSlot.addService(googletag.pubads()); 
      googletag.pubads().addEventListener('rewardedSlotReady', (event) => { 
        // console.log('Rewarded ad slot is ready.');
        event.makeRewardedVisible(); 
      }); 
      googletag.pubads().addEventListener('rewardedSlotClosed', (event) => {
        // console.log('Closed by the user!');

        if (rewardPayload) { 
          rewardPayload = null; 
        } 
        if (rewardedSlot) { 
          googletag.destroySlots([rewardedSlot]); 
        }
        window.bfv_rewarded_done = true;

      }); 
      googletag.pubads().addEventListener('rewardedSlotGranted', (event) => { 
        rewardPayload = event.payload; 
        // console.log('Reward granted.');
      }); 
      googletag.pubads().addEventListener('slotRenderEnded', (event) => { 
        if (event.slot === rewardedSlot && event.isEmpty) { 
          // console.log('No ad returned for rewarded ad slot.');
          window.bfv_rewarded_done = true;
        } 
      }); 
      googletag.enableServices(); 
      googletag.display(rewardedSlot); 
    } else { 
      // console.log('Rewarded ads are not supported on this page.');
      window.bfv_rewarded_done = true;
    } 
  }); 
}

function BFAdsense(_adClient, _adSlot, _adSize=[], _responsive=0, _element, _insertPosition=0) {
  var element = document.body.querySelector(_element);
  if(element == null) return;

  checkAdsenseJSExists(_adClient);

  var ad_width = _adSize[0];
  var ad_height = _adSize[1];

  if(_responsive==0) {
    var html = `<div class="bfv-banner-ad">
      <center>
        <ins class="adsbygoogle"
          style="display:inline-block;width:${ad_width}px;height:${ad_height}px"
          data-ad-client=${_adClient}
          data-ad-slot=${_adSlot}>
       </ins>
      </center>
    </div>`;
  } else {
    var html = `<div class="bfv-banner-ad">
      <center>
        <ins class="adsbygoogle"
          style="display:block"
          data-ad-client=${_adClient}
          data-ad-slot=${_adSlot}>
          data-ad-format="auto"
          data-full-width-responsive="true">
        </ins>
      </center>
    </div>`;
  }

  if(_insertPosition == 1) element.insertAdjacentHTML("afterbegin", html);
  else if(_insertPosition == 2) element.insertAdjacentHTML("beforebegin", html);
  else if(_insertPosition == 3) element.insertAdjacentHTML("afterend", html);
  else element.insertAdjacentHTML("beforeend", html);

  (adsbygoogle = window.adsbygoogle || []).push({});
}

function BFAdsenseInPage(_adClient, _adSlot, _element, _marginTop = -1) {
  if (window.innerWidth >= 768) return;

  var ad_width = 300;
  var ad_height = 600;

  checkAdsenseJSExists(_adClient);

  var midpoint = Math.min(Math.floor(document.querySelectorAll(_element).length / 2), 4);
  document.querySelectorAll(_element)[midpoint - 1].insertAdjacentHTML("afterend", "<div id='bfv-inpage-ad'></div>");

  var html = `<div id="inpage-content-ad" style="overflow: hidden; position: relative; z-index: 2; width: 100%;">
    <div id="inpage-ad" style="display:none;">
      <ins class="adsbygoogle"
        style="display:inline-block;width:${ad_width}px;height:${ad_height}px"
        data-ad-client=${_adClient}
        data-ad-slot=${_adSlot}>
     </ins>
    </div>
  </div>`;
  document.getElementById("bfv-inpage-ad").insertAdjacentHTML("beforeend", html);

  (adsbygoogle = window.adsbygoogle || []).push({});

  window.addEventListener("scroll", function () {
    var inpageContentAds = document.getElementById("inpage-content-ad");
    if (!inpageContentAds) return;

    _marginTop >= 0 ? _marginTop : (window.innerHeight - ad_height) / 2;
    var top = inpageContentAds.getBoundingClientRect().top - _marginTop;
    var bot = top > 0 ? ad_height : ad_height + top;

    if (window.innerWidth < 768) {
      inpageContentAds.style.height = ad_height+"px";
      document.getElementById("inpage-ad").style.cssText = `
        display: block;
        clip: rect(${top}px, ${ad_width}px, ${bot}px, 0px);
        left: ${(window.innerWidth - ad_width) / 2}px;
        top: ${_marginTop}px;
        position: fixed;
        z-index: 10000;
      `;
    }
  });
}

function BFAdsenseFirstView(_adClient, _adSlot, _adSize = [300, 600]) {
  if (window.innerWidth >= 768) return;

  checkAdsenseJSExists(_adClient);

  var ad_width = _adSize[0];
  var ad_height = _adSize[1];

  var html = `<div class="bfv-firstview" style="display: block; position: fixed; width: 100%; height: 100vh; top: 0px; left: 0px; text-align: center; opacity: 1; background-color: rgba(255, 255, 255, 0.7); visibility: hidden; z-index: 2147483647;">
      <div class="bfv-firstview-close" style="display: none; position: absolute; width: 60px !important; height: 25px !important; top: 5% !important; right: 0px !important; cursor: pointer; background: rgba(183, 183, 183, 0.71); padding: 2px; border-radius: 20px 0px 0px 20px;" z-index: 99;>
        <span style="position: absolute; font-size: 15px; top: 50%; left: 50%; transform: translate(-50%, -50%);">close</span>
      </div>
      <ins class="adsbygoogle"
        style="display:inline-block;width:${ad_width}px;height:${ad_height}px;position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);"
        data-ad-client=${_adClient}
        data-ad-slot=${_adSlot}>
     </ins>
    </div>`;
  document.body.insertAdjacentHTML("beforeend", html);

  (adsbygoogle = window.adsbygoogle || []).push({});

  document.body.querySelector('.bfv-firstview-close').addEventListener("click", function () {
    document.body.querySelector('.bfv-firstview').style.display = "none";
  });

  var timer = 0
  var interval = setInterval(() => {
    var ads = document.querySelector(".bfv-firstview ins");
    if (ads && ads.getAttribute("data-ad-status") == "filled") {
      document.body.querySelector('.bfv-firstview').style.visibility = "visible";
      document.body.querySelector('.bfv-firstview-close').style.display = "block";

      clearInterval(interval);
    }

    if(++timer > 600) {
      clearInterval(interval);
    }
  }, 1000);
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
