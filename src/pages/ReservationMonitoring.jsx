import { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../supabaseClient';
import CustomAlert from '../components/CustomAlert';
import DetailModal, { printTransaction } from '../components/ReservationDetailModal';
import LoadingScreen from '../components/LoadingScreen';
import { getLocalDateString } from '../utils/dateUtils';

const ITEMS_PER_PAGE = 12;

// ─── Status helpers ────────────────────────────────────────────────────────────
function getReservationStatus(activity) {
    if (activity.status === 'canceled') return 'canceled';
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const arr = new Date(activity.arrival_date); arr.setHours(0, 0, 0, 0);
    const dep = new Date(activity.departure_date); dep.setHours(0, 0, 0, 0);
    if (now >= arr && now < dep) return 'active';
    if (now >= dep) return 'completed';
    return 'upcoming';
}

const STATUS_CONFIG = {
    all:       { label: 'Semua',       icon: '📋', color: 'slate',   gradient: 'from-slate-500 to-slate-600' },
    active:    { label: 'Aktif',       icon: '🟢', color: 'emerald', gradient: 'from-emerald-500 to-teal-600' },
    upcoming:  { label: 'Akan Datang', icon: '🔵', color: 'blue',    gradient: 'from-blue-500 to-indigo-600' },
    completed: { label: 'Selesai',     icon: '✅', color: 'purple',  gradient: 'from-purple-500 to-violet-600' },
    canceled:  { label: 'Dibatalkan',  icon: '🔴', color: 'red',     gradient: 'from-red-500 to-rose-600' },
};

const STATUS_BADGE = {
    active:    { className: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: true },
    upcoming:  { className: 'bg-blue-50 text-blue-700 border-blue-200', dot: false },
    completed: { className: 'bg-purple-50 text-purple-700 border-purple-200', dot: false },
    canceled:  { className: 'bg-red-50 text-red-700 border-red-200', dot: false },
};

const STATUS_LABEL = {
    active: 'Aktif',
    upcoming: 'Akan Datang',
    completed: 'Selesai',
    canceled: 'Dibatalkan',
};

// ─── Action dropdown ───────────────────────────────────────────────────────────
function ActionDropdown({ activity, status, onDetail, onPrint, onCheckout, onCancel, isCheckingOut }) {
    const [open, setOpen] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const ref = useRef(null);

    const toggleDropdown = (e) => {
        e.stopPropagation();
        if (!open) {
            const rect = e.currentTarget.getBoundingClientRect();
            setCoords({
                top: rect.bottom + window.scrollY,
                left: rect.right + window.scrollX
            });
        }
        setOpen(!open);
    };

    useEffect(() => {
        function handleClick(e) {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        }
        if (open) document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [open]);

    const menuContent = (
        <div 
            ref={ref}
            className="fixed bg-white rounded-xl shadow-2xl border border-slate-200 py-1.5 z-[9999] min-w-[190px]"
            style={{ 
                top: `${coords.top + 4}px`, 
                left: `${coords.left - 190}px`,
                animation: 'dropdownIn 0.15s ease-out' 
            }}
            onClick={e => e.stopPropagation()}
        >
            <button
                onClick={() => { setOpen(false); onDetail(activity); }}
                className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 font-medium flex items-center gap-3 transition-colors"
            >
                <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Lihat Detail
            </button>
            <button
                onClick={() => { setOpen(false); onPrint(activity); }}
                className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-green-50 hover:text-green-700 font-medium flex items-center gap-3 transition-colors"
            >
                <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print Konfirmasi
            </button>
            {status === 'active' && (
                <>
                    <div className="mx-3 my-1 border-t border-slate-100" />
                    <button
                        onClick={() => { setOpen(false); onCheckout(activity.id); }}
                        disabled={isCheckingOut}
                        className="w-full px-4 py-2.5 text-left text-sm text-amber-700 hover:bg-amber-50 font-bold flex items-center gap-3 transition-colors disabled:opacity-50"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Check Out
                    </button>
                </>
            )}
            {status === 'upcoming' && activity.status !== 'canceled' && (
                <>
                    <div className="mx-3 my-1 border-t border-slate-100" />
                    <button
                        onClick={() => { setOpen(false); onCancel(activity.id); }}
                        className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 font-bold flex items-center gap-3 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Batalkan Reservasi
                    </button>
                </>
            )}
        </div>
    );

    return (
        <div className="relative">
            <button
                onClick={toggleDropdown}
                className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-200 ${open ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-100 text-slate-400 hover:text-indigo-600'}`}
                title="Aksi"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
            </button>
            {open && createPortal(menuContent, document.body)}
        </div>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function ReservationMonitoring() {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roomTypeFilter, setRoomTypeFilter] = useState('Semua');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [statusTab, setStatusTab] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [exportStart, setExportStart] = useState('');
    const [exportEnd, setExportEnd] = useState('');
    const [selectedActivity, setSelectedActivity] = useState(null);
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [alertConfig, setAlertConfig] = useState({
        isOpen: false, title: '', message: '', type: 'info', onConfirm: null
    });

    const fetchActivities = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            setActivities(data || []);
        } catch (error) {
            console.error('Error fetching reservations:', error);
            setAlertConfig({
                isOpen: true,
                title: 'Kesalahan',
                message: 'Gagal memuat data reservasi: ' + error.message,
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchActivities(); }, []);

    // ─── Handlers ──────────────────────────────
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
                    const todayDate = getLocalDateString();
                    const { error } = await supabase
                        .from('transactions')
                        .update({ departure_date: todayDate })
                        .eq('id', id);
                    if (error) throw error;
                    await fetchActivities();
                    setSelectedActivity(null);
                    setAlertConfig({
                        isOpen: true, title: 'Berhasil',
                        message: 'Check-out berhasil dilakukan!', type: 'success'
                    });
                } catch (error) {
                    console.error('Error checking out:', error);
                    setAlertConfig({
                        isOpen: true, title: 'Kesalahan',
                        message: 'Gagal melakukan check-out: ' + error.message, type: 'error'
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
            message: 'Apakah Anda yakin ingin membatalkan reservasi ini? Status akan diubah menjadi "Dibatalkan".',
            type: 'confirm',
            onConfirm: async () => {
                setAlertConfig(prev => ({ ...prev, isOpen: false }));
                try {
                    const { error } = await supabase
                        .from('transactions')
                        .update({ status: 'canceled' })
                        .eq('id', id);
                    if (error) throw error;
                    await fetchActivities();
                    setSelectedActivity(null);
                    setAlertConfig({
                        isOpen: true, title: 'Berhasil',
                        message: 'Reservasi berhasil dibatalkan.', type: 'success'
                    });
                } catch (error) {
                    console.error('Error canceling reservation:', error);
                    setAlertConfig({
                        isOpen: true, title: 'Kesalahan',
                        message: 'Gagal membatalkan reservasi: ' + error.message, type: 'error'
                    });
                }
            }
        });
    };

    // ─── Derived data ──────────────────────────
    const enrichedActivities = useMemo(() =>
        activities.map(a => ({ ...a, _status: getReservationStatus(a) })),
        [activities]
    );

    const statusCounts = useMemo(() => {
        const counts = { all: 0, active: 0, upcoming: 0, completed: 0, canceled: 0 };
        enrichedActivities.forEach(a => { counts[a._status]++; counts.all++; });
        return counts;
    }, [enrichedActivities]);

    const roomTypes = useMemo(() =>
        ['Semua', ...Array.from(new Set(
            activities.flatMap(a => (a.room_type || '').split(',').map(t => t.trim())).filter(Boolean)
        )).sort()],
        [activities]
    );

    const filteredActivities = useMemo(() => {
        return enrichedActivities.filter(activity => {
            // Status tab
            if (statusTab !== 'all' && activity._status !== statusTab) return false;

            // Room type
            if (roomTypeFilter !== 'Semua') {
                const types = (activity.room_type || '').split(',').map(t => t.trim());
                if (!types.includes(roomTypeFilter)) return false;
            }

            // Date range
            if (startDate || endDate) {
                const activityArrival = activity.arrival_date ? new Date(activity.arrival_date) : null;
                if (activityArrival) {
                    if (startDate) { const sd = new Date(startDate); sd.setHours(0, 0, 0, 0); if (activityArrival < sd) return false; }
                    if (endDate) { const ed = new Date(endDate); ed.setHours(23, 59, 59, 999); if (activityArrival > ed) return false; }
                } else return false;
            }

            // Search
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
    }, [enrichedActivities, statusTab, roomTypeFilter, startDate, endDate, searchTerm]);

    // Pagination
    const totalPages = Math.max(1, Math.ceil(filteredActivities.length / ITEMS_PER_PAGE));
    const safeCurrentPage = Math.min(currentPage, totalPages);
    const paginatedActivities = filteredActivities.slice(
        (safeCurrentPage - 1) * ITEMS_PER_PAGE,
        safeCurrentPage * ITEMS_PER_PAGE
    );

    // Reset page when filters change
    useEffect(() => { setCurrentPage(1); }, [statusTab, roomTypeFilter, startDate, endDate, searchTerm]);

    // ─── Export ─────────────────────────────────
    const handleExportCSV = () => setIsExportModalOpen(true);

    const processExportCSV = () => {
        let exportData = activities;
        if (exportStart || exportEnd) {
            exportData = exportData.filter(activity => {
                const arr = activity.arrival_date ? new Date(activity.arrival_date) : null;
                if (!arr) return false;
                if (exportStart) { const sd = new Date(exportStart); sd.setHours(0, 0, 0, 0); if (arr < sd) return false; }
                if (exportEnd) { const ed = new Date(exportEnd); ed.setHours(23, 59, 59, 999); if (arr > ed) return false; }
                return true;
            });
        }
        if (exportData.length === 0) {
            return setAlertConfig({
                isOpen: true, title: 'Data Kosong',
                message: 'Tidak ada data reservasi dalam rentang tanggal yang dipilih.', type: 'info'
            });
        }
        const headers = ["ID", "Nama Tamu", "Kamar", "Tipe Kamar", "Orang", "Check-In", "Check-Out", "Status"];
        const rows = exportData.map(a => [
            a.id, a.guest_name || '-', a.room_no || '-', a.room_type || '-',
            a.number_of_person || 1,
            a.arrival_date ? new Date(a.arrival_date).toLocaleDateString('id-ID') : '-',
            a.departure_date ? new Date(a.departure_date).toLocaleDateString('id-ID') : '-',
            a.status || '-'
        ]);
        let csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Laporan_Reservasi_${exportStart || 'All'}_to_${exportEnd || 'All'}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setIsExportModalOpen(false);
    };

    // ─── Date formatter ────────────────────────
    const fmtDate = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

    // ─── Loading state ─────────────────────────
    if (loading) return <LoadingScreen message="Memuat Data Reservasi..." />;

    const hasActiveFilters = searchTerm || roomTypeFilter !== 'Semua' || startDate || endDate;

    return (
        <div className="px-4 sm:px-6 py-6 space-y-6 animate-page-entrance">
            {/* Inline keyframes */}
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes dropdownIn {
                    from { opacity: 0; transform: translateY(-4px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes statCardIn {
                    from { opacity: 0; transform: translateY(12px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes tableRowIn {
                    from { opacity: 0; transform: translateX(-8px); }
                    to { opacity: 1; transform: translateX(0); }
                }
            `}} />

            {/* ─── Header ──────────────────────────────────────────────── */}
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-br from-indigo-800 via-indigo-700 to-purple-800 rounded-2xl p-6 lg:p-8 shadow-lg shadow-indigo-500/15 text-white relative overflow-hidden">
                <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(255,255,255,0.08) 0%, transparent 40%)' }} />
                <div className="relative z-10">
                    <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight">List Reservasi</h1>
                    <p className="text-indigo-200 mt-1 text-sm">Pantau seluruh daftar reservasi aktif, selesai, maupun yang akan datang.</p>
                </div>
                <div className="relative z-10 flex items-center gap-3">
                    <button
                        onClick={handleExportCSV}
                        className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur border border-white/20 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all duration-200 active:scale-95"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        Ekspor
                    </button>
                </div>
            </header>

            {/* ─── Status Tabs ──────────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {Object.entries(STATUS_CONFIG).map(([key, config], i) => {
                    const isActive = statusTab === key;
                    const count = statusCounts[key];
                    return (
                        <button
                            key={key}
                            onClick={() => setStatusTab(key)}
                            className={`relative group rounded-xl p-4 text-left transition-all duration-200 border-2 active:scale-[0.97] ${
                                isActive
                                    ? `bg-gradient-to-br ${config.gradient} text-white border-transparent shadow-lg shadow-${config.color}-500/20`
                                    : 'bg-white text-slate-700 border-slate-200/80 hover:border-slate-300 hover:shadow-md'
                            }`}
                            style={{ animation: `statCardIn 0.4s ease-out ${i * 0.05}s both` }}
                        >
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="text-lg">{config.icon}</span>
                                <span className={`text-2xl font-black tabular-nums ${isActive ? 'text-white' : 'text-slate-800'}`}>
                                    {count}
                                </span>
                            </div>
                            <p className={`text-xs font-bold tracking-wide ${isActive ? 'text-white/80' : 'text-slate-500'}`}>
                                {config.label}
                            </p>
                            {isActive && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-white/40 rounded-t-full" />}
                        </button>
                    );
                })}
            </div>

            {/* ─── Main Table Card ──────────────────────────────────── */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
                {/* ─── Filter Toolbar ───────────────────────────────── */}
                <div className="px-5 py-4 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                        <h2 className="text-base font-bold text-slate-800">Daftar Reservasi</h2>
                        <span className="text-[11px] bg-indigo-50 text-indigo-600 font-bold px-2 py-0.5 rounded-md border border-indigo-100 tabular-nums">
                            {filteredActivities.length} data
                        </span>
                        {hasActiveFilters && (
                            <button
                                onClick={() => { setSearchTerm(''); setRoomTypeFilter('Semua'); setStartDate(''); setEndDate(''); }}
                                className="text-[11px] text-rose-500 hover:text-rose-600 font-bold flex items-center gap-1 hover:underline transition-colors"
                            >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                Reset Filter
                            </button>
                        )}
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                        {/* Date Range */}
                        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs">
                            <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            <input
                                type="date" value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="bg-transparent text-xs text-slate-700 focus:outline-none cursor-pointer w-[110px]"
                            />
                            <span className="text-slate-300 font-bold">–</span>
                            <input
                                type="date" value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="bg-transparent text-xs text-slate-700 focus:outline-none cursor-pointer w-[110px]"
                            />
                            {(startDate || endDate) && (
                                <button onClick={() => { setStartDate(''); setEndDate(''); }} className="text-slate-400 hover:text-rose-500 ml-0.5 transition-colors">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            )}
                        </div>

                        {/* Room Type */}
                        <div className="relative">
                            <select
                                value={roomTypeFilter}
                                onChange={(e) => setRoomTypeFilter(e.target.value)}
                                className="pl-3 pr-7 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer text-slate-700 font-medium appearance-none w-full sm:w-36"
                            >
                                {roomTypes.map(type => (
                                    <option key={type} value={type}>{type === 'Semua' ? 'Semua Tipe' : type}</option>
                                ))}
                            </select>
                            <svg className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </div>

                        {/* Search */}
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Cari nama, booking..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-slate-700 w-full sm:w-48"
                            />
                            <svg className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>
                    </div>
                </div>

                {/* ─── Table ────────────────────────────────────────── */}
                {paginatedActivities.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-100">
                                    <th className="text-left pl-5 pr-3 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Tamu</th>
                                    <th className="text-left px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 hidden md:table-cell">Booking</th>
                                    <th className="text-left px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Kamar</th>
                                    <th className="text-left px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 hidden lg:table-cell">Check-in</th>
                                    <th className="text-left px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 hidden lg:table-cell">Check-out</th>
                                    <th className="text-center px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 hidden xl:table-cell">Malam</th>
                                    <th className="text-center px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Status</th>
                                    <th className="text-center px-3 pr-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 w-14">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100/80">
                                {paginatedActivities.map((activity, idx) => {
                                    const status = activity._status;
                                    const badge = STATUS_BADGE[status];
                                    return (
                                        <tr
                                            key={activity.id || idx}
                                            className="group hover:bg-indigo-50/30 transition-colors cursor-pointer"
                                            style={{ animation: `tableRowIn 0.3s ease-out ${idx * 0.03}s both` }}
                                            onClick={() => setSelectedActivity(activity)}
                                        >
                                            {/* Guest Name */}
                                            <td className="pl-5 pr-3 py-3.5">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm">
                                                        {(activity.guest_name || '?')[0].toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-slate-800 truncate max-w-[160px] group-hover:text-indigo-700 transition-colors">{activity.guest_name || '-'}</p>
                                                        <p className="text-[11px] text-slate-400 truncate max-w-[160px] md:hidden">#{activity.booking_no || '-'}</p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Booking No */}
                                            <td className="px-3 py-3.5 hidden md:table-cell">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-slate-100 text-slate-600 border border-slate-200/80">
                                                    {activity.booking_no || '-'}
                                                </span>
                                            </td>

                                            {/* Room */}
                                            <td className="px-3 py-3.5">
                                                <div>
                                                    <span className="font-semibold text-slate-700 text-sm">{activity.room_no || '-'}</span>
                                                    <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[120px]">{activity.room_type || '-'}</p>
                                                </div>
                                            </td>

                                            {/* Dates */}
                                            <td className="px-3 py-3.5 hidden lg:table-cell">
                                                <span className="text-slate-600 text-xs font-medium">{fmtDate(activity.arrival_date)}</span>
                                            </td>
                                            <td className="px-3 py-3.5 hidden lg:table-cell">
                                                <span className="text-slate-600 text-xs font-medium">{fmtDate(activity.departure_date)}</span>
                                            </td>

                                            {/* Nights */}
                                            <td className="px-3 py-3.5 text-center hidden xl:table-cell">
                                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-xs border border-indigo-100/50">
                                                    {activity.total_nights || '-'}
                                                </span>
                                            </td>

                                            {/* Status Badge */}
                                            <td className="px-3 py-3.5 text-center">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold leading-none border whitespace-nowrap ${badge.className}`}>
                                                    {badge.dot && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>}
                                                    {!badge.dot && status === 'completed' && (
                                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                                    )}
                                                    {!badge.dot && status === 'upcoming' && (
                                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                    )}
                                                    {!badge.dot && status === 'canceled' && (
                                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                                    )}
                                                    {STATUS_LABEL[status]}
                                                </span>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-3 pr-5 py-3.5 text-center" onClick={e => e.stopPropagation()}>
                                                <ActionDropdown
                                                    activity={activity}
                                                    status={status}
                                                    onDetail={setSelectedActivity}
                                                    onPrint={printTransaction}
                                                    onCheckout={handleCheckout}
                                                    onCancel={handleCancel}
                                                    isCheckingOut={isCheckingOut}
                                                />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-20 px-6">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-100 mb-4">
                            <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                        </div>
                        <p className="text-slate-400 text-sm font-medium">
                            {hasActiveFilters || statusTab !== 'all'
                                ? "Tidak ditemukan reservasi yang cocok dengan filter."
                                : "Belum ada data reservasi."}
                        </p>
                        {(hasActiveFilters || statusTab !== 'all') && (
                            <button
                                onClick={() => { setSearchTerm(''); setRoomTypeFilter('Semua'); setStartDate(''); setEndDate(''); setStatusTab('all'); }}
                                className="mt-3 text-indigo-500 hover:text-indigo-600 text-sm font-semibold hover:underline transition-colors"
                            >
                                Hapus semua filter
                            </button>
                        )}
                    </div>
                )}

                {/* ─── Pagination ───────────────────────────────────── */}
                {filteredActivities.length > ITEMS_PER_PAGE && (
                    <div className="px-5 py-3.5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <p className="text-xs text-slate-400 font-medium tabular-nums">
                            Menampilkan <span className="text-slate-600 font-bold">{(safeCurrentPage - 1) * ITEMS_PER_PAGE + 1}</span>
                            –<span className="text-slate-600 font-bold">{Math.min(safeCurrentPage * ITEMS_PER_PAGE, filteredActivities.length)}</span> dari{' '}
                            <span className="text-slate-600 font-bold">{filteredActivities.length}</span> reservasi
                        </p>
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => setCurrentPage(1)}
                                disabled={safeCurrentPage === 1}
                                className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-xs font-bold"
                                title="Halaman pertama"
                            >
                                ««
                            </button>
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={safeCurrentPage === 1}
                                className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                            </button>

                            {/* Page numbers */}
                            {(() => {
                                const pages = [];
                                const maxVisible = 5;
                                let start = Math.max(1, safeCurrentPage - Math.floor(maxVisible / 2));
                                let end = Math.min(totalPages, start + maxVisible - 1);
                                if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);

                                for (let i = start; i <= end; i++) {
                                    pages.push(
                                        <button
                                            key={i}
                                            onClick={() => setCurrentPage(i)}
                                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                                                i === safeCurrentPage
                                                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                                                    : 'border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                                            }`}
                                        >
                                            {i}
                                        </button>
                                    );
                                }
                                return pages;
                            })()}

                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={safeCurrentPage === totalPages}
                                className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                            </button>
                            <button
                                onClick={() => setCurrentPage(totalPages)}
                                disabled={safeCurrentPage === totalPages}
                                className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-xs font-bold"
                                title="Halaman terakhir"
                            >
                                »»
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ─── Detail Modal ──────────────────────────────────── */}
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

            {/* ─── Export Modal ──────────────────────────────────── */}
            {isExportModalOpen && createPortal(
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
                    style={{ animation: 'exportOverlayIn 0.3s ease-out' }}
                >
                    <style dangerouslySetInnerHTML={{ __html: `
                        @keyframes exportOverlayIn { from { opacity: 0; } to { opacity: 1; } }
                        @keyframes exportModalPop { from { opacity: 0; transform: scale(0.85) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
                    `}} />
                    <div
                        className="bg-white rounded-2xl p-7 shadow-2xl w-full max-w-md border border-slate-100"
                        style={{ animation: 'exportModalPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                    >
                        <h3 className="text-lg font-bold text-slate-800 mb-1.5">Pilih Rentang Laporan</h3>
                        <p className="text-slate-500 text-sm mb-5">Tentukan rentang tanggal (arrival date) untuk data yang akan diekspor ke format CSV. Kosongkan jika ingin mengunduh semua.</p>
                        <div className="space-y-3 mb-6">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">Mulai Tanggal</label>
                                <input
                                    type="date" value={exportStart}
                                    onChange={(e) => setExportStart(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer text-slate-800 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">Sampai Tanggal</label>
                                <input
                                    type="date" value={exportEnd}
                                    onChange={(e) => setExportEnd(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer text-slate-800 text-sm"
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsExportModalOpen(false)}
                                className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all text-sm"
                            >
                                Batal
                            </button>
                            <button
                                onClick={processExportCSV}
                                className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-sm shadow-indigo-200 flex items-center justify-center gap-2 text-sm"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                Unduh CSV
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* ─── Custom Alert ──────────────────────────────────── */}
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
