"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const bcrypt = __importStar(require("bcrypt"));
const adapter = new adapter_pg_1.PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new client_1.PrismaClient({ adapter });
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
            name: 'Cửa hàng Thời Trang Lan',
            slug: 'cua-hang-thoi-trang-lan',
            phone: '0901234567',
            email: 'lan@genhub.vn',
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
    const catAo = await prisma.category.create({ data: { storeId: store.id, name: 'Áo', slug: 'ao', sortOrder: 1 } });
    const catQuan = await prisma.category.create({ data: { storeId: store.id, name: 'Quần', slug: 'quan', sortOrder: 2 } });
    const catVay = await prisma.category.create({ data: { storeId: store.id, name: 'Váy', slug: 'vay', sortOrder: 3 } });
    const catPK = await prisma.category.create({ data: { storeId: store.id, name: 'Phụ kiện', slug: 'phu-kien', sortOrder: 4 } });
    const products = [
        { name: 'Áo sơ mi trắng', sku: 'AO-SM-001', price: 250000, costPrice: 150000, cat: catAo.id, unit: 'cái' },
        { name: 'Áo thun basic đen', sku: 'AO-TH-001', price: 180000, costPrice: 90000, cat: catAo.id, unit: 'cái' },
        { name: 'Áo polo xanh navy', sku: 'AO-PL-001', price: 320000, costPrice: 180000, cat: catAo.id, unit: 'cái' },
        { name: 'Áo khoác bomber', sku: 'AO-KB-001', price: 450000, costPrice: 250000, cat: catAo.id, unit: 'cái' },
        { name: 'Quần jean slim fit', sku: 'QU-JE-001', price: 380000, costPrice: 200000, cat: catQuan.id, unit: 'cái' },
        { name: 'Quần kaki nam', sku: 'QU-KA-001', price: 280000, costPrice: 150000, cat: catQuan.id, unit: 'cái' },
        { name: 'Quần short thể thao', sku: 'QU-SH-001', price: 150000, costPrice: 80000, cat: catQuan.id, unit: 'cái' },
        { name: 'Váy hoa nhí đỏ', sku: 'VA-HN-001', price: 350000, costPrice: 180000, cat: catVay.id, unit: 'cái' },
        { name: 'Váy liền thân xanh', sku: 'VA-LT-001', price: 420000, costPrice: 220000, cat: catVay.id, unit: 'cái' },
        { name: 'Chân váy chữ A', sku: 'VA-CA-001', price: 280000, costPrice: 140000, cat: catVay.id, unit: 'cái' },
        { name: 'Túi xách nữ', sku: 'PK-TX-001', price: 520000, costPrice: 280000, cat: catPK.id, unit: 'cái' },
        { name: 'Mũ lưỡi trai', sku: 'PK-ML-001', price: 120000, costPrice: 60000, cat: catPK.id, unit: 'cái' },
        { name: 'Thắt lưng da', sku: 'PK-TL-001', price: 250000, costPrice: 120000, cat: catPK.id, unit: 'cái' },
        { name: 'Kính mát thời trang', sku: 'PK-KM-001', price: 180000, costPrice: 80000, cat: catPK.id, unit: 'cái' },
        { name: 'Khăn choàng cổ', sku: 'PK-KC-001', price: 150000, costPrice: 70000, cat: catPK.id, unit: 'cái' },
    ];
    for (const p of products) {
        const product = await prisma.product.create({
            data: {
                storeId: store.id, categoryId: p.cat, name: p.name,
                slug: p.sku.toLowerCase(), sku: p.sku, unit: p.unit,
                price: p.price, costPrice: p.costPrice, status: 'active',
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
//# sourceMappingURL=seed.js.map