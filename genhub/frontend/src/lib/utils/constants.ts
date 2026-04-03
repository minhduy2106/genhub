export const ORDER_STATUS = {
  draft: { label: 'Nháp', color: 'bg-gray-100 text-gray-700' },
  pending: { label: 'Chờ xử lý', color: 'bg-yellow-100 text-yellow-700' },
  confirmed: { label: 'Đã xác nhận', color: 'bg-blue-100 text-blue-700' },
  processing: { label: 'Đang xử lý', color: 'bg-blue-100 text-blue-700' },
  shipping: { label: 'Đang giao', color: 'bg-purple-100 text-purple-700' },
  completed: { label: 'Hoàn thành', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Đã hủy', color: 'bg-red-100 text-red-700' },
  refunded: { label: 'Đã hoàn', color: 'bg-orange-100 text-orange-700' },
} as const;

export const PAYMENT_METHODS = {
  cash: 'Tiền mặt',
  card: 'Thẻ',
  bank_transfer: 'Chuyển khoản',
  momo: 'MoMo',
  zalopay: 'ZaloPay',
  vnpay: 'VNPay',
  credit_card: 'Thẻ tín dụng',
} as const;

export const MENU_ITEMS = [
  { label: 'Tổng quan', href: '/dashboard', icon: 'LayoutDashboard' },
  { label: 'Bán hàng', href: '/pos', icon: 'ShoppingCart' },
  { label: 'Sản phẩm', href: '/products', icon: 'Package' },
  { label: 'Đơn hàng', href: '/orders', icon: 'ClipboardList' },
  { label: 'Kho hàng', href: '/inventory', icon: 'Warehouse' },
  { label: 'Khách hàng', href: '/customers', icon: 'Users' },
  { label: 'Báo cáo', href: '/reports', icon: 'BarChart3' },
  { label: 'Nhà cung cấp', href: '/suppliers', icon: 'Truck' },
  { label: 'Nhân viên', href: '/staff', icon: 'UserCog' },
  { label: 'Cài đặt', href: '/settings', icon: 'Settings' },
] as const;
