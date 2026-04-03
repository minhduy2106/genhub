'use client';
import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { formatCurrency } from '@/lib/utils/format';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  sku: string;
  costPrice?: number;
}

interface Variant {
  id: string;
  name: string;
  sku?: string;
}

interface InventoryItem {
  id: string;
  quantity: number;
  lowStockAlert: number;
  product: Product;
  variant?: Variant | null;
}

interface PaginatedInventory {
  data: InventoryItem[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'quantity' | 'name'>('quantity');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    const fetchInventory = async () => {
      setLoading(true);
      try {
        const res = await apiFetch<PaginatedInventory>('/inventory?page=1&limit=100');
        setItems(res.data ?? []);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Không thể tải dữ liệu kho hàng');
      } finally {
        setLoading(false);
      }
    };
    fetchInventory();
  }, []);

  const handleSort = (col: 'quantity' | 'name') => {
    if (sortBy === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(col);
      setSortDir('asc');
    }
  };

  const sorted = [...items].sort((a, b) => {
    let cmp = 0;
    if (sortBy === 'quantity') {
      cmp = a.quantity - b.quantity;
    } else {
      cmp = a.product.name.localeCompare(b.product.name, 'vi');
    }
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const SortIcon = ({ col }: { col: 'quantity' | 'name' }) => {
    if (sortBy !== col) return <span className="text-gray-300 ml-1">↕</span>;
    return <span className="text-[#FF6B35] ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Kho hàng</h1>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Đang tải...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-gray-400">Chưa có dữ liệu kho hàng</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-gray-500">
                  <th
                    className="p-4 font-medium cursor-pointer select-none hover:text-gray-700"
                    onClick={() => handleSort('name')}
                  >
                    Sản phẩm <SortIcon col="name" />
                  </th>
                  <th className="p-4 font-medium">SKU</th>
                  <th
                    className="p-4 font-medium text-right cursor-pointer select-none hover:text-gray-700"
                    onClick={() => handleSort('quantity')}
                  >
                    Tồn kho <SortIcon col="quantity" />
                  </th>
                  <th className="p-4 font-medium text-right hidden sm:table-cell">Ngưỡng cảnh báo</th>
                  <th className="p-4 font-medium text-right hidden md:table-cell">Giá vốn</th>
                  <th className="p-4 font-medium">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((item) => {
                  const isLow = item.quantity <= item.lowStockAlert;
                  const sku = item.variant?.sku ?? item.product.sku;
                  const name = item.variant
                    ? `${item.product.name} - ${item.variant.name}`
                    : item.product.name;
                  const costPrice = Number(item.product.costPrice ?? 0);

                  return (
                    <tr key={item.id} className={`border-t ${isLow ? 'bg-red-50' : ''}`}>
                      <td className="p-4 font-medium">{name}</td>
                      <td className="p-4 text-gray-500">{sku}</td>
                      <td className={`p-4 text-right font-bold ${isLow ? 'text-red-600' : ''}`}>
                        {item.quantity}
                      </td>
                      <td className="p-4 text-right text-gray-500 hidden sm:table-cell">
                        {item.lowStockAlert}
                      </td>
                      <td className="p-4 text-right text-gray-500 hidden md:table-cell">
                        {costPrice > 0 ? formatCurrency(costPrice) : '—'}
                      </td>
                      <td className="p-4">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 text-red-600 text-xs font-medium">
                            <AlertTriangle className="h-3 w-3" /> Sắp hết
                          </span>
                        ) : (
                          <span className="text-green-600 text-xs font-medium">Đủ hàng</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
