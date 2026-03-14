import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

const formatIDR = (amount) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount || 0);

const PAYMENT_METHOD_LABEL = {
    cash: 'Cash / Tunai',
    transfer: 'Bank Transfer (Mandiri)',
    credit_card: 'Kartu Kredit',
};

// ─── Print helper ──────────────────────────────────────────────────────────────
function buildConfirmationHTML(tx) {
    const fmt = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '-';
    const fmtShort = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';
    const payLabel = PAYMENT_METHOD_LABEL[tx.payment_method] || tx.payment_method || '-';

    return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8"/>
  <title>Reservation Confirmation – ${tx.booking_no || '-'}</title>
  <style>
    @page { margin: 0; size: A4 portrait; }
    body { margin: 0; padding: 1cm 1.5cm; font-family: Arial, sans-serif; font-size: 10px; color: #111; }
    h1 { font-size: 16px; font-weight: 900; letter-spacing: 4px; text-transform: uppercase; margin: 0; }
    h2 { font-size: 13px; font-weight: 700; margin: 0 0 6px 0; }
    .center { text-align: center; }
    .divider-thick { border: none; border-top: 2px solid #111; margin: 2px 0; }
    .divider { border: none; border-top: 1px solid #111; margin: 2px 0 10px 0; }
    .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0 20px; margin-bottom: 10px; }
    .row { display: flex; margin-bottom: 3px; }
    .lbl { width: 120px; flex-shrink: 0; color: #333; }
    .lbl-sm { width: 80px; flex-shrink: 0; color: #333; }
    .val { font-weight: 600; }
    .box { border: 1px solid #888; background: #fafafa; padding: 8px 10px; margin-bottom: 10px; line-height: 1.6; }
    .box-title { font-weight: 700; color: #c00; margin-bottom: 6px; }
    .bank-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 12px; }
    .bank-left { border-left: 3px solid #3b82f6; padding-left: 6px; }
    .policy { background: #f0f0f0; padding: 6px 10px; font-size: 8px; color: #555; }
    .policy-title { font-weight: 700; text-decoration: underline; color: #111; margin-bottom: 3px; }
    ol { margin: 0; padding-left: 14px; }
    .price-section { margin: 8px 0; }
    .price-row { display: flex; justify-content: space-between; margin-bottom: 2px; }
    .price-row .val { color: #c00; font-weight: 700; }
    table.price-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 10px; }
    table.price-table td { padding: 2px 4px; }
    table.price-table tr:last-child td { border-top: 1px solid #888; font-weight: 700; }
  </style>
</head>
<body>
  <div class="center" style="margin-bottom:8px;">
    <h1>PPKD HOTEL</h1>
  </div>

  <h2>Reservation Confirmation</h2>
  <hr class="divider-thick"/>
  <hr class="divider"/>

  <div class="grid2">
    <div>
      <div class="row"><span class="lbl">To.</span><span class="val">: ${tx.guest_name || '-'}</span></div>
      <div class="row"><span class="lbl">Company / Agent</span><span>: ${tx.company || 'PPKD JP'}</span></div>
      <div class="row"><span class="lbl">Booking No.</span><span>: ${tx.booking_no || '-'}</span></div>
      <div class="row"><span class="lbl">Book By</span><span>: ${tx.receptionist || 'Resepsionis'} (Hotel)</span></div>
      <div class="row"><span class="lbl">Phone</span><span>: ${tx.phone || '-'}</span></div>
      <div class="row"><span class="lbl">Email</span><span>: ${tx.email || '-'}</span></div>
    </div>
    <div>
      <div class="row"><span class="lbl-sm">Telp</span><span>: (021) 1234567</span></div>
      <div class="row"><span class="lbl-sm">Fax</span><span>: (021) 7654321</span></div>
      <div class="row"><span class="lbl-sm">Email</span><span>: info@ppkdhotel.com</span></div>
      <div class="row"><span class="lbl-sm">Date</span><span>: ${fmtShort(new Date().toISOString())}</span></div>
    </div>
  </div>
  <hr class="divider"/>

  <div style="margin-bottom:10px;">
    <div class="row"><span class="lbl">First Name</span><span class="val">: ${(tx.guest_name || '-').toUpperCase()}</span></div>
    <div class="row"><span class="lbl">Nationality</span><span>: ${tx.nationality || '-'}</span></div>
    <div class="row"><span class="lbl">Arrival Date</span><span class="val">: ${fmt(tx.arrival_date)}</span></div>
    <div class="row"><span class="lbl">Departure Date</span><span class="val">: ${fmt(tx.departure_date)}</span></div>
    <div class="row"><span class="lbl">Total Night</span><span>: ${tx.total_nights || '-'} Malam (Nights)</span></div>
    <div class="row"><span class="lbl">Room/Unit Type</span><span>: Kamar ${tx.room_no || '-'} (${tx.room_type || '-'})</span></div>
    <div class="row"><span class="lbl">No. of Rooms</span><span>: ${tx.number_of_rooms || '-'}</span></div>
    <div class="row"><span class="lbl">Person Pax</span><span>: ${tx.number_of_persons || '-'} Orang (Person)</span></div>
    <div class="row" style="margin-top:6px;"><span class="lbl" style="color:#c00;">Room Rate Net</span><span style="color:#c00;font-weight:700;">: ${formatIDR(tx.room_rate)} / Malam</span></div>
  </div>

  <table class="price-table">
    <tr><td>Subtotal (${tx.number_of_rooms || 1} kamar × ${tx.total_nights || 0} malam)</td><td style="text-align:right;">${formatIDR(tx.subtotal)}</td></tr>
    <tr><td>PPN 11%</td><td style="text-align:right;">${formatIDR(tx.tax)}</td></tr>
    <tr><td>Service Charge 5%</td><td style="text-align:right;">${formatIDR(tx.service_charge)}</td></tr>
    <tr><td><strong>Grand Total</strong></td><td style="text-align:right;"><strong>${formatIDR(tx.grand_total)}</strong></td></tr>
  </table>

  <div class="row" style="margin-bottom:10px;"><span class="lbl">Metode Pembayaran</span><span class="val">: ${payLabel}</span></div>
  ${tx.payment_ref ? `<div class="row" style="margin-bottom:10px;"><span class="lbl">Ref. Pembayaran</span><span>: ${tx.payment_ref}</span></div>` : ''}

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
        <p style="font-family:monospace;margin:0;">123-00-9876543-2</p>
      </div>
    </div>
  </div>

  <div class="policy">
    <p class="policy-title">Cancellation policy:</p>
    <ol>
      <li>Please note that check in time is 02.00 pm and check out time 12.00 pm.</li>
      <li>All non guaranteed reservations will automatically be released on 6 pm.</li>
      <li>The Hotel will charge 1 night for guaranteed reservations that have not been canceling before the day of arrival. Please carefully note your cancellation number.</li>
    </ol>
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
                                {activity.payment_ref && <div><span className="text-slate-500 block text-xs">Ref. Pembayaran</span><span className="font-medium text-slate-800">{activity.payment_ref}</span></div>}
                                <div><span className="text-slate-500 block text-xs">Harga per Malam</span><span className="font-medium text-slate-800">{formatIDR(activity.room_rate)}</span></div>
                            </div>
                            <div className="border-t border-purple-100 pt-3 space-y-1.5">
                                <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatIDR(activity.subtotal)}</span></div>
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
