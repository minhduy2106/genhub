# PROMPT: Frontend Developer - GenHub POS

Copy toàn bộ prompt dưới đây vào Claude Code trên máy khác để chạy.

---

## PROMPT BẮT ĐẦU TỪ ĐÂY:

Bạn là Senior Frontend Developer. Triển khai FRONTEND MVP cho GenHub POS - Web App Quản Lý Bán Hàng tại thư mục `./genhub/frontend/`.

## TECH STACK (BẮT BUỘC):
- **Next.js 14+** (App Router, Server Components)
- **TypeScript** strict mode
- **Tailwind CSS** v3 (mobile-first)
- **shadcn/ui** + Radix UI
- **Zustand** (client state - cart, auth)
- **TanStack Query v5** (server state)
- **React Hook Form + Zod** (forms)
- **Recharts** (biểu đồ)
- **Axios** (HTTP client)

## DESIGN SYSTEM:

### Colors:
```
Primary:     #FF6B35 (cam GenHub)
Primary hover: #E55A2B
Secondary:   #2D3748
Background:  #F7F8FA
Surface:     #FFFFFF
Border:      #E2E8F0
Text:        #1A202C
Text secondary: #718096
Success:     #38A169
Warning:     #D69E2E
Error:       #E53E3E
Info:        #3182CE
Sidebar BG:  #1A202C (dark)
Sidebar text: #A0AEC0
Sidebar active: #FF6B35
```

### Typography:
- Font: "Be Vietnam Pro" (Google Fonts, self-host)
- Headings: 600-700 weight
- Body: 400-500 weight
- Size scale: xs(12), sm(14), base(16), lg(18), xl(20), 2xl(24), 3xl(30)

### Breakpoints (mobile-first):
- xs: 0-479px (mobile)
- sm: 480-639px
- md: 640-767px (tablet)
- lg: 768-1023px
- xl: 1024-1279px (desktop)
- 2xl: 1280+ (wide)

### Format Việt Nam:
- Tiền: `1.000.000đ` (dấu chấm phân cách, hậu tố đ)
- Ngày: `dd/mm/yyyy` (02/04/2026)
- Giờ: `HH:mm` 24h format

## PROJECT STRUCTURE:

```
src/
├── app/
│   ├── (auth)/                     # Route group: không sidebar
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (store)/                    # Route group: có sidebar
│   │   ├── layout.tsx              # Sidebar + TopBar layout
│   │   ├── dashboard/page.tsx
│   │   ├── pos/
│   │   │   ├── page.tsx
│   │   │   └── components/
│   │   │       ├── ProductGrid.tsx
│   │   │       ├── Cart.tsx
│   │   │       ├── PaymentModal.tsx
│   │   │       └── CustomerSearch.tsx
│   │   ├── products/
│   │   │   ├── page.tsx            # List
│   │   │   ├── new/page.tsx        # Create form
│   │   │   └── [id]/page.tsx       # Edit
│   │   ├── orders/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── inventory/page.tsx
│   │   ├── customers/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── reports/page.tsx
│   │   ├── suppliers/page.tsx
│   │   ├── staff/page.tsx
│   │   └── settings/page.tsx
│   ├── layout.tsx                  # Root layout (fonts, providers)
│   └── globals.css
├── components/
│   ├── ui/                         # shadcn/ui (button, dialog, table, etc.)
│   ├── layout/
│   │   ├── Sidebar.tsx             # 240px desktop, collapsible
│   │   ├── TopBar.tsx              # Breadcrumb, search, notifications, avatar
│   │   └── MobileNav.tsx           # Bottom 5-tab bar
│   ├── common/
│   │   ├── DataTable/
│   │   │   ├── DataTable.tsx       # @tanstack/react-table
│   │   │   ├── Pagination.tsx
│   │   │   └── ColumnFilters.tsx
│   │   ├── FormFields/
│   │   │   ├── CurrencyInput.tsx   # Input VND format
│   │   │   ├── DatePicker.tsx      # dd/mm/yyyy
│   │   │   └── ImageUpload.tsx
│   │   ├── StatusBadge.tsx
│   │   ├── EmptyState.tsx
│   │   ├── LoadingSkeleton.tsx
│   │   └── ConfirmDialog.tsx
│   └── charts/
│       ├── RevenueChart.tsx
│       └── TopProductsChart.tsx
├── lib/
│   ├── api/
│   │   ├── client.ts               # Axios instance + JWT interceptor + refresh
│   │   ├── auth.api.ts
│   │   ├── products.api.ts
│   │   ├── orders.api.ts
│   │   ├── inventory.api.ts
│   │   ├── customers.api.ts
│   │   ├── reports.api.ts
│   │   └── suppliers.api.ts
│   ├── hooks/
│   │   ├── useProducts.ts          # TanStack Query hooks
│   │   ├── useOrders.ts
│   │   ├── useInventory.ts
│   │   ├── useCustomers.ts
│   │   ├── useDashboard.ts
│   │   └── useAuth.ts
│   ├── stores/
│   │   ├── cart.store.ts           # POS cart (Zustand + persist)
│   │   ├── auth.store.ts           # User, token, permissions
│   │   └── ui.store.ts             # Sidebar collapse, modals
│   └── utils/
│       ├── format.ts               # formatCurrency, formatDate, formatPhone
│       ├── cn.ts                   # clsx + tailwind-merge
│       └── constants.ts
└── types/
    ├── api.types.ts                # ApiResponse<T>, PaginatedResponse<T>
    ├── product.types.ts
    ├── order.types.ts
    ├── customer.types.ts
    └── common.types.ts
```

## CÁC TRANG CẦN TRIỂN KHAI:

### 1. Login Page (/login)
- Form: email + password
- Nút "Đăng nhập" màu cam #FF6B35
- Link "Tạo tài khoản" → /register
- Responsive, centered card

### 2. Register Page (/register)
- Form: họ tên, email, SĐT, mật khẩu, tên cửa hàng
- Validation Zod
- Link "Đã có tài khoản" → /login

### 3. Store Layout
- **Desktop:** Sidebar trái 240px (dark bg #1A202C) + content area
  - Logo "GenHub" trên cùng
  - Menu items với icons: Tổng quan, Bán hàng, Sản phẩm, Đơn hàng, Kho hàng, Khách hàng, Báo cáo, Nhà cung cấp, Nhân viên, Cài đặt
  - User info + logout ở dưới
  - Collapse toggle
- **Mobile:** Bottom tab bar 5 items (Tổng quan, Bán hàng, Sản phẩm, Đơn hàng, Thêm)
- **TopBar:** Breadcrumb | Search | Notification bell | User avatar dropdown

### 4. Dashboard (/dashboard)
- 4 KPI cards: Doanh thu hôm nay, Số đơn hàng, Khách hàng mới, Sản phẩm sắp hết
- Biểu đồ doanh thu 7 ngày (Line chart - Recharts)
- Top 5 sản phẩm bán chạy (Bar chart)
- Bảng 5 đơn hàng gần nhất
- Tất cả số tiền format VND

### 5. POS - Bán Hàng (/pos) ⭐ QUAN TRỌNG NHẤT
- **Desktop layout 2 cột:**
  - Trái (60%): Search bar + Category tabs + Product grid (cards: ảnh, tên, giá)
  - Phải (40%): Cart panel
    - Danh sách items (tên, giá, số lượng +/-, xóa)
    - Chọn khách hàng (search modal)
    - Tạm tính, giảm giá, tổng cộng
    - Nút "Thanh toán" lớn màu cam
- **Payment Modal:** Chọn phương thức (Tiền mặt, Chuyển khoản, MoMo), nhập số tiền, tiền thừa
- **Mobile:** Toggle giữa product grid và cart (2 tabs)
- Click sản phẩm → thêm vào cart (increment nếu đã có)
- Tối ưu tốc độ: không lag khi thao tác nhanh

### 6. Quản lý Sản phẩm (/products)
- DataTable: [Ảnh] Tên | SKU | Danh mục | Giá bán | Tồn kho | Trạng thái | Actions
- Search, filter by category, filter by status
- Pagination
- Nút "Thêm sản phẩm" → /products/new
- Row click → /products/[id]

### 7. Form Sản phẩm (/products/new, /products/[id])
- Tabs hoặc sections: Thông tin chung, Giá & Kho, Biến thể, Hình ảnh
- Fields: Tên, Mô tả, Danh mục (select), SKU, Barcode, Đơn vị
- Giá bán, Giá so sánh, Giá vốn (CurrencyInput)
- Toggle "Có biến thể" → dynamic form cho variants (color/size matrix)
- Image upload (drag & drop)
- Validation Zod

### 8. Quản lý Đơn hàng (/orders)
- DataTable: Mã đơn | Khách hàng | Kênh | Tổng tiền | Trạng thái (badge màu) | Ngày tạo
- Filter: status tabs (Tất cả, Chờ xử lý, Đã xác nhận, Hoàn thành, Đã hủy)
- Date range filter
- Row click → /orders/[id] (chi tiết đơn + timeline trạng thái + action buttons)

### 9. Quản lý Kho (/inventory)
- Tab 1: Tồn kho hiện tại (table: SP, SKU, Tồn kho, Ngưỡng cảnh báo)
  - Highlight đỏ sản phẩm sắp hết
- Tab 2: Nhập hàng (form: chọn NCC, thêm SP + SL + giá nhập)
- Tab 3: Lịch sử nhập/xuất

### 10. Quản lý Khách hàng (/customers)
- DataTable: Tên | SĐT | Email | Tổng mua | Số đơn | Lần mua cuối
- Search by name/phone
- Form thêm/sửa
- Chi tiết: thông tin + lịch sử mua hàng

### 11. Báo cáo (/reports)
- Date range picker
- Tab Doanh thu: Line chart theo ngày/tuần/tháng
- Tab Sản phẩm: Bar chart top 10 bán chạy + bảng chi tiết
- Tab Lợi nhuận: Doanh thu - Chi phí - Lãi gộp
- Tất cả số liệu format VND

### 12. Settings (/settings)
- Thông tin cửa hàng (tên, SĐT, địa chỉ, logo)
- Cài đặt: ngưỡng cảnh báo hết hàng, footer hóa đơn

## MOCK DATA (dùng khi chưa có backend):

Tạo file `src/lib/mock-data.ts` với data mẫu tiếng Việt:
- 20 sản phẩm thời trang VN (Áo sơ mi trắng, Váy hoa nhí, Quần jean nam, etc.) với giá VND
- 5 danh mục: Áo, Quần, Váy, Phụ kiện, Giày dép
- 10 khách hàng (tên VN: Nguyễn Thị Lan, Trần Văn Hùng, etc.)
- 15 đơn hàng mẫu với various statuses
- Dashboard stats mẫu

## SHARED COMPONENTS CHI TIẾT:

### DataTable:
```tsx
// Props: columns, data, searchPlaceholder, filterOptions, onRowClick
// Features: sort, search (client-side), pagination, loading skeleton
// Dùng @tanstack/react-table
```

### CurrencyInput:
```tsx
// Input number format VND: 1.000.000
// onChange trả về number thuần (không format)
// Suffix "đ"
```

### StatusBadge:
```tsx
// status → color mapping:
// completed/active → green
// pending → yellow
// cancelled/inactive → red
// processing/shipping → blue
// draft → gray
```

### formatCurrency:
```typescript
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
}
// 1500000 → "1.500.000đ"
```

### formatDate:
```typescript
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(date));
}
// → "02/04/2026"
```

## API CLIENT (Axios):
```typescript
// client.ts
// - baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
// - Request interceptor: attach Authorization Bearer token from auth store
// - Response interceptor 401: try refresh token → retry original request
// - Response interceptor: unwrap { data } from API response
```

## AUTH FLOW:
1. Login → store accessToken in Zustand (memory), refreshToken in HttpOnly cookie
2. Protected routes: middleware check auth → redirect to /login
3. Token refresh: transparent via Axios interceptor
4. Permissions: check user.permissions array before showing menu items / action buttons

## QUY TẮC CODE:
- TypeScript strict, KHÔNG `any`
- Mỗi file KHÔNG quá 200 dòng - tách components
- TẤT CẢ text hiển thị bằng tiếng Việt
- Mobile-first responsive (min-width breakpoints)
- Loading skeleton cho mọi data fetching
- Empty state cho danh sách trống
- Toast notification cho actions (thêm/sửa/xóa thành công)
- Không hardcode colors - dùng CSS variables hoặc Tailwind config

## CÁCH BẮT ĐẦU:
1. `npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"`
2. `npx shadcn@latest init` (New York style, Zinc base, CSS variables)
3. Add shadcn components: `npx shadcn@latest add button card dialog dropdown-menu input label select sheet table tabs toast badge separator avatar skeleton`
4. Install: `npm i zustand @tanstack/react-query @tanstack/react-table react-hook-form @hookform/resolvers zod recharts axios lucide-react date-fns`
5. Setup Tailwind config: custom colors (#FF6B35), font (Be Vietnam Pro)
6. Tạo layout (Sidebar + TopBar) trước
7. Implement pages theo thứ tự: Login → Dashboard → POS → Products → Orders → Inventory → Customers → Reports
8. Dùng mock data, wire up API client structure

Viết code THỰC SỰ chạy được, KHÔNG placeholder. Bắt đầu ngay.
