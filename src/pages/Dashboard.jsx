import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import CustomAlert from '../components/CustomAlert';
import DetailModal, { printTransaction, formatIDR } from '../components/ReservationDetailModal';

// New Dashboard Components
import StatCard from '../components/dashboard/StatCard';
import OccupancyGauge from '../components/dashboard/OccupancyGauge';
import TodayAtAGlance from '../components/dashboard/TodayAtAGlance';
import RevenueChart from '../components/dashboard/RevenueChart';
import LoadingScreen from '../components/LoadingScreen';

export default function Dashboard() {
    const { role } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const [stats, setStats] = useState({
        totalReservations: 0,
        activeRooms: 0,
        roomTypeCounts: { Standard: 0, Deluxe: 0, Suite: 0 }
    });

    const [trends, setTrends] = useState({
        total: 0,
        active: 0,
        revenue: 0
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
        isOpen: false, title: '', message: '', type: 'info', onConfirm: null 
    });

    const TOTAL_HOTEL_ROOMS = 100; // 5 floors * 20 rooms

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const today = new Date();
            today.setHours(0,0,0,0);
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            
            const todayStr = today.toISOString().split('T')[0];
            const yesterdayStr = yesterday.toISOString().split('T')[0];

            // 1. Fetch Stats & Occupancy Data
            const { data: allTx, error: txError } = await supabase
                .from('transactions')
                .select('arrival_date, departure_date, room_no, status, grand_total, created_at');
            
            if (txError) throw txError;

            let activeRooms = 0;
            let roomTypeCounts = { Standard: 0, Deluxe: 0, Suite: 0 };
            
            const getRoomType = (roomNo) => {
                const num = parseInt(roomNo.toString().trim().slice(-2));
                if (num <= 14) return 'Standard';
                if (num <= 18) return 'Deluxe';
                return 'Suite';
            };
            
            // Trend counters
            let transactionsToday = 0, transactionsYesterday = 0;
            let revenueToday = 0, revenueYesterday = 0;
            let activeRoomsYesterday = 0;

            if (allTx) {
                allTx.forEach(t => {
                    const roomsCount = t.room_no ? t.room_no.split(',').length : 0;
                    const createdAt = new Date(t.created_at);
                    createdAt.setHours(0,0,0,0);

                    // Global stats
                    if (t.status === 'canceled') return;

                    const arr = new Date(t.arrival_date); arr.setHours(0,0,0,0);
                    const dep = new Date(t.departure_date); dep.setHours(0,0,0,0);
                    
                    if (today >= arr && today < dep) {
                        activeRooms += roomsCount;
                        if (t.room_no) {
                            t.room_no.split(',').forEach(rn => {
                                const type = getRoomType(rn);
                                roomTypeCounts[type]++;
                            });
                        }
                    }

                    // Trend calculations
                    if (createdAt.getTime() === today.getTime()) {
                        transactionsToday++;
                        revenueToday += (t.grand_total || 0);
                    } else if (createdAt.getTime() === yesterday.getTime()) {
                        transactionsYesterday++;
                        revenueYesterday += (t.grand_total || 0);
                    }

                    // Active rooms yesterday for trend
                    if (yesterday >= arr && yesterday < dep) {
                        activeRoomsYesterday += roomsCount;
                    }
                });
            }

            // Calculate percentage trends
            const calcTrend = (curr, prev) => {
                if (prev === 0) return curr > 0 ? 100 : 0;
                return Math.round(((curr - prev) / prev) * 100);
            };

            setTrends({
                total: calcTrend(transactionsToday, transactionsYesterday),
                active: calcTrend(activeRooms, activeRoomsYesterday),
                revenue: calcTrend(revenueToday, revenueYesterday)
            });

            // 2. Fetch Lists (Today's movements)
            const { data: tCheckIns } = await supabase
                .from('transactions')
                .select('*')
                .eq('arrival_date', todayStr)
                .neq('status', 'canceled');

            const { data: tCheckOuts } = await supabase
                .from('transactions')
                .select('*')
                .eq('departure_date', todayStr)
                .neq('status', 'canceled');

            const { data: recentResData } = await supabase
                .from('transactions')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(5);

            setRecentActivities(recentResData || []);
            setTodayCheckIns(tCheckIns || []);
            setTodayCheckOuts(tCheckOuts || []);
            setAllTransactions(allTx || []);

            setStats({
                totalReservations: allTx.length,
                activeRooms: activeRooms,
                roomTypeCounts: roomTypeCounts
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
                timeZone: 'Asia/Jakarta', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
            });
            setJakartaTime(now);
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, []);

    useEffect(() => { fetchDashboardData(); }, [location.key]);

    // Re-use logic for Charts but extracted to a variable for cleaner JSX
    const CHART_RANGES = [
        { key: '1hari', label: 'Day' }, { key: '1bulan', label: 'Month' },
        { key: '6bulan', label: '6M' }, { key: '1tahun', label: 'Year' },
    ];

    const chartData = useMemo(() => {
        const today = new Date(); today.setHours(23, 59, 59, 999);
        if (chartRange === '1hari') {
            const hourMap = {}; for (let h = 0; h < 24; h++) hourMap[h] = 0;
            const todayStr = new Date().toISOString().slice(0, 10);
            allTransactions.forEach((t) => {
                if (!t.created_at) return;
                const d = new Date(t.created_at);
                if (d.toISOString().slice(0, 10) === todayStr) hourMap[d.getHours()] += (t.grand_total || 0);
            });
            return Object.entries(hourMap).map(([hour, total]) => ({ label: `${String(hour).padStart(2, '0')}:00`, total }));
        }
        if (chartRange === '1bulan') {
            const dailyMap = {}; 
            for (let i = 29; i >= 0; i--) { const d = new Date(today); d.setDate(d.getDate() - i); dailyMap[d.toISOString().slice(0, 10)] = 0; }
            allTransactions.forEach((t) => {
                if (!t.created_at) return;
                const key = new Date(t.created_at).toISOString().slice(0, 10);
                if (dailyMap[key] !== undefined) dailyMap[key] += (t.grand_total || 0);
            });
            return Object.entries(dailyMap).map(([date, total]) => ({ label: new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }), total }));
        }
        // ... (Simpler month mapping for 6M and 1Y)
        const months = chartRange === '6bulan' ? 5 : 11;
        const monthlyMap = {};
        for (let i = months; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            monthlyMap[`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`] = 0;
        }
        allTransactions.forEach((t) => {
            if (!t.created_at) return;
            const cd = new Date(t.created_at);
            const key = `${cd.getFullYear()}-${String(cd.getMonth() + 1).padStart(2, '0')}`;
            if (monthlyMap[key] !== undefined) monthlyMap[key] += (t.grand_total || 0);
        });
        return Object.entries(monthlyMap).map(([month, total]) => {
            const [y, m] = month.split('-');
            return { label: new Date(Number(y), Number(m) - 1).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }), total };
        });
    }, [allTransactions, chartRange]);

    const chartSubtitle = {
        '1hari': 'Income hourly today', '1bulan': 'Daily income last 30 days',
        '6bulan': 'Monthly income last 6 months', '1tahun': 'Monthly income last 12 months',
    };

    const handleCheckout = async (id) => {
        setAlertConfig({
            isOpen: true, title: 'Konfirmasi Check-out',
            message: 'Tamu ingin check-out sekarang? Departure date akan diperbarui ke hari ini.',
            type: 'confirm',
            onConfirm: async () => {
                setAlertConfig(p => ({ ...p, isOpen: false }));
                setIsCheckingOut(true);
                try {
                    const todayDate = new Date().toISOString().split('T')[0];
                    const { error } = await supabase.from('transactions').update({ departure_date: todayDate }).eq('id', id);
                    if (error) throw error;
                    await fetchDashboardData();
                    setSelectedActivity(null);
                    setAlertConfig({ isOpen: true, title: 'Berhasil', message: 'Check-out berhasil!', type: 'success' });
                } catch (e) {
                    setAlertConfig({ isOpen: true, title: 'Error', message: e.message, type: 'error' });
                } finally { setIsCheckingOut(false); }
            }
        });
    };

    const handleCancel = async (id) => {
        setAlertConfig({
            isOpen: true, title: 'Konfirmasi Batal',
            message: 'Yakin ingin membatalkan reservasi ini?', type: 'confirm',
            onConfirm: async () => {
                setAlertConfig(p => ({ ...p, isOpen: false }));
                try {
                    const { error } = await supabase.from('transactions').update({ status: 'canceled' }).eq('id', id);
                    if (error) throw error;
                    await fetchDashboardData();
                    setSelectedActivity(null);
                    setAlertConfig({ isOpen: true, title: 'Berhasil', message: 'Reservasi dibatalkan.', type: 'success' });
                } catch (e) { setAlertConfig({ isOpen: true, title: 'Error', message: e.message, type: 'error' }); }
            }
        });
    };

    const renderActivityList = (title, data, emptyMessage, onSeeAllClick, btnLabel) => (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 flex-1 overflow-hidden flex flex-col group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 leading-none">{title}</h2>
                {onSeeAllClick && (
                    <button onClick={onSeeAllClick} className="text-indigo-600 hover:text-indigo-800 text-xs font-black flex items-center gap-1 group transition-colors uppercase tracking-widest">
                        Semua
                        <svg className="w-3 h-3 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                    </button>
                )}
            </div>
            <div className="flex-1 p-4 flex flex-col">
                {data.length > 0 ? (
                    <div className="space-y-2 flex-1">
                        {data.map((item, idx) => (
                            <div key={idx} onClick={() => setSelectedActivity(item)} className="group/item flex items-center justify-between p-3 rounded-2xl border border-transparent hover:border-slate-100 hover:bg-slate-50 transition-all cursor-pointer">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-400 group-hover/item:bg-indigo-600 group-hover/item:text-white transition-colors">
                                        {item.guest_name[0].toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-slate-800 text-sm truncate leading-tight">{item.guest_name}</p>
                                        <p className="text-[10px] text-slate-400 mt-0.5 font-bold uppercase tracking-tight">Kamar {item.room_no}</p>
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-[10px] font-black text-slate-800 tabular-nums">{formatIDR(item.grand_total)}</p>
                                    <p className="text-[9px] text-slate-400 uppercase font-bold">{new Date(item.created_at).toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit' })}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 text-slate-400 flex flex-col items-center justify-center flex-1">
                        <svg className="h-8 w-8 text-slate-200 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                        <p className="text-[10px] font-bold uppercase tracking-widest">{emptyMessage}</p>
                    </div>
                )}
            </div>
        </div>
    );

    if (loading) return <LoadingScreen message="Menyinkronkan data..." />;

    return (
        <div className="px-6 py-6 space-y-6 animate-page-entrance max-w-[1600px] mx-auto">
            {/* 1. Header & Quick Actions */}
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 bg-gradient-to-r from-indigo-800 to-purple-800 rounded-[2rem] p-6 lg:p-8 shadow-xl shadow-indigo-500/20 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-white/5 opacity-40 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(255,255,255,0.1) 0%, transparent 20%)', backgroundSize: '30px 30px' }} />
                <div className="relative z-10">
                    <h1 className="text-3xl lg:text-4xl font-black tracking-tight">Dashboard Overview</h1>
                    <div className="flex items-center gap-3 mt-3">
                        <div className="px-3 py-1 bg-white/10 backdrop-blur rounded-full border border-white/20 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-100">Live Status: Online</span>
                        </div>
                        <span className="text-indigo-300 text-xs font-bold">{jakartaTime}</span>
                    </div>
                </div>
                <div className="relative z-10 flex flex-wrap items-center gap-4">
                    <button onClick={() => navigate('/rooms')} className="group bg-white hover:bg-slate-50 text-indigo-600 px-8 py-4 rounded-2xl text-xs font-black shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center gap-2 uppercase tracking-widest">
                        <svg className="w-4 h-4 group-hover:rotate-90 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                        New Booking
                    </button>
                    {(role === 'Superadmin' || role === 'Admin') && (
                        <button onClick={() => navigate('/monitoring')} className="bg-indigo-500/30 hover:bg-indigo-500/50 backdrop-blur text-white px-6 py-4 rounded-2xl text-xs font-black border border-white/10 hover:shadow-xl transition-all uppercase tracking-widest">
                            Manage All
                        </button>
                    )}
                </div>
            </header>

            {/* 2. Bento Grid - Primary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <StatCard title="Total Reservations" value={stats.totalReservations} subValue="Bookings" color="indigo" trend={trends.total} delay={0.1} icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>} />
                <StatCard title="Active Rooms" value={stats.activeRooms} subValue="Occupied" color="rose" trend={trends.active} delay={0.2} icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
                <StatCard title="Today Revenue" value={formatIDR(trends.revenue >= 0 ? trends.revenue : 0)} subValue="Income" color="emerald" trend={trends.revenue} delay={0.3} icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
                <StatCard title="Check-out Today" value={todayCheckOuts.length} subValue="Rooms" color="amber" delay={0.4} icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>} />
            </div>

            {/* 3. Main Analytics Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2">
                    <RevenueChart 
                        data={chartData} range={chartRange} 
                        chartSubtitle={chartSubtitle} ranges={CHART_RANGES} 
                        setRange={setChartRange} formatIDR={formatIDR} 
                    />
                </div>
                <div className="xl:col-span-1">
                    <OccupancyGauge totalRooms={TOTAL_HOTEL_ROOMS} occupiedRooms={stats.activeRooms} roomTypeCounts={stats.roomTypeCounts} />
                </div>
            </div>

            {/* 4. Activity Lists & Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <TodayAtAGlance arrivals={todayCheckIns} departures={todayCheckOuts} />
                {renderActivityList("Today's Arrivals", todayCheckIns, "No arrivals today", null)}
                {renderActivityList("Recent Activity", recentActivities, "No recent data", () => navigate('/monitoring'), "See Monitoring")}
            </div>

            {/* Modals & Alerts */}
            {selectedActivity && (
                <DetailModal activity={selectedActivity} onClose={() => setSelectedActivity(null)} onPrint={printTransaction} onCheckout={handleCheckout} onCancel={handleCancel} isCheckingOut={isCheckingOut} />
            )}
            <CustomAlert isOpen={alertConfig.isOpen} onClose={() => setAlertConfig(p => ({ ...p, isOpen: false }))} onConfirm={alertConfig.onConfirm} title={alertConfig.title} message={alertConfig.message} type={alertConfig.type} />
            
            <style>{`
                @keyframes statCardIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                .animate-page-entrance { animation: statCardIn 0.4s ease-out forwards; }
            `}</style>
        </div>
    );
}
