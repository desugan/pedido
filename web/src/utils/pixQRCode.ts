import QRCode from 'qrcode';

function pixKeyType(key: string): string {
  const digits = key.replace(/\D/g, '');
  if (digits.length === 11) return '01';
  if (digits.length === 14) return '02';
  if (/^\+?\d[\d\s()-]{7,}$/.test(key)) return '03';
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(key)) return '04';
  return '05';
}

function tlv(tag: string, value: string): string {
  const len = String(value.length).padStart(2, '0');
  return tag + len + value;
}

function crc16CCITT(str: string): string {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
    }
  }
  return (crc & 0xffff).toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Gera payload BR Code (EMV®) para PIX.
 * @param key - Chave PIX
 * @param amount - Valor em reais
 * @param name - Nome do recebedor
 * @param city - Cidade do recebedor
 * @returns String do payload BR Code
 */
export function generatePixPayload(key: string, amount?: number, name?: string, city?: string): string {
  const merchantInfo = '0014br.gov.bcb.pix' + tlv(pixKeyType(key), key);

  const parts: string[] = [];
  parts.push('000201');
  parts.push(amount !== undefined ? '010212' : '010211');
  parts.push(tlv('26', merchantInfo));
  parts.push('52040000');
  parts.push('5303986');
  if (amount !== undefined) {
    parts.push(tlv('54', amount.toFixed(2)));
  }
  parts.push('5802BR');
  parts.push(tlv('59', (name || '').substring(0, 25).toUpperCase()));
  parts.push(tlv('60', (city || '').substring(0, 15).toUpperCase()));
  parts.push(tlv('62', tlv('05', '***')));

  const withoutCrc = parts.join('');
  const crc = crc16CCITT(withoutCrc + '6304');
  return withoutCrc + '6304' + crc;
}

/**
 * Gera QR Code PIX como data URL.
 * @param key - Chave PIX
 * @param amount - Valor em reais
 * @param name - Nome do recebedor
 * @param city - Cidade do recebedor
 * @returns Data URL da imagem QR Code
 */
export async function generatePixQRCode(key: string, amount?: number, name?: string, city?: string): Promise<string> {
  const payload = generatePixPayload(key, amount, name, city);
  return await QRCode.toDataURL(payload, { width: 256, margin: 2 });
}
