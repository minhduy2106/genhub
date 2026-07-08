// Sinh chuỗi VietQR (chuẩn EMVCo / NAPAS 247) hoàn toàn offline.
// Quét được bằng mọi app ngân hàng VN hỗ trợ chuyển nhanh Napas 247.

export interface BankSettings {
  bin: string;
  accountNumber: string;
  accountName: string;
}

export interface VietQRBank {
  bin: string;
  shortName: string;
  name: string;
}

export const VIETQR_BANKS: VietQRBank[] = [
  { bin: '970436', shortName: 'Vietcombank', name: 'Ngân hàng TMCP Ngoại Thương Việt Nam' },
  { bin: '970415', shortName: 'VietinBank', name: 'Ngân hàng TMCP Công Thương Việt Nam' },
  { bin: '970418', shortName: 'BIDV', name: 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam' },
  { bin: '970405', shortName: 'Agribank', name: 'Ngân hàng NN&PTNT Việt Nam' },
  { bin: '970407', shortName: 'Techcombank', name: 'Ngân hàng TMCP Kỹ Thương Việt Nam' },
  { bin: '970422', shortName: 'MB Bank', name: 'Ngân hàng TMCP Quân Đội' },
  { bin: '970416', shortName: 'ACB', name: 'Ngân hàng TMCP Á Châu' },
  { bin: '970432', shortName: 'VPBank', name: 'Ngân hàng TMCP Việt Nam Thịnh Vượng' },
  { bin: '970423', shortName: 'TPBank', name: 'Ngân hàng TMCP Tiên Phong' },
  { bin: '970403', shortName: 'Sacombank', name: 'Ngân hàng TMCP Sài Gòn Thương Tín' },
  { bin: '970441', shortName: 'VIB', name: 'Ngân hàng TMCP Quốc tế Việt Nam' },
  { bin: '970443', shortName: 'SHB', name: 'Ngân hàng TMCP Sài Gòn - Hà Nội' },
  { bin: '970437', shortName: 'HDBank', name: 'Ngân hàng TMCP Phát triển TP.HCM' },
  { bin: '970426', shortName: 'MSB', name: 'Ngân hàng TMCP Hàng Hải' },
  { bin: '970448', shortName: 'OCB', name: 'Ngân hàng TMCP Phương Đông' },
  { bin: '970431', shortName: 'Eximbank', name: 'Ngân hàng TMCP Xuất Nhập khẩu Việt Nam' },
  { bin: '970440', shortName: 'SeABank', name: 'Ngân hàng TMCP Đông Nam Á' },
  { bin: '970449', shortName: 'LPBank', name: 'Ngân hàng TMCP Lộc Phát Việt Nam' },
  { bin: '970454', shortName: 'VietCapitalBank', name: 'Ngân hàng TMCP Bản Việt' },
  { bin: '970429', shortName: 'SCB', name: 'Ngân hàng TMCP Sài Gòn' },
];

export function bankShortName(bin: string): string {
  return VIETQR_BANKS.find((b) => b.bin === bin)?.shortName ?? bin;
}

// TLV: tag(2) + length(2, zero-padded) + value
function tlv(tag: string, value: string): string {
  return `${tag}${value.length.toString().padStart(2, '0')}${value}`;
}

// CRC-16/CCITT-FALSE (poly 0x1021, init 0xFFFF) — theo spec EMVCo
function crc16(input: string): string {
  let crc = 0xffff;
  for (let i = 0; i < input.length; i++) {
    crc ^= input.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

// Nội dung chuyển khoản chỉ nhận ASCII: bỏ dấu tiếng Việt, lọc ký tự lạ
function toQrMemo(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^A-Za-z0-9 .\-_]/g, '')
    .trim()
    .slice(0, 25);
}

export interface VietQRParams {
  bankBin: string;
  accountNumber: string;
  amount?: number;
  memo?: string;
}

export function buildVietQRPayload({ bankBin, accountNumber, amount, memo }: VietQRParams): string {
  const beneficiary = tlv('00', bankBin) + tlv('01', accountNumber);
  const merchantAccount =
    tlv('00', 'A000000727') + tlv('01', beneficiary) + tlv('02', 'QRIBFTTA');

  const hasAmount = amount !== undefined && amount > 0;
  const cleanMemo = memo ? toQrMemo(memo) : '';

  let payload =
    tlv('00', '01') +
    tlv('01', hasAmount ? '12' : '11') +
    tlv('38', merchantAccount) +
    tlv('53', '704') +
    (hasAmount ? tlv('54', String(Math.round(amount))) : '') +
    tlv('58', 'VN') +
    (cleanMemo ? tlv('62', tlv('08', cleanMemo)) : '');

  payload += '6304';
  return payload + crc16(payload);
}
