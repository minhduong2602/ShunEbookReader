---
version: alpha
name: cozy-shelf-design-analysis
description: A warm, storybook-flavored reading-app interface built on a taupe "paper" canvas with cream cards, one coral action color, and hand-illustrated book covers that carry an amber bookmark tab and a soft page-stack shadow. Rounded, chunky display type sits over a friendly geometric body font. Chrome is minimal and light — a pill search bar, circular icon buttons, and colorful rounded-square category chips — so the book artwork and the coral CTA are the only loud things on the page.

colors:
  primary: "#E8604F"
  primary-press: "#D6503F"
  accent-amber: "#EDB65B"
  accent-purple: "#8D7FC4"
  accent-blue: "#4A7FC1"
  accent-green: "#7BAA5C"
  accent-teal: "#4FA6A8"
  ink: "#3D2B1F"
  ink-muted: "#6B5645"
  body: "#5C4A3B"
  author-rust: "#B54B3C"
  on-primary: "#FFFFFF"
  on-dark: "#FFFFFF"
  canvas-page: "#E7DDCE"
  canvas: "#FBF6EC"
  surface-card: "#FFFFFF"
  surface-card-tint: "#F1E9DA"
  surface-input: "#F0E7D8"
  surface-page-edge: "#F5EFE3"
  hairline: "#E4D9C8"
  divider-soft: "#EFE6D8"

typography:
  greeting:
    fontFamily: "Baloo 2, Fredoka, system-ui, sans-serif"
    fontSize: 22px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: 0
  section-heading:
    fontFamily: "Baloo 2, Fredoka, system-ui, sans-serif"
    fontSize: 20px
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: 0
  banner-heading:
    fontFamily: "Baloo 2, Fredoka, system-ui, sans-serif"
    fontSize: 24px
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: 0
  book-title:
    fontFamily: "Poppins, system-ui, sans-serif"
    fontSize: 16px
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: 0
  book-author:
    fontFamily: "Poppins, system-ui, sans-serif"
    fontSize: 13px
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: 0
  category-label:
    fontFamily: "Poppins, system-ui, sans-serif"
    fontSize: 12px
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: 0
  button-label:
    fontFamily: "Poppins, system-ui, sans-serif"
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: 0
  input-text:
    fontFamily: "Poppins, system-ui, sans-serif"
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0
  body-text:
    fontFamily: "Poppins, system-ui, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  caption:
    fontFamily: "Poppins, system-ui, sans-serif"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0
  mini-card-title:
    fontFamily: "Poppins, system-ui, sans-serif"
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: 0
  chat-text:
    fontFamily: "Poppins, system-ui, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: 0

rounded:
  none: 0px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 20px
  xl: 28px
  pill: 9999px
  full: 9999px

spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 40px
  section: 56px

components:
  header-greeting:
    backgroundColor: transparent
    textColor: "{colors.ink}"
    typography: "{typography.greeting}"
  avatar-circle:
    backgroundColor: "{colors.surface-card}"
    rounded: "{rounded.full}"
    size: 44px
  cart-icon-button:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.full}"
    size: 44px
  search-input:
    backgroundColor: "{colors.surface-input}"
    textColor: "{colors.ink-muted}"
    typography: "{typography.input-text}"
    rounded: "{rounded.pill}"
    padding: 14px 20px
    height: 48px
  search-button-circular:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.full}"
    size: 48px
  search-button-gradient:
    backgroundColor: "linear-gradient(90deg, #6BB3D9, #8D7FC4, #E8604F, #EDB65B)"
    textColor: "{colors.on-primary}"
    typography: "{typography.button-label}"
    rounded: "{rounded.pill}"
    padding: 12px 28px
    height: 44px
  category-icon-chip:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink-muted}"
    typography: "{typography.category-label}"
    rounded: "{rounded.md}"
    size: 56px
  section-header:
    backgroundColor: transparent
    textColor: "{colors.ink}"
    typography: "{typography.section-heading}"
  button-view-all-ghost:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.button-label}"
    rounded: "{rounded.pill}"
    padding: 10px 18px
  button-view-all-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button-label}"
    rounded: "{rounded.pill}"
    padding: 12px 20px
  nav-arrow-circular:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.on-dark}"
    rounded: "{rounded.full}"
    size: 36px
  book-cover-card:
    backgroundColor: "dynamic (per-book illustration color)"
    rounded: "{rounded.lg}"
    width: 140px 
  bookmark-ribbon-tab:
    backgroundColor: "{colors.accent-amber}"
    rounded: "{rounded.xs}"
    size: 16px 26px
  bottom-nav-bar:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.xl}"
    height: 64px
  sidebar-rail:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink-muted}"
    width: 72px
  subscribe-ribbon:
    backgroundColor: "{colors.accent-blue}"
    textColor: "{colors.on-dark}"
    typography: "{typography.category-label}"
    rounded: "{rounded.sm}"
  promo-banner-card:
    backgroundColor: "{colors.surface-card-tint}"
    textColor: "{colors.ink}"
    typography: "{typography.banner-heading}"
    rounded: "{rounded.lg}"
    padding: 24px
  info-mini-card:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.mini-card-title}"
    rounded: "{rounded.md}"
    padding: 12px 16px
  chat-bubble-user:
    backgroundColor: "{colors.accent-purple}"
    textColor: "{colors.on-dark}"
    typography: "{typography.chat-text}"
    rounded: "{rounded.lg}"
    padding: 10px 14px
  chat-bubble-bot:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.chat-text}"
    rounded: "{rounded.lg}"
    padding: 10px 14px
  chat-input-bar:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink-muted}"
    typography: "{typography.input-text}"
    rounded: "{rounded.pill}"
    height: 48px
    padding: 8px 16px
  chat-send-button:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.full}"
    size: 40px
---

## Overview

Cozy Shelf is a **storybook-warm, illustration-first reading app**. The whole surface sits on a dusty taupe "paper" background (`{colors.canvas-page}`), with the actual UI floating on a slightly lighter cream canvas (`{colors.canvas}`). Nothing on the chrome is loud — pill search bars, plain white utility cards, circular icon buttons — so that the one genuinely saturated thing on the screen, the hand-illustrated book covers, gets to be the hero. Every book cover carries two signature details that repeat everywhere: a small amber bookmark ribbon clipped to the bottom-right corner, and a pale "page-stack" edge peeking out beneath the cover art, which together read instantly as *book* rather than *generic card*.

Two shells share this one language: a **single-column mobile app** (greeting header → search → category rail → stacked carousels → floating bottom nav) and a **three-column desktop dashboard** (fixed icon rail → main catalog → a live chat panel). The desktop chat panel introduces the system's second accent — a soft periwinkle purple for the user's own messages — and reuses the same pill input, circular send button, and small book-cover thumbnails as the rest of the catalog, so the AI assistant never feels like a bolted-on widget.

Typography pairs a chunky, rounded display face for greetings and section titles with a plain geometric sans for everything else — book titles, author names, buttons, chat text. Color is otherwise restrained: one coral accent (`{colors.primary}`) does all the "act on this" work (search button, cart, primary CTA pill, chat send button), and a small constellation of category colors (purple, blue, green, teal) only ever appears inside the illustrated icon art and the chat bubble, never as a random UI fill.

**Key Characteristics:**
- Warm two-layer background: taupe page (`{colors.canvas-page}`) behind a cream app canvas (`{colors.canvas}`) — never pure white, never pure gray.
- One coral accent (`{colors.primary}` — #E8604F) for every actionable surface: search button, cart badge, primary pill CTA, chat send button.
- Every book cover is a mini-component, not a flat image: rounded top, a peeking `{colors.surface-page-edge}` page strip, an amber bookmark tab (`{colors.accent-amber}`), and its own soft "resting" shadow.
- Chunky rounded display type (`{typography.greeting}`, `{typography.section-heading}`, `{typography.banner-heading}`) for headings; a plain geometric sans for all body, button, and chat text.
- Circular chrome throughout: avatar, cart button, prev/next nav arrows, chat send button, sidebar icons — the circle is the system's secondary shape after the pill.
- Category chips are white/cream rounded squares holding a colorful icon illustration, not solid-color tiles — color lives in the artwork, not the container.
- Consistent layout rhythm: greeting/search block → horizontally-scrolling category rail → a repeating "section title + view-all + prev/next" header above a horizontal book carousel.
- Desktop adds a persistent icon rail on the left and a chat panel on the right, both reusing the app's pill inputs and circular buttons rather than inventing new chrome.

## Colors

> **Nguồn phân tích:** màn hình mobile "Trang chủ" và bảng điều khiển desktop kèm Chat. Bảng màu là một hệ thống thống nhất giữa hai form-factor; chỉ tỉ lệ dùng nền sáng/tối thay đổi.

### Brand & Accent
- **Coral Action** (`{colors.primary}` — #E8604F): Màu hành động duy nhất của hệ thống — nút search hình tròn, badge giỏ hàng, pill "view all" chính trên banner khuyến mãi, và nút gửi tin nhắn trong chat. Bất cứ chỗ nào người dùng "bấm vào để làm gì đó quan trọng", nó là màu này.
- **Coral Press** (`{colors.primary-press}` — #D6503F): Biến thể tối hơn dùng cho trạng thái nhấn (active) của mọi phần tử coral.
- **Amber Bookmark** (`{colors.accent-amber}` — #EDB65B): Không phải màu tương tác — đây là chi tiết nhận diện của riêng bìa sách: dải ruy-băng đánh dấu trang luôn cắm ở góc dưới-phải mỗi cuốn sách.
- **Chat Purple** (`{colors.accent-purple}` — #8D7FC4): Nền bong bóng chat của người dùng trên desktop; cũng là màu icon minh hoạ cho danh mục "Fiction".
- **Ribbon Blue** (`{colors.accent-blue}` — #4A7FC1): Màu dải ruy-băng "subscribe" dọc ở sidebar desktop; cũng xuất hiện trong icon "Fantasy".
- **Icon Green** (`{colors.accent-green}` — #7BAA5C): Dùng trong minh hoạ icon danh mục "Manga"/"Audiobooks".
- **Icon Teal** (`{colors.accent-teal}` — #4FA6A8): Dùng trong minh hoạ icon danh mục "eBooks".

### Surface
- **Page Taupe** (`{colors.canvas-page}` — #E7DDCE): Nền ngoài cùng — phía sau khung điện thoại (mobile) hoặc toàn bộ viewport (desktop). Đây là lớp "bàn làm việc" mà ứng dụng đặt lên trên.
- **App Canvas** (`{colors.canvas}` — #FBF6EC): Nền chính bên trong ứng dụng — nơi header, thanh search và các carousel sách nằm trực tiếp lên, không cần thẻ bọc riêng.
- **Card White** (`{colors.surface-card}` — #FFFFFF): Nền của mọi thẻ tiện ích phẳng — chip danh mục, nút "View All", thanh điều hướng dưới/sidebar, thẻ mini-info, bong bóng chat của bot.
- **Card Tint** (`{colors.surface-card-tint}` — #F1E9DA): Biến thể ấm hơn của Card White, dùng riêng cho banner khuyến mãi lớn để nó tách khỏi các thẻ trắng xung quanh mà không cần viền.
- **Input Fill** (`{colors.surface-input}` — #F0E7D8): Nền thanh tìm kiếm — đậm hơn App Canvas một chút để ô nhập liệu luôn đọc được là "có thể bấm vào".
- **Page Edge** (`{colors.surface-page-edge}` — #F5EFE3): Dải màu kem mỏng lộ ra bên dưới mỗi bìa sách, mô phỏng cạnh trang giấy — chi tiết nhỏ nhưng lặp lại ở *mọi* bìa sách trong hệ thống.

### Text
- **Ink** (`{colors.ink}` — #3D2B1F): Màu chữ cho mọi tiêu đề — lời chào, tên section, tiêu đề sách, tiêu đề banner. Nâu đậm gần đen, không dùng đen tuyệt đối để giữ cảm giác ấm.
- **Ink Muted** (`{colors.ink-muted}` — #6B5645): Nhãn danh mục, placeholder ô tìm kiếm, icon không active trên thanh điều hướng.
- **Body** (`{colors.body}` — #5C4A3B): Đoạn văn mô tả (banner khuyến mãi, thẻ mini-info).
- **Author Rust** (`{colors.author-rust}` — #B54B3C): Màu riêng cho tên tác giả bên dưới mỗi tiêu đề sách — một điểm nhấn đỏ-gạch ấm, tách biệt khỏi Ink nhưng không cạnh tranh với Coral Action.

### Hairlines & Borders
- **Hairline** (`{colors.hairline}` — #E4D9C8): Viền 1px cực nhẹ, gần như không thấy, dùng cho bong bóng chat của bot để phân biệt nó với nền canvas cùng tông.
- **Divider Soft** (`{colors.divider-soft}` — #EFE6D8): Dùng làm ranh giới mềm giữa các khối nội dung khi cần, không phải một đường kẻ cứng.

### Brand Gradient
Hệ thống chủ yếu **không dùng gradient trang trí** — ngoại lệ duy nhất là nút "search" dạng pill trên bản desktop, dùng gradient nhiều màu (`linear-gradient(90deg, #6BB3D9, #8D7FC4, #E8604F, #EDB65B)`) đi qua đúng các màu accent đã có trong hệ thống. Đây là điểm nhấn "vui vẻ" duy nhất được phép có gradient; mọi nút khác luôn là màu phẳng.

## Typography

### Font Family
- **Display**: `Baloo 2, Fredoka, system-ui, sans-serif` — mặt chữ tròn, dày, thân thiện dùng cho lời chào và tiêu đề section/banner. Đây là "giọng nói" vui vẻ của thương hiệu.
- **Body / UI**: `Poppins, system-ui, sans-serif` — sans hình học rõ ràng dùng cho mọi thứ còn lại: tiêu đề sách, tên tác giả, nhãn nút, placeholder, chat.

### Hierarchy

| Token | Size | Weight | Line Height | Use |
|---|---|---|---|---|
| `{typography.banner-heading}` | 24px | 700 | 1.25 | Tiêu đề banner khuyến mãi lớn |
| `{typography.greeting}` | 22px | 700 | 1.2 | "Hi, Sarah!" |
| `{typography.section-heading}` | 20px | 700 | 1.25 | "Popular", "eBooks", "Chat" |
| `{typography.book-title}` | 16px | 700 | 1.3 | Tên sách trên mỗi thẻ bìa |
| `{typography.input-text}` | 15px | 400 | 1.4 | Placeholder ô tìm kiếm, ô chat |
| `{typography.body-text}` | 14px | 400 | 1.5 | Mô tả banner, mô tả thẻ mini |
| `{typography.chat-text}` | 14px | 400 | 1.45 | Nội dung bong bóng chat |
| `{typography.button-label}` | 14px | 600 | 1.2 | Nhãn nút "View All", CTA |
| `{typography.mini-card-title}` | 14px | 600 | 1.3 | Tiêu đề thẻ "Top 50..." |
| `{typography.book-author}` | 13px | 500 | 1.3 | Tên tác giả (màu Author Rust) |
| `{typography.category-label}` | 12px | 600 | 1.3 | Nhãn dưới icon danh mục |
| `{typography.caption}` | 12px | 400 | 1.4 | Chú thích phụ |

### Principles
- **Display luôn tròn, body luôn phẳng.** Không bao giờ dùng font display cho một đoạn văn dài, và không bao giờ dùng font body cho lời chào/tiêu đề section — ranh giới này là tuyệt đối, giống cách Apple tách SF Pro Display khỏi SF Pro Text.
- **Weight chỉ có hai nấc chính: 400 và 700**, cộng 500/600 cho nhãn/nút. Không có weight 300 hay 800 — hệ thống này không cần độ "airy" cực nhẹ, nó cần cảm giác chắc, tròn, dễ đọc.
- **Không letter-spacing âm.** Ngược hẳn với các hệ thống kiểu Apple — chữ ở đây tracking mặc định hoặc hơi rộng, vì font tròn cần khoảng thở để không dính chữ.
- **Tên tác giả luôn có màu riêng.** `{colors.author-rust}` không bao giờ dùng cho tiêu đề sách hay heading — nó chỉ tồn tại như phụ chú ngay dưới tiêu đề, tạo nhịp hai màu lặp lại trên mọi thẻ sách.

## Layout

### Spacing System
- **Base unit:** 4px. Layout thực tế snap vào 8/12/16/24/32.
- **Tokens:** `{spacing.xxs}` 4px · `{spacing.xs}` 8px · `{spacing.sm}` 12px · `{spacing.md}` 16px · `{spacing.lg}` 24px · `{spacing.xl}` 32px · `{spacing.xxl}` 40px · `{spacing.section}` 56px.
- **Lề ngoài màn hình (mobile):** 24px trái/phải; 32px từ mép trên tới header.
- **Khoảng cách giữa header và search bar:** 12px.
- **Khoảng cách trước mỗi section mới ("Popular", "eBooks"):** 24px.
- **Khoảng cách giữa nút "View All" và cặp mũi tên điều hướng:** 8px.
- **Khoảng cách giữa hai thẻ sách trong carousel:** 16px (mobile) / 20px (desktop, vì thẻ nhỏ hơn và nhiều hơn trên một hàng).
- **Padding bên trong banner khuyến mãi và thẻ tiện ích:** `{spacing.lg}` (24px).
- **Gutter giữa icon danh mục:** 12–16px.

### Grid & Container
- **Mobile:** cột đơn, full-width trong khung điện thoại; các carousel sách cuộn ngang, không wrap.
- **Desktop:** shell 3 cột cố định — sidebar rail 72px trái, khu vực catalog chính chiếm phần lớn chiều rộng, panel Chat ~340–380px phải, không co giãn theo nội dung.
- **Category rail:** cuộn ngang trên cả hai form-factor; 6 chip hiển thị trên mobile trước khi cuộn, 10 chip trên desktop.
- **Carousel sách:** 2 thẻ hiển thị đầy đủ trên mobile trước khi cuộn; 5 thẻ trên desktop.

### Whitespace Philosophy
Không khí trong hệ thống này ấm và "dày" hơn Apple — khoảng trắng không phải để tôn ảnh sản phẩm lên bệ, mà để mỗi cuốn sách trông như đang thực sự "đứng" trên kệ cạnh nhau, có đủ chỗ để đổ bóng riêng. Section header luôn có ít nhất 24px phía trên nó để tách rõ khỏi carousel trước; bên trong một carousel, khoảng cách giữa các thẻ chỉ 16–20px — đủ gần để đọc như một "hàng sách" liền mạch.

## Elevation & Depth

| Level | Treatment | Use |
|---|---|---|
| Flat | Không shadow | App canvas, section header, nhãn danh mục |
| Soft chip | `0px 4px 12px rgba(61, 43, 31, 0.08)` | Chip danh mục, nút "View All", mũi tên điều hướng, thanh nav dưới/sidebar |
| Book shadow | `0px 10px 24px rgba(61, 43, 31, 0.16)` | Thẻ bìa sách — đậm hơn hẳn shadow của UI chrome để tạo cảm giác sách đang "đứng" và tách khỏi nền |
| Chat bubble | `0px 2px 6px rgba(61, 43, 31, 0.05)` | Bong bóng chat của bot (kết hợp với viền `{colors.hairline}` thay vì chỉ dựa vào shadow) |

**Triết lý shadow.** Hai tầng shadow rõ rệt: một tầng "chip" rất nhẹ dùng cho mọi phần tử UI phẳng (nút, chip, thanh nav), và một tầng "book" đậm hơn hẳn dành riêng cho bìa sách — tương tự cách Apple chỉ có một shadow duy nhất cho ảnh sản phẩm. Card trắng phẳng (thẻ mini-info, banner) không có shadow riêng — chúng dựa vào sự tương phản màu nền (`{colors.surface-card}` trên `{colors.canvas}`) để nổi lên, không dựa vào đổ bóng.

### Decorative Depth
- **Dải trang giấy** (`{colors.surface-page-edge}`) lộ ra bên dưới mỗi bìa sách tạo chiều sâu mà không cần shadow — đây là một "shadow giả" bằng màu, không phải CSS box-shadow.
- **Ruy-băng đánh dấu trang** (amber) đổ bóng nhỏ riêng của nó, tách khỏi bìa sách vài pixel, như thể nó thật sự đang cắm vào trang sách.

## Shapes

### Border Radius Scale

| Token | Value | Use |
|---|---|---|
| `{rounded.none}` | 0px | Không dùng ở đâu trong hệ thống này — mọi bề mặt đều bo góc |
| `{rounded.xs}` | 8px | Ruy-băng đánh dấu trang, góc dưới của bìa sách |
| `{rounded.sm}` | 12px | Góc trên của dải ruy-băng subscribe |
| `{rounded.md}` | 16px | Chip danh mục, thẻ mini-info |
| `{rounded.lg}` | 20px | Góc trên bìa sách, banner khuyến mãi, bong bóng chat |
| `{rounded.xl}` | 28px | Thanh điều hướng dưới (mobile) |
| `{rounded.pill}` | 9999px | Thanh tìm kiếm, mọi nút CTA, ô nhập chat |
| `{rounded.full}` | 9999px / 50% | Avatar, nút giỏ hàng, nút search tròn, mũi tên điều hướng, nút gửi chat |

### Book Cover Geometry
- **Tỉ lệ bìa sách:** khoảng 2:3 (dọc, giống bìa sách thật), rounded `{rounded.lg}` ở hai góc trên, rounded `{rounded.xs}` ở hai góc dưới.
- **Dải trang giấy:** một dải `{colors.surface-page-edge}` cao ~6–8px lộ ra ngay dưới mép bìa, cùng bo góc dưới với bìa — đây là chi tiết bắt buộc, không phải tuỳ chọn, trên mọi thẻ sách.
- **Ruy-băng:** hình chữ nhật nhỏ ~16×26px, màu `{colors.accent-amber}`, đặt chồng lên góc dưới-phải của bìa, nhô ra khỏi mép bìa khoảng 30–40% chiều cao của nó.
- **Chip danh mục:** hình vuông bo góc `{rounded.md}`, 56px (mobile) / 52px (desktop), chứa minh hoạ icon nhiều màu căn giữa, nền luôn `{colors.surface-card}` bất kể màu icon bên trong là gì.

## Components

### Header & Search

**`header-greeting`** — Hàng trên cùng của mọi màn hình. Trái: `{component.avatar-circle}` (44px, ảnh người dùng) + text "Hi, {name}!" trong `{typography.greeting}`. Phải: `{component.cart-icon-button}` — nền `{colors.primary}`, icon giỏ hàng trắng, kèm badge số lượng nhỏ khi có sản phẩm trong giỏ.

**`search-input`** — Nền `{colors.surface-input}`, chữ `{colors.ink-muted}` trong `{typography.input-text}`, rounded `{rounded.pill}`, cao 48px, padding 14px × 20px. Trên mobile luôn đi kèm `{component.search-button-circular}` (48px, nền coral, icon kính lúp trắng) đặt sát bên phải. Trên desktop, nút search đổi thành `{component.search-button-gradient}` — pill riêng biệt với gradient nhiều màu và nhãn "search".

### Category Rail

**`category-icon-chip`** — Thẻ vuông bo `{rounded.md}`, 52–56px, nền `{colors.surface-card}`, không viền, shadow "soft chip". Bên trong là minh hoạ icon nhiều màu (không phải nền màu phẳng — màu sắc nằm trong hình vẽ). Nhãn bên dưới trong `{typography.category-label}`, màu `{colors.ink-muted}`, căn giữa, cách icon `{spacing.xs}` (8px). Cả hàng cuộn ngang, khoảng cách giữa các chip 12–16px.

### Section Header & Carousel

**`section-header`** — Trái: tên section ("Popular", "eBooks") trong `{typography.section-heading}`, màu `{colors.ink}`. Phải: cụm gồm `{component.button-view-all-ghost}` rồi hai `{component.nav-arrow-circular}` (trái/phải), cách nhau `{spacing.xs}` (8px).

**`button-view-all-ghost`** — Nền `{colors.surface-card}` trắng, chữ `{colors.ink}` trong `{typography.button-label}`, rounded `{rounded.pill}`, padding 10px × 18px, shadow "soft chip", không viền.

**`nav-arrow-circular`** — 36px, nền `{colors.ink}` (nâu đậm gần đen), icon mũi tên trắng, rounded `{rounded.full}`. Dùng theo cặp để điều khiển carousel bên dưới section header.

**`book-cover-card`** — Đơn vị nội dung trung tâm của toàn hệ thống. Bìa minh hoạ đầy màu (màu riêng theo từng cuốn), rounded `{rounded.lg}` ở góc trên / `{rounded.xs}` ở góc dưới, mang shadow "book" (`0px 10px 24px rgba(61,43,31,0.16)`), có dải `{colors.surface-page-edge}` lộ dưới đáy và `{component.bookmark-ribbon-tab}` chồng lên góc dưới-phải. Dưới bìa, cách `{spacing.sm}` (12px): tên sách trong `{typography.book-title}` (màu `{colors.ink}`, tối đa 2 dòng), rồi tên tác giả trong `{typography.book-author}` (màu `{colors.author-rust}`).

**`bookmark-ribbon-tab`** — ~16×26px, nền `{colors.accent-amber}`, rounded `{rounded.xs}` ở đầu trên, đáy có thể vát nhọn nhẹ để giống ruy-băng thật. Luôn đặt chồng lên góc dưới-phải bìa sách, không xuất hiện ở vị trí nào khác trong hệ thống.

### Navigation Shells

**`bottom-nav-bar`** (mobile) — Thanh nổi cố định đáy màn hình, nền `{colors.surface-card}`, rounded `{rounded.xl}` (hoặc pill toàn phần), cao 64px, shadow "soft chip". 5 icon cách đều: icon đầu tiên (lưới nhiều màu) luôn ở trạng thái active với màu đầy đủ; 4 icon còn lại (star, heart, play, bookmark) ở trạng thái outline, màu `{colors.ink-muted}`.

**`sidebar-rail`** (desktop) — Cột dọc cố định trái, rộng 72px, nền `{colors.surface-card}`. Trên cùng: `{component.avatar-circle}`. Bên dưới: cùng bộ 5 icon của `{component.bottom-nav-bar}` nhưng xếp dọc. Dưới cùng: `{component.subscribe-ribbon}` — dải ruy-băng dọc nền `{colors.accent-blue}`, chữ trắng xoay 90°, đóng vai trò CTA thường trực.

### Promo & Info

**`promo-banner-card`** — Nền `{colors.surface-card-tint}`, rounded `{rounded.lg}`, padding `{spacing.lg}` (24px). Bố cục ngang: minh hoạ chồng sách bên trái, tiêu đề trong `{typography.banner-heading}` + mô tả trong `{typography.body-text}` ở giữa, `{component.button-view-all-primary}` (nền coral, icon con mắt) ở cuối khối text.

**`info-mini-card`** — Nền `{colors.surface-card}` trắng, rounded `{rounded.md}`, padding 12px × 16px, xếp thành cột 3 thẻ cạnh banner. Mỗi thẻ: icon vuông nhỏ nhiều màu + tiêu đề `{typography.mini-card-title}` + mô tả `{typography.caption}` màu `{colors.body}`.

### Chat Panel (desktop)

**`chat-bubble-user`** — Nền `{colors.accent-purple}`, chữ trắng trong `{typography.chat-text}`, rounded `{rounded.lg}` với góc dưới-phải bo nhỏ hơn (tạo hướng "đuôi" bong bóng), padding 10px × 14px, căn phải, rộng tối đa ~70% panel.

**`chat-bubble-bot`** — Nền `{colors.surface-card}` trắng, viền 1px `{colors.hairline}`, chữ `{colors.ink}`, cùng rounded `{rounded.lg}` nhưng góc dưới-trái bo nhỏ hơn, căn trái kèm avatar tròn nhỏ. Khi gợi ý sách, bong bóng chứa một hàng `book-cover-card` thu nhỏ (chat-book-thumbnail), cách nhau `{spacing.xs}` (8px).

**`chat-input-bar`** — Nền `{colors.surface-card}`, rounded `{rounded.pill}`, cao 48px, padding 8px × 16px, placeholder "Write a message..." trong `{typography.input-text}` màu `{colors.ink-muted}`. Trái: icon ghim tệp. Phải: `{component.chat-send-button}` — 40px, nền `{colors.primary}`, icon máy bay giấy trắng, rounded `{rounded.full}`.

## Do's and Don'ts

### Do
- Dùng đúng một màu coral (`{colors.primary}`) cho mọi thứ có thể bấm quan trọng: nút search, giỏ hàng, CTA chính, nút gửi chat.
- Luôn kèm dải `{colors.surface-page-edge}` + `{component.bookmark-ribbon-tab}` trên mọi `{component.book-cover-card}` — đây là chữ ký nhận diện, không phải chi tiết tuỳ chọn.
- Giữ nền hai lớp ấm: `{colors.canvas-page}` phía ngoài, `{colors.canvas}` bên trong ứng dụng — không bao giờ dùng trắng/xám thuần.
- Dùng font display tròn (`Baloo 2`/`Fredoka`) chỉ cho lời chào và tiêu đề section/banner; mọi thứ khác dùng `Poppins`.
- Áp dụng shadow "book" đậm hơn hẳn shadow "chip" — sự chênh lệch độ đậm đó là thứ khiến sách trông nổi khối trên nền phẳng.
- Giữ chip danh mục có nền trắng đồng nhất; để màu sắc chỉ sống trong hình minh hoạ icon.
- Lặp lại cụm "section title + view-all ghost + hai mũi tên tròn" giống hệt nhau ở mọi carousel — đây là nhịp layout xuyên suốt hệ thống.

### Don't
- Đừng dùng coral cho văn bản thường hay nền thẻ — nó chỉ dành cho hành động.
- Đừng bỏ dải ruy-băng amber hay dải trang giấy khi hiển thị sách ở kích thước nhỏ (kể cả trong chat) — thu nhỏ tỉ lệ, không lược bỏ chi tiết.
- Đừng dùng font `Baloo 2`/`Fredoka` cho đoạn văn dài — mặt chữ tròn chỉ dễ đọc ở cỡ lớn, ngắn.
- Đừng cho thẻ trắng phẳng (mini-info, banner) một shadow đậm — chúng nổi lên nhờ tương phản nền, không nhờ đổ bóng.
- Đừng thêm gradient trang trí ở bất kỳ đâu ngoài `{component.search-button-gradient}` trên desktop.
- Đừng trộn bo góc — bìa sách luôn là `{rounded.lg}`/`{rounded.xs}`, nút luôn là `{rounded.pill}`/`{rounded.full}`, thẻ tiện ích luôn là `{rounded.md}`.

## Responsive Behavior

### Breakpoints

| Name | Width | Key Changes |
|---|---|---|
| Mobile | ≤ 480px | Cột đơn full-width; 6 chip danh mục hiển thị trước cuộn; 2 thẻ sách hiển thị trước cuộn; `{component.bottom-nav-bar}` nổi cố định đáy |
| Tablet | 481–1023px | Vẫn cột đơn nhưng carousel hiển thị 3 thẻ sách; padding ngang tăng lên 32px |
| Desktop | ≥ 1024px | Shell 3 cột: `{component.sidebar-rail}` (72px) + khu catalog chính + `{component.chat-panel}` (~340–380px); 10 chip danh mục; 5 thẻ sách mỗi carousel; `{component.bottom-nav-bar}` được thay bằng `{component.sidebar-rail}` dọc |

### Touch Targets
- Tối thiểu 44 × 44px cho mọi icon-button — `{component.avatar-circle}`, `{component.cart-icon-button}`, `{component.search-button-circular}` đều đạt hoặc vượt chuẩn này.
- `{component.nav-arrow-circular}` (36px) là ngoại lệ nhỏ hơn có chủ đích — chúng là điều khiển carousel phụ, không phải hành động chính.

### Collapsing Strategy
- **Điều hướng chính**: `{component.bottom-nav-bar}` nổi ở mobile → chuyển thành `{component.sidebar-rail}` dọc cố định trái ở desktop, cùng bộ icon.
- **Chat**: ẩn hoàn toàn trên mobile (không có trong ảnh mẫu mobile) → panel cố định bên phải trên desktop.
- **Nút search**: `{component.search-button-circular}` (icon-only, 48px tròn) trên mobile → `{component.search-button-gradient}` (pill có nhãn) trên desktop.
- **Carousel sách & chip danh mục**: số lượng phần tử hiển thị cùng lúc tăng dần theo breakpoint, nhưng kích thước và tỉ lệ từng thẻ giữ nguyên — chỉ số lượng nhìn thấy thay đổi.

## Iteration Guide

1. Tập trung vào MỘT component mỗi lần chỉnh sửa. Tham chiếu trực tiếp key YAML của nó (`{component.book-cover-card}`, `{component.chat-bubble-user}`).
2. Biến thể của một component có sẵn (`-ghost`, `-primary`, `-circular`, `-gradient`) sống như các entry riêng trong `components:`.
3. Luôn dùng `{token.refs}` — không hard-code hex.
4. Bìa sách luôn cần đủ 3 chi tiết: rounded `{rounded.lg}`/`{rounded.xs}`, dải page-edge, ruy-băng amber. Thiếu một trong ba là sai hệ thống.
5. Font display (`Baloo 2`/`Fredoka`) chỉ cho heading ngắn; font body (`Poppins`) cho mọi văn bản dài hơn một dòng.
6. Khi cần thêm nhấn mạnh: đổi từ shadow "chip" sang shadow "book" trước khi nghĩ đến việc thêm viền hay đổi màu nền.
7. Với hành động mới: mặc định dùng coral (`{colors.primary}`) trừ khi đó là tin nhắn người dùng gửi trong chat (dùng `{colors.accent-purple}`).

## Known Gaps

- Trạng thái lỗi/validation của ô tìm kiếm và ô chat không xuất hiện trong hai ảnh mẫu; chỉ tài liệu hoá được trạng thái mặc định.
- Dark mode không được thể hiện trong mẫu — toàn bộ hệ thống ở đây là biến thể sáng/ấm mặc định.
- Minh hoạ icon danh mục (stack sách nhiều màu, robot-manga, kim cương-fantasy...) là tài sản đồ hoạ cụ thể, không phải token thiết kế — component chỉ mô tả khung chứa (`{component.category-icon-chip}`), không mô tả nội dung icon.
- Độ dài chính xác và animation cuộn của carousel sách không xác định được từ ảnh tĩnh; tài liệu chỉ mô tả trạng thái nghỉ (resting state).
- Nội dung minh hoạ trên `{component.promo-banner-card}` (chồng sách 3D) là asset trang trí, không phải token — component chỉ mô tả bố cục và bề mặt.
