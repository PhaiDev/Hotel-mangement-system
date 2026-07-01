
import type { SettingsUpdateInput } from '@/lib/types/settings';

const asStringOrNull = (value: unknown): string | null => {
  if (value === null || value === undefined) return null;
  const str = String(value).trim();
  return str.length > 0 ? str : null;
};

const asNumber = (value: unknown, fallback: number): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

export function validateAndNormalizeSettings(payload: unknown): SettingsUpdateInput {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid payload');
  }

  const body = payload as Record<string, unknown>;
  const hotelName = asStringOrNull(body.hotelName);
  const hotelAddress = asStringOrNull(body.hotelAddress);

  if (!hotelName) throw new Error('hotelName is required');
  if (!hotelAddress) throw new Error('hotelAddress is required');

  const vatPercent = asNumber(body.vatPercent, 7);
  const priceDaily = asNumber(body.priceDaily, 500);
  const priceTemporary = asNumber(body.priceTemporary, 300);

  if (vatPercent < 0) throw new Error('vatPercent must be >= 0');
  if (priceDaily < 0) throw new Error('priceDaily must be >= 0');
  if (priceTemporary < 0) throw new Error('priceTemporary must be >= 0');

  return {
    hotelName,
    hotelAddress,
    hotelPhone: asStringOrNull(body.hotelPhone),
    taxId: asStringOrNull(body.taxId),
    vatEnabled: Boolean(body.vatEnabled),
    vatPercent,
    priceDaily,
    priceTemporary,
    lineOaChannelAccessToken: asStringOrNull(body.lineOaChannelAccessToken),
    lineOaRecipientId: asStringOrNull(body.lineOaRecipientId),
    allowOverbooking: Boolean(body.allowOverbooking),
  };
}
