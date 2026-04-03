'use client';
import { useState } from 'react';
import { Search, Plus, Minus, Trash2, ShoppingCart, X } from 'lucide-react';
import { mockProducts, mockCategories } from '@/lib/mock-data';
import { useCartStore } from '@/lib/stores/cart.store';
import { formatCurrency } from '@/lib/utils/format';
import { toast } from 'sonner';

export default function PosPage() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showCart, setShowCart] = useState(false);
  const cart = useCartStore();

  const filteredProducts = mockProducts.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    const matchCategory = !activeCategory || p.categoryId === activeCategory;
    return matchSearch && matchCategory;
  });

  const handleAddToCart = (product: typeof mockProducts[0]) => {
    cart.addItem({ productId: product.id, name: product.name, price: product.price, image: product.image });
  };

  const handlePayment = () => {
    if (cart.items.length === 0) return;
    toast.success(`Thanh toán thành công: ${formatCurrency(cart.total())}`);
    cart.clear();
    setShowCart(false);
  };

  return (
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
          {mockCategories.map((cat) => (
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
          {filteredProducts.map((product) => (
            <button
              key={product.id}
              onClick={() => handleAddToCart(product)}
              className="bg-white rounded-xl p-3 text-left hover:ring-2 hover:ring-[#FF6B35] transition-all shadow-sm"
            >
              <div className="aspect-square bg-gray-100 rounded-lg mb-2 flex items-center justify-center text-gray-300">
                <ShoppingCart className="h-8 w-8" />
              </div>
              <p className="text-sm font-medium truncate">{product.name}</p>
              <p className="text-xs text-gray-500">{product.sku}</p>
              <p className="text-sm font-bold text-[#FF6B35] mt-1">{formatCurrency(product.price)}</p>
              <p className="text-xs text-gray-400">Kho: {product.stock}</p>
            </button>
          ))}
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
      <div className={`w-full lg:w-96 bg-white rounded-xl shadow-sm flex flex-col ${!showCart ? 'hidden lg:flex' : ''}`}>
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-bold">Giỏ hàng ({cart.items.length})</h2>
          <button onClick={() => setShowCart(false)} className="lg:hidden p-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.items.length === 0 ? (
            <p className="text-center text-gray-400 py-8">Giỏ hàng trống</p>
          ) : (
            cart.items.map((item) => (
              <div key={`${item.productId}-${item.variantId ?? 'default'}`} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <p className="text-sm text-[#FF6B35]">{formatCurrency(item.price)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => cart.updateQuantity(item.productId, item.quantity - 1, item.variantId)}
                    className="p-1 rounded hover:bg-gray-200"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                  <button
                    onClick={() => cart.updateQuantity(item.productId, item.quantity + 1, item.variantId)}
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
            onClick={handlePayment}
            disabled={cart.items.length === 0}
            className="w-full py-3 bg-[#FF6B35] text-white rounded-xl font-bold text-lg hover:bg-[#E55A2B] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Thanh toán
          </button>
        </div>
      </div>
    </div>
  );
}
