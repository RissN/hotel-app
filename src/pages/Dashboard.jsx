import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
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
    <div class="pay-info-row"><span class="pi-lbl">Card Number</span><span class="pi-val">: ${pData.cardNumber || '-'}</span></div>
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
    <div class="pay-info-row"><span class="pi-lbl">No. HP / E-Wallet</span><span class="pi-val">: ${pData.ewalletPhone || '-'}</span></div>
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

function DetailModal({ activity, onClose, onPrint }) {
    if (!activity) return null;

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
                                        <div className="col-span-2 mt-1">
                                            <span className="text-slate-500 block text-xs">Referensi Pembayaran</span>
                                            <span className="font-medium text-slate-800 break-all">
                                                Ref: {pData.code || '-'}
                                            </span>
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
    const [stats, setStats] = useState({
        totalReservations: 0,
        activeReservations: 0,
        completedReservations: 0,
        totalUsers: 0
    });
    const [recentActivities, setRecentActivities] = useState([]);
    const [dailyRevenue, setDailyRevenue] = useState([]);
    const [monthlyRevenue, setMonthlyRevenue] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedActivity, setSelectedActivity] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { count: totalReservations } = await supabase
                    .from('transactions')
                    .select('*', { count: 'exact', head: true });

                const { count: activeReservations } = await supabase
                    .from('transactions')
                    .select('*', { count: 'exact', head: true });

                const { count: completedReservations } = await supabase
                    .from('transactions')
                    .select('*', { count: 'exact', head: true });

                const { count: totalUsers } = await supabase
                    .from('user_roles')
                    .select('*', { count: 'exact', head: true });

                const { data: recentResData } = await supabase
                    .from('transactions')
                    .select('id, booking_no, guest_name, email, phone, room_no, room_type, number_of_rooms, number_of_persons, arrival_date, departure_date, total_nights, room_rate, subtotal, tax, service_charge, grand_total, payment_method, payment_ref, nationality, company, receptionist, created_at')
                    .order('created_at', { ascending: false })
                    .limit(5);

                setRecentActivities(recentResData || []);

                // ── Fetch ALL transactions for revenue charts ──
                const { data: allTx } = await supabase
                    .from('transactions')
                    .select('grand_total, created_at');

                const txList = allTx || [];

                // ── Daily revenue (last 30 days) ──
                const today = new Date();
                const dailyMap = {};
                for (let i = 29; i >= 0; i--) {
                    const d = new Date(today);
                    d.setDate(d.getDate() - i);
                    const key = d.toISOString().slice(0, 10);
                    dailyMap[key] = 0;
                }
                txList.forEach((t) => {
                    if (!t.created_at) return;
                    const key = new Date(t.created_at).toISOString().slice(0, 10);
                    if (dailyMap[key] !== undefined) {
                        dailyMap[key] += (t.grand_total || 0);
                    }
                });
                const dailyArr = Object.entries(dailyMap).map(([date, total]) => ({
                    date: new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
                    total,
                }));
                setDailyRevenue(dailyArr);

                // ── Monthly revenue (last 12 months) ──
                const monthlyMap = {};
                for (let i = 11; i >= 0; i--) {
                    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
                    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                    monthlyMap[key] = 0;
                }
                txList.forEach((t) => {
                    if (!t.created_at) return;
                    const cd = new Date(t.created_at);
                    const key = `${cd.getFullYear()}-${String(cd.getMonth() + 1).padStart(2, '0')}`;
                    if (monthlyMap[key] !== undefined) {
                        monthlyMap[key] += (t.grand_total || 0);
                    }
                });
                const monthlyArr = Object.entries(monthlyMap).map(([month, total]) => {
                    const [y, m] = month.split('-');
                    const label = new Date(Number(y), Number(m) - 1).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
                    return { month: label, total };
                });
                setMonthlyRevenue(monthlyArr);

                setStats({
                    totalReservations: totalReservations || 0,
                    activeReservations: activeReservations || 0,
                    completedReservations: completedReservations || 0,
                    totalUsers: totalUsers || 0
                });
            } catch (error) {
                console.error('Error fetching dashboard stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

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
            title: 'Total Pengguna',
            value: stats.totalUsers,
            gradient: 'from-orange-500 to-pink-500',
            icon: (
                <svg className="w-8 h-8 text-white opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            )
        }
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full p-8 text-slate-500">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Memuat Data Dashboard...
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-page-entrance">
            <header className="mb-10">
                <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Dashboard Ringkasan</h1>
                <p className="text-slate-500 mt-2 text-lg">Selamat datang kembali, pantau aktivitas hotel hari ini.</p>
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

            {/* ── Revenue Charts ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-10">
                {/* Daily Revenue Chart */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">Pendapatan Harian</h2>
                            <p className="text-slate-400 text-sm mt-0.5">30 hari terakhir</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                        </div>
                    </div>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={dailyRevenue} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                                <defs>
                                    <linearGradient id="dailyGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                                    tickLine={false}
                                    axisLine={{ stroke: '#e2e8f0' }}
                                    interval={Math.max(0, Math.floor(dailyRevenue.length / 7) - 1)}
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
                                    fill="url(#dailyGrad)"
                                    dot={false}
                                    activeDot={{ r: 5, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Monthly Revenue Chart */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">Pendapatan Bulanan</h2>
                            <p className="text-slate-400 text-sm mt-0.5">12 bulan terakhir</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                    </div>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={monthlyRevenue} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                                <defs>
                                    <linearGradient id="monthlyGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis
                                    dataKey="month"
                                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                                    tickLine={false}
                                    axisLine={{ stroke: '#e2e8f0' }}
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
                                    stroke="#10b981"
                                    strokeWidth={2.5}
                                    fill="url(#monthlyGrad)"
                                    dot={{ r: 3, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                                    activeDot={{ r: 5, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* ── Aktivitas Terbaru ── */}
            <div className="mt-12 bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                <h2 className="text-xl font-bold text-slate-800 mb-6">Aktivitas Terbaru</h2>
                {recentActivities && recentActivities.length > 0 ? (
                    <div className="space-y-3">
                        {recentActivities.map((activity, idx) => (
                            <div
                                key={idx}
                                className="flex items-center justify-between border border-slate-100 rounded-2xl px-5 py-4 hover:bg-slate-50 transition-colors"
                            >
                                {/* Left: Avatar + Info */}
                                <div className="flex items-center gap-4 min-w-0 flex-1">
                                    <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 shrink-0">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-slate-800 font-bold truncate">{activity.guest_name}</p>
                                        <div className="text-slate-500 text-sm mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
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
                                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs border border-indigo-200 transition-all hover:shadow-sm active:scale-95 h-[34px]"
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
                                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-50 hover:bg-green-100 text-green-700 font-semibold text-xs border border-green-200 transition-all hover:shadow-sm active:scale-95 h-[34px]"
                                        title="Print Confirmation"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                        </svg>
                                        Print
                                    </button>

                                    {/* Status Badge — paling kanan */}
                                    <div className="flex flex-col items-center justify-center border-l border-slate-100 pl-3 min-w-[80px]">
                                        <span className="inline-flex px-3 py-1 rounded-full text-[11px] font-bold leading-none bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-sm whitespace-nowrap mb-1">
                                            Selesai
                                        </span>
                                        <p className="text-slate-400 text-[10px] leading-none whitespace-nowrap">
                                            {activity.created_at ? new Date(activity.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-slate-400">
                        <svg className="mx-auto h-12 w-12 text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        <p>Belum ada aktivitas reservasi terbaru.</p>
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {selectedActivity && (
                <DetailModal
                    activity={selectedActivity}
                    onClose={() => setSelectedActivity(null)}
                    onPrint={printTransaction}
                />
            )}
        </div>
    );
}
