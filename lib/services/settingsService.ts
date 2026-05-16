import { getSettings, updateSettings } from '@/lib/repositories/settingsRepo';
import { validateAndNormalizeSettings } from '@/lib/validators/settings';

export async function getSystemSettings() {
  return getSettings();
}

export async function updateSystemSettings(payload: unknown) {
  const normalized = validateAndNormalizeSettings(payload);
  return updateSettings(normalized);
}
