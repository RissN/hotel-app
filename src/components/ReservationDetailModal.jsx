import { createPortal } from 'react-dom';

export const formatIDR = (amount) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount || 0);

export const PAYMENT_METHOD_LABEL = {
    cash: 'Cash / Tunai',
    transfer: 'Bank Transfer (Mandiri)',
    credit_card: 'Kartu Kredit',
    ewallet: 'E-Wallet',
};

export const parsePaymentRef = (refStr, method) => {
    if (!refStr) return { code: '-' };
    if (refStr.startsWith('JSON:')) {
        try { 
            const parsed = JSON.parse(refStr.substring(5)); 
            parsed.code = parsed.paymentCode || '-';
            return parsed;
        } catch (e) { return { code: refStr }; }
    }
    // Backward compatibility for old print layouts
    if (method === 'credit_card' && refStr.startsWith('CC|')) {
        const parts = refStr.split('|');
        return { code: '-', cardNumber: parts[1], cardHolder: parts[2], cardExpiry: parts[3] };
    }
    if (method === 'ewallet' && refStr.includes(' - ')) {
        const parts = refStr.split(' - ');
        return { code: '-', ewalletProvider: parts[0], ewalletPhone: parts[1] };
    }
    return { code: refStr, bankRef: refStr }; // old transfer
};

export const maskCardNumber = (cardNumber) => {
    if (!cardNumber) return '-';
    // Remove spaces/dashes if any
    const cleanNum = cardNumber.replace(/\s|-/g, '');
    if (cleanNum.length <= 4) return cardNumber;
    const last4 = cleanNum.slice(-4);
    const masked = cleanNum.slice(0, -4).replace(/./g, '*') + last4;
    // Format back into groups of 4 for better display
    return masked.replace(/(.{4})/g, '$1 ').trim();
};

export const maskPhoneNumber = (phone) => {
    if (!phone) return '-';
    const cleanNum = phone.replace(/\s|-/g, '');
    if (cleanNum.length <= 4) return phone;
    const first4 = cleanNum.slice(0, 4);
    const last2 = cleanNum.slice(-2);
    const middleLength = cleanNum.length - 6;
    return `${first4}${'*'.repeat(middleLength > 0 ? middleLength : 4)}${last2}`;
};

// ─── Print helper ──────────────────────────────────────────────────────────────
export function buildConfirmationHTML(tx) {
    const fmt = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '-';
    const payLabel = PAYMENT_METHOD_LABEL[tx.payment_method] || tx.payment_method || '-';

    return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8"/>
  <title>Reservation Confirmation – ${tx.booking_no || '-'}</title>
  <style>
    @page { margin: 0; size: A4 portrait; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { margin: 0; padding: 0.5cm 1.5cm 1cm; font-family: Arial, sans-serif; font-size: 10px; color: #111; }
    .page { max-width: 720px; margin: 0 auto; }

    /* Header */
    .header { text-align: center; margin-bottom: 10px; }
    .header img { width: 56px; height: 56px; object-fit: contain; margin-bottom: 2px; }
    .header h1 { font-size: 16px; font-weight: 700; letter-spacing: 4px; text-transform: uppercase; }

    /* Section title */
    .section-title { font-size: 14px; font-weight: 700; color: #1f2937; margin-bottom: 4px; }
    .divider-thick { border: none; border-top: 2px solid #111; margin-bottom: 2px; }
    .divider { border: none; border-top: 1px solid #111; margin-bottom: 0; }

    /* Grid 2-col */
    .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0 32px; margin: 10px 0; }
    .row { display: flex; margin-bottom: 3px; }
    .lbl { width: 112px; flex-shrink: 0; color: #1f2937; }
    .lbl-sm { width: 80px; flex-shrink: 0; color: #1f2937; }
    .val { font-weight: 700; }
    .email-link { color: #2563eb; text-decoration: underline; }
    .red { color: #dc2626; }

    /* Guest details */
    .details { margin-bottom: 10px; }
    .details .row { margin-bottom: 4px; }
    .details .lbl { width: 128px; }

    /* Guarantee box */
    .box { border: 1px solid #9ca3af; background: #fafafa; padding: 8px 12px; margin-bottom: 10px; border-radius: 2px; font-size: 9px; line-height: 1.6; }
    .box-title { font-weight: 700; color: #b91c1c; margin: 6px 0; }
    .bank-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 16px; }
    .bank-left { border-left: 3px solid #60a5fa; padding-left: 8px; }

    /* Credit card section */
    .cc-section { margin-bottom: 10px; font-size: 10px; }
    .cc-section p.label { margin-bottom: 6px; color: #1f2937; }
    .cc-row { display: flex; align-items: center; margin-bottom: 6px; width: 75%; }
    .cc-row .cc-lbl { width: 160px; flex-shrink: 0; color: #1f2937; white-space: nowrap; }
    .cc-row .colon { margin-right: 8px; }
    .cc-line { flex: 1; border-bottom: 1px solid #6b7280; min-width: 0; height: 1px; }
    .cc-checks { display: flex; align-items: center; gap: 16px; }
    .cc-checks label { display: flex; align-items: center; gap: 4px; }
    .cc-checks input { width: 12px; height: 12px; }
    .expire-fields { display: flex; align-items: center; width: 128px; }
    .expire-fields span.seg { flex: 1; border-bottom: 1px solid #6b7280; height: 1px; }
    .expire-fields span.sep { margin: 0 4px; }
    .sig-row { display: flex; align-items: flex-end; margin-top: 12px; width: 75%; }

    /* Policy */
    .policy { background: #f2f2f2; padding: 6px 12px; font-size: 8px; color: #374151; }
    .policy-title { font-weight: 700; text-decoration: underline; color: #111; margin-bottom: 3px; }
    .policy ol { margin: 0; padding-left: 14px; }
    .policy li { margin-bottom: 2px; }

    /* Payment info box */
    .pay-info-box { border: 1px solid #d1d5db; background: #f9fafb; padding: 10px 14px; margin-bottom: 10px; border-radius: 3px; font-size: 10px; }
    .pay-info-title { font-weight: 700; font-size: 11px; margin-bottom: 8px; color: #1f2937; }
    .pay-info-row { display: flex; margin-bottom: 4px; }
    .pay-info-row .pi-lbl { width: 140px; flex-shrink: 0; color: #6b7280; }
    .pay-info-row .pi-val { font-weight: 600; color: #111; }
  </style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div class="header">
    <img src="/logo.png" alt="Logo PPKD" onerror="this.style.display='none'"/>
    <h1>PPKD HOTEL</h1>
  </div>

  <!-- Title -->
  <p class="section-title">Reservation Confirmation</p>
  <hr class="divider-thick"/>
  <hr class="divider"/>

  <!-- Company / Agent Info -->
  <div class="grid2">
    <div>
      <div class="row"><span class="lbl">To.</span><span class="val">: ${tx.guest_name || '-'}</span></div>
      <div class="row"><span class="lbl">Company / Agent</span><span>: ${tx.company || 'PPKD JP'}</span></div>
      <div class="row"><span class="lbl">Booking No.</span><span>: ${tx.booking_no || '-'}</span></div>
      <div class="row"><span class="lbl">Book By</span><span>: ${tx.receptionist || 'Resepsionis'} (Hotel)</span></div>
      <div class="row"><span class="lbl">Phone</span><span>: ${tx.phone || '-'}</span></div>
      <div class="row"><span class="lbl">Email</span><span class="email-link">: ${tx.email || '-'}</span></div>
    </div>
    <div>
      <div class="row"><span class="lbl-sm">Telp</span><span>: (021) 1234567</span></div>
      <div class="row"><span class="lbl-sm">Fax</span><span>: (021) 7654321</span></div>
      <div class="row"><span class="lbl-sm">Email</span><span class="email-link">: info@ppkdhotel.com</span></div>
      <div class="row"><span class="lbl-sm">Date</span><span>: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span></div>
    </div>
  </div>
  <hr class="divider" style="margin-bottom:10px;"/>

  <!-- Guest & Room Details -->
  <div class="details">
    <div class="row"><span class="lbl">First Name</span><span class="val">: ${(tx.guest_name || '-').toUpperCase()}</span></div>
    <div class="row"><span class="lbl">Arrival Date</span><span class="val">: ${fmt(tx.arrival_date)}</span></div>
    <div class="row"><span class="lbl">Departure Date</span><span class="val">: ${fmt(tx.departure_date)}</span></div>
    <div class="row"><span class="lbl">Total Night</span><span>: ${tx.total_nights || '-'} Malam (Nights)</span></div>
    <div class="row"><span class="lbl">Room/Unit Type</span><span>: Kamar ${tx.room_no || '-'} (${tx.room_type || '-'})</span></div>
    <div class="row"><span class="lbl">Person Pax</span><span>: ${tx.number_of_persons || '-'} Orang (Person)</span></div>
    <div class="row" style="margin-top:6px;"><span class="lbl red">Room Rate Net</span><span class="val red">: ${formatIDR(tx.room_rate)} / Malam</span></div>
  </div>

  <!-- Guarantee Info Box -->
  <div class="box">
    <p>Please guarantee this booking with credit card number with clear copy of the card both sides and card holder signature in the column provided the copy of credit card both sides should be faxed to hotel fax number.</p>
    <p class="box-title">Please settle your outstanding to or account:</p>
    <div class="bank-grid">
      <div class="bank-left">
        <p style="font-weight:700;margin:0 0 2px 0;">Bank Transfer</p>
        <p style="margin:0 0 6px 0;">Bank Mandiri (Cab. Jakarta)</p>
        <p style="font-weight:700;margin:0 0 2px 0;">Mandiri Name Account</p>
        <p style="margin:0;">PPKD HOTEL JAKARTA PUSAT</p>
      </div>
      <div>
        <p style="font-weight:700;margin:0 0 2px 0;">Mandiri Account</p>
        <p style="font-family:monospace;font-size:10px;margin:0;">123-00-9876543-2</p>
      </div>
    </div>
  </div>

  <!-- Payment Method Section -->
  ${(() => {
    const pData = parsePaymentRef(tx.payment_ref, tx.payment_method);
    if (tx.payment_method === 'credit_card') {
      return `
  <div class="pay-info-box">
    <p class="pay-info-title">💳 Pembayaran via Kartu Kredit</p>
    <div class="pay-info-row"><span class="pi-lbl">Ref. Pembayaran</span><span class="pi-val">: <strong style="font-size:12px;">${pData.code || '-'}</strong></span></div>
    <div class="pay-info-row"><span class="pi-lbl">Card Number</span><span class="pi-val">: ${maskCardNumber(pData.cardNumber)}</span></div>
    <div class="pay-info-row"><span class="pi-lbl">Card Holder</span><span class="pi-val">: ${pData.cardHolder || '-'}</span></div>
    <div class="pay-info-row"><span class="pi-lbl">Expired</span><span class="pi-val">: ${pData.cardExpiry || '-'}</span></div>
    <div class="pay-info-row"><span class="pi-lbl">Jumlah Pembayaran</span><span class="pi-val red">: ${formatIDR(tx.grand_total)}</span></div>
  </div>`;
    } else if (tx.payment_method === 'transfer') {
      return `
  <div class="pay-info-box">
    <p class="pay-info-title">🏦 Pembayaran via Bank Transfer</p>
    <div class="pay-info-row"><span class="pi-lbl">Ref. Pembayaran</span><span class="pi-val">: <strong style="font-size:12px;">${pData.code || '-'}</strong></span></div>
    <div class="pay-info-row"><span class="pi-lbl">Bank</span><span class="pi-val">: Bank Mandiri (Cab. Jakarta)</span></div>
    <div class="pay-info-row"><span class="pi-lbl">No. Rekening</span><span class="pi-val">: 123-00-9876543-2</span></div>
    <div class="pay-info-row"><span class="pi-lbl">Atas Nama</span><span class="pi-val">: PPKD HOTEL JAKARTA PUSAT</span></div>
    <div class="pay-info-row"><span class="pi-lbl">Jumlah Transfer</span><span class="pi-val red">: ${formatIDR(tx.grand_total)}</span></div>
    ${pData.bankRef && pData.bankRef !== pData.code ? `<div class="pay-info-row"><span class="pi-lbl">Berita Acara</span><span class="pi-val">: ${pData.bankRef}</span></div>` : ''}
  </div>`;
    } else if (tx.payment_method === 'ewallet') {
      return `
  <div class="pay-info-box">
    <p class="pay-info-title">📱 Pembayaran via E-Wallet</p>
    <div class="pay-info-row"><span class="pi-lbl">Ref. Pembayaran</span><span class="pi-val">: <strong style="font-size:12px;">${pData.code || '-'}</strong></span></div>
    <div class="pay-info-row"><span class="pi-lbl">Provider</span><span class="pi-val">: ${(pData.ewalletProvider || '-').toUpperCase()}</span></div>
    <div class="pay-info-row"><span class="pi-lbl">No. HP / E-Wallet</span><span class="pi-val">: ${maskPhoneNumber(pData.ewalletPhone)}</span></div>
    <div class="pay-info-row"><span class="pi-lbl">Jumlah Pembayaran</span><span class="pi-val red">: ${formatIDR(tx.grand_total)}</span></div>
  </div>`;
    } else {
      return `
  <div class="pay-info-box">
    <p class="pay-info-title">💵 Pembayaran Tunai (Cash)</p>
    <div class="pay-info-row"><span class="pi-lbl">Metode</span><span class="pi-val">: Dibayar tunai saat check-in</span></div>
    <div class="pay-info-row"><span class="pi-lbl">Jumlah Pembayaran</span><span class="pi-val red">: ${formatIDR(tx.grand_total)}</span></div>
  </div>`;
    }
  })()}

  <!-- Cancellation Policy -->
  <div class="policy">
    <p class="policy-title">Cancellation policy:</p>
    <ol>
      <li>Please note that check in time is 02.00 pm and check out time 12.00 pm.</li>
      <li>All non guaranteed reservations will automatically be released on 6 pm.</li>
      <li>The Hotel will charge 1 night for guaranteed reservations that have not been canceling before the day of arrival. Please carefully note your cancellation number.</li>
    </ol>
  </div>

</div>
</body>
</html>`;
}

export function printTransaction(tx) {
    const win = window.open('', '_blank', 'width=800,height=1000');
    if (!win) return;
    win.document.write(buildConfirmationHTML(tx));
    win.document.close();
    win.focus();
    setTimeout(() => {
        win.print();
        win.close();
    }, 500);
}

export default function DetailModal({ activity, onClose, onPrint, onCheckout, onCancel, isCheckingOut }) {
    if (!activity) return null;

    const now = new Date(); now.setHours(0, 0, 0, 0);
    const arr = new Date(activity.arrival_date); arr.setHours(0, 0, 0, 0);
    const dep = new Date(activity.departure_date); dep.setHours(0, 0, 0, 0);
    
    // Use the same logic as getReservationStatus in ReservationMonitoring.jsx
    const isCanceled = activity.status === 'canceled';
    const isAktif = !isCanceled && (now >= arr && now < dep);
    const isUpcoming = !isCanceled && (now < arr);
    const isCompleted = !isCanceled && (now >= dep);

    const fmt = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-';
    const payLabel = PAYMENT_METHOD_LABEL[activity.payment_method] || activity.payment_method || '-';

    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            style={{
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(6px)',
                animation: 'detailOverlayIn 0.3s ease-out',
            }}
        >
            <div
                className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                style={{ animation: 'detailModalIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
            >
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-blue-500 px-6 py-5 rounded-t-3xl flex items-center justify-between sticky top-0 z-10">
                    <div>
                        <h3 className="text-white text-lg font-bold">Detail Reservasi</h3>
                        <p className="text-white/70 text-sm mt-0.5">Booking No. <span className="font-bold text-white">{activity.booking_no || '-'}</span></p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-all hover:rotate-90 duration-300"
                        aria-label="Tutup"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-5">

                    {/* Section: Info Tamu */}
                    <section style={{ animation: 'detailSectionIn 0.4s ease-out 0.1s both' }}>
                        <h4 className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-3 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                            Informasi Tamu
                        </h4>
                        <div className="bg-indigo-50 rounded-2xl p-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                            <div><span className="text-slate-500 block text-xs">Nama Tamu</span><span className="font-bold text-slate-800">{activity.guest_name || '-'}</span></div>
                            <div><span className="text-slate-500 block text-xs">Email</span><span className="font-medium text-slate-800 break-all">{activity.email || '-'}</span></div>
                            <div><span className="text-slate-500 block text-xs">Telepon</span><span className="font-medium text-slate-800">{activity.phone || '-'}</span></div>
                            <div><span className="text-slate-500 block text-xs">Kebangsaan</span><span className="font-medium text-slate-800">{activity.nationality || '-'}</span></div>
                            <div><span className="text-slate-500 block text-xs">Perusahaan / Agent</span><span className="font-medium text-slate-800">{activity.company || '-'}</span></div>
                            <div><span className="text-slate-500 block text-xs">Resepsionis</span><span className="font-medium text-slate-800">{activity.receptionist || '-'}</span></div>
                        </div>
                    </section>

                    {/* Section: Info Kamar */}
                    <section style={{ animation: 'detailSectionIn 0.4s ease-out 0.2s both' }}>
                        <h4 className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-3 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                            Informasi Kamar
                        </h4>
                        <div className="bg-blue-50 rounded-2xl p-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                            <div><span className="text-slate-500 block text-xs">No. Kamar</span><span className="font-bold text-slate-800">{activity.room_no || '-'}</span></div>
                            <div><span className="text-slate-500 block text-xs">Tipe Kamar</span><span className="font-bold text-slate-800">{activity.room_type || '-'}</span></div>
                            <div><span className="text-slate-500 block text-xs">Jumlah Kamar</span><span className="font-medium text-slate-800">{activity.number_of_rooms || '-'}</span></div>
                            <div><span className="text-slate-500 block text-xs">Jumlah Tamu</span><span className="font-medium text-slate-800">{activity.number_of_persons || '-'} orang</span></div>
                        </div>
                    </section>

                    {/* Section: Tanggal Menginap */}
                    <section style={{ animation: 'detailSectionIn 0.4s ease-out 0.3s both' }}>
                        <h4 className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-3 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            Tanggal Menginap
                        </h4>
                        <div className="bg-emerald-50 rounded-2xl p-4 grid grid-cols-3 gap-x-6 gap-y-2 text-sm">
                            <div><span className="text-slate-500 block text-xs">Tgl. Tiba (Check-in)</span><span className="font-bold text-slate-800">{fmt(activity.arrival_date)}</span></div>
                            <div><span className="text-slate-500 block text-xs">Tgl. Keluar (Check-out)</span><span className="font-bold text-slate-800">{fmt(activity.departure_date)}</span></div>
                            <div><span className="text-slate-500 block text-xs">Total Malam</span><span className="font-bold text-emerald-700 text-base">{activity.total_nights || '-'} malam</span></div>
                        </div>
                    </section>

                    {/* Section: Pembayaran */}
                    <section style={{ animation: 'detailSectionIn 0.4s ease-out 0.4s both' }}>
                        <h4 className="text-xs font-bold uppercase tracking-widest text-purple-600 mb-3 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                            Informasi Pembayaran
                        </h4>
                        <div className="bg-purple-50 rounded-2xl p-4 text-sm">
                            <div className="grid grid-cols-2 gap-x-6 gap-y-2 mb-3">
                                <div><span className="text-slate-500 block text-xs">Metode Pembayaran</span><span className="font-bold text-slate-800">{payLabel}</span></div>
                                <div><span className="text-slate-500 block text-xs">Harga per Malam</span><span className="font-medium text-slate-800">{formatIDR(activity.room_rate)}</span></div>
                                {activity.payment_ref && (() => {
                                    const pData = parsePaymentRef(activity.payment_ref, activity.payment_method);
                                    return (
                                        <div className="col-span-2 mt-1 space-y-1">
                                            <span className="text-slate-500 block text-xs">Referensi Pembayaran</span>
                                            <div className="bg-white/50 rounded-lg p-2 border border-purple-100/50">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-[10px] text-slate-400">Ref Code:</span>
                                                    <span className="font-bold text-slate-700">{pData.code || '-'}</span>
                                                </div>
                                                {activity.payment_method === 'credit_card' && (
                                                    <div className="space-y-0.5 border-t border-purple-100/50 pt-1 mt-1">
                                                        <div className="flex justify-between">
                                                            <span className="text-[10px] text-slate-400">Card Number:</span>
                                                            <span className="font-medium text-slate-700">{maskCardNumber(pData.cardNumber)}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-[10px] text-slate-400">Card Holder:</span>
                                                            <span className="font-medium text-slate-700">{pData.cardHolder || '-'}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-[10px] text-slate-400">Expiry:</span>
                                                            <span className="font-medium text-slate-700">{pData.cardExpiry || '-'}</span>
                                                        </div>
                                                    </div>
                                                )}
                                                {activity.payment_method === 'ewallet' && (
                                                    <div className="space-y-0.5 border-t border-purple-100/50 pt-1 mt-1">
                                                        <div className="flex justify-between">
                                                            <span className="text-[10px] text-slate-400">Provider:</span>
                                                            <span className="font-medium text-slate-700">{(pData.ewalletProvider || '-').toUpperCase()}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-[10px] text-slate-400">No. HP:</span>
                                                            <span className="font-medium text-slate-700">{maskPhoneNumber(pData.ewalletPhone)}</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                            <div className="border-t border-purple-100 pt-3 space-y-1.5">
                                <div className="flex justify-between items-center text-gray-600">
                                    <div className="flex flex-col">
                                        <span>Subtotal</span>
                                        <span className="text-[10px] text-gray-400">({formatIDR(activity.room_rate)} &times; {activity.number_of_rooms || 1} kamar &times; {activity.total_nights || 1} malam)</span>
                                    </div>
                                    <span className="font-medium">{formatIDR(activity.subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-gray-500 text-xs"><span>PPN 11%</span><span>{formatIDR(activity.tax)}</span></div>
                                <div className="flex justify-between text-gray-500 text-xs"><span>Service Charge 5%</span><span>{formatIDR(activity.service_charge)}</span></div>
                                <div className="flex justify-between font-bold text-base border-t border-purple-200 pt-2 mt-1">
                                    <span className="text-slate-800">Grand Total</span>
                                    <span className="text-purple-700">{formatIDR(activity.grand_total)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Section: Notes */}
                        {activity.notes && (
                            <div className="mt-4 pt-4 border-t border-slate-100" style={{ animation: 'detailSectionIn 0.4s ease-out 0.5s both' }}>
                                <h4 className="text-xs font-bold uppercase tracking-widest text-amber-600 mb-2 flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                    Catatan Tambahan
                                </h4>
                                <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100/50">
                                    <p className="text-sm text-amber-900 italic leading-relaxed font-medium">"{activity.notes}"</p>
                                </div>
                            </div>
                        )}
                    </section>

                    {/* Dibuat pada */}
                    <p className="text-xs text-slate-400 text-right" style={{ animation: 'detailSectionIn 0.4s ease-out 0.5s both' }}>
                        Dibuat: {activity.created_at ? new Date(activity.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                    </p>
                </div>

                {/* Modal Footer */}
                <div className="px-6 pb-6 flex justify-end gap-3" style={{ animation: 'detailSectionIn 0.4s ease-out 0.5s both' }}>
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-all text-sm"
                    >
                        Tutup
                    </button>
                    <button
                        onClick={() => onPrint(activity)}
                        className="px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 active:scale-95 text-white font-bold shadow-md hover:shadow-lg transition-all text-sm flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        Print Confirmation
                    </button>
                    {isAktif && (
                        <button
                            onClick={() => onCheckout(activity.id)}
                            disabled={isCheckingOut}
                            className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold shadow-md hover:shadow-lg transition-all text-sm flex items-center gap-2 disabled:opacity-50"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            {isCheckingOut ? 'Memproses...' : 'Check Out Sekarang'}
                        </button>
                    )}
                    {isUpcoming && activity.status !== 'canceled' && (
                        <button
                            onClick={() => onCancel(activity.id)}
                            className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold shadow-md hover:shadow-lg transition-all text-sm flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Cancel Reservasi
                        </button>
                    )}
                </div>
            </div>

            {/* Detail Modal Animations */}
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes detailOverlayIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes detailModalIn {
                    from {
                        opacity: 0;
                        transform: scale(0.85) translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                }
                @keyframes detailSectionIn {
                    from {
                        opacity: 0;
                        transform: translateY(16px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}} />
        </div>,
        document.body
    );
}
