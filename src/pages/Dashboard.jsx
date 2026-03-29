import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import CustomAlert from '../components/CustomAlert';
import DetailModal, { printTransaction, formatIDR } from '../components/ReservationDetailModal';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Area, AreaChart
} from 'recharts';

export default function Dashboard() {
    const { role } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const [stats, setStats] = useState({
        totalReservations: 0,
        activeReservations: 0,
        completedReservations: 0,
        upcomingReservations: 0,
        totalRooms: 0,
        activeRooms: 0,
        completedRooms: 0,
        upcomingRooms: 0,
        canceledReservations: 0,
        canceledRooms: 0
    });
    const [recentActivities, setRecentActivities] = useState([]);
    const [todayCheckIns, setTodayCheckIns] = useState([]);
    const [todayCheckOuts, setTodayCheckOuts] = useState([]);
    const [allTransactions, setAllTransactions] = useState([]);
    const [chartRange, setChartRange] = useState('1bulan');
    const [resChartRange, setResChartRange] = useState('7hari');
    const [loading, setLoading] = useState(true);
    const [selectedActivity, setSelectedActivity] = useState(null);
    const [jakartaTime, setJakartaTime] = useState('');

    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ 
        isOpen: false, 
        title: '', 
        message: '', 
        type: 'info',
        onConfirm: null 
    });

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const { count: totalReservations } = await supabase
                .from('transactions')
                .select('*', { count: 'exact', head: true });

            const { data: allDates } = await supabase
                .from('transactions')
                .select('arrival_date, departure_date, room_no, status');
            
            let activeCount = 0;
            let activeRooms = 0;
            let completedCount = 0;
            let completedRooms = 0;
            let upcomingCount = 0;
            let upcomingRooms = 0;
            let canceledCount = 0;
            let canceledRooms = 0;
            let totalRooms = 0;
            
            if (allDates) {
                const today = new Date();
                today.setHours(0,0,0,0);
                
                allDates.forEach(t => {
                    const rooms = t.room_no ? t.room_no.split(',').map(n => n.trim()).length : 0;
                    totalRooms += rooms;

                    if (t.status === 'canceled') {
                        canceledCount++;
                        canceledRooms += rooms;
                        return;
                    }

                    const arrival = new Date(t.arrival_date);
                    arrival.setHours(0,0,0,0);
                    const departure = new Date(t.departure_date);
                    departure.setHours(0,0,0,0);
                    
                    if (today >= arrival && today < departure) {
                        activeCount++;
                        activeRooms += rooms;
                    } else if (today >= departure) {
                        completedCount++;
                        completedRooms += rooms;
                    } else {
                        upcomingCount++;
                        upcomingRooms += rooms;
                    }
                });
            }

            const { data: recentResData } = await supabase
                .from('transactions')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(5); // Only fetch top 5 for dashboard

            setRecentActivities(recentResData || []);

            const tzDate = new Date();
            const y = tzDate.getFullYear();
            const m = String(tzDate.getMonth() + 1).padStart(2, '0');
            const d = String(tzDate.getDate()).padStart(2, '0');
            const todayStrLocal = `${y}-${m}-${d}`;

            const { data: tCheckIns } = await supabase
                .from('transactions')
                .select('*')
                .eq('arrival_date', todayStrLocal)
                .neq('status', 'canceled')
                .order('created_at', { ascending: false });

            const { data: tCheckOuts } = await supabase
                .from('transactions')
                .select('*')
                .eq('departure_date', todayStrLocal)
                .neq('status', 'canceled')
                .order('created_at', { ascending: false });

            setTodayCheckIns(tCheckIns || []);
            setTodayCheckOuts(tCheckOuts || []);

            const { data: allTx } = await supabase
                .from('transactions')
                .select('grand_total, created_at');

            setAllTransactions(allTx || []);

            setStats({
                totalReservations: totalReservations || 0,
                activeReservations: activeCount,
                completedReservations: completedCount,
                upcomingReservations: upcomingCount,
                canceledReservations: canceledCount,
                totalRooms: totalRooms,
                activeRooms: activeRooms,
                completedRooms: completedRooms,
                upcomingRooms: upcomingRooms,
                canceledRooms: canceledRooms
            });
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        } finally {
            setLoading(false);
        }
    };

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
            value: stats.totalRooms,
            subValue: 'Kamar',
            color: 'indigo',
            bgColor: 'bg-indigo-50 border-indigo-100 text-indigo-700',
            iconColor: 'bg-indigo-600 text-white',
            shadow: 'shadow-indigo-500/10',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            )
        },
        {
            title: 'Reservasi Aktif',
            value: stats.activeRooms,
            subValue: 'Kamar Terisi',
            color: 'rose',
            bgColor: 'bg-rose-50 border-rose-100 text-rose-700',
            iconColor: 'bg-rose-500 text-white',
            shadow: 'shadow-rose-500/10',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            )
        },
        {
            title: 'Reservasi Selesai',
            value: stats.completedRooms,
            subValue: 'Kamar',
            color: 'emerald',
            bgColor: 'bg-emerald-50 border-emerald-100 text-emerald-700',
            iconColor: 'bg-emerald-600 text-white',
            shadow: 'shadow-emerald-500/10',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
            )
        },
        {
            title: 'Reservasi Akan Datang',
            value: stats.upcomingRooms,
            subValue: 'Kamar Booking',
            color: 'sky',
            bgColor: 'bg-sky-50 border-sky-100 text-sky-700',
            iconColor: 'bg-sky-500 text-white',
            shadow: 'shadow-sky-500/10',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            )
        },
        {
            title: 'Reservasi Batal',
            value: stats.canceledRooms,
            subValue: 'Kamar',
            color: 'red',
            bgColor: 'bg-red-50 border-red-100 text-red-700',
            iconColor: 'bg-red-500 text-white',
            shadow: 'shadow-red-500/10',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            )
        }
    ];

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
            const hourMap = {};
            for (let h = 0; h < 24; h++) hourMap[h] = 0;
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

    const RES_CHART_RANGES = [
        { key: '7hari', label: '7 Hari' },
        { key: '1bulan', label: '1 Bulan' },
        { key: '6bulan', label: '6 Bulan' },
        { key: '1tahun', label: '1 Tahun' },
    ];

    const resChartData = useMemo(() => {
        const today = new Date();
        today.setHours(23, 59, 59, 999);

        if (resChartRange === '7hari') {
            const dailyMap = {};
            for (let i = 6; i >= 0; i--) {
                const d = new Date(today);
                d.setDate(d.getDate() - i);
                dailyMap[d.toISOString().slice(0, 10)] = 0;
            }
            allTransactions.forEach((t) => {
                if (!t.created_at) return;
                const key = new Date(t.created_at).toISOString().slice(0, 10);
                if (dailyMap[key] !== undefined) {
                    dailyMap[key] += 1;
                }
            });
            return Object.entries(dailyMap).map(([date, total]) => ({
                label: new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
                total,
            }));
        }

        if (resChartRange === '1bulan') {
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
                    dailyMap[key] += 1;
                }
            });
            return Object.entries(dailyMap).map(([date, total]) => ({
                label: new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
                total,
            }));
        }

        if (resChartRange === '6bulan') {
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
                    monthlyMap[key] += 1;
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
                monthlyMap[key] += 1;
            }
        });
        return Object.entries(monthlyMap).map(([month, total]) => {
            const [y, m] = month.split('-');
            return {
                label: new Date(Number(y), Number(m) - 1).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }),
                total,
            };
        });
    }, [allTransactions, resChartRange]);

    const resChartSubtitle = {
        '7hari': 'Total reservasi 7 hari terakhir',
        '1bulan': 'Total reservasi harian 30 hari terakhir',
        '6bulan': 'Total reservasi bulanan 6 bulan terakhir',
        '1tahun': 'Total reservasi bulanan 12 bulan terakhir',
    };

    const renderActivityList = (title, data, emptyMessage, onSeeAllClick, btnLabel) => (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 flex-1 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h2 className="text-lg font-bold text-slate-800">{title}</h2>
                {onSeeAllClick && (
                    <button
                        onClick={onSeeAllClick}
                        className="text-indigo-600 hover:text-indigo-800 text-sm font-bold flex items-center gap-1 group transition-colors"
                    >
                        Lihat Semua
                        <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                )}
            </div>

            <div className="flex-1 p-4 flex flex-col">
                {data.length > 0 ? (
                    <div className="space-y-3 flex-1">
                        {data.map((activity, idx) => {
                            const now = new Date();
                            now.setHours(0,0,0,0);
                            const arr = new Date(activity.arrival_date);
                            arr.setHours(0,0,0,0);
                            const dep = new Date(activity.departure_date);
                            dep.setHours(0,0,0,0);

                            let badgeClass, badgeText, badgeIcon;
                            if (activity.status === 'canceled') {
                                badgeClass = 'bg-red-50 text-red-600 border-red-100';
                                badgeText = 'Batal';
                                badgeIcon = <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
                            } else if (now >= arr && now < dep) {
                                badgeClass = 'bg-emerald-50 text-emerald-600 border-emerald-100';
                                badgeText = 'Aktif';
                                badgeIcon = <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>;
                            } else if (now >= dep) {
                                badgeClass = 'bg-slate-100 text-slate-600 border-slate-200';
                                badgeText = 'Selesai';
                            } else {
                                badgeClass = 'bg-blue-50 text-blue-600 border-blue-100';
                                badgeText = 'Upcoming';
                            }

                            return (
                                <div
                                    key={idx}
                                    className="group flex flex-col sm:flex-row sm:items-center justify-between border border-slate-100 rounded-2xl p-4 bg-white hover:bg-slate-50 transition-all shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] hover:shadow-md cursor-pointer"
                                    onClick={() => setSelectedActivity(activity)}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border shadow-inner ${
                                            badgeText === 'Aktif' ? 'bg-emerald-50 border-emerald-100 text-emerald-500' :
                                            badgeText === 'Upcoming' ? 'bg-blue-50 border-blue-100 text-blue-500' :
                                            badgeText === 'Batal' ? 'bg-red-50 border-red-100 text-red-500' :
                                            'bg-slate-100 border-slate-200 text-slate-500'
                                        }`}>
                                            {badgeText === 'Aktif' ? (
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                                            ) : (
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="text-slate-800 font-bold text-sm truncate">{activity.guest_name}</p>
                                                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border ${badgeClass}`}>
                                                    {badgeIcon}
                                                    {badgeText}
                                                </span>
                                            </div>
                                            <p className="text-slate-500 text-xs mt-0.5 truncate flex items-center gap-1.5">
                                                <span className="font-semibold text-slate-600">Kamar {activity.room_no}</span>
                                                <span className="text-slate-300">•</span>
                                                <span>
                                                    {title === 'Aktivitas Terbaru' 
                                                        ? (activity.created_at ? new Date(activity.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '-')
                                                        : title === 'Check-out Hari Ini'
                                                            ? (activity.departure_date ? new Date(activity.departure_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '-')
                                                            : (activity.arrival_date ? new Date(activity.arrival_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '-')
                                                    }
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-12 text-slate-400 flex flex-col items-center justify-center flex-1 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                        <svg className="h-10 w-10 text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        <p className="text-sm">{emptyMessage}</p>
                    </div>
                )}
                
                {btnLabel && (
                    <button
                        onClick={onSeeAllClick}
                        className="w-full mt-4 py-3 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-sm rounded-xl border border-slate-200 transition-colors flex items-center justify-center gap-2 shadow-sm"
                    >
                        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                        {btnLabel}
                    </button>
                )}
            </div>
        </div>
    );

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
            {/* Header Profiling & Quick Actions */}
            <header className="mb-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-gradient-to-r from-indigo-800 to-purple-800 rounded-3xl p-8 shadow-lg shadow-indigo-500/20 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-white/5 opacity-50 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(255,255,255,0.1) 0%, transparent 20%)', backgroundSize: '20px 20px' }} />
                
                <div className="relative z-10 w-full lg:w-auto">
                    <h1 className="text-3xl font-extrabold tracking-tight">Dashboard Ringkasan</h1>
                    <p className="text-indigo-200 mt-2 text-md">Selamat datang kembali, pantau aktivitas hotel hari ini.</p>
                </div>
                
                <div className="relative z-10 flex flex-wrap items-center gap-4 shrink-0">
                    <button
                        onClick={() => navigate('/rooms')}
                        className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-indigo-700 px-6 py-3 rounded-2xl text-sm font-bold shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
                    >
                        + Reservasi Baru
                    </button>
                    {(role === 'Superadmin' || role === 'Admin') && (
                        <button
                            onClick={() => navigate('/monitoring')}
                            className="flex items-center justify-center gap-2 bg-indigo-600/50 hover:bg-indigo-600/80 backdrop-blur text-white px-5 py-3 rounded-2xl text-sm font-bold border border-indigo-400/30 hover:shadow-xl transition-all duration-200"
                        >
                            List Reservasi Lengkap
                        </button>
                    )}
                    <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl px-5 py-3 shadow-md">
                        <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mb-1">🕐 Waktu Jakarta</p>
                        <p className="text-md font-bold text-white tabular-nums tracking-tight">{jakartaTime}</p>
                    </div>
                </div>
            </header>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                {cards.map((card, index) => (
                    <div
                        key={index}
                        className={`relative overflow-hidden rounded-3xl p-6 bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:${card.shadow} hover:-translate-y-1 transition-all duration-300 group`}
                    >
                        <div className="absolute inset-x-0 bottom-0 h-1 bg-current opacity-10 group-hover:opacity-20 transition-opacity"></div>
                        <div className="relative z-10 flex items-center justify-between">
                            <div>
                                <h3 className="text-slate-400 font-bold text-xs uppercase tracking-widest">{card.title}</h3>
                                <div className="flex items-center gap-2 mt-2">
                                    <p className="text-4xl font-black text-slate-800 tracking-tight tabular-nums">
                                        {card.value}
                                    </p>
                                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg ${card.bgColor} tracking-wide`}>
                                        {card.subValue}
                                    </span>
                                </div>
                            </div>
                            <div className={`${card.iconColor} p-3 rounded-2xl shadow-lg transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                                {card.icon}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content Layout */}
            <div className={`grid grid-cols-1 ${(role === 'Superadmin' || role === 'Admin') ? 'xl:grid-cols-3' : 'lg:grid-cols-3'} gap-8 mt-4`}>
                
                {/* ── Revenue Chart ── */}
                {(role === 'Superadmin' || role === 'Admin') && (
                    <div className="xl:col-span-2 flex flex-col">
                        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800">Grafik Pendapatan</h2>
                                    <p className="text-slate-400 text-sm mt-1">{chartSubtitle[chartRange]}</p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    {CHART_RANGES.map((r) => (
                                        <button
                                            key={r.key}
                                            onClick={() => setChartRange(r.key)}
                                            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-all duration-200 ${
                                                chartRange === r.key
                                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-200'
                                                    : 'bg-white text-slate-600 border-slate-100 hover:border-indigo-300 hover:text-indigo-600 hover:bg-slate-50'
                                            }`}
                                        >
                                            {r.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="h-72 w-full mt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
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
                                                background: '#1e293b', border: 'none', borderRadius: '12px',
                                                boxShadow: '0 10px 40px rgba(0,0,0,0.3)', padding: '10px 14px',
                                            }}
                                            labelStyle={{ color: '#94a3b8', fontSize: 12, marginBottom: 4 }}
                                            itemStyle={{ color: '#fff', fontWeight: 700, fontSize: 13 }}
                                            formatter={(value) => [formatIDR(value), 'Pendapatan']}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="total"
                                            stroke="#6366f1"
                                            strokeWidth={3}
                                            fill="url(#revenueGrad)"
                                            dot={chartRange !== '1bulan' && chartRange !== '1hari' ? { r: 4, fill: '#fff', stroke: '#6366f1', strokeWidth: 2 } : false}
                                            activeDot={{ r: 6, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Total Reservasi Chart (Resepsionis) ── */}
                {(role === 'Resepsionis') && (
                    <div className="lg:col-span-3 xl:col-span-3 flex flex-col mb-4">
                        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800">Grafik Total Reservasi</h2>
                                    <p className="text-slate-400 text-sm mt-1">{resChartSubtitle[resChartRange]}</p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    {RES_CHART_RANGES.map((r) => (
                                        <button
                                            key={r.key}
                                            onClick={() => setResChartRange(r.key)}
                                            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-all duration-200 ${
                                                resChartRange === r.key
                                                    ? 'bg-rose-500 text-white border-rose-500 shadow-sm shadow-rose-200'
                                                    : 'bg-white text-slate-600 border-slate-100 hover:border-rose-300 hover:text-rose-500 hover:bg-slate-50'
                                            }`}
                                        >
                                            {r.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="h-72 w-full mt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={resChartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="resGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                        <XAxis
                                            dataKey="label"
                                            tick={{ fontSize: 11, fill: '#94a3b8' }}
                                            tickLine={false}
                                            axisLine={{ stroke: '#e2e8f0' }}
                                            interval={resChartRange === '1bulan' ? Math.max(0, Math.floor(resChartData.length / 7) - 1) : resChartRange === '7hari' ? 0 : 0}
                                        />
                                        <YAxis
                                            tick={{ fontSize: 11, fill: '#94a3b8' }}
                                            tickLine={false}
                                            axisLine={false}
                                            allowDecimals={false}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                background: '#1e293b', border: 'none', borderRadius: '12px',
                                                boxShadow: '0 10px 40px rgba(0,0,0,0.3)', padding: '10px 14px',
                                            }}
                                            labelStyle={{ color: '#94a3b8', fontSize: 12, marginBottom: 4 }}
                                            itemStyle={{ color: '#fff', fontWeight: 700, fontSize: 13 }}
                                            formatter={(value) => [value, 'Reservasi']}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="total"
                                            stroke="#f43f5e"
                                            strokeWidth={3}
                                            fill="url(#resGrad)"
                                            dot={resChartRange !== '1bulan' ? { r: 4, fill: '#fff', stroke: '#f43f5e', strokeWidth: 2 } : false}
                                            activeDot={{ r: 6, fill: '#f43f5e', stroke: '#fff', strokeWidth: 2 }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Check-in Hari Ini ── */}
                {role === 'Resepsionis' && (
                    <div className="flex flex-col lg:col-span-1">
                        {renderActivityList(
                            "Check-in Hari Ini",
                            todayCheckIns,
                            "Belum ada check-in hari ini.",
                            null,
                            null
                        )}
                    </div>
                )}

                {/* ── Check-out Hari Ini ── */}
                {role === 'Resepsionis' && (
                    <div className="flex flex-col lg:col-span-1">
                        {renderActivityList(
                            "Check-out Hari Ini",
                            todayCheckOuts,
                            "Belum ada check-out hari ini.",
                            null,
                            null
                        )}
                    </div>
                )}

                {/* ── Aktivitas Terbaru ── */}
                <div className={`flex flex-col ${(role === 'Superadmin' || role === 'Admin') ? 'xl:col-span-1' : 'lg:col-span-1'}`}>
                    {renderActivityList(
                        "Aktivitas Terbaru",
                        recentActivities,
                        "Belum ada aktivitas reservasi terkini.",
                        () => navigate('/monitoring'),
                        "List Reservasi Selengkapnya"
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
