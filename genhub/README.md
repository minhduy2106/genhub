# GenHub POS

Phần mềm quản lý bán hàng (POS) cho SME Việt Nam.

## Tech Stack

- **Frontend:** Next.js 16, React 19, Tailwind CSS 4, Zustand, Sonner
- **Backend:** NestJS 11, Prisma 7, PostgreSQL 16, Redis 7
- **Auth:** JWT (passport-jwt), bcrypt, RBAC

## Cách chạy

```bash
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000/api/v1
- Login: lan@genhub.vn / 123456

## Tài khoản demo

| Email            | Password | Role          |
|------------------|----------|---------------|
| lan@genhub.vn    | 123456   | Chủ cửa hàng  |
| hung@genhub.vn   | 123456   | Quản lý       |
| mai@genhub.vn    | 123456   | Thu ngân       |

## API Endpoints

| Method | Endpoint                     | Mô tả                   |
|--------|------------------------------|--------------------------|
| POST   | /api/v1/auth/login           | Đăng nhập                |
| POST   | /api/v1/auth/register        | Đăng ký                  |
| GET    | /api/v1/auth/me              | Thông tin user hiện tại  |
| GET    | /api/v1/products             | Danh sách sản phẩm      |
| POST   | /api/v1/products             | Tạo sản phẩm            |
| GET    | /api/v1/products/search?q=   | Tìm sản phẩm (POS)      |
| GET    | /api/v1/categories           | Danh sách danh mục      |
| POST   | /api/v1/orders/pos           | Tạo đơn POS             |
| GET    | /api/v1/orders               | Danh sách đơn hàng      |
| GET    | /api/v1/inventory            | Danh sách tồn kho       |
| GET    | /api/v1/customers            | Danh sách khách hàng    |
| GET    | /api/v1/reports/dashboard    | Dashboard thống kê      |
| POST   | /api/v1/shifts/open          | Mở ca                   |

## Cấu trúc dự án

```
genhub/
├── backend/          # NestJS API
│   ├── prisma/       # Schema + Migrations + Seed
│   ├── src/
│   │   ├── common/   # Guards, Filters, Interceptors, Decorators
│   │   ├── modules/  # auth, products, orders, inventory, ...
│   │   ├── prisma/   # PrismaService
│   │   └── redis/    # RedisService
│   └── Dockerfile
├── frontend/         # Next.js App
│   ├── src/
│   │   ├── app/      # Pages (login, dashboard, pos, products, ...)
│   │   ├── components/
│   │   └── lib/      # Stores, Utils, Mock Data
│   └── Dockerfile
└── docker-compose.yml
```
