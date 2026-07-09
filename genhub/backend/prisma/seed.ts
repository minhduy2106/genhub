import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const demoCategories = [
  { key: 'noiThat', name: 'Nội thất', slug: 'noi-that', sortOrder: 1 },
  { key: 'gas', name: 'Gas', slug: 'gas', sortOrder: 2 },
  { key: 'bimSua', name: 'Bỉm sữa', slug: 'bim-sua', sortOrder: 3 },
  { key: 'traiCay', name: 'Trái cây', slug: 'trai-cay', sortOrder: 4 },
] as const;

type DemoCategoryKey = (typeof demoCategories)[number]['key'];

const demoProducts: Array<{
  name: string;
  sku: string;
  price: number;
  costPrice: number;
  category: DemoCategoryKey;
  unit: string;
}> = [
  { name: 'Bàn trà gỗ sồi', sku: 'NT-BT-001', price: 1350000, costPrice: 850000, category: 'noiThat', unit: 'cái' },
  { name: 'Ghế ăn bọc nệm', sku: 'NT-GA-001', price: 690000, costPrice: 420000, category: 'noiThat', unit: 'cái' },
  { name: 'Kệ giày 4 tầng', sku: 'NT-KG-001', price: 520000, costPrice: 310000, category: 'noiThat', unit: 'cái' },
  { name: 'Đèn bàn decor', sku: 'NT-DB-001', price: 390000, costPrice: 220000, category: 'noiThat', unit: 'cái' },
  { name: 'Bình gas 12kg', sku: 'GAS-12-001', price: 430000, costPrice: 380000, category: 'gas', unit: 'bình' },
  { name: 'Bình gas mini', sku: 'GAS-MINI-001', price: 18000, costPrice: 13000, category: 'gas', unit: 'lon' },
  { name: 'Van điều áp gas', sku: 'GAS-VA-001', price: 150000, costPrice: 90000, category: 'gas', unit: 'cái' },
  { name: 'Sữa bột Grow 800g', sku: 'BS-SG-001', price: 360000, costPrice: 310000, category: 'bimSua', unit: 'hộp' },
  { name: 'Bỉm size M 68 miếng', sku: 'BS-BM-001', price: 295000, costPrice: 245000, category: 'bimSua', unit: 'bịch' },
  { name: 'Khăn ướt em bé', sku: 'BS-KU-001', price: 35000, costPrice: 22000, category: 'bimSua', unit: 'gói' },
  { name: 'Táo Envy nhập khẩu', sku: 'TC-TAO-001', price: 95000, costPrice: 70000, category: 'traiCay', unit: 'kg' },
  { name: 'Cam sành', sku: 'TC-CAM-001', price: 42000, costPrice: 28000, category: 'traiCay', unit: 'kg' },
  { name: 'Chuối cau', sku: 'TC-CHUOI-001', price: 30000, costPrice: 18000, category: 'traiCay', unit: 'kg' },
  { name: 'Nho xanh không hạt', sku: 'TC-NHO-001', price: 145000, costPrice: 105000, category: 'traiCay', unit: 'kg' },
  { name: 'Xoài cát Hòa Lộc', sku: 'TC-XOAI-001', price: 85000, costPrice: 60000, category: 'traiCay', unit: 'kg' },
];

async function main() {
  console.log('🌱 Seeding database...');

  const ownerRole = await prisma.role.create({
    data: { name: 'Chủ cửa hàng', slug: 'owner', isSystem: true },
  });
  const managerRole = await prisma.role.create({
    data: { name: 'Quản lý', slug: 'manager', isSystem: true },
  });
  const cashierRole = await prisma.role.create({
    data: { name: 'Thu ngân', slug: 'cashier', isSystem: true },
  });
  await prisma.role.create({
    data: { name: 'Nhân viên kho', slug: 'warehouse', isSystem: true },
  });

  const store = await prisma.store.create({
    data: {
      name: 'Cửa hàng Demo GenHub',
      slug: 'cua-hang-demo-genhub',
      phone: '0901234567',
      email: 'demo@genhub.vn',
      address: '123 Nguyễn Huệ, Quận 1',
      city: 'TP.HCM',
      settings: { low_stock_threshold: 5, receipt_footer: 'Cảm ơn quý khách!' },
    },
  });

  const hash = await bcrypt.hash('123456', 10);
  await prisma.user.create({
    data: { storeId: store.id, roleId: ownerRole.id, email: 'lan@genhub.vn', passwordHash: hash, fullName: 'Nguyễn Thị Lan', isOwner: true },
  });
  await prisma.user.create({
    data: { storeId: store.id, roleId: managerRole.id, email: 'hung@genhub.vn', passwordHash: hash, fullName: 'Trần Văn Hùng' },
  });
  const cashier = await prisma.user.create({
    data: { storeId: store.id, roleId: cashierRole.id, email: 'mai@genhub.vn', passwordHash: hash, fullName: 'Lê Thị Mai' },
  });

  const categoryIds = new Map<DemoCategoryKey, string>();
  for (const category of demoCategories) {
    const created = await prisma.category.create({
      data: {
        storeId: store.id,
        name: category.name,
        slug: category.slug,
        sortOrder: category.sortOrder,
      },
    });
    categoryIds.set(category.key, created.id);
  }

  for (const p of demoProducts) {
    const categoryId = categoryIds.get(p.category);
    if (!categoryId) throw new Error(`Missing category ${p.category}`);

    const product = await prisma.product.create({
      data: {
        storeId: store.id,
        categoryId,
        name: p.name,
        slug: p.sku.toLowerCase(),
        sku: p.sku,
        unit: p.unit,
        price: p.price,
        costPrice: p.costPrice,
        status: 'active',
      },
    });
    await prisma.inventory.create({
      data: { storeId: store.id, productId: product.id, quantity: Math.floor(Math.random() * 50) + 10 },
    });
  }

  const customers = [
    { fullName: 'Phạm Minh Tuấn', phone: '0912345001', code: 'KH-001' },
    { fullName: 'Nguyễn Thị Hoa', phone: '0912345002', code: 'KH-002' },
    { fullName: 'Trần Đức Anh', phone: '0912345003', code: 'KH-003' },
    { fullName: 'Lê Thị Bích', phone: '0912345004', code: 'KH-004' },
    { fullName: 'Hoàng Văn Nam', phone: '0912345005', code: 'KH-005' },
  ];
  for (const c of customers) {
    await prisma.customer.create({ data: { storeId: store.id, ...c } });
  }

  console.log('✅ Seed completed!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
