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
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [newQuantity, setNewQuantity] = useState('');
  const [adjustmentNote, setAdjustmentNote] = useState('');
  const [saving, setSaving] = useState(false);

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

  useEffect(() => {
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

  const openAdjustModal = (item: InventoryItem) => {
    setSelectedItem(item);
    setNewQuantity(String(item.quantity));
    setAdjustmentNote('');
  };

  const closeAdjustModal = () => {
    setSelectedItem(null);
    setNewQuantity('');
    setAdjustmentNote('');
  };

  const handleSaveAdjustment = async () => {
    if (!selectedItem) return;

    setSaving(true);
    try {
      await apiFetch('/inventory/adjustment', {
        method: 'POST',
        body: JSON.stringify({
          productId: selectedItem.product.id,
          variantId: selectedItem.variant?.id,
          newQuantity: Number(newQuantity),
          notes: adjustmentNote || 'Điều chỉnh tồn kho thủ công',
        }),
      });
      toast.success('Cập nhật tồn kho thành công');
      closeAdjustModal();
      fetchInventory();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể cập nhật tồn kho');
    } finally {
      setSaving(false);
    }
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
                    <tr
                      key={item.id}
                      className={`border-t cursor-pointer hover:bg-gray-50 ${isLow ? 'bg-red-50' : ''}`}
                      onClick={() => openAdjustModal(item)}
                    >
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

      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b p-5">
              <h2 className="text-lg font-bold">Chỉnh sửa tồn kho</h2>
              <button onClick={closeAdjustModal} className="rounded-lg p-1.5 hover:bg-gray-100">
                <span className="text-gray-500">✕</span>
              </button>
            </div>
            <div className="space-y-4 p-5">
              <div>
                <p className="text-sm text-gray-500">Sản phẩm</p>
                <p className="font-medium">
                  {selectedItem.variant
                    ? `${selectedItem.product.name} - ${selectedItem.variant.name}`
                    : selectedItem.product.name}
                </p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Số lượng mới</label>
                <input
                  type="number"
                  min="0"
                  value={newQuantity}
                  onChange={(e) => setNewQuantity(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/50"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Ghi chú</label>
                <textarea
                  value={adjustmentNote}
                  onChange={(e) => setAdjustmentNote(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/50"
                  placeholder="Ví dụ: kiểm kho cuối ngày"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeAdjustModal}
                  className="flex-1 rounded-xl border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSaveAdjustment}
                  disabled={saving}
                  className="flex-1 rounded-xl bg-[#FF6B35] py-2.5 text-sm font-medium text-white hover:bg-[#E55A2B] disabled:opacity-60"
                >
                  {saving ? 'Đang lưu...' : 'Lưu tồn kho'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
