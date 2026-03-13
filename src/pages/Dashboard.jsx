import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

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

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Fetch basic stats
                const { count: totalReservations } = await supabase
                    .from('transactions')
                    .select('*', { count: 'exact', head: true });

                const { count: activeReservations } = await supabase
                    .from('transactions')
                    .select('*', { count: 'exact', head: true });
                    // .eq('status', 'Confirmed'); // Transaction table currently has no status

                const { count: completedReservations } = await supabase
                    .from('transactions')
                    .select('*', { count: 'exact', head: true });
                    // .eq('status', 'Completed'); // Transaction table currently has no status

                const { count: totalUsers } = await supabase
                    .from('user_roles')
                    .select('*', { count: 'exact', head: true });

                const { data: recentResData } = await supabase
                    .from('transactions')
                    .select('id, guest_name, room_type, room_no, created_at, arrival_date, departure_date, total_nights')
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
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500">
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

            <div className="mt-12 bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                <h2 className="text-xl font-bold text-slate-800 mb-6">Aktivitas Terbaru</h2>
                {recentActivities && recentActivities.length > 0 ? (
                    <div className="space-y-4">
                        {recentActivities.map((activity, idx) => (
                            <div key={idx} className="flex items-center justify-between border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 shrink-0">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-slate-800 font-bold truncate">{activity.guest_name}</p>
                                        <div className="text-slate-500 text-sm mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
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
                                <div className="text-right shrink-0 ml-4 flex flex-col justify-between items-end">
                                    <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold leading-5 bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-sm">
                                        Selesai
                                    </span>
                                    <p className="text-slate-400 text-xs mt-1">
                                        {activity.created_at ? new Date(activity.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                                    </p>
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
        </div>
    );
}
