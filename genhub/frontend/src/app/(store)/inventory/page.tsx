'use client';
import { mockProducts } from '@/lib/mock-data';
import { formatCurrency } from '@/lib/utils/format';
import { AlertTriangle } from 'lucide-react';

export default function InventoryPage() {
  const sorted = [...mockProducts].sort((a, b) => a.stock - b.stock);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Kho hàng</h1>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-gray-500">
              <th className="p-4 font-medium">Sản phẩm</th>
              <th className="p-4 font-medium">SKU</th>
              <th className="p-4 font-medium text-right">Tồn kho</th>
              <th className="p-4 font-medium text-right hidden sm:table-cell">Giá vốn</th>
              <th className="p-4 font-medium text-right hidden md:table-cell">Giá trị tồn</th>
              <th className="p-4 font-medium">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((product) => (
              <tr key={product.id} className={`border-t ${product.stock <= 5 ? 'bg-red-50' : ''}`}>
                <td className="p-4 font-medium">{product.name}</td>
                <td className="p-4 text-gray-500">{product.sku}</td>
                <td className={`p-4 text-right font-bold ${product.stock <= 5 ? 'text-red-600' : ''}`}>
                  {product.stock}
                </td>
                <td className="p-4 text-right text-gray-500 hidden sm:table-cell">
                  {formatCurrency(product.costPrice)}
                </td>
                <td className="p-4 text-right hidden md:table-cell">
                  {formatCurrency(product.costPrice * product.stock)}
                </td>
                <td className="p-4">
                  {product.stock <= 5 ? (
                    <span className="inline-flex items-center gap-1 text-red-600 text-xs font-medium">
                      <AlertTriangle className="h-3 w-3" /> Sắp hết
                    </span>
                  ) : (
                    <span className="text-green-600 text-xs font-medium">Đủ hàng</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
