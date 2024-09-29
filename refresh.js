function loadAdUnit(adunit, sizes, format) {
	document.getElementById('ad-code').innerHTML = '';	
    var timestamp = Math.round(new Date().getTime());

    var code_head = '';
    var code_body = '';

	var sizeArray = sizes.split(';').map(function(size) {
        var dimensions = size.split('x');
        return '[' + dimensions[0].trim() + ', ' + dimensions[1].trim() + ']';
    });
    var size = '[' + sizeArray.join(', ') + ']';

    if (format === 'Anchor') {
        code_head = `
<script>
    window.googletag = window.googletag || {cmd: []};
    var anchorSlot;
    var staticSlot;
    googletag.cmd.push(function() {
        if (document.body.clientWidth <= 500) {
            anchorSlot = googletag.defineOutOfPageSlot('${adunit}', googletag.enums.OutOfPageFormat.TOP_ANCHOR);
        } else {
            anchorSlot = googletag.defineOutOfPageSlot('${adunit}', googletag.enums.OutOfPageFormat.BOTTOM_ANCHOR);
        }
        if (anchorSlot) {
            anchorSlot
                .setTargeting('test', 'anchor')
                .addService(googletag.pubads());
        }
        staticSlot = googletag.defineSlot('${adunit}', ${size}, 'div-gpt-ad-${timestamp}-0').addService(googletag.pubads());
        googletag.pubads().enableSingleRequest();
        googletag.enableServices();
    });
</script>`;
        code_body = `
<div id="div-gpt-ad-${timestamp}-0" style="min-width: 300px; min-height: 250px;">
    <script>
        googletag.cmd.push(function() { googletag.display('div-gpt-ad-${timestamp}-0'); });
    </script>
</div>`;
    } else if (format === 'Inter') {
        code_head = `
<script async src="https://securepubads.g.doubleclick.net/tag/js/gpt.js"></script>
<script>
    window.googletag = window.googletag || {cmd:[]};
    var interstitialSlot, staticSlot;
    googletag.cmd.push(function(){
        interstitialSlot = googletag.defineOutOfPageSlot('${adunit}', 
            googletag.enums.OutOfPageFormat.INTERSTITIAL);
        if(interstitialSlot){
            interstitialSlot.addService(googletag.pubads());
        }
        staticSlot = googletag.defineSlot('${adunit}', ${size}, 'div-gpt-ad-${timestamp}-0').addService(googletag.pubads());
        googletag.pubads().enableSingleRequest(); googletag.enableServices();
    });
</script>`;
        code_body = `
<div id="div-gpt-ad-${timestamp}-0"></div>
<script>
    googletag.cmd.push(function() { googletag.display(staticSlot); });
</script>`;
    } else if (format === 'Banner') {
        code_head = `
<script async src="https://securepubads.g.doubleclick.net/tag/js/gpt.js"></script>
<script>
    window.googletag = window.googletag || {cmd: []};
    googletag.cmd.push(function() {
        googletag.defineSlot('${adunit}', ${size}, 'div-gpt-ad-${timestamp}-0').addService(googletag.pubads());
        googletag.pubads().enableSingleRequest();
        googletag.pubads().collapseEmptyDivs();
        googletag.enableServices();
    });
</script>`;
        code_body = `
<div id="div-gpt-ad-${timestamp}-0" style="min-width: 300px; min-height: 250px;">
    <script>
        googletag.cmd.push(function() { googletag.display('div-gpt-ad-${timestamp}-0'); });
    </script>
</div>`;
    }
    document.getElementById('ad-code').innerHTML = code_head + code_body;
}

function refreshAd(adunit, sizes, format) {
    loadAdUnit(adunit, sizes, format);

    setInterval(function() {
        loadAdUnit(adunit, sizes, format);
    }, 30000); 
}
