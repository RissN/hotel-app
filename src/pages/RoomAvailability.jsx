import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function RoomAvailability() {
    const [occupiedRooms, setOccupiedRooms] = useState({});
    const [loading, setLoading] = useState(true);

    const floors = [5, 4, 3, 2, 1]; // Top floor first
    const roomsPerFloor = 20;

    const fetchOccupancy = async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            
            // Fetch transactions that are currently active
            // arrival_date <= today AND departure_date > today
            const { data, error } = await supabase
                .from('transactions')
                .select('room_no, guest_name, arrival_date, departure_date')
                .lte('arrival_date', today)
                .gt('departure_date', today);

            if (error) throw error;

            const occupancyMap = {};
            data.forEach(tx => {
                occupancyMap[tx.room_no] = {
                    guestName: tx.guest_name,
                    arrival: tx.arrival_date,
                    departure: tx.departure_date
                };
            });
            setOccupiedRooms(occupancyMap);
        } catch (error) {
            console.error('Error fetching room occupancy:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOccupancy();

        // Real-time subscription
        const channel = supabase
            .channel('room-updates')
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'transactions' 
            }, () => {
                fetchOccupancy();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const getRoomNumber = (floor, index) => {
        const sequence = (index + 1).toString().padStart(2, '0');
        return `${floor}${sequence}`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] text-slate-500">
                <div className="flex flex-col items-center gap-4">
                    <svg className="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="font-medium animate-pulse">Menghubungkan ke Server...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-page-entrance">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Ketersediaan Kamar</h1>
                    <p className="text-slate-500 mt-1">Status hunian kamar secara waktu nyata (real-time).</p>
                </div>
                <div className="flex items-center gap-6 bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-sm self-start">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-md bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div>
                        <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Tersedia</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-md bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"></div>
                        <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Terisi</span>
                    </div>
                </div>
            </header>

            <div className="space-y-10">
                {floors.map(floor => (
                    <section key={floor} className="relative">
                        <div className="flex items-center gap-4 mb-4">
                            <h2 className="text-lg font-bold text-slate-700 whitespace-nowrap">Lantai {floor}</h2>
                            <div className="h-[1px] w-full bg-slate-200"></div>
                        </div>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-10 gap-3">
                            {Array.from({ length: roomsPerFloor }).map((_, i) => {
                                const roomNo = getRoomNumber(floor, i);
                                const status = occupiedRooms[roomNo];
                                const isOccupied = !!status;

                                return (
                                    <div
                                        key={roomNo}
                                        className={`relative group cursor-pointer transition-all duration-300 hover:-translate-y-1 ${
                                            isOccupied 
                                            ? 'bg-rose-50 border-rose-200 text-rose-700' 
                                            : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-500/10'
                                        } border rounded-xl p-3 shadow-sm flex flex-col items-center justify-center gap-1 h-20 overflow-hidden`}
                                    >
                                        <span className={`text-sm font-bold tracking-tight ${isOccupied ? 'text-rose-600' : 'text-slate-500'}`}>
                                            {roomNo}
                                        </span>
                                        
                                        {isOccupied ? (
                                            <>
                                                <div className="absolute top-1 right-1">
                                                    <span className="flex h-2 w-2">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                                                    </span>
                                                </div>
                                                <span className="text-[10px] font-medium truncate w-full text-center px-1 opacity-80 uppercase tracking-tighter">
                                                    {status.guestName}
                                                </span>
                                            </>
                                        ) : (
                                            <span className="text-[10px] uppercase font-bold tracking-widest opacity-30">Vakant</span>
                                        )}

                                        {/* Tooltip on Hover */}
                                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-slate-900/90 backdrop-blur-sm transition-opacity duration-300 rounded-xl flex flex-col items-center justify-center p-2 text-[9px] text-white z-10 pointer-events-none">
                                            {isOccupied ? (
                                                <>
                                                    <p className="font-bold border-b border-white/20 pb-1 mb-1 w-full text-center truncate">{status.guestName}</p>
                                                    <p>In: {status.arrival}</p>
                                                    <p>Out: {status.departure}</p>
                                                </>
                                            ) : (
                                                <p className="font-bold">Kamar Siap</p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                ))}
            </div>

            {/* Background Decorations */}
            <div className="fixed top-1/4 -right-20 w-80 h-80 bg-indigo-200/20 rounded-full blur-[100px] -z-10 animate-pulse"></div>
            <div className="fixed bottom-1/4 -left-20 w-80 h-80 bg-purple-200/20 rounded-full blur-[100px] -z-10 animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
    );
}
