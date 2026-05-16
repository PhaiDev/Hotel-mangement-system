export interface SystemSettings {
  id: number;
  hotelName: string;
  hotelAddress: string;
  hotelPhone: string | null;
  taxId: string | null;
  vatEnabled: boolean;
  vatPercent: number;
  priceDaily: number;
  priceTemporary: number;
  lineNotifyToken: string | null;
  allowOverbooking: boolean;
  createdAt: string;
  updatedAt: string;
}

export type SettingsUpdateInput = Partial<Omit<SystemSettings, 'id' | 'createdAt' | 'updatedAt'>>;
