'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Search, Loader2, X, ScanText, Camera, Trash2 } from 'lucide-react';
import { apiFetch, resolveAssetUrl } from '@/lib/api';
import { useAuthStore } from '@/lib/stores/auth.store';
import { hasPermission } from '@/lib/permissions';
import { formatCurrency } from '@/lib/utils/format';
import { toast } from 'sonner';

/* ---------- Types ---------- */
interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Product {
  id: string;
  name: string;
  sku?: string | null;
  barcode?: string | null;
  categoryId?: string | null;
  price: number | string;
  costPrice?: number | string | null;
  unit?: string | null;
  status: string;
  hasVariants?: boolean;
  variants?: { id: string; name: string; price: number | string; isActive?: boolean }[];
  category?: { name: string } | null;
  inventory?: { id: string; quantity: number; variantId?: string | null }[];
  images?: { url: string }[];
}

interface ProductMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface ProductsResponse {
  data: Product[];
  meta: ProductMeta;
}

interface ProductFormData {
  name: string;
  sku: string;
  barcode: string;
  categoryId: string;
  price: string;
  costPrice: string;
  unit: string;
  initialQuantity: string;
  status: 'active' | 'inactive';
}

interface VariantFormRow {
  name: string;
  price: string;
  costPrice: string;
  initialQuantity: string;
}

const emptyVariantRow: VariantFormRow = {
  name: '',
  price: '',
  costPrice: '',
  initialQuantity: '0',
};

const defaultForm: ProductFormData = {
  name: '',
  sku: '',
  barcode: '',
  categoryId: '',
  price: '',
  costPrice: '',
  unit: 'cái',
  initialQuantity: '0',
  status: 'active',
};

/* ---------- OCR scan ---------- */
interface OcrCandidate {
  name: string;
  price: number | null;
}

interface OcrScanResult {
  rawText: string;
  lines: string[];
  candidates: OcrCandidate[];
}

async function ocrScanImage(file: File): Promise<OcrScanResult> {
  const formData = new FormData();
  formData.append('image', file);
  return apiFetch<OcrScanResult>('/products/ocr-scan', {
    method: 'POST',
    body: formData,
  });
}

/* ---------- Helpers ---------- */
function getStock(product: Product): number {
  if (!product.inventory?.length) return 0;
  return product.inventory.reduce((sum, inv) => sum + inv.quantity, 0);
}

/* ---------- Add Product Modal ---------- */
interface AddProductModalProps {
  categories: Category[];
  onClose: () => void;
  onSuccess: () => void;
}

function AddProductModal({ categories, onClose, onSuccess }: AddProductModalProps) {
  const [form, setForm] = useState<ProductFormData>(defaultForm);
  const [errors, setErrors] = useState<Partial<Record<keyof ProductFormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [hasVariants, setHasVariants] = useState(false);
  const [variantRows, setVariantRows] = useState<VariantFormRow[]>([{ ...emptyVariantRow }]);
  const [variantError, setVariantError] = useState<string | null>(null);

  const setVariantRow = (index: number, patch: Partial<VariantFormRow>) => {
    setVariantRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
    setVariantError(null);
  };

  const handleOcrScan = async () => {
    if (!selectedImage) return;
    setScanning(true);
    try {
      const result = await ocrScanImage(selectedImage);
      const best = result.candidates.find((c) => c.name) ?? result.candidates[0];
      if (!best) {
        toast.error('Không nhận diện được chữ trong ảnh. Thử chụp gần và rõ hơn.');
        return;
      }
      setForm((prev) => ({
        ...prev,
        name: best.name || prev.name,
        price: best.price !== null ? String(best.price) : prev.price,
      }));
      toast.success('Đã điền thông tin từ ảnh — kiểm tra lại trước khi lưu');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Quét ảnh thất bại');
    } finally {
      setScanning(false);
    }
  };

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const set = (field: keyof ProductFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof ProductFormData, string>> = {};
    if (!form.name.trim()) newErrors.name = 'Tên sản phẩm không được để trống';

    if (hasVariants) {
      const filled = variantRows.filter((r) => r.name.trim());
      if (filled.length === 0) {
        setVariantError('Cần ít nhất 1 phân loại (VD: 1m8 x 2m - Gỗ sồi - Đỏ)');
      } else if (filled.some((r) => isNaN(Number(r.price)) || Number(r.price) <= 0)) {
        setVariantError('Mỗi phân loại phải có giá bán lớn hơn 0');
      } else {
        setVariantError(null);
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
      }
      setErrors(newErrors);
      return false;
    }

    if (!form.price.trim()) {
      newErrors.price = 'Giá bán không được để trống';
    } else if (isNaN(Number(form.price)) || Number(form.price) <= 0) {
      newErrors.price = 'Giá bán phải lớn hơn 0';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedImage(file);

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl(file ? URL.createObjectURL(file) : null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        name: form.name.trim(),
        unit: form.unit.trim() || 'cái',
        status: form.status,
      };
      if (form.sku.trim()) payload.sku = form.sku.trim();
      if (form.barcode.trim()) payload.barcode = form.barcode.trim();
      if (form.categoryId) payload.categoryId = form.categoryId;

      if (hasVariants) {
        const variants = variantRows
          .filter((r) => r.name.trim())
          .map((r) => ({
            name: r.name.trim(),
            price: Number(r.price),
            ...(r.costPrice.trim() && !isNaN(Number(r.costPrice))
              ? { costPrice: Number(r.costPrice) }
              : {}),
            initialQuantity: Number(r.initialQuantity) || 0,
          }));
        payload.hasVariants = true;
        payload.variants = variants;
        // Giá gốc = giá phân loại rẻ nhất để hiển thị "Từ ..." ở POS
        payload.price = Math.min(...variants.map((v) => v.price));
      } else {
        payload.price = Number(form.price);
        payload.initialQuantity = Number(form.initialQuantity) || 0;
        if (form.costPrice.trim() && !isNaN(Number(form.costPrice))) {
          payload.costPrice = Number(form.costPrice);
        }
      }

      const product = await apiFetch<Product>('/products', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (selectedImage) {
        const formData = new FormData();
        formData.append('image', selectedImage);

        try {
          await apiFetch(`/products/${product.id}/images`, {
            method: 'POST',
            body: formData,
          });
        } catch (uploadErr) {
          toast.error(
            uploadErr instanceof Error
              ? `Sản phẩm đã tạo nhưng tải ảnh thất bại: ${uploadErr.message}`
              : 'Sản phẩm đã tạo nhưng tải ảnh thất bại',
          );
          onSuccess();
          onClose();
          return;
        }
      }

      toast.success('Thêm sản phẩm thành công!');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể thêm sản phẩm');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-bold">Thêm sản phẩm mới</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên sản phẩm <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Nhập tên sản phẩm"
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#FF6B35]/50 focus:outline-none ${
                errors.name ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          {/* SKU & Barcode */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
              <input
                type="text"
                value={form.sku}
                onChange={(e) => set('sku', e.target.value)}
                placeholder="Mã SKU"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#FF6B35]/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Barcode</label>
              <input
                type="text"
                value={form.barcode}
                onChange={(e) => set('barcode', e.target.value)}
                placeholder="Mã barcode"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#FF6B35]/50 focus:outline-none"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
            <select
              value={form.categoryId}
              onChange={(e) => set('categoryId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#FF6B35]/50 focus:outline-none bg-white"
            >
              <option value="">-- Chọn danh mục --</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Variant toggle */}
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={hasVariants}
              onChange={(e) => {
                setHasVariants(e.target.checked);
                setVariantError(null);
              }}
              className="rounded accent-[#FF6B35]"
            />
            Sản phẩm có nhiều phân loại (màu sắc, size, kích cỡ...)
          </label>

          {hasVariants ? (
            /* Variant rows */
            <div className="space-y-2 rounded-xl border border-gray-200 bg-gray-50 p-3">
              <div className="grid grid-cols-[1fr_90px_90px_60px_28px] gap-2 text-xs font-medium text-gray-500">
                <span>Phân loại</span>
                <span>Giá bán</span>
                <span>Giá vốn</span>
                <span>Tồn đầu</span>
                <span />
              </div>
              {variantRows.map((row, i) => (
                <div key={i} className="grid grid-cols-[1fr_90px_90px_60px_28px] gap-2 items-center">
                  <input
                    type="text"
                    value={row.name}
                    onChange={(e) => setVariantRow(i, { name: e.target.value })}
                    placeholder="VD: 1m8 x 2m - Gỗ sồi - Đỏ"
                    className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#FF6B35]/50 focus:outline-none"
                  />
                  <input
                    type="number"
                    min="0"
                    value={row.price}
                    onChange={(e) => setVariantRow(i, { price: e.target.value })}
                    placeholder="Giá"
                    className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#FF6B35]/50 focus:outline-none"
                  />
                  <input
                    type="number"
                    min="0"
                    value={row.costPrice}
                    onChange={(e) => setVariantRow(i, { costPrice: e.target.value })}
                    placeholder="Vốn"
                    className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#FF6B35]/50 focus:outline-none"
                  />
                  <input
                    type="number"
                    min="0"
                    value={row.initialQuantity}
                    onChange={(e) => setVariantRow(i, { initialQuantity: e.target.value })}
                    className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#FF6B35]/50 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setVariantRows((prev) => prev.filter((_, idx) => idx !== i))}
                    disabled={variantRows.length === 1}
                    className="p-1 text-gray-400 hover:text-red-500 disabled:opacity-30"
                    aria-label="Xóa phân loại"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setVariantRows((prev) => [...prev, { ...emptyVariantRow }])}
                className="flex items-center gap-1 text-sm font-medium text-[#FF6B35] hover:underline"
              >
                <Plus className="h-4 w-4" /> Thêm phân loại
              </button>
              {variantError && <p className="text-red-500 text-xs">{variantError}</p>}
            </div>
          ) : (
            /* Price & Cost Price */
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Giá bán (đ) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.price}
                  onChange={(e) => set('price', e.target.value)}
                  placeholder="0"
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#FF6B35]/50 focus:outline-none ${
                    errors.price ? 'border-red-400' : 'border-gray-300'
                  }`}
                />
                {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giá vốn (đ)</label>
                <input
                  type="number"
                  min="0"
                  value={form.costPrice}
                  onChange={(e) => set('costPrice', e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#FF6B35]/50 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Unit & Initial Quantity */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Đơn vị tính</label>
              <input
                type="text"
                value={form.unit}
                onChange={(e) => set('unit', e.target.value)}
                placeholder="cái"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#FF6B35]/50 focus:outline-none"
              />
            </div>
            {!hasVariants && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tồn kho ban đầu</label>
                <input
                  type="number"
                  min="0"
                  value={form.initialQuantity}
                  onChange={(e) => set('initialQuantity', e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#FF6B35]/50 focus:outline-none"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hình ảnh sản phẩm</label>
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-5 text-center hover:border-[#FF6B35] hover:bg-orange-50 transition-colors">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Xem trước ảnh sản phẩm"
                  className="mb-3 h-28 w-28 rounded-xl object-cover shadow-sm"
                />
              ) : (
                <div className="mb-3 flex h-28 w-28 items-center justify-center rounded-xl bg-white text-sm text-gray-400">
                  Chưa có ảnh
                </div>
              )}
              <span className="text-sm font-medium text-gray-700">
                Chọn ảnh hoặc chụp từ điện thoại
              </span>
              <span className="mt-1 text-xs text-gray-400">
                JPG, PNG, WEBP tối đa 5MB
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
            {selectedImage && (
              <button
                type="button"
                onClick={handleOcrScan}
                disabled={scanning}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-[#FF6B35] py-2 text-sm font-medium text-[#FF6B35] hover:bg-orange-50 disabled:opacity-60 transition-colors"
              >
                {scanning ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ScanText className="h-4 w-4" />
                )}
                {scanning ? 'Đang quét ảnh...' : 'Quét tên + giá từ ảnh (OCR)'}
              </button>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
            <select
              value={form.status}
              onChange={(e) => set('status', e.target.value as 'active' | 'inactive')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#FF6B35]/50 focus:outline-none bg-white"
            >
              <option value="active">Đang bán</option>
              <option value="inactive">Ngừng bán</option>
            </select>
          </div>

          {/* Footer buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors text-sm"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 bg-gradient-to-r from-[#FF6B35] to-[#FF9046] text-white shadow-md shadow-orange-500/25 rounded-xl font-medium hover:from-[#F0561D] hover:to-[#FF813A] disabled:opacity-60 disabled:cursor-not-allowed transition-colors text-sm flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? 'Đang lưu...' : 'Thêm sản phẩm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ---------- OCR Bulk Import Modal ---------- */
interface OcrImportRow {
  selected: boolean;
  name: string;
  price: string;
  initialQuantity: string;
}

interface OcrImportModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function OcrImportModal({ onClose, onSuccess }: OcrImportModalProps) {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [rows, setRows] = useState<OcrImportRow[]>([]);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedImage(file);
    setScanned(false);
    setRows([]);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
  };

  const handleScan = async () => {
    if (!selectedImage) return;
    setScanning(true);
    try {
      const result = await ocrScanImage(selectedImage);
      const found = result.candidates.filter((c) => c.name);
      setRows(
        found.map((c) => ({
          selected: true,
          name: c.name,
          price: c.price !== null ? String(c.price) : '',
          initialQuantity: '0',
        })),
      );
      setScanned(true);
      if (found.length === 0) {
        toast.error('Không nhận diện được sản phẩm nào. Thử chụp gần và rõ hơn.');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Quét ảnh thất bại');
    } finally {
      setScanning(false);
    }
  };

  const setRow = (index: number, patch: Partial<OcrImportRow>) => {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const selectedRows = rows.filter((r) => r.selected);
  const importable = selectedRows.filter(
    (r) => r.name.trim() && Number(r.price) > 0,
  );

  const handleImport = async () => {
    if (importable.length === 0) {
      toast.error('Chưa có dòng hợp lệ nào được chọn (cần tên + giá > 0)');
      return;
    }
    setImporting(true);
    let ok = 0;
    let fail = 0;
    for (const row of importable) {
      try {
        await apiFetch('/products', {
          method: 'POST',
          body: JSON.stringify({
            name: row.name.trim(),
            price: Number(row.price),
            unit: 'cái',
            status: 'active',
            initialQuantity: Number(row.initialQuantity) || 0,
          }),
        });
        ok++;
      } catch {
        fail++;
      }
    }
    setImporting(false);
    if (ok > 0) {
      toast.success(`Đã import ${ok} sản phẩm${fail > 0 ? `, ${fail} lỗi` : ''}`);
      onSuccess();
      onClose();
    } else {
      toast.error('Import thất bại toàn bộ. Kiểm tra dữ liệu và thử lại.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-bold">Import sản phẩm từ ảnh (OCR)</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Image picker + scan */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <label className="flex flex-1 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-5 text-center hover:border-[#FF6B35] hover:bg-orange-50 transition-colors">
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt="Ảnh cần quét" className="mb-2 max-h-40 rounded-xl object-contain" />
              ) : (
                <Camera className="mb-2 h-10 w-10 text-gray-300" />
              )}
              <span className="text-sm font-medium text-gray-700">
                {selectedImage ? 'Chọn ảnh khác' : 'Chụp / chọn ảnh hóa đơn, danh sách sản phẩm'}
              </span>
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
            {selectedImage && (
              <button
                type="button"
                onClick={handleScan}
                disabled={scanning}
                className="flex items-center justify-center gap-2 rounded-xl bg-[#FF6B35] px-5 py-3 text-sm font-medium text-white hover:from-[#F0561D] hover:to-[#FF813A] disabled:opacity-60 transition-colors"
              >
                {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanText className="h-4 w-4" />}
                {scanning ? 'Đang quét...' : 'Quét ảnh'}
              </button>
            )}
          </div>

          {/* Result rows */}
          {scanned && rows.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-gray-500">
                    <th className="py-2 pr-2">
                      <input
                        type="checkbox"
                        checked={rows.every((r) => r.selected)}
                        onChange={(e) =>
                          setRows((prev) => prev.map((r) => ({ ...r, selected: e.target.checked })))
                        }
                        className="accent-[#FF6B35]"
                      />
                    </th>
                    <th className="py-2 pr-2">Tên sản phẩm</th>
                    <th className="py-2 pr-2 w-32">Giá bán (đ)</th>
                    <th className="py-2 w-24">SL nhập kho</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2 pr-2">
                        <input
                          type="checkbox"
                          checked={row.selected}
                          onChange={(e) => setRow(i, { selected: e.target.checked })}
                          className="accent-[#FF6B35]"
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <input
                          type="text"
                          value={row.name}
                          onChange={(e) => setRow(i, { name: e.target.value })}
                          className="w-full rounded-lg border px-2 py-1.5"
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <input
                          type="number"
                          min="0"
                          value={row.price}
                          onChange={(e) => setRow(i, { price: e.target.value })}
                          className="w-full rounded-lg border px-2 py-1.5"
                        />
                      </td>
                      <td className="py-2">
                        <input
                          type="number"
                          min="0"
                          value={row.initialQuantity}
                          onChange={(e) => setRow(i, { initialQuantity: e.target.value })}
                          className="w-full rounded-lg border px-2 py-1.5"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="p-4 border-t flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={importing}
            className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors text-sm"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={importing || importable.length === 0}
            className="flex-1 py-2.5 bg-gradient-to-r from-[#FF6B35] to-[#FF9046] text-white shadow-md shadow-orange-500/25 rounded-xl font-medium hover:from-[#F0561D] hover:to-[#FF813A] disabled:opacity-60 disabled:cursor-not-allowed transition-colors text-sm flex items-center justify-center gap-2"
          >
            {importing && <Loader2 className="h-4 w-4 animate-spin" />}
            {importing ? 'Đang import...' : `Import ${importable.length} sản phẩm`}
          </button>
        </div>
      </div>
    </div>
  );
}

interface EditProductModalProps {
  product: Product;
  categories: Category[];
  canDelete: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function EditProductModal({
  product,
  categories,
  canDelete,
  onClose,
  onSuccess,
}: EditProductModalProps) {
  const [form, setForm] = useState<ProductFormData>({
    name: product.name,
    sku: product.sku ?? '',
    barcode: product.barcode ?? '',
    categoryId: product.categoryId ?? '',
    price: String(product.price ?? ''),
    costPrice:
      product.costPrice !== null && product.costPrice !== undefined
        ? String(product.costPrice)
        : '',
    unit: product.unit ?? 'cái',
    initialQuantity: String(product.inventory?.[0]?.quantity ?? 0),
    status: product.status === 'inactive' ? 'inactive' : 'active',
  });
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof ProductFormData, string>>>({});
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    resolveAssetUrl(product.images?.[0]?.url) ?? null,
  );

  const handleDelete = async () => {
    if (!window.confirm(`Xóa sản phẩm "${product.name}"? Sản phẩm sẽ không còn hiển thị trong danh sách và POS.`)) {
      return;
    }
    setDeleting(true);
    try {
      await apiFetch(`/products/${product.id}`, { method: 'DELETE' });
      toast.success('Đã xóa sản phẩm');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể xóa sản phẩm');
      setDeleting(false);
    }
  };

  useEffect(() => {
    return () => {
      if (selectedImage && previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl, selectedImage]);

  const set = (field: keyof ProductFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const nextErrors: Partial<Record<keyof ProductFormData, string>> = {};

    if (!form.name.trim()) nextErrors.name = 'Tên sản phẩm không được để trống';
    if (!form.price.trim() || Number(form.price) <= 0) {
      nextErrors.price = 'Giá bán phải lớn hơn 0';
    }
    if (Number(form.initialQuantity) < 0) {
      nextErrors.initialQuantity = 'Tồn kho không được âm';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedImage(file);

    if (previewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl(file ? URL.createObjectURL(file) : resolveAssetUrl(product.images?.[0]?.url));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      await apiFetch(`/products/${product.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: form.name.trim(),
          sku: form.sku.trim() || undefined,
          barcode: form.barcode.trim() || undefined,
          categoryId: form.categoryId || null,
          price: Number(form.price),
          costPrice: form.costPrice.trim() ? Number(form.costPrice) : undefined,
          unit: form.unit.trim() || 'cái',
          status: form.status,
        }),
      });

      const targetQuantity = Number(form.initialQuantity) || 0;
      const currentInventory = product.inventory ?? [];
      if (currentInventory.length === 1 && currentInventory[0].quantity !== targetQuantity) {
        await apiFetch('/inventory/adjustment', {
          method: 'POST',
          body: JSON.stringify({
            productId: product.id,
            variantId: currentInventory[0].variantId ?? undefined,
            newQuantity: targetQuantity,
            notes: 'Cập nhật tồn kho từ màn hình sản phẩm',
          }),
        });
      }

      if (selectedImage) {
        const formData = new FormData();
        formData.append('image', selectedImage);
        await apiFetch(`/products/${product.id}/images`, {
          method: 'POST',
          body: formData,
        });
      }

      toast.success('Cập nhật sản phẩm thành công');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể cập nhật sản phẩm');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-bold">Chỉnh sửa sản phẩm</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên sản phẩm</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#FF6B35]/50 focus:outline-none ${
                errors.name ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
              <input
                type="text"
                value={form.sku}
                onChange={(e) => set('sku', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#FF6B35]/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Barcode</label>
              <input
                type="text"
                value={form.barcode}
                onChange={(e) => set('barcode', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#FF6B35]/50 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Giá bán</label>
              <input
                type="number"
                min="1"
                value={form.price}
                onChange={(e) => set('price', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#FF6B35]/50 focus:outline-none ${
                  errors.price ? 'border-red-400' : 'border-gray-300'
                }`}
              />
              {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Giá vốn</label>
              <input
                type="number"
                min="0"
                value={form.costPrice}
                onChange={(e) => set('costPrice', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#FF6B35]/50 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Đơn vị tính</label>
              <input
                type="text"
                value={form.unit}
                onChange={(e) => set('unit', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#FF6B35]/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tồn kho</label>
              <input
                type="number"
                min="0"
                value={form.initialQuantity}
                onChange={(e) => set('initialQuantity', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#FF6B35]/50 focus:outline-none ${
                  errors.initialQuantity ? 'border-red-400' : 'border-gray-300'
                }`}
                disabled={(product.inventory?.length ?? 0) > 1}
              />
              {(product.inventory?.length ?? 0) > 1 && (
                <p className="text-xs text-amber-600 mt-1">Sản phẩm có biến thể, chỉnh tồn kho ở màn hình kho hàng.</p>
              )}
              {errors.initialQuantity && (
                <p className="text-red-500 text-xs mt-1">{errors.initialQuantity}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
            <select
              value={form.categoryId}
              onChange={(e) => set('categoryId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#FF6B35]/50 focus:outline-none bg-white"
            >
              <option value="">-- Chọn danh mục --</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hình ảnh sản phẩm</label>
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-5 text-center hover:border-[#FF6B35] hover:bg-orange-50 transition-colors">
              {previewUrl ? (
                <img src={previewUrl} alt={product.name} className="mb-3 h-28 w-28 rounded-xl object-cover shadow-sm" />
              ) : (
                <div className="mb-3 flex h-28 w-28 items-center justify-center rounded-xl bg-white text-sm text-gray-400">
                  Chưa có ảnh
                </div>
              )}
              <span className="text-sm font-medium text-gray-700">Chọn ảnh mới hoặc chụp từ điện thoại</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
            <select
              value={form.status}
              onChange={(e) => set('status', e.target.value as 'active' | 'inactive')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#FF6B35]/50 focus:outline-none bg-white"
            >
              <option value="active">Đang bán</option>
              <option value="inactive">Ngừng bán</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            {canDelete && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting || submitting}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 border border-red-300 text-red-600 rounded-xl font-medium hover:bg-red-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors text-sm"
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                {deleting ? 'Đang xóa...' : 'Xóa'}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors text-sm"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting || deleting}
              className="flex-1 py-2.5 bg-gradient-to-r from-[#FF6B35] to-[#FF9046] text-white shadow-md shadow-orange-500/25 rounded-xl font-medium hover:from-[#F0561D] hover:to-[#FF813A] disabled:opacity-60 disabled:cursor-not-allowed transition-colors text-sm flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ---------- Main Page ---------- */
export default function ProductsPage() {
  const user = useAuthStore((state) => state.user);
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showOcrModal, setShowOcrModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const canCreateProducts = hasPermission(user, 'products:create');
  const canUpdateProducts = hasPermission(user, 'products:update');
  const canDeleteProducts = hasPermission(user, 'products:delete');

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ---------- Fetch products ---------- */
  const fetchProducts = useCallback(async (q?: string) => {
    setLoading(true);
    try {
      const query = q?.trim();
      const url = query
        ? `/products?page=1&limit=50&search=${encodeURIComponent(query)}`
        : `/products?page=1&limit=50`;
      const res = await apiFetch<ProductsResponse | Product[]>(url);
      const list = Array.isArray(res) ? res : (res as ProductsResponse).data ?? [];
      setProducts(list);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể tải danh sách sản phẩm');
    } finally {
      setLoading(false);
    }
  }, []);

  /* ---------- Fetch categories ---------- */
  useEffect(() => {
    apiFetch<Category[]>('/categories')
      .then((res) => setCategories(Array.isArray(res) ? res : []))
      .catch(() => {});
  }, []);

  /* ---------- Initial product load ---------- */
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  /* ---------- Debounced search ---------- */
  useEffect(() => {
    // Let the initial load effect handle the empty-search case
    if (!search) return;
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      fetchProducts(search);
    }, 400);
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [search, fetchProducts]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sản phẩm</h1>
          <p className="text-sm text-gray-500 mt-0.5">Quản lý hàng hóa và tồn kho của cửa hàng</p>
        </div>
        {canCreateProducts ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowOcrModal(true)}
              className="flex items-center gap-2 border border-[#FF6B35] text-[#FF6B35] px-4 py-2 rounded-lg hover:bg-orange-50 transition-colors font-medium"
            >
              <ScanText className="h-4 w-4" />
              <span className="hidden sm:inline">Quét từ ảnh</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-[#FF6B35] to-[#FF9046] text-white shadow-md shadow-orange-500/25 px-4 py-2 rounded-lg hover:from-[#F0561D] hover:to-[#FF813A] transition-colors font-medium"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Thêm sản phẩm</span>
            </button>
          </div>
        ) : (
          <span className="rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-500">
            Bạn chỉ có quyền xem sản phẩm
          </span>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Tìm sản phẩm theo tên, SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border rounded-lg bg-white focus:ring-2 focus:ring-[#FF6B35]/50 focus:outline-none"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            {search ? 'Không tìm thấy sản phẩm phù hợp' : 'Chưa có sản phẩm nào'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/80 text-left text-xs uppercase tracking-wider text-gray-400">
                  <th className="p-4 font-semibold">Sản phẩm</th>
                  <th className="p-4 font-semibold">SKU</th>
                  <th className="p-4 font-semibold hidden md:table-cell">Danh mục</th>
                  <th className="p-4 font-semibold text-right">Giá bán</th>
                  <th className="p-4 font-semibold text-right">Tồn kho</th>
                  <th className="p-4 font-semibold">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const stock = getStock(product);
                  const isActive = product.status === 'active';
                  return (
                    <tr
                      key={product.id}
                      className={`border-t ${
                        canUpdateProducts ? 'cursor-pointer hover:bg-orange-50/50' : ''
                      }`}
                      onClick={() => {
                        if (canUpdateProducts) {
                          setSelectedProduct(product);
                        }
                      }}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-gray-100 text-xs text-gray-400 ring-1 ring-gray-200/60">
                            {product.images?.[0]?.url ? (
                              <img
                                src={resolveAssetUrl(product.images[0].url) ?? undefined}
                                alt={product.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              'No img'
                            )}
                          </div>
                          <div>
                            <span className="font-medium">{product.name}</span>
                            {(product.variants?.length ?? 0) > 0 && (
                              <span className="ml-2 inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-[#E55A2B]">
                                {product.variants!.length} phân loại
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-gray-500">{product.sku || '—'}</td>
                      <td className="p-4 text-gray-500 hidden md:table-cell">
                        {product.category?.name || '—'}
                      </td>
                      <td className="p-4 text-right font-medium">
                        {(() => {
                          const prices = (product.variants ?? []).map((v) => Number(v.price));
                          if (prices.length === 0) return formatCurrency(product.price);
                          const min = Math.min(...prices);
                          const max = Math.max(...prices);
                          return min === max
                            ? formatCurrency(min)
                            : `${formatCurrency(min)} – ${formatCurrency(max)}`;
                        })()}
                      </td>
                      <td className={`p-4 text-right font-medium ${stock <= 5 ? 'text-red-600' : ''}`}>
                        {stock}
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            isActive
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {isActive ? 'Đang bán' : 'Ngừng bán'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <AddProductModal
          categories={categories}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => fetchProducts(search)}
        />
      )}

      {showOcrModal && (
        <OcrImportModal
          onClose={() => setShowOcrModal(false)}
          onSuccess={() => fetchProducts(search)}
        />
      )}

      {selectedProduct && canUpdateProducts && (
        <EditProductModal
          product={selectedProduct}
          categories={categories}
          canDelete={canDeleteProducts}
          onClose={() => setSelectedProduct(null)}
          onSuccess={() => fetchProducts(search)}
        />
      )}
    </div>
  );
}
