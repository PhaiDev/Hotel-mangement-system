'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { backend, Room, Booking } from '@/lib/supabase';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { RefreshCw, TrendingUp, Users, DollarSign, Activity } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function AnalysisPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [fetchedRooms, fetchedBookings] = await Promise.all([
        backend.getRooms(),
        backend.getBookings(),
      ]);
      setRooms(fetchedRooms || []);
      setBookings(fetchedBookings || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Real Stats Calculation ---
  const stats = useMemo(() => {
    const validBookings = bookings.filter(b => b.status !== 'CANCELLED');
    const totalRev = validBookings.reduce((sum, b) => sum + (Number(b.totalPrice) || 0), 0);
    const confirmedCount = bookings.filter(b => ['PAID', 'ACTIVE', 'COMPLETED'].includes(b.status)).length;

    // Occupancy Rate (approx for today)
    const today = new Date().toISOString().split('T')[0];
    const occupiedToday = bookings.filter(b => b.status === 'ACTIVE').length;
    const occupancyRate = rooms.length > 0 ? (occupiedToday / rooms.length) * 100 : 0;

    // RevPAR (Revenue Per Available Room - approx)
    const revPerRoom = rooms.length > 0 ? totalRev / rooms.length : 0;

    return { totalRev, confirmedCount, occupancyRate, revPerRoom };
  }, [bookings, rooms]);

  // --- Revenue Trend (Last 7 Days) ---
  const revenueChartData = useMemo(() => {
    const labels: string[] = [];
    const data: number[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      // Thai Label (Day/Month)
      const label = `${date.getDate()}/${date.getMonth() + 1}`;
      labels.push(label);

      const dailyRev = bookings
        .filter(b => b.status !== 'CANCELLED' && b.checkIn && b.checkIn.startsWith(dateStr))
        .reduce((sum, b) => sum + (Number(b.totalPrice) || 0), 0);
      data.push(dailyRev);
    }

    return {
      labels,
      datasets: [{
        label: 'รายได้รายวัน (฿)',
        data,
        borderColor: '#c9440f',
        backgroundColor: 'rgba(201, 68, 15, 0.05)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#c9440f',
      }],
    };
  }, [bookings]);

  // --- Room Popularity (Confirmed Booking Count) ---
  const roomPopularityData = useMemo(() => {
    const sortedRooms = [...rooms].sort((a, b) => {
      const countA = bookings.filter(bk => bk.roomId === a.id && bk.status !== 'CANCELLED').length;
      const countB = bookings.filter(bk => bk.roomId === b.id && bk.status !== 'CANCELLED').length;
      return countB - countA;
    }).slice(0, 8);

    const labels = sortedRooms.map(r => r.name);
    const data = sortedRooms.map(r => bookings.filter(bk => bk.roomId === r.id && bk.status !== 'CANCELLED').length);

    return {
      labels,
      datasets: [{
        label: 'จำนวนครั้งที่ถูกจอง',
        data,
        backgroundColor: '#1a4fa0',
        borderRadius: 6,
        barThickness: 24,
      }],
    };
  }, [bookings, rooms]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: { beginAtZero: true, grid: { color: '#f0ece8' } },
      x: { grid: { display: false } },
    }
  };

  if (loading) return (
    <div className="py-20 flex justify-center text-[#8a8780]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[#c9440f] border-t-transparent rounded-full animate-spin" />
        <span className="text-[13px] font-mono">กำลังประมวลผลข้อมูล...</span>
      </div>
    </div>
  );

  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Data Analytics</h1>
        <button onClick={fetchData} className="p-1.5 rounded-md border border-[#d0cdc2] text-[#8a8780] hover:bg-[#f5f4f0] transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        <div className="bg-white border border-[#e2e0d8] rounded-lg p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[11px] text-[#8a8780] uppercase tracking-[0.8px] mb-2.5">รายได้รวมทั้งหมด</div>
              <div className="font-mono text-[24px] font-medium leading-none mb-1.5 text-[#c9440f]">฿{stats.totalRev.toLocaleString()}</div>
            </div>
            <div className="p-2 bg-[#c9440f]/5 rounded-lg text-[#c9440f]"><DollarSign className="w-4 h-4" /></div>
          </div>
        </div>
        <div className="bg-white border border-[#e2e0d8] rounded-lg p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[11px] text-[#8a8780] uppercase tracking-[0.8px] mb-2.5">การจองที่ยืนยันแล้ว</div>
              <div className="font-mono text-[24px] font-medium leading-none mb-1.5 text-[#1a4fa0]">{stats.confirmedCount}</div>
            </div>
            <div className="p-2 bg-[#1a4fa0]/5 rounded-lg text-[#1a4fa0]"><TrendingUp className="w-4 h-4" /></div>
          </div>
        </div>
        <div className="bg-white border border-[#e2e0d8] rounded-lg p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[11px] text-[#8a8780] uppercase tracking-[0.8px] mb-2.5">อัตราการเข้าพัก</div>
              <div className="font-mono text-[24px] font-medium leading-none mb-1.5 text-[#1a7a4a]">{stats.occupancyRate.toFixed(1)}%</div>
            </div>
            <div className="p-2 bg-[#1a7a4a]/5 rounded-lg text-[#1a7a4a]"><Activity className="w-4 h-4" /></div>
          </div>
        </div>
        <div className="bg-white border border-[#e2e0d8] rounded-lg p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[11px] text-[#8a8780] uppercase tracking-[0.8px] mb-2.5">รายได้เฉลี่ยต่อห้อง</div>
              <div className="font-mono text-[24px] font-medium leading-none mb-1.5 text-[#8a8780]">฿{stats.revPerRoom.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
            </div>
            <div className="p-2 bg-[#8a8780]/5 rounded-lg text-[#8a8780]"><Users className="w-4 h-4" /></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-[#e2e0d8] rounded-lg p-5 h-[350px] shadow-sm flex flex-col">
          <div className="text-[13px] font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#c9440f]" /> แนวโน้มรายได้ (7 วันล่าสุด)
          </div>
          <div className="flex-1 min-h-0">
            <Line data={revenueChartData} options={chartOptions} />
          </div>
        </div>
        <div className="bg-white border border-[#e2e0d8] rounded-lg p-5 h-[350px] shadow-sm flex flex-col">
          <div className="text-[13px] font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#1a4fa0]" /> ยอดจองรายห้อง
          </div>
          <div className="flex-1 min-h-0">
            <Bar data={roomPopularityData} options={chartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}
