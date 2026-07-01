'use client';

import React, { useEffect, useState } from 'react';
import { Save, Building2, Receipt, BellRing, Coins, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { SwalStyled } from '@/lib/swalTheme'; // for simple success alerts

const DEFAULT_SETTINGS = {
  hotelName: 'ZUMOTEL BOUTIQUE',
  hotelAddress: '-',
  hotelPhone: '',
  taxId: '',
  vatEnabled: true,
  vatPercent: 7,
  priceDaily: 500,
  priceTemporary: 300,
  lineOaChannelAccessToken: '',
  lineOaRecipientId: '',
  allowOverbooking: false,
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'pricing' | 'notifications' | 'advanced'>('general');
  const [formData, setFormData] = useState(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/settings', { method: 'GET' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'โหลดข้อมูลตั้งค่าไม่สำเร็จ');
      if (json?.data) {
        setFormData({
          hotelName: json.data.hotelName ?? DEFAULT_SETTINGS.hotelName,
          hotelAddress: json.data.hotelAddress ?? DEFAULT_SETTINGS.hotelAddress,
          hotelPhone: json.data.hotelPhone ?? '',
          taxId: json.data.taxId ?? '',
          vatEnabled: Boolean(json.data.vatEnabled),
          vatPercent: Number(json.data.vatPercent ?? DEFAULT_SETTINGS.vatPercent),
          priceDaily: Number(json.data.priceDaily ?? DEFAULT_SETTINGS.priceDaily),
          priceTemporary: Number(json.data.priceTemporary ?? DEFAULT_SETTINGS.priceTemporary),
          lineOaChannelAccessToken: json.data.lineOaChannelAccessToken ?? '',
          lineOaRecipientId: json.data.lineOaRecipientId ?? '',
          allowOverbooking: Boolean(json.data.allowOverbooking),
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'โหลดข้อมูลตั้งค่าไม่สำเร็จ';
      SwalStyled.fire('ล้มเหลว', message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'อัปเดตการตั้งค่าไม่สำเร็จ');
      if (json?.data) {
        setFormData({
          hotelName: json.data.hotelName ?? DEFAULT_SETTINGS.hotelName,
          hotelAddress: json.data.hotelAddress ?? DEFAULT_SETTINGS.hotelAddress,
          hotelPhone: json.data.hotelPhone ?? '',
          taxId: json.data.taxId ?? '',
          vatEnabled: Boolean(json.data.vatEnabled),
          vatPercent: Number(json.data.vatPercent ?? DEFAULT_SETTINGS.vatPercent),
          priceDaily: Number(json.data.priceDaily ?? DEFAULT_SETTINGS.priceDaily),
          priceTemporary: Number(json.data.priceTemporary ?? DEFAULT_SETTINGS.priceTemporary),
          lineOaChannelAccessToken: json.data.lineOaChannelAccessToken ?? '',
          lineOaRecipientId: json.data.lineOaRecipientId ?? '',
          allowOverbooking: Boolean(json.data.allowOverbooking),
        });
      }
      setIsSaving(false);
      SwalStyled.fire({ icon: 'success', title: 'บันทึกสำเร็จ!', text: 'อัปเดตการตั้งค่าระบบเรียบร้อยแล้ว', timer: 1500, showConfirmButton: false });
    } catch (err) {
      setIsSaving(false);
      const message = err instanceof Error ? err.message : 'อัปเดตการตั้งค่าไม่สำเร็จ';
      SwalStyled.fire('ล้มเหลว', message, 'error');
    }
  };

  const tabs = [
    { id: 'general', label: 'ข้อมูลทั่วไป', icon: Building2 },
    { id: 'pricing', label: 'ราคาและภาษี', icon: Coins },
    { id: 'notifications', label: 'การแจ้งเตือน', icon: BellRing },
    { id: 'advanced', label: 'ขั้นสูง', icon: ShieldAlert },
  ] as const;

  return (
    <div className="animate-in fade-in duration-500 max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="bg-white border border-[#e2e0d8] rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#c9440f] opacity-5 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />

        <div>
          <h1 className="text-2xl font-bold text-[#1a1916] flex items-center gap-2">
            <span className="w-10 h-10 rounded-full bg-[#1a1916] text-white flex items-center justify-center shadow-md">
              {/* <Settings className="w-5 h-5" /> */}
            </span>
            ตั้งค่าระบบ (System Settings)
          </h1>
          <p className="text-[#8a8780] text-[13px] mt-2 max-w-lg leading-relaxed">
            ปรับแต่งข้อมูลโรงแรม ราคาเริ่มต้น และการเชื่อมต่อระบบภายนอกได้ที่นี่
            <span className="inline-block ml-2 px-2 py-0.5 rounded-full bg-[#eaf5ef] text-[#1a7a4a] text-[10px] font-bold">DATABASE MODE</span>
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving || isLoading}
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#c9440f] text-white text-[14px] font-bold shadow-lg shadow-[#c9440f]/20 hover:bg-[#b03b0d] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {(isSaving || isLoading) ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
          บันทึกการตั้งค่า
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">

        {/* Sidebar Tabs */}
        <div className="w-full lg:w-[240px] flex-shrink-0">
          <div className="bg-white border border-[#e2e0d8] rounded-2xl p-3 flex lg:flex-col gap-1 overflow-x-auto no-scrollbar shadow-sm">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-bold transition-all whitespace-nowrap ${isActive
                      ? 'bg-[#1a1916] text-white shadow-md'
                      : 'text-[#8a8780] hover:bg-[#fafaf8] hover:text-[#1a1916]'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white border border-[#e2e0d8] rounded-2xl shadow-sm overflow-hidden min-h-[400px]">

          {/* GENERAL TAB */}
          {activeTab === 'general' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 sm:p-8 space-y-6">
              <h2 className="text-[16px] font-bold text-[#1a1916] flex items-center gap-2 mb-6 border-b border-[#e2e0d8] pb-4">
                <Building2 className="w-5 h-5 text-[#c9440f]" /> ข้อมูลโรงแรม (Hotel Information)
              </h2>

              <div className="space-y-4 max-w-2xl">
                <div>
                  <label className="block text-[12px] font-bold text-[#8a8780] uppercase mb-1.5">ชื่อโรงแรม / ที่พัก *</label>
                  <input
                    type="text"
                    value={formData.hotelName}
                    onChange={(e) => setFormData({ ...formData, hotelName: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-[#e2e0d8] bg-[#fcfbf9] focus:bg-white focus:border-[#c9440f] focus:ring-2 focus:ring-[#c9440f]/20 outline-none transition-all text-[14px] font-bold text-[#1a1916]"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-[#8a8780] uppercase mb-1.5">ที่อยู่สำหรับออกใบเสร็จ *</label>
                  <textarea
                    rows={3}
                    value={formData.hotelAddress}
                    onChange={(e) => setFormData({ ...formData, hotelAddress: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-[#e2e0d8] bg-[#fcfbf9] focus:bg-white focus:border-[#c9440f] focus:ring-2 focus:ring-[#c9440f]/20 outline-none transition-all text-[14px] text-[#1a1916] resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-bold text-[#8a8780] uppercase mb-1.5">เบอร์โทรศัพท์ส่วนกลาง</label>
                    <input
                      type="text"
                      value={formData.hotelPhone}
                      onChange={(e) => setFormData({ ...formData, hotelPhone: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-[#e2e0d8] bg-[#fcfbf9] focus:bg-white focus:border-[#c9440f] outline-none transition-all text-[14px] font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold text-[#8a8780] uppercase mb-1.5">เลขประจำตัวผู้เสียภาษี</label>
                    <input
                      type="text"
                      value={formData.taxId}
                      onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-[#e2e0d8] bg-[#fcfbf9] focus:bg-white focus:border-[#c9440f] outline-none transition-all text-[14px] font-mono tracking-widest"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* PRICING TAB */}
          {activeTab === 'pricing' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 sm:p-8 space-y-6">
              <h2 className="text-[16px] font-bold text-[#1a1916] flex items-center gap-2 mb-6 border-b border-[#e2e0d8] pb-4">
                <Coins className="w-5 h-5 text-[#c9440f]" /> ตั้งค่าราคาเริ่มต้น (Base Pricing)
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
                {/* Daily Price */}
                <div className="bg-[#fafaf8] p-5 rounded-2xl border border-[#e2e0d8]">
                  <div className="text-[13px] font-bold text-[#1a1916] mb-1">ราคาจองรายวัน (ต่อคืน)</div>
                  <div className="text-[11px] text-[#8a8780] mb-4">ราคาพื้นฐานที่จะถูกดึงไปใช้เวลาพนักงานกดสร้างการจองใหม่แบบค้างคืน</div>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8a8780] font-bold">฿</span>
                    <input
                      type="number"
                      value={formData.priceDaily}
                      onChange={(e) => setFormData({ ...formData, priceDaily: Number(e.target.value) })}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#d0cdc2] bg-white outline-none focus:border-[#c9440f] text-[16px] font-mono font-bold text-[#c9440f]"
                    />
                  </div>
                </div>

                {/* Temp Price */}
                <div className="bg-[#fafaf8] p-5 rounded-2xl border border-[#e2e0d8]">
                  <div className="text-[13px] font-bold text-[#1a1916] mb-1">ราคาจองชั่วคราว</div>
                  <div className="text-[11px] text-[#8a8780] mb-4">ราคาเหมาจ่ายสำหรับการเปิดห้องพักใช้งานแบบชั่วคราว (3-4 ชั่วโมง)</div>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8a8780] font-bold">฿</span>
                    <input
                      type="number"
                      value={formData.priceTemporary}
                      onChange={(e) => setFormData({ ...formData, priceTemporary: Number(e.target.value) })}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#d0cdc2] bg-white outline-none focus:border-[#c9440f] text-[16px] font-mono font-bold text-[#c9440f]"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-[#e2e0d8] max-w-3xl">
                <h3 className="text-[13px] font-bold text-[#1a1916] mb-4 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-[#8a8780]" /> การคำนวณภาษีมูลค่าเพิ่ม (VAT)
                </h3>
                <div className="flex items-center gap-6">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={formData.vatEnabled}
                      onChange={(e) => setFormData({ ...formData, vatEnabled: e.target.checked })}
                    />
                    <div className="w-11 h-6 bg-[#d0cdc2] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1a7a4a]"></div>
                    <span className="ml-3 text-[13px] font-medium text-[#1a1916]">เปิดใช้งานการคำนวณ VAT</span>
                  </label>

                  {formData.vatEnabled && (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={formData.vatPercent}
                        onChange={(e) => setFormData({ ...formData, vatPercent: Number(e.target.value) })}
                        className="w-16 px-3 py-1.5 rounded-lg border border-[#e2e0d8] text-center outline-none focus:border-[#c9440f] text-[13px] font-mono"
                      />
                      <span className="text-[13px] font-bold text-[#8a8780]">%</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === 'notifications' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 sm:p-8 space-y-6">
              <h2 className="text-[16px] font-bold text-[#1a1916] flex items-center gap-2 mb-6 border-b border-[#e2e0d8] pb-4">
                <BellRing className="w-5 h-5 text-[#c9440f]" /> ตั้งค่าการแจ้งเตือน (Notifications)
              </h2>

              <div className="max-w-2xl bg-[#fafaf8] p-5 rounded-2xl border border-[#e2e0d8]">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#00B900]/10 flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 24 24" fill="#00B900" className="w-6 h-6"><path d="M21.4 10.3c0-4.5-4.4-8.2-9.9-8.2-5.5 0-9.9 3.7-9.9 8.2 0 4 3.5 7.4 8.2 8.1.3.1.8.3.9.7l.3 1.9c.1.4.3.5.7.3 1.5-.9 5.4-3.3 7.5-6.1 1.4-1.6 2.2-3.3 2.2-4.9zm-13.8 1.9c-.3 0-.6-.3-.6-.6V8.5c0-.3.3-.6.6-.6h3.4c.3 0 .6.3.6.6v.6c0 .3-.3.6-.6.6H8.8v.6h2.2c.3 0 .6.3.6.6v.6c0 .3-.3.6-.6.6H8.2v.7c0 .3-.3.6-.6.6h-.1zm5.1 0c-.3 0-.6-.3-.6-.6V8.5c0-.3.3-.6.6-.6s.6.3.6.6v3.1c0 .3-.3.6-.6.6h-.1zm4.7 0c-.3 0-.6-.3-.6-.6v-2h-1l-1.6 2.2c-.1.2-.3.3-.5.3h-.1c-.3 0-.6-.3-.6-.6V8.5c0-.3.3-.6.6-.6s.6.3.6.6v2l1.6-2.2c.1-.2.3-.3.5-.3h.1c.3 0 .6.3.6.6v3.1c0 .3-.3.6-.6.6h.1z" /></svg>
                  </div>
                  <div className="flex-1">
                    <div className="text-[13px] font-bold text-[#1a1916] mb-1">LINE Official Account</div>
                    <div className="text-[11px] text-[#8a8780] mb-3">ใช้ Messaging API ของ LINE OA เพื่อส่งข้อความแจ้งเตือนไปยังผู้ใช้ กลุ่ม หรือห้องแชทของพนักงาน</div>
                    <label className="block text-[11px] font-bold text-[#8a8780] uppercase mb-1.5">Channel Access Token</label>
                    <input
                      type="password"
                      value={formData.lineOaChannelAccessToken}
                      onChange={(e) => setFormData({ ...formData, lineOaChannelAccessToken: e.target.value })}
                      placeholder="ใส่ Channel access token จาก LINE Developers..."
                      className="w-full px-4 py-2.5 rounded-xl border border-[#d0cdc2] bg-white outline-none focus:border-[#00B900] text-[13px] font-mono tracking-wider"
                    />
                    <label className="block text-[11px] font-bold text-[#8a8780] uppercase mt-4 mb-1.5">Recipient ID</label>
                    <input
                      type="text"
                      value={formData.lineOaRecipientId}
                      onChange={(e) => setFormData({ ...formData, lineOaRecipientId: e.target.value })}
                      placeholder="User ID, Group ID หรือ Room ID"
                      className="w-full px-4 py-2.5 rounded-xl border border-[#d0cdc2] bg-white outline-none focus:border-[#00B900] text-[13px] font-mono tracking-wider"
                    />
                    <div className="mt-2 text-[10px] text-[#8a8780] flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-[#1a7a4a]" /> ต้องเพิ่ม LINE OA เข้ากลุ่มก่อนจึงจะส่งเข้ากลุ่มได้
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ADVANCED TAB */}
          {activeTab === 'advanced' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 sm:p-8 space-y-6">
              <h2 className="text-[16px] font-bold text-[#dc2626] flex items-center gap-2 mb-6 border-b border-[#fef2f2] pb-4">
                <ShieldAlert className="w-5 h-5" /> การตั้งค่าขั้นสูง (อันตราย)
              </h2>

              <div className="max-w-2xl border border-[#fee2e2] bg-[#fef2f2] rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[13px] font-bold text-[#dc2626] mb-1">อนุญาตให้จองซ้อนทับกันได้ (Overbooking)</div>
                    <div className="text-[11px] text-[#dc2626]/70">หากเปิดใช้งาน ระบบจะไม่แจ้งเตือนเมื่อเลือกวันที่ทับซ้อนกัน (ไม่แนะนำ)</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={formData.allowOverbooking}
                      onChange={(e) => setFormData({ ...formData, allowOverbooking: e.target.checked })}
                    />
                    <div className="w-11 h-6 bg-[#fca5a5] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#dc2626]"></div>
                  </label>
                </div>
              </div>
            </motion.div>
          )}

        </div>
      </div>
    </div>
  );
}
