# adsticky — Sticky Ads Library (GPT)

Thư viện sticky ad cho Google Ad Manager, gọi 1 dòng, hỗ trợ 4 vị trí, auto-refresh theo thời gian viewable thực tế.

- **CDN:** `https://cdn.jsdelivr.net/gh/Bigfourth/adsbyBigFourth/sticky.js`
- **Repo:** `Bigfourth/adsbyBigFourth`
- **Version:** 1.3

---

## 1. Cài đặt

### 1.1. Khai báo trong GAM (làm 1 lần cho mỗi ad unit)

1. Tạo ad unit cho từng vị trí dưới network, ví dụ:
   - `sticky_bottom`, `sticky_top` — sizes: `320x50, 320x100, 728x90`
   - `sticky_left`, `sticky_right` — sizes: `120x600, 160x600, 300x250, 300x600`
2. Trong **Ad unit settings**, mục *Selected inventory will serve*:
   - Tick `Bottom horizontal sticky ads` / `Top horizontal sticky ads` cho unit bottom/top
   - Tick `Vertical sticky ads` cho unit left/right
3. Mục *Selected inventory will refresh based on*: tick `Time intervals`
   (script refresh mặc định 60s — trên mức tối thiểu 30s của Google)

### 1.2. Chèn vào trang

```html
<head>
  <script async src="https://securepubads.g.doubleclick.net/tag/js/gpt.js"></script>
  <script src="https://cdn.jsdelivr.net/gh/Bigfourth/adsbyBigFourth/sticky.js"></script>
</head>
<body>
  <!-- nội dung trang -->
  <script>
    adsticky('/22796784223/sticky_bottom', 'bottom');
  </script>
</body>
```

Không cần gọi `enableSingleRequest()` hay `enableServices()` — script tự xử lý:
- Trang **chưa có** GPT setup: adsticky tự bật SRA, nhiều sticky gọi liền nhau sẽ batch chung 1 request.
- Trang **đã có** ad stack GPT riêng: adsticky phát hiện `pubadsReady` và không đụng vào config sẵn có. Load script lúc nào cũng được, gọi `adsticky()` sau đó.

### 1.3. WordPress

```php
wp_enqueue_script('adsticky',
  'https://cdn.jsdelivr.net/gh/Bigfourth/adsbyBigFourth/sticky.js', [], '1.3', false);
wp_add_inline_script('adsticky',
  "adsticky('/22796784223/sticky_bottom','bottom');");
```

---

## 2. API

```js
adsticky(adUnitPath, position [, options])
```

| Tham số | Kiểu | Mô tả |
|---|---|---|
| `adUnitPath` | string | Đường dẫn ad unit GAM, vd `/22796784223/sticky_bottom` |
| `position` | string | `'bottom'` \| `'top'` \| `'left'` \| `'right'` |
| `options` | object \| array | Tùy chọn (bảng dưới), hoặc **array sizes** làm shorthand |

Trả về `divId` của slot (dùng debug), hoặc `undefined` nếu viewport hiện tại không có size nào để serve (khi đó không tạo DOM).

### 2.1. Options

| Option | Mặc định | Mô tả |
|---|---|---|
| `sizes` | `null` | Sizes cố định mọi viewport, vd `[[300,600],[300,250]]`. **Ưu tiên cao nhất**, bỏ qua mapping |
| `sizeMapping` | `null` | Size mapping custom theo viewport, format GPT: `[ [[minW,minH],[sizes]], ... ]` sắp từ lớn xuống nhỏ |
| `refreshInterval` | `60` | Số giây **viewable thực tế** giữa các lần refresh |
| `maxRefreshes` | `10` | Số lần refresh tối đa mỗi slot |
| `offset` | `110` | Chỉ áp dụng left/right: khoảng cách từ đáy màn hình (px). `0` = dính sát góc dưới |
| `kv` | `null` | Key-value targeting thêm: `{ tier: '1', section: 'home' }` |
| `sra` | `true` | Tự bật SRA nếu trang chưa `enableServices`. Set `false` để tắt |
| `zIndex` | `2147483641` | z-index wrapper |
| `bg` | `'#fafafa'` | Màu nền wrapper + nút điều khiển |

### 2.2. Thứ tự ưu tiên size

```
options.sizes  >  options.sizeMapping  >  default mapping theo position
```

### 2.3. Default size mapping

**bottom / top** (max height 100):

| Viewport | Sizes |
|---|---|
| ≥ 768px | 728x90, 320x100, 320x50 |
| < 768px | 320x100, 320x50 |

**left / right:**

| Viewport | Sizes |
|---|---|
| ≥ 1500px | 300x600, 300x250, 160x600, 120x600 |
| ≥ 1200px | 160x600, 120x600 |
| < 1200px | không serve, không tạo DOM |

Mapping dùng `defineSizeMapping` chuẩn GPT — GPT tự chọn size theo viewport **ở mỗi lần fetch/refresh**. Wrapper tự resize theo creative thực tế thắng auction (vd slot khai 300x600 nhưng fill 300x250 → wrapper co về 300x250, không dư khung trống).

---

## 3. Ví dụ

```js
// Bottom, mọi thứ mặc định (mapping responsive, refresh 60s)
adsticky('/22796784223/sticky_bottom', 'bottom');

// Top, refresh 45s
adsticky('/22796784223/sticky_top', 'top', { refreshInterval: 45 });

// Right, sizes cố định — shorthand array
adsticky('/22796784223/sticky_right', 'right', [[300,600],[300,250]]);

// Left dính sát góc dưới (kiểu overlay), thêm KV
adsticky('/22796784223/sticky_left', 'left', {
  sizes: [[300,600]],
  offset: 0,
  kv: { tier: '1' }
});

// Side sticky với mapping custom: chỉ serve 300x600 từ 1400px
adsticky('/22796784223/sticky_right', 'right', {
  sizeMapping: [
    [[1400, 0], [[300,600],[160,600]]],
    [[0, 0], []]
  ]
});
```

⚠️ Dùng `sizes` (cố định) cho left/right nghĩa là **mobile cũng request** — tự gate nếu cần:

```js
if (window.innerWidth >= 1200) {
  adsticky('/22796784223/sticky_right', 'right', [[300,600]]);
}
```

---

## 4. Cơ chế hoạt động

### 4.1. Refresh engine

- 1 ticker chung 1s cho mọi slot (không phải mỗi slot 1 timer).
- Mỗi giây chỉ **cộng dồn** khi đủ cả 4 điều kiện: tab visible + slot viewable ≥50% (`slotVisibilityChanged`) + đã fill + không collapsed/closed.
- Đủ `refreshInterval` giây active → refresh. Nhiều slot đến hạn cùng lúc → **gộp 1 call** `pubads().refresh([slots])`.
- KV `refresh=0,1,2...` tự set mỗi lần — dùng để tách report first-call vs refreshed, và set Unified Pricing Rule floor riêng cho `refresh>0`.
- KV `pos=bottom|top|left|right` tự set — tách report theo vị trí kể cả khi dùng chung 1 ad unit.

### 4.2. Điều khiển của user

| Hành động | Kết quả |
|---|---|
| Tab collapse (⌄ ‹ ›) | Trượt ẩn wrapper, slot còn sống, **refresh tạm dừng** |
| Mở lại tab | Hiện lại, refresh đếm tiếp |
| Nút ✕ | `destroySlots` + xóa DOM, **dừng vĩnh viễn** phiên đó |

### 4.3. No-fill

Lần request đầu không fill → wrapper giữ ẩn, không có khung trắng. (Refresh sau đó no-fill thì wrapper vẫn hiện — nếu unit fill rate thấp, cân nhắc yêu cầu bản vá auto-hide.)

---

## 5. Policy Google — bắt buộc đọc

Nguồn: *Guidelines and restrictions for implementing sticky ads* (Ad Manager Help 7246067).

**Bottom/Top — đạt sẵn nếu:**
- Đã tick declaration + refresh trigger trong GAM (mục 1.1)
- Tổng diện tích ads trên viewport **ít hơn content** → không chạy top + bottom đồng thời trên mobile
- Không để ad khác quá gần sticky

**Left/Right — script KHÔNG tự đảm bảo compliance:**
- Vertical sticky **không bao giờ được đè/lấn content**, kể cả khi resize cửa sổ. Điều kiện thực tế: `viewport ≥ contentWidth + 2×adWidth + margin`. Ngưỡng 1200px mặc định chỉ đúng khi content container ≤ ~880px.
- Chạy left/right kiểu overlay đè content (như nhiều site VN đang làm) = chấp nhận rủi ro bị Google flag khi review.
- Muốn an toàn tuyệt đối: đặt ad trong sidebar layout với `position:sticky` thay vì overlay.

---

## 6. Vận hành & Debug

### 6.1. jsDelivr cache

URL không pin version cache **7 ngày**. Sau khi push code mới:

- Purge thủ công: `https://purge.jsdelivr.net/gh/Bigfourth/adsbyBigFourth/sticky.js`
- Hoặc pin tag để kiểm soát rollout: `.../adsbyBigFourth@v1.3/sticky.js`

### 6.2. Kiểm tra

1. Mở trang với `?googfc` → GPT console: check slot `adsticky_bottom_1` có size mapping, KV `pos`, `refresh`.
2. Giữ tab mở, slot trong màn hình 60s → Network tab xuất hiện request `ads?` mới với `refresh=1`.
3. Test collapse/close từng vị trí.
4. Resize cửa sổ nhỏ hơn 1200px → left/right không được render (với mapping mặc định).

### 6.3. Lỗi thường gặp

| Hiện tượng | Nguyên nhân | Xử lý |
|---|---|---|
| Sticky không hiện | No-fill lần đầu (by design) hoặc viewport không có size | Check `?googfc`, check mapping |
| Không refresh | Slot không đạt 50% viewable, tab ẩn, hoặc đang collapsed | Đúng thiết kế — refresh chỉ đếm thời gian viewable |
| Sticky fetch riêng lẻ dù muốn SRA | Trang đã `enableServices()` trước khi adsticky define slot | Bình thường với GPT; muốn batch thì gọi adsticky trước display đầu tiên của trang |
| Code mới không ăn trên site | jsDelivr cache | Purge hoặc pin version (6.1) |
| Left/right đè content | Content container quá rộng so với viewport | Tăng ngưỡng mapping hoặc chuyển sidebar in-layout (mục 5) |

### 6.4. Tích hợp gpt-gate.js

Gọi `adsticky()` trong nhánh gate **pass** (sau khi inject gpt.js). Nếu gate block GPT thì đừng gọi — tránh tạo wrapper thừa (slot sẽ treo trong `googletag.cmd` vô hại nhưng DOM vẫn được tạo).

```js
// trong callback gate pass
loadGpt(function () {
  adsticky('/22796784223/sticky_bottom', 'bottom');
});
```
