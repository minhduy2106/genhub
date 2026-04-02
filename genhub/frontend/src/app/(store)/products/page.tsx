'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Plus, Search } from 'lucide-react';
import { mockProducts } from '@/lib/mock-data';
import { formatCurrency } from '@/lib/utils/format';

export default function ProductsPage() {
  const [search, setSearch] = useState('');

  const filtered = mockProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Sản phẩm</h1>
        <Link
          href="/products/new"
          className="flex items-center gap-2 bg-[#FF6B35] text-white px-4 py-2 rounded-lg hover:bg-[#E55A2B]"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Thêm sản phẩm</span>
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Tìm sản phẩm..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border rounded-lg bg-white focus:ring-2 focus:ring-[#FF6B35]/50 focus:outline-none"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-500">
                <th className="p-4 font-medium">Sản phẩm</th>
                <th className="p-4 font-medium">SKU</th>
                <th className="p-4 font-medium hidden md:table-cell">Danh mục</th>
                <th className="p-4 font-medium text-right">Giá bán</th>
                <th className="p-4 font-medium text-right">Tồn kho</th>
                <th className="p-4 font-medium">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => (
                <tr key={product.id} className="border-t hover:bg-gray-50 cursor-pointer">
                  <td className="p-4 font-medium">{product.name}</td>
                  <td className="p-4 text-gray-500">{product.sku}</td>
                  <td className="p-4 text-gray-500 hidden md:table-cell">{product.categoryName}</td>
                  <td className="p-4 text-right font-medium">{formatCurrency(product.price)}</td>
                  <td className={`p-4 text-right font-medium ${product.stock <= 5 ? 'text-red-600' : ''}`}>
                    {product.stock}
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center rounded-full bg-green-100 text-green-700 px-2.5 py-0.5 text-xs font-medium">
                      Đang bán
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
