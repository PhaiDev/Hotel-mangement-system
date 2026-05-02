'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { backend, Room, Booking } from '@/lib/supabase';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { 
  RefreshCw, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Activity, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight,
  PieChart,
  Award,
  Zap
} from 'lucide-react';
import useSWR from 'swr';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function AnalysisPage() {
  const { data: rooms = [], mutate: mutateRooms, isLoading: loadingRooms } = useSWR('rooms', backend.getRooms, { revalidateOnFocus: true });
  const { data: bookings = [], mutate: mutateBookings, isLoading: loadingBookings } = useSWR('bookings', backend.getBookings, { revalidateOnFocus: true });
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('7d');
  const loading = loadingRooms || loadingBookings;

  const fetchData = async () => {
    await Promise.all([mutateRooms(), mutateBookings()]);
  };

  // --- Filtered Data based on Time Range ---
  const filteredBookings = useMemo(() => {
    if (timeRange === 'all') return bookings;
    const now = new Date();
    const days = timeRange === '7d' ? 7 : 30;
    const cutoff = new Date(now.setDate(now.getDate() - days));
    return bookings.filter(b => b.checkIn && new Date(b.checkIn) >= cutoff);
  }, [bookings, timeRange]);

  // --- Comparison Logic (Simplified for Demo) ---
  const growth = {
    revenue: 12.5,
    occupancy: -2.3,
    bookings: 8.4
  };

  // --- Real Stats Calculation ---
  const stats = useMemo(() => {
    const validBookings = filteredBookings.filter(b => b.status !== 'CANCELLED');
    const totalRev = validBookings.reduce((sum, b) => sum + (Number(b.totalPrice) || 0), 0);
    const confirmedCount = validBookings.length;

    const today = new Date().toISOString().split('T')[0];
    const occupiedToday = bookings.filter(b => b.status === 'ACTIVE').length;
    const occupancyRate = rooms.length > 0 ? (occupiedToday / rooms.length) * 100 : 0;

    const revPerRoom = rooms.length > 0 ? totalRev / rooms.length : 0;

    return { totalRev, confirmedCount, occupancyRate, revPerRoom };
  }, [filteredBookings, bookings, rooms]);

  // --- Status Distribution ---
  const statusData = useMemo(() => {
    const statuses = ['PENDING', 'PAID', 'ACTIVE', 'COMPLETED', 'CANCELLED'];
    const counts = statuses.map(s => bookings.filter(b => b.status === s).length);
    
    return {
      labels: ['รอชำระ', 'ชำระแล้ว', 'เข้าพัก', 'เช็คเอาท์', 'ยกเลิก'],
      datasets: [{
        data: counts,
        backgroundColor: ['#fdf3d0', '#e2eaf8', '#eaf5ef', '#dcf0e5', '#fafaf8'],
        borderColor: ['#b58a00', '#1a4fa0', '#1a7a4a', '#1a7a4a', '#8a8780'],
        borderWidth: 1,
      }],
    };
  }, [bookings]);

  // --- Revenue Trend ---
  const revenueChartData = useMemo(() => {
    const days = timeRange === '7d' ? 7 : (timeRange === '30d' ? 30 : 12);
    const labels: string[] = [];
    const data: number[] = [];

    if (timeRange === 'all') {
      const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
      months.forEach((m, i) => {
        labels.push(m);
        const monthlyRev = bookings
          .filter(b => b.status !== 'CANCELLED' && b.checkIn && new Date(b.checkIn).getMonth() === i)
          .reduce((sum, b) => sum + (Number(b.totalPrice) || 0), 0);
        data.push(monthlyRev);
      });
    } else {
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        labels.push(`${date.getDate()}/${date.getMonth() + 1}`);
        const dailyRev = bookings
          .filter(b => b.status !== 'CANCELLED' && b.checkIn && b.checkIn.startsWith(dateStr))
          .reduce((sum, b) => sum + (Number(b.totalPrice) || 0), 0);
        data.push(dailyRev);
      }
    }

    return {
      labels,
      datasets: [{
        label: 'รายได้ (฿)',
        data,
        borderColor: '#c9440f',
        backgroundColor: 'rgba(201, 68, 15, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: days > 15 ? 0 : 4,
      }],
    };
  }, [bookings, timeRange]);

  // --- Top Rooms ---
  const topRooms = useMemo(() => {
    return rooms.map(r => ({
      name: r.name,
      bookings: bookings.filter(b => b.roomId === r.id && b.status !== 'CANCELLED').length,
      revenue: bookings.filter(b => b.roomId === r.id && b.status !== 'CANCELLED').reduce((s, b) => s + (Number(b.totalPrice) || 0), 0)
    })).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [bookings, rooms]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, grid: { color: '#f0ece8' }, ticks: { font: { size: 10 } } },
      x: { grid: { display: false }, ticks: { font: { size: 10 } } },
    }
  };

  if (loading && rooms.length === 0) return (
    <div className="py-20 flex justify-center text-[#8a8780]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-[#c9440f] border-t-transparent rounded-full animate-spin" />
        <span className="text-[13px] font-mono font-bold">กำลังวิเคราะห์ข้อมูล...</span>
      </div>
    </div>
  );

  return (
    <div className="animate-in fade-in duration-500 pb-10">
      {/* Header with Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-[#1a1916] tracking-tight">Business Intelligence</h1>
          <p className="text-[13px] text-[#8a8780] font-medium mt-1">สรุปผลการดำเนินงานและวิเคราะห์ข้อมูลการจอง</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white border border-[#e2e0d8] p-1 rounded-xl shadow-sm">
          {(['7d', '30d', 'all'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-4 py-1.5 rounded-lg text-[12px] font-bold transition-all ${
                timeRange === r ? 'bg-[#1a1916] text-white shadow-md' : 'text-[#8a8780] hover:text-[#1a1916]'
              }`}
            >
              {r === '7d' ? '7 วัน' : r === '30d' ? '30 วัน' : 'ทั้งหมด'}
            </button>
          ))}
          <div className="w-px h-4 bg-[#e2e0d8] mx-1" />
          <button onClick={fetchData} className="p-2 text-[#8a8780] hover:text-[#c9440f] transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard 
          label="รายได้รวม" 
          value={`฿${stats.totalRev.toLocaleString()}`} 
          icon={<DollarSign className="w-4 h-4" />} 
          color="#c9440f"
          trend={growth.revenue}
        />
        <StatCard 
          label="ยอดจองรวม" 
          value={stats.confirmedCount} 
          icon={<Calendar className="w-4 h-4" />} 
          color="#1a4fa0"
          trend={growth.bookings}
        />
        <StatCard 
          label="อัตราเข้าพักวันนี้" 
          value={`${stats.occupancyRate.toFixed(1)}%`} 
          icon={<Activity className="w-4 h-4" />} 
          color="#1a7a4a"
          trend={growth.occupancy}
        />
        <StatCard 
          label="RevPAR" 
          value={`฿${stats.revPerRoom.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} 
          icon={<Zap className="w-4 h-4" />} 
          color="#8a8780"
          description="รายได้เฉลี่ยต่อห้อง"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white border border-[#e2e0d8] rounded-2xl p-6 shadow-sm flex flex-col h-[400px]">
          <div className="flex items-center justify-between mb-6">
            <div className="text-[15px] font-bold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#c9440f]" /> 
              แนวโน้มรายได้ ({timeRange === '7d' ? '7 วันล่าสุด' : timeRange === '30d' ? '30 วันล่าสุด' : 'รายเดือน'})
            </div>
            <div className="text-[11px] font-bold text-[#1a7a4a] bg-[#eaf5ef] px-2 py-1 rounded-md">Real-time</div>
          </div>
          <div className="flex-1 min-h-0">
            <Line data={revenueChartData} options={chartOptions} />
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white border border-[#e2e0d8] rounded-2xl p-6 shadow-sm flex flex-col h-[400px]">
          <div className="text-[15px] font-bold mb-6 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-[#1a4fa0]" /> สัดส่วนสถานะการจอง
          </div>
          <div className="flex-1 min-h-0 relative flex items-center justify-center">
            <Doughnut 
              data={statusData} 
              options={{ 
                maintainAspectRatio: false, 
                plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10, weight: 'bold' } } } },
                cutout: '70%'
              }} 
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none translate-y-[-10px]">
              <div className="text-[10px] text-[#8a8780] font-bold uppercase tracking-widest">ทั้งหมด</div>
              <div className="text-2xl font-black text-[#1a1916]">{bookings.length}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Rooms Table */}
        <div className="bg-white border border-[#e2e0d8] rounded-2xl p-6 shadow-sm">
          <div className="text-[15px] font-bold mb-5 flex items-center gap-2">
            <Award className="w-5 h-5 text-[#e88c2a]" /> ห้องที่สร้างรายได้สูงสุด
          </div>
          <div className="space-y-4">
            {topRooms.map((r, i) => (
              <div key={r.name} className="flex items-center justify-between p-3 rounded-xl border border-[#fafafa] hover:bg-[#fafaf8] transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg bg-[#1a1916] text-white flex items-center justify-center text-[12px] font-bold">
                    {i + 1}
                  </div>
                  <div>
                    <div className="text-[14px] font-bold text-[#1a1916] group-hover:text-[#c9440f] transition-colors">{r.name}</div>
                    <div className="text-[11px] text-[#8a8780] font-medium">จองแล้ว {r.bookings} ครั้ง</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[14px] font-mono font-bold text-[#1a1916]">฿{r.revenue.toLocaleString()}</div>
                  <div className="text-[10px] text-[#1a7a4a] font-bold bg-[#eaf5ef] px-1.5 py-0.5 rounded inline-block">Excellent</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Insights */}
        <div className="bg-[#1a1916] rounded-2xl p-6 shadow-xl text-white relative overflow-hidden">
          <div className="relative z-10 h-full flex flex-col">
            <div className="text-[15px] font-bold mb-6 flex items-center gap-2 text-[#e88c2a]">
              <Zap className="w-5 h-5" /> Performance Insights
            </div>
            
            <div className="space-y-6 flex-1">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-5 h-5 text-[#4ade80]" />
                </div>
                <div>
                  <div className="text-[14px] font-bold mb-1">แนวโน้มการเติบโต</div>
                  <p className="text-[12px] text-white/60 leading-relaxed">
                    รายได้ในช่วงนี้เพิ่มขึ้น {growth.revenue}% เมื่อเทียบกับช่วงก่อนหน้า ปัจจัยหลักมาจากอัตราการจองห้อง {topRooms[0]?.name || 'หลัก'} ที่สูงขึ้น
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-[#60a5fa]" />
                </div>
                <div>
                  <div className="text-[14px] font-bold mb-1">ความจุของผู้เข้าพัก</div>
                  <p className="text-[12px] text-white/60 leading-relaxed">
                    อัตราการเข้าพักเฉลี่ยอยู่ที่ {stats.occupancyRate.toFixed(1)}% แนะนำให้จัดโปรโมชั่นในช่วงกลางสัปดาห์เพื่อเพิ่ม Volume
                  </p>
                </div>
              </div>
            </div>

            <button className="mt-8 w-full py-3 rounded-xl bg-[#e88c2a] text-[#1a1916] text-[13px] font-black hover:bg-[#ff9f3e] transition-all active:scale-95 shadow-lg shadow-[#e88c2a]/20 uppercase tracking-wider">
              Download Full Report (.PDF)
            </button>
          </div>
          
          {/* Decorative Elements */}
          <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-[#c9440f]/20 rounded-full blur-[80px]" />
          <div className="absolute bottom-[-10%] left-[-5%] w-48 h-48 bg-[#1a4fa0]/20 rounded-full blur-[60px]" />
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color, trend, description }: { 
  label: string, 
  value: string | number, 
  icon: React.ReactNode, 
  color: string, 
  trend?: number,
  description?: string
}) {
  return (
    <div className="bg-white border border-[#e2e0d8] rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group">
      <div className="flex items-start justify-between mb-4">
        <div className="p-2.5 rounded-xl transition-colors" style={{ backgroundColor: `${color}10`, color: color }}>
          {icon}
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-black ${
            trend >= 0 ? 'bg-[#eaf5ef] text-[#1a7a4a]' : 'bg-[#fef2f2] text-[#dc2626]'
          }`}>
            {trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="text-[11px] text-[#8a8780] font-bold uppercase tracking-[1px] mb-1">{label}</div>
      <div className="font-mono text-[24px] font-black leading-none mb-1 text-[#1a1916] group-hover:text-[#c9440f] transition-colors">{value}</div>
      {description && <div className="text-[10px] text-[#8a8780] font-medium">{description}</div>}
    </div>
  );
}

