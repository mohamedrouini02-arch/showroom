/**
 * Rental Agreement - Printable Arabic Contract
 * Opens a new window with a formatted A4 Arabic rental agreement
 */

export function printRentalAgreement(rental, car, customer) {
    const printWindow = window.open('', '_blank', 'width=800,height=1100');
    if (!printWindow) {
        alert('يرجى السماح بالنوافذ المنبثقة لطباعة العقد');
        return;
    }

    const today = new Date();
    const startDate = new Date(rental.start_date);
    const endDate = new Date(rental.end_date);
    
    const formatDate = (d) => {
        const date = new Date(d);
        return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
    };

    const formatMoney = (amount) => `${Number(amount).toLocaleString('ar-DZ')} دج`;

    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const totalCost = rental.total_cost || (diffDays * rental.daily_rate);

    const mileageOut = rental.mileage_out || car?.mileage || '............';
    const pickupTime = rental.pickup_time ? rental.pickup_time.slice(0, 5) : '............';
    const carYear = car?.year || rental.cars?.year || '';
    const carMake = car?.make || rental.cars?.make || '';
    const carModel = car?.model || rental.cars?.model || '';
    const carColor = car?.color || rental.cars?.color || '';
    const carVin = car?.vin || rental.cars?.vin || '';
    const carFuel = car?.fuel || rental.cars?.fuel || '';
    const carTransmission = car?.transmission || rental.cars?.transmission || '';
    const customerName = customer?.name || rental.customers?.name || '';
    const customerPhone = customer?.phone || rental.customers?.phone || '';
    const customerAddress = customer?.address || rental.customers?.address || '';
    const customerNationalId = customer?.national_id || rental.customers?.national_id || '';

    const html = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>عقد إيجار سيارة - ${customerName}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;500;600;700&family=Amiri:wght@400;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        @page {
            size: A4;
            margin: 12mm;
        }
        
        body {
            font-family: 'Noto Naskh Arabic', 'Amiri', 'Traditional Arabic', serif;
            font-size: 13px;
            line-height: 1.8;
            color: #1a1a1a;
            background: #f0f0f0;
            direction: rtl;
        }
        
        .contract-page {
            width: 210mm;
            min-height: 297mm;
            background: white;
            margin: 10mm auto;
            padding: 14mm 16mm;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            position: relative;
            overflow: hidden;
        }
        
        /* Decorative border */
        .contract-page::before {
            content: '';
            position: absolute;
            top: 6mm;
            left: 6mm;
            right: 6mm;
            bottom: 6mm;
            border: 2px solid #2c5282;
            border-radius: 4px;
            pointer-events: none;
        }
        
        .contract-page::after {
            content: '';
            position: absolute;
            top: 8mm;
            left: 8mm;
            right: 8mm;
            bottom: 8mm;
            border: 0.5px solid #a0aec0;
            border-radius: 2px;
            pointer-events: none;
        }
        
        .content-wrapper {
            position: relative;
            z-index: 1;
            padding: 2mm;
        }

        /* Header */
        .header {
            text-align: center;
            margin-bottom: 6mm;
            padding-bottom: 4mm;
            border-bottom: 2px solid #2c5282;
        }
        
        .header h1 {
            font-size: 26px;
            font-weight: 700;
            color: #2c5282;
            margin-bottom: 2mm;
            letter-spacing: 1px;
        }
        
        .header .subtitle {
            font-size: 14px;
            color: #4a5568;
            font-weight: 500;
        }
        
        .header .contract-number {
            font-size: 11px;
            color: #718096;
            margin-top: 2mm;
        }

        /* Section titles */
        .section-title {
            background: linear-gradient(135deg, #2c5282, #2b6cb0);
            color: white;
            padding: 3mm 5mm;
            font-size: 14px;
            font-weight: 700;
            border-radius: 4px;
            margin: 4mm 0 3mm 0;
            display: flex;
            align-items: center;
            gap: 3mm;
        }
        
        .section-title .icon {
            font-size: 16px;
        }
        
        /* Info grid */
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 2mm 6mm;
            padding: 3mm 4mm;
            background: #f7fafc;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            margin-bottom: 3mm;
        }
        
        .info-item {
            display: flex;
            align-items: baseline;
            gap: 2mm;
            padding: 1.5mm 0;
        }
        
        .info-label {
            font-weight: 700;
            color: #2d3748;
            white-space: nowrap;
            font-size: 12px;
            min-width: 70px;
        }
        
        .info-value {
            color: #1a202c;
            border-bottom: 1px dotted #a0aec0;
            flex: 1;
            padding-bottom: 1px;
            font-size: 12.5px;
            font-weight: 500;
        }
        
        .info-item.full-width {
            grid-column: 1 / -1;
        }
        
        /* Price section */
        .price-section {
            background: linear-gradient(135deg, #ebf8ff, #e6fffa);
            border: 1.5px solid #2c5282;
            border-radius: 6px;
            padding: 4mm 5mm;
            margin: 4mm 0;
        }
        
        .price-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 3mm;
            text-align: center;
        }
        
        .price-item {
            padding: 2mm;
        }
        
        .price-item .label {
            font-size: 11px;
            color: #4a5568;
            font-weight: 600;
            margin-bottom: 1mm;
        }
        
        .price-item .value {
            font-size: 16px;
            font-weight: 700;
            color: #2c5282;
        }
        
        .total-price {
            text-align: center;
            margin-top: 3mm;
            padding-top: 3mm;
            border-top: 1px dashed #2c5282;
        }
        
        .total-price .label {
            font-size: 12px;
            color: #4a5568;
            font-weight: 600;
        }
        
        .total-price .value {
            font-size: 22px;
            font-weight: 700;
            color: #c53030;
        }

        /* Conditions */
        .conditions-list {
            padding: 3mm 4mm;
            background: #fffaf0;
            border: 1px solid #fbd38d;
            border-radius: 4px;
            margin-bottom: 3mm;
        }
        
        .conditions-list ol {
            padding-right: 6mm;
            margin: 0;
        }
        
        .conditions-list li {
            padding: 1.5mm 0;
            font-size: 12px;
            line-height: 1.9;
            color: #2d3748;
            position: relative;
        }
        
        .conditions-list li::marker {
            color: #c53030;
            font-weight: 700;
        }
        
        .conditions-list li strong {
            color: #c53030;
        }

        /* License copy note */
        .license-note {
            background: #fff5f5;
            border: 1px solid #fc8181;
            border-radius: 4px;
            padding: 2.5mm 4mm;
            text-align: center;
            font-weight: 700;
            color: #c53030;
            font-size: 12px;
            margin: 3mm 0;
        }

        /* Signatures */
        .signatures {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10mm;
            margin-top: 8mm;
            padding-top: 4mm;
        }
        
        .signature-box {
            text-align: center;
            border: 1px solid #cbd5e0;
            border-radius: 6px;
            padding: 4mm;
            background: #f7fafc;
        }
        
        .signature-box .title {
            font-weight: 700;
            font-size: 13px;
            color: #2d3748;
            margin-bottom: 3mm;
            padding-bottom: 2mm;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .signature-box .sign-area {
            height: 22mm;
            border-bottom: 1px solid #2d3748;
            margin: 3mm 5mm;
        }
        
        .signature-box .name {
            font-size: 11px;
            color: #718096;
            margin-top: 1mm;
        }

        /* Footer */
        .footer {
            text-align: center;
            margin-top: 5mm;
            padding-top: 3mm;
            border-top: 1px solid #e2e8f0;
            font-size: 10px;
            color: #a0aec0;
        }
        
        /* Print styles */
        @media print {
            body {
                background: white;
            }
            
            .contract-page {
                margin: 0;
                padding: 10mm 14mm;
                box-shadow: none;
                width: 100%;
                min-height: auto;
            }
            
            .no-print {
                display: none !important;
            }
        }
        
        /* Print button */
        .print-btn-container {
            text-align: center;
            margin: 5mm auto;
        }
        
        .print-btn {
            background: linear-gradient(135deg, #2c5282, #2b6cb0);
            color: white;
            border: none;
            padding: 10px 40px;
            font-size: 16px;
            font-family: 'Noto Naskh Arabic', serif;
            font-weight: 700;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .print-btn:hover {
            background: linear-gradient(135deg, #2b6cb0, #3182ce);
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(44, 82, 130, 0.4);
        }
    </style>
</head>
<body>
    <div class="print-btn-container no-print">
        <button class="print-btn" onclick="window.print()">🖨️ طباعة العقد</button>
    </div>
    
    <div class="contract-page">
        <div class="content-wrapper">
            <!-- Header -->
            <div class="header">
                <h1>عقد إيجار سيارة</h1>
                <div class="subtitle">واحد أوتو - بازول، جيجل</div>
                <div class="contract-number">رقم العقد: ${rental.id?.substring(0, 8)?.toUpperCase() || '---'} &nbsp;|&nbsp; التاريخ: ${formatDate(today)}</div>
            </div>

            <!-- Client Info -->
            <div class="section-title">
                <span class="icon">👤</span>
                معلومات المستأجر
            </div>
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">الاسم الكامل:</span>
                    <span class="info-value">${customerName}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">رقم الهاتف:</span>
                    <span class="info-value">${customerPhone}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">العنوان:</span>
                    <span class="info-value">${customerAddress || '..............................'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">رقم بطاقة التعريف:</span>
                    <span class="info-value">${customerNationalId || '..............................'}</span>
                </div>
            </div>

            <!-- Car Info -->
            <div class="section-title">
                <span class="icon">🚗</span>
                معلومات السيارة
            </div>
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">الماركة:</span>
                    <span class="info-value">${carMake}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">الموديل:</span>
                    <span class="info-value">${carModel}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">سنة الصنع:</span>
                    <span class="info-value">${carYear}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">اللون:</span>
                    <span class="info-value">${carColor || '..............................'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">نوع الوقود:</span>
                    <span class="info-value">${carFuel || '..............................'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">ناقل الحركة:</span>
                    <span class="info-value">${carTransmission || '..............................'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">رقم الهيكل:</span>
                    <span class="info-value">${carVin || '..............................'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">عداد الكيلومتر عند التسليم:</span>
                    <span class="info-value">${mileageOut} كم</span>
                </div>
            </div>

            <!-- Rental Period & Price -->
            <div class="section-title">
                <span class="icon">📅</span>
                مدة الإيجار و التكلفة
            </div>
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">تاريخ البداية:</span>
                    <span class="info-value">${formatDate(startDate)}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">تاريخ النهاية:</span>
                    <span class="info-value">${formatDate(endDate)}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">عدد الأيام:</span>
                    <span class="info-value">${diffDays} يوم</span>
                </div>
                <div class="info-item">
                    <span class="info-label">ساعة الاستلام:</span>
                    <span class="info-value">${pickupTime}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">عداد الكيلومتر عند الإرجاع:</span>
                    <span class="info-value">..............................  كم</span>
                </div>
            </div>
            
            <div class="price-section">
                <div class="price-grid">
                    <div class="price-item">
                        <div class="label">سعر اليوم الواحد</div>
                        <div class="value">${formatMoney(rental.daily_rate)}</div>
                    </div>
                    <div class="price-item">
                        <div class="label">عدد الأيام</div>
                        <div class="value">${diffDays}</div>
                    </div>
                    <div class="price-item">
                        <div class="label">المبلغ الإجمالي</div>
                        <div class="value">${formatMoney(totalCost)}</div>
                    </div>
                </div>
            </div>

            <!-- Conditions -->
            <div class="section-title">
                <span class="icon">📋</span>
                شروط و أحكام العقد
            </div>
            <div class="conditions-list">
                <ol>
                    <li>يمنع منعًا باتًا التصريح بأن السيارة مؤجرة أو مُستأجرة لأي جهة كانت.</li>
                    <li>الحد الأقصى المسموح به هو <strong>400 كم</strong>، وكل كيلومتر إضافي بعد ذلك يُحسب بـ <strong>15 دج</strong> للكيلومتر الواحد.</li>
                    <li><strong>هيكل السيارة (الكاروسري)</strong> يقع تحت مسؤولية المستأجر بالكامل. أي خدش أو ضرر في الهيكل الخارجي يتحمله المستأجر.</li>
                    <li>أي أعطال ميكانيكية أو أضرار ناتجة عن <strong>سوء استخدام السائق</strong> (مثل: القيادة بسرعة مفرطة، عدم فحص الزيت أو الماء، القيادة على طرق غير معبدة) تكون على حساب المستأجر.</li>
                    <li>المحرك وأجزاء السيارة الداخلية: الأعطال الطبيعية تكون على حساب المؤجر، أما الأعطال الناتجة عن الإهمال فتكون على حساب المستأجر.</li>
                    <li>يجب إرجاع السيارة في نفس الحالة التي تم تسليمها بها، مع نفس مستوى الوقود.</li>
                    <li>في حالة التأخر في إرجاع السيارة، يتم احتساب يوم إضافي كامل.</li>
                    <li>يتم دفع مبلغ التأمين عند استلام السيارة ويُرد عند إرجاعها بحالة جيدة.</li>
                    <li>يُمنع على المستأجر إعارة أو تأجير السيارة لطرف ثالث.</li>
                    <li>في حالة وقوع حادث مرور، يتحمل المستأجر كامل المسؤولية القانونية والمادية.</li>
                </ol>
            </div>
            
            <!-- License Copy Note -->
            <div class="license-note">
                ⚠️ يجب تقديم نسخة من رخصة السياقة و بطاقة التعريف الوطنية عند توقيع العقد
            </div>

            <!-- Declaration -->
            <div style="padding: 3mm 4mm; font-size: 12px; color: #2d3748; line-height: 2; margin-top: 2mm;">
                أقر أنا الموقع أدناه، <strong>${customerName}</strong>، أنني قرأت وفهمت جميع شروط وأحكام هذا العقد وأوافق عليها بالكامل. وأتحمل كامل المسؤولية عن أي أضرار تلحق بالسيارة خلال فترة الإيجار.
            </div>

            <!-- Signatures -->
            <div class="signatures">
                <div class="signature-box">
                    <div class="title">المؤجر</div>
                    <div class="sign-area"></div>
                    <div class="name">واحد أوتو - بازول، جيجل</div>
                </div>
                <div class="signature-box">
                    <div class="title">المستأجر</div>
                    <div class="sign-area"></div>
                    <div class="name">${customerName}</div>
                </div>
            </div>

            <!-- Footer -->
            <div class="footer">
                تم تحرير هذا العقد بتاريخ ${formatDate(today)} في نسختين أصليتين، واحدة لكل طرف.
            </div>
        </div>
    </div>
</body>
</html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
}
