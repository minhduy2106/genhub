# Tài Liệu Thiết Kế Sản Phẩm: GenHub POS

**Phiên bản:** 1.0
**Ngày:** Tháng 4/2026
**Tác giả:** Product Design Team
**Trạng thái:** Draft — Chờ phê duyệt

---

## Mục Lục

1. [Product Vision & Strategy](#1-product-vision--strategy)
2. [Danh Sách Tính Năng (Feature List)](#2-danh-sách-tính-năng-feature-list)
3. [Information Architecture](#3-information-architecture)
4. [Wireframe Mô Tả (Text-based Wireframe)](#4-wireframe-mô-tả-text-based-wireframe)
5. [Design System Guidelines](#5-design-system-guidelines)

---

## 1. Product Vision & Strategy

### 1.1 Tuyên Bố Tầm Nhìn Sản Phẩm

> **"GenHub POS là người đồng hành thông minh của mọi chủ cửa hàng Việt Nam — giúp họ bán được nhiều hơn, quản lý dễ hơn, và ra quyết định chính xác hơn mỗi ngày."**

**Mission Statement:**
Xóa bỏ khoảng cách công nghệ giữa các cửa hàng nhỏ và doanh nghiệp lớn. Mọi chủ cửa hàng — dù bán tại chợ hay trên TikTok, dù 1 hay 20 nhân viên — đều xứng đáng có một công cụ quản lý mạnh mẽ nhưng đơn giản đến mức ai cũng dùng được.

**3 Trụ Cột Sản Phẩm:**
- **Đơn giản tuyệt đối:** Onboarding dưới 10 phút, không cần đào tạo, giao diện tự giải thích (self-explanatory UI)
- **AI thực dụng:** Không phải AI để trưng bày, mà AI giải quyết đúng vấn đề của ngày hôm nay — cảnh báo hàng sắp hết, gợi ý đặt hàng, phân loại khách hàng tự động
- **Kết nối toàn bộ:** Một màn hình để quản lý cửa hàng vật lý, Shopee, TikTok Shop, Facebook — tồn kho và đơn hàng đồng bộ realtime

---

### 1.2 Target Persona

#### Persona 1: Chị Lan — Chủ cửa hàng thời trang nhỏ

| Thuộc tính | Chi tiết |
|---|---|
| **Tên** | Nguyễn Thị Lan |
| **Tuổi** | 34 tuổi |
| **Địa điểm** | Quận Bình Thạnh, TP.HCM |
| **Nghề nghiệp** | Chủ cửa hàng thời trang nữ, bán cả offline và Shopee/TikTok Shop |
| **Thu nhập** | 25–40 triệu/tháng (doanh thu cửa hàng) |
| **Nhân viên** | 2 nhân viên bán hàng + chồng hỗ trợ |
| **Thiết bị** | iPhone 13, MacBook Pro (dùng thỉnh thoảng) |
| **Tech-savvy** | Trung bình — dùng tốt Shopee Seller, Facebook, TikTok |

**Pain Points:**
- Sáng mở Shopee, trưa mở TikTok Shop, tối mở Facebook — 3 app riêng, không biết tồn kho thực là bao nhiêu
- Cuối tuần phải ngồi đối chiếu doanh thu bằng Excel mất 3–4 tiếng
- Hay bị oversell: khách đặt Shopee nhưng hàng đã bán hết ở cửa hàng
- Nhân viên nghỉ đột xuất không biết phải hướng dẫn người thay như thế nào dùng phần mềm cũ
- Không biết sản phẩm nào lãi nhất, cứ đặt hàng theo cảm tính

**Goals:**
- Quản lý tất cả kênh bán hàng từ 1 ứng dụng duy nhất
- Tự động cập nhật tồn kho khi có đơn từ bất kỳ kênh nào
- Có báo cáo lãi/lỗ rõ ràng để biết kinh doanh đang ở đâu
- Nhân viên mới có thể học dùng trong vòng 30 phút

**Quote đại diện:**
> "Tôi không cần phần mềm phức tạp. Tôi chỉ cần một chỗ để nhìn thấy hết mọi thứ đang xảy ra với cửa hàng của mình."

**User Journey — Chị Lan:**

```
[Sáng 8:00] Mở app, xem dashboard:
  Hôm qua bán bao nhiêu? Hàng nào sắp hết? Đơn nào chưa xử lý?
  → Cần: Dashboard tóm gọn, nổi bật số quan trọng

[8:30 - 12:00] Mở cửa hàng:
  Khách vào → Nhân viên dùng POS để tính tiền, in hóa đơn
  → Cần: POS nhanh, đơn giản, chạy trên tablet/điện thoại

[12:00 - 14:00] Giờ nghỉ — Xử lý đơn online:
  Vào app xem đơn từ Shopee, TikTok về → Xác nhận, in phiếu giao
  → Cần: Tất cả đơn online tập trung 1 nơi

[18:00] Kiểm kho cuối ngày:
  Nhân viên cập nhật tồn kho vào app
  → Cần: Cảnh báo tự động khi hàng dưới ngưỡng tối thiểu

[21:00] Trên điện thoại:
  Xem doanh thu hôm nay, so với tuần trước
  → Cần: Báo cáo tóm tắt đẹp trên mobile
```

---

#### Persona 2: Anh Tuấn — Chủ chuỗi cửa hàng điện tử nhỏ

| Thuộc tính | Chi tiết |
|---|---|
| **Tên** | Trần Văn Tuấn |
| **Tuổi** | 41 tuổi |
| **Địa điểm** | Hà Nội (2 cửa hàng: Cầu Giấy và Đống Đa) |
| **Nghề nghiệp** | Chủ 2 cửa hàng phụ kiện điện thoại + laptop |
| **Thu nhập** | 80–150 triệu/tháng (tổng 2 cửa hàng) |
| **Nhân viên** | 8 nhân viên (4 người/cửa hàng) |
| **Thiết bị** | Samsung Galaxy S24, iPad Pro (POS tại quầy) |
| **Tech-savvy** | Trung bình cao — đã dùng KiotViet 3 năm, muốn nâng cấp |

**Pain Points:**
- Phần mềm cũ (KiotViet) không có báo cáo so sánh giữa 2 cửa hàng đủ chi tiết
- Mỗi tháng phải tự tổng hợp dữ liệu từ 2 app riêng vào Excel để phân tích
- Khó kiểm soát nhân viên bán hàng — không biết ai bán được nhiều nhất, ai hay cho chiết khấu tuỳ tiện
- Tồn kho giữa 2 cửa hàng không thể chuyển điều phối nhanh khi một nơi hết hàng
- Khi anh đi vắng không có cách nào xem ngay cửa hàng đang hoạt động thế nào

**Goals:**
- Giám sát 2 cửa hàng realtime từ xa, qua điện thoại
- Báo cáo so sánh hiệu suất giữa các chi nhánh và từng nhân viên
- Phân quyền chặt chẽ: nhân viên chỉ xem và làm những gì được phép
- Quản lý tồn kho tập trung, điều phối hàng giữa 2 cửa hàng dễ dàng

**Quote đại diện:**
> "Tôi muốn mở điện thoại ra là biết ngay cửa hàng đang chạy tốt hay không, không cần phải gọi điện hỏi nhân viên."

**User Journey — Anh Tuấn:**

```
[Buổi sáng — bất kỳ đâu] Kiểm tra từ xa:
  Mở app → Dashboard 2 chi nhánh song song → So sánh doanh thu sáng nay
  → Cần: Multi-branch view, có thể switch nhanh giữa cửa hàng

[10:00] Nhận cảnh báo:
  "Cửa hàng Đống Đa sắp hết Case iPhone 15 Pro Max (còn 3 cái)"
  → Cần: Push notification thông minh, cảnh báo ngưỡng tồn kho

[Cuối tuần] Phân tích kinh doanh:
  Xem báo cáo: nhân viên nào bán được nhiều? Sản phẩm nào lãi nhất?
  Tháng này cửa hàng nào tăng trưởng? Cần nhập thêm hàng gì?
  → Cần: Báo cáo đa chiều, filter theo chi nhánh/nhân viên/thời gian

[Hàng tháng] Quản lý nhà cung cấp:
  Xem lịch sử nhập hàng, đặt hàng tái cung ứng
  → Cần: Module quản lý nhà cung cấp + đề xuất đặt hàng từ AI
```

---

#### Persona 3: Em Hà — Nhân viên bán hàng kiêm quản lý kho

| Thuộc tính | Chi tiết |
|---|---|
| **Tên** | Lê Thị Hà |
| **Tuổi** | 23 tuổi |
| **Địa điểm** | Đà Nẵng |
| **Nghề nghiệp** | Nhân viên bán hàng tại cửa hàng mỹ phẩm (5 nhân viên) |
| **Thu nhập** | 7–9 triệu/tháng |
| **Thiết bị** | Oppo A78, máy POS tại quầy |
| **Tech-savvy** | Thấp đến trung bình — hay dùng điện thoại nhưng ngại học app mới |

**Pain Points:**
- Phần mềm cũ chủ cửa hàng dùng quá phức tạp, hay bấm nhầm
- Sợ làm sai khi xử lý đổi trả, không biết thao tác đúng
- Khi hết hàng không có cách báo chủ nhanh, phải nhắn Zalo thủ công
- In hóa đơn hay bị lỗi, khách chờ lâu ngại ngùng
- Không biết doanh số bản thân trong tháng là bao nhiêu

**Goals:**
- Giao diện POS thật đơn giản, bấm ít bước nhất có thể
- Tự tin xử lý các tình huống khác thường (đổi trả, chiết khấu, thanh toán chia đôi)
- Nhận thông báo khi hàng sắp hết để chủ động nhắc chủ cửa hàng
- Xem được doanh số cá nhân để tự theo dõi và thi đua với đồng nghiệp

**Quote đại diện:**
> "Nếu phần mềm mà phức tạp, tôi sẽ hay bấm nhầm hoặc nhờ chị kia làm giúp. Tôi muốn cái nào đơn giản nhất có thể."

**User Journey — Em Hà:**

```
[Ca sáng 9:00] Mở máy, bắt đầu ca:
  Đăng nhập → Xem thông báo tồn kho thấp → Báo chủ cửa hàng
  → Cần: Đăng nhập nhanh (PIN/vân tay), thông báo rõ ràng

[Trong ca] Bán hàng liên tục:
  Tìm sản phẩm → Quét mã/tìm tên → Thêm vào giỏ → Thanh toán → In hóa đơn
  → Cần: Luồng POS tối giản, tìm kiếm nhanh, xử lý thanh toán nhanh

[Xử lý đổi trả]:
  Khách muốn đổi sản phẩm → Tra cứu hóa đơn cũ → Xử lý đổi
  → Cần: Hướng dẫn từng bước rõ ràng, không sợ làm sai

[Cuối ca] Đối chiếu:
  Xem doanh số ca của mình → Bàn giao cho ca sau
  → Cần: Báo cáo ca đơn giản, bàn giao ca có ghi chú
```

---

## 2. Danh Sách Tính Năng (Feature List)

### 2.1 MVP — Phase 1 (Ra mắt, Tháng 1–6)

#### F1. Quản Lý Sản Phẩm

| Tính năng | Mô tả chi tiết | Ưu tiên |
|---|---|---|
| Thêm/sửa/xóa sản phẩm | Form đơn giản, hỗ trợ bulk upload từ Excel | P0 |
| Danh mục sản phẩm | Tạo/sửa/xóa danh mục, nested (tối đa 2 cấp) | P0 |
| Biến thể sản phẩm | Màu sắc, kích cỡ, chất liệu — tối đa 3 thuộc tính, 50 SKU/sản phẩm | P0 |
| Hình ảnh sản phẩm | Upload tối đa 8 ảnh/sản phẩm, tự resize, hỗ trợ JPEG/PNG/WebP | P0 |
| Mã vạch / QR | Tự sinh mã hoặc nhập thủ công, hỗ trợ scan camera | P0 |
| Giá vốn & giá bán | Lưu giá vốn riêng (chỉ chủ và người có quyền xem), nhiều mức giá bán | P0 |
| Tìm kiếm & lọc sản phẩm | Tìm theo tên, mã, barcode, danh mục | P0 |
| Import/Export Excel | Template chuẩn, hỗ trợ cập nhật hàng loạt | P1 |

#### F2. Quản Lý Đơn Hàng

| Tính năng | Mô tả chi tiết | Ưu tiên |
|---|---|---|
| Tạo đơn hàng thủ công | Thêm sản phẩm, chọn khách hàng, áp dụng giảm giá | P0 |
| Trạng thái đơn hàng | Chờ xử lý → Đã xác nhận → Đang giao → Hoàn thành / Hủy | P0 |
| Lịch sử đơn hàng | Tìm kiếm, lọc theo ngày/trạng thái/kênh, xem chi tiết | P0 |
| In hóa đơn / phiếu giao | Mẫu hóa đơn tùy chỉnh, in nhiệt hoặc A4/A5 | P0 |
| Đổi trả hàng | Quy trình đổi/trả từng bước, tự động cập nhật tồn kho | P0 |
| Ghi chú đơn hàng | Ghi chú nội bộ và ghi chú cho khách | P1 |
| Đơn hàng nháp | Lưu đơn nháp khi khách chưa quyết định | P1 |

#### F3. POS — Bán Hàng Tại Quầy

| Tính năng | Mô tả chi tiết | Ưu tiên |
|---|---|---|
| Giao diện POS tối giản | Màn hình chia đôi: danh sách sản phẩm trái, giỏ hàng phải | P0 |
| Tìm kiếm & quét mã | Tìm theo tên/mã, quét barcode bằng camera hoặc đầu đọc USB | P0 |
| Giỏ hàng | Thêm/xóa/sửa số lượng, áp giảm giá từng sản phẩm hoặc toàn đơn | P0 |
| Thanh toán đa hình thức | Tiền mặt (tính tiền thừa), chuyển khoản, thẻ ngân hàng, ví điện tử | P0 |
| Thanh toán chia đôi | Kết hợp nhiều hình thức trong 1 đơn (vd: 200K tiền mặt + 50K MoMo) | P0 |
| In hóa đơn | In nhiệt 58mm/80mm hoặc gửi hóa đơn điện tử qua email/SMS | P0 |
| Phím tắt nhanh | F-key hoặc tap nhanh cho thao tác thường dùng | P1 |
| Chế độ offline | Tiếp tục bán hàng khi mất mạng, đồng bộ khi có kết nối lại | P1 |
| Mở két tiền | Tích hợp mở két tiền tự động khi thanh toán | P1 |
| Quản lý ca | Mở ca/đóng ca, kiểm quỹ đầu ca/cuối ca | P1 |

#### F4. Quản Lý Kho

| Tính năng | Mô tả chi tiết | Ưu tiên |
|---|---|---|
| Xem tồn kho realtime | Số lượng tồn theo từng sản phẩm/biến thể, tự cập nhật sau mỗi giao dịch | P0 |
| Nhập hàng | Tạo phiếu nhập, liên kết nhà cung cấp, cập nhật tồn kho và giá vốn | P0 |
| Xuất kho thủ công | Phiếu xuất kho (hàng hỏng, tặng, dùng nội bộ...) | P0 |
| Cảnh báo tồn kho thấp | Cài ngưỡng tối thiểu cho từng sản phẩm, nhận push notification | P0 |
| Lịch sử nhập/xuất kho | Tra cứu theo thời gian, sản phẩm, nhân viên thực hiện | P0 |
| Kiểm kê kho | Tạo phiếu kiểm kê, so sánh tồn kho thực vs hệ thống, điều chỉnh | P1 |
| Chuyển hàng giữa kho | Hỗ trợ từ Phase 1 cho đa chi nhánh (gói Pro) | P1 |

#### F5. Quản Lý Khách Hàng

| Tính năng | Mô tả chi tiết | Ưu tiên |
|---|---|---|
| Hồ sơ khách hàng | Tên, SĐT, email, địa chỉ, ngày sinh, ghi chú | P0 |
| Lịch sử mua hàng | Xem tất cả đơn hàng của khách, tổng chi tiêu | P0 |
| Tìm kiếm khách hàng | Theo tên, SĐT, email — tìm nhanh ngay tại màn hình POS | P0 |
| Thêm khách nhanh | Tạo khách hàng mới ngay trong luồng POS không cần rời màn hình | P0 |
| Nhóm khách hàng | Phân nhóm (Thân thiết, VIP, Mới...) để áp dụng giá/chính sách riêng | P1 |
| Import danh sách khách | Từ file Excel, hỗ trợ cập nhật trùng theo SĐT | P1 |
| Công nợ khách hàng | Theo dõi công nợ, thanh toán một phần | P1 |

#### F6. Báo Cáo Cơ Bản

| Tính năng | Mô tả chi tiết | Ưu tiên |
|---|---|---|
| Doanh thu theo ngày/tuần/tháng | Biểu đồ đường, so sánh kỳ trước | P0 |
| Lợi nhuận gộp | Tính tự động từ doanh thu - giá vốn | P0 |
| Top sản phẩm bán chạy | Ranking theo số lượng và doanh thu | P0 |
| Báo cáo tồn kho | Giá trị hàng tồn kho, hàng chậm bán | P0 |
| Báo cáo theo nhân viên | Doanh số từng nhân viên, số đơn xử lý | P0 |
| Báo cáo cuối ca | Tổng kết ca: số đơn, doanh thu, hình thức thanh toán | P0 |
| Export báo cáo | Xuất Excel/PDF | P1 |

#### F7. Quản Lý Nhân Viên & Phân Quyền

| Tính năng | Mô tả chi tiết | Ưu tiên |
|---|---|---|
| Thêm/sửa/xóa nhân viên | Thông tin cơ bản, ảnh đại diện, vai trò | P0 |
| Phân quyền theo vai trò | Chủ cửa hàng / Quản lý / Thu ngân / Nhân viên kho | P0 |
| Phân quyền tùy chỉnh | Bật/tắt từng quyền cụ thể (xem giá vốn, xóa đơn, chiết khấu...) | P1 |
| Lịch sử hoạt động | Log các thao tác quan trọng của từng nhân viên | P1 |
| Quản lý ca làm việc | Lịch làm việc, checkin/checkout | P2 |

---

### 2.2 Phase 2 — Mở Rộng (Tháng 7–18)

#### F8. Bán Hàng Đa Kênh (Omnichannel)

| Tính năng | Mô tả |
|---|---|
| Kết nối Shopee | Đồng bộ sản phẩm, tồn kho, đơn hàng từ Shopee Seller Center |
| Kết nối Lazada | Tương tự Shopee |
| Kết nối TikTok Shop | Đặc biệt ưu tiên vì TikTok Shop đang bùng nổ tại VN |
| Kết nối Facebook/Instagram | Quản lý đơn từ inbox Facebook, comment mua hàng |
| Trang web bán hàng | Website cơ bản với domain riêng, tích hợp thanh toán |
| Quản lý đơn đa kênh | Tất cả đơn từ mọi kênh hợp nhất trong 1 màn hình |
| Đồng bộ tồn kho thông minh | Tự động trừ tồn kho trên tất cả kênh khi có đơn bất kỳ |
| Unified customer profile | Gộp khách hàng mua qua nhiều kênh vào 1 hồ sơ |

#### F9. Khuyến Mãi & Voucher

| Tính năng | Mô tả |
|---|---|
| Tạo chương trình khuyến mãi | Giảm giá %, giảm tiền cố định, mua X tặng Y |
| Voucher/Coupon | Tạo mã voucher, giới hạn số lần dùng, thời hạn |
| Flash sale | Giảm giá trong khung giờ cố định |
| Loyalty points | Tích điểm cho khách hàng thân thiết |
| Ứng dụng tự động | Tự động áp khuyến mãi phù hợp nhất khi tạo đơn |

#### F10. Quản Lý Nhà Cung Cấp

| Tính năng | Mô tả |
|---|---|
| Hồ sơ nhà cung cấp | Thông tin liên lạc, điều khoản thanh toán |
| Đặt hàng nhà cung cấp | Tạo đơn đặt hàng, theo dõi trạng thái |
| Lịch sử giao dịch | Lịch sử nhập hàng theo từng nhà cung cấp |
| Công nợ nhà cung cấp | Theo dõi số tiền còn nợ, hạn thanh toán |

#### F11. Báo Cáo Nâng Cao & Dashboard Analytics

| Tính năng | Mô tả |
|---|---|
| Dashboard tùy chỉnh | Kéo thả widget, chọn KPI hiển thị |
| Phân tích xu hướng | Dự báo doanh thu ngắn hạn dựa trên lịch sử |
| Báo cáo so sánh chi nhánh | So sánh hiệu suất giữa các cửa hàng/kênh |
| Cohort analysis | Phân tích tỷ lệ quay lại mua hàng |
| Phễu chuyển đổi | Tỷ lệ chuyển đổi từ khách ghé thăm → mua hàng |

#### F12. Tích Hợp Thanh Toán

| Tính năng | Mô tả |
|---|---|
| VNPay QR | Thanh toán QR tại quầy và online |
| MoMo | Tích hợp thanh toán MoMo |
| ZaloPay | Tích hợp thanh toán ZaloPay |
| Cổng thanh toán thẻ | Visa/Mastercard qua cổng thanh toán |
| Đối soát tự động | Tự động đối chiếu giao dịch với ngân hàng |

---

### 2.3 Phase 3 — AI & Automation (Tháng 19–36)

#### F13. AI Dự Báo & Gợi Ý

| Tính năng | Mô tả |
|---|---|
| Dự báo nhu cầu hàng hóa | AI phân tích lịch sử bán hàng, mùa vụ, xu hướng → gợi ý số lượng đặt hàng |
| Gợi ý đặt hàng tái cung ứng | Tự động tạo đề xuất đặt hàng khi sắp hết |
| Tối ưu giá bán | AI đề xuất điều chỉnh giá dựa trên nhu cầu và đối thủ |
| Phân tích hàng tồn chậm | Cảnh báo hàng ít bán, đề xuất chiến lược xử lý |

#### F14. AI Phân Tích Khách Hàng

| Tính năng | Mô tả |
|---|---|
| Phân loại khách hàng tự động | RFM Analysis (Recency, Frequency, Monetary) tự động |
| Gợi ý upsell/cross-sell | AI gợi ý sản phẩm bổ sung phù hợp tại màn hình POS |
| Dự báo khách hàng có nguy cơ rời bỏ | Cảnh báo sớm để chăm sóc lại |
| Cá nhân hóa khuyến mãi | Đề xuất ưu đãi phù hợp với từng nhóm khách hàng |

#### F15. Automation & Chatbot

| Tính năng | Mô tả |
|---|---|
| Chatbot hỗ trợ khách hàng | Bot trả lời tự động trên Facebook/Zalo về tình trạng đơn hàng |
| Tự động gửi thông báo | SMS/Email/Zalo khi đơn hàng thay đổi trạng thái |
| Tự động gợi ý đánh giá | Gửi yêu cầu review sau khi giao hàng thành công |
| Marketing automation | Tự động gửi ưu đãi vào ngày sinh nhật, kỷ niệm mua hàng |

---

## 3. Information Architecture

### 3.1 Sitemap Ứng Dụng

```
GenHub POS
│
├── 🏠 Dashboard (Tổng quan)
│   ├── Tóm tắt hôm nay (doanh thu, số đơn, khách mới)
│   ├── Cảnh báo cần xử lý (hàng sắp hết, đơn chờ xử lý)
│   ├── Biểu đồ doanh thu 7 ngày
│   └── Top sản phẩm bán chạy hôm nay
│
├── 🛒 Bán hàng (POS)
│   ├── Màn hình POS chính
│   ├── Lịch sử giao dịch ca
│   ├── Mở ca / Đóng ca
│   └── Quản lý két tiền
│
├── 📦 Đơn hàng
│   ├── Tất cả đơn hàng
│   │   ├── Lọc theo trạng thái
│   │   ├── Lọc theo kênh (Phase 2)
│   │   └── Tìm kiếm đơn
│   ├── Tạo đơn hàng thủ công
│   └── Chi tiết đơn hàng
│       ├── Thông tin đơn
│       ├── Sản phẩm trong đơn
│       ├── Thông tin khách hàng
│       ├── Lịch sử trạng thái
│       └── Hành động (Xác nhận / Hủy / In hóa đơn / Đổi trả)
│
├── 🏷️ Sản phẩm
│   ├── Danh sách sản phẩm
│   │   ├── Xem theo danh sách / lưới
│   │   ├── Lọc theo danh mục
│   │   └── Tìm kiếm
│   ├── Thêm sản phẩm mới
│   ├── Chi tiết / Chỉnh sửa sản phẩm
│   │   ├── Thông tin cơ bản
│   │   ├── Biến thể & Giá
│   │   ├── Hình ảnh
│   │   └── Thông tin kho
│   ├── Danh mục sản phẩm
│   └── Import / Export
│
├── 🏭 Kho hàng
│   ├── Tổng quan tồn kho
│   │   ├── Tồn kho realtime
│   │   ├── Cảnh báo sắp hết hàng
│   │   └── Hàng tồn chậm bán
│   ├── Nhập hàng
│   │   ├── Tạo phiếu nhập
│   │   └── Lịch sử nhập hàng
│   ├── Xuất kho
│   │   ├── Tạo phiếu xuất
│   │   └── Lịch sử xuất kho
│   ├── Kiểm kê kho
│   └── Điều chỉnh tồn kho
│
├── 👥 Khách hàng
│   ├── Danh sách khách hàng
│   ├── Thêm khách hàng
│   ├── Hồ sơ khách hàng
│   │   ├── Thông tin cá nhân
│   │   ├── Lịch sử mua hàng
│   │   ├── Công nợ
│   │   └── Điểm tích lũy (Phase 2)
│   └── Nhóm khách hàng
│
├── 📊 Báo cáo
│   ├── Doanh thu & Lợi nhuận
│   │   ├── Theo ngày / tuần / tháng / năm
│   │   └── So sánh kỳ trước
│   ├── Sản phẩm
│   │   ├── Top bán chạy
│   │   └── Chậm bán / Tồn lâu
│   ├── Kho hàng
│   │   ├── Giá trị tồn kho
│   │   └── Nhập xuất theo kỳ
│   ├── Khách hàng
│   │   ├── Khách mới vs quay lại
│   │   └── Khách hàng tiềm năng
│   ├── Nhân viên
│   │   ├── Doanh số theo nhân viên
│   │   └── Báo cáo ca
│   └── Export báo cáo
│
├── 🏪 Kênh bán hàng (Phase 2)
│   ├── Tổng quan đa kênh
│   ├── Shopee
│   ├── TikTok Shop
│   ├── Lazada
│   ├── Facebook/Instagram
│   └── Website bán hàng
│
├── 🎁 Khuyến mãi (Phase 2)
│   ├── Chương trình khuyến mãi
│   ├── Voucher / Mã giảm giá
│   ├── Flash sale
│   └── Điểm tích lũy / Loyalty
│
├── 🚚 Nhà cung cấp (Phase 2)
│   ├── Danh sách nhà cung cấp
│   ├── Đặt hàng
│   └── Công nợ nhà cung cấp
│
├── 👨‍💼 Nhân viên
│   ├── Danh sách nhân viên
│   ├── Thêm nhân viên
│   ├── Phân quyền & Vai trò
│   └── Lịch làm việc (Phase 2)
│
└── ⚙️ Cài đặt
    ├── Thông tin cửa hàng
    ├── Cài đặt in hóa đơn
    ├── Phương thức thanh toán
    ├── Tích hợp (Phase 2)
    │   ├── Sàn thương mại điện tử
    │   ├── Cổng thanh toán
    │   └── Giao hàng (GHN, GHTK...)
    ├── Hóa đơn điện tử
    ├── Ngưỡng cảnh báo tồn kho
    ├── Thông báo & Cảnh báo
    ├── Bảo mật & Đăng nhập
    ├── Gói dịch vụ & Thanh toán
    └── Hỗ trợ & Trợ giúp
```

---

### 3.2 Cấu Trúc Navigation

#### Desktop Navigation (Sidebar trái, cố định)

```
┌─────────────────────────────┐
│  [Logo GenHub POS]          │
│  Tên cửa hàng ▾             │
├─────────────────────────────┤
│  🏠 Dashboard               │
│  🛒 Bán hàng (POS)          │
│  📦 Đơn hàng     [12 mới]   │
│  🏷️ Sản phẩm                │
│  🏭 Kho hàng     [3 cảnh báo]│
│  👥 Khách hàng              │
│  📊 Báo cáo                 │
│  ─────────────────          │
│  🏪 Kênh bán hàng           │ (Phase 2)
│  🎁 Khuyến mãi              │ (Phase 2)
│  🚚 Nhà cung cấp            │ (Phase 2)
│  ─────────────────          │
│  👨‍💼 Nhân viên               │
│  ⚙️ Cài đặt                  │
├─────────────────────────────┤
│  🔔 Thông báo               │
│  ❓ Trợ giúp                │
│  [Avatar] Tên nhân viên ▾   │
└─────────────────────────────┘
```

**Nguyên tắc Sidebar:**
- Badge số thông báo chỉ hiển thị cho các mục quan trọng cần hành động ngay (đơn hàng mới, cảnh báo kho)
- Các tính năng Phase 2 hiển thị nhưng bị lock với biểu tượng ổ khóa — người dùng biết có tính năng đó và có thể upgrade
- Sidebar có thể thu gọn lại thành icon-only để mở rộng không gian làm việc
- Active state: highlight màu cam GenHub, font đậm

#### Mobile Navigation (Bottom Tab Bar)

```
┌─────────────────────────────────────────┐
│                                         │
│          [Nội dung màn hình]            │
│                                         │
├─────────────────────────────────────────┤
│  🏠      🛒        📦      📊      ≡    │
│ Trang  Bán hàng  Đơn hàng Báo cáo Menu │
└─────────────────────────────────────────┘
```

**Nguyên tắc Mobile Navigation:**
- 5 tab cố định: Trang chủ, Bán hàng, Đơn hàng, Báo cáo, Menu (mở toàn bộ navigation)
- Nút "Bán hàng" được làm nổi bật hơn (màu khác, to hơn) vì là hành động chính
- Tab "Đơn hàng" hiển thị badge số đơn cần xử lý
- Màn hình POS chiếm toàn màn hình khi active (full screen mode)

---

### 3.3 Luồng Người Dùng Chính (User Flows)

#### Flow 1: Bán hàng tại quầy (POS Flow)

```
[Nhân viên mở app]
    ↓
[Màn hình POS chính]
    ↓
[Tìm sản phẩm: Quét mã / Gõ tên / Tap danh mục]
    ↓
[Sản phẩm hiện trong giỏ → Điều chỉnh số lượng nếu cần]
    ↓
[Tìm/Chọn khách hàng? → Tùy chọn, không bắt buộc]
    ↓
[Áp dụng khuyến mãi/voucher? → Tùy chọn]
    ↓
[Xem tổng tiền → Chọn hình thức thanh toán]
    ↓
[Nhập số tiền khách đưa (nếu tiền mặt) → App tính tiền thừa]
    ↓
[Xác nhận thanh toán → Lưu đơn hàng → Cập nhật tồn kho]
    ↓
[In hóa đơn / Gửi hóa đơn điện tử / Bỏ qua]
    ↓
[Màn hình POS reset về trạng thái ban đầu, sẵn sàng đơn tiếp theo]

⚠️ Edge cases:
- Hàng hết hàng: Cảnh báo tồn kho = 0, không cho thêm vào giỏ
- Chiết khấu: Popup nhập % hoặc số tiền, yêu cầu quyền nếu vượt ngưỡng
- Đổi trả: Nút "Đổi/Trả hàng" trên thanh công cụ → Flow riêng
```

#### Flow 2: Thêm sản phẩm mới

```
[Menu Sản phẩm] → [Nút "+ Thêm sản phẩm"]
    ↓
[Bước 1: Thông tin cơ bản]
  - Tên sản phẩm (bắt buộc)
  - Danh mục (bắt buộc)
  - Mô tả (tùy chọn)
    ↓
[Bước 2: Giá & Kho]
  - Giá bán (bắt buộc)
  - Giá vốn (tùy chọn, chỉ chủ cửa hàng thấy)
  - Số lượng tồn kho ban đầu
  - Ngưỡng cảnh báo hết hàng
    ↓
[Bước 3: Hình ảnh]
  - Upload từ máy / Chụp ảnh trực tiếp
  - Chọn ảnh đại diện
    ↓
[Bước 4: Biến thể (tùy chọn — chỉ hiện nếu SP có biến thể)]
  - Thêm thuộc tính (Màu, Size...)
  - Nhập giá/tồn kho riêng cho từng biến thể
    ↓
[Lưu] → Hiển thị toast "Đã thêm sản phẩm thành công" → Về danh sách
```

#### Flow 3: Xử lý đơn hàng từ sàn TMĐT (Phase 2)

```
[Notification: "Có 3 đơn Shopee mới"]
    ↓
[Màn hình Đơn hàng → Tab "Cần xử lý"]
    ↓
[Xem danh sách đơn đang chờ → Chọn 1 đơn]
    ↓
[Chi tiết đơn: Sản phẩm, địa chỉ giao, phương thức thanh toán]
    ↓
[Kiểm tra tồn kho → Nếu đủ: "Xác nhận đơn"]
    ↓
[Chọn đơn vị vận chuyển / In phiếu giao hàng]
    ↓
[Cập nhật trạng thái → Đồng bộ về sàn TMĐT tự động]
    ↓
[Khi giao xong → Cập nhật "Hoàn thành" → Doanh thu được tính]
```

#### Flow 4: Nhập hàng từ nhà cung cấp

```
[Menu Kho hàng] → [Nhập hàng] → [Tạo phiếu nhập mới]
    ↓
[Chọn nhà cung cấp (hoặc nhập mới)]
    ↓
[Thêm sản phẩm vào phiếu nhập]
  - Quét mã hoặc tìm theo tên
  - Nhập số lượng nhập
  - Nhập giá vốn lần này (có thể khác giá vốn cũ)
    ↓
[Xem tổng giá trị phiếu nhập]
    ↓
[Chọn trạng thái thanh toán: Đã thanh toán / Còn nợ]
    ↓
[Lưu phiếu nhập → Tồn kho tự động cập nhật → Giá vốn trung bình được tính lại]
```

---

## 4. Wireframe Mô Tả (Text-based Wireframe)

> **Quy ước:**
> - `[ ]` = Nút bấm hoặc phần tử tương tác
> - `[___]` = Trường nhập liệu
> - `[v]` = Dropdown
> - `(●)` = Radio button được chọn
> - `[×]` = Nút đóng
> - `│ ─ ┌ ┐ └ ┘` = Viền/khung
> - `#` = Heading
> - `...` = Nội dung tiếp tục

---

### 4.1 Dashboard Tổng Quan

#### Desktop (1280px+)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ TOPBAR: [Logo] GenHub POS    "Cửa hàng Thời Trang Lan"    [🔔 3] [Avatar ▾] │
├────────────┬─────────────────────────────────────────────────────────────────┤
│            │ # Xin chào, Chị Lan!  Thứ Tư, 02/04/2026                        │
│  SIDEBAR   │                                                                  │
│  (240px)   │ ┌──────────────────────────────────────────────────────────────┐│
│            │ │  ⚠️ CẦN XỬ LÝ NGAY:  4 đơn hàng chờ xác nhận │ 2 hàng sắp hết││
│ 🏠 Dashboard│ └──────────────────────────────────────────────────────────────┘│
│ 🛒 Bán hàng│                                                                  │
│ 📦 Đơn hàng│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────┐│
│    [12]    │ │ DOANH THU    │ │ SỐ ĐƠN HÀNG  │ │ KHÁCH MỚI   │ │ LỢI NHUẬN││
│ 🏷️ Sản phẩm│ │ Hôm nay      │ │ Hôm nay      │ │ Hôm nay      │ │ Gộp      ││
│ 🏭 Kho [3] │ │              │ │              │ │              │ │          ││
│ 👥 Khách  │ │  8.450.000đ  │ │     47        │ │      8       │ │ 2.135.000││
│ 📊 Báo cáo │ │  ↑ +12% so  │ │  ↑ +5 so     │ │  ↑ +2 so    │ │ +8% so   ││
│ ─────────  │ │  hôm qua    │ │  hôm qua     │ │  hôm qua    │ │ hôm qua  ││
│ 👨‍💼 Nhân viên│ └──────────────┘ └──────────────┘ └──────────────┘ └──────────┘│
│ ⚙️ Cài đặt │                                                                  │
│            │ ┌────────────────────────────────────┐ ┌────────────────────────┐│
│            │ │ DOANH THU 7 NGÀY QUA               │ │ ĐƠN HÀNG CẦN XỬ LÝ   ││
│            │ │                                    │ │                        ││
│            │ │  [Biểu đồ cột hoặc đường]          │ │ 🟡 Chờ xác nhận    4  ││
│            │ │   T2   T3   T4   T5   T6   T7  CN  │ │ 🔵 Đang giao       8  ││
│            │ │   6,2  7,1  8,5  5,3  9,2  11  --  │ │                        ││
│            │ │   (triệu đồng)                     │ │ [Xem tất cả đơn hàng] ││
│            │ └────────────────────────────────────┘ └────────────────────────┘│
│            │                                                                  │
│            │ ┌────────────────────────────────────┐ ┌────────────────────────┐│
│            │ │ TOP 5 SẢN PHẨM BÁN CHẠY HÔM NAY  │ │ CẢNH BÁO TỒN KHO      ││
│            │ │                                    │ │                        ││
│            │ │ 1. Váy hoa nhí  ×23   1.150.000đ  │ │ ⚠️ Áo thun trắng M: 2  ││
│            │ │ 2. Áo sơ mi ...  ×18    720.000đ  │ │ ⚠️ Quần jean đen: 3    ││
│            │ │ 3. Quần jean... ×15    975.000đ   │ │ 🔴 Đầm đỏ size S: 0    ││
│            │ │ 4. Đầm maxi ... ×12  1.080.000đ   │ │                        ││
│            │ │ 5. Áo croptop  ×11    440.000đ   │ │ [Xem tất cả cảnh báo]  ││
│            │ │                  [Xem báo cáo đầy đủ]│ └────────────────────────┘│
│            │ └────────────────────────────────────┘                           │
└────────────┴──────────────────────────────────────────────────────────────────┘
```

#### Mobile Dashboard (375–430px)

```
┌──────────────────────────────┐
│ [☰] GenHub POS    [🔔 3]    │
│ Thứ Tư, 02/04/2026          │
├──────────────────────────────┤
│  ⚠️ 4 đơn chờ │ 2 sắp hết   │
│  hàng           hàng        │
│  [Xử lý ngay →]             │
├──────────────────────────────┤
│ DOANH THU HÔM NAY           │
│ ┌──────────────────────────┐ │
│ │   8.450.000 đ            │ │
│ │   ↑ +12% so hôm qua      │ │
│ └──────────────────────────┘ │
│ ┌────────────┐ ┌────────────┐│
│ │47 đơn hàng │ │8 khách mới ││
│ │↑ +5        │ │↑ +2        ││
│ └────────────┘ └────────────┘│
├──────────────────────────────┤
│ Doanh thu 7 ngày             │
│ ┌──────────────────────────┐ │
│ │ [Mini line chart]        │ │
│ │  T2 T3 T4 T5 T6 T7 CN   │ │
│ └──────────────────────────┘ │
├──────────────────────────────┤
│ Top sản phẩm hôm nay        │
│ • Váy hoa nhí    ×23        │
│ • Áo sơ mi       ×18        │
│ • Quần jean      ×15        │
│ [Xem thêm →]                │
├──────────────────────────────┤
│  🏠      🛒        📦   📊  ≡ │
│ Trang  Bán hàng Đơn  BC  Menu│
└──────────────────────────────┘
```

---

### 4.2 Màn Hình POS Bán Hàng

#### Desktop POS (1280px+) — Chia đôi màn hình

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [← Quay lại]  🛒 BÁN HÀNG      Ca: 08:00 - Nguyễn Thị Hà    [Đóng ca]      │
├───────────────────────────────────────┬──────────────────────────────────────┤
│  CỘT TRÁI: SẢN PHẨM (55%)           │  CỘT PHẢI: GIỎ HÀNG (45%)           │
│                                       │                                      │
│ [🔍 Tìm sản phẩm hoặc quét mã...]   │  ┌──────────────────────────────┐   │
│                                       │  │ Khách hàng: [Tìm KH hoặc +] │   │
│ [Tất cả] [Váy] [Áo] [Quần] [Phụ kiện]│  └──────────────────────────────┘   │
│                                       │                                      │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐│  Áo sơ mi trắng M              ×1   │
│ │ [ảnh]   │ │ [ảnh]   │ │ [ảnh]   ││  40.000đ               [-] [1] [+]   │
│ │ Váy hoa │ │ Áo sơ   │ │ Quần    ││  ─────────────────────────────────    │
│ │ nhí     │ │ mi trắng│ │ jean đen││  Quần jean đen M               ×2   │
│ │ 50.000đ │ │ 40.000đ │ │ 65.000đ ││  65.000đ × 2 = 130.000đ  [-] [2] [+]│
│ │[Thêm vào]│ │[Thêm vào]│ │[Thêm vào]││  ─────────────────────────────────  │
│ └──────────┘ └──────────┘ └──────────┘│  Váy hoa nhí đỏ S              ×1   │
│                                       │  50.000đ               [-] [1] [+]  │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐│                                      │
│ │ [ảnh]   │ │ [ảnh]   │ │ [ảnh]   ││  ─────────────────────────────────   │
│ │ Đầm     │ │ Áo      │ │ Quần    ││                                      │
│ │ maxi    │ │ croptop │ │ linen   ││  Tạm tính:            220.000đ       │
│ │ 90.000đ │ │ 40.000đ │ │ 55.000đ ││  Giảm giá:            [Nhập giảm giá]│
│ │[Thêm vào]│ │[Thêm vào]│ │[Thêm vào]││  ─────────────────────────────────   │
│ └──────────┘ └──────────┘ └──────────┘│  TỔNG CỘNG:         220.000đ       │
│                                       │                                      │
│         [Trang 1/5] [< >]            │  [🗑️ Xóa tất cả]                   │
│                                       │                                      │
│                                       │  ┌────────────────────────────────┐ │
│                                       │  │ [💵 Tiền mặt]  [📱 Chuyển khoản]│ │
│                                       │  │ [💳 Thẻ/Ví điện tử] [+ Kết hợp]│ │
│                                       │  └────────────────────────────────┘ │
│                                       │                                      │
│                                       │  [      THANH TOÁN 220.000đ      ]  │
│                                       │  (Nút lớn, màu cam nổi bật)         │
└───────────────────────────────────────┴──────────────────────────────────────┘
```

#### Popup Xác Nhận Thanh Toán Tiền Mặt

```
┌─────────────────────────────────┐
│  THANH TOÁN TIỀN MẶT       [×] │
├─────────────────────────────────┤
│  Tổng tiền:      220.000đ       │
│                                 │
│  Tiền khách đưa:                │
│  [___________________] đ        │
│                                 │
│  Gợi ý nhanh:                   │
│  [220K] [250K] [300K] [500K]   │
│                                 │
│  Tiền thừa trả lại: 30.000đ    │
│  (Tự tính khi nhập số tiền)     │
│                                 │
│  [ Hủy ]  [✓ Xác nhận & In HĐ] │
└─────────────────────────────────┘
```

#### Mobile POS (375px) — Single column, scroll

```
┌──────────────────────────────┐
│ [←] BÁN HÀNG     [🛒 3 món] │
├──────────────────────────────┤
│ [🔍 Tìm sản phẩm / Quét mã] │
│ [Tất cả][Váy][Áo][Quần][...]│
├──────────────────────────────┤
│ ┌──────────┐ ┌──────────┐   │
│ │ [ảnh]   │ │ [ảnh]   │   │
│ │ Váy hoa │ │ Áo sơ mi│   │
│ │ 50.000đ │ │ 40.000đ │   │
│ │  [+ Thêm]│ │  [+ Thêm]│   │
│ └──────────┘ └──────────┘   │
│ ┌──────────┐ ┌──────────┐   │
│ │ [ảnh]   │ │ [ảnh]   │   │
│ │ Quần    │ │ Đầm maxi│   │
│ │ 65.000đ │ │ 90.000đ │   │
│ │  [+ Thêm]│ │  [+ Thêm]│   │
│ └──────────┘ └──────────┘   │
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ GIỎ HÀNG: 3 sản phẩm    │ │
│ │ Tổng: 220.000đ          │ │
│ │ [Xem & Thanh toán →]    │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘

[Khi tap "Xem & Thanh toán" → slide up panel giỏ hàng]

┌──────────────────────────────┐
│ GIỎ HÀNG              [×]   │
├──────────────────────────────┤
│ Áo sơ mi trắng M      ×1   │
│ 40.000đ        [-][1][+] 🗑 │
│ ─────────────────────────── │
│ Quần jean đen M        ×2   │
│ 130.000đ       [-][2][+] 🗑 │
│ ─────────────────────────── │
│ Váy hoa nhí đỏ S       ×1  │
│ 50.000đ        [-][1][+] 🗑 │
├──────────────────────────────┤
│ Tổng: 220.000đ              │
│ [Nhập mã giảm giá]          │
├──────────────────────────────┤
│ [   THANH TOÁN 220.000đ   ] │
└──────────────────────────────┘
```

---

### 4.3 Quản Lý Sản Phẩm

#### Desktop — Danh Sách Sản Phẩm

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ # Sản Phẩm                                        [Import] [+ Thêm sản phẩm]│
├──────────────────────────────────────────────────────────────────────────────┤
│ [🔍 Tìm theo tên, mã SP, barcode...]    [Danh mục: Tất cả ▾] [Lọc thêm ▾] │
├──────────────────────────────────────────────────────────────────────────────┤
│ [Tất cả (248)] [Còn hàng (231)] [Sắp hết (12)] [Hết hàng (5)]              │
├──────────────────────────────────────────────────────────────────────────────┤
│ ☐  Ảnh     Tên sản phẩm              Mã SP     Tồn kho  Giá bán  Trạng thái │
├──────────────────────────────────────────────────────────────────────────────┤
│ ☐  [img]   Váy hoa nhí đỏ (3 biến)  SP001     45       50.000đ  ✅ Còn hàng │
│            [Xem biến thể ▾]                                                  │
│            S: 15 | M: 20 | L: 10                                             │
├──────────────────────────────────────────────────────────────────────────────┤
│ ☐  [img]   Áo sơ mi trắng           SP002     3        40.000đ  ⚠️ Sắp hết  │
├──────────────────────────────────────────────────────────────────────────────┤
│ ☐  [img]   Quần jean đen (2 biến)   SP003     0        65.000đ  🔴 Hết hàng │
├──────────────────────────────────────────────────────────────────────────────┤
│ ☐  [img]   Đầm maxi trắng           SP004     28       90.000đ  ✅ Còn hàng │
├──────────────────────────────────────────────────────────────────────────────┤
│ (Chọn sản phẩm → Hiện thanh hành động: [Sửa] [Xóa] [Điều chỉnh kho] [...]) │
│ Hiển thị 20/248 sản phẩm  [Trang 1/13 →]                                    │
└──────────────────────────────────────────────────────────────────────────────┘
```

#### Desktop — Form Thêm/Sửa Sản Phẩm

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [← Quay lại]  # Thêm Sản Phẩm Mới                         [Lưu nháp] [Lưu] │
├───────────────────────────────────┬──────────────────────────────────────────┤
│ CỘT TRÁI (65%)                    │ CỘT PHẢI (35%)                           │
│                                   │                                          │
│ THÔNG TIN CƠ BẢN                  │ HÌNH ẢNH SẢN PHẨM                        │
│ ┌──────────────────────────────┐  │ ┌──────────────────────────────────────┐ │
│ │ Tên sản phẩm *               │  │ │                                      │ │
│ │ [________________________________]│ │  [  Kéo thả ảnh vào đây  ]          │ │
│ └──────────────────────────────┘  │ │  hoặc [Chọn từ máy] [Chụp ảnh]      │ │
│                                   │ │                                      │ │
│ ┌──────────────────────────────┐  │ │  ┌──────┐ ┌──────┐ ┌──────┐         │ │
│ │ Danh mục *      [Chọn... ▾] │  │ │  │[ảnh1]│ │[ảnh2]│ │[ảnh3]│         │ │
│ └──────────────────────────────┘  │ │  └──────┘ └──────┘ └──────┘         │ │
│                                   │ │  ⭐ Ảnh đại diện                     │ │
│ ┌──────────────────────────────┐  │ └──────────────────────────────────────┘ │
│ │ Mô tả sản phẩm               │  │                                          │
│ │ [                           ]│  │ THÔNG TIN THÊM                           │
│ │ [                           ]│  │ ┌──────────────────────────────────────┐ │
│ │ [                           ]│  │ │ Mã SKU    [____________________]     │ │
│ └──────────────────────────────┘  │ │ Mã barcode [____________________]    │ │
│                                   │ │ [🔄 Tự sinh mã]                      │ │
│ GIÁ & TỒN KHO                     │ │                                      │ │
│ ┌──────────────────┐ ┌──────────┐ │ │ Nhà cung cấp [Chọn... ▾]            │ │
│ │ Giá bán *        │ │ Giá vốn │ │ └──────────────────────────────────────┘ │
│ │ [____________] đ │ │[______]đ│ │                                          │
│ └──────────────────┘ └──────────┘ │ TRẠNG THÁI                               │
│ ┌──────────────────┐ ┌──────────┐ │ ┌──────────────────────────────────────┐ │
│ │ Số lượng tồn kho │ │ Cảnh báo│ │ │ (●) Đang bán  ( ) Ngừng bán          │ │
│ │ [____________]   │ │[______] │ │ │ (●) Hiển thị trên POS                │ │
│ └──────────────────┘ └──────────┘ │ └──────────────────────────────────────┘ │
│                                   │                                          │
│ BIẾN THỂ SẢN PHẨM                 │                                          │
│ ┌──────────────────────────────┐  │                                          │
│ │ ☐ Sản phẩm này có nhiều     │  │                                          │
│ │    biến thể (màu, size...)   │  │                                          │
│ │ [Khi tick → Hiện bảng biến thể]│                                          │
│ └──────────────────────────────┘  │                                          │
└───────────────────────────────────┴──────────────────────────────────────────┘
```

---

### 4.4 Quản Lý Đơn Hàng

#### Desktop — Danh Sách Đơn Hàng

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ # Đơn Hàng                                              [+ Tạo đơn thủ công]│
├──────────────────────────────────────────────────────────────────────────────┤
│ [🔍 Tìm theo mã đơn, tên KH, SĐT...]  [Ngày: 01/04 – 02/04 ▾] [Kênh: Tất cả▾]│
├──────────────────────────────────────────────────────────────────────────────┤
│[Tất cả (124)][Chờ xử lý (4)][Đang giao (8)][Hoàn thành (109)][Đã hủy (3)]  │
├──────────────────────────────────────────────────────────────────────────────┤
│  Mã đơn   Ngày tạo    Khách hàng        Sản phẩm   Tổng tiền  Kênh  Trạng thái│
├──────────────────────────────────────────────────────────────────────────────┤
│  #DH-5821  02/04 14:32  Nguyễn Thị Mai   3 SP      220.000đ  POS  ✅ Hoàn thành│
│  #DH-5820  02/04 13:15  (Khách lẻ)       1 SP       50.000đ  POS  ✅ Hoàn thành│
│  #DH-5819  02/04 12:47  Trần Văn Bình    2 SP      155.000đ  Shopee 🟡 Chờ giao│
│  #DH-5818  02/04 11:20  Lê Thị Hồng     5 SP      480.000đ  POS  ✅ Hoàn thành│
│  #DH-5817  02/04 09:05  (Khách lẻ)       1 SP       65.000đ  POS  🔴 Đã hủy   │
├──────────────────────────────────────────────────────────────────────────────┤
│ Tổng: 124 đơn | Doanh thu: 8.450.000đ       [← 1 2 3 ... 7 →]              │
└──────────────────────────────────────────────────────────────────────────────┘
```

#### Desktop — Chi Tiết Đơn Hàng

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [← Danh sách]  # Đơn hàng #DH-5821                            [In hóa đơn] │
├───────────────────────────────────────┬──────────────────────────────────────┤
│ THÔNG TIN ĐƠN HÀNG                    │ LỊCH SỬ TRẠNG THÁI                   │
│                                       │                                      │
│ Ngày tạo:  02/04/2026 lúc 14:32      │ ✅ 14:32 Hoàn thành                   │
│ Kênh:      POS (tại quầy)            │    14:30 Thanh toán: Tiền mặt         │
│ Nhân viên: Nguyễn Thị Hà            │    14:28 Tạo đơn                      │
│ Trạng thái: ✅ Hoàn thành             │                                      │
├───────────────────────────────────────┤ GHI CHÚ                              │
│ THÔNG TIN KHÁCH HÀNG                  │ ┌──────────────────────────────────┐ │
│                                       │ │ (trống)                          │ │
│ Nguyễn Thị Mai                        │ │ [+ Thêm ghi chú]                 │ │
│ 0901 234 567                          │ └──────────────────────────────────┘ │
│ Khách thân thiết (Mua 28 lần)        │                                      │
│ [Xem hồ sơ khách hàng →]             │ HÀNH ĐỘNG                            │
├───────────────────────────────────────┤ ┌──────────────────────────────────┐ │
│ SẢN PHẨM TRONG ĐƠN                   │ │ [🔄 Đổi/Trả hàng]               │ │
│                                       │ │ [📋 In hóa đơn]                 │ │
│ Áo sơ mi trắng M         ×1          │ │ [📧 Gửi hóa đơn email]          │ │
│ 40.000đ                               │ └──────────────────────────────────┘ │
│ ─────────────────────────────────     │                                      │
│ Quần jean đen M           ×2          │                                      │
│ 65.000đ × 2 = 130.000đ               │                                      │
│ ─────────────────────────────────     │                                      │
│ Váy hoa nhí đỏ S          ×1          │                                      │
│ 50.000đ                               │                                      │
├───────────────────────────────────────┤                                      │
│ Tạm tính:              220.000đ       │                                      │
│ Giảm giá:               0đ           │                                      │
│ TỔNG CỘNG:             220.000đ       │                                      │
│ Thanh toán:  Tiền mặt  220.000đ      │                                      │
└───────────────────────────────────────┴──────────────────────────────────────┘
```

---

### 4.5 Báo Cáo Doanh Thu

#### Desktop — Màn Hình Báo Cáo

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ # Báo Cáo Doanh Thu                          [Export Excel] [Export PDF]     │
├──────────────────────────────────────────────────────────────────────────────┤
│ [Hôm nay] [Hôm qua] [7 ngày] [Tháng này] [Tháng trước] [Tùy chỉnh ▾]      │
│ Từ: [01/04/2026] Đến: [02/04/2026]   [Kênh: Tất cả ▾] [Nhân viên: Tất cả ▾]│
├──────────────────────────────────────────────────────────────────────────────┤
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐ │
│ │ DOANH THU    │ │ LỢI NHUẬN   │ │ SỐ ĐƠN HÀNG  │ │ GIÁ TRỊ ĐƠN TB      │ │
│ │ 8.450.000đ   │ │ 2.135.000đ  │ │     47 đơn    │ │     179.787đ         │ │
│ │ ↑ +12% vs    │ │ Tỉ suất:    │ │ ↑ +5 so       │ │ ↑ +6,8%             │ │
│ │ hôm qua      │ │   25,3%     │ │ hôm qua       │ │                     │ │
│ └──────────────┘ └──────────────┘ └──────────────┘ └──────────────────────┘ │
├──────────────────────────────────────────────────────────────────────────────┤
│ DOANH THU THEO THỜI GIAN                                                     │
│ ┌────────────────────────────────────────────────────────────────────────┐   │
│ │                                                                        │   │
│ │         [Biểu đồ đường / cột — Doanh thu theo ngày, so sánh kỳ trước] │   │
│ │                                                                        │   │
│ │   T/1  T/2  T/3  T/4  T/5  T/6  T/7  T/8  T/9  T/10  T/11  T/12    │   │
│ │   ─ Tháng này  ─ ─ Tháng trước                                        │   │
│ └────────────────────────────────────────────────────────────────────────┘   │
├───────────────────────────────────────┬──────────────────────────────────────┤
│ TOP SẢN PHẨM BÁN CHẠY                │ DOANH THU THEO HÌNH THỨC THANH TOÁN  │
│                                       │                                      │
│  # Tên SP         Số lượng  Doanh thu │  Tiền mặt      ██████████  62%       │
│  1 Váy hoa nhí     ×23    1.150.000đ │  Chuyển khoản  ██████      28%       │
│  2 Áo sơ mi T.     ×18      720.000đ │  Thẻ/Ví điện tử ███        10%       │
│  3 Quần jean đen   ×15      975.000đ │                                      │
│  4 Đầm maxi trắng ×12    1.080.000đ │ DOANH THU THEO NHÂN VIÊN              │
│  5 Áo croptop      ×11      440.000đ │                                      │
│                                       │  Hà            ████████   4.200.000đ │
│ [Xem báo cáo sản phẩm đầy đủ →]      │  Mai           ██████     2.800.000đ  │
│                                       │  Linh          ████       1.450.000đ  │
└───────────────────────────────────────┴──────────────────────────────────────┘
```

---

### 4.6 Quản Lý Kho

#### Desktop — Tổng Quan Kho Hàng

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ # Kho Hàng                           [Kiểm kê kho] [Nhập hàng] [Xuất kho]  │
├──────────────────────────────────────────────────────────────────────────────┤
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐ │
│ │ TỔNG TỒN KHO │ │ GIÁ TRỊ KHO │ │ SẮP HẾT HÀNG│ │ HẾT HÀNG             │ │
│ │  1.248 sản   │ │ 85.400.000đ │ │   12 SP      │ │   5 SP               │ │
│ │  phẩm (SKU)  │ │             │ │ ⚠️ Cần nhập  │ │ 🔴 Cần xử lý ngay    │ │
│ └──────────────┘ └──────────────┘ └──────────────┘ └──────────────────────┘ │
├──────────────────────────────────────────────────────────────────────────────┤
│ [🔍 Tìm sản phẩm...]  [Danh mục: Tất cả ▾]  [Tình trạng: Tất cả ▾]        │
├──────────────────────────────────────────────────────────────────────────────┤
│[Tất cả] [⚠️ Sắp hết (12)] [🔴 Hết hàng (5)] [Nhiều tồn (>100)]            │
├──────────────────────────────────────────────────────────────────────────────┤
│  Sản phẩm              Mã SP    Tồn kho  Ngưỡng cảnh báo  Trị giá tồn       │
├──────────────────────────────────────────────────────────────────────────────┤
│  Váy hoa nhí đỏ (3 màu) SP001    45/60    10               2.250.000đ       │
│   └─ Đỏ S/M/L: 15/20/10                                                     │
│  Áo sơ mi trắng M        SP002    ⚠️ 3/50   5               120.000đ         │
│  Quần jean đen           SP003    🔴 0/30   5               0đ               │
│                                  [Nhập hàng ngay →]                          │
│  Đầm maxi trắng          SP004    28/40    8                2.520.000đ       │
│  Áo croptop đen S        SP005    ⚠️ 4/20   5               160.000đ         │
├──────────────────────────────────────────────────────────────────────────────┤
│ [Trang 1/13 →]                    Tổng giá trị kho: 85.400.000đ             │
└──────────────────────────────────────────────────────────────────────────────┘
```

#### Desktop — Tạo Phiếu Nhập Hàng

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [← Quay lại]  # Tạo Phiếu Nhập Hàng                     [Lưu nháp] [Hoàn thành]│
├───────────────────────────────────────┬──────────────────────────────────────┤
│ THÔNG TIN PHIẾU NHẬP                  │ TÓM TẮT                              │
│                                       │                                      │
│ Ngày nhập: [02/04/2026      📅]       │ Số loại hàng: 3 SP                   │
│                                       │ Tổng số lượng: 50 sản phẩm          │
│ Nhà cung cấp:                         │ Tổng giá trị: 1.400.000đ            │
│ [Chọn hoặc tìm NCC...         ▾]      │                                      │
│ [+ Thêm nhà cung cấp mới]            │ THANH TOÁN                           │
│                                       │ (●) Đã thanh toán đủ                 │
│ Ghi chú: [____________________]       │ ( ) Còn nợ: [___________] đ         │
│                                       │ ( ) Thanh toán một phần              │
├───────────────────────────────────────┴──────────────────────────────────────┤
│ SẢN PHẨM NHẬP                        [+ Thêm sản phẩm]  [Import Excel]       │
├──────────────────────────────────────────────────────────────────────────────┤
│  Sản phẩm / Biến thể           Tồn hiện tại  Số lượng nhập  Giá vốn   Thành tiền│
├──────────────────────────────────────────────────────────────────────────────┤
│  [🔍 Tìm và thêm sản phẩm...]                                                │
├──────────────────────────────────────────────────────────────────────────────┤
│  Áo sơ mi trắng M               3            [20      ]  [20.000đ]  400.000đ│
│                                                                       [🗑]   │
│  Quần jean đen M                 0            [20      ]  [35.000đ]  700.000đ│
│                                                                       [🗑]   │
│  Áo croptop đen S                4            [10      ]  [30.000đ]  300.000đ│
│                                                                       [🗑]   │
├──────────────────────────────────────────────────────────────────────────────┤
│                                      TỔNG CỘNG:              1.400.000đ     │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Design System Guidelines

### 5.1 Color Palette

#### Màu Chính (Primary Colors)

| Tên | Hex | Sử dụng |
|---|---|---|
| **GenHub Orange** | `#FF6B35` | CTA chính, nút "Thanh toán", active state trong sidebar, highlights quan trọng |
| **Orange Dark** | `#E55A25` | Hover state của nút cam, pressed state |
| **Orange Light** | `#FFF0EB` | Background của badge, tag, highlight nhẹ |

#### Màu Nền & Cấu Trúc (Neutral Colors)

| Tên | Hex | Sử dụng |
|---|---|---|
| **White** | `#FFFFFF` | Nền card, modal, form |
| **Gray 50** | `#F9FAFB` | Nền trang chính (body background) |
| **Gray 100** | `#F3F4F6` | Nền hover của row, input disabled |
| **Gray 200** | `#E5E7EB` | Viền chia cột, divider nhẹ |
| **Gray 300** | `#D1D5DB` | Viền input, checkbox, radio |
| **Gray 500** | `#6B7280` | Text placeholder, label phụ |
| **Gray 700** | `#374151` | Text phụ (sub-text, caption) |
| **Gray 900** | `#111827` | Text chính (heading, body text) |
| **Sidebar BG** | `#1A1D23` | Nền sidebar navigation |
| **Sidebar Text** | `#9CA3AF` | Text trong sidebar khi chưa active |
| **Sidebar Active** | `#FFFFFF` | Text trong sidebar khi active |

#### Màu Trạng Thái (Semantic Colors)

| Tên | Hex | Sử dụng |
|---|---|---|
| **Success Green** | `#16A34A` | Trạng thái "Hoàn thành", "Còn hàng", tăng trưởng dương |
| **Success Light** | `#DCFCE7` | Background của badge success |
| **Warning Amber** | `#D97706` | Cảnh báo "Sắp hết hàng", trạng thái "Chờ xử lý" |
| **Warning Light** | `#FEF3C7` | Background của badge warning |
| **Error Red** | `#DC2626` | Lỗi, "Hết hàng", "Đã hủy", giảm trưởng âm |
| **Error Light** | `#FEE2E2` | Background của badge error |
| **Info Blue** | `#2563EB` | Thông tin, trạng thái "Đang giao", liên kết |
| **Info Light** | `#DBEAFE` | Background của badge info |

#### Màu Biểu Đồ (Chart Colors)

```
Màu 1: #FF6B35  (Orange — Doanh thu)
Màu 2: #2563EB  (Blue — Đơn hàng)
Màu 3: #16A34A  (Green — Lợi nhuận)
Màu 4: #7C3AED  (Purple — Khách hàng mới)
Màu 5: #DB2777  (Pink — So sánh kỳ trước)
Màu 6: #0891B2  (Cyan — Kênh online)
```

---

### 5.2 Typography

#### Font Family

```css
/* Font chính — hỗ trợ đầy đủ tiếng Việt */
font-family: 'Be Vietnam Pro', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;

/* Font số — cho hiển thị tiền tệ, số liệu */
font-family: 'JetBrains Mono', 'Fira Code', monospace;
```

**Lý do chọn "Be Vietnam Pro":** Font được thiết kế đặc biệt cho tiếng Việt, hỗ trợ đầy đủ dấu thanh, nhìn clean và hiện đại, load nhanh từ Google Fonts.

#### Type Scale

| Tên | Size | Weight | Line Height | Sử dụng |
|---|---|---|---|---|
| `heading-xl` | 30px / 1.875rem | 700 | 1.2 | Page title trên desktop |
| `heading-lg` | 24px / 1.5rem | 700 | 1.3 | Section heading chính |
| `heading-md` | 20px / 1.25rem | 600 | 1.4 | Card title, modal heading |
| `heading-sm` | 16px / 1rem | 600 | 1.4 | Sub-section, table header |
| `body-lg` | 16px / 1rem | 400 | 1.6 | Body text chính |
| `body-md` | 14px / 0.875rem | 400 | 1.6 | Body text phụ, label |
| `body-sm` | 12px / 0.75rem | 400 | 1.5 | Caption, helper text, timestamp |
| `number-lg` | 32px / 2rem | 700 | 1.2 | KPI lớn trên dashboard (doanh thu) |
| `number-md` | 24px / 1.5rem | 700 | 1.2 | KPI vừa |
| `number-sm` | 18px / 1.125rem | 600 | 1.3 | Số trong bảng |

#### Số & Tiền Tệ (Localization)

```
Format tiền VND:
  8.450.000 đ  (dùng dấu chấm làm phân cách hàng nghìn, không dùng phẩy)
  Không dùng ký tự ₫ mà dùng chữ "đ" hoặc "VND" sau số

Format ngày giờ:
  Ngày: 02/04/2026  (dd/mm/yyyy)
  Giờ: 14:32  (24h)
  Ngày + giờ: 02/04/2026 lúc 14:32

Format số:
  1.248 (phân cách hàng nghìn bằng dấu chấm)
  25,3% (phần trăm dùng dấu phẩy cho thập phân)
```

---

### 5.3 Component Library

#### Core Components

**Button (Nút bấm)**
```
Variants:
  Primary    — Nền cam #FF6B35, text trắng, bo góc 8px
               "Thanh toán", "Lưu", "Xác nhận"
  Secondary  — Viền xám, nền trắng, text xám đậm
               "Hủy", "Xem chi tiết"
  Danger     — Nền đỏ #DC2626, text trắng
               "Xóa", "Hủy đơn hàng"
  Ghost      — Không viền, text cam
               Action phụ trong card, bảng

Sizes:
  Large  — Height 48px, padding 16px 24px, font 16px (CTA chính)
  Medium — Height 40px, padding 12px 20px, font 14px (hành động bình thường)
  Small  — Height 32px, padding 8px 16px, font 12px (action trong table)

States:
  Default → Hover (tối màu 10%) → Active (tối màu 20%) → Loading (spinner) → Disabled
```

**Input Fields (Ô nhập liệu)**
```
Text Input:
  Height: 44px (mobile-friendly, đủ diện tích tap)
  Border: 1.5px solid #D1D5DB
  Border-radius: 8px
  Focus: Border cam #FF6B35, shadow nhẹ
  Error: Border đỏ #DC2626 + helper text đỏ bên dưới
  Placeholder: màu #9CA3AF

Search Input:
  Icon kính lúp bên trái
  Nút xóa (×) xuất hiện khi có giá trị

Number Input (nhập tiền):
  Right-aligned text
  Suffix " đ" hoặc unit
  Tự format dấu phân cách khi nhập
```

**Card**
```
Background: #FFFFFF
Border: 1px solid #E5E7EB  (hoặc không có border, dùng shadow)
Border-radius: 12px
Shadow: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)
Padding: 20px (desktop), 16px (mobile)

Hover state: shadow nổi hơn — 0 4px 12px rgba(0,0,0,0.10)
```

**Badge / Tag**
```
Trạng thái đơn hàng:
  Hoàn thành:  bg #DCFCE7, text #16A34A, dot xanh
  Chờ xử lý:  bg #FEF3C7, text #D97706, dot vàng
  Đang giao:   bg #DBEAFE, text #2563EB, dot xanh dương
  Đã hủy:      bg #FEE2E2, text #DC2626, dot đỏ

Tồn kho:
  Còn hàng:   bg #DCFCE7, text #16A34A
  Sắp hết:    bg #FEF3C7, text #D97706  + icon ⚠️
  Hết hàng:   bg #FEE2E2, text #DC2626  + icon 🔴

Border-radius: 20px (pill shape)
Font: 12px, weight 500
Padding: 4px 10px
```

**Table (Bảng dữ liệu)**
```
Header: bg #F9FAFB, font 12px uppercase, weight 600, color #6B7280
Row:    bg white, height 56px (desktop), 64px (tablet với tap target)
Hover:  bg #F9FAFB
Border: Chỉ border-bottom giữa các row — 1px solid #F3F4F6
Padding cell: 12px 16px

Checkbox select: cột đầu tiên width 48px
Action column: cột cuối, sticky nếu bảng scroll ngang

Mobile: Table collapse thành Card list, mỗi row thành 1 card
```

**Navigation**
```
Sidebar Desktop:
  Width: 240px (mở) / 64px (thu gọn)
  BG: #1A1D23
  Item height: 44px
  Active: BG #FF6B35 opacity 15%, text trắng, border-left 3px cam
  Icon: 20px
  Transition: 200ms ease

Bottom Navigation Mobile:
  Height: 64px + safe area bottom
  BG: white, border-top 1px #E5E7EB
  Active icon: cam, label cam
  Inactive: xám #6B7280
```

**Toast / Notification**
```
Success: Icon ✅, BG #DCFCE7, text xanh lá
  "Đã lưu sản phẩm thành công"

Error: Icon ❌, BG #FEE2E2, text đỏ
  "Có lỗi xảy ra. Vui lòng thử lại."

Warning: Icon ⚠️, BG #FEF3C7, text cam
  "Tồn kho sắp hết. Hãy nhập thêm hàng."

Info: Icon ℹ️, BG #DBEAFE, text xanh
  "Đã đồng bộ 15 đơn hàng từ Shopee"

Position: Top-right (desktop), Top-center (mobile)
Duration: 4 giây tự động ẩn
```

**Modal / Dialog**
```
Overlay: rgba(0,0,0,0.5)
Container: BG white, border-radius 16px, max-width 480px (small), 640px (medium), 840px (large)
Header: padding 20px 24px, title + nút đóng [×]
Body: padding 0 24px
Footer: padding 20px 24px, nút action phải căn phải

Mobile: Bottom Sheet thay vì centered modal
  Slide up từ đáy màn hình
  Handle bar ở trên cùng
  Height: tối đa 90vh
```

**Empty State (Trạng thái trống)**
```
Illustration: SVG đơn giản, friendly
Title: "Chưa có [tên mục]"
Description: Hướng dẫn ngắn cách thêm dữ liệu
CTA: Nút action chính

Ví dụ:
  "Chưa có sản phẩm nào
   Hãy thêm sản phẩm đầu tiên để bắt đầu bán hàng
   [+ Thêm sản phẩm]"
```

---

### 5.4 Responsive Breakpoints

| Breakpoint | Pixel | Mô tả | Layout |
|---|---|---|---|
| **xs** | < 375px | Điện thoại màn hình nhỏ (ít gặp) | Stack hoàn toàn, font nhỏ hơn |
| **sm** | 375px – 767px | Điện thoại (target chính của mobile) | Bottom navigation, full-width |
| **md** | 768px – 1023px | Tablet portrait (iPad, Android tab) | Sidebar thu gọn, 2 cột |
| **lg** | 1024px – 1279px | Tablet landscape / Laptop nhỏ | Sidebar đầy đủ, layout chính |
| **xl** | 1280px – 1535px | Desktop chuẩn | Layout cố định, sidebar mở |
| **2xl** | ≥ 1536px | Desktop lớn / 4K | Max-width 1440px, center content |

#### Hành Vi Theo Breakpoint

**Mobile (sm, < 768px):**
- Bottom tab navigation (5 tab)
- Sidebar ẩn, mở qua hamburger menu
- Cards 1 cột đầy màn hình
- Table chuyển thành card list
- Buttons full-width trong form
- Font sizes giảm 1 bậc (body-lg → body-md)
- POS chiếm toàn màn hình khi active

**Tablet (md, 768–1023px):**
- Sidebar thu gọn (icon only, 64px)
- Grid 2 cột cho cards KPI
- Table hiển thị tối đa 4–5 cột, ẩn cột ít quan trọng
- POS layout dọc: danh sách sản phẩm trên, giỏ hàng dưới

**Desktop (lg+, ≥ 1024px):**
- Sidebar đầy đủ (240px), có thể thu gọn
- Grid 4 cột cho KPI cards
- Table hiển thị đầy đủ
- POS split screen (trái/phải)
- Hover states, tooltips

---

### 5.5 Nguyên Tắc Thiết Kế (Design Principles)

#### Nguyên Tắc 1: Mobile-First, Touch-First

- **Kích thước tap target tối thiểu:** 44×44px (theo Apple HIG / Material Design)
- **Vùng tay cầm:** Đặt các action quan trọng trong vùng ngón cái có thể chạm (bottom 60% màn hình)
- **Swipe gestures:** Swipe trái để xóa/hành động, swipe phải để confirm
- **Không hover-dependent:** Mọi tính năng phải dùng được không cần hover

#### Nguyên Tắc 2: Đơn Giản Đến Mức Tối Thiểu (Progressive Disclosure)

- **Hiển thị trước, ẩn sau:** Chỉ hiện tính năng cần thiết cho task hiện tại; tính năng nâng cao ẩn sau 1 click
- **Form ngắn gọn:** Chỉ hỏi những gì bắt buộc. Các trường tùy chọn có thể ẩn và mở khi cần
- **Không quá 3 cấp:** Điều hướng không sâu quá 3 lớp (Trang chủ → Danh mục → Chi tiết)
- **Onboarding tự nhiên:** Hướng dẫn inline thay vì manual dài; empty state có CTA rõ ràng

#### Nguyên Tắc 3: Phản Hồi Tức Thì (Immediate Feedback)

- **Loading states:** Mọi action đều có trạng thái loading (spinner, skeleton, progress bar)
- **Toast thông báo:** Mọi thao tác quan trọng (lưu, xóa, đồng bộ) đều có toast xác nhận
- **Optimistic UI:** Cập nhật UI ngay lập tức, roll back nếu API fail
- **Error states rõ ràng:** Thông báo lỗi bằng tiếng Việt dễ hiểu, có hướng dẫn cách xử lý

#### Nguyên Tắc 4: Nhất Quán (Consistency)

- **Design tokens:** Tất cả màu sắc, khoảng cách, font size đều dùng từ token system, không hardcode
- **Pattern library:** Cùng 1 tác vụ (thêm mới, xóa, lọc) dùng cùng 1 pattern UI trên toàn app
- **Ngôn ngữ nhất quán:** Thuật ngữ thống nhất — không lúc gọi "Đơn hàng" lúc gọi "Hóa đơn"
- **Icons:** Dùng 1 bộ icon nhất quán (đề xuất: Lucide Icons hoặc Heroicons)

#### Nguyên Tắc 5: Tối Ưu Cho Người Dùng Việt Nam

- **Tiếng Việt hoàn chỉnh:** 100% giao diện bằng tiếng Việt, không Việt-Anh trộn lẫn
- **Format địa phương:** Tiền VND (dùng đ hoặc VND, không dùng $), ngày dd/mm/yyyy, số điện thoại 10 số
- **Zalo > Email:** Tích hợp Zalo OA cho thông báo và hỗ trợ thay vì chỉ email
- **Văn hóa kinh doanh:** Hiểu rằng nhiều người bán hàng dùng nhiều SĐT, thanh toán tiền mặt là chủ yếu, quen với Shopee/Zalo hơn Gmail
- **Offline tolerance:** App cần hoạt động khi mạng chậm (3G vùng nông thôn); optimize cho mạng yếu

#### Nguyên Tắc 6: Tiếp Cận Được (Accessibility)

- **Contrast ratio:** Tối thiểu 4.5:1 cho text thường, 3:1 cho text lớn (WCAG AA)
- **Focus states:** Rõ ràng cho keyboard navigation
- **Alt text:** Mọi hình ảnh có mô tả
- **Font size tối thiểu:** 12px, không nhỏ hơn (đặc biệt quan trọng với người lớn tuổi)
- **Error messages:** Không chỉ dùng màu để báo lỗi — luôn kèm text

---

### 5.6 Spacing System (Hệ Thống Khoảng Cách)

Dùng base unit 4px:

| Token | Value | Sử dụng |
|---|---|---|
| `space-1` | 4px | Khoảng cách micro (icon và text, badge padding) |
| `space-2` | 8px | Khoảng cách nhỏ (padding trong tag, gap giữa inline elements) |
| `space-3` | 12px | Padding input nhỏ, gap giữa các items trong list |
| `space-4` | 16px | Padding chuẩn trong card (mobile), gap giữa form fields |
| `space-5` | 20px | Padding card (desktop) |
| `space-6` | 24px | Gap giữa các sections trong trang, padding modal |
| `space-8` | 32px | Gap lớn giữa các card groups |
| `space-10` | 40px | Section spacing trên desktop |
| `space-12` | 48px | Spacing lớn (page top padding, section breaks) |
| `space-16` | 64px | Layout spacing (spacing giữa sidebar và content) |

---

### 5.7 Icon Guidelines

**Bộ Icon Đề Xuất:** Lucide Icons (open-source, MIT license, hỗ trợ SVG)

**Kích Thước:**
- Trong button: 16px × 16px
- Trong navigation sidebar: 20px × 20px
- Standalone icons: 24px × 24px
- Empty state illustrations: 48–80px (custom SVG)

**Stroke Width:** 1.5px (default của Lucide) — nhìn modern, không quá dày

**Icon chuẩn cho các module:**
```
Dashboard    →  LayoutDashboard
POS Bán hàng →  ShoppingCart
Đơn hàng     →  Package
Sản phẩm     →  Tag
Kho hàng     →  Warehouse
Khách hàng   →  Users
Báo cáo      →  BarChart2
Khuyến mãi   →  Percent
Nhà cung cấp →  Truck
Nhân viên    →  UserCog
Cài đặt      →  Settings
Thông báo    →  Bell
Tìm kiếm     →  Search
Thêm mới     →  Plus
Chỉnh sửa    →  Pencil
Xóa          →  Trash2
In ấn        →  Printer
Xuất file    →  Download
Nhập file    →  Upload
Lọc          →  Filter
Sắp xếp      →  ArrowUpDown
```

---

### 5.8 Animation & Motion

**Nguyên tắc:** Chuyển động phục vụ mục đích, không phô trương.

| Loại animation | Duration | Easing | Sử dụng |
|---|---|---|---|
| Micro-interaction | 100–150ms | `ease-out` | Button tap, toggle, checkbox |
| Page transition | 200–300ms | `ease-in-out` | Chuyển trang, modal open/close |
| Data loading | 400ms | `ease-in-out` | Skeleton loading |
| Toast / Notification | 300ms in, 200ms out | `spring` | Toast xuất hiện/biến mất |
| Bottom sheet | 350ms | `spring(1, 80, 10)` | Slide up trên mobile |
| Sidebar collapse | 200ms | `ease-in-out` | Sidebar mở/đóng |

**Lưu ý:** Tôn trọng `prefers-reduced-motion` — tắt animation cho người dùng có cài đặt giảm chuyển động.

---

## Phụ Lục: Checklist Triển Khai

### Checklist UX cho Developer

#### Localization & Format
- [ ] Tất cả text trong UI bằng tiếng Việt
- [ ] Format tiền VND: dấu chấm ngăn cách hàng nghìn (8.450.000 đ)
- [ ] Format ngày: dd/mm/yyyy
- [ ] Format giờ: HH:mm (24 giờ)
- [ ] Input SĐT: validate 10 số, tự format khi nhập
- [ ] Keyboard number pad tự động khi focus vào ô nhập số/tiền

#### Mobile Responsiveness
- [ ] Mọi tap target ≥ 44×44px
- [ ] Font tối thiểu 12px (ideal 14px trở lên)
- [ ] Không có horizontal scroll trên mobile
- [ ] Forms đẩy content lên khi bàn phím mở (no covered inputs)
- [ ] Bottom navigation clearance cho iPhone safe area

#### Performance
- [ ] Lazy load images (đặc biệt danh sách sản phẩm)
- [ ] Debounce search input (300ms)
- [ ] Pagination cho danh sách lớn (không load toàn bộ)
- [ ] Skeleton loading thay vì spinner toàn trang
- [ ] Offline mode cho POS (Service Worker)

#### Accessibility
- [ ] Alt text cho tất cả ảnh
- [ ] Focus ring visible cho keyboard navigation
- [ ] Color contrast ≥ 4.5:1
- [ ] Error messages không chỉ dùng màu

#### Trạng Thái UI
- [ ] Empty state cho mọi list/table
- [ ] Loading state cho mọi async action
- [ ] Error state với message tiếng Việt dễ hiểu
- [ ] Success toast sau mỗi action quan trọng
- [ ] Confirm dialog trước khi xóa dữ liệu quan trọng

---

*Tài liệu này được tạo bởi Product Design Team — GenHub POS*
*Phiên bản 1.0 | Tháng 4/2026*
*Liên hệ: Mọi câu hỏi về thiết kế vui lòng trao đổi trực tiếp với Product Designer*
