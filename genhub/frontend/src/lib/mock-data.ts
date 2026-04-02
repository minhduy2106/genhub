export const mockCategories = [
  { id: '1', name: 'Áo', slug: 'ao', productCount: 4 },
  { id: '2', name: 'Quần', slug: 'quan', productCount: 3 },
  { id: '3', name: 'Váy', slug: 'vay', productCount: 3 },
  { id: '4', name: 'Phụ kiện', slug: 'phu-kien', productCount: 5 },
];

export const mockProducts = [
  { id: '1', name: 'Áo sơ mi trắng', sku: 'AO-SM-001', price: 250000, costPrice: 150000, categoryId: '1', categoryName: 'Áo', stock: 25, status: 'active', image: null },
  { id: '2', name: 'Áo thun basic đen', sku: 'AO-TH-001', price: 180000, costPrice: 90000, categoryId: '1', categoryName: 'Áo', stock: 42, status: 'active', image: null },
  { id: '3', name: 'Áo polo xanh navy', sku: 'AO-PL-001', price: 320000, costPrice: 180000, categoryId: '1', categoryName: 'Áo', stock: 18, status: 'active', image: null },
  { id: '4', name: 'Áo khoác bomber', sku: 'AO-KB-001', price: 450000, costPrice: 250000, categoryId: '1', categoryName: 'Áo', stock: 8, status: 'active', image: null },
  { id: '5', name: 'Quần jean slim fit', sku: 'QU-JE-001', price: 380000, costPrice: 200000, categoryId: '2', categoryName: 'Quần', stock: 30, status: 'active', image: null },
  { id: '6', name: 'Quần kaki nam', sku: 'QU-KA-001', price: 280000, costPrice: 150000, categoryId: '2', categoryName: 'Quần', stock: 15, status: 'active', image: null },
  { id: '7', name: 'Quần short thể thao', sku: 'QU-SH-001', price: 150000, costPrice: 80000, categoryId: '2', categoryName: 'Quần', stock: 3, status: 'active', image: null },
  { id: '8', name: 'Váy hoa nhí đỏ', sku: 'VA-HN-001', price: 350000, costPrice: 180000, categoryId: '3', categoryName: 'Váy', stock: 20, status: 'active', image: null },
  { id: '9', name: 'Váy liền thân xanh', sku: 'VA-LT-001', price: 420000, costPrice: 220000, categoryId: '3', categoryName: 'Váy', stock: 12, status: 'active', image: null },
  { id: '10', name: 'Chân váy chữ A', sku: 'VA-CA-001', price: 280000, costPrice: 140000, categoryId: '3', categoryName: 'Váy', stock: 22, status: 'active', image: null },
  { id: '11', name: 'Túi xách nữ', sku: 'PK-TX-001', price: 520000, costPrice: 280000, categoryId: '4', categoryName: 'Phụ kiện', stock: 10, status: 'active', image: null },
  { id: '12', name: 'Mũ lưỡi trai', sku: 'PK-ML-001', price: 120000, costPrice: 60000, categoryId: '4', categoryName: 'Phụ kiện', stock: 35, status: 'active', image: null },
  { id: '13', name: 'Thắt lưng da', sku: 'PK-TL-001', price: 250000, costPrice: 120000, categoryId: '4', categoryName: 'Phụ kiện', stock: 2, status: 'active', image: null },
  { id: '14', name: 'Kính mát thời trang', sku: 'PK-KM-001', price: 180000, costPrice: 80000, categoryId: '4', categoryName: 'Phụ kiện', stock: 28, status: 'active', image: null },
  { id: '15', name: 'Khăn choàng cổ', sku: 'PK-KC-001', price: 150000, costPrice: 70000, categoryId: '4', categoryName: 'Phụ kiện', stock: 40, status: 'active', image: null },
];

export const mockCustomers = [
  { id: '1', fullName: 'Phạm Minh Tuấn', phone: '0912345001', email: 'tuan@email.com', totalOrders: 12, totalSpent: 4500000, lastOrderAt: '2026-03-28' },
  { id: '2', fullName: 'Nguyễn Thị Hoa', phone: '0912345002', email: 'hoa@email.com', totalOrders: 8, totalSpent: 3200000, lastOrderAt: '2026-03-30' },
  { id: '3', fullName: 'Trần Đức Anh', phone: '0912345003', email: null, totalOrders: 5, totalSpent: 1800000, lastOrderAt: '2026-04-01' },
  { id: '4', fullName: 'Lê Thị Bích', phone: '0912345004', email: 'bich@email.com', totalOrders: 20, totalSpent: 8900000, lastOrderAt: '2026-04-02' },
  { id: '5', fullName: 'Hoàng Văn Nam', phone: '0912345005', email: null, totalOrders: 3, totalSpent: 950000, lastOrderAt: '2026-03-25' },
];

export const mockOrders = [
  { id: '1', code: 'DH-2026-00001', customerName: 'Phạm Minh Tuấn', channel: 'pos', totalAmount: 680000, status: 'completed', createdAt: '2026-04-02T08:30:00' },
  { id: '2', code: 'DH-2026-00002', customerName: 'Nguyễn Thị Hoa', channel: 'pos', totalAmount: 350000, status: 'completed', createdAt: '2026-04-02T09:15:00' },
  { id: '3', code: 'DH-2026-00003', customerName: 'Khách lẻ', channel: 'pos', totalAmount: 180000, status: 'completed', createdAt: '2026-04-02T10:00:00' },
  { id: '4', code: 'DH-2026-00004', customerName: 'Trần Đức Anh', channel: 'pos', totalAmount: 920000, status: 'pending', createdAt: '2026-04-02T11:30:00' },
  { id: '5', code: 'DH-2026-00005', customerName: 'Lê Thị Bích', channel: 'pos', totalAmount: 1250000, status: 'completed', createdAt: '2026-04-01T14:00:00' },
  { id: '6', code: 'DH-2026-00006', customerName: 'Khách lẻ', channel: 'pos', totalAmount: 450000, status: 'cancelled', createdAt: '2026-04-01T16:30:00' },
];

export const mockDashboard = {
  revenue: 8450000,
  orders: 47,
  newCustomers: 8,
  lowStockCount: 3,
  revenueChart: [
    { date: '27/03', value: 6200000 },
    { date: '28/03', value: 7100000 },
    { date: '29/03', value: 5800000 },
    { date: '30/03', value: 9200000 },
    { date: '31/03', value: 8100000 },
    { date: '01/04', value: 7500000 },
    { date: '02/04', value: 8450000 },
  ],
  topProducts: [
    { name: 'Áo thun basic đen', quantity: 23, revenue: 4140000 },
    { name: 'Quần jean slim fit', quantity: 18, revenue: 6840000 },
    { name: 'Váy hoa nhí đỏ', quantity: 15, revenue: 5250000 },
    { name: 'Áo sơ mi trắng', quantity: 12, revenue: 3000000 },
    { name: 'Túi xách nữ', quantity: 8, revenue: 4160000 },
  ],
};
