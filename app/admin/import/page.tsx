'use client';

import React, { useState, useEffect, useRef } from 'react';
import useSWR from 'swr';
import { backend, Room, Booking } from '@/lib/supabase';
import { SwalStyled, swalCSS } from '@/lib/swalTheme';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import { 
  Upload, FileText, CheckCircle2, AlertTriangle, Download, 
  ArrowRight, Database, Sparkles, RefreshCw, Trash2, Info, 
  ChevronRight, AlertCircle, FileSpreadsheet, ArrowLeft
} from 'lucide-react';

interface Mapping {
  [dbField: string]: number; // Maps dbField to file column index (-1 if not mapped)
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  resolvedRoomId?: number;
}

export default function ImportPage() {
  const { data: rooms = [], mutate: mutateRooms } = useSWR('rooms', backend.getRooms);
  const { data: bookings = [], mutate: mutateBookings } = useSWR('bookings', backend.getBookings);

  // States
  const [importType, setImportType] = useState<'rooms' | 'bookings'>('rooms');
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [fileName, setFileName] = useState<string>('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawData, setRawData] = useState<any[][]>([]);
  const [mapping, setMapping] = useState<Mapping>({});
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [validations, setValidations] = useState<ValidationResult[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; imported: number; failed: number; message: string } | null>(null);
  
  // Settings
  const [ignoreOverlap, setIgnoreOverlap] = useState(false);
  const [skipErrors, setSkipErrors] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load SweetAlert CSS
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = swalCSS;
    document.head.appendChild(style);
    return () => {
      if (document.head.contains(style)) document.head.removeChild(style);
    };
  }, []);

  // Database Field Definitions
  const fieldDefinitions = {
    rooms: [
      { key: 'name', label: 'ชื่อห้อง *', required: true, description: 'ชื่อห้องพัก (เช่น Room 101)', matches: ['name', 'room name', 'ชื่อ', 'ชื่อห้อง', 'ห้อง'] },
      { key: 'price', label: 'ราคาต่อคืน', required: false, description: 'ราคาห้องพักต่อคืน', matches: ['price', 'price per night', 'ราคา', 'ราคาต่อคืน', 'ค่าห้อง'] },
      { key: 'capacity', label: 'ความจุ (คน)', required: false, description: 'จำนวนผู้เข้าพักสูงสุด', matches: ['capacity', 'guests', 'จำนวนคน', 'ความจุ', 'คน'] },
      { key: 'lockId', label: 'รหัสล็อคเกอร์', required: false, description: 'รหัส locker ประตูห้อง', matches: ['lockid', 'lock id', 'รหัสล็อค', 'ประตู'] },
      { key: 'pinLock', label: 'รหัสล็อคเกลียวกล่องคีย์การ์ด', required: false, description: 'รหัสล็อคสำหรับกล่องคีย์การ์ด', matches: ['pinlock', 'pin lock', 'รหัสกล่อง', 'กล่อง'] },
      { key: 'isActive', label: 'เปิดใช้งาน', required: false, description: 'สถานะเปิดใช้งาน (true/false, Yes/No, 1/0)', matches: ['isactive', 'active', 'เปิดใช้งาน', 'สถานะ', 'เปิด'] },
      { key: 'imageUrl', label: 'ลิงก์รูปภาพ', required: false, description: 'URL รูปภาพห้องพัก', matches: ['imageurl', 'image', 'picture', 'รูป', 'รูปภาพ', 'ลิงก์รูป'] }
    ],
    bookings: [
      { key: 'customerName', label: 'ชื่อลูกค้า *', required: true, description: 'ชื่อ-นามสกุลลูกค้า', matches: ['customername', 'customer name', 'customer', 'guest name', 'ชื่อลูกค้า', 'ชื่อผู้จอง', 'ชื่อ'] },
      { key: 'customerLine', label: 'Line ID', required: false, description: 'ไอดีไลน์ลูกค้า', matches: ['customerline', 'line', 'line id', 'ไลน์', 'ติดต่อ'] },
      { key: 'roomName', label: 'ชื่อห้อง หรือ รหัสห้อง *', required: true, description: 'ชื่อห้องที่ต้องการจอง (เพื่อจับคู่รหัสห้องอัตโนมัติ)', matches: ['roomname', 'room name', 'room', 'ชื่อห้อง', 'ห้อง', 'ห้องพัก'] },
      { key: 'checkIn', label: 'วันที่เช็คอิน *', required: true, description: 'วันที่เช็คอิน (YYYY-MM-DD)', matches: ['checkin', 'check in', 'check-in', 'วันที่เช็คอิน', 'เช็คอิน', 'เข้าพัก'] },
      { key: 'checkOut', label: 'วันที่เช็คเอาท์ *', required: true, description: 'วันที่เช็คเอาท์ (YYYY-MM-DD)', matches: ['checkout', 'check out', 'check-out', 'วันที่เช็คเอาท์', 'เช็คเอาท์', 'ออก'] },
      { key: 'totalPrice', label: 'ราคารวม', required: false, description: 'ราคารวมการจอง', matches: ['totalprice', 'total price', 'total', 'ราคารวม', 'ยอดรวม', 'ราคา'] },
      { key: 'status', label: 'สถานะ', required: false, description: 'สถานะการจอง (PENDING, PAID, ACTIVE, COMPLETED, CANCELLED)', matches: ['status', 'booking status', 'สถานะ'] },
      { key: 'pinCode', label: 'รหัส PIN ประตู', required: false, description: 'รหัสผ่านเปิดห้องชั่วคราว', matches: ['pincode', 'pin code', 'pin', 'รหัสผ่าน', 'รหัสกด'] }
    ]
  };

  const currentFields = fieldDefinitions[importType];

  // Helper: Reset States
  const resetImport = () => {
    setStep(1);
    setFileName('');
    setHeaders([]);
    setRawData([]);
    setMapping({});
    setPreviewRows([]);
    setValidations([]);
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Helper: Format Dates
  const formatDate = (val: any) => {
    if (!val) return '';
    if (val instanceof Date) {
      return val.toISOString().split('T')[0];
    }
    if (typeof val === 'number') {
      // Excel serial date representation
      const date = new Date((val - 25569) * 86400 * 1000);
      return date.toISOString().split('T')[0];
    }
    if (typeof val === 'string') {
      const trimmed = val.trim();
      // Test if already YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
      
      const parsed = Date.parse(trimmed);
      if (!isNaN(parsed)) {
        return new Date(parsed).toISOString().split('T')[0];
      }
    }
    return String(val);
  };

  // Template Downloader
  const downloadTemplate = (type: 'rooms' | 'bookings') => {
    let headersList: string[] = [];
    let sampleRow: string[] = [];
    let fileTitle = '';

    if (type === 'rooms') {
      headersList = ['name', 'price', 'capacity', 'lockId', 'pinLock', 'isActive', 'imageUrl'];
      sampleRow = ['Room 101', '1200', '2', 'LOCK-101', '9988', 'Yes', 'https://images.unsplash.com/photo-1590490360182-c33d57733427'];
      fileTitle = 'rooms_template.csv';
    } else {
      headersList = ['customerName', 'customerLine', 'roomName', 'checkIn', 'checkOut', 'totalPrice', 'status', 'pinCode'];
      sampleRow = ['สมชาย ใจดี', 'somchai_line', 'Room 101', '2026-07-10', '2026-07-12', '2400', 'PAID', '1234'];
      fileTitle = 'bookings_template.csv';
    }

    const csvContent = "\uFEFF" + [headersList.join(','), sampleRow.join(',')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', fileTitle);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Step 1: Handle File Selection/Drop
  const processFile = (file: File) => {
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array', cellDates: true });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Parse file as array of arrays (header: 1)
      const parsedData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
      
      if (parsedData.length === 0) {
        SwalStyled.fire('ล้มเหลว', 'ไม่พบข้อมูลในไฟล์ที่อัปโหลด', 'error');
        return;
      }

      // Filter empty rows
      const nonEmptyData = parsedData.filter(row => row.length > 0 && row.some(cell => cell !== null && cell !== undefined && cell !== ''));
      if (nonEmptyData.length === 0) {
        SwalStyled.fire('ล้มเหลว', 'ไม่พบข้อมูลแถวที่ใช้งานได้', 'error');
        return;
      }

      const fileHeaders = nonEmptyData[0].map(h => String(h || '').trim());
      setHeaders(fileHeaders);
      setRawData(nonEmptyData.slice(1));

      // Attempt Auto-Mapping
      const initialMapping: Mapping = {};
      currentFields.forEach(field => {
        let mappedIndex = -1;
        
        // Look for exact match or close match
        for (let i = 0; i < fileHeaders.length; i++) {
          const headerLower = fileHeaders[i].toLowerCase();
          if (field.matches.some(m => headerLower.includes(m.toLowerCase()) || m.toLowerCase().includes(headerLower))) {
            mappedIndex = i;
            break;
          }
        }
        
        initialMapping[field.key] = mappedIndex;
      });

      setMapping(initialMapping);
      setStep(2);
    };

    reader.readAsArrayBuffer(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Step 2: Handle Column Mapping Validation and Moving to Step 3
  const handleApplyMapping = () => {
    // Check if required fields are mapped
    const missingRequired = currentFields.filter(f => f.required && (mapping[f.key] === undefined || mapping[f.key] === -1));
    if (missingRequired.length > 0) {
      SwalStyled.fire(
        'การจับคู่คอลัมน์ไม่ครบถ้วน',
        `กรุณาจับคู่คอลัมน์บังคับให้ครบถ้วน: ${missingRequired.map(f => f.label).join(', ')}`,
        'warning'
      );
      return;
    }

    // Process mapped rows
    const rows: any[] = [];
    const validationList: ValidationResult[] = [];

    rawData.forEach((rawRow, rowIndex) => {
      const parsedRow: any = {};
      const errors: string[] = [];
      const warnings: string[] = [];
      let resolvedRoomId: number | undefined;

      currentFields.forEach(field => {
        const fileIdx = mapping[field.key];
        let val = fileIdx !== -1 && fileIdx !== undefined ? rawRow[fileIdx] : undefined;

        if (val === undefined || val === null || String(val).trim() === '') {
          parsedRow[field.key] = '';
          if (field.required) {
            errors.push(`คอลัมน์ ${field.label} เป็นค่าว่างไม่ได้`);
          }
          return;
        }

        // Apply formatting based on field types
        if (importType === 'rooms') {
          if (field.key === 'price') {
            const num = Number(val);
            parsedRow[field.key] = isNaN(num) ? 0 : num;
            if (isNaN(num)) warnings.push('ราคาไม่ใช่ตัวเลข ระบบได้แทนที่ด้วยค่า 0');
          } else if (field.key === 'capacity') {
            const num = Math.floor(Number(val));
            parsedRow[field.key] = isNaN(num) || num < 1 ? 1 : num;
            if (isNaN(num) || num < 1) warnings.push('ความจุไม่ใช่ตัวเลขระบบ หรือน้อยกว่า 1 ระบบได้แทนที่ด้วยค่า 1');
          } else if (field.key === 'isActive') {
            const strVal = String(val).toLowerCase().trim();
            parsedRow[field.key] = ['true', '1', 'yes', 'y', 'เปิด', 'เปิดใช้งาน'].includes(strVal);
          } else {
            parsedRow[field.key] = String(val).trim();
          }
        } else {
          // Bookings
          if (field.key === 'checkIn' || field.key === 'checkOut') {
            const formatted = formatDate(val);
            parsedRow[field.key] = formatted;
            if (!formatted || isNaN(Date.parse(formatted))) {
              errors.push(`${field.label} มีรูปแบบวันที่ไม่ถูกต้อง (ควรเป็น YYYY-MM-DD)`);
            }
          } else if (field.key === 'totalPrice') {
            const num = Number(val);
            parsedRow[field.key] = isNaN(num) ? 0 : num;
            if (isNaN(num)) warnings.push('ราคารวมไม่ใช่ตัวเลข ระบบได้แทนที่ด้วยค่า 0');
          } else if (field.key === 'status') {
            const statusStr = String(val).toUpperCase().trim();
            const validStatuses = ['PENDING', 'PAID', 'ACTIVE', 'COMPLETED', 'CANCELLED'];
            parsedRow[field.key] = validStatuses.includes(statusStr) ? statusStr : 'PENDING';
            if (!validStatuses.includes(statusStr)) {
              warnings.push(`สถานะการจอง "${statusStr}" ไม่ถูกต้อง ระบบเปลี่ยนเป็น PENDING`);
            }
          } else {
            parsedRow[field.key] = String(val).trim();
          }
        }
      });

      // Special check-in/out range validation
      if (importType === 'bookings' && parsedRow.checkIn && parsedRow.checkOut) {
        const inDate = new Date(parsedRow.checkIn);
        const outDate = new Date(parsedRow.checkOut);
        if (inDate >= outDate) {
          errors.push('วันที่เช็คเอาท์ต้องมากกว่าวันที่เช็คอิน');
        }
      }

      // Dynamic checks against loaded database data
      if (importType === 'rooms') {
        const nameConflict = rooms.some(r => r.name.toLowerCase().trim() === String(parsedRow.name || '').toLowerCase().trim());
        if (nameConflict) {
          warnings.push(`ชื่อห้อง "${parsedRow.name}" มีอยู่แล้วในระบบ (จะอัปเดตข้อมูลหากดำเนินการต่อ)`);
        }
      } else {
        // Find Room Match
        const roomMatch = rooms.find(r => r.name.toLowerCase().trim() === String(parsedRow.roomName || '').toLowerCase().trim());
        if (roomMatch) {
          resolvedRoomId = roomMatch.id;
          parsedRow.roomId = roomMatch.id;
          
          // Check overlap on client
          if (parsedRow.checkIn && parsedRow.checkOut) {
            const isOverlap = bookings.some(b => 
              b.roomId === roomMatch.id && 
              b.status !== 'CANCELLED' && 
              new Date(b.checkIn) < new Date(parsedRow.checkOut) && 
              new Date(b.checkOut) > new Date(parsedRow.checkIn)
            );
            if (isOverlap) {
              warnings.push(`วันที่เข้าพักทับซ้อนกับการจองอื่นในห้อง ${roomMatch.name}`);
            }
          }
        } else {
          errors.push(`ไม่พบห้องพักชื่อ "${parsedRow.roomName}" ในระบบ กรุณาสร้างห้องพักก่อน หรือแก้ไขชื่อให้ตรงกัน`);
        }
      }

      rows.push(parsedRow);
      validationList.push({
        isValid: errors.length === 0,
        errors,
        warnings,
        resolvedRoomId
      });
    });

    setPreviewRows(rows);
    setValidations(validationList);
    setStep(3);
  };

  // Step 3: Run Database Upload
  const handleExecuteImport = async () => {
    // Filter rows based on error settings
    const finalItems: any[] = [];
    let skippedCount = 0;

    previewRows.forEach((row, idx) => {
      const val = validations[idx];
      if (!val.isValid) {
        if (skipErrors) {
          skippedCount++;
        } else {
          // Cannot proceed because there are errors and skipErrors is not checked
          return;
        }
      } else {
        finalItems.push(row);
      }
    });

    if (finalItems.length === 0) {
      SwalStyled.fire(
        'ไม่มีข้อมูลให้นำเข้า',
        'ทุกแถวมีข้อผิดพลาดและถูกข้าม หรือไม่มีรายการข้อมูลที่ถูกต้อง',
        'warning'
      );
      return;
    }

    const confirmText = importType === 'rooms' 
      ? `นำเข้าห้องพักจำนวน ${finalItems.length} ห้อง?`
      : `นำเข้าข้อมูลการจองจำนวน ${finalItems.length} รายการ?`;

    const confirmRes = await SwalStyled.fire({
      title: 'ยืนยันการนำเข้าข้อมูล',
      text: confirmText,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: '🚀 นำเข้าข้อมูล',
      cancelButtonText: 'ยกเลิก',
    });

    if (!confirmRes.isConfirmed) return;

    setIsImporting(true);
    setStep(4);

    try {
      // If import type is rooms, let's divide them into updates (if existing) and inserts (if new)
      // because our /api/import only does inserts. Let's make it smarter!
      // Actually we can do it on the client side:
      // - To update: call backend.updateRoom(id, room)
      // - To create: call /api/import with type 'rooms'
      let successCount = 0;
      let errorCount = 0;

      if (importType === 'rooms') {
        const toInsert: any[] = [];
        const toUpdate: { id: number; data: any }[] = [];

        finalItems.forEach(item => {
          const existing = rooms.find(r => r.name.toLowerCase().trim() === item.name.toLowerCase().trim());
          if (existing) {
            toUpdate.push({ id: existing.id, data: item });
          } else {
            toInsert.push(item);
          }
        });

        // 1. Process inserts in batch via API
        if (toInsert.length > 0) {
          const res = await fetch('/api/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'rooms', items: toInsert })
          });
          const json = await res.json();
          if (!res.ok) throw new Error(json.error || 'การเพิ่มห้องพักล้มเหลว');
          successCount += json.count || 0;
        }

        // 2. Process updates sequentially (or concurrently)
        if (toUpdate.length > 0) {
          const updatePromises = toUpdate.map(async (u) => {
            try {
              await backend.updateRoom(u.id, u.data);
              successCount++;
            } catch (err) {
              console.error(`Failed to update room ${u.data.name}:`, err);
              errorCount++;
            }
          });
          await Promise.all(updatePromises);
        }
      } else {
        // Bookings - Process inserts in batch via API
        const res = await fetch('/api/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            type: 'bookings', 
            items: finalItems,
            ignoreOverlap 
          })
        });
        const json = await res.json();
        
        if (!res.ok) {
          throw new Error(json.error || 'การนำข้อมูลเข้าล้มเหลว');
        }
        successCount = json.count || 0;
      }

      // Revalidate cache
      await Promise.all([mutateRooms(), mutateBookings()]);

      setImportResult({
        success: true,
        imported: successCount,
        failed: errorCount + skippedCount,
        message: `สำเร็จ! นำเข้าข้อมูลเรียบร้อยจำนวน ${successCount} รายการ` + (skippedCount > 0 ? ` (ข้ามข้อมูลที่ไม่ถูกต้องจำนวน ${skippedCount} รายการ)` : '')
      });

    } catch (error: any) {
      console.error(error);
      setImportResult({
        success: false,
        imported: 0,
        failed: finalItems.length,
        message: error.message || 'เกิดข้อผิดพลาดในการเรียกเซิร์ฟเวอร์'
      });
    } finally {
      setIsImporting(false);
    }
  };

  const hasErrors = validations.some(v => !v.isValid);

  return (
    <div className="w-full max-w-[1200px] mx-auto pb-10">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[20px] font-bold text-[#1a1916] flex items-center gap-2">
            <Database className="w-5 h-5 text-[#c9440f]" />
            ระบบนำเข้าข้อมูลผ่าน Excel / CSV
          </h1>
          <p className="text-[12px] text-[#8a8780] mt-1 font-mono">
            นำเข้าหรืออัปเดตข้อมูล ห้องพัก และ รายการจอง ได้อย่างรวดเร็วด้วยการอัปโหลดไฟล์ไฟล์เดียว
          </p>
        </div>
      </div>

      {/* Wizard Progress Bar */}
      <div className="bg-white border border-[#e2e0d8] rounded-2xl p-5 mb-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {[
            { stepNum: 1, label: 'เลือกและอัปโหลดไฟล์' },
            { stepNum: 2, label: 'จับคู่คอลัมน์ (Mapping)' },
            { stepNum: 3, label: 'ตรวจสอบความถูกต้อง' },
            { stepNum: 4, label: 'เสร็จสิ้น' }
          ].map((s, idx) => (
            <React.Fragment key={s.stepNum}>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[13px] font-bold transition-all duration-300 font-mono ${
                  step === s.stepNum 
                    ? 'bg-[#c9440f] text-white shadow-md shadow-[#c9440f]/20 scale-105' 
                    : step > s.stepNum
                    ? 'bg-[#1a7a4a] text-white' 
                    : 'bg-[#fafaf8] border border-[#d2d0c6] text-[#8a8780]'
                }`}>
                  {step > s.stepNum ? '✓' : s.stepNum}
                </div>
                <span className={`text-[13px] font-semibold ${
                  step === s.stepNum ? 'text-[#c9440f]' : step > s.stepNum ? 'text-[#1a7a4a]' : 'text-[#8a8780]'
                }`}>{s.label}</span>
              </div>
              {idx < 3 && (
                <ChevronRight className="hidden sm:block w-4 h-4 text-[#d2d0c6]" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Main Form/Steps Wrapper */}
      <div className="bg-white border border-[#e2e0d8] rounded-2xl shadow-sm overflow-hidden min-h-[400px] flex flex-col">
        
        {/* STEP 1: SELECT TYPE AND UPLOAD FILE */}
        {step === 1 && (
          <div className="p-6 md:p-8 flex-1 flex flex-col">
            
            {/* 1.1 Type Selection Card */}
            <div className="mb-8">
              <h3 className="text-[13px] font-bold text-[#8a8780] uppercase tracking-wider mb-3">1. เลือกประเภทข้อมูลที่ต้องการนำเข้า</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Rooms Card */}
                <button
                  type="button"
                  onClick={() => setImportType('rooms')}
                  className={`p-5 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                    importType === 'rooms'
                      ? 'border-[#c9440f] bg-[#c9440f]/5 shadow-sm'
                      : 'border-[#e2e0d8] hover:border-[#c9440f]/30 hover:bg-[#fafaf8]'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${
                      importType === 'rooms' ? 'bg-[#c9440f] text-white' : 'bg-[#fafaf8] border border-[#e2e0d8] text-[#8a8780]'
                    } transition-colors group-hover:scale-105 duration-200`}>
                      <Database className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[14px] font-bold text-[#1a1916]">ข้อมูลห้องพัก (Rooms)</div>
                      <div className="text-[12px] text-[#8a8780] mt-1">นำเข้าหรืออัปเดตข้อมูลขนาดของห้องพัก, ราคา และรหัสการปลดล็อค</div>
                    </div>
                  </div>
                  {importType === 'rooms' && (
                    <div className="absolute top-0 right-0 w-3 h-3 bg-[#c9440f] rounded-bl-lg" />
                  )}
                </button>

                {/* Bookings Card */}
                <button
                  type="button"
                  onClick={() => setImportType('bookings')}
                  className={`p-5 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                    importType === 'bookings'
                      ? 'border-[#c9440f] bg-[#c9440f]/5 shadow-sm'
                      : 'border-[#e2e0d8] hover:border-[#c9440f]/30 hover:bg-[#fafaf8]'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${
                      importType === 'bookings' ? 'bg-[#c9440f] text-white' : 'bg-[#fafaf8] border border-[#e2e0d8] text-[#8a8780]'
                    } transition-colors group-hover:scale-105 duration-200`}>
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[14px] font-bold text-[#1a1916]">รายการจอง (Bookings)</div>
                      <div className="text-[12px] text-[#8a8780] mt-1">นำเข้าการจองห้องพักใหม่, รายละเอียดของลูกค้า, วันที่เช็คอิน-เช็คเอาท์</div>
                    </div>
                  </div>
                  {importType === 'bookings' && (
                    <div className="absolute top-0 right-0 w-3 h-3 bg-[#c9440f] rounded-bl-lg" />
                  )}
                </button>

              </div>
            </div>

            {/* 1.2 Drag & Drop Upload Zone */}
            <div className="mb-6 flex-1">
              <h3 className="text-[13px] font-bold text-[#8a8780] uppercase tracking-wider mb-3">2. อัปโหลดไฟล์เอกสาร</h3>
              
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center min-h-[220px] ${
                  isDragOver
                    ? 'border-[#c9440f] bg-[#c9440f]/5 scale-[0.99]'
                    : 'border-[#d2d0c6] bg-[#fafaf8] hover:bg-[#fafaf8]/50 hover:border-[#c9440f]/60'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                  className="hidden"
                />

                <div className={`p-4 rounded-full mb-4 transition-all duration-300 ${
                  isDragOver ? 'bg-[#c9440f]/10 text-[#c9440f] scale-110' : 'bg-[#fafaf8] border border-[#e2e0d8] text-[#8a8780]'
                }`}>
                  <Upload className="w-8 h-8" />
                </div>
                
                <p className="text-[14px] font-bold text-[#1a1916]">
                  ลากไฟล์ Excel (.xlsx, .xls) หรือ CSV มาวางที่นี่
                </p>
                <p className="text-[12px] text-[#8a8780] mt-1 font-mono">
                  หรือคลิกเพื่อเลือกไฟล์จากคอมพิวเตอร์ของคุณ (ขนาดสูงสุด 10MB)
                </p>
              </div>
            </div>

            {/* 1.3 Templates Downloading */}
            <div className="bg-[#fafaf8] border border-[#e2e0d8] rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Info className="w-5 h-5 text-[#c9440f] shrink-0" />
                <div className="text-[12px] text-[#8a8780]">
                  <strong className="text-[#1a1916]">ต้องการตัวอย่างรูปแบบไฟล์ใช่หรือไม่?</strong><br />
                  เราได้เตรียมไฟล์เทมเพลตมาตรฐานที่คุณสามารถดาวน์โหลดไปเป็นต้นแบบในการสร้างเอกสารได้
                </div>
              </div>
              <button
                type="button"
                onClick={() => downloadTemplate(importType)}
                className="w-full sm:w-auto bg-[#c9440f]/10 border border-[#c9440f]/20 hover:bg-[#c9440f]/20 text-[#c9440f] px-4 py-2.5 rounded-xl text-[12px] font-bold transition-all flex items-center justify-center gap-2 cursor-pointer font-sans"
              >
                <Download className="w-4 h-4" /> ดาวน์โหลดเทมเพลต {importType === 'rooms' ? 'ห้องพัก' : 'การจอง'}
              </button>
            </div>

          </div>
        )}

        {/* STEP 2: COLUMN MAPPING */}
        {step === 2 && (
          <div className="p-6 md:p-8 flex-1 flex flex-col">
            
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-[14px] font-bold text-[#1a1916]">จับคู่หัวคอลัมน์ (Column Mapping)</h3>
                <p className="text-[12px] text-[#8a8780] mt-0.5">
                  เลือกคอลัมน์จากไฟล์ให้ตรงกับฟิลด์ข้อมูลในฐานข้อมูล
                </p>
              </div>
              <div className="text-[12px] bg-[#fafaf8] border border-[#e2e0d8] px-3 py-1.5 rounded-lg text-[#8a8780] font-mono">
                ไฟล์: <span className="text-[#1a1916] font-semibold">{fileName}</span>
              </div>
            </div>

            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#e2e0d8] text-[11px] font-bold text-[#8a8780] uppercase tracking-wider">
                    <th className="py-3 px-4">ฟิลด์ข้อมูล (Database Field)</th>
                    <th className="py-3 px-4">คอลัมน์ในไฟล์คุณ (Your File Column)</th>
                    <th className="py-3 px-4">คำอธิบายฟิลด์</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#fafaf8]">
                  {currentFields.map((field) => {
                    const isMapped = mapping[field.key] !== undefined && mapping[field.key] !== -1;
                    return (
                      <tr key={field.key} className="hover:bg-[#fafaf8]/50 text-[13px]">
                        <td className="py-3 px-4 font-semibold text-[#1a1916]">
                          {field.label}
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={mapping[field.key] ?? -1}
                            onChange={(e) => {
                              const updated = { ...mapping, [field.key]: Number(e.target.value) };
                              setMapping(updated);
                            }}
                            className={`w-full max-w-[280px] bg-white border rounded-xl py-2 px-3 text-[13px] outline-none transition-all focus:border-[#c9440f] ${
                              isMapped 
                                ? 'border-[#1a7a4a]/40 text-[#1a7a4a] bg-[#1a7a4a]/5'
                                : field.required
                                ? 'border-[#b91c1c]/40 text-[#b91c1c] bg-[#b91c1c]/5'
                                : 'border-[#d2d0c6] text-[#8a8780]'
                            }`}
                          >
                            <option value={-1}>-- ไม่ได้เลือกคอลัมน์ --</option>
                            {headers.map((headerName, idx) => (
                              <option key={idx} value={idx}>
                                {headerName}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3 px-4 text-[12px] text-[#8a8780]">
                          {field.description}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Actions for Step 2 */}
            <div className="border-t border-[#e2e0d8] mt-6 pt-5 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={resetImport}
                className="px-5 py-2.5 rounded-xl border border-[#d2d0c6] hover:bg-[#fafaf8] text-[#8a8780] font-bold text-[13px] transition-colors flex items-center gap-2 cursor-pointer font-sans"
              >
                <ArrowLeft className="w-4 h-4" /> เริ่มใหม่
              </button>
              <button
                type="button"
                onClick={handleApplyMapping}
                className="bg-[#c9440f] hover:bg-[#b03b0d] text-white px-6 py-2.5 rounded-xl font-bold text-[13px] transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-[#c9440f]/15 hover:shadow-[#c9440f]/20 font-sans"
              >
                ถัดไป <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        )}

        {/* STEP 3: PREVIEW & VALIDATION */}
        {step === 3 && (
          <div className="p-6 md:p-8 flex-1 flex flex-col">
            
            <div className="mb-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="text-[14px] font-bold text-[#1a1916]">ตรวจสอบและยืนยันข้อมูลความถูกต้อง</h3>
                <p className="text-[12px] text-[#8a8780] mt-0.5">
                  พิจารณาข้อมูลที่พาร์สได้และแก้ไขข้อผิดพลาดก่อนบันทึก
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
                <span className="bg-[#1a7a4a]/10 border border-[#1a7a4a]/20 text-[#1a7a4a] px-2.5 py-1 rounded-md">
                  ข้อมูลถูกต้อง: {validations.filter(v => v.isValid).length} แถว
                </span>
                {hasErrors && (
                  <span className="bg-[#b91c1c]/10 border border-[#b91c1c]/20 text-[#b91c1c] px-2.5 py-1 rounded-md">
                    มีข้อผิดพลาด: {validations.filter(v => !v.isValid).length} แถว
                  </span>
                )}
              </div>
            </div>

            {/* Settings toggles */}
            <div className="bg-[#fafaf8] border border-[#e2e0d8] p-4 rounded-xl mb-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={skipErrors}
                  onChange={(e) => setSkipErrors(e.target.checked)}
                  className="mt-1 accent-[#c9440f]"
                />
                <div className="text-[12px]">
                  <span className="font-bold text-[#1a1916]">ข้ามรายการที่ผิดพลาดอัตโนมัติ</span>
                  <p className="text-[#8a8780] mt-0.5">เลือกเพื่อกรองแถวที่ไม่ถูกต้องออกขณะนำเข้า และนำเข้าเฉพาะแถวที่สมบูรณ์</p>
                </div>
              </label>

              {importType === 'bookings' && (
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ignoreOverlap}
                    onChange={(e) => setIgnoreOverlap(e.target.checked)}
                    className="mt-1 accent-[#c9440f]"
                  />
                  <div className="text-[12px]">
                    <span className="font-bold text-[#1a1916]">ละเว้นการตรวจสอบการจองทับซ้อน</span>
                    <p className="text-[#8a8780] mt-0.5">เลือกเมื่อคุณต้องการบังคับนำเข้าข้อมูลการจองแม้จะมีวันเข้าพักซ้อนทับกัน</p>
                  </div>
                </label>
              )}
            </div>

            {/* Preview Grid Table */}
            <div className="flex-1 overflow-x-auto border border-[#e2e0d8] rounded-xl max-h-[350px] mb-5 scrollbar">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-white shadow-[0_1px_0_rgba(226,224,216,1)] z-10">
                  <tr className="text-[11px] font-bold text-[#8a8780] uppercase tracking-wider">
                    <th className="py-2.5 px-3">แถว</th>
                    <th className="py-2.5 px-3">สถานะตรวจเช็ค</th>
                    {currentFields.map(f => (
                      <th key={f.key} className="py-2.5 px-3 whitespace-nowrap">{f.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#fafaf8] text-[12px]">
                  {previewRows.map((row, idx) => {
                    const validation = validations[idx];
                    return (
                      <tr 
                        key={idx} 
                        className={`hover:bg-[#fafaf8]/50 ${
                          !validation.isValid 
                            ? 'bg-[#b91c1c]/5 hover:bg-[#b91c1c]/10' 
                            : validation.warnings.length > 0 
                            ? 'bg-[#d97706]/5 hover:bg-[#d97706]/10' 
                            : ''
                        }`}
                      >
                        <td className="py-2.5 px-3 font-mono text-[#8a8780]">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5">
                            {validation.isValid ? (
                              validation.warnings.length > 0 ? (
                                <div className="flex items-center gap-1 text-[#d97706] font-semibold">
                                  <AlertTriangle className="w-4 h-4 shrink-0" />
                                  <span>มีคำเตือน</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-[#1a7a4a] font-semibold">
                                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                                  <span>ผ่าน</span>
                                </div>
                              )
                            ) : (
                              <div className="flex items-center gap-1 text-[#b91c1c] font-semibold">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span>ไม่ถูกต้อง</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Messages */}
                          {validation.errors.length > 0 && (
                            <div className="text-[10px] text-[#b91c1c] mt-1 list-disc pl-1.5 font-mono">
                              {validation.errors.map((e, i) => <div key={i}>• {e}</div>)}
                            </div>
                          )}
                          {validation.warnings.length > 0 && (
                            <div className="text-[10px] text-[#d97706] mt-1 list-disc pl-1.5 font-mono">
                              {validation.warnings.map((w, i) => <div key={i}>• {w}</div>)}
                            </div>
                          )}
                        </td>
                        
                        {currentFields.map(field => {
                          const val = row[field.key];
                          let displayVal = String(val === undefined || val === null ? '' : val);
                          
                          // Custom display formatters
                          if (field.key === 'isActive') {
                            displayVal = val ? 'เปิดใช้งาน' : 'ระงับการเปิด';
                          }
                          
                          return (
                            <td 
                              key={field.key} 
                              className={`py-2.5 px-3 max-w-[200px] truncate ${
                                !validation.isValid && field.required && !val
                                  ? 'border-b-2 border-red-500 bg-red-50 font-bold'
                                  : ''
                              }`}
                              title={displayVal}
                            >
                              {displayVal}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Actions for Step 3 */}
            <div className="border-t border-[#e2e0d8] mt-auto pt-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-[#d2d0c6] hover:bg-[#fafaf8] text-[#8a8780] font-bold text-[13px] transition-colors flex items-center justify-center gap-2 cursor-pointer font-sans"
              >
                <ArrowLeft className="w-4 h-4" /> ย้อนกลับ
              </button>

              <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-3">
                <span className="text-[11px] text-[#8a8780] text-center sm:text-right font-mono">
                  {hasErrors && !skipErrors 
                    ? 'โปรดเปิดใช้ "ข้ามรายการที่ผิดพลาด" หรือแก้ไขไฟล์ให้ผ่านทุกแถวก่อนยืนยัน' 
                    : 'ข้อมูลพร้อมแล้วสำหรับการนำเข้าสู่ระบบ'
                  }
                </span>
                <button
                  type="button"
                  disabled={hasErrors && !skipErrors}
                  onClick={handleExecuteImport}
                  className={`w-full sm:w-auto text-white px-7 py-2.5 rounded-xl font-bold text-[13px] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                    hasErrors && !skipErrors
                      ? 'bg-[#d2d0c6] cursor-not-allowed text-white/80 shadow-none'
                      : 'bg-[#c9440f] hover:bg-[#b03b0d] shadow-[#c9440f]/15 hover:shadow-[#c9440f]/20'
                  } font-sans`}
                >
                  🚀 ยืนยันการนำเข้าข้อมูล
                </button>
              </div>
            </div>

          </div>
        )}

        {/* STEP 4: IMPORT STATUS / RESULTS */}
        {step === 4 && (
          <div className="p-8 flex-1 flex flex-col items-center justify-center text-center">
            
            {isImporting && (
              <div className="py-10 flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-[#c9440f] border-t-transparent rounded-full animate-spin mb-4" />
                <h4 className="text-[16px] font-bold text-[#1a1916]">กำลังประมวลผลการนำเข้า...</h4>
                <p className="text-[12px] text-[#8a8780] mt-1 font-mono">กำลังตรวจสอบความถูกต้องและบันทึกลงฐานข้อมูล Supabase</p>
              </div>
            )}

            {!isImporting && importResult && (
              <div className="py-6 max-w-md">
                
                {importResult.success ? (
                  <div className="w-16 h-16 rounded-full bg-[#1a7a4a]/10 text-[#1a7a4a] flex items-center justify-center mx-auto mb-4 animate-[scaleUp_0.3s_ease]">
                    <CheckCircle2 className="w-9 h-9" />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full bg-[#b91c1c]/10 text-[#b91c1c] flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-9 h-9" />
                  </div>
                )}

                <h3 className="text-[18px] font-bold text-[#1a1916]">
                  {importResult.success ? 'นำเข้าข้อมูลเรียบร้อยแล้ว' : 'การนำเข้าข้อมูลล้มเหลว'}
                </h3>
                <p className="text-[13px] text-[#8a8780] mt-2 font-mono">
                  {importResult.message}
                </p>

                {/* Import Details Statistics */}
                <div className="my-6 grid grid-cols-2 gap-4 bg-[#fafaf8] border border-[#e2e0d8] p-4 rounded-2xl">
                  <div>
                    <div className="text-[20px] font-bold text-[#1a7a4a] font-mono">{importResult.imported}</div>
                    <div className="text-[11px] text-[#8a8780] uppercase tracking-wide font-sans">รายการนำเข้าสำเร็จ</div>
                  </div>
                  <div>
                    <div className={`text-[20px] font-bold font-mono ${importResult.failed > 0 ? 'text-[#b91c1c]' : 'text-[#8a8780]'}`}>{importResult.failed}</div>
                    <div className="text-[11px] text-[#8a8780] uppercase tracking-wide font-sans">รายการที่ข้าม/ผิดพลาด</div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={resetImport}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-[#d2d0c6] hover:bg-[#fafaf8] text-[#1a1916] font-bold text-[13px] transition-colors cursor-pointer font-sans"
                  >
                    🔄 นำเข้าไฟล์อีกครั้ง
                  </button>

                  <a
                    href={importType === 'rooms' ? '/admin/rooms' : '/admin/bookings'}
                    className="w-full sm:w-auto text-center bg-[#c9440f] hover:bg-[#b03b0d] text-white px-6 py-2.5 rounded-xl font-bold text-[13px] transition-all cursor-pointer font-sans shadow-md shadow-[#c9440f]/15"
                  >
                    📂 ดูรายการข้อมูลระบบ
                  </a>
                </div>

              </div>
            )}

          </div>
        )}

      </div>

    </div>
  );
}
