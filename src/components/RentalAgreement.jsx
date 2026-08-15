/**
 * Premium 2-Page Modern Arabic Rental Agreement
 * Format: A4 (2 Pages), Printable, RTL layout, Sleek Modern Aesthetics
 */

export function printRentalAgreement(rental, car, customer) {
    const printWindow = window.open('', '_blank', 'width=900,height=1200');
    if (!printWindow) {
        alert('يرجى السماح بالنوافذ المنبثقة لطباعة العقد');
        return;
    }

    const today = new Date();
    const startDate = new Date(rental.start_date);
    const endDate = new Date(rental.end_date);
    
    const formatDate = (d) => {
        if (!d) return '............';
        const date = new Date(d);
        return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
    };

    const formatMoney = (amount) => `${Number(amount || 0).toLocaleString('ar-DZ')} دج`;

    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    const totalCost = rental.total_cost || (diffDays * rental.daily_rate);

    const mileageOut = rental.mileage_out || car?.mileage || '............';
    const pickupTime = rental.pickup_time ? rental.pickup_time.slice(0, 5) : '10:00';
    const carYear = car?.year || rental.cars?.year || '2024';
    const carMake = car?.make || rental.cars?.make || 'Toyota';
    const carModel = car?.model || rental.cars?.model || 'Corolla';
    const carColor = car?.color || rental.cars?.color || 'أبيض';
    const carVin = car?.vin || rental.cars?.vin || 'غير محدد';
    const carFuel = car?.fuel || rental.cars?.fuel || 'بنزين';
    const carTransmission = car?.transmission || rental.cars?.transmission || 'أوتوماتيك';
    const customerName = customer?.name || rental.customers?.name || 'اسم المستأجر';
    const customerPhone = customer?.phone || rental.customers?.phone || '0550000000';
    const customerAddress = customer?.address || rental.customers?.address || 'جيجل، الجزائر';
    const customerNationalId = customer?.national_id || rental.customers?.national_id || 'رقم رخصة السياقة';

    const contractId = rental.id ? rental.id.substring(0, 8).toUpperCase() : 'WA-' + Math.floor(100000 + Math.random() * 900000);

    const html = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>عقد إيجار سيارة - ${customerName} (${contractId})</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@400;500;600;700;800;900&family=Amiri:wght@400;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        @page {
            size: A4 portrait;
            margin: 0;
        }
        
        body {
            font-family: 'Noto Kufi Arabic', 'Amiri', 'Traditional Arabic', sans-serif;
            font-size: 11.5px;
            line-height: 1.6;
            color: #0f172a;
            background: #cbd5e1;
            direction: rtl;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }
        
        /* Strict Full Size A4 Page Container */
        .page {
            width: 210mm;
            height: 297mm;
            min-height: 297mm;
            max-height: 297mm;
            background: white;
            margin: 8mm auto;
            padding: 12mm 15mm;
            box-shadow: 0 12px 35px rgba(0,0,0,0.18);
            position: relative;
            page-break-after: always;
            page-break-inside: avoid;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            overflow: hidden;
            box-sizing: border-box;
        }

        /* Outer Frame Border */
        .page-frame {
            position: absolute;
            top: 5mm;
            left: 5mm;
            right: 5mm;
            bottom: 5mm;
            border: 2px solid #0f172a;
            border-radius: 6px;
            pointer-events: none;
        }

        .page-frame-inner {
            position: absolute;
            top: 6.5mm;
            left: 6.5mm;
            right: 6.5mm;
            bottom: 6.5mm;
            border: 0.5px solid #94a3b8;
            border-radius: 4px;
            pointer-events: none;
        }
        
        .content {
            position: relative;
            z-index: 2;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        }

        /* Modern Header Banner */
        .header {
            background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
            color: #0f172a;
            padding: 10px 18px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 12px;
            box-shadow: 0 2px 10px rgba(15, 23, 42, 0.08);
            border: 1.5px solid #e2e8f0;
            border-bottom: 3.5px solid #1e3a8a;
        }

        .brand-title {
            display: flex;
            align-items: center;
            gap: 16px;
        }

        .brand-logo-img {
            height: 52px;
            width: auto;
            object-fit: contain;
        }

        .brand-text h1 {
            font-size: 20px;
            font-weight: 900;
            letter-spacing: -0.5px;
            color: #1e3a8a;
            margin-bottom: 1px;
        }

        .brand-text p {
            font-size: 10.5px;
            color: #15803d;
            font-weight: 800;
            letter-spacing: 0.3px;
        }

        .brand-sub {
            font-size: 9.5px;
            color: #64748b;
            font-weight: 600;
        }

        .contract-meta {
            text-align: left;
            background: #f1f5f9;
            padding: 8px 14px;
            border-radius: 8px;
            border: 1px solid #cbd5e1;
        }

        .contract-badge {
            display: inline-block;
            background: #1e3a8a;
            color: white;
            font-size: 11.5px;
            font-weight: 800;
            padding: 3px 10px;
            border-radius: 4px;
            margin-bottom: 3px;
        }

        .contract-date {
            font-size: 10.5px;
            color: #475569;
            font-weight: 600;
        }

        .contract-phone {
            font-size: 10.5px;
            color: #1e3a8a;
            font-weight: 800;
            margin-top: 2px;
        }

        /* Section Cards */
        .section-box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 10px 14px;
            margin-bottom: 10px;
        }

        .section-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding-bottom: 6px;
            margin-bottom: 8px;
            border-bottom: 2px solid #e2e8f0;
        }

        .section-title {
            font-size: 12.5px;
            font-weight: 800;
            color: #0f172a;
            display: flex;
            align-items: center;
            gap: 7px;
        }

        .section-title span.icon {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 22px;
            height: 22px;
            background: #0f172a;
            color: white;
            border-radius: 6px;
            font-size: 11px;
        }

        /* Data Grid Table Layout */
        .grid-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 7px 14px;
        }

        .grid-3 {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 7px 12px;
        }

        .grid-4 {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr 1fr;
            gap: 7px 10px;
        }

        .field-group {
            display: flex;
            flex-direction: column;
        }

        .field-label {
            font-size: 9.5px;
            font-weight: 700;
            color: #64748b;
            margin-bottom: 2px;
            text-transform: uppercase;
        }

        .field-value {
            font-size: 11.5px;
            font-weight: 700;
            color: #0f172a;
            background: white;
            padding: 5px 9px;
            border-radius: 6px;
            border: 1px solid #cbd5e1;
            min-height: 30px;
            display: flex;
            align-items: center;
        }

        /* Highlight Cards for Financials */
        .financial-summary {
            display: grid;
            grid-template-columns: 1.2fr 1.2fr 1fr 1.2fr;
            gap: 8px;
            margin: 8px 0 4px 0;
        }

        .fin-card {
            background: white;
            border: 1.5px solid #cbd5e1;
            border-radius: 10px;
            padding: 8px 6px;
            text-align: center;
        }

        .fin-card.primary {
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            color: white;
            border-color: #0f172a;
        }

        .fin-card.primary .fin-label {
            color: #94a3b8;
        }

        .fin-card.primary .fin-value {
            color: #38bdf8;
        }

        .fin-card.highlight {
            background: #eff6ff;
            border-color: #3b82f6;
        }

        .fin-card.highlight .fin-value {
            color: #2563eb;
        }

        .fin-label {
            font-size: 9.5px;
            font-weight: 700;
            color: #475569;
            margin-bottom: 3px;
        }

        .fin-value {
            font-size: 16px;
            font-weight: 900;
            color: #0f172a;
        }

        /* Visual Inspection Grid & Diagram */
        .inspection-box {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
        }

        .diagram-container {
            background: white;
            border: 1px dashed #cbd5e1;
            border-radius: 8px;
            padding: 7px;
            text-align: center;
        }

        .car-diagram-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 5px;
            margin-top: 4px;
        }

        .diagram-spot {
            background: #f1f5f9;
            border: 1px solid #e2e8f0;
            padding: 4px;
            border-radius: 4px;
            font-size: 9.5px;
            font-weight: 700;
            color: #334155;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .diagram-spot span.mark {
            font-weight: 900;
            color: #16a34a;
        }

        .checklist-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 5px;
        }

        .check-item {
            background: white;
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            padding: 5px 9px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 10px;
            font-weight: 700;
        }

        .check-item span.status {
            font-weight: 800;
            color: #16a34a;
        }

        /* Handover Signatures Box Page 1 */
        .handover-sign-box {
            background: #f1f5f9;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 7px 12px;
            margin-top: 6px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .handover-sign-item {
            font-size: 10px;
            font-weight: 700;
            color: #334155;
        }

        /* Conditions Styling for Page 2 */
        .conditions-container {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }

        .condition-card {
            background: white;
            border: 1px solid #e2e8f0;
            border-right: 4px solid #0f172a;
            border-radius: 6px;
            padding: 7px 11px;
            display: flex;
            align-items: flex-start;
            gap: 9px;
        }

        .condition-card.alert {
            border-right-color: #dc2626;
            background: #fef2f2;
        }

        .condition-num {
            background: #0f172a;
            color: white;
            font-size: 10.5px;
            font-weight: 800;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            margin-top: 1px;
        }

        .condition-card.alert .condition-num {
            background: #dc2626;
        }

        .condition-text {
            font-size: 11px;
            color: #1e293b;
            line-height: 1.55;
        }

        .condition-text strong {
            color: #0f172a;
            font-weight: 800;
        }

        .condition-card.alert .condition-text strong {
            color: #b91c1c;
        }

        /* Customer Declaration Box */
        .declaration-box {
            background: #f1f5f9;
            border: 1.5px dashed #64748b;
            border-radius: 8px;
            padding: 9px 12px;
            margin: 8px 0;
            font-size: 10.5px;
            line-height: 1.65;
            color: #0f172a;
        }

        /* Signature Section */
        .signatures-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 10px;
            margin-top: 8px;
        }

        .sig-box {
            border: 1.5px solid #cbd5e1;
            border-radius: 10px;
            background: white;
            padding: 9px;
            text-align: center;
            min-height: 110px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        }

        .sig-title {
            font-size: 10.5px;
            font-weight: 800;
            color: #0f172a;
            border-bottom: 1px solid #f1f5f9;
            padding-bottom: 4px;
        }

        .sig-space {
            height: 50px;
        }

        .sig-name {
            font-size: 9.5px;
            color: #64748b;
            font-weight: 600;
        }

        /* Footer */
        .page-footer {
            border-top: 1px solid #e2e8f0;
            padding-top: 6px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 9.5px;
            color: #475569;
            font-weight: 600;
        }

        /* Print Controls */
        .print-toolbar {
            position: fixed;
            top: 15px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 9999;
            background: #0f172a;
            padding: 10px 24px;
            border-radius: 30px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            gap: 16px;
        }

        .btn-print {
            background: #3b82f6;
            color: white;
            border: none;
            padding: 8px 24px;
            font-size: 14px;
            font-family: 'Noto Kufi Arabic', sans-serif;
            font-weight: 700;
            border-radius: 20px;
            cursor: pointer;
            transition: all 0.2s;
        }

        .btn-print:hover {
            background: #2563eb;
            transform: scale(1.05);
        }

        @media print {
            body {
                background: white;
            }
            .page {
                margin: 0 !important;
                box-shadow: none !important;
                width: 210mm !important;
                height: 297mm !important;
                min-height: 297mm !important;
                max-height: 297mm !important;
                page-break-after: always !important;
                page-break-inside: avoid !important;
            }
            .print-toolbar {
                display: none !important;
            }
        }
    </style>
</head>
<body>

    <!-- Floating Print Button -->
    <div class="print-toolbar">
        <span style="color: white; font-size: 13px; font-weight: 600;">📄 عقد إيجار رسمي (واحد أوتو - WAHID AUTO)</span>
        <button class="btn-print" onclick="window.print()">🖨️ طباعة العقد</button>
    </div>

    <!-- ================= PAGE 1 ================= -->
    <div class="page">
        <div class="page-frame"></div>
        <div class="page-frame-inner"></div>

        <div class="content">
            <div>
                <!-- Header Banner with Official Logo -->
                <div class="header">
                    <div class="brand-title">
                        <img src="/logo.png" alt="Wahid Auto Logo" class="brand-logo-img" onerror="this.src='${window.location.origin}/logo.png'" />
                        <div class="brand-text">
                            <h1>واحد أوتو - WAHID AUTO</h1>
                            <p>THE ONE CHOICE FOR KOREAN & CHINESE CARS</p>
                            <div class="brand-sub">معرض وكراء السيارات - بازول، طاهير، جيجل</div>
                        </div>
                    </div>

                    <div class="contract-meta">
                        <div class="contract-badge">عقد إيجار رقم: ${contractId}</div>
                        <div class="contract-date">تاريخ التحرير: ${formatDate(today)}</div>
                        <div class="contract-phone">📞 0557060478 / 0781663201</div>
                    </div>
                </div>

                <!-- Section 1: Customer Info -->
                <div class="section-box">
                    <div class="section-header">
                        <div class="section-title">
                            <span class="icon">👤</span>
                            أولاً: بيانات المستأجر والسائق (الطرف الثاني)
                        </div>
                        <span style="font-size: 9.5px; font-weight: 700; color: #1e40af; background: #dbeafe; padding: 2px 8px; border-radius: 4px;">نسخة رخصة السياقة مرفقة</span>
                    </div>

                    <div class="grid-2" style="margin-bottom: 7px;">
                        <div class="field-group">
                            <span class="field-label">اسم ولقب المستأجر (السائق المعتمد)</span>
                            <div class="field-value">${customerName}</div>
                        </div>
                        <div class="field-group">
                            <span class="field-label">رقم هاتف المستأجر</span>
                            <div class="field-value" dir="ltr" style="text-align: right;">${customerPhone}</div>
                        </div>
                    </div>

                    <div class="grid-2">
                        <div class="field-group">
                            <span class="field-label">العنوان الشخصي / الإقامة</span>
                            <div class="field-value">${customerAddress}</div>
                        </div>
                        <div class="field-group">
                            <span class="field-label">رقم بطاقة التعريف / رخصة السياقة</span>
                            <div class="field-value">${customerNationalId}</div>
                        </div>
                    </div>
                </div>

                <!-- Section 2: Vehicle Specs -->
                <div class="section-box">
                    <div class="section-header">
                        <div class="section-title">
                            <span class="icon">🚗</span>
                            ثانياً: مواصفات المركبة المؤجرة
                        </div>
                    </div>

                    <div class="grid-4" style="margin-bottom: 7px;">
                        <div class="field-group">
                            <span class="field-label">ماركة المركبة</span>
                            <div class="field-value">${carMake}</div>
                        </div>
                        <div class="field-group">
                            <span class="field-label">الموديل والطراز</span>
                            <div class="field-value">${carModel}</div>
                        </div>
                        <div class="field-group">
                            <span class="field-label">سنة الصنع</span>
                            <div class="field-value">${carYear}</div>
                        </div>
                        <div class="field-group">
                            <span class="field-label">اللون</span>
                            <div class="field-value">${carColor}</div>
                        </div>
                    </div>

                    <div class="grid-3">
                        <div class="field-group">
                            <span class="field-label">نوع الوقود / ناقل الحركة</span>
                            <div class="field-value">${carFuel} / ${carTransmission}</div>
                        </div>
                        <div class="field-group">
                            <span class="field-label">رقم الهيكل (VIN)</span>
                            <div class="field-value" style="font-family: monospace; font-size: 11px;">${carVin}</div>
                        </div>
                        <div class="field-group">
                            <span class="field-label">عداد الكيلومتر عند التسليم</span>
                            <div class="field-value" style="color: #0284c7; font-weight: 900;">${mileageOut} كم</div>
                        </div>
                    </div>
                </div>

                <!-- Section 3: Rental Financials -->
                <div class="section-box">
                    <div class="section-header">
                        <div class="section-title">
                            <span class="icon">📅</span>
                            ثالثاً: فترة الإيجار والشروط المالية
                        </div>
                    </div>

                    <div class="grid-3" style="margin-bottom: 7px;">
                        <div class="field-group">
                            <span class="field-label">تاريخ ووقت الاستلام</span>
                            <div class="field-value">${formatDate(startDate)} (${pickupTime})</div>
                        </div>
                        <div class="field-group">
                            <span class="field-label">تاريخ الإرجاع المحدد</span>
                            <div class="field-value">${formatDate(endDate)}</div>
                        </div>
                        <div class="field-group">
                            <span class="field-label">مدة الإيجار الإجمالية</span>
                            <div class="field-value" style="color: #2563eb;">${diffDays} أيام</div>
                        </div>
                    </div>

                    <div class="financial-summary">
                        <div class="fin-card">
                            <div class="fin-label">سعر الإيجار اليومي</div>
                            <div class="fin-value">${formatMoney(rental.daily_rate)}</div>
                        </div>
                        <div class="fin-card highlight">
                            <div class="fin-label">المبلغ الإجمالي المستحق</div>
                            <div class="fin-value">${formatMoney(totalCost)}</div>
                        </div>
                        <div class="fin-card">
                            <div class="fin-label">مبلغ الضمان المسترد</div>
                            <div class="fin-value" style="color: #059669; font-size: 15px;">تأمين رسمي</div>
                        </div>
                        <div class="fin-card primary">
                            <div class="fin-label">الحد المسموح للكيلومترات</div>
                            <div class="fin-value" style="font-size: 15px;">400 كم / يوم</div>
                        </div>
                    </div>
                </div>

                <!-- Section 4: Inspection & Handover Diagram -->
                <div class="section-box">
                    <div class="section-header">
                        <div class="section-title">
                            <span class="icon">🔍</span>
                            رابعاً: مخطط المعاينة والتجهيزات عند الاستلام
                        </div>
                    </div>

                    <div class="inspection-box">
                        <div class="diagram-container">
                            <span style="font-size: 9.5px; font-weight: 700; color: #475569;">مخطط معاينة هيكل المركبة (الكاروسري)</span>
                            <div class="car-diagram-grid">
                                <div class="diagram-spot">المصد الأمامي <span class="mark">سليم ✔️</span></div>
                                <div class="diagram-spot">المصد الخلفي <span class="mark">سليم ✔️</span></div>
                                <div class="diagram-spot">الجانب الأيمن <span class="mark">سليم ✔️</span></div>
                                <div class="diagram-spot">الجانب الأيسر <span class="mark">سليم ✔️</span></div>
                                <div class="diagram-spot">السقف والزجاج <span class="mark">سليم ✔️</span></div>
                                <div class="diagram-spot">الإطارات <span class="mark">ممتازة ✔️</span></div>
                            </div>
                        </div>

                        <div class="checklist-grid">
                            <div class="check-item">
                                مستوى الوقود
                                <span class="status">مملوء ⛽</span>
                            </div>
                            <div class="check-item">
                                عجلة احتياطية
                                <span class="status">موجودة ✔️</span>
                            </div>
                            <div class="check-item">
                                رافعة ومفتاح
                                <span class="status">موجودة ✔️</span>
                            </div>
                            <div class="check-item">
                                وثائق السيارة
                                <span class="status">كاملة 📁</span>
                            </div>
                        </div>
                    </div>

                    <div class="handover-sign-box">
                        <div class="handover-sign-item">إقرار المعاينة: عاينت المركبة ووجدتها خالية من الأضرار وقت الاستلام</div>
                        <div class="handover-sign-item">توقيع المستأجر المبدئي: .........................</div>
                    </div>
                </div>
            </div>

            <!-- Page 1 Footer -->
            <div class="page-footer">
                <span>واحد أوتو لكراء السيارات - بازول، طاهير، جيجل | 📞 0557060478 / 0781663201</span>
                <span>صفحة 1 من 2</span>
            </div>
        </div>
    </div>

    <!-- ================= PAGE 2 ================= -->
    <div class="page">
        <div class="page-frame"></div>
        <div class="page-frame-inner"></div>

        <div class="content">
            <div>
                <!-- Header Banner Page 2 -->
                <div class="header">
                    <div class="brand-title">
                        <img src="/logo.png" alt="Wahid Auto Logo" class="brand-logo-img" onerror="this.src='${window.location.origin}/logo.png'" />
                        <div class="brand-text">
                            <h1>واحد أوتو - WAHID AUTO</h1>
                            <p>عقد إيجار سيارة - صفحة الشروط والأحكام والالتزامات 2/2</p>
                        </div>
                    </div>

                    <div class="contract-meta">
                        <div class="contract-badge">رقم العقد: ${contractId}</div>
                        <div class="contract-phone">📞 0557060478 / 0781663201</div>
                    </div>
                </div>

                <!-- Section 5: Legal Terms & Conditions -->
                <div class="section-box" style="margin-bottom: 8px;">
                    <div class="section-header">
                        <div class="section-title">
                            <span class="icon">📋</span>
                            خامساً: شروط وأحكام العقد والالتزامات القانونية
                        </div>
                    </div>

                    <div class="conditions-container">
                        <div class="condition-card alert">
                            <div class="condition-num">1</div>
                            <div class="condition-text">
                                <strong>السرية وعدم التصريح الإيجاري:</strong> يمنع منعًا باتًا التصريح بأن السيارة مؤجرة أو مستأجرة أمام أي جهة رسمية أو غير رسمية، وتعتبر المركبة مخصصة للاستعمال الشخصي الفردي فقط.
                            </div>
                        </div>

                        <div class="condition-card alert">
                            <div class="condition-num">2</div>
                            <div class="condition-text">
                                <strong>حصرية القيادة والإرجاع على المستأجر:</strong> يقتصر حق قيادة المركبة واستعمالها حصريًا على <strong>المستأجر (السائق المعتمد والموقع في هذا العقد) دون غيره</strong> ويُمنع منعًا باتًا قيادتها من طرف أي شخص آخر. كما يلتزم المستأجر نفسه بإرجاع المركبة وتسليمها شخصيًا للمعرض وقت الانتهاء.
                            </div>
                        </div>

                        <div class="condition-card alert">
                            <div class="condition-num">3</div>
                            <div class="condition-text">
                                <strong>شرط الكيلومترات الإضافية:</strong> الحد الأقصى المسموح به هو <strong>400 كم</strong> لكل يوم إيجار. وكل كيلومتر إضافي بعد 400 كم يُحسب بـ <strong>15 دج</strong> للكيلومتر الواحد وتُدفع عند الإرجاع.
                            </div>
                        </div>

                        <div class="condition-card alert">
                            <div class="condition-num">4</div>
                            <div class="condition-text">
                                <strong>مسؤولية هيكل السيارة (الكاروسري):</strong> هيكل السيارة الخارجي يقع تحت <strong>مسؤولية المستأجر بالكامل</strong>. أي خدش، انبعاج، أضرار في الدهان، أو كسور في الزجاج والمرايا يتحمل المستأجر تكاليف إصلاحها كاملة.
                            </div>
                        </div>

                        <div class="condition-card alert">
                            <div class="condition-num">5</div>
                            <div class="condition-text">
                                <strong>الأعطال الميكانيكية وسوء استخدام السائق:</strong> المحرك والعلبة الميكانيكية مسؤولية المؤجر في حالة التلف الطبيعي. أما <strong>الأعطال الناتجة عن سوء الاستخدام</strong> (كالقيادة بدون زيت/ماء، السرعة المفرطة، أو السير في الطرق غير المعبدة) فتقع على المستأجر.
                            </div>
                        </div>

                        <div class="condition-card">
                            <div class="condition-num">6</div>
                            <div class="condition-text">
                                <strong>نسخة الوثائق الرسمية:</strong> يلتزم المستأجر بتقديم نسخة طبق الأصل من <strong>رخصة السياقة الصالحة وبطاقة التعريف الوطنية</strong>، والتي تبقى محفوظة في أرشيف المعرض طيلة مدة العقد.
                            </div>
                        </div>

                        <div class="condition-card">
                            <div class="condition-num">7</div>
                            <div class="condition-text">
                                <strong>الحوادث والمخالفات المرورية:</strong> يتحمل المستأجر المسئولية المادية والشخصية عن جميع المخالفات والغرامات المرورية المسجلة خلال فترة الإيجار، وكذا التكاليف الناتجة عن الحوادث المرورية.
                            </div>
                        </div>

                        <div class="condition-card">
                            <div class="condition-num">8</div>
                            <div class="condition-text">
                                <strong>مواعيد التأخير والإرجاع:</strong> يتعهد المستأجر بإعادة المركبة في الوقت والتاريخ المحددين. أي تأخير يتجاوز ساعتين دون إذن رسمي يُحسب كـ <strong>يوم إيجار كامل إضافي</strong>.
                            </div>
                        </div>

                        <div class="condition-card">
                            <div class="condition-num">9</div>
                            <div class="condition-text">
                                <strong>حظر إعادة التأجير أو الإعارة:</strong> يُحظر على المستأجر حظرًا قاطعًا تسليم السيارة لشخص ثالث أو إعادة تأجيرها أو استعمالها في أغراض تجارية غير قانونية.
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Section 6: Customer Declaration -->
                <div class="declaration-box">
                    <strong>إقرار واعتراف المستأجر:</strong><br>
                    أقر أنا الموقع أدناه المستأجر <strong>(${customerName})</strong> بأنني السائق الوحيد المعتمد لقيادة وإرجاع المركبة، وعاينت المركبة المعاينة التامة ووجدتها بحالة ممتازة، وقرأت جميع شروط وأحكام هذا العقد المكون من صفحتين وأوافق عليها دون أي تحفظ.
                </div>

                <!-- Section 7: Signatures & Stamp -->
                <div class="signatures-grid">
                    <div class="sig-box">
                        <div class="sig-title">توقيع المستأجر والسائق المعتمد</div>
                        <div class="sig-space"></div>
                        <div class="sig-name">${customerName}</div>
                    </div>

                    <div class="sig-box">
                        <div class="sig-title">بصمة المستأجر (الإبهام الأيسر)</div>
                        <div class="sig-space"></div>
                        <div class="sig-name">البصمة الحية</div>
                    </div>

                    <div class="sig-box">
                        <div class="sig-title">توقيع وختم المعرض (المؤجر)</div>
                        <div class="sig-space"></div>
                        <div class="sig-name">واحد أوتو - WAHID AUTO</div>
                    </div>
                </div>
            </div>

            <!-- Page 2 Footer -->
            <div class="page-footer">
                <span>واحد أوتو لكراء السيارات - بازول، طاهير، جيجل | 📞 0557060478 / 0781663201</span>
                <span>صفحة 2 من 2</span>
            </div>
        </div>
    </div>

</body>
</html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
}
