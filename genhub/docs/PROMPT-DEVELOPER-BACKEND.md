# PROMPT: Backend Developer - GenHub POS

Copy toàn bộ prompt dưới đây vào Claude Code trên máy khác để chạy.

---

## PROMPT BẮT ĐẦU TỪ ĐÂY:

Bạn là Senior Backend Developer. Triển khai BACKEND MVP cho GenHub POS - Web App Quản Lý Bán Hàng tại thư mục `./genhub/backend/`.

## TECH STACK (BẮT BUỘC):
- **NestJS** (Node.js) + TypeScript strict mode
- **Prisma ORM** + PostgreSQL 16
- **Redis 7** (cache, refresh tokens)
- **JWT RS256** (access 15min + refresh 30d)
- **REST API**, base URL: `/api/v1`
- **Docker Compose** cho PostgreSQL + Redis

## KIẾN TRÚC: Modular Monolith

```
src/
├── main.ts
├── app.module.ts
├── config/                    # database, redis, jwt, storage configs
├── common/
│   ├── decorators/            # @CurrentUser, @RequirePermissions, @Public
│   ├── guards/                # JwtAuthGuard, PermissionsGuard, StoreScopeGuard
│   ├── interceptors/          # ResponseTransform, Logging, Timeout
│   ├── pipes/                 # ValidationPipe
│   ├── filters/               # HttpExceptionFilter
│   ├── dto/                   # PaginationDto, base DTOs
│   └── utils/                 # generate-code, format-currency, slug
├── prisma/
│   ├── prisma.module.ts
│   └── prisma.service.ts
├── redis/
│   ├── redis.module.ts
│   └── redis.service.ts
├── modules/
│   ├── auth/                  # register, login, refresh, logout, RBAC
│   ├── products/              # CRUD + variants + images + search
│   ├── categories/            # CRUD tree structure
│   ├── orders/                # CRUD + POS flow + invoice
│   ├── inventory/             # stock tracking, purchase, adjustment
│   ├── customers/             # CRUD + order history + debt
│   ├── suppliers/             # CRUD
│   ├── promotions/            # CRUD + coupon validation
│   ├── shifts/                # open/close shift
│   ├── reports/               # dashboard, revenue, profit, top products
│   ├── users/                 # staff CRUD + roles
│   ├── store/                 # store settings
│   └── uploads/               # presigned URL for file upload
prisma/
├── schema.prisma
├── migrations/
└── seed.ts
```

## DATABASE SCHEMA (Prisma) - TẤT CẢ BẢNG:

### Nguyên tắc:
- UUID cho primary keys
- Soft delete với `deletedAt` cho orders, products, customers, users, suppliers
- Optimistic locking với `version` cho inventory
- Multi-tenancy theo `storeId`
- NUMERIC(15,0) cho tiền VND (không dùng float)

### Bảng stores:
- id, name, slug (unique), phone, email, address, city, district
- logoUrl, taxCode, invoicePrefix (default 'HD'), invoiceCounter
- currency (default 'VND'), timezone (default 'Asia/Ho_Chi_Minh')
- settings (Json - low_stock_threshold, receipt_footer, etc.)
- plan (enum: free/starter/pro/enterprise), planExpiresAt
- isActive, createdAt, updatedAt

### Bảng users:
- id, storeId (FK stores), roleId (FK roles)
- email, phone, passwordHash, pinHash (cho login PIN tại quầy)
- fullName, avatarUrl, isOwner, isActive
- lastLoginAt, createdAt, updatedAt, deletedAt
- Unique: (email, storeId), (phone, storeId)
- Check: email OR phone phải có ít nhất 1

### Bảng roles:
- id, storeId (nullable - null = system role), name, slug, description, isSystem
- System roles: owner, manager, cashier, warehouse

### Bảng permissions:
- id, module, action, slug (unique - format: 'module:action'), description
- Modules: products, orders, inventory, reports, customers, settings, staff
- Actions: view, create, update, delete, export, view_cost, view_profit, adjust, etc.

### Bảng role_permissions (many-to-many):
- roleId, permissionId (composite PK)

### Bảng categories:
- id, storeId, parentId (self-ref, max 2 levels), name, slug, imageUrl, sortOrder, isActive
- createdAt, updatedAt

### Bảng products:
- id, storeId, categoryId (nullable), name, slug, description
- sku, barcode, unit (cái/hộp/kg/lít)
- hasVariants (boolean)
- price, comparePrice, costPrice (NUMERIC 15,0 - dùng Decimal trong Prisma)
- status (enum: active/inactive/archived), isPosVisible
- tags (String[]), attributes (Json)
- createdBy, createdAt, updatedAt, deletedAt

### Bảng product_variants:
- id, productId, storeId, name ("Đỏ / M"), sku, barcode
- price, comparePrice, costPrice (Decimal)
- attributes (Json - {"color": "Đỏ", "size": "M"})
- imageUrl, sortOrder, isActive, createdAt, updatedAt

### Bảng product_images:
- id, productId, url, storageKey, altText, sortOrder, isPrimary, createdAt

### Bảng inventory:
- id, storeId, productId, variantId (nullable)
- quantity (Int), reservedQuantity (Int, default 0)
- lowStockAlert (Int, default 5), version (Int, optimistic locking)
- lastCountedAt, createdAt, updatedAt
- Unique: (storeId, productId, variantId)

### Bảng inventory_transactions:
- id, storeId, inventoryId, productId, variantId
- type (enum: purchase/sale/return_in/return_out/adjustment_in/adjustment_out/damage/stocktake)
- quantityChange (Int, +nhập -xuất), quantityBefore, quantityAfter
- unitCost (Decimal nullable)
- referenceType, referenceId, notes, performedBy (FK users)
- createdAt

### Bảng suppliers:
- id, storeId, name, code, phone, email, address, contactPerson
- taxCode, paymentTerms (Int days), notes, isActive
- createdAt, updatedAt, deletedAt

### Bảng customers:
- id, storeId, code ("KH-001"), fullName, phone, email
- dateOfBirth, gender (enum: male/female/other), address, city, district
- totalOrders (Int), totalSpent (Decimal), lastOrderAt (denormalized)
- groupId (FK customer_groups), loyaltyPoints, debtAmount
- tags (String[]), notes, source (enum: manual/pos/shopee/import)
- createdAt, updatedAt, deletedAt

### Bảng customer_groups:
- id, storeId, name, description
- discountType (enum: percent/fixed/none), discountValue (Decimal)
- sortOrder, createdAt, updatedAt

### Bảng orders:
- id, storeId, code ("DH-2026-00001")
- customerId (nullable FK), customerSnapshot (Json)
- channel (enum: pos/manual/shopee/lazada/tiktok/facebook/website/other)
- channelOrderId
- status (enum: draft/pending/confirmed/processing/shipping/completed/cancelled/refunded)
- subtotal, discountAmount, discountType, discountReason
- shippingFee, totalAmount, paidAmount (all Decimal)
- shippingAddress (Json), shippingProvider, shippingCode
- promotionId (FK), couponCode
- customerNote, internalNote
- createdBy, confirmedBy, cancelledBy (FK users), cancelledReason
- completedAt, createdAt, updatedAt, deletedAt

### Bảng order_items:
- id, orderId, productId, variantId (nullable)
- productSnapshot (Json - {name, sku, imageUrl})
- unitPrice, unitCost (Decimal), quantity (Int)
- discountAmount, lineTotal (Decimal)
- returnedQuantity (Int), createdAt

### Bảng payments:
- id, orderId, storeId
- method (enum: cash/bank_transfer/credit_card/debit_card/momo/zalopay/vnpay/debt/other)
- amount (Decimal), status (enum: pending/completed/failed/refunded)
- referenceCode, gatewayResponse (Json), notes
- processedBy (FK users), createdAt, updatedAt

### Bảng promotions:
- id, storeId, name
- type (enum: percent_discount/fixed_discount/buy_x_get_y/free_shipping)
- value (Decimal), minOrderAmount, maxDiscount
- appliesTo (enum: all/specific_products/specific_categories)
- productIds (String[]), categoryIds (String[])
- usageLimit, usageCount, usagePerCustomer
- startsAt, endsAt, isActive, createdBy
- createdAt, updatedAt

### Bảng coupons:
- id, promotionId, storeId, code (unique per store)
- usageLimit, usageCount, isActive, expiresAt, createdAt

### Bảng shifts:
- id, storeId, openedBy (FK users), closedBy
- openingCash, closingCash, expectedCash, cashDifference (Decimal)
- totalOrders, totalRevenue (Decimal), notes
- openedAt, closedAt, status (enum: open/closed)

### Bảng activity_logs:
- id, storeId, userId, action ("order.created"), entityType, entityId
- oldValues, newValues (Json), ipAddress, userAgent, createdAt

### Bảng refresh_tokens:
- id, userId, tokenHash (unique), deviceInfo (Json), ipAddress
- expiresAt, revokedAt, createdAt

## API ENDPOINTS ĐẦY ĐỦ:

### Auth Module:
```
POST   /api/v1/auth/register          - Đăng ký (tạo store + user owner)
POST   /api/v1/auth/login             - Đăng nhập email/password → {accessToken, refreshToken, user}
POST   /api/v1/auth/login/pin         - Đăng nhập PIN (nhân viên)
POST   /api/v1/auth/refresh           - Refresh token (rotation + reuse detection)
POST   /api/v1/auth/logout            - Revoke refresh token
POST   /api/v1/auth/change-password   - Đổi mật khẩu
GET    /api/v1/auth/me                - User hiện tại + store + permissions
```

### Store:
```
GET    /api/v1/store                  - Thông tin cửa hàng
PATCH  /api/v1/store                  - Cập nhật store
PATCH  /api/v1/store/settings         - Cập nhật settings JSON
```

### Users/Staff:
```
GET    /api/v1/users                  - DS nhân viên (paginated)
POST   /api/v1/users                  - Thêm nhân viên
GET    /api/v1/users/:id              - Chi tiết
PATCH  /api/v1/users/:id              - Cập nhật
DELETE /api/v1/users/:id              - Soft delete
PATCH  /api/v1/users/:id/role         - Đổi role
GET    /api/v1/roles                  - DS vai trò
GET    /api/v1/permissions            - Tất cả permissions
```

### Categories:
```
GET    /api/v1/categories             - DS danh mục (tree)
POST   /api/v1/categories             - Tạo
GET    /api/v1/categories/:id         - Chi tiết
PATCH  /api/v1/categories/:id         - Cập nhật
DELETE /api/v1/categories/:id         - Xóa
```

### Products:
```
GET    /api/v1/products               - DS (paginated, filter: category, status, search, low_stock)
POST   /api/v1/products               - Tạo (kèm variants nếu có)
GET    /api/v1/products/:id           - Chi tiết (include variants, images, inventory)
PATCH  /api/v1/products/:id           - Cập nhật
DELETE /api/v1/products/:id           - Soft delete
GET    /api/v1/products/search        - Quick search cho POS
GET    /api/v1/products/barcode/:code - Tìm theo barcode

POST   /api/v1/products/:id/variants       - Thêm variant
PATCH  /api/v1/products/:id/variants/:vid  - Sửa variant
DELETE /api/v1/products/:id/variants/:vid  - Xóa variant

POST   /api/v1/products/:id/images         - Upload ảnh
DELETE /api/v1/products/:id/images/:imgId  - Xóa ảnh
```

### Orders:
```
GET    /api/v1/orders                 - DS (filter: status, channel, date range)
POST   /api/v1/orders                 - Tạo đơn manual
POST   /api/v1/orders/pos             - Tạo đơn POS (tối ưu: tạo đơn + payment + trừ kho trong 1 transaction)
GET    /api/v1/orders/:id             - Chi tiết (include items, payments)
PATCH  /api/v1/orders/:id/confirm     - Xác nhận
PATCH  /api/v1/orders/:id/cancel      - Hủy (hoàn kho nếu đã trừ)
PATCH  /api/v1/orders/:id/complete    - Hoàn thành
POST   /api/v1/orders/:id/refund      - Hoàn trả
POST   /api/v1/orders/:id/payments    - Thêm thanh toán
```

### Inventory:
```
GET    /api/v1/inventory              - Tồn kho (paginated)
GET    /api/v1/inventory/low-stock    - Sắp hết hàng
POST   /api/v1/inventory/purchase     - Nhập hàng từ NCC
POST   /api/v1/inventory/adjustment   - Điều chỉnh thủ công
GET    /api/v1/inventory/transactions - Lịch sử nhập/xuất
```

### Customers:
```
GET    /api/v1/customers              - DS (paginated, search)
POST   /api/v1/customers              - Tạo
GET    /api/v1/customers/:id          - Chi tiết
PATCH  /api/v1/customers/:id          - Cập nhật
DELETE /api/v1/customers/:id          - Soft delete
GET    /api/v1/customers/:id/orders   - Lịch sử mua
GET    /api/v1/customers/search       - Quick search cho POS
```

### Suppliers:
```
GET    /api/v1/suppliers              - DS
POST   /api/v1/suppliers              - Tạo
GET    /api/v1/suppliers/:id          - Chi tiết
PATCH  /api/v1/suppliers/:id          - Cập nhật
DELETE /api/v1/suppliers/:id          - Soft delete
```

### Promotions:
```
GET    /api/v1/promotions             - DS
POST   /api/v1/promotions             - Tạo
PATCH  /api/v1/promotions/:id         - Cập nhật
DELETE /api/v1/promotions/:id         - Xóa
POST   /api/v1/promotions/validate    - Validate coupon code
```

### Shifts:
```
POST   /api/v1/shifts/open            - Mở ca
PATCH  /api/v1/shifts/:id/close       - Đóng ca
GET    /api/v1/shifts/current         - Ca hiện tại
GET    /api/v1/shifts                 - Lịch sử ca
```

### Reports:
```
GET    /api/v1/reports/dashboard      - KPIs: revenue, orders, new customers, low stock (cache 5min)
GET    /api/v1/reports/revenue        - Doanh thu theo day/week/month
GET    /api/v1/reports/profit         - Lợi nhuận (cần quyền reports:view_profit)
GET    /api/v1/reports/products       - Top sản phẩm bán chạy/chậm
GET    /api/v1/reports/customers      - Thống kê khách hàng
```

## API CONVENTIONS:

### Pagination:
```json
{
  "success": true,
  "data": [...],
  "meta": { "page": 1, "limit": 20, "total": 248, "totalPages": 13 }
}
```

### Error:
```json
{
  "success": false,
  "error": { "code": "PRODUCT_NOT_FOUND", "message": "Không tìm thấy sản phẩm", "details": null },
  "timestamp": "2026-04-02T07:30:00Z"
}
```

### HTTP Status: 200 OK, 201 Created, 204 No Content, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict, 422 Unprocessable, 429 Rate Limit

## SECURITY:
- JWT RS256: access token 15min (in memory), refresh token 30d (HttpOnly cookie)
- Refresh token rotation + reuse detection
- RBAC: 4 roles (owner > manager > cashier > warehouse)
- Multi-tenancy: ALL queries filtered by storeId
- class-validator cho DTO validation
- Rate limiting: login 5/5min, default 100/min
- Helmet.js security headers

## BUSINESS LOGIC QUAN TRỌNG:

### POS Order Flow (trong 1 database transaction):
1. Validate items (check tồn kho, giá)
2. Tạo order + order_items (lưu product_snapshot)
3. Trừ inventory (optimistic locking với version)
4. Tạo payment records
5. Cập nhật customer stats (totalOrders, totalSpent)
6. Sinh mã đơn: DH-{year}-{counter 5 digits}
7. Return order + invoice URL

### Inventory Decrease (optimistic locking):
```typescript
// UPDATE inventory SET quantity = quantity - :qty, version = version + 1
// WHERE id = :id AND version = :currentVersion AND quantity >= :qty
// Nếu affected rows = 0 → retry hoặc throw InsufficientStockException
```

### Order Cancel → hoàn lại tồn kho

## SEED DATA (tiếng Việt):
- 1 store: "Cửa hàng Thời Trang Lan"
- 4 users: owner, manager, cashier, warehouse staff
- Categories: Áo (Áo sơ mi, Áo thun), Quần, Váy, Phụ kiện
- 15-20 sản phẩm mẫu với giá VND, variants (size/color)
- 5 khách hàng mẫu
- 5-10 đơn hàng mẫu

## QUY TẮC CODE:
- TypeScript strict mode, KHÔNG dùng `any`
- Mỗi file KHÔNG quá 200 dòng
- Validation với class-validator trên tất cả DTOs
- Error messages bằng tiếng Việt
- Tiền tệ dùng number/Decimal (đơn vị VND, không float)
- Code comments cho logic phức tạp
- Tách rõ: controller → service → DTO

## CÁCH BẮT ĐẦU:
1. `nest new backend --package-manager npm --strict`
2. Cài dependencies: `@prisma/client prisma @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt class-validator class-transformer ioredis @nestjs/throttler helmet`
3. Tạo `docker-compose.yml` cho PostgreSQL 16 + Redis 7
4. Tạo Prisma schema đầy đủ
5. `npx prisma migrate dev --name init`
6. Tạo seed data
7. Implement modules theo thứ tự: Auth → Products → Categories → Orders → Inventory → Customers → Suppliers → Reports → Shifts
8. Tạo `.env.example`

Viết code THỰC SỰ chạy được, KHÔNG placeholder. Bắt đầu ngay.
