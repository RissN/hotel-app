import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../supabaseClient';
import CustomAlert from '../components/CustomAlert';
import DetailModal, { printTransaction } from '../components/ReservationDetailModal';

export default function ReservationMonitoring() {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roomTypeFilter, setRoomTypeFilter] = useState('Semua');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [exportStart, setExportStart] = useState('');
    const [exportEnd, setExportEnd] = useState('');
    const [selectedActivity, setSelectedActivity] = useState(null);
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ 
        isOpen: false, 
        title: '', 
        message: '', 
        type: 'info',
        onConfirm: null 
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

    useEffect(() => {
        fetchActivities();
    }, []);

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
                    
                    await fetchActivities();
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

    const roomTypes = ['Semua', ...Array.from(new Set(
        activities
            .flatMap(a => (a.room_type || '').split(',').map(t => t.trim()))
            .filter(Boolean)
    )).sort()];

    const filteredActivities = activities.filter(activity => {
        if (roomTypeFilter !== 'Semua') {
            const types = (activity.room_type || '').split(',').map(t => t.trim());
            if (!types.includes(roomTypeFilter)) return false;
        }

        if (startDate || endDate) {
            const activityArrival = activity.arrival_date ? new Date(activity.arrival_date) : null;
            if (activityArrival) {
                if (startDate) {
                    const sd = new Date(startDate);
                    sd.setHours(0,0,0,0);
                    if (activityArrival < sd) return false;
                }
                if (endDate) {
                    const ed = new Date(endDate);
                    ed.setHours(23,59,59,999);
                    if (activityArrival > ed) return false;
                }
            } else {
                return false;
            }
        }

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

    const handleExportCSV = () => {
        setIsExportModalOpen(true);
    };

    const processExportCSV = () => {
        let exportData = activities;
        
        if (exportStart || exportEnd) {
            exportData = exportData.filter(activity => {
                const arr = activity.arrival_date ? new Date(activity.arrival_date) : null;
                if (!arr) return false;
                
                if (exportStart) {
                    const sd = new Date(exportStart);
                    sd.setHours(0,0,0,0);
                    if (arr < sd) return false;
                }
                if (exportEnd) {
                    const ed = new Date(exportEnd);
                    ed.setHours(23,59,59,999);
                    if (arr > ed) return false;
                }
                return true;
            });
        }

        if (exportData.length === 0) {
            return setAlertConfig({
                isOpen: true,
                title: 'Data Kosong',
                message: 'Tidak ada data reservasi dalam rentang tanggal yang dipilih.',
                type: 'info'
            });
        }

        const headers = ["ID", "Nama Tamu", "Kamar", "Tipe Kamar", "Orang", "Check-In", "Check-Out", "Status"];
        const rows = exportData.map(a => [
            a.id,
            a.guest_name || '-',
            a.room_no || '-',
            a.room_type || '-',
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

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[50vh] text-slate-500">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Memuat Data Reservasi...
            </div>
        );
    }

    return (
        <div className="px-6 py-8 space-y-8 animate-page-entrance">
            <header className="mb-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-gradient-to-r from-indigo-800 to-purple-800 rounded-3xl p-8 shadow-lg shadow-indigo-500/20 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-white/5 opacity-50 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(255,255,255,0.1) 0%, transparent 20%)', backgroundSize: '20px 20px' }} />
                
                <div className="relative z-10 w-full lg:w-auto">
                    <h1 className="text-3xl font-extrabold tracking-tight">List Reservasi</h1>
                    <p className="text-indigo-200 mt-2 text-md">Pantau seluruh daftar reservasi aktif, selesai, maupun yang akan datang.</p>
                </div>
                
                <div className="relative z-10 flex flex-wrap items-center gap-4 shrink-0">
                    <button
                        onClick={handleExportCSV}
                        className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur border border-white/20 text-white px-5 py-3 rounded-2xl text-sm font-bold shadow-md transition-all duration-200"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        Ekspor Laporan
                    </button>
                </div>
            </header>

            <div className="bg-white rounded-3xl p-8 shadow-md border border-slate-200">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-6 gap-4">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-bold text-slate-800">Daftar Lengkap Reservasi</h2>
                        <span className="text-xs bg-indigo-50 text-indigo-600 font-bold px-2.5 py-1 rounded-md border border-indigo-100">{filteredActivities.length} data</span>
                    </div>
                    
                    <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
                        {/* Date Range Filter */}
                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 w-full lg:w-auto">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dari</span>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="bg-transparent text-sm text-slate-700 focus:outline-none flex-1 lg:flex-none cursor-pointer"
                            />
                            <span className="text-[10px] font-bold text-slate-400 uppercase border-l border-slate-300 pl-2 tracking-widest">S/D</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="bg-transparent text-sm text-slate-700 focus:outline-none flex-1 lg:flex-none cursor-pointer"
                            />
                            {(startDate || endDate) && (
                                <button onClick={() => { setStartDate(''); setEndDate(''); }} className="ml-1 text-slate-400 hover:text-rose-500" title="Reset Tanggal">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            )}
                        </div>

                        {/* Room Type Dropdown */}
                        <div className="relative w-full lg:w-auto">
                            <select
                                value={roomTypeFilter}
                                onChange={(e) => setRoomTypeFilter(e.target.value)}
                                className="w-full lg:w-48 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer text-slate-700 font-medium appearance-none"
                            >
                                {roomTypes.map(type => (
                                    <option key={type} value={type}>{type === 'Semua' ? 'Semua Tipe Kamar' : type}</option>
                                ))}
                            </select>
                            <svg className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </div>

                        {/* Search Input */}
                        <div className="relative w-full lg:w-64">
                            <input
                                type="text"
                                placeholder="Cari nama, booking no..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-slate-700"
                            />
                            <svg className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                {filteredActivities.length > 0 ? (
                    filteredActivities.map((activity, idx) => {
                        const now = new Date();
                        now.setHours(0,0,0,0);
                        const arr = new Date(activity.arrival_date);
                        arr.setHours(0,0,0,0);
                        const dep = new Date(activity.departure_date);
                        dep.setHours(0,0,0,0);

                        let badgeClass, badgeIcon, badgeText;
                        if (activity.status === 'canceled') {
                            badgeClass = 'bg-red-50 text-red-700 border-red-200';
                            badgeIcon = <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
                            badgeText = 'Dibatalkan';
                        } else if (now >= arr && now < dep) {
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
                            className="flex flex-col lg:flex-row lg:items-center justify-between border border-slate-200/60 rounded-2xl p-5 bg-white hover:bg-slate-50/50 hover:border-slate-300 transition-all shadow-sm hover:shadow"
                        >
                            {/* Left: Info */}
                            <div className="flex items-center gap-5 min-w-0 flex-1 mb-4 lg:mb-0">
                                <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 shrink-0 shadow-inner">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-3 mb-1">
                                        <p className="text-slate-800 font-bold text-lg truncate">{activity.guest_name}</p>
                                        <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-100 text-slate-500 border border-slate-200 shadow-sm">
                                            #{activity.booking_no || '-'}
                                        </span>
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold leading-none border shadow-sm whitespace-nowrap ${badgeClass}`}>
                                            {badgeIcon}
                                            {badgeText}
                                        </span>
                                    </div>
                                    <div className="text-slate-500 text-sm mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-2">
                                        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-700 font-medium whitespace-nowrap">
                                            <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                                            Kamar {activity.room_no} ({activity.room_type})
                                        </span>
                                        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-100/50 rounded-md text-indigo-700 font-medium whitespace-nowrap">
                                            <svg className="w-4 h-4 text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                            {activity.arrival_date ? new Date(activity.arrival_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                                            <span className="mx-1 text-indigo-300">→</span>
                                            {activity.departure_date ? new Date(activity.departure_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                                            <span className="ml-1.5 text-xs text-indigo-500/80 bg-white/50 px-1.5 py-0.5 rounded">({activity.total_nights} malam)</span>
                                        </span>
                                        <span className="text-xs text-slate-400">
                                            Dibuat: {activity.created_at ? new Date(activity.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Buttons */}
                            <div className="shrink-0 lg:ml-6 flex flex-wrap items-center gap-3 border-t lg:border-t-0 border-slate-100 pt-3 lg:pt-0">
                                <button
                                    onClick={() => setSelectedActivity(activity)}
                                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-50/80 hover:bg-indigo-100/80 text-indigo-700 font-semibold text-sm border border-indigo-200/50 transition-all hover:shadow-sm active:scale-95"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    Detail
                                </button>

                                <button
                                    onClick={() => printTransaction(activity)}
                                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-green-50/80 hover:bg-green-100/80 text-green-700 font-semibold text-sm border border-green-200/50 transition-all hover:shadow-sm active:scale-95"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                    </svg>
                                    Print
                                </button>

                                {/* Check-out / Cancel */}
                                {badgeText === 'Aktif' && (
                                    <button
                                        onClick={() => handleCheckout(activity.id)}
                                        disabled={isCheckingOut}
                                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-50/80 hover:bg-amber-100/80 text-amber-700 font-semibold text-sm border border-amber-200/50 transition-all hover:shadow-sm active:scale-95 disabled:opacity-50"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                        Check Out
                                    </button>
                                )}

                                {badgeText === 'Akan Datang' && activity.status !== 'canceled' && (
                                    <button
                                        onClick={() => handleCancel(activity.id)}
                                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-50/80 hover:bg-red-100/80 text-red-700 font-semibold text-sm border border-red-200/50 transition-all hover:shadow-sm active:scale-95"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                    })
                ) : (
                    <div className="text-center py-16 text-slate-400">
                        <svg className="mx-auto h-16 w-16 text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        <p className="text-lg">{searchTerm || roomTypeFilter !== 'Semua' ? "Tidak ditemukan aktivitas yang cocok dengan filter atau pencarian Anda." : "Belum ada daftar reservasi apapun."}</p>
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

            {/* Export Modal */}
            {isExportModalOpen && createPortal(
                <div 
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
                    style={{ animation: 'exportOverlayIn 0.3s ease-out' }}
                >
                    <style dangerouslySetInnerHTML={{ __html: `
                        @keyframes exportOverlayIn {
                            from { opacity: 0; }
                            to { opacity: 1; }
                        }
                        @keyframes exportModalPop {
                            from {
                                opacity: 0;
                                transform: scale(0.85) translateY(20px);
                            }
                            to {
                                opacity: 1;
                                transform: scale(1) translateY(0);
                            }
                        }
                    `}} />
                    <div 
                        className="bg-white rounded-3xl p-8 shadow-2xl w-full max-w-md border border-slate-100"
                        style={{ animation: 'exportModalPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                    >
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Pilih Rentang Laporan</h3>
                        <p className="text-slate-500 text-sm mb-6">Tentukan rentang tanggal (arrival date) untuk data yang akan diekspor ke format CSV. Kosongkan jika ingin mengunduh semua.</p>
                        
                        <div className="space-y-4 mb-8">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Mulai Tanggal</label>
                                <input 
                                    type="date"
                                    value={exportStart}
                                    onChange={(e) => setExportStart(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer text-slate-800"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Sampai Tanggal</label>
                                <input 
                                    type="date"
                                    value={exportEnd}
                                    onChange={(e) => setExportEnd(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer text-slate-800"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsExportModalOpen(false)}
                                className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all"
                            >
                                Batal
                            </button>
                            <button
                                onClick={processExportCSV}
                                className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-sm shadow-indigo-200 flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                Unduh CSV
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
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
