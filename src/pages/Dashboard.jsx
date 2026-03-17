import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import CustomAlert from '../components/CustomAlert';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Area, AreaChart
} from 'recharts';

const formatIDR = (amount) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount || 0);

const PAYMENT_METHOD_LABEL = {
    cash: 'Cash / Tunai',
    transfer: 'Bank Transfer (Mandiri)',
    credit_card: 'Kartu Kredit',
    ewallet: 'E-Wallet',
};

const parsePaymentRef = (refStr, method) => {
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

const maskCardNumber = (cardNumber) => {
    if (!cardNumber) return '-';
    // Remove spaces/dashes if any
    const cleanNum = cardNumber.replace(/\s|-/g, '');
    if (cleanNum.length <= 4) return cardNumber;
    const last4 = cleanNum.slice(-4);
    const masked = cleanNum.slice(0, -4).replace(/./g, '*') + last4;
    // Format back into groups of 4 for better display
    return masked.replace(/(.{4})/g, '$1 ').trim();
};

const maskPhoneNumber = (phone) => {
    if (!phone) return '-';
    const cleanNum = phone.replace(/\s|-/g, '');
    if (cleanNum.length <= 4) return phone;
    // Mask all but first 4 and last 2 characters or just masking the middle part
    // Usual pattern for phone: 0812****56
    const first4 = cleanNum.slice(0, 4);
    const last2 = cleanNum.slice(-2);
    const middleLength = cleanNum.length - 6;
    return `${first4}${'*'.repeat(middleLength > 0 ? middleLength : 4)}${last2}`;
};

// ─── Print helper ──────────────────────────────────────────────────────────────
function buildConfirmationHTML(tx) {
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

function printTransaction(tx) {
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

function DetailModal({ activity, onClose, onPrint, onCheckout, onCancel, isCheckingOut }) {
    if (!activity) return null;

    const now = new Date();
    now.setHours(0,0,0,0);
    const arr = new Date(activity.arrival_date);
    const dep = new Date(activity.departure_date);
    const isAktif = now >= arr && now < dep;
    const isUpcoming = now < arr;

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
                    {isUpcoming && (
                        <button
                            onClick={() => onCancel(activity.id)}
                            className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold shadow-md hover:shadow-lg transition-all text-sm flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Cancel Reservasi
                        </button>
                    )}
                </div>
            </div>

            {/* Detail Modal Animations */}
            <style>{`
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
            `}</style>
        </div>,
        document.body
    );
}

// ─── Dashboard ─────────────────────────────────────────────────────────────────
export default function Dashboard() {
    const { role } = useAuth();
    const location = useLocation();
    const [stats, setStats] = useState({
        totalReservations: 0,
        activeReservations: 0,
        completedReservations: 0,
        upcomingReservations: 0
    });
    const [recentActivities, setRecentActivities] = useState([]);
    const [allTransactions, setAllTransactions] = useState([]);
    const [chartRange, setChartRange] = useState('1bulan');
    const [loading, setLoading] = useState(true);
    const [selectedActivity, setSelectedActivity] = useState(null);
    const [jakartaTime, setJakartaTime] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [roomTypeFilter, setRoomTypeFilter] = useState('Semua');

    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ 
        isOpen: false, 
        title: '', 
        message: '', 
        type: 'info',
        onConfirm: null 
    });

    // Fetch dashboard stats func
    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const { count: totalReservations } = await supabase
                .from('transactions')
                .select('*', { count: 'exact', head: true });

            const { data: allDates } = await supabase
                .from('transactions')
                .select('arrival_date, departure_date');
            
            let activeCount = 0;
            let completedCount = 0;
            let upcomingCount = 0;
            
            if (allDates) {
                const today = new Date();
                today.setHours(0,0,0,0);
                
                allDates.forEach(t => {
                    const arrival = new Date(t.arrival_date);
                    arrival.setHours(0,0,0,0);
                    const departure = new Date(t.departure_date);
                    departure.setHours(0,0,0,0);
                    
                    if (today >= arrival && today < departure) {
                        activeCount++;
                    } else if (today >= departure) {
                        completedCount++;
                    } else {
                        upcomingCount++;
                    }
                });
            }


            const { data: recentResData } = await supabase
                .from('transactions')
                .select('id, booking_no, guest_name, email, phone, room_no, room_type, number_of_rooms, number_of_persons, arrival_date, departure_date, total_nights, room_rate, subtotal, tax, service_charge, grand_total, payment_method, payment_ref, nationality, company, receptionist, notes, created_at')
                .order('created_at', { ascending: false })
                .limit(50);

            setRecentActivities(recentResData || []);

            // ── Fetch ALL transactions for revenue charts ──
            const { data: allTx } = await supabase
                .from('transactions')
                .select('grand_total, created_at');

            setAllTransactions(allTx || []);

            setStats({
                totalReservations: totalReservations || 0,
                activeReservations: activeCount,
                completedReservations: completedCount,
                upcomingReservations: upcomingCount
            });
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        } finally {
            setLoading(false);
        }
    };

    // Real-time Jakarta clock
    useEffect(() => {
        const tick = () => {
            const now = new Date().toLocaleString('id-ID', {
                timeZone: 'Asia/Jakarta',
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
            });
            setJakartaTime(now);
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, [location.key]);

    const handleCheckout = async (id) => {
        setAlertConfig({
            isOpen: true,
            title: 'Konfirmasi Check-out',
            message: 'Apakah tamu ini ingin check-out sekarang? Tanggal departure akan diperbarui ke hari ini.',
            type: 'confirm',
            onConfirm: async () => {
                setAlertConfig(prev => ({ ...prev, isOpen: false }));
                setIsCheckingOut(true);
                try {
                    const todayDate = new Date().toISOString().split('T')[0];
                    const { error } = await supabase
                        .from('transactions')
                        .update({ departure_date: todayDate })
                        .eq('id', id);

                    if (error) throw error;
                    
                    // Re-fetch data to update UI
                    await fetchDashboardData();
                    setSelectedActivity(null);
                    
                    setAlertConfig({
                        isOpen: true,
                        title: 'Berhasil',
                        message: 'Check-out berhasil dilakukan!',
                        type: 'success'
                    });
                } catch (error) {
                    console.error('Error checking out:', error);
                    setAlertConfig({
                        isOpen: true,
                        title: 'Kesalahan',
                        message: 'Gagal melakukan check-out: ' + error.message,
                        type: 'error'
                    });
                } finally {
                    setIsCheckingOut(false);
                }
            }
        });
    };

    const handleCancel = async (id) => {
        setAlertConfig({
            isOpen: true,
            title: 'Konfirmasi Pembatalan',
            message: 'Apakah Anda yakin ingin membatalkan reservasi ini? Data akan dihapus permanen dari sistem.',
            type: 'confirm',
            onConfirm: async () => {
                setAlertConfig(prev => ({ ...prev, isOpen: false }));
                try {
                    const { error } = await supabase
                        .from('transactions')
                        .delete()
                        .eq('id', id);

                    if (error) throw error;
                    
                    await fetchDashboardData();
                    setSelectedActivity(null);
                    
                    setAlertConfig({
                        isOpen: true,
                        title: 'Berhasil',
                        message: 'Reservasi berhasil dibatalkan.',
                        type: 'success'
                    });
                } catch (error) {
                    console.error('Error canceling reservation:', error);
                    setAlertConfig({
                        isOpen: true,
                        title: 'Kesalahan',
                        message: 'Gagal membatalkan reservasi: ' + error.message,
                        type: 'error'
                    });
                }
            }
        });
    };

    const cards = [
        {
            title: 'Total Reservasi',
            value: stats.totalReservations,
            gradient: 'from-blue-500 to-cyan-400',
            icon: (
                <svg className="w-8 h-8 text-white opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            )
        },
        {
            title: 'Reservasi Aktif',
            value: stats.activeReservations,
            gradient: 'from-emerald-500 to-teal-400',
            icon: (
                <svg className="w-8 h-8 text-white opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            )
        },
        {
            title: 'Reservasi Selesai',
            value: stats.completedReservations,
            gradient: 'from-purple-500 to-indigo-400',
            icon: (
                <svg className="w-8 h-8 text-white opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
            )
        },
        {
            title: 'Reservasi Akan Datang',
            value: stats.upcomingReservations,
            gradient: 'from-orange-500 to-amber-400',
            icon: (
                <svg className="w-8 h-8 text-white opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            )
        }
    ];

    // ── Chart range options ──
    const CHART_RANGES = [
        { key: '1hari', label: '1 Hari' },
        { key: '1bulan', label: '1 Bulan' },
        { key: '6bulan', label: '6 Bulan' },
        { key: '1tahun', label: '1 Tahun' },
    ];

    const chartData = useMemo(() => {
        const today = new Date();
        today.setHours(23, 59, 59, 999);

        if (chartRange === '1hari') {
            // Hourly breakdown for today (0–23)
            const hourMap = {};
            for (let h = 0; h < 24; h++) {
                hourMap[h] = 0;
            }
            const todayStr = new Date().toISOString().slice(0, 10);
            allTransactions.forEach((t) => {
                if (!t.created_at) return;
                const d = new Date(t.created_at);
                if (d.toISOString().slice(0, 10) === todayStr) {
                    hourMap[d.getHours()] += (t.grand_total || 0);
                }
            });
            return Object.entries(hourMap).map(([hour, total]) => ({
                label: `${String(hour).padStart(2, '0')}:00`,
                total,
            }));
        }

        if (chartRange === '1bulan') {
            // Daily breakdown for last 30 days
            const dailyMap = {};
            for (let i = 29; i >= 0; i--) {
                const d = new Date(today);
                d.setDate(d.getDate() - i);
                dailyMap[d.toISOString().slice(0, 10)] = 0;
            }
            allTransactions.forEach((t) => {
                if (!t.created_at) return;
                const key = new Date(t.created_at).toISOString().slice(0, 10);
                if (dailyMap[key] !== undefined) {
                    dailyMap[key] += (t.grand_total || 0);
                }
            });
            return Object.entries(dailyMap).map(([date, total]) => ({
                label: new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
                total,
            }));
        }

        if (chartRange === '6bulan') {
            // Monthly breakdown for last 6 months
            const monthlyMap = {};
            for (let i = 5; i >= 0; i--) {
                const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                monthlyMap[key] = 0;
            }
            allTransactions.forEach((t) => {
                if (!t.created_at) return;
                const cd = new Date(t.created_at);
                const key = `${cd.getFullYear()}-${String(cd.getMonth() + 1).padStart(2, '0')}`;
                if (monthlyMap[key] !== undefined) {
                    monthlyMap[key] += (t.grand_total || 0);
                }
            });
            return Object.entries(monthlyMap).map(([month, total]) => {
                const [y, m] = month.split('-');
                return {
                    label: new Date(Number(y), Number(m) - 1).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }),
                    total,
                };
            });
        }

        // '1tahun' — Monthly breakdown for last 12 months
        const monthlyMap = {};
        for (let i = 11; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            monthlyMap[key] = 0;
        }
        allTransactions.forEach((t) => {
            if (!t.created_at) return;
            const cd = new Date(t.created_at);
            const key = `${cd.getFullYear()}-${String(cd.getMonth() + 1).padStart(2, '0')}`;
            if (monthlyMap[key] !== undefined) {
                monthlyMap[key] += (t.grand_total || 0);
            }
        });
        return Object.entries(monthlyMap).map(([month, total]) => {
            const [y, m] = month.split('-');
            return {
                label: new Date(Number(y), Number(m) - 1).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }),
                total,
            };
        });
    }, [allTransactions, chartRange]);

    const chartSubtitle = {
        '1hari': 'Pendapatan per jam hari ini',
        '1bulan': 'Pendapatan harian 30 hari terakhir',
        '6bulan': 'Pendapatan bulanan 6 bulan terakhir',
        '1tahun': 'Pendapatan bulanan 12 bulan terakhir',
    };

    // Extract unique room types, splitting comma-separated values for multi-room bookings
    const roomTypes = ['Semua', ...Array.from(new Set(
        recentActivities
            .flatMap(a => (a.room_type || '').split(',').map(t => t.trim()))
            .filter(Boolean)
    )).sort()];

    const filteredActivities = recentActivities.filter(activity => {
        // Room type filter — supports multi-room bookings (e.g. "Standard,Deluxe")
        if (roomTypeFilter !== 'Semua') {
            const types = (activity.room_type || '').split(',').map(t => t.trim());
            if (!types.includes(roomTypeFilter)) return false;
        }
        // Text search filter
        if (!searchTerm) return true;
        const lowerSearch = searchTerm.toLowerCase();
        const roomTypeMatch = activity.room_type && activity.room_type.split(',').some(t => t.trim().toLowerCase().includes(lowerSearch));
        return (
            (activity.guest_name && activity.guest_name.toLowerCase().includes(lowerSearch)) ||
            (activity.booking_no && activity.booking_no.toLowerCase().includes(lowerSearch)) ||
            (activity.room_no && String(activity.room_no).toLowerCase().includes(lowerSearch)) ||
            roomTypeMatch
        );
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full p-8 text-slate-500">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Memuat Data Dashboard...
            </div>
        );
    }

    return (
        <div className="px-6 py-8 space-y-8 animate-page-entrance">
            <header className="mb-10 flex items-start justify-between">
                <div>
                    <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Dashboard Ringkasan</h1>
                    <p className="text-slate-500 mt-2 text-lg">Selamat datang kembali, pantau aktivitas hotel hari ini.</p>
                </div>
                <div className="text-right shrink-0 ml-6">
                    <div className="bg-white border border-slate-200 rounded-2xl px-5 py-3 shadow-sm">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">🕐 Waktu Jakarta (WIB)</p>
                        <p className="text-lg font-bold text-slate-800 tabular-nums tracking-tight">{jakartaTime}</p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card, index) => (
                    <div
                        key={index}
                        className={`relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br ${card.gradient} text-white shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group`}
                    >
                        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/20 rounded-full blur-xl group-hover:bg-white/30 transition-colors"></div>
                        <div className="relative z-10 flex justify-between items-start">
                            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
                                {card.icon}
                            </div>
                        </div>
                        <div className="relative z-10 mt-6">
                            <h3 className="text-white/80 font-medium text-lg">{card.title}</h3>
                            <p className="text-4xl font-bold mt-1 tracking-tight">{card.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Revenue Chart ── */}
            {(role === 'Superadmin' || role === 'Admin') && (
                <div className="mt-10">
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">Grafik Pendapatan</h2>
                                <p className="text-slate-400 text-sm mt-0.5">{chartSubtitle[chartRange]}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                {CHART_RANGES.map((r) => (
                                    <button
                                        key={r.key}
                                        onClick={() => setChartRange(r.key)}
                                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-all duration-200 ${
                                            chartRange === r.key
                                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-200'
                                                : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/50'
                                        }`}
                                    >
                                        {r.label}
                                    </button>
                                ))}
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 ml-2">
                                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                                    <defs>
                                        <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis
                                        dataKey="label"
                                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                                        tickLine={false}
                                        axisLine={{ stroke: '#e2e8f0' }}
                                        interval={chartRange === '1bulan' ? Math.max(0, Math.floor(chartData.length / 7) - 1) : chartRange === '1hari' ? 2 : 0}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(v) => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}jt` : v >= 1_000 ? `${(v / 1_000).toFixed(0)}rb` : v}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            background: '#1e293b',
                                            border: 'none',
                                            borderRadius: '12px',
                                            boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
                                            padding: '10px 14px',
                                        }}
                                        labelStyle={{ color: '#94a3b8', fontSize: 12, marginBottom: 4 }}
                                        itemStyle={{ color: '#fff', fontWeight: 700, fontSize: 13 }}
                                        formatter={(value) => [formatIDR(value), 'Pendapatan']}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="total"
                                        stroke="#6366f1"
                                        strokeWidth={2.5}
                                        fill="url(#revenueGrad)"
                                        dot={chartRange !== '1bulan' && chartRange !== '1hari' ? { r: 3, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 } : false}
                                        activeDot={{ r: 5, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Aktivitas Terbaru ── */}
            <div className="mt-12 bg-white rounded-3xl p-8 shadow-md border border-slate-200 mb-10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
                    <h2 className="text-xl font-bold text-slate-800">Aktivitas Terbaru & List Reservasi</h2>
                    <div className="relative w-full sm:w-72">
                        <input
                            type="text"
                            placeholder="Cari nama, booking no, kamar..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-slate-700"
                        />
                        <svg className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>

                {/* Room Type Filter */}
                <div className="flex items-center gap-2 mb-5 flex-wrap">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1">Tipe Kamar:</span>
                    {roomTypes.map((type) => (
                        <button
                            key={type}
                            onClick={() => setRoomTypeFilter(type)}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-all duration-200 ${
                                roomTypeFilter === type
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-200'
                                    : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/50'
                            }`}
                        >
                            {type}
                        </button>
                    ))}
                    {roomTypeFilter !== 'Semua' && (
                        <span className="text-xs text-slate-400 ml-2">
                            {filteredActivities.length} hasil
                        </span>
                    )}
                </div>

                <div className="max-h-[500px] overflow-y-auto pr-2 -mr-2 space-y-3 custom-scrollbar">
                {filteredActivities && filteredActivities.length > 0 ? (
                    <div className="space-y-3">
                        {filteredActivities.map((activity, idx) => {
                            const now = new Date();
                            now.setHours(0,0,0,0);
                            const arr = new Date(activity.arrival_date);
                            arr.setHours(0,0,0,0);
                            const dep = new Date(activity.departure_date);
                            dep.setHours(0,0,0,0);

                            let badgeClass, badgeIcon, badgeText;
                            if (now >= arr && now < dep) {
                                badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                                badgeIcon = <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>;
                                badgeText = 'Aktif';
                            } else if (now >= dep) {
                                badgeClass = 'bg-purple-50 text-purple-700 border-purple-200';
                                badgeIcon = <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>;
                                badgeText = 'Selesai';
                            } else {
                                badgeClass = 'bg-blue-50 text-blue-700 border-blue-200';
                                badgeIcon = <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
                                badgeText = 'Akan Datang';
                            }

                            return (
                            <div
                                key={idx}
                                className="flex items-center justify-between border border-slate-200/60 rounded-2xl px-5 py-4 bg-white hover:bg-slate-50/50 hover:border-slate-300 transition-all shadow-sm hover:shadow"
                            >
                                {/* Left: Avatar + Info */}
                                <div className="flex items-center gap-4 min-w-0 flex-1">
                                    <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 shrink-0">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <p className="text-slate-800 font-bold truncate">{activity.guest_name}</p>
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                                                #{activity.booking_no || '-'}
                                            </span>
                                        </div>
                                        <div className="text-slate-500 text-sm mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                                            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md text-slate-700 font-medium whitespace-nowrap">
                                                <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                                                Kamar {activity.room_no} ({activity.room_type})
                                            </span>
                                            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 border border-indigo-100/50 rounded-md text-indigo-700 font-medium whitespace-nowrap">
                                                <svg className="w-4 h-4 text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                {activity.arrival_date ? new Date(activity.arrival_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '-'}
                                                <span className="mx-0.5 text-indigo-300">→</span>
                                                {activity.departure_date ? new Date(activity.departure_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '-'}
                                                <span className="ml-1 text-xs text-indigo-500/80">({activity.total_nights} malam)</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Buttons + Status */}
                                <div className="shrink-0 ml-4 flex items-center gap-3">
                                    {/* Detail Button */}
                                    <button
                                        onClick={() => setSelectedActivity(activity)}
                                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50/80 hover:bg-indigo-100/80 text-indigo-700 font-semibold text-xs border border-indigo-200/50 transition-all hover:shadow-sm active:scale-95 h-[34px]"
                                        title="Lihat Detail"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                        Detail
                                    </button>

                                    {/* Print Button */}
                                    <button
                                        onClick={() => printTransaction(activity)}
                                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-50/80 hover:bg-green-100/80 text-green-700 font-semibold text-xs border border-green-200/50 transition-all hover:shadow-sm active:scale-95 h-[34px]"
                                        title="Print Confirmation"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                        </svg>
                                        Print
                                    </button>

                                    {/* Checkout Button - Only for Active */}
                                    {badgeText === 'Aktif' && (
                                        <button
                                            onClick={() => handleCheckout(activity.id)}
                                            disabled={isCheckingOut}
                                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50/80 hover:bg-amber-100/80 text-amber-700 font-semibold text-xs border border-amber-200/50 transition-all hover:shadow-sm active:scale-95 h-[34px] disabled:opacity-50"
                                            title="Check Out Sekarang"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                            </svg>
                                            Check Out
                                        </button>
                                    )}

                                    {/* Cancel Button - Only for Upcoming */}
                                    {badgeText === 'Akan Datang' && (
                                        <button
                                            onClick={() => handleCancel(activity.id)}
                                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50/80 hover:bg-red-100/80 text-red-700 font-semibold text-xs border border-red-200/50 transition-all hover:shadow-sm active:scale-95 h-[34px]"
                                            title="Cancel Reservasi"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                            Cancel
                                        </button>
                                    )}

                                    {/* Status Badge — dinamis */}
                                    <div className="flex flex-col items-center justify-center border-l border-slate-100 pl-3 min-w-[90px]">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold leading-none border shadow-sm whitespace-nowrap mb-1 ${badgeClass}`}>
                                            {badgeIcon}
                                            {badgeText}
                                        </span>
                                        <p className="text-slate-400 text-[10px] leading-none whitespace-nowrap">
                                            {activity.created_at ? new Date(activity.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );})}
                    </div>
                ) : (
                    <div className="text-center py-12 text-slate-400">
                        <svg className="mx-auto h-12 w-12 text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        <p>{searchTerm || roomTypeFilter !== 'Semua' ? "Tidak ditemukan aktivitas yang cocok dengan filter atau pencarian Anda." : "Belum ada aktivitas reservasi terbaru."}</p>
                    </div>
                )}
                </div>
            </div>

            {/* Detail Modal */}
            {selectedActivity && (
                <DetailModal
                    activity={selectedActivity}
                    onClose={() => setSelectedActivity(null)}
                    onPrint={printTransaction}
                    onCheckout={handleCheckout}
                    onCancel={handleCancel}
                    isCheckingOut={isCheckingOut}
                />
            )}

            {/* Custom Alert */}
            <CustomAlert
                isOpen={alertConfig.isOpen}
                onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
                onConfirm={alertConfig.onConfirm}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
            />
        </div>
    );
}
