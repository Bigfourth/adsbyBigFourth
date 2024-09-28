**BigFourth All Functions**

**BFAdx(\_adUnit, \_adSize, \_mapping, \_element, \_insertPosition, \_set\_min);**

Use in cases where you want to place a banner.

Parameters:

\_adUnit: Enter the ad unit code.

Example: '/123456/ads/bf\_banner'

\_adSize: Enter the ad size.

If there is only one size, enter: \[300,50\] or \[300,100\]

If there are multiple sizes, enter: \[\[300,50\], \[300,100\]\]

\_mapping (optional): Enter responsive display mapping for different screen sizes.

If not using mapping: \[\]

If using mapping:

var mapping1 = \[

{ breakpoint: \[992, 0], size: \[728, 280\] }, // desktop

{ breakpoint: \[640, 0\], size: \[336, 280\] }, // tablet

{ breakpoint: \[320, 0\], size: \[300, 250\] }, // mobile

\];

\_element: The position where the ad will be displayed on the website.

\_insertPosition (optional - Default: 0): The position to insert the ad based on the element.

\_insertPosition = 0: Inside the element, at the bottom

\_insertPosition = 1: Inside the element, at the top

\_insertPosition = 2: Outside the element, above the element

\_insertPosition = 3: Outside the element, below the element

\_set\_min (optional - Default: 0): Fix a fixed frame on size.

\_set\_min = 0: Do not set a fixed frame; if there are ads, they will be displayed; if there are no ads, the white frame will not be displayed.

\_set\_min = 1: Set a fixed frame on size regardless of whether there are ads or not.

Demo:

BFAdx('/123456/ads/bf\_banner', \[\[320,100\], \[320,50\]\], \[\], 'div-id-123');

BFAdx('/123456/ads/bf\_banner', \[\[320,100\], \[320,50\]\], \[\], 'div-id-123', 1, 1);

**BFAdxInterstitial(\_adUnit);**

Use when you want to implement interstitial ads.

Parameters:

\_adUnit: Enter the ad unit code.

Example: '/123456/ads/bf\_interstitials'

Demo:

BFAdxInterstitial('/123456/ads/bf\_interstitials');

**BFAdxSticky(\_adUnit, \_adPosition);**

Use when you want to implement sticky code.

Parameters:

\_adUnit: Enter the ad unit code.

Example: '/123456/ads/bf\_sticky'

\_adPosition (optional - Default: 0): Position of the sticky ad.

\_adPosition = 0: Positioned at the bottom

\_adPosition = 1: Positioned at the top

Demo:

BFAdxSticky('/123456/ads/bf\_sticky'); // Place ad at the bottom

BFAdxSticky('/123456/ads/bf\_sticky', 1); // Place ad at the top

**BFAdxInPage(\_adUnit, \_element, \_marginTop);**

Only applies to mobile.

Use when you want to place in-page ads. Ads appear in the background within the article.

Parameters:

\_adUnit: Enter the ad unit code.

Example: '/123456/ads/bf\_inpage'

\_element: The tag containing the detailed article content. Ads will be centered within this tag.

\_marginTop (optional - Default: -1): Enter the distance from the top of the screen.

\_marginTop = -1: Ads appear centered in the middle of the screen when scrolled.

\_marginTop = 0: Ads appear flush with the top of the screen when scrolled.

\_marginTop = 1-1000: Distance ads display from the top of the screen when scrolled.

Demo:

BFAdxInPage('/123456/ads/bf\_inpage', 'div-id-123'); // Ads center on the screen when scrolled

BFAdxInPage('/123456/ads/bf\_inpage', 'div-id-123', 0); // Ads flush with the top of the screen when scrolled

BFAdxInPage('/123456/ads/bf\_inpage', 'div-id-123', 50); // Ads display 50px from the top of the screen when scrolled

**BFAdxInImage(\_adUnit, \_adSize, \_mapping, \_element, \_image, \_marginBottom);**

Use when you want to place ads in images.

Parameters:

\_adUnit: Enter the ad unit code.

Example: '/123456/ads/bf\_inimage'

\_adSize: Enter the ad size.

If there is only one size, enter: \[300,50\] or \[300,100\]

If there are multiple sizes, enter: \[\[300,50\], \[300,100\]\]

\_mapping: Enter responsive display mapping for different screen sizes.

If not using mapping: \[\]

If using mapping:

var mapping1 = \[

{ breakpoint: \[992, 0\], size: \[728, 90\] }, // desktop

{ breakpoint: \[300, 0\], size: \[300, 50\] }, // mobile

\];

\_element: The tag containing the detailed article content and the image.

\_image (optional - Default: 1): The index of the image to display the ad on.

\_image = 1: The first image in the element

\_image = 5: The fifth image in the element

\_marginBottom (optional - Default: 0): Enter the distance from the bottom of the image. If the ads do not align with the image, enter an appropriate distance.

Example:

\_marginBottom = 0

\_marginBottom = 20

\_marginBottom = -10

Demo:

BFAdxInImage('/123456/ads/bf\_inimage', \[300,50\], \[\], 'div-id-123', 1); // Ads display on the first image

BFAdxInImage('/123456/ads/bf\_inimage', \[\[300,50\], \[300,100\]\], \[\], 'div-id-123', 5); // Ads display on the fifth image with sizes 300x50 or 300x100

**BFAdxMultipleSize(\_adUnit, \_element, \_insertPosition, \_marginTop);**

Only applies to mobile.

Use when you want to place multiple size ads.

Parameters:

\_adUnit: Enter the ad unit code.

Example: '/123456/ads/bf\_multiplesize'

\_element: The tag containing the detailed article content.

\_insertPosition (optional - Default: 0): The position to insert the ad based on the element.

\_insertPosition = 0: Inside the element, at the bottom

\_insertPosition = 1: Inside the element, at the top

\_insertPosition = 2: Outside the element, above the element

\_insertPosition = 3: Outside the element, below the element

\_marginTop (optional - Default: 0): Enter the distance from the top of the screen.

\_marginTop = 0: Ads flush with the top of the screen when scrolled.

\_marginTop = 1-1000: Distance ads display from the top of the screen when scrolled.

Demo:

BFAdxMultipleSize('/123456/ads/bf\_multiplesize', 'div-id-123');

**BFAdxFirstView(\_adUnit);**

Use when you want to place FirstView ads - PTO.

Parameters:

\_adUnit: Enter the ad unit code.

Example: '/123456/ads/bf\_firstview'

Demo:

BFAdxFirstView('/123456/ads/bf\_firstview');

**Implementation Process**

Load Script: Add the following script tag to the HTML file before the closing tag.

Add Ads: Add ad codes where necessary.

</p><p class="slate-paragraph"> BFAdx('/123456/ads/bf_banner', [[300,50], [300,100]], [], 'div-id-123');</p><p class="slate-paragraph">

Responsive Support: Ensure to use responsive display mapping to optimize ad display on different devices.

If you need more specific guidance on implementing these functions or optimizing your ads with Google Ad Manager, let me know!
