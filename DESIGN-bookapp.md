---
version: 1.0
name: BookApp-design-system
description: Hướng dẫn thiết kế (Design System) cho giao diện ứng dụng đọc sách mềm mại, thân thiện. Ngôn ngữ thiết kế tập trung vào tone màu nền beige ấm áp, các khối hình bo góc tròn (pill-shape), typography sans-serif bo tròn tạo cảm giác gần gũi, cùng với các điểm nhấn màu sắc tươi sáng (đỏ san hô, tím pastel, xanh dương) để phân chia cấp độ thông tin.

colors:
  primary: "#3e332a"
  on-primary: "#ffffff"
  canvas: "#e7dcd1"
  surface: "#ffffff"
  surface-chat: "#f4ede6"
  accent-red: "#df6b6b"
  accent-red-gradient: "linear-gradient(90deg, #df6b6b, #e59462)"
  accent-purple: "#8573b0"
  accent-blue: "#405b75"
  accent-green: "#6bb07b"
  accent-yellow: "#e5b762"
  text-main: "#3e332a"
  text-muted: "#a29991"
  text-inverse: "#ffffff"
  hairline: "#d8cdc2"

typography:
  display-lg:
    fontFamily: "Quicksand, Nunito, system-ui, sans-serif"
    fontSize: 24px
    fontWeight: 700
    lineHeight: 32px
  display-md:
    fontFamily: "Quicksand, Nunito, system-ui, sans-serif"
    fontSize: 20px
    fontWeight: 700
    lineHeight: 28px
  body-lg-strong:
    fontFamily: "Quicksand, Nunito, system-ui, sans-serif"
    fontSize: 16px
    fontWeight: 700
    lineHeight: 24px
  body-md:
    fontFamily: "Quicksand, Nunito, system-ui, sans-serif"
    fontSize: 14px
    fontWeight: 500
    lineHeight: 20px
  body-md-strong:
    fontFamily: "Quicksand, Nunito, system-ui, sans-serif"
    fontSize: 14px
    fontWeight: 700
    lineHeight: 20px
  body-sm:
    fontFamily: "Quicksand, Nunito, system-ui, sans-serif"
    fontSize: 12px
    fontWeight: 500
    lineHeight: 16px
  caption:
    fontFamily: "Quicksand, Nunito, system-ui, sans-serif"
    fontSize: 10px
    fontWeight: 600
    lineHeight: 14px
    textTransform: uppercase

rounded:
  none: 0px
  sm: 8px
  md: 12px
  lg: 24px
  full: 9999px

spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px

components:
  app-canvas:
    backgroundColor: "{colors.canvas}"
    padding: "0 {spacing.lg}"
  search-bar:
    backgroundColor: "rgba(255, 255, 255, 0.4)"
    textColor: "{colors.text-main}"
    typography: "{typography.body-md}"
    rounded: "{rounded.full}"
    padding: "{spacing.sm} {spacing.md}"
  button-primary:
    backgroundColor: "{colors.accent-red}"
    textColor: "{colors.text-inverse}"
    typography: "{typography.body-md-strong}"
    rounded: "{rounded.full}"
    padding: "{spacing.sm} {spacing.md}"
  button-gradient:
    background: "{colors.accent-red-gradient}"
    textColor: "{colors.text-inverse}"
    rounded: "{rounded.full}"
  button-icon-circular:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-main}"
    rounded: "{rounded.full}"
    padding: "{spacing.xs}"
  category-icon:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "{spacing.sm}"
  book-card:
    backgroundColor: "transparent"
    rounded: "{rounded.md}"
    shadow: "0px 8px 16px rgba(62, 51, 42, 0.1)"
  badge-new:
    backgroundColor: "{colors.accent-red}"
    textColor: "{colors.text-inverse}"
    typography: "{typography.caption}"
    rounded: "{rounded.sm}"
    padding: "{spacing.xxs} {spacing.xs}"
  chat-bubble-user:
    backgroundColor: "{colors.accent-purple}"
    textColor: "{colors.text-inverse}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg} {rounded.lg} {rounded.none} {rounded.lg}"
    padding: "{spacing.md}"
  chat-bubble-support:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-main}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg} {rounded.lg} {rounded.lg} {rounded.none}"
    padding: "{spacing.md}"
  subscribe-pill:
    backgroundColor: "{colors.accent-blue}"
    textColor: "{colors.text-inverse}"
    typography: "{typography.body-md-strong}"
    rounded: "{rounded.full}"
    padding: "{spacing.md} {spacing.lg}"
---

## Tổng quan (Overview)

Giao diện ứng dụng đọc sách được thiết kế với phong cách **Soft & Friendly UI** (mềm mại, thân thiện), sử dụng tone màu nền beige ấm áp (warm beige) kết hợp với các mảng màu trắng/off-white để làm nổi bật nội dung. Điểm đặc trưng nhất của thiết kế là việc lạm dụng có chủ ý các đường bo góc tròn (pill-shapes) trên thanh tìm kiếm, nút bấm, và khung chat, tạo cảm giác an toàn và dễ gần cho người dùng. 

Hệ thống màu sắc sử dụng sự tương phản nhẹ nhàng. Màu chữ chủ đạo là nâu đen (dark brown/ink) thay vì đen tuyền, giúp giảm căng thẳng cho mắt khi đọc. Các điểm nhấn màu sắc (đỏ san hô, tím pastel, gradient) được sử dụng một cách tinh tế trên các nút Call-to-Action (CTA) và khung chat.

**Đặc điểm chính:**
- Màu nền toàn trang là Beige ấm (`{colors.canvas}`), các thẻ nội dung nổi lên với nền trong suốt hoặc trắng (`{colors.surface}`).
- Sử dụng font chữ có đường nét bo tròn (Rounded Sans-serif) như Quicksand hoặc Nunito. 
- Mọi thành phần tương tác (Input, Button chính) đều được bo góc tối đa `{rounded.full}` (pill shape). Các thẻ sách, danh mục được bo góc vừa phải `{rounded.md}` (12px).
- Khung lưới (Grid & Layout) rất rõ ràng: Lề trái/phải luôn là 24px (`{spacing.lg}`). Khoảng cách giữa các phần lớn (Section) là 24px.
- Hiệu ứng đổ bóng (Drop shadow) rất nhẹ và ấm, chỉ dùng để nâng các thẻ sách (Book cards) hoặc nút nổi.

## Màu sắc (Colors)

### Thương hiệu & Điểm nhấn (Brand & Accent)
- **Nâu Đen (Ink/Primary)** (`{colors.primary}` — `#3e332a`): Màu chữ chính cho mọi Tiêu đề, văn bản quan trọng. Không dùng đen tuyền.
- **Đỏ San Hô (Accent Red)** (`{colors.accent-red}` — `#df6b6b`): Dùng cho nút Tìm kiếm (Search), nhãn "NEW", và chấm thông báo.
- **Tím Pastel (Accent Purple)** (`{colors.accent-purple}` — `#8573b0`): Màu đặc trưng cho bong bóng chat của người dùng (User chat bubble) và một số icon.
- **Xanh Biển Sâu (Accent Blue)** (`{colors.accent-blue}` — `#405b75`): Dùng cho nút "Subscribe" nổi ở mép màn hình.
- **Gradient Nổi Bật** (`{colors.accent-red-gradient}`): Dải gradient từ đỏ san hô sang cam nhẹ, dùng cho nút Search trên bản Desktop.

### Bề mặt (Surface)
- **Beige Ấm (Canvas)** (`{colors.canvas}` — `#e7dcd1`): Màu nền mặc định của toàn bộ ứng dụng.
- **Trắng (Surface)** (`{colors.surface}` — `#ffffff`): Dùng cho nền bong bóng chat của hệ thống, nền icon danh mục.
- **Nền Chat (Surface Chat)** (`{colors.surface-chat}` — `#f4ede6`): Màu nền khu vực Sidebar Chat, sáng hơn Canvas một chút.

### Văn bản (Text)
- **Text Main** (`{colors.text-main}` — `#3e332a`): Màu chữ nội dung chính.
- **Text Muted** (`{colors.text-muted}` — `#a29991`): Màu xám/nâu nhạt cho các văn bản phụ (Tác giả, "View All", Placeholder thanh tìm kiếm).
- **Text Inverse** (`{colors.text-inverse}` — `#ffffff`): Chữ trắng nằm trên các mảng màu đậm (Nút đỏ, Chat tím).

## Nghệ thuật chữ (Typography)

### Font Family
Hệ thống sử dụng một font chữ Sans-serif bo tròn duy nhất cho toàn bộ giao diện (Ví dụ: **Quicksand**, **Nunito**, hoặc các font có đặc tính tương đương). Font chữ này củng cố cảm giác thân thiện, phi kỹ thuật của một ứng dụng đọc sách/giải trí.

### Hệ thống Cấp bậc (Hierarchy)

| Token | Size | Weight | Line Height | Ứng dụng |
|---|---|---|---|---|
| `{typography.display-lg}` | 24px | 700 (Bold) | 32px | Tiêu đề lớn nhất ("Hi, Sarah!"). |
| `{typography.display-md}` | 20px | 700 (Bold) | 28px | Tên các Section ("Popular", "eBooks"). |
| `{typography.body-lg-strong}`| 16px | 700 (Bold) | 24px | Tên sách nổi bật trên giao diện Desktop. |
| `{typography.body-md-strong}`| 14px | 700 (Bold) | 20px | Tên sách ở thẻ thu gọn, Text trong nút bấm. |
| `{typography.body-md}` | 14px | 500 (Medium) | 20px | Nội dung chat, Text placeholder trong Search. |
| `{typography.body-sm}` | 12px | 500 (Medium) | 16px | Tên tác giả, phụ đề nhỏ. |
| `{typography.caption}` | 10px | 600 (Semi) | 14px | Chữ UPPERCASE cho các Badge ("NEW"). |

## Bố cục & Không gian (Layout & Spacing)

Dựa trên bản phân tích khung (wireframe) từ thiết kế mẫu, hệ thống không gian tuân thủ nghiêm ngặt các lưới kích thước:

### Spacing System (Hệ thống khoảng cách)
- **Lề toàn trang (Screen Margin)**: 24px (`{spacing.lg}`) cho 2 bên trái phải.
- **Top Header**: Cách đỉnh màn hình 32px (`{spacing.xl}`).
- **Khoảng cách giữa các Sections**: 24px (`{spacing.lg}`). Ví dụ: Từ Search bar đến Categories, từ Categories đến Popular section.
- **Khoảng cách nội bộ (Inner Padding/Gap)**:
  - Giữa Text Tiêu đề và Search bar: 12px (`{spacing.sm}`).
  - Padding bên trong Search bar: 12px (`{spacing.sm}`).
  - Khoảng cách giữa các Icon Category: 12px (`{spacing.sm}`).
  - Khoảng cách giữa các Thẻ sách (Book cards): 16px (`{spacing.md}`).
  - Khoảng cách giữa Tiêu đề Section và nút View All/Điều hướng: Căn lề hai bên (Space-between), khoảng cách các nút điều hướng là 8px (`{spacing.xs}`).

### Responsive (Chiến lược hiển thị)
- **Mobile**: Giao diện cuộn dọc, nội dung dàn 1 cột chính. Thanh điều hướng (Bottom Nav) nằm dưới cùng dạng pill-shape lơ lửng.
- **Desktop/Tablet**: Chia lưới 2 cột. Cột trái (chính) chứa nội dung sách (Tìm kiếm, Danh mục, Lưới sách). Cột phải dạng Sidebar cố định chứa giao diện Chat/Hỗ trợ khách hàng.

## Hình khối & Chiều sâu (Shapes & Elevation)

### Border Radius (Bo góc)
Hình khối là yếu tố định hình ngôn ngữ thiết kế của app này. Mọi thứ đều được bo tròn:
- `{rounded.full}` (9999px - Pill shape): Dùng cho Thanh tìm kiếm, Nút CTA (Search, Subscribe), Thanh Bottom Nav.
- `{rounded.lg}` (24px): Dùng cho các góc của khung bong bóng chat.
- `{rounded.md}` (12px): Dùng cho thẻ chứa icon danh mục, Thẻ sách (Book cover), Banner quảng cáo.
- `{rounded.sm}` (8px): Dùng cho các chi tiết nhỏ như Badge "NEW".

### Elevation (Đổ bóng)
Giao diện nhìn chung là phẳng (Flat), nhưng sử dụng bóng đổ (Drop Shadow) để phân tầng không gian nhẹ nhàng:
- Bóng đổ cho Thẻ sách: Bóng đổ mờ, ngả màu nâu/đen nhạt (ví dụ: `0px 8px 16px rgba(62, 51, 42, 0.1)`) để làm quyển sách tách biệt khỏi nền Canvas.
- Bóng đổ cho Thanh Bottom Nav trên Mobile: Giúp thanh này lơ lửng rõ rệt so với nội dung cuộn bên dưới.

## Các Thành phần cốt lõi (Components)

### Search & Inputs
**`search-bar`**
- Thanh tìm kiếm dạng hình viên thuốc (Pill).
- Background: Trắng trong suốt (rgba trắng trên nền beige).
- Icon kính lúp và text placeholder màu `{colors.text-muted}`.
- Nút Search (Mobile): Hình tròn màu `{colors.accent-red}`, đặt lọt lòng bên phải.
- Nút Search (Desktop): Hình pill, sử dụng `{colors.accent-red-gradient}`.

### Cards & Items
**`book-card`**
- Thẻ sách bao gồm hình ảnh bìa sách và 2 dòng text bên dưới (Tên sách - Bold, Tên tác giả - Medium màu muted).
- Góc bo bìa sách: `{rounded.md}` (12px).
- Thường có icon Bookmark (Ribbon) vắt ngang mép dưới của bìa sách.

**`category-icon`**
- Các icon vuông bo góc `{rounded.md}` (12px).
- Nền trắng `{colors.surface}`. Nhãn text bên dưới dùng `{typography.body-sm}`. Đặt huy hiệu (Badge) góc trên phải nếu có trạng thái mới.

### Chat System (Desktop Sidebar)
**`chat-bubble-user`**
- Bong bóng chat của người dùng.
- Background: `{colors.accent-purple}`. Text trắng.
- Góc bo: Bo 3 góc bằng `{rounded.lg}`, góc dưới bên phải `{rounded.none}` để tạo đuôi chỉ hướng.

**`chat-bubble-support`**
- Bong bóng chat của hệ thống hỗ trợ.
- Background: Trắng `{colors.surface}`. Text `{colors.text-main}`.
- Góc bo: Bo 3 góc `{rounded.lg}`, góc dưới bên trái `{rounded.none}`.

### Navigation
**`bottom-nav-mobile`**
- Nền trắng phẳng, dạng hình viên thuốc `{rounded.full}`, margin trôi nổi so với mép dưới màn hình.
- Các icon điều hướng căn đều (Space-around).

**`subscribe-pill`**
- Nút bám lề (Floating button) xoay dọc ở Desktop.
- Nền `{colors.accent-blue}`, Icon chuông và text "subscribe".

## Nguyên tắc Thiết kế (Do's and Don'ts)

### Do (Nên làm)
- Giữ nguyên màu nền Beige (`#e7dcd1`) thay vì dùng màu trắng tinh cho toàn trang, điều này giúp giao diện không bị chói và thân thiện với ứng dụng đọc sách.
- Luôn sử dụng font chữ Sans-serif bo tròn (như Quicksand) để duy trì sự nhất quán về "độ mềm" của UI.
- Tuân thủ nghiêm ngặt hệ thống Spacing (24px margin tổng, 12px-16px gap).
- Các nút Call-to-Action chính (Search, Subscribe) phải ở dạng hình viên thuốc (Pill - 9999px).

### Don't (Không nên làm)
- Không sử dụng màu đen tuyền (`#000000`) cho văn bản, điều này phá vỡ tone ấm của thiết kế. Hãy dùng `#3e332a`.
- Không sử dụng các góc vuông nhọn (0px radius) cho bất kỳ thẻ bài (card) hay hình ảnh nào, ngoại trừ đuôi của bong bóng chat.
- Không lạm dụng hiệu ứng đổ bóng (Drop shadow) quá gắt hoặc màu đen đậm. Bóng đổ phải mềm, lan tỏa và hơi ngả tone màu ấm.
