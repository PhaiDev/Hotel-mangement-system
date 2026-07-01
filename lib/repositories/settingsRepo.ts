import { supabaseAdmin } from '@/lib/supabase/admin';
import type { SettingsUpdateInput, SystemSettings } from '@/lib/types/settings';

const SETTINGS_TABLE = 'SystemSettings';

const defaultSettings = {
  hotelName: 'ZUMOTEL BOUTIQUE',
  hotelAddress: '-',
  hotelPhone: null,
  taxId: null,
  vatEnabled: true,
  vatPercent: 7,
  priceDaily: 500,
  priceTemporary: 300,
  lineOaChannelAccessToken: null,
  lineOaRecipientId: null,
  allowOverbooking: false,
};

export async function getSettings(): Promise<SystemSettings> {
  const { data, error } = await supabaseAdmin
    .from(SETTINGS_TABLE)
    .select('*')
    .order('id', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);

  if (data) return data as SystemSettings;

  const { data: created, error: createError } = await supabaseAdmin
    .from(SETTINGS_TABLE)
    .insert([defaultSettings])
    .select('*')
    .single();

  if (createError) throw new Error(createError.message);
  return created as SystemSettings;
}

export async function updateSettings(input: SettingsUpdateInput): Promise<SystemSettings> {
  const current = await getSettings();

  const { data, error } = await supabaseAdmin
    .from(SETTINGS_TABLE)
    .update(input)
    .eq('id', current.id)
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return data as SystemSettings;
}
