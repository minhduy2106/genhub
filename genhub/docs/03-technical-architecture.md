# Kiến Trúc Kỹ Thuật: GenHub POS

**Phiên bản:** 1.0
**Ngày:** Tháng 4/2026
**Tác giả:** Tech Lead
**Trạng thái:** Draft

---

## Mục Lục

1. [Lựa Chọn Tech Stack](#1-lựa-chọn-tech-stack)
2. [System Architecture](#2-system-architecture)
3. [Database Design](#3-database-design)
4. [API Specification](#4-api-specification)
5. [Security Design](#5-security-design)
6. [Performance & Scalability](#6-performance--scalability)
7. [Development Guidelines](#7-development-guidelines)

---

## 1. Lựa Chọn Tech Stack

### 1.1 Frontend

#### Framework: Next.js 14+ (App Router)

**Lý do chọn:**
- App Router hỗ trợ Server Components → giảm bundle size, cải thiện Time-to-First-Byte trên mobile
- Built-in Image Optimization quan trọng với tính năng upload ảnh sản phẩm
- Streaming SSR phù hợp với dashboard hiển thị nhiều data
- File-based routing đơn giản, team nhỏ dễ maintain
- Next.js 14 có Partial Prerendering (PPR) — phần tĩnh load nhanh, phần dynamic load sau

**Không chọn:**
- Vite + React SPA: Không có SSR, SEO kém nếu sau này cần public-facing pages
- Remix: Ecosystem nhỏ hơn, ít tài liệu tiếng Việt cho team

#### State Management: Zustand + TanStack Query (React Query v5)

**Lý do chọn Zustand (client state):**
- API nhỏ gọn, boilerplate ít hơn Redux Toolkit 80%
- Phù hợp với state phức tạp nhất của app là POS cart state — cần persist khi refresh
- TypeScript support tốt

**Lý do chọn TanStack Query (server state):**
- Cache tự động, background refetch — dashboard luôn hiển thị data mới nhất
- Optimistic updates cho POS flow (thêm vào giỏ không cần chờ server)
- Pagination, infinite scroll out-of-the-box
- Tách biệt rõ ràng server state và client state → code dễ đọc

**Không chọn Redux Toolkit:** Overkill cho MVP, boilerplate nhiều, team nhỏ mất thời gian setup

#### UI Component Library: shadcn/ui + Radix UI Primitives

**Lý do chọn:**
- shadcn/ui không phải package dependency mà là code copied vào project → full control, không bị breaking changes từ upstream
- Radix UI đảm bảo accessibility (ARIA) mà không cần tự implement
- Dễ customize theo design system GenHub (màu cam #FF6B35) qua CSS variables
- Components như Dialog, Dropdown, Select, Toast đã production-ready

**Không chọn:**
- Ant Design: Nặng (~2MB), design language khác với design system đề ra
- MUI: Quá Material Design, khó customize để ra vibe riêng
- Chakra UI: Bundle size lớn hơn shadcn/ui

#### CSS: Tailwind CSS v3

**Lý do chọn:**
- Utility-first → không cần đặt tên class, team nhỏ code nhanh hơn 30-40%
- JIT compiler → chỉ ship CSS đang dùng, bundle rất nhỏ
- Responsive prefix (`sm:`, `md:`, `lg:`) phù hợp mobile-first approach
- Config `tailwind.config.ts` để define design tokens (màu cam, font Be Vietnam Pro)

#### Form Management: React Hook Form + Zod

**Lý do chọn:**
- React Hook Form: Uncontrolled components → hiệu năng tốt khi form nhiều fields (thêm sản phẩm có biến thể)
- Zod: TypeScript-first schema validation, dùng chung schema giữa frontend và backend (tDTO)

---

### 1.2 Backend

#### Language & Framework: Node.js + NestJS

**Lý do chọn NestJS:**
- Cấu trúc module hóa tường minh → dễ tổ chức code theo domain (ProductModule, OrderModule...)
- Decorator-based → controller, service, DTO nhất quán, dễ đọc
- Built-in dependency injection → testable
- TypeScript native → share types với frontend nếu dùng monorepo
- Ecosystem mature: Guards (auth), Interceptors (logging), Pipes (validation)

**Lý do Node.js:**
- Team đã biết TypeScript từ frontend → một ngôn ngữ cho cả stack
- I/O-bound workload (database queries, file upload) phù hợp event loop của Node
- npm ecosystem phong phú cho payment integration, barcode generation

**Không chọn:**
- Python/Django: Team cần học thêm ngôn ngữ mới
- Go: Hiệu năng tốt hơn nhưng không cần thiết ở quy mô MVP, ít dev Việt Nam biết Go
- Java/Spring: Nặng, verbose, startup time chậm

#### API Style: REST (JSON over HTTPS)

**Lý do chọn REST thay vì GraphQL:**
- GraphQL phù hợp khi client cần flexible queries — POS app có queries khá cố định
- REST dễ cache (HTTP cache headers, CDN) hơn GraphQL POST requests
- Team nhỏ không cần overhead của GraphQL schema, resolvers, N+1 problem
- Tooling đơn giản hơn: Postman, Swagger/OpenAPI

#### Authentication: JWT (Access Token + Refresh Token)

Chi tiết trong phần Security Design.

#### ORM: Prisma

**Lý do chọn:**
- Type-safe database client → TypeScript autocomplete cho queries
- Migration system tốt, `prisma migrate dev` cho development
- Prisma Studio cho visual database browsing khi debug
- Schema declarative trong `schema.prisma` → source of truth

**Không chọn TypeORM:** Decorator magic phức tạp, TypeScript support kém hơn Prisma, lazy loading bugs

#### File Upload: Multer + AWS S3 (hoặc Cloudflare R2)

**Lý do chọn Cloudflare R2 cho MVP:**
- **Không có phí egress** (S3 charge $0.09/GB egress) → tiết kiệm chi phí đáng kể khi hiển thị nhiều ảnh sản phẩm
- Giá lưu trữ tương đương S3 Standard
- S3-compatible API → migrate sang S3 sau này dễ dàng

---

### 1.3 Database

#### Primary: PostgreSQL 16

**Lý do chọn:**
- ACID transactions quan trọng với POS (tồn kho phải chính xác, không oversell)
- JSON/JSONB columns cho variant attributes linh hoạt mà không cần EAV tables
- Row-level locking cho concurrent order processing
- Full-text search cho tìm kiếm sản phẩm cơ bản (không cần Elasticsearch ở MVP)
- Extensions: `pg_trgm` cho fuzzy search tên sản phẩm, `uuid-ossp` cho UUID generation

#### Cache: Redis 7

**Sử dụng cho:**
- Session store cho refresh tokens
- Cache dashboard aggregations (tính toán nặng, refresh mỗi 5 phút)
- Rate limiting counters
- POS offline sync queue (Phase 2)
- Pub/Sub cho realtime inventory updates

#### Search: PostgreSQL Full-Text Search (MVP) → Elasticsearch (Phase 2)

**Lý do dùng PG FTS cho MVP:**
- Tránh thêm service phức tạp vào infrastructure
- `pg_trgm` đủ tốt cho tìm kiếm sản phẩm theo tên/mã (~10.000 SKUs)
- Khi cần advanced search (Phase 2) thì migrate sang Elasticsearch

---

### 1.4 Infrastructure

#### Development: Docker Compose

```yaml
services:
  postgres, redis, api (NestJS), web (Next.js), nginx (reverse proxy)
```

**Lý do:** Đảm bảo mọi developer có environment giống nhau, không "works on my machine"

#### Production: Railway hoặc Render (MVP) → AWS/GCP (Scale)

**Lý do chọn Railway cho MVP:**
- Deploy từ GitHub push, không cần DevOps chuyên sâu
- Managed PostgreSQL, Redis built-in
- Free tier đủ cho demo, paid plan hợp lý ($20-50/month)
- Khi cần scale → containerize và chuyển sang ECS/Cloud Run

#### CI/CD: GitHub Actions

- Lint + Type Check → Unit Tests → Build → Deploy to staging on PR
- Deploy to production on merge to main

#### Monitoring: Sentry (errors) + Axiom (logs) + Uptime Robot (uptime)

**Lý do:** Ba tools miễn phí/rất rẻ ở quy mô MVP, đủ visibility mà không cần ELK stack phức tạp

---

## 2. System Architecture

### 2.1 Kiến Trúc Tổng Quan: Modular Monolith

**Quyết định: Modular Monolith thay vì Microservices**

**Lý do:**
- Team 3-5 người không đủ resource vận hành microservices (service discovery, distributed tracing, network latency...)
- Modular monolith cho phép tách thành microservices sau khi biết rõ domain boundaries
- Deploy đơn giản hơn, debugging dễ hơn
- Distributed transactions (tồn kho + đơn hàng) phức tạp hơn nhiều trong microservices

```
┌─────────────────────────────────────────────────────────────────────┐
│                        MODULAR MONOLITH                              │
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │
│  │  AuthModule  │  │ProductModule │  │  OrderModule │               │
│  └──────────────┘  └──────────────┘  └──────────────┘               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │
│  │InventoryMod  │  │CustomerModule│  │ ReportModule │               │
│  └──────────────┘  └──────────────┘  └──────────────┘               │
│  ┌──────────────┐  ┌──────────────┐                                  │
│  │  StoreModule │  │  UserModule  │                                  │
│  └──────────────┘  └──────────────┘                                  │
│                                                                       │
│  Shared: DatabaseModule, StorageModule, NotificationModule           │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Sơ Đồ Kiến Trúc Tổng Thể

```
                          ┌──────────────────────────────────┐
                          │          CLIENTS                  │
                          │  Browser (Next.js)  │  Mobile PWA │
                          └──────────────┬───────────────────┘
                                         │ HTTPS
                          ┌──────────────▼───────────────────┐
                          │         Cloudflare CDN            │
                          │    (Static assets, DDoS protect)  │
                          └──────────────┬───────────────────┘
                                         │
                    ┌────────────────────▼───────────────────────┐
                    │              NEXT.JS SERVER                 │
                    │  - App Router (RSC + Client Components)     │
                    │  - API Routes (minimal, proxy to NestJS)    │
                    │  - Image Optimization                       │
                    └────────────────────┬───────────────────────┘
                                         │ Internal HTTP
                    ┌────────────────────▼───────────────────────┐
                    │            NESTJS API SERVER                │
                    │                                            │
                    │  ┌─────────────────────────────────────┐  │
                    │  │         API Gateway Layer            │  │
                    │  │  Auth Guard │ Rate Limit │ Validation│  │
                    │  └─────────────────────────────────────┘  │
                    │                                            │
                    │  ┌──────────┐ ┌──────────┐ ┌──────────┐  │
                    │  │  Product │ │  Order   │ │Inventory │  │
                    │  │  Module  │ │  Module  │ │  Module  │  │
                    │  └──────────┘ └──────────┘ └──────────┘  │
                    │  ┌──────────┐ ┌──────────┐ ┌──────────┐  │
                    │  │Customer  │ │  Report  │ │   Auth   │  │
                    │  │  Module  │ │  Module  │ │  Module  │  │
                    │  └──────────┘ └──────────┘ └──────────┘  │
                    └────────────┬─────────────────────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
    ┌─────────▼──────┐  ┌────────▼───────┐  ┌──────▼──────────┐
    │  PostgreSQL 16 │  │   Redis 7      │  │  Cloudflare R2  │
    │  (Primary DB)  │  │  (Cache/Queue) │  │  (File Storage) │
    └────────────────┘  └────────────────┘  └─────────────────┘
```

### 2.3 Authentication & Authorization Flow

```
[Client]                    [NestJS API]                 [Redis]    [PostgreSQL]
   │                              │                          │            │
   │── POST /auth/login ─────────►│                          │            │
   │   {email, password}          │── validate credentials ──────────────►│
   │                              │◄─ user record ───────────────────────│
   │                              │                          │            │
   │                              │── store refresh token ──►│            │
   │                              │   (key: rt:{userId})     │            │
   │                              │   (TTL: 30 days)         │            │
   │                              │                          │            │
   │◄── 200 OK ──────────────────│                          │            │
   │    {accessToken (15min),     │                          │            │
   │     refreshToken (30d)}      │                          │            │
   │                              │                          │            │
   │── GET /api/v1/orders ───────►│                          │            │
   │   Authorization: Bearer {AT} │                          │            │
   │                              │── verify JWT signature   │            │
   │                              │── check exp              │            │
   │                              │── check role/permissions │            │
   │◄── 200 OK ──────────────────│                          │            │
   │                              │                          │            │
   │   [AT expires]               │                          │            │
   │── POST /auth/refresh ───────►│                          │            │
   │   {refreshToken}             │── check RT in Redis ────►│            │
   │                              │◄─ valid ────────────────│            │
   │                              │── rotate: delete old RT ►│            │
   │                              │── store new RT ─────────►│            │
   │◄── 200 OK ──────────────────│                          │            │
   │    {newAccessToken,          │                          │            │
   │     newRefreshToken}         │                          │            │
```

### 2.4 File Upload Strategy

```
[Client]                    [NestJS API]              [Cloudflare R2]
   │                              │                          │
   │── POST /uploads/presign ────►│                          │
   │   {filename, contentType}    │── generate presigned URL►│
   │                              │◄─ presigned URL ─────────│
   │◄── {uploadUrl, fileKey} ────│                          │
   │                              │                          │
   │── PUT {uploadUrl} ──────────────────────────────────►  │
   │   (file binary, direct)      │                          │
   │◄── 200 OK ──────────────────────────────────────────── │
   │                              │                          │
   │── POST /products ───────────►│                          │
   │   {imageKeys: ["key1",...]}  │── store keys in DB       │
   │◄── 201 Created ─────────────│                          │
```

**Lý do dùng presigned URL (client upload trực tiếp lên R2):**
- Không tốn bandwidth của API server
- API server không bị block bởi file upload lớn
- R2 xử lý multipart upload tốt hơn

### 2.5 Caching Strategy

| Layer | Technology | TTL | Dữ liệu cache |
|---|---|---|---|
| HTTP Cache | Cache-Control headers | 1 năm | Static assets (CSS, JS, images) |
| CDN | Cloudflare | 1 giờ | Product images |
| Application | Redis | 5 phút | Dashboard aggregations |
| Application | Redis | 15 phút | Report data |
| Application | Redis | 1 giờ | Category list, Store settings |
| Client | TanStack Query | 30 giây | Product list (stale-while-revalidate) |
| Client | TanStack Query | 10 giây | Dashboard stats |

**Cache invalidation rules:**
- Khi tạo/sửa/xóa order → invalidate dashboard cache của store đó
- Khi cập nhật inventory → invalidate product inventory cache
- Khi sửa category → invalidate category list cache

---

## 3. Database Design

### 3.1 Nguyên Tắc Thiết Kế

- **UUID v7** cho primary keys (time-sortable, phù hợp index B-tree hơn random UUID v4)
- **Soft delete** với `deleted_at TIMESTAMPTZ` cho orders, products, customers (audit trail)
- **Optimistic locking** với `version INTEGER` cho bảng inventory (tránh race condition)
- **Audit columns** `created_at`, `updated_at`, `created_by` trên tất cả bảng quan trọng
- **Multi-tenancy** theo `store_id` — mỗi store là một tenant độc lập

### 3.2 ERD Text Description

```
stores (1) ──────────────── (N) users
stores (1) ──────────────── (N) products
stores (1) ──────────────── (N) categories
stores (1) ──────────────── (N) orders
stores (1) ──────────────── (N) customers
stores (1) ──────────────── (N) suppliers
stores (1) ──────────────── (N) inventory

products (1) ─────────────── (N) product_variants
products (1) ─────────────── (N) product_images
products (1) ─────────────── (1) inventory (per store)
products (N) ─────────────── (1) categories

product_variants (1) ──────── (N) inventory (per variant per store)
product_variants (1) ──────── (N) order_items

orders (1) ────────────────── (N) order_items
orders (1) ────────────────── (N) payments
orders (N) ────────────────── (1) customers (nullable)
orders (N) ────────────────── (1) users (created_by)

inventory (1) ─────────────── (N) inventory_transactions
inventory_transactions (N) ── (1) users (performed_by)

suppliers (1) ─────────────── (N) inventory_transactions (type=purchase)

roles (1) ─────────────────── (N) users
roles (N) ─────────────────── (N) permissions  [role_permissions]
```

### 3.3 Chi Tiết Các Bảng

---

#### Bảng: `stores`

```sql
CREATE TABLE stores (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(255) NOT NULL,
  slug            VARCHAR(255) NOT NULL UNIQUE,
  phone           VARCHAR(20),
  email           VARCHAR(255),
  address         TEXT,
  city            VARCHAR(100),
  district        VARCHAR(100),
  logo_url        TEXT,
  tax_code        VARCHAR(20),                    -- Mã số thuế
  invoice_prefix  VARCHAR(10) DEFAULT 'HD',       -- Prefix hóa đơn
  invoice_counter INTEGER NOT NULL DEFAULT 0,     -- Số hóa đơn tăng dần
  currency        VARCHAR(3) NOT NULL DEFAULT 'VND',
  timezone        VARCHAR(50) NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
  settings        JSONB NOT NULL DEFAULT '{}',    -- Cài đặt linh hoạt (in hóa đơn, ngưỡng cảnh báo...)
  plan            VARCHAR(20) NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'pro', 'enterprise')),
  plan_expires_at TIMESTAMPTZ,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_stores_slug ON stores(slug);
```

**settings JSONB example:**
```json
{
  "low_stock_threshold": 5,
  "receipt_footer": "Cảm ơn quý khách!",
  "receipt_show_logo": true,
  "allow_negative_inventory": false,
  "require_customer_on_order": false,
  "max_discount_percent": 30,
  "shift_management_enabled": false
}
```

---

#### Bảng: `users`

```sql
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id        UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  role_id         UUID NOT NULL REFERENCES roles(id),
  email           VARCHAR(255),
  phone           VARCHAR(20),
  password_hash   VARCHAR(255),                   -- NULL nếu dùng PIN login
  pin_hash        VARCHAR(255),                   -- 4-6 số, hash bcrypt
  full_name       VARCHAR(255) NOT NULL,
  avatar_url      TEXT,
  is_owner        BOOLEAN NOT NULL DEFAULT false, -- Chủ cửa hàng (không thể xóa)
  is_active       BOOLEAN NOT NULL DEFAULT true,
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ,

  CONSTRAINT users_email_store_unique UNIQUE (email, store_id),
  CONSTRAINT users_phone_store_unique UNIQUE (phone, store_id),
  CONSTRAINT users_contact_required CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

CREATE INDEX idx_users_store_id ON users(store_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_phone ON users(phone) WHERE deleted_at IS NULL;
```

---

#### Bảng: `roles`

```sql
CREATE TABLE roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id    UUID REFERENCES stores(id) ON DELETE CASCADE, -- NULL = system role
  name        VARCHAR(50) NOT NULL,
  slug        VARCHAR(50) NOT NULL,               -- 'owner', 'manager', 'cashier', 'warehouse'
  description TEXT,
  is_system   BOOLEAN NOT NULL DEFAULT false,     -- System roles không thể xóa
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT roles_slug_store_unique UNIQUE (slug, store_id)
);

-- Seed data
INSERT INTO roles (id, name, slug, is_system) VALUES
  ('...', 'Chủ cửa hàng', 'owner', true),
  ('...', 'Quản lý', 'manager', true),
  ('...', 'Thu ngân', 'cashier', true),
  ('...', 'Nhân viên kho', 'warehouse', true);
```

---

#### Bảng: `permissions`

```sql
CREATE TABLE permissions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module      VARCHAR(50) NOT NULL,               -- 'products', 'orders', 'inventory', 'reports', 'settings'
  action      VARCHAR(50) NOT NULL,               -- 'view', 'create', 'update', 'delete', 'export'
  slug        VARCHAR(100) NOT NULL UNIQUE,       -- 'products:view', 'orders:delete', 'reports:export'
  description VARCHAR(255),

  CONSTRAINT permissions_module_action_unique UNIQUE (module, action)
);

-- Ví dụ permissions
INSERT INTO permissions (module, action, slug) VALUES
  ('products', 'view', 'products:view'),
  ('products', 'create', 'products:create'),
  ('products', 'update', 'products:update'),
  ('products', 'delete', 'products:delete'),
  ('products', 'view_cost', 'products:view_cost'),   -- Xem giá vốn
  ('orders', 'view', 'orders:view'),
  ('orders', 'create', 'orders:create'),
  ('orders', 'cancel', 'orders:cancel'),
  ('orders', 'refund', 'orders:refund'),
  ('orders', 'apply_discount', 'orders:apply_discount'),
  ('inventory', 'view', 'inventory:view'),
  ('inventory', 'adjust', 'inventory:adjust'),
  ('inventory', 'purchase', 'inventory:purchase'),
  ('reports', 'view', 'reports:view'),
  ('reports', 'export', 'reports:export'),
  ('reports', 'view_profit', 'reports:view_profit'),
  ('customers', 'view', 'customers:view'),
  ('customers', 'create', 'customers:create'),
  ('customers', 'update', 'customers:update'),
  ('settings', 'view', 'settings:view'),
  ('settings', 'update', 'settings:update'),
  ('staff', 'view', 'staff:view'),
  ('staff', 'manage', 'staff:manage');
```

---

#### Bảng: `role_permissions`

```sql
CREATE TABLE role_permissions (
  role_id       UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);
```

---

#### Bảng: `categories`

```sql
CREATE TABLE categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id    UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  parent_id   UUID REFERENCES categories(id) ON DELETE SET NULL,  -- Tối đa 2 cấp
  name        VARCHAR(255) NOT NULL,
  slug        VARCHAR(255) NOT NULL,
  image_url   TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT categories_slug_store_unique UNIQUE (slug, store_id),
  CONSTRAINT categories_max_depth CHECK (
    parent_id IS NULL OR
    (SELECT parent_id FROM categories p WHERE p.id = categories.parent_id) IS NULL
  )
);

CREATE INDEX idx_categories_store_id ON categories(store_id);
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
```

---

#### Bảng: `products`

```sql
CREATE TABLE products (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id             UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  category_id          UUID REFERENCES categories(id) ON DELETE SET NULL,
  name                 VARCHAR(500) NOT NULL,
  slug                 VARCHAR(500) NOT NULL,
  description          TEXT,
  sku                  VARCHAR(100),                -- SKU của sản phẩm gốc (không biến thể)
  barcode              VARCHAR(100),
  unit                 VARCHAR(50),                 -- cái, hộp, kg, lít...
  has_variants         BOOLEAN NOT NULL DEFAULT false,
  -- Giá và tồn kho (dùng khi không có variants)
  price                NUMERIC(15,0),              -- Giá bán (VND, không cần thập phân)
  compare_price        NUMERIC(15,0),              -- Giá gốc (để hiển thị giảm giá)
  cost_price           NUMERIC(15,0),              -- Giá vốn (chỉ owner/manager xem)
  -- Trạng thái
  status               VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  is_pos_visible       BOOLEAN NOT NULL DEFAULT true,
  -- Metadata
  tags                 TEXT[],
  attributes           JSONB NOT NULL DEFAULT '{}', -- {"brand": "Nike", "material": "Cotton"}
  -- Search
  search_vector        TSVECTOR,                   -- PostgreSQL full-text search
  -- Audit
  created_by           UUID REFERENCES users(id),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at           TIMESTAMPTZ,

  CONSTRAINT products_slug_store_unique UNIQUE (slug, store_id),
  CONSTRAINT products_sku_store_unique UNIQUE (sku, store_id),
  CONSTRAINT products_barcode_store_unique UNIQUE (barcode, store_id)
);

CREATE INDEX idx_products_store_id ON products(store_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_category_id ON products(category_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_status ON products(store_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_search ON products USING GIN(search_vector);
CREATE INDEX idx_products_tags ON products USING GIN(tags);
CREATE INDEX idx_products_barcode ON products(barcode, store_id) WHERE deleted_at IS NULL;

-- Trigger để cập nhật search_vector
CREATE OR REPLACE FUNCTION update_product_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('simple',
    COALESCE(NEW.name, '') || ' ' ||
    COALESCE(NEW.sku, '') || ' ' ||
    COALESCE(NEW.barcode, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_search_vector_trigger
BEFORE INSERT OR UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION update_product_search_vector();
```

---

#### Bảng: `product_variants`

```sql
CREATE TABLE product_variants (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  store_id      UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name          VARCHAR(255) NOT NULL,             -- "Đỏ / M", "Xanh / L"
  sku           VARCHAR(100),
  barcode       VARCHAR(100),
  price         NUMERIC(15,0) NOT NULL,
  compare_price NUMERIC(15,0),
  cost_price    NUMERIC(15,0),
  attributes    JSONB NOT NULL DEFAULT '{}',        -- {"color": "Đỏ", "size": "M"}
  image_url     TEXT,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT variants_sku_store_unique UNIQUE (sku, store_id),
  CONSTRAINT variants_barcode_store_unique UNIQUE (barcode, store_id)
);

CREATE INDEX idx_variants_product_id ON product_variants(product_id);
CREATE INDEX idx_variants_store_id ON product_variants(store_id);
CREATE INDEX idx_variants_barcode ON product_variants(barcode, store_id);
```

---

#### Bảng: `product_images`

```sql
CREATE TABLE product_images (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  storage_key TEXT NOT NULL,                       -- R2 object key
  alt_text    VARCHAR(255),
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_primary  BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_product_images_product_id ON product_images(product_id);
```

---

#### Bảng: `inventory`

```sql
CREATE TABLE inventory (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id          UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  product_id        UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id        UUID REFERENCES product_variants(id) ON DELETE CASCADE,
  quantity          INTEGER NOT NULL DEFAULT 0,
  reserved_quantity INTEGER NOT NULL DEFAULT 0,    -- Đang chờ xử lý trong đơn
  low_stock_alert   INTEGER NOT NULL DEFAULT 5,    -- Ngưỡng cảnh báo
  version           INTEGER NOT NULL DEFAULT 0,    -- Optimistic locking
  last_counted_at   TIMESTAMPTZ,                   -- Lần cuối kiểm kê
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- available_quantity = quantity - reserved_quantity
  CONSTRAINT inventory_quantity_non_negative CHECK (quantity >= 0),

  CONSTRAINT inventory_product_variant_store_unique
    UNIQUE (store_id, product_id, variant_id)
);

CREATE INDEX idx_inventory_store_product ON inventory(store_id, product_id);
CREATE INDEX idx_inventory_low_stock ON inventory(store_id, quantity, low_stock_alert)
  WHERE quantity <= low_stock_alert;
```

---

#### Bảng: `inventory_transactions`

```sql
CREATE TABLE inventory_transactions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id          UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  inventory_id      UUID NOT NULL REFERENCES inventory(id),
  product_id        UUID NOT NULL REFERENCES products(id),
  variant_id        UUID REFERENCES product_variants(id),
  type              VARCHAR(30) NOT NULL CHECK (type IN (
    'purchase',         -- Nhập hàng từ NCC
    'sale',             -- Bán hàng (tự động từ order)
    'return_in',        -- Nhận hàng trả lại
    'return_out',       -- Xuất hàng đổi trả
    'adjustment_in',    -- Điều chỉnh tăng
    'adjustment_out',   -- Điều chỉnh giảm
    'transfer_in',      -- Nhận từ kho khác
    'transfer_out',     -- Xuất sang kho khác
    'damage',           -- Hàng hỏng
    'stocktake'         -- Kiểm kê điều chỉnh
  )),
  quantity_change   INTEGER NOT NULL,              -- Dương = nhập, Âm = xuất
  quantity_before   INTEGER NOT NULL,
  quantity_after    INTEGER NOT NULL,
  unit_cost         NUMERIC(15,0),                 -- Giá vốn tại thời điểm giao dịch
  reference_type    VARCHAR(50),                   -- 'order', 'purchase_order', 'adjustment'
  reference_id      UUID,                          -- ID của đơn hàng/phiếu nhập liên quan
  notes             TEXT,
  performed_by      UUID REFERENCES users(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_inv_transactions_store ON inventory_transactions(store_id);
CREATE INDEX idx_inv_transactions_inventory ON inventory_transactions(inventory_id);
CREATE INDEX idx_inv_transactions_reference ON inventory_transactions(reference_type, reference_id);
CREATE INDEX idx_inv_transactions_created ON inventory_transactions(store_id, created_at DESC);
```

---

#### Bảng: `suppliers`

```sql
CREATE TABLE suppliers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id        UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name            VARCHAR(255) NOT NULL,
  code            VARCHAR(50),
  phone           VARCHAR(20),
  email           VARCHAR(255),
  address         TEXT,
  contact_person  VARCHAR(255),
  tax_code        VARCHAR(20),
  payment_terms   INTEGER DEFAULT 0,               -- Số ngày thanh toán (0 = ngay)
  notes           TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ,

  CONSTRAINT suppliers_code_store_unique UNIQUE (code, store_id)
);

CREATE INDEX idx_suppliers_store_id ON suppliers(store_id) WHERE deleted_at IS NULL;
```

---

#### Bảng: `customers`

```sql
CREATE TABLE customers (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id          UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  code              VARCHAR(50),                   -- Mã khách hàng (KH-001)
  full_name         VARCHAR(255) NOT NULL,
  phone             VARCHAR(20),
  email             VARCHAR(255),
  date_of_birth     DATE,
  gender            VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
  address           TEXT,
  city              VARCHAR(100),
  district          VARCHAR(100),
  -- Thống kê (denormalized cho performance)
  total_orders      INTEGER NOT NULL DEFAULT 0,
  total_spent       NUMERIC(15,0) NOT NULL DEFAULT 0,
  last_order_at     TIMESTAMPTZ,
  -- Phân nhóm
  group_id          UUID REFERENCES customer_groups(id) ON DELETE SET NULL,
  loyalty_points    INTEGER NOT NULL DEFAULT 0,
  -- Nợ
  debt_amount       NUMERIC(15,0) NOT NULL DEFAULT 0,
  -- Metadata
  tags              TEXT[],
  notes             TEXT,
  source            VARCHAR(50) DEFAULT 'manual', -- 'manual', 'pos', 'shopee', 'import'
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ,

  CONSTRAINT customers_phone_store_unique UNIQUE (phone, store_id),
  CONSTRAINT customers_code_store_unique UNIQUE (code, store_id)
);

CREATE INDEX idx_customers_store_id ON customers(store_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_customers_phone ON customers(phone, store_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_customers_name ON customers USING GIN(to_tsvector('simple', full_name));
```

---

#### Bảng: `customer_groups`

```sql
CREATE TABLE customer_groups (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id    UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name        VARCHAR(100) NOT NULL,
  description TEXT,
  discount_type    VARCHAR(20) CHECK (discount_type IN ('percent', 'fixed', 'none')),
  discount_value   NUMERIC(15,2) DEFAULT 0,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

#### Bảng: `orders`

```sql
CREATE TABLE orders (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id          UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  code              VARCHAR(50) NOT NULL,           -- DH-2026-00001
  customer_id       UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_snapshot JSONB,                          -- Lưu thông tin KH tại thời điểm đặt
  channel           VARCHAR(30) NOT NULL DEFAULT 'pos' CHECK (channel IN (
    'pos', 'manual', 'shopee', 'lazada', 'tiktok', 'facebook', 'website', 'other'
  )),
  channel_order_id  VARCHAR(255),                   -- Mã đơn gốc trên sàn TMĐT
  status            VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN (
    'draft',
    'pending',        -- Chờ xử lý
    'confirmed',      -- Đã xác nhận
    'processing',     -- Đang xử lý / đóng gói
    'shipping',       -- Đang giao
    'completed',      -- Hoàn thành
    'cancelled',      -- Đã hủy
    'refunded'        -- Đã hoàn tiền
  )),
  -- Giá trị đơn hàng
  subtotal          NUMERIC(15,0) NOT NULL DEFAULT 0,   -- Tổng trước giảm giá
  discount_amount   NUMERIC(15,0) NOT NULL DEFAULT 0,
  discount_type     VARCHAR(20) CHECK (discount_type IN ('percent', 'fixed')),
  discount_reason   VARCHAR(255),
  shipping_fee      NUMERIC(15,0) NOT NULL DEFAULT 0,
  total_amount      NUMERIC(15,0) NOT NULL DEFAULT 0,   -- Tổng sau giảm giá + ship
  paid_amount       NUMERIC(15,0) NOT NULL DEFAULT 0,
  -- Thông tin giao hàng
  shipping_address  JSONB,
  shipping_provider VARCHAR(50),                    -- 'ghn', 'ghtk', 'customer_pickup'
  shipping_code     VARCHAR(100),                   -- Mã vận đơn
  -- Thông tin promotion
  promotion_id      UUID REFERENCES promotions(id) ON DELETE SET NULL,
  coupon_code       VARCHAR(50),
  -- Ghi chú
  customer_note     TEXT,
  internal_note     TEXT,
  -- Audit
  created_by        UUID REFERENCES users(id),
  confirmed_by      UUID REFERENCES users(id),
  cancelled_by      UUID REFERENCES users(id),
  cancelled_reason  TEXT,
  completed_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ,

  CONSTRAINT orders_code_store_unique UNIQUE (code, store_id)
);

CREATE INDEX idx_orders_store_id ON orders(store_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_orders_customer_id ON orders(customer_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_orders_status ON orders(store_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_orders_created_at ON orders(store_id, created_at DESC);
CREATE INDEX idx_orders_channel ON orders(store_id, channel) WHERE deleted_at IS NULL;
CREATE INDEX idx_orders_code ON orders(code, store_id);
```

---

#### Bảng: `order_items`

```sql
CREATE TABLE order_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id        UUID NOT NULL REFERENCES products(id),
  variant_id        UUID REFERENCES product_variants(id),
  -- Snapshot tại thời điểm đặt hàng (không thay đổi khi sửa sản phẩm)
  product_snapshot  JSONB NOT NULL,                 -- {name, sku, image_url}
  -- Giá
  unit_price        NUMERIC(15,0) NOT NULL,         -- Giá bán tại thời điểm bán
  unit_cost         NUMERIC(15,0),                  -- Giá vốn tại thời điểm bán
  quantity          INTEGER NOT NULL CHECK (quantity > 0),
  discount_amount   NUMERIC(15,0) NOT NULL DEFAULT 0,
  line_total        NUMERIC(15,0) NOT NULL,         -- (unit_price * quantity) - discount
  -- Đổi trả
  returned_quantity INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
```

---

#### Bảng: `payments`

```sql
CREATE TABLE payments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  store_id          UUID NOT NULL REFERENCES stores(id),
  method            VARCHAR(30) NOT NULL CHECK (method IN (
    'cash', 'bank_transfer', 'credit_card', 'debit_card',
    'momo', 'zalopay', 'vnpay', 'debt', 'other'
  )),
  amount            NUMERIC(15,0) NOT NULL,
  status            VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'completed', 'failed', 'refunded'
  )),
  reference_code    VARCHAR(255),                   -- Mã giao dịch từ cổng thanh toán
  gateway_response  JSONB,                          -- Raw response từ payment gateway
  notes             TEXT,
  processed_by      UUID REFERENCES users(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_store_id ON payments(store_id, created_at DESC);
```

---

#### Bảng: `promotions`

```sql
CREATE TABLE promotions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id          UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name              VARCHAR(255) NOT NULL,
  type              VARCHAR(30) NOT NULL CHECK (type IN (
    'percent_discount',    -- Giảm %
    'fixed_discount',      -- Giảm số tiền cố định
    'buy_x_get_y',         -- Mua X tặng Y
    'free_shipping'
  )),
  value             NUMERIC(15,2) NOT NULL DEFAULT 0,
  min_order_amount  NUMERIC(15,0) DEFAULT 0,        -- Đơn tối thiểu
  max_discount      NUMERIC(15,0),                  -- Giảm tối đa (cho type percent)
  applies_to        VARCHAR(20) NOT NULL DEFAULT 'all' CHECK (applies_to IN (
    'all', 'specific_products', 'specific_categories'
  )),
  product_ids       UUID[],                         -- Áp dụng cho sản phẩm cụ thể
  category_ids      UUID[],
  usage_limit       INTEGER,                        -- Giới hạn số lần dùng
  usage_count       INTEGER NOT NULL DEFAULT 0,
  usage_per_customer INTEGER DEFAULT 1,
  starts_at         TIMESTAMPTZ NOT NULL,
  ends_at           TIMESTAMPTZ,
  is_active         BOOLEAN NOT NULL DEFAULT true,
  created_by        UUID REFERENCES users(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_promotions_store_active ON promotions(store_id, is_active, starts_at, ends_at);
```

---

#### Bảng: `coupons`

```sql
CREATE TABLE coupons (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id      UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
  store_id          UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  code              VARCHAR(50) NOT NULL,
  usage_limit       INTEGER DEFAULT 1,
  usage_count       INTEGER NOT NULL DEFAULT 0,
  is_active         BOOLEAN NOT NULL DEFAULT true,
  expires_at        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT coupons_code_store_unique UNIQUE (code, store_id)
);

CREATE INDEX idx_coupons_code ON coupons(code, store_id);
```

---

#### Bảng: `shifts` (Quản lý ca)

```sql
CREATE TABLE shifts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id        UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  opened_by       UUID NOT NULL REFERENCES users(id),
  closed_by       UUID REFERENCES users(id),
  opening_cash    NUMERIC(15,0) NOT NULL DEFAULT 0,  -- Tiền mặt đầu ca
  closing_cash    NUMERIC(15,0),                      -- Tiền mặt cuối ca (nhân viên đếm)
  expected_cash   NUMERIC(15,0),                      -- Tiền mặt kỳ vọng (tính từ giao dịch)
  cash_difference NUMERIC(15,0),                      -- Chênh lệch
  total_orders    INTEGER NOT NULL DEFAULT 0,
  total_revenue   NUMERIC(15,0) NOT NULL DEFAULT 0,
  notes           TEXT,
  opened_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at       TIMESTAMPTZ,
  status          VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed'))
);

CREATE INDEX idx_shifts_store_id ON shifts(store_id, status);
CREATE INDEX idx_shifts_opened_by ON shifts(opened_by);
```

---

#### Bảng: `activity_logs`

```sql
CREATE TABLE activity_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id      UUID NOT NULL REFERENCES stores(id),
  user_id       UUID REFERENCES users(id),
  action        VARCHAR(100) NOT NULL,              -- 'order.created', 'product.deleted'
  entity_type   VARCHAR(50),                        -- 'order', 'product', 'customer'
  entity_id     UUID,
  old_values    JSONB,
  new_values    JSONB,
  ip_address    INET,
  user_agent    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activity_logs_store ON activity_logs(store_id, created_at DESC);
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id, created_at DESC);
CREATE INDEX idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
```

---

#### Bảng: `refresh_tokens` (hoặc dùng Redis)

```sql
-- Dùng bảng này khi cần audit trail refresh token, otherwise dùng Redis
CREATE TABLE refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  VARCHAR(255) NOT NULL UNIQUE,         -- Hash của refresh token
  device_info JSONB,                                -- {device, browser, os}
  ip_address  INET,
  expires_at  TIMESTAMPTZ NOT NULL,
  revoked_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash);
```

---

### 3.4 Indexes Strategy Tổng Hợp

**Nguyên tắc:**
1. Index tất cả foreign keys
2. Index các column thường dùng trong WHERE (store_id, status, created_at)
3. Partial index với `WHERE deleted_at IS NULL` để bỏ bản ghi đã xóa
4. GIN index cho JSONB, full-text search, array columns
5. Composite index theo thứ tự: cột có cardinality cao nhất → cột lọc phổ biến nhất

**Composite indexes quan trọng:**
```sql
-- Truy vấn đơn hàng theo store + ngày (dashboard, reports)
CREATE INDEX idx_orders_store_date ON orders(store_id, created_at DESC) WHERE deleted_at IS NULL;

-- Truy vấn inventory thấp
CREATE INDEX idx_inventory_low ON inventory(store_id) WHERE quantity <= low_stock_alert;

-- Tìm kiếm sản phẩm trong POS
CREATE INDEX idx_products_pos ON products(store_id, is_pos_visible, status) WHERE deleted_at IS NULL;
```

---

## 4. API Specification

### 4.1 Conventions

**Base URL:** `/api/v1`

**Pagination:**
```
GET /api/v1/products?page=1&limit=20&sort=created_at&order=desc

Response:
{
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 248,
    "total_pages": 13
  }
}
```

**Filtering:**
```
GET /api/v1/orders?status=pending&channel=pos&from_date=2026-04-01&to_date=2026-04-02
GET /api/v1/products?category_id=uuid&min_price=50000&max_price=500000&has_variants=true
```

**Error Response Format:**
```json
{
  "success": false,
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "Không tìm thấy sản phẩm",
    "details": null
  },
  "timestamp": "2026-04-02T07:30:00Z"
}
```

**Success Response Format:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Thao tác thành công"
}
```

**HTTP Status Codes:**
- `200 OK` — GET, PUT/PATCH thành công
- `201 Created` — POST tạo resource
- `204 No Content` — DELETE thành công
- `400 Bad Request` — Validation error
- `401 Unauthorized` — Chưa đăng nhập hoặc token hết hạn
- `403 Forbidden` — Không có quyền
- `404 Not Found` — Resource không tồn tại
- `409 Conflict` — Duplicate (SKU đã tồn tại...)
- `422 Unprocessable Entity` — Business logic error
- `429 Too Many Requests` — Rate limit
- `500 Internal Server Error`

---

### 4.2 Module: Auth

```
POST   /api/v1/auth/register              - Đăng ký tài khoản + tạo store
POST   /api/v1/auth/login                 - Đăng nhập bằng email/password
POST   /api/v1/auth/login/pin             - Đăng nhập bằng PIN (nhân viên tại quầy)
POST   /api/v1/auth/refresh               - Refresh access token
POST   /api/v1/auth/logout                - Đăng xuất (revoke refresh token)
POST   /api/v1/auth/logout/all            - Đăng xuất khỏi tất cả thiết bị
POST   /api/v1/auth/forgot-password       - Gửi email reset password
POST   /api/v1/auth/reset-password        - Đặt lại mật khẩu mới
POST   /api/v1/auth/change-password       - Đổi mật khẩu (cần current password)
GET    /api/v1/auth/me                    - Lấy thông tin user hiện tại
```

**POST /api/v1/auth/register Request:**
```json
{
  "full_name": "Nguyễn Thị Lan",
  "email": "lan@example.com",
  "password": "Password123!",
  "phone": "0901234567",
  "store_name": "Cửa hàng Thời Trang Lan"
}
```

**POST /api/v1/auth/login Response:**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJ...",
    "refresh_token": "eyJ...",
    "expires_in": 900,
    "user": {
      "id": "uuid",
      "full_name": "Nguyễn Thị Lan",
      "email": "lan@example.com",
      "role": "owner",
      "permissions": ["products:view", "products:create", ...],
      "store": {
        "id": "uuid",
        "name": "Cửa hàng Thời Trang Lan",
        "plan": "free"
      }
    }
  }
}
```

---

### 4.3 Module: Store & Settings

```
GET    /api/v1/store                      - Lấy thông tin cửa hàng hiện tại
PATCH  /api/v1/store                      - Cập nhật thông tin cửa hàng
PATCH  /api/v1/store/settings             - Cập nhật cài đặt (settings JSONB)
POST   /api/v1/store/logo                 - Upload logo cửa hàng
GET    /api/v1/store/plan                 - Xem gói dịch vụ và usage
```

---

### 4.4 Module: Users & Staff

```
GET    /api/v1/users                      - Danh sách nhân viên (phân trang)
POST   /api/v1/users                      - Thêm nhân viên mới
GET    /api/v1/users/:id                  - Chi tiết nhân viên
PATCH  /api/v1/users/:id                  - Cập nhật nhân viên
DELETE /api/v1/users/:id                  - Xóa nhân viên (soft delete)
PATCH  /api/v1/users/:id/role             - Đổi vai trò nhân viên
PATCH  /api/v1/users/:id/pin              - Đặt/đổi PIN
PATCH  /api/v1/users/:id/status           - Kích hoạt/vô hiệu hóa

GET    /api/v1/roles                      - Danh sách vai trò
GET    /api/v1/roles/:id/permissions      - Quyền của một vai trò
PATCH  /api/v1/roles/:id/permissions      - Cập nhật quyền (custom role)

GET    /api/v1/permissions                - Tất cả permissions
```

---

### 4.5 Module: Categories

```
GET    /api/v1/categories                 - Danh sách danh mục (tree structure)
POST   /api/v1/categories                 - Tạo danh mục mới
GET    /api/v1/categories/:id             - Chi tiết danh mục
PATCH  /api/v1/categories/:id             - Cập nhật danh mục
DELETE /api/v1/categories/:id             - Xóa danh mục
PATCH  /api/v1/categories/reorder         - Sắp xếp lại thứ tự danh mục
```

**GET /api/v1/categories Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Áo",
      "slug": "ao",
      "image_url": null,
      "product_count": 45,
      "children": [
        { "id": "uuid", "name": "Áo sơ mi", "product_count": 20 },
        { "id": "uuid", "name": "Áo thun", "product_count": 25 }
      ]
    }
  ]
}
```

---

### 4.6 Module: Products

```
GET    /api/v1/products                   - Danh sách sản phẩm (phân trang, lọc, tìm kiếm)
POST   /api/v1/products                   - Tạo sản phẩm mới
GET    /api/v1/products/:id               - Chi tiết sản phẩm
PATCH  /api/v1/products/:id               - Cập nhật sản phẩm
DELETE /api/v1/products/:id               - Xóa sản phẩm (soft delete)

GET    /api/v1/products/:id/variants      - Danh sách biến thể
POST   /api/v1/products/:id/variants      - Thêm biến thể
PATCH  /api/v1/products/:id/variants/:variantId  - Cập nhật biến thể
DELETE /api/v1/products/:id/variants/:variantId  - Xóa biến thể

POST   /api/v1/products/:id/images        - Upload ảnh sản phẩm
DELETE /api/v1/products/:id/images/:imageId      - Xóa ảnh
PATCH  /api/v1/products/:id/images/reorder       - Sắp xếp ảnh

GET    /api/v1/products/search            - Tìm kiếm nhanh (dùng trong POS)
GET    /api/v1/products/barcode/:barcode  - Tìm theo barcode (quét mã)

POST   /api/v1/products/import            - Import từ Excel
GET    /api/v1/products/export            - Export ra Excel
GET    /api/v1/products/import/template   - Download template Excel
```

**GET /api/v1/products Query Params:**
```
?page=1&limit=20
&search=váy hoa         (tìm kiếm text)
&category_id=uuid
&status=active          (active|inactive|archived)
&has_variants=true
&low_stock=true         (chỉ sản phẩm sắp hết)
&out_of_stock=true
&sort=name|price|created_at|updated_at|stock
&order=asc|desc
```

**POST /api/v1/products Request:**
```json
{
  "name": "Váy hoa nhí đỏ",
  "category_id": "uuid",
  "description": "Váy hoa nhí màu đỏ tươi...",
  "unit": "cái",
  "has_variants": true,
  "price": 150000,
  "cost_price": 80000,
  "sku": "VAY-HOA-001",
  "barcode": "8935001234567",
  "low_stock_alert": 5,
  "initial_quantity": 50,
  "status": "active",
  "is_pos_visible": true,
  "tags": ["váy", "hoa", "mùa hè"],
  "attributes": {"brand": "local"},
  "variants": [
    {
      "name": "Đỏ / S",
      "sku": "VAY-HOA-001-RED-S",
      "price": 150000,
      "cost_price": 80000,
      "attributes": {"color": "Đỏ", "size": "S"},
      "initial_quantity": 10
    }
  ]
}
```

---

### 4.7 Module: Inventory

```
GET    /api/v1/inventory                  - Danh sách tồn kho (phân trang)
GET    /api/v1/inventory/low-stock        - Sản phẩm sắp hết hàng
GET    /api/v1/inventory/out-of-stock     - Sản phẩm hết hàng
GET    /api/v1/inventory/:productId       - Tồn kho theo sản phẩm
PATCH  /api/v1/inventory/:id/alert        - Cập nhật ngưỡng cảnh báo

GET    /api/v1/inventory/transactions     - Lịch sử nhập xuất kho
GET    /api/v1/inventory/transactions/:id - Chi tiết giao dịch kho

POST   /api/v1/inventory/purchase         - Tạo phiếu nhập hàng
GET    /api/v1/inventory/purchase         - Danh sách phiếu nhập
GET    /api/v1/inventory/purchase/:id     - Chi tiết phiếu nhập

POST   /api/v1/inventory/adjustment       - Điều chỉnh tồn kho thủ công
POST   /api/v1/inventory/stocktake        - Kiểm kê kho (tạo phiếu)
PATCH  /api/v1/inventory/stocktake/:id    - Cập nhật kết quả kiểm kê
POST   /api/v1/inventory/stocktake/:id/confirm  - Xác nhận kiểm kê (áp dụng điều chỉnh)
```

**POST /api/v1/inventory/purchase Request:**
```json
{
  "supplier_id": "uuid",
  "items": [
    {
      "product_id": "uuid",
      "variant_id": "uuid",
      "quantity": 100,
      "unit_cost": 75000
    }
  ],
  "payment_status": "paid",
  "paid_amount": 7500000,
  "notes": "Nhập hàng tháng 4",
  "purchased_at": "2026-04-02"
}
```

---

### 4.8 Module: Orders

```
GET    /api/v1/orders                     - Danh sách đơn hàng
POST   /api/v1/orders                     - Tạo đơn thủ công
GET    /api/v1/orders/:id                 - Chi tiết đơn hàng
PATCH  /api/v1/orders/:id                 - Cập nhật đơn (trạng thái, ghi chú)
DELETE /api/v1/orders/:id                 - Xóa đơn nháp

PATCH  /api/v1/orders/:id/confirm         - Xác nhận đơn
PATCH  /api/v1/orders/:id/cancel          - Hủy đơn
PATCH  /api/v1/orders/:id/complete        - Hoàn thành đơn
POST   /api/v1/orders/:id/refund          - Hoàn trả / đổi trả

GET    /api/v1/orders/:id/payments        - Lịch sử thanh toán
POST   /api/v1/orders/:id/payments        - Thêm thanh toán (cho đơn thanh toán nhiều lần)

GET    /api/v1/orders/:id/invoice         - Lấy HTML hóa đơn để in
POST   /api/v1/orders/:id/invoice/send    - Gửi hóa đơn qua email

POST   /api/v1/orders/pos                 - Tạo đơn POS nhanh (tối ưu cho bán hàng tại quầy)
```

**POST /api/v1/orders/pos Request (tối ưu cho POS flow):**
```json
{
  "customer_id": "uuid",
  "items": [
    {
      "product_id": "uuid",
      "variant_id": "uuid",
      "quantity": 2,
      "unit_price": 150000,
      "discount_amount": 0
    }
  ],
  "discount_amount": 0,
  "discount_type": null,
  "coupon_code": null,
  "payments": [
    { "method": "cash", "amount": 200000 },
    { "method": "momo", "amount": 100000 }
  ],
  "shift_id": "uuid",
  "channel": "pos",
  "customer_note": ""
}
```

**POST /api/v1/orders/pos Response:**
```json
{
  "success": true,
  "data": {
    "order": {
      "id": "uuid",
      "code": "DH-2026-05821",
      "total_amount": 300000,
      "change_amount": 0,
      "status": "completed"
    },
    "invoice_url": "/api/v1/orders/uuid/invoice"
  }
}
```

**POST /api/v1/orders/:id/refund Request:**
```json
{
  "type": "return",
  "items": [
    {
      "order_item_id": "uuid",
      "quantity": 1,
      "reason": "Lỗi sản phẩm"
    }
  ],
  "refund_amount": 150000,
  "refund_method": "cash",
  "restock": true,
  "notes": "Khách phản hồi sản phẩm bị lỗi"
}
```

---

### 4.9 Module: Customers

```
GET    /api/v1/customers                  - Danh sách khách hàng
POST   /api/v1/customers                  - Thêm khách hàng
GET    /api/v1/customers/:id              - Hồ sơ khách hàng
PATCH  /api/v1/customers/:id             - Cập nhật khách hàng
DELETE /api/v1/customers/:id             - Xóa khách hàng

GET    /api/v1/customers/:id/orders       - Lịch sử đơn hàng của khách
GET    /api/v1/customers/:id/debt         - Thông tin công nợ
POST   /api/v1/customers/:id/debt/payment - Thanh toán công nợ

GET    /api/v1/customers/search           - Tìm kiếm nhanh (dùng trong POS)
POST   /api/v1/customers/import           - Import từ Excel

GET    /api/v1/customer-groups            - Danh sách nhóm khách hàng
POST   /api/v1/customer-groups            - Tạo nhóm
PATCH  /api/v1/customer-groups/:id        - Cập nhật nhóm
DELETE /api/v1/customer-groups/:id        - Xóa nhóm
```

---

### 4.10 Module: Suppliers

```
GET    /api/v1/suppliers                  - Danh sách nhà cung cấp
POST   /api/v1/suppliers                  - Thêm nhà cung cấp
GET    /api/v1/suppliers/:id              - Chi tiết nhà cung cấp
PATCH  /api/v1/suppliers/:id             - Cập nhật nhà cung cấp
DELETE /api/v1/suppliers/:id             - Xóa nhà cung cấp
GET    /api/v1/suppliers/:id/transactions - Lịch sử nhập hàng từ NCC
```

---

### 4.11 Module: Promotions

```
GET    /api/v1/promotions                 - Danh sách khuyến mãi
POST   /api/v1/promotions                 - Tạo khuyến mãi
GET    /api/v1/promotions/:id             - Chi tiết khuyến mãi
PATCH  /api/v1/promotions/:id             - Cập nhật khuyến mãi
DELETE /api/v1/promotions/:id             - Xóa khuyến mãi
PATCH  /api/v1/promotions/:id/status      - Bật/tắt khuyến mãi

GET    /api/v1/promotions/:id/coupons     - Danh sách coupon của chương trình
POST   /api/v1/promotions/:id/coupons     - Tạo coupon

POST   /api/v1/promotions/validate        - Kiểm tra coupon code có hợp lệ không
```

**POST /api/v1/promotions/validate Request:**
```json
{
  "code": "GIAM50K",
  "order_subtotal": 300000,
  "items": [
    { "product_id": "uuid", "quantity": 2 }
  ]
}
```

---

### 4.12 Module: Shifts

```
POST   /api/v1/shifts/open                - Mở ca (khai báo tiền đầu ca)
PATCH  /api/v1/shifts/:id/close           - Đóng ca (khai báo tiền cuối ca)
GET    /api/v1/shifts/current             - Ca đang mở hiện tại
GET    /api/v1/shifts                     - Lịch sử ca
GET    /api/v1/shifts/:id                 - Chi tiết ca (tổng kết doanh thu, giao dịch)
```

---

### 4.13 Module: Reports

```
GET    /api/v1/reports/dashboard          - Số liệu dashboard (cache 5 phút)
GET    /api/v1/reports/revenue            - Báo cáo doanh thu
GET    /api/v1/reports/profit             - Báo cáo lợi nhuận (cần quyền view_profit)
GET    /api/v1/reports/products           - Báo cáo sản phẩm bán chạy/chậm
GET    /api/v1/reports/inventory          - Báo cáo tồn kho
GET    /api/v1/reports/customers          - Báo cáo khách hàng
GET    /api/v1/reports/staff              - Báo cáo nhân viên
GET    /api/v1/reports/orders             - Báo cáo đơn hàng theo kênh/trạng thái
GET    /api/v1/reports/payments           - Báo cáo thanh toán theo phương thức

POST   /api/v1/reports/export             - Export báo cáo ra Excel/PDF
```

**GET /api/v1/reports/dashboard Query Params:**
```
?from=2026-04-01&to=2026-04-02
&compare=previous_period   (so sánh với kỳ trước)
```

**GET /api/v1/reports/dashboard Response:**
```json
{
  "data": {
    "period": { "from": "2026-04-02", "to": "2026-04-02" },
    "revenue": {
      "total": 8450000,
      "change_percent": 12.5,
      "chart": [
        { "date": "2026-03-27", "value": 6200000 },
        ...
      ]
    },
    "orders": { "total": 47, "change_percent": 5.3 },
    "new_customers": { "total": 8, "change_percent": 33.3 },
    "gross_profit": { "total": 2135000, "margin_percent": 25.3 },
    "top_products": [
      { "product_id": "uuid", "name": "Váy hoa nhí", "quantity_sold": 23, "revenue": 3450000 }
    ],
    "pending_orders": 4,
    "low_stock_count": 2,
    "out_of_stock_count": 1
  }
}
```

**GET /api/v1/reports/revenue Query Params:**
```
?from=2026-04-01&to=2026-04-30
&group_by=day|week|month
&channel=pos|shopee|all
&compare=previous_period|previous_year
```

---

### 4.14 Module: Uploads

```
POST   /api/v1/uploads/presign            - Lấy presigned URL để upload trực tiếp lên R2
DELETE /api/v1/uploads/:key               - Xóa file đã upload
```

**POST /api/v1/uploads/presign Request:**
```json
{
  "filename": "product-image.jpg",
  "content_type": "image/jpeg",
  "purpose": "product_image"   // product_image | store_logo | import_file
}
```

---

### 4.15 Module: Notifications

```
GET    /api/v1/notifications              - Danh sách thông báo
PATCH  /api/v1/notifications/:id/read     - Đánh dấu đã đọc
PATCH  /api/v1/notifications/read-all     - Đánh dấu tất cả đã đọc
DELETE /api/v1/notifications/:id          - Xóa thông báo
```

---

## 5. Security Design

### 5.1 JWT Authentication Chi Tiết

**Access Token:**
- Algorithm: `RS256` (asymmetric, public key có thể verify không cần secret)
- Expiry: `15 phút`
- Payload:
```json
{
  "sub": "user-uuid",
  "store_id": "store-uuid",
  "role": "cashier",
  "permissions": ["orders:create", "products:view", "customers:view"],
  "iss": "genhub-api",
  "iat": 1743580800,
  "exp": 1743581700
}
```

**Refresh Token:**
- Format: `crypto.randomBytes(64).toString('hex')`
- Lưu trữ: Chỉ lưu hash SHA-256 trong Redis (key: `rt:{user_id}:{token_id}`)
- Expiry: `30 ngày`
- **Token Rotation:** Mỗi lần refresh → tạo cặp token mới, revoke cặp cũ
- **Reuse Detection:** Nếu refresh token đã revoke được dùng lại → revoke ALL tokens của user (phòng token theft)

**Lưu trữ trên Client:**
- Access Token: **Memory only** (JavaScript variable, không localStorage)
- Refresh Token: **HttpOnly cookie** với `Secure; SameSite=Strict`
- Lý do: HttpOnly cookie không thể đọc bởi XSS, SameSite chống CSRF

### 5.2 RBAC Design

```
OWNER (Chủ cửa hàng):
  - Tất cả permissions
  - Bao gồm: products:view_cost, reports:view_profit, settings:update, staff:manage

MANAGER (Quản lý):
  - Tất cả trừ: settings:update (billing), staff:manage (không tạo/xóa owner)
  - Có: reports:view_profit, products:view_cost

CASHIER (Thu ngân):
  - orders:create, orders:view (của mình trong ca)
  - products:view (không view cost)
  - customers:view, customers:create
  - inventory:view
  - Không có: reports:export, inventory:adjust, settings:*

WAREHOUSE (Nhân viên kho):
  - inventory:view, inventory:adjust, inventory:purchase
  - products:view
  - Không có: orders:*, customers:*, reports:*
```

**Implementation trong NestJS:**
```typescript
// Permission Guard
@Injectable()
export class PermissionsGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.get<string[]>('permissions', context.getHandler());
    const user = context.switchToHttp().getRequest().user;
    return requiredPermissions.every(p => user.permissions.includes(p));
  }
}

// Sử dụng trên Controller
@RequirePermissions('orders:cancel')
@Delete(':id/cancel')
async cancelOrder(@Param('id') id: string) { ... }
```

### 5.3 Multi-Tenancy Security

**Store Isolation:** Mọi query đều được filter theo `store_id` của user hiện tại:

```typescript
// BaseService abstract class
protected async findWithStoreScope<T>(id: string, storeId: string): Promise<T> {
  const entity = await this.repo.findOne({ where: { id, store_id: storeId } });
  if (!entity) throw new NotFoundException();
  return entity;
}
```

**Ngăn chặn Cross-tenant access:** Middleware tự động inject `store_id` vào mọi database query — developer không cần nhớ, không thể quên.

### 5.4 Input Validation

**DTO validation với class-validator (NestJS Pipe):**
```typescript
export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  name: string;

  @IsPositive()
  @IsInt()
  price: number;

  @IsOptional()
  @IsUUID()
  category_id?: string;
}
```

**Validation rules quan trọng:**
- SQL Injection: Prisma ORM sử dụng parameterized queries — tự động an toàn
- XSS: Sanitize HTML input với `sanitize-html` trước khi lưu
- File upload: Validate MIME type (không chỉ extension), giới hạn 5MB/file
- Barcode/SKU: Validate format, không cho phép ký tự đặc biệt

### 5.5 Rate Limiting

```typescript
// Áp dụng với @nestjs/throttler
const rateLimitConfig = {
  // Auth endpoints - nghiêm ngặt nhất
  'POST /auth/login':         { ttl: 300, limit: 5 },   // 5 lần / 5 phút
  'POST /auth/forgot-password': { ttl: 3600, limit: 3 }, // 3 lần / giờ

  // API chung
  'default':                  { ttl: 60, limit: 100 },  // 100 req/phút/user

  // Upload
  'POST /uploads/*':          { ttl: 60, limit: 20 },   // 20 upload/phút

  // Export
  'POST /reports/export':     { ttl: 60, limit: 5 },    // 5 export/phút
};
```

### 5.6 CORS Policy

```typescript
app.enableCors({
  origin: [
    'https://app.genhub.vn',
    'https://staging.genhub.vn',
    process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : null,
  ].filter(Boolean),
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type', 'X-Store-ID'],
  credentials: true,  // Cho phép cookies (refresh token)
  maxAge: 86400,      // Preflight cache 24h
});
```

### 5.7 Security Headers (Helmet.js)

```
Content-Security-Policy: default-src 'self'; img-src 'self' *.r2.dev data:
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-XSS-Protection: 1; mode=block
```

---

## 6. Performance & Scalability

### 6.1 Capacity Estimation (MVP)

| Metric | Ước tính |
|---|---|
| Target stores (Year 1) | 1.000 stores |
| Active users đồng thời (peak) | ~500 users |
| Đơn hàng/ngày (toàn hệ thống) | ~50.000 orders |
| API requests/giây (peak) | ~200 req/s |
| Database size (Year 1) | ~50 GB |
| File storage (Year 1) | ~500 GB |

→ **1 server** đủ cho Year 1. Thiết kế để horizontal scale khi cần.

### 6.2 Database Optimization

**Connection Pooling (PgBouncer):**
```
# PostgreSQL max_connections = 100
# PgBouncer pool_size = 20 connections/service
# NestJS app → PgBouncer → PostgreSQL
```

**N+1 Prevention với Prisma:**
```typescript
// BAD: N+1
const orders = await prisma.order.findMany();
for (const order of orders) {
  order.items = await prisma.orderItem.findMany({ where: { orderId: order.id } });
}

// GOOD: Eager loading
const orders = await prisma.order.findMany({
  include: {
    items: { include: { product: true } },
    customer: true,
    payments: true,
  }
});
```

**Pagination Strategy:**
- Offset pagination cho danh sách thông thường (trang 1, 2, 3...)
- Cursor pagination cho infinite scroll và realtime feeds

**Slow Query Monitoring:**
```sql
-- Log queries chậm hơn 500ms
log_min_duration_statement = 500
```

### 6.3 Caching Chi Tiết

**Dashboard Cache (Redis):**
```typescript
// Cache key: dashboard:{storeId}:{date}
// TTL: 5 phút
// Invalidate: khi có order mới trong store

async getDashboardStats(storeId: string, date: string) {
  const cacheKey = `dashboard:${storeId}:${date}`;
  const cached = await this.redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const stats = await this.computeExpensiveStats(storeId, date);
  await this.redis.setex(cacheKey, 300, JSON.stringify(stats));
  return stats;
}
```

**Product List Cache:**
- TanStack Query client-side cache: 30 giây stale, refetch on window focus
- Prefetch categories khi app load

### 6.4 Frontend Performance

**Code Splitting:**
- Next.js App Router tự động code split theo route
- Dynamic import cho heavy components (charts, rich text editor)

```typescript
const RevenueChart = dynamic(() => import('@/components/charts/RevenueChart'), {
  ssr: false,
  loading: () => <ChartSkeleton />
});
```

**Image Optimization:**
- `next/image` với automatic WebP conversion
- Responsive sizes: `sizes="(max-width: 768px) 100vw, 50vw"`
- Lazy loading mặc định

**Bundle Size:**
- Target: < 200KB First Load JS
- Phân tích: `next build --profile` + `@next/bundle-analyzer`

### 6.5 Horizontal Scaling Plan (khi cần)

```
Phase MVP:
  1 NestJS instance + 1 PostgreSQL + 1 Redis

Phase Scale (>1000 active stores):
  → NestJS: Scale to 3+ instances behind load balancer
  → PostgreSQL: Read replica cho reports queries
  → Redis: Redis Cluster
  → Files: Cloudflare R2 (already distributed)
  → Background jobs: BullMQ với Redis (email, export, notifications)
```

---

## 7. Development Guidelines

### 7.1 Project Structure

#### Backend (NestJS)

```
apps/api/
├── src/
│   ├── main.ts                         # Bootstrap
│   ├── app.module.ts                   # Root module
│   │
│   ├── config/
│   │   ├── database.config.ts
│   │   ├── redis.config.ts
│   │   ├── jwt.config.ts
│   │   └── storage.config.ts
│   │
│   ├── common/
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts
│   │   │   ├── require-permissions.decorator.ts
│   │   │   └── public.decorator.ts
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   ├── permissions.guard.ts
│   │   │   └── store-scope.guard.ts
│   │   ├── interceptors/
│   │   │   ├── response-transform.interceptor.ts
│   │   │   ├── logging.interceptor.ts
│   │   │   └── timeout.interceptor.ts
│   │   ├── pipes/
│   │   │   └── validation.pipe.ts
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   ├── dto/
│   │   │   └── pagination.dto.ts
│   │   └── utils/
│   │       ├── generate-code.ts        # Sinh mã đơn hàng, SKU
│   │       ├── format-currency.ts
│   │       └── slug.ts
│   │
│   ├── prisma/
│   │   ├── prisma.module.ts
│   │   ├── prisma.service.ts
│   │   └── schema.prisma
│   │
│   ├── redis/
│   │   ├── redis.module.ts
│   │   └── redis.service.ts
│   │
│   ├── storage/
│   │   ├── storage.module.ts
│   │   └── storage.service.ts          # R2 operations
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── strategies/
│   │   │   │   └── jwt.strategy.ts
│   │   │   └── dto/
│   │   │       ├── login.dto.ts
│   │   │       └── register.dto.ts
│   │   │
│   │   ├── products/
│   │   │   ├── products.module.ts
│   │   │   ├── products.controller.ts
│   │   │   ├── products.service.ts
│   │   │   ├── variants.service.ts
│   │   │   ├── images.service.ts
│   │   │   └── dto/
│   │   │       ├── create-product.dto.ts
│   │   │       ├── update-product.dto.ts
│   │   │       └── product-filter.dto.ts
│   │   │
│   │   ├── orders/
│   │   │   ├── orders.module.ts
│   │   │   ├── orders.controller.ts
│   │   │   ├── orders.service.ts
│   │   │   ├── pos.service.ts          # POS-specific logic
│   │   │   ├── invoice.service.ts      # Tạo HTML hóa đơn
│   │   │   └── dto/
│   │   │
│   │   ├── inventory/
│   │   │   ├── inventory.module.ts
│   │   │   ├── inventory.controller.ts
│   │   │   ├── inventory.service.ts
│   │   │   └── dto/
│   │   │
│   │   ├── customers/
│   │   ├── suppliers/
│   │   ├── promotions/
│   │   ├── shifts/
│   │   ├── reports/
│   │   ├── users/
│   │   ├── store/
│   │   └── notifications/
│   │
│   └── jobs/                           # Background jobs (BullMQ - Phase 2)
│       ├── email.job.ts
│       └── export.job.ts
│
├── test/
│   ├── unit/
│   │   └── modules/
│   │       ├── orders/
│   │       │   └── orders.service.spec.ts
│   │       └── inventory/
│   │           └── inventory.service.spec.ts
│   ├── integration/
│   │   └── orders.e2e-spec.ts
│   └── fixtures/
│       └── test-data.ts
│
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
│
├── .env.example
├── docker-compose.yml
├── Dockerfile
└── package.json
```

#### Frontend (Next.js)

```
apps/web/
├── src/
│   ├── app/                            # Next.js App Router
│   │   ├── (auth)/                     # Route group: không có layout store
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── register/
│   │   │       └── page.tsx
│   │   │
│   │   ├── (store)/                    # Route group: có sidebar layout
│   │   │   ├── layout.tsx              # Store layout với sidebar
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── pos/
│   │   │   │   ├── page.tsx            # POS full screen
│   │   │   │   └── components/
│   │   │   │       ├── ProductGrid.tsx
│   │   │   │       ├── Cart.tsx
│   │   │   │       ├── PaymentModal.tsx
│   │   │   │       └── CustomerSearch.tsx
│   │   │   ├── orders/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── [id]/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── new/
│   │   │   │       └── page.tsx
│   │   │   ├── products/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── [id]/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── new/
│   │   │   │       └── page.tsx
│   │   │   ├── inventory/
│   │   │   ├── customers/
│   │   │   ├── reports/
│   │   │   ├── suppliers/
│   │   │   ├── staff/
│   │   │   └── settings/
│   │   │
│   │   ├── api/                        # Next.js API routes (minimal, chủ yếu proxy)
│   │   │   └── auth/
│   │   │       └── callback/
│   │   ├── layout.tsx                  # Root layout
│   │   └── globals.css
│   │
│   ├── components/
│   │   ├── ui/                         # shadcn/ui components (copied)
│   │   │   ├── button.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── table.tsx
│   │   │   └── ...
│   │   │
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── TopBar.tsx
│   │   │   └── MobileNav.tsx
│   │   │
│   │   ├── common/
│   │   │   ├── DataTable/
│   │   │   │   ├── DataTable.tsx
│   │   │   │   ├── Pagination.tsx
│   │   │   │   └── ColumnFilters.tsx
│   │   │   ├── FormFields/
│   │   │   │   ├── CurrencyInput.tsx   # Input số tiền VND
│   │   │   │   ├── DatePicker.tsx      # dd/mm/yyyy format
│   │   │   │   └── ImageUpload.tsx
│   │   │   ├── StatusBadge.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── LoadingSkeleton.tsx
│   │   │   └── ConfirmDialog.tsx
│   │   │
│   │   └── charts/
│   │       ├── RevenueChart.tsx        # Recharts
│   │       └── TopProductsChart.tsx
│   │
│   ├── lib/
│   │   ├── api/                        # API client
│   │   │   ├── client.ts               # Axios instance với interceptors
│   │   │   ├── auth.api.ts
│   │   │   ├── products.api.ts
│   │   │   ├── orders.api.ts
│   │   │   └── ...
│   │   │
│   │   ├── hooks/                      # TanStack Query hooks
│   │   │   ├── useProducts.ts
│   │   │   ├── useOrders.ts
│   │   │   ├── useInventory.ts
│   │   │   └── useDashboard.ts
│   │   │
│   │   ├── stores/                     # Zustand stores
│   │   │   ├── cart.store.ts           # POS cart
│   │   │   ├── auth.store.ts
│   │   │   └── notification.store.ts
│   │   │
│   │   └── utils/
│   │       ├── format.ts               # formatCurrency, formatDate (VND, dd/mm/yyyy)
│   │       ├── cn.ts                   # clsx + tailwind-merge
│   │       └── constants.ts
│   │
│   └── types/
│       ├── api.types.ts                # Response types từ API
│       ├── product.types.ts
│       ├── order.types.ts
│       └── common.types.ts
│
├── public/
│   └── fonts/                          # Be Vietnam Pro (self-hosted)
│
├── tailwind.config.ts
├── next.config.js
├── .env.example
└── package.json
```

---

### 7.2 Coding Conventions

**TypeScript:**
- `strict: true` trong tsconfig
- Không dùng `any` — dùng `unknown` hoặc define proper types
- Interface cho objects, type alias cho union types

**Naming Conventions:**
```
files:        kebab-case     (create-product.dto.ts)
classes:      PascalCase     (ProductService)
functions:    camelCase      (createProduct)
constants:    SCREAMING_SNAKE (MAX_VARIANTS_PER_PRODUCT = 50)
DB columns:   snake_case     (created_at, store_id)
API fields:   snake_case     (order_id, total_amount)
React components: PascalCase (ProductCard.tsx)
React hooks:  camelCase, prefix use (useProducts)
Zustand stores: camelCase, suffix Store (cartStore)
```

**Error Handling:**
- Backend: Ném `NotFoundException`, `BadRequestException`, `ForbiddenException` từ NestJS
- Frontend: TanStack Query error states, toast notifications
- Không bao giờ expose stack trace ra client trong production

**Commits:**
```
feat: thêm tính năng tạo phiếu nhập kho
fix: sửa lỗi tính tiền thừa khi thanh toán kết hợp
refactor: tách POS service thành cart service và payment service
test: thêm unit tests cho inventory service
chore: cập nhật dependencies
docs: cập nhật API spec cho module orders
```

---

### 7.3 Git Branching Strategy

```
main          → Production (deploy tự động)
staging       → Staging environment (deploy tự động)
develop       → Integration branch
feature/*     → Tính năng mới (feature/pos-keyboard-shortcuts)
fix/*         → Bug fixes (fix/inventory-race-condition)
hotfix/*      → Urgent fixes trên production
```

**Flow:**
```
feature/xxx → develop (PR, cần 1 reviewer) → staging (tự động deploy + QA)
                                             → main (cần approval Tech Lead)
hotfix/xxx → main (PR urgent, deploy ngay)
          → develop (backport)
```

**Branch Protection Rules (main):**
- Require PR review từ Tech Lead
- Required status checks: lint, type-check, unit-tests phải pass
- No force push
- Squash merge (giữ history sạch)

---

### 7.4 Testing Strategy

**Unit Tests (Jest) — Target: >70% coverage cho business logic:**

```typescript
// inventory.service.spec.ts
describe('InventoryService', () => {
  describe('decreaseStock', () => {
    it('should decrease stock correctly', async () => { ... });
    it('should throw when stock is insufficient', async () => { ... });
    it('should handle concurrent decreases with optimistic locking', async () => { ... });
  });
});
```

**Priority cho unit tests:**
- `OrderService.createPOSOrder()` — Tính tiền, áp discount, trừ kho
- `InventoryService.decreaseStock()` — Optimistic locking, prevent oversell
- `PromotionService.validateAndApply()` — Logic khuyến mãi phức tạp
- `ReportService.calculateRevenue()` — Aggregation chính xác

**Integration Tests (Supertest):**
```typescript
// orders.e2e-spec.ts
describe('POST /api/v1/orders/pos', () => {
  it('should create order and decrease inventory', async () => {
    // Tạo product với stock = 5
    // Tạo POS order với quantity = 3
    // Verify: stock = 2, order created, payment recorded
  });

  it('should fail when stock is insufficient', async () => {
    // Stock = 1, order quantity = 5 → 422 error
  });
});
```

**E2E Tests (Playwright) — Chỉ cho happy paths quan trọng:**
- Luồng POS: tìm sản phẩm → thêm giỏ → thanh toán → in hóa đơn
- Luồng nhập hàng: tạo phiếu nhập → xác nhận → tồn kho tăng
- Đăng nhập, phân quyền: cashier không xem được báo cáo lợi nhuận

**CI Test Pipeline:**
```yaml
# GitHub Actions
jobs:
  test:
    steps:
      - lint (ESLint + Prettier check)
      - typecheck (tsc --noEmit)
      - unit-test (jest --coverage)
      - integration-test (jest --config test/integration.config.js)
      - build (next build + nest build)
  # E2E chỉ chạy khi merge vào staging
  e2e:
    needs: test
    if: github.base_ref == 'staging'
```

---

### 7.5 Environment Variables

```bash
# .env.example

# App
NODE_ENV=development
PORT=4000
API_URL=http://localhost:4000

# Database
DATABASE_URL=postgresql://genhub:password@localhost:5432/genhub_dev
DATABASE_POOL_SIZE=10

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----...
JWT_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----...
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=30d

# Cloudflare R2
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=genhub-prod
R2_PUBLIC_URL=https://files.genhub.vn

# Email (Phase 2)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=

# Sentry
SENTRY_DSN=

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100
```

---

### 7.6 Docker Compose (Development)

```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: genhub_dev
      POSTGRES_USER: genhub
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - '5432:5432'

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'

  api:
    build:
      context: ./apps/api
      dockerfile: Dockerfile.dev
    volumes:
      - ./apps/api:/app
      - /app/node_modules
    environment:
      DATABASE_URL: postgresql://genhub:password@postgres:5432/genhub_dev
      REDIS_URL: redis://redis:6379
    ports:
      - '4000:4000'
    depends_on:
      - postgres
      - redis
    command: npm run start:dev

  web:
    build:
      context: ./apps/web
      dockerfile: Dockerfile.dev
    volumes:
      - ./apps/web:/app
      - /app/node_modules
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:4000
    ports:
      - '3000:3000'
    command: npm run dev

volumes:
  postgres_data:
```

---

## Phụ Lục: Quyết Định Kỹ Thuật Quan Trọng

### ADR-001: Modular Monolith thay vì Microservices
- **Quyết định:** Monolith
- **Lý do:** Team 3-5 người, MVP focus, distributed transactions phức tạp không cần thiết
- **Trade-off:** Deploy đơn giản hơn, đánh đổi khả năng scale độc lập từng service

### ADR-002: UUID v7 cho Primary Keys
- **Quyết định:** UUID v7 (time-sortable)
- **Lý do:** UUID v4 random gây index fragmentation, Auto-increment integer lộ business data (số đơn hàng)
- **Trade-off:** UUID v7 vẫn lớn hơn integer 4 bytes nhưng acceptable

### ADR-003: Snapshot Pattern cho Order Items
- **Quyết định:** Lưu `product_snapshot` JSONB trong order_items
- **Lý do:** Khi sản phẩm bị sửa/xóa, đơn hàng cũ vẫn phải hiển thị đúng thông tin tại thời điểm đặt
- **Trade-off:** Tốn thêm storage, nhưng đây là yêu cầu nghiệp vụ bắt buộc

### ADR-004: Optimistic Locking cho Inventory
- **Quyết định:** Dùng `version` column thay vì `SELECT FOR UPDATE`
- **Lý do:** `SELECT FOR UPDATE` block concurrent reads, ảnh hưởng hiệu năng POS peak hours
- **Trade-off:** Client phải retry khi version conflict — acceptable vì xác suất conflict thấp

### ADR-005: Client-side Upload trực tiếp lên R2
- **Quyết định:** Presigned URL, client upload thẳng lên R2
- **Lý do:** Không tốn bandwidth API server, không block event loop với file I/O
- **Trade-off:** Logic phức tạp hơn một chút, cần cleanup orphan files khi upload thành công nhưng không được lưu vào DB

---

*Tài liệu này là nguồn sự thật duy nhất (single source of truth) cho kiến trúc kỹ thuật GenHub POS. Mọi thay đổi quan trọng phải được cập nhật vào tài liệu này và được Tech Lead review.*
