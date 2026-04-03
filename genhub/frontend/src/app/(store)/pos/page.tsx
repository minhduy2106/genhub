'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Plus, Minus, Trash2, ShoppingCart, X, User, Loader2, UserPlus, Phone } from 'lucide-react';
import { useCartStore } from '@/lib/stores/cart.store';
import { useAuthStore } from '@/lib/stores/auth.store';
import { formatCurrency } from '@/lib/utils/format';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';
import PaymentModal from '@/components/pos/PaymentModal';
import Receipt, { type ReceiptData } from '@/components/pos/Receipt';

/* ---------- Types ---------- */
interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string | null;
  price: number;
  costPrice: number;
  categoryId: string | null;
  status: string;
  images?: { url: string }[];
  inventory?: { quantity: number }[];
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Customer {
  id: string;
  fullName: string;
  phone?: string | null;
}

interface PosOrderResponse {
  order: { id: string; code: string; totalAmount: number; status: string };
  changeAmount: number;
}

/* ---------- Helpers ---------- */
function getStock(product: Product): number {
  if (!product.inventory?.length) return 0;
  return product.inventory.reduce((sum, inv) => sum + inv.quantity, 0);
}

function getImage(product: Product): string | null {
  return product.images?.[0]?.url ?? null;
}

/* ---------- Quick Create Customer Inline Form ---------- */
interface QuickCreateCustomerProps {
  initialName?: string;
  onClose: () => void;
  onCreated: (customer: Customer) => void;
}

function QuickCreateCustomer({ initialName = '', onClose, onCreated }: QuickCreateCustomerProps) {
  const [fullName, setFullName] = useState(initialName);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error('Vui lòng nhập họ tên');
      return;
    }
    if (!phone.trim()) {
      toast.error('Vui lòng nhập số điện thoại');
      return;
    }
    setLoading(true);
    try {
      const customer = await apiFetch<Customer>('/customers', {
        method: 'POST',
        body: JSON.stringify({
          fullName: fullName.trim(),
          phone: phone.trim(),
        }),
      });
      toast.success(`Đã thêm khách hàng: ${customer.fullName}`);
      onCreated(customer);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể tạo khách hàng');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border-t border-orange-100 bg-orange-50 p-3 space-y-2">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide">
          Thêm khách hàng mới
        </p>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
          aria-label="Đóng"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-2">
        <input
          ref={nameRef}
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Họ tên khách hàng *"
          className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#FF6B35]/50 focus:outline-none bg-white"
        />
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Số điện thoại *"
          className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#FF6B35]/50 focus:outline-none bg-white"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-1.5 border rounded-lg text-xs text-gray-600 hover:bg-white"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-1.5 bg-[#FF6B35] text-white rounded-lg text-xs font-medium hover:bg-[#E55A2B] disabled:opacity-50 flex items-center justify-center gap-1"
          >
            {loading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <UserPlus className="h-3 w-3" />
            )}
            {loading ? 'Đang thêm...' : 'Tạo & chọn'}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ---------- Component ---------- */
export default function PosPage() {
  const authUser = useAuthStore((s) => s.user);
  const storeName = authUser?.store?.name ?? 'GENHUB POS';

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showCart, setShowCart] = useState(false);

  // Data state
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Customer search
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [customerSearching, setCustomerSearching] = useState(false);
  const [customerSearched, setCustomerSearched] = useState(false);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const customerRef = useRef<HTMLDivElement>(null);
  const customerInputRef = useRef<HTMLInputElement>(null);
  const dropdownCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Payment & Receipt
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);

  const cart = useCartStore();

  /* ---------- Load products & categories on mount ---------- */
  useEffect(() => {
    async function load() {
      try {
        const [prodRes, catRes] = await Promise.all([
          apiFetch<{ data: Product[] }>('/products?limit=50&status=active'),
          apiFetch<Category[]>('/categories'),
        ]);
        const prodList = Array.isArray(prodRes) ? prodRes : prodRes.data ?? [];
        const catList = Array.isArray(catRes) ? catRes : [];
        setProducts(prodList);
        setCategories(catList);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Không thể tải dữ liệu');
      } finally {
        setLoadingProducts(false);
      }
    }
    load();
  }, []);

  /* ---------- Debounced product search ---------- */
  useEffect(() => {
    if (!search.trim()) return;
    const timer = setTimeout(async () => {
      try {
        const results = await apiFetch<Product[]>(`/products/search?q=${encodeURIComponent(search.trim())}`);
        const list = Array.isArray(results) ? results : [];
        setProducts(list);
      } catch {
        // keep existing products on error
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset to full list when search is cleared
  useEffect(() => {
    if (search.trim() === '') {
      apiFetch<{ data: Product[] }>('/products?limit=50&status=active')
        .then((res) => {
          const list = Array.isArray(res) ? res : res.data ?? [];
          setProducts(list);
        })
        .catch(() => {});
    }
  }, [search]);

  /* ---------- Debounced customer search ---------- */
  useEffect(() => {
    if (!customerSearch.trim()) {
      setCustomerResults([]);
      setCustomerSearched(false);
      setCustomerSearching(false);
      // Keep dropdown open on focus so user can start typing
      return;
    }

    setCustomerSearching(true);
    setCustomerSearched(false);
    const timer = setTimeout(async () => {
      try {
        const results = await apiFetch<Customer[]>(
          `/customers/search?q=${encodeURIComponent(customerSearch.trim())}`,
        );
        const list = Array.isArray(results) ? results : [];
        setCustomerResults(list);
      } catch {
        setCustomerResults([]);
      } finally {
        setCustomerSearching(false);
        setCustomerSearched(true);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [customerSearch]);

  /* ---------- Close customer dropdown on outside click ---------- */
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (customerRef.current && !customerRef.current.contains(e.target as Node)) {
        setShowCustomerDropdown(false);
        setShowQuickCreate(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  /* ---------- Filter products by category ---------- */
  const filteredProducts = activeCategory
    ? products.filter((p) => p.categoryId === activeCategory)
    : products;

  /* ---------- Add to cart ---------- */
  const handleAddToCart = useCallback(
    (product: Product) => {
      cart.addItem({
        productId: product.id,
        name: product.name,
        price: product.price,
        image: getImage(product),
      });
    },
    [cart],
  );

  /* ---------- Customer input handlers ---------- */
  const handleCustomerFocus = () => {
    if (dropdownCloseTimer.current) clearTimeout(dropdownCloseTimer.current);
    setShowCustomerDropdown(true);
  };

  const handleCustomerBlur = () => {
    // Delay close so clicks inside dropdown register first
    dropdownCloseTimer.current = setTimeout(() => {
      setShowCustomerDropdown(false);
      setShowQuickCreate(false);
      // If user typed something but didn't select, store it as customerName
      if (customerSearch.trim() && !cart.customerId) {
        cart.setCustomer(null, customerSearch.trim(), null);
        setCustomerSearch('');
      }
    }, 200);
  };

  /* ---------- Select customer ---------- */
  const selectCustomer = (customer: Customer) => {
    cart.setCustomer(customer.id, customer.fullName, customer.phone ?? null);
    setCustomerSearch('');
    setShowCustomerDropdown(false);
    setShowQuickCreate(false);
    setCustomerSearched(false);
    setCustomerResults([]);
  };

  const clearCustomer = () => {
    cart.setCustomer(null, null, null);
    setCustomerSearch('');
    // Refocus input for convenience
    setTimeout(() => customerInputRef.current?.focus(), 50);
  };

  /* ---------- Handle new customer created ---------- */
  const handleCustomerCreated = (customer: Customer) => {
    setShowQuickCreate(false);
    setShowCustomerDropdown(false);
    selectCustomer(customer);
  };

  /* ---------- Payment flow ---------- */
  const handleOpenPayment = () => {
    if (cart.items.length === 0) return;
    setShowPaymentModal(true);
  };

  const handleConfirmPayment = async (payments: { method: string; amount: number }[]) => {
    setPaymentLoading(true);
    try {
      const body = {
        items: cart.items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId ?? null,
          unitPrice: item.price,
          quantity: item.quantity,
        })),
        payments,
        customerId: cart.customerId ?? undefined,
        customerName: !cart.customerId && cart.customerName ? cart.customerName : undefined,
        customerPhone: !cart.customerId && cart.customerPhone ? cart.customerPhone : undefined,
        discountAmount: cart.discount || 0,
        discountType: 'fixed' as const,
      };

      const result = await apiFetch<PosOrderResponse>('/orders/pos', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      // Build receipt data
      const receipt: ReceiptData = {
        orderCode: result.order.code,
        createdAt: new Date().toISOString(),
        items: cart.items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
          lineTotal: item.price * item.quantity,
        })),
        subtotal: cart.subtotal(),
        discountAmount: cart.discount,
        totalAmount: cart.total(),
        payments,
        changeAmount: result.changeAmount,
        customerName: cart.customerName,
        customerPhone: cart.customerPhone,
        storeName,
      };

      setShowPaymentModal(false);
      setReceiptData(receipt);
      toast.success(`Thanh toán thành công: ${result.order.code}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Thanh toán thất bại');
    } finally {
      setPaymentLoading(false);
    }
  };

  /* ---------- New order (after receipt) ---------- */
  const handleNewOrder = () => {
    cart.clear();
    setReceiptData(null);
    setShowCart(false);
  };

  /* ---------- Render ---------- */
  return (
    <>
      <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-7rem)] lg:h-[calc(100vh-5rem)]">
        {/* Product Grid */}
        <div className={`flex-1 flex flex-col ${showCart ? 'hidden lg:flex' : ''}`}>
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm sản phẩm, mã SKU, barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border rounded-xl bg-white focus:ring-2 focus:ring-[#FF6B35]/50 focus:outline-none"
            />
          </div>

          {/* Category tabs */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap ${
                !activeCategory ? 'bg-[#FF6B35] text-white' : 'bg-white text-gray-600 border'
              }`}
            >
              Tất cả
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap ${
                  activeCategory === cat.id ? 'bg-[#FF6B35] text-white' : 'bg-white text-gray-600 border'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Product grid */}
          <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 content-start">
            {loadingProducts ? (
              <div className="col-span-full flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-400">
                Không tìm thấy sản phẩm
              </div>
            ) : (
              filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => handleAddToCart(product)}
                  className="bg-white rounded-xl p-3 text-left hover:ring-2 hover:ring-[#FF6B35] transition-all shadow-sm"
                >
                  <div className="aspect-square bg-gray-100 rounded-lg mb-2 flex items-center justify-center text-gray-300 overflow-hidden">
                    {getImage(product) ? (
                      <img src={getImage(product)!} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <ShoppingCart className="h-8 w-8" />
                    )}
                  </div>
                  <p className="text-sm font-medium truncate">{product.name}</p>
                  <p className="text-xs text-gray-500">{product.sku}</p>
                  <p className="text-sm font-bold text-[#FF6B35] mt-1">{formatCurrency(product.price)}</p>
                  <p className="text-xs text-gray-400">Kho: {getStock(product)}</p>
                </button>
              ))
            )}
          </div>

          {/* Mobile cart toggle */}
          {cart.items.length > 0 && (
            <button
              onClick={() => setShowCart(true)}
              className="lg:hidden fixed bottom-16 right-4 bg-[#FF6B35] text-white rounded-full p-4 shadow-lg z-40"
            >
              <ShoppingCart className="h-6 w-6" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {cart.items.length}
              </span>
            </button>
          )}
        </div>

        {/* Cart Panel */}
        <div
          className={`w-full lg:w-96 bg-white rounded-xl shadow-sm flex flex-col ${
            !showCart ? 'hidden lg:flex' : ''
          }`}
        >
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="font-bold">Giỏ hàng ({cart.items.length})</h2>
            <button onClick={() => setShowCart(false)} className="lg:hidden p-1">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Customer selection */}
          <div className="px-4 pt-3 pb-1" ref={customerRef}>
            {/* Selected customer badge */}
            {cart.customerId || (cart.customerName && !showCustomerDropdown) ? (
              <div className="flex items-center justify-between p-2.5 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="bg-blue-100 rounded-full p-1 shrink-0">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-blue-800 truncate">{cart.customerName}</p>
                    {cart.customerPhone && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-blue-400" />
                        <p className="text-xs text-blue-500">{cart.customerPhone}</p>
                      </div>
                    )}
                    {cart.customerId && (
                      <p className="text-xs text-blue-400">Khách hàng đã lưu</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={clearCustomer}
                  title="Bỏ chọn khách hàng"
                  className="ml-2 shrink-0 flex items-center gap-1 text-xs text-blue-400 hover:text-red-500 border border-blue-200 hover:border-red-300 rounded px-1.5 py-0.5 transition-colors"
                >
                  <X className="h-3 w-3" />
                  Bỏ chọn
                </button>
              </div>
            ) : (
              /* Customer search input & dropdown */
              <div className="relative">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <input
                    ref={customerInputRef}
                    type="text"
                    placeholder="Tìm hoặc nhập tên khách hàng..."
                    value={customerSearch}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      setShowQuickCreate(false);
                    }}
                    onFocus={handleCustomerFocus}
                    onBlur={handleCustomerBlur}
                    className="w-full pl-9 pr-8 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#FF6B35]/50 focus:outline-none"
                  />
                  {customerSearch && (
                    <button
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setCustomerSearch('');
                        setCustomerResults([]);
                        setCustomerSearched(false);
                        setShowQuickCreate(false);
                        customerInputRef.current?.focus();
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Dropdown */}
                {showCustomerDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-20 overflow-hidden">
                    {/* Searching indicator */}
                    {customerSearching && (
                      <div className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-400">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Đang tìm kiếm...
                      </div>
                    )}

                    {/* Results */}
                    {!customerSearching && customerResults.length > 0 && (
                      <div className="max-h-44 overflow-y-auto">
                        {customerResults.map((c) => (
                          <button
                            key={c.id}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => selectCustomer(c)}
                            className="w-full text-left px-3 py-2.5 text-sm hover:bg-orange-50 flex items-center gap-3 border-b last:border-b-0"
                          >
                            <div className="bg-gray-100 rounded-full p-1 shrink-0">
                              <User className="h-3.5 w-3.5 text-gray-500" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-gray-800 truncate">{c.fullName}</p>
                              {c.phone && <p className="text-xs text-gray-400">{c.phone}</p>}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* No results — show add new option */}
                    {!customerSearching && customerSearched && customerResults.length === 0 && customerSearch.trim() && (
                      <div className="p-3">
                        <p className="text-xs text-gray-400 mb-2">
                          Không tìm thấy &ldquo;{customerSearch}&rdquo;
                        </p>
                        {!showQuickCreate ? (
                          <button
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => setShowQuickCreate(true)}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-[#FF6B35] text-white rounded-lg text-sm font-medium hover:bg-[#E55A2B] transition-colors"
                          >
                            <UserPlus className="h-4 w-4" />
                            Thêm khách hàng mới
                          </button>
                        ) : null}
                      </div>
                    )}

                    {/* Empty state — user focused but hasn't typed */}
                    {!customerSearching && !customerSearch.trim() && (
                      <div className="px-3 py-2.5 text-xs text-gray-400">
                        Nhập tên hoặc số điện thoại để tìm...
                      </div>
                    )}

                    {/* Quick create form embedded in dropdown */}
                    {showQuickCreate && (
                      <QuickCreateCustomer
                        initialName={customerSearch}
                        onClose={() => setShowQuickCreate(false)}
                        onCreated={handleCustomerCreated}
                      />
                    )}

                    {/* "Thêm mới" footer — always visible when dropdown is open and results exist */}
                    {!customerSearching && !showQuickCreate && customerResults.length > 0 && (
                      <div className="border-t px-3 py-2">
                        <button
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => setShowQuickCreate(true)}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-gray-300 text-gray-500 rounded-lg text-xs hover:border-[#FF6B35] hover:text-[#FF6B35] transition-colors"
                        >
                          <UserPlus className="h-3.5 w-3.5" />
                          Thêm khách hàng mới
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.items.length === 0 ? (
              <p className="text-center text-gray-400 py-8">Giỏ hàng trống</p>
            ) : (
              cart.items.map((item) => (
                <div
                  key={`${item.productId}-${item.variantId ?? 'default'}`}
                  className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-sm text-[#FF6B35]">{formatCurrency(item.price)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() =>
                        cart.updateQuantity(item.productId, item.quantity - 1, item.variantId)
                      }
                      className="p-1 rounded hover:bg-gray-200"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                    <button
                      onClick={() =>
                        cart.updateQuantity(item.productId, item.quantity + 1, item.variantId)
                      }
                      className="p-1 rounded hover:bg-gray-200"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => cart.removeItem(item.productId, item.variantId)}
                      className="p-1 rounded hover:bg-red-100 text-red-500 ml-1"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Totals & Payment */}
          <div className="p-4 border-t space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Tạm tính</span>
              <span className="font-medium">{formatCurrency(cart.subtotal())}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Giảm giá</span>
              <span className="font-medium">{formatCurrency(cart.discount)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-3">
              <span>Tổng cộng</span>
              <span className="text-[#FF6B35]">{formatCurrency(cart.total())}</span>
            </div>
            <button
              onClick={handleOpenPayment}
              disabled={cart.items.length === 0}
              className="w-full py-3 bg-[#FF6B35] text-white rounded-xl font-bold text-lg hover:bg-[#E55A2B] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Thanh toán
            </button>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          totalAmount={cart.total()}
          onConfirm={handleConfirmPayment}
          onCancel={() => setShowPaymentModal(false)}
          isLoading={paymentLoading}
        />
      )}

      {/* Receipt */}
      {receiptData && (
        <Receipt
          data={receiptData}
          onNewOrder={handleNewOrder}
          onClose={() => setReceiptData(null)}
        />
      )}
    </>
  );
}
