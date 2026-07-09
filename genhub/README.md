# GenHub POS

Phần mềm quản lý bán hàng/POS cho SME Việt Nam.

## Tech Stack

- Frontend: Next.js 16, React 19, Tailwind CSS 4, Zustand, Sonner
- Backend: NestJS 11, Prisma 7, PostgreSQL 16, Redis 7
- Auth: JWT, refresh token cookie, bcrypt, RBAC
- Deploy: Docker Compose, Prisma Migrate

## Chạy production bằng Docker

```bash
cp .env.example .env
openssl rand -base64 48
# Điền JWT_SECRET bằng secret vừa sinh, đổi POSTGRES_PASSWORD,
# đặt FRONTEND_URL theo domain thật, cấu hình SMTP nếu dùng quên mật khẩu.

docker compose up -d --build
```

- Frontend: `http://localhost:3000` hoặc domain reverse proxy của bạn.
- Backend API nội bộ: `http://localhost:4000/api/v1`.
- Frontend tự proxy `/api/v1` và `/uploads` sang backend, không cần expose backend public.

## Cấu hình bắt buộc trước khi bán

- `JWT_SECRET`: secret riêng, tối thiểu 32 ký tự.
- `POSTGRES_PASSWORD`: mật khẩu database mạnh, không dùng mặc định.
- `FRONTEND_URL`: domain HTTPS thật, ví dụ `https://app.example.com`.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`: cần cho quên mật khẩu ở production.
- `ENABLE_DEMO_SEED=false`: production không tự tạo tài khoản/dữ liệu demo.

Mặc định compose chỉ mở frontend ra ngoài. Backend, PostgreSQL và Redis bind `127.0.0.1` để giảm bề mặt tấn công.

## Demo seed

Chỉ bật demo seed cho môi trường thử nghiệm dùng dữ liệu mẫu:

```bash
ENABLE_DEMO_SEED=true docker compose up -d --build
```

Không bật cờ này trên dữ liệu khách hàng thật.

## Database migration

Backend container chạy `npx prisma migrate deploy` khi khởi động. Migration baseline nằm trong `backend/prisma/migrations`.

Nếu bạn từng chạy bản demo cũ bằng `prisma db push` trên cùng volume database, hãy backup rồi dùng một trong hai cách trước khi deploy bản này:

1. Dựng production trên volume/database mới.
2. Mark baseline migration đã áp dụng bằng Prisma sau khi xác nhận schema hiện tại khớp migration.

## Backup tối thiểu

Nên backup hằng ngày:

- PostgreSQL volume/database.
- `backend_uploads` volume chứa ảnh sản phẩm.
- File `.env` production lưu secret và SMTP config.

## Cấu trúc dự án

```text
genhub/
├── backend/          # NestJS API
│   ├── prisma/       # Schema + migrations + optional demo seed
│   ├── src/          # Modules auth, products, orders, inventory, ...
│   └── Dockerfile
├── frontend/         # Next.js app
│   ├── src/app/      # Login, dashboard, POS, products, ...
│   ├── src/components/
│   └── Dockerfile
└── docker-compose.yml
```
