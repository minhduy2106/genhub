// Parse kết quả OCR (iOS-OCR-Server / Apple Vision) thành ứng viên sản phẩm {tên, giá}

export interface OcrBox {
  text: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface OcrLine {
  text: string;
  y: number;
  h: number;
}

export interface OcrProductCandidate {
  name: string;
  price: number | null;
}

// Gom các box cùng hàng (tâm y gần nhau) thành 1 dòng, trái → phải
export function groupBoxesIntoLines(boxes: OcrBox[]): OcrLine[] {
  const sorted = [...boxes]
    .filter((b) => b.text && b.text.trim())
    .sort((a, b) => a.y - b.y);

  const rows: OcrBox[][] = [];
  for (const box of sorted) {
    const centerY = box.y + box.h / 2;
    const row = rows.find((r) => {
      const ref = r[0];
      const refCenterY = ref.y + ref.h / 2;
      return Math.abs(centerY - refCenterY) < Math.max(ref.h, box.h) * 0.6;
    });
    if (row) row.push(box);
    else rows.push([box]);
  }

  return rows.map((row) => {
    row.sort((a, b) => a.x - b.x);
    return {
      text: row.map((b) => b.text.trim()).join(' ').trim(),
      y: row[0].y,
      h: Math.max(...row.map((b) => b.h)),
    };
  });
}

// Giá kiểu VN: "25.000", "25,000", "25000", "25k", có thể kèm đ/₫/vnd
const PRICE_TOKEN_RE =
  /(\d{1,3}(?:[.,]\d{3})+|\d+\s*[kK]\b|\d{3,9})\s*(?:đ|₫|d\b|D\b|vnd|VND|dong|đồng)?/g;

const MIN_PRICE = 500;
const MAX_PRICE = 1_000_000_000;

// Bỏ ngày tháng trước khi tìm giá — tránh nhận nhầm năm (2006, 2016...) là giá
function stripDates(text: string): string {
  return text
    .replace(/ng[àa]y\s+\d{1,2}\s+th[áa]ng\s+\d{1,2}(\s+n[ăa]m)?(\s+\d{2,4})?/gi, ' ')
    .replace(/\b\d{1,2}[/-]\d{1,2}([/-]\d{2,4})?\b/g, ' ')
    .replace(/\bn[ăa]m\s+(19|20)\d{2}\b/gi, ' ');
}

function parsePriceToken(token: string): number | null {
  const trimmed = token.trim();
  // Số 0 đứng đầu = mã số / số chứng từ, không phải giá
  if (/^0\d/.test(trimmed)) return null;

  let value: number;
  if (/[kK]\s*$/.test(trimmed)) {
    value = Number(trimmed.replace(/[kK]\s*$/, '').replace(/[.,]/g, '')) * 1000;
  } else if (/^\d+$/.test(trimmed)) {
    // Số trần không có dấu phân cách: chỉ nhận giá tròn trăm (15000, 12500...)
    // để loại năm (2016), số hóa đơn, số tài khoản
    if (!/00$/.test(trimmed)) return null;
    value = Number(trimmed);
  } else {
    value = Number(trimmed.replace(/[.,]/g, ''));
  }
  if (!Number.isFinite(value) || value < MIN_PRICE || value > MAX_PRICE) {
    return null;
  }
  return value;
}

interface LinePrices {
  cleaned: string;
  prices: number[];
}

function extractPricesFromLine(text: string): LinePrices {
  const prices: number[] = [];
  const cleaned = stripDates(text)
    .replace(PRICE_TOKEN_RE, (match, token: string) => {
      const price = parsePriceToken(token);
      if (price === null) return match;
      prices.push(price);
      return ' ';
    })
    .replace(/\b(gia|giá|price|sl|x)\s*[:.]?\s*$/i, ' ')
    // Mảnh giá bị OCR tách rời ("100 .000.000") — dọn phần ".000.000" mồ côi
    .replace(/(^|\s)[.,]\d{3}(?:[.,]\d{3})*(?=\s|$)/g, ' ')
    .replace(/[|:;•·()]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return { cleaned, prices };
}

// Dòng tổng kết trên hóa đơn — không phải sản phẩm
const SUMMARY_LINE_RE =
  /\b(tong|tổng|total|thanh tien|thành tiền|tam tinh|tạm tính|giam gia|giảm giá|chiet khau|chiết khấu|vat|thue|thuế|tien thua|tiền thừa|tien khach|tiền khách|phai tra|phải trả|con lai|còn lại|sub ?total|discount)\b/i;

// Dòng boilerplate của biểu mẫu kế toán (phiếu nhập/xuất kho, hóa đơn GTGT...)
const FORM_LINE_RE =
  /(phi[ếe]u\s+(nh[ậa]p|xu[ấa]t|thu|chi)|m[ẫa]u\s+s[ốo]|ban\s+h[àa]nh|quy[ếe]t\s+[đd][ịi]nh|b[ộo]\s+tr[ưu][ởo]ng|btc\b|q[đd][- ]|(n[ợo]|c[óo])\s*tk|t[àa]i\s+kho[ảa]n|h[đd]gtgt|h[óo][áa]?\s*[đd][ơo]n|ch[ứu]ng\s+t[ừu]|k[èe]m\s+theo|vi[ếe]t\s+b[ằa]ng\s+ch[ữu]|h[ọo]\s+v[àa]\s+t[êe]n|ng[ưu][ờo]i\s+(giao|nh[ậa]n|l[ậa]p|mua|b[áa]n)|th[ủu]\s+kho|k[ếe]\s+to[áa]n|gi[áa]m\s+[đd][ốo]c|[đd][ơo]n\s+v[ịi]\s*:|b[ộo]\s+ph[ậa]n|[đd][ịi]a\s+([đd]i[ểe]m|ch[ỉi])|nh[ậa]p\s+t[ạa]i\s+kho|s[ốo]\s*:|ng[àa]y\s+\d{1,2}\s+th[áa]ng)/i;

// Dọn tên ứng viên: bỏ số thứ tự đầu dòng và các cụm số lượng/mã thừa cuối dòng
function cleanCandidateName(name: string): string {
  return name
    .replace(/^\d{1,3}[.)]?\s+/, '')
    .replace(/(\s+\d+)+\s*$/, '')
    .trim();
}

// Ghép dòng OCR thành ứng viên sản phẩm:
// - Dòng có giá: tên = phần chữ còn lại; nếu trống thì lấy dòng chữ ngay trước đó
// - Dòng chỉ có chữ: để dành làm tên cho dòng giá kế tiếp
export function extractProductCandidates(lines: OcrLine[]): OcrProductCandidate[] {
  const candidates: OcrProductCandidate[] = [];
  let pendingName: string | null = null;

  for (const line of lines) {
    if (SUMMARY_LINE_RE.test(line.text) || FORM_LINE_RE.test(line.text)) {
      pendingName = null;
      continue;
    }

    const { cleaned, prices } = extractPricesFromLine(line.text);

    if (prices.length === 0) {
      if (cleaned.length >= 2) pendingName = cleaned;
      continue;
    }

    // Dòng dạng bảng có nhiều số tiền (đơn giá + thành tiền) → đơn giá là số nhỏ nhất
    const price = Math.min(...prices);
    const name = cleanCandidateName(
      cleaned.length >= 2 ? cleaned : pendingName ?? '',
    );
    if (name) {
      candidates.push({ name, price });
      pendingName = null;
    } else {
      candidates.push({ name: '', price });
    }
  }

  // Ảnh chỉ có chữ không có giá (vd nhãn không in giá) → vẫn trả tên
  if (candidates.length === 0 && pendingName) {
    candidates.push({ name: pendingName, price: null });
  }

  return candidates;
}
