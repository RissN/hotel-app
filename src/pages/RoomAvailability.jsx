import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import LoadingScreen from '../components/LoadingScreen';

// fallback
const DEFAULT_PRICES = {
    Standard: 1500000,
    Deluxe: 2500000,
    Suite: 4000000,
};

const formatIDR = (amount) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);

export default function RoomAvailability() {
    const navigate = useNavigate();
    const location = useLocation();
    const [occupiedRooms, setOccupiedRooms] = useState({});
    const [upcomingRooms, setUpcomingRooms] = useState({});
    const [selectedRooms, setSelectedRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(0);
    const [roomPrices, setRoomPrices] = useState(DEFAULT_PRICES);

    useEffect(() => {
        const fetchRates = async () => {
            try {
                const { data } = await supabase.from('room_rates').select('room_type, base_price, seasonal_price');
                if (data && data.length > 0) {
                    const priceMap = { ...DEFAULT_PRICES };
                    data.forEach(r => {
                        priceMap[r.room_type] = r.seasonal_price || r.base_price;
                    });
                    setRoomPrices(priceMap);
                }
            } catch (error) {
                console.error("Fetch rates error:", error);
            }
        };
        fetchRates();
    }, []);

    const floors = [5, 4, 3, 2, 1]; // Top floor first
    const roomsPerFloor = 20;
    const floorsPerPage = 2;
    const totalPages = Math.ceil(floors.length / floorsPerPage);

    const toggleRoomSelection = (roomNo, type) => {
        setSelectedRooms(prev => {
            const isSelected = prev.find(r => r.no === roomNo);
            if (isSelected) {
                return prev.filter(r => r.no !== roomNo);
            } else {
                return [...prev, { no: roomNo, type }];
            }
        });
    };

    const totalPrice = selectedRooms.reduce((acc, r) => acc + (roomPrices[r.type] || 0), 0);

    const handleProceed = () => {
        if (selectedRooms.length === 0) return;
        
        const roomNos = selectedRooms.map(r => r.no).join(',');
        const allTypes = selectedRooms.map(r => r.type).join(',');
        const count = selectedRooms.length;
        
        window.location.href = `/registration?rooms=${roomNos}&type=${allTypes}&count=${count}`;
    };

    const fetchOccupancy = async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            
            // Fetch transactions that are currently active
            // arrival_date <= today AND departure_date > today
            const { data: activeData, error: activeError } = await supabase
                .from('transactions')
                .select('room_no, guest_name, arrival_date, departure_date')
                .lte('arrival_date', today)
                .gt('departure_date', today)
                .neq('status', 'canceled');

            if (activeError) throw activeError;

            const occupancyMap = {};
            activeData.forEach(tx => {
                const roomNos = tx.room_no.split(',').map(n => n.trim());
                roomNos.forEach(roomNo => {
                    occupancyMap[roomNo] = {
                        guestName: tx.guest_name,
                        arrival: tx.arrival_date,
                        departure: tx.departure_date
                    };
                });
            });
            setOccupiedRooms(occupancyMap);

            // Fetch upcoming reservations (arrival_date > today)
            const { data: upcomingData, error: upcomingError } = await supabase
                .from('transactions')
                .select('room_no, guest_name, arrival_date, departure_date')
                .gt('arrival_date', today)
                .neq('status', 'canceled');

            if (upcomingError) throw upcomingError;

            const upcomingMap = {};
            upcomingData.forEach(tx => {
                const roomNos = tx.room_no.split(',').map(n => n.trim());
                roomNos.forEach(roomNo => {
                    // If multiple upcoming, keep the nearest one
                    if (!upcomingMap[roomNo] || new Date(tx.arrival_date) < new Date(upcomingMap[roomNo].arrival)) {
                        upcomingMap[roomNo] = {
                            guestName: tx.guest_name,
                            arrival: tx.arrival_date,
                            departure: tx.departure_date
                        };
                    }
                });
            });
            setUpcomingRooms(upcomingMap);
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
    }, [location.key]);

    const getRoomNumber = (floor, index) => {
        const sequence = (index + 1).toString().padStart(2, '0');
        return `${floor}${sequence}`;
    };

    const getRoomCategory = (index) => {
        const num = index + 1;
        if (num <= 14) return { name: 'Standard', color: 'bg-slate-100 text-slate-600 border-slate-200' };
        if (num <= 18) return { name: 'Deluxe', color: 'bg-amber-100 text-amber-700 border-amber-200' };
        return { name: 'Suite', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' };
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    };

    if (loading) return <LoadingScreen message="Memuat Status Kamar..." />;

    // Pagination
    const pagedFloors = floors.slice(currentPage * floorsPerPage, (currentPage + 1) * floorsPerPage);

    return (
        <div className="h-screen bg-slate-50 flex flex-col lg:flex-row overflow-hidden animate-page-entrance">
            {/* Main Content Area */}
            <div className="flex-1 p-6 lg:p-8 flex flex-col overflow-hidden">
                <header className="mb-4 shrink-0 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-indigo-800 to-purple-800 rounded-2xl p-6 shadow-lg shadow-indigo-500/20 text-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-white/5 opacity-50 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(255,255,255,0.1) 0%, transparent 20%)', backgroundSize: '20px 20px' }} />
                    <div className="relative z-10 w-full lg:w-auto">
                        <h1 className="text-2xl font-extrabold tracking-tight">Ketersediaan Kamar</h1>
                        <p className="text-indigo-200 mt-1 text-xs">Monitoring hunian hotel secara real-time</p>
                    </div>
                    <div className="relative z-10 flex flex-wrap items-center gap-4 shrink-0 bg-white/10 backdrop-blur border border-white/20 rounded-2xl px-5 py-3 shadow-md">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]"></div>
                            <span className="text-xs font-bold text-white">Terisi</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.8)]"></div>
                            <span className="text-xs font-bold text-white">Akan Datang</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-white border border-white/30 shadow-[0_0_8px_rgba(255,255,255,0.4)]"></div>
                            <span className="text-xs font-bold text-white">Tersedia</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-indigo-500 border border-white/50 shadow-[0_0_8px_rgba(79,70,229,0.8)]"></div>
                            <span className="text-xs font-bold text-white">Terpilih</span>
                        </div>
                    </div>
                </header>

                <div key={currentPage} className="space-y-6 flex-1 animate-slide-in">
                    {pagedFloors.map(floor => (
                        <section key={floor} className="relative">
                            <div className="flex items-center gap-4 mb-3">
                                <div className="bg-slate-900 text-white w-12 h-12 rounded-xl flex flex-col items-center justify-center shadow-lg transform -rotate-3">
                                    <span className="text-[10px] font-black uppercase opacity-60 leading-none">Lt</span>
                                    <span className="text-xl font-black leading-none">{floor}</span>
                                </div>
                                <h2 className="text-lg font-black text-slate-700 uppercase tracking-widest">Lantai {floor}</h2>
                                <div className="h-px bg-gradient-to-r from-slate-200 to-transparent flex-1"></div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-10 gap-3">
                                {Array.from({ length: roomsPerFloor }).map((_, i) => {
                                    const roomNo = getRoomNumber(floor, i);
                                    const activeStatus = occupiedRooms[roomNo];
                                    const upcomingStatus = upcomingRooms[roomNo];
                                    const isOccupied = !!activeStatus;
                                    const isUpcoming = !isOccupied && !!upcomingStatus;
                                    const isSelected = selectedRooms.find(r => r.no === roomNo);
                                    const category = getRoomCategory(i);

                                    return (
                                        <div
                                            key={roomNo}
                                            onClick={() => !isOccupied && toggleRoomSelection(roomNo, category.name)}
                                            className={`relative group cursor-pointer transition-all duration-300 hover:-translate-y-1 ${
                                                isOccupied 
                                                ? 'bg-rose-50 border-rose-200 text-rose-700 shadow-[0_4px_12px_rgba(244,63,94,0.08)]' 
                                                : isSelected
                                                    ? 'bg-indigo-600 border-indigo-700 text-white shadow-lg shadow-indigo-500/40 ring-2 ring-indigo-400 ring-offset-2'
                                                    : isUpcoming
                                                        ? 'bg-sky-50 border-sky-200 text-sky-700 shadow-[0_4px_12px_rgba(14,165,233,0.08)]'
                                                        : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-500/10'
                                            } border rounded-xl p-3 shadow-sm flex flex-col items-center justify-center gap-1 h-24 overflow-hidden`}
                                        >
                                            <div className={`absolute top-2 left-2 px-1.5 py-0.5 rounded text-[8px] font-black uppercase border tracking-tighter ${
                                                isSelected ? 'bg-white/20 border-white/30 text-white' : category.color
                                            }`}>
                                                {category.name.substring(0, 3)}
                                            </div>

                                            <span className={`text-sm font-black tracking-tight mt-2 ${
                                                isOccupied ? 'text-rose-600' : isSelected ? 'text-white' : isUpcoming ? 'text-sky-600' : 'text-slate-600'
                                            }`}>
                                                {roomNo}
                                            </span>
                                            
                                            {isOccupied ? (
                                                <>
                                                    <div className="absolute top-2 right-2">
                                                        <span className="flex h-2 w-2">
                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                                                        </span>
                                                    </div>
                                                    <span className="text-[10px] font-bold truncate w-full text-center px-1 opacity-90 uppercase tracking-tighter text-rose-800">
                                                        {activeStatus.guestName}
                                                    </span>
                                                </>
                                            ) : isSelected ? (
                                                <div className="bg-white/20 rounded-full px-2 py-0.5 mt-1">
                                                    <span className="text-[8px] font-black uppercase tracking-widest text-white">Terpilih</span>
                                                </div>
                                            ) : isUpcoming ? (
                                                <>
                                                    <div className="absolute top-2 right-2">
                                                        <span className="flex h-2 w-2">
                                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-400"></span>
                                                        </span>
                                                    </div>
                                                    <span className="text-[9px] font-bold truncate w-full text-center px-1 text-sky-600">
                                                        {formatDate(upcomingStatus.arrival)}
                                                    </span>
                                                </>
                                            ) : (
                                                <span className="text-[10px] uppercase font-bold tracking-widest opacity-20">Vakant</span>
                                            )}

                                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-slate-900/95 backdrop-blur-md transition-all duration-300 rounded-xl flex flex-col items-center justify-center p-3 text-[10px] text-white z-10 pointer-events-none transform scale-95 group-hover:scale-100">
                                                <p className="text-[8px] font-bold text-indigo-400 uppercase tracking-widest mb-1">{category.name}</p>
                                                {isOccupied ? (
                                                    <>
                                                        <p className="font-bold border-b border-white/20 pb-1 mb-1.5 w-full text-center truncate">{activeStatus.guestName}</p>
                                                        <div className="space-y-0.5 opacity-80 text-center">
                                                            <p className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-rose-400 inline-block"></span> Terisi</p>
                                                            <p>In: {activeStatus.arrival}</p>
                                                            <p>Out: {activeStatus.departure}</p>
                                                        </div>
                                                    </>
                                                ) : isUpcoming ? (
                                                    <>
                                                        <p className="font-bold border-b border-white/20 pb-1 mb-1.5 w-full text-center truncate">{upcomingStatus.guestName}</p>
                                                        <div className="space-y-0.5 opacity-80 text-center">
                                                            <p className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-sky-400 inline-block"></span> Akan Datang</p>
                                                            <p>In: {formatDate(upcomingStatus.arrival)}</p>
                                                            <p>Out: {formatDate(upcomingStatus.departure)}</p>
                                                        </div>
                                                    </>
                                                ) : isSelected ? (
                                                    <p className="font-bold tracking-wide">Batal Pilih</p>
                                                ) : (
                                                    <p className="font-bold tracking-wide">Pilih Kamar</p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    ))}
                </div>

                {/* Pagination Controls */}
                <div className="pt-4 pb-1 shrink-0 border-t border-slate-200/60 bg-slate-50 -mx-6 lg:-mx-8 px-6 lg:px-8">
                <div className="flex items-center justify-center gap-3 pb-3">
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                        disabled={currentPage === 0}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 font-bold text-sm shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        Sebelumnya
                    </button>

                    <div className="flex items-center gap-2">
                        {Array.from({ length: totalPages }).map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentPage(idx)}
                                className={`w-10 h-10 rounded-xl font-black text-sm transition-all duration-200 ${
                                    currentPage === idx 
                                        ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20 scale-110' 
                                        : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300'
                                }`}
                            >
                                {idx + 1}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                        disabled={currentPage === totalPages - 1}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 font-bold text-sm shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white"
                    >
                        Selanjutnya
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                </div>

                {/* Page Info */}
                <div className="text-center pb-4">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        Halaman {currentPage + 1} dari {totalPages} — Lantai {pagedFloors.join(' & ')}
                    </p>
                </div>
                </div>
            </div>

            {/* Right Sidebar - Selection Summary */}
            <div className="w-full lg:w-80 bg-white border-l border-slate-200 flex flex-col h-full bg-opacity-80 backdrop-blur-xl shrink-0">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                        <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                        Kamar Terpilih
                    </h2>
                </div>

                <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-3">
                    {selectedRooms.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
                             <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4 border-2 border-dashed border-slate-300">
                                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                             </div>
                             <p className="text-sm font-bold text-slate-500 uppercase tracking-widest leading-relaxed">Belum ada kamar terpilih</p>
                             <p className="text-xs text-slate-400 mt-2">Pilih kamar pada grid untuk memulai registrasi</p>
                        </div>
                    ) : (
                        selectedRooms.map(room => (
                            <div key={room.no} className="group relative bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:shadow-md hover:border-indigo-200 transition-all animate-slide-in">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shadow-sm">
                                        <span className="text-sm font-black text-indigo-600">{room.no}</span>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none">{room.type}</p>
                                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">{formatIDR(roomPrices[room.type] || 0)}/malam</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                                            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-tighter">Ready to check-in</span>
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => toggleRoomSelection(room.no)}
                                    className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {selectedRooms.length > 0 && (
                    <div className="p-6 bg-slate-50/80 border-t border-slate-100 backdrop-blur-md">
                        <div className="flex items-center justify-between mb-6">
                            <span className="text-xs font-black uppercase tracking-[0.1em] text-slate-400">Total Selection</span>
                            <div className="flex flex-col items-end gap-1">
                                <div className="flex items-baseline gap-1">
                                    <span key={`count-${selectedRooms.length}`} className="text-3xl font-black text-indigo-600 leading-none animate-price-pop text-right">{selectedRooms.length}</span>
                                    <span className="text-xs font-bold text-slate-400 uppercase">Unit</span>
                                </div>
                                <span key={`price-${totalPrice}`} className="text-xs font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded-md animate-price-pop inline-block">
                                    {formatIDR(totalPrice)} / malam
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={handleProceed}
                            className="w-full bg-slate-900 hover:bg-indigo-600 active:scale-[0.98] transition-all text-white font-black py-4 px-6 rounded-2xl flex items-center justify-between group shadow-xl shadow-slate-900/10"
                        >
                            <span className="uppercase tracking-widest text-xs">Confirm & Register</span>
                            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                        </button>
                    </div>
                )}
            </div>

            {/* Background Decorations */}
            <div className="fixed top-1/4 -right-20 w-80 h-80 bg-indigo-200/20 rounded-full blur-[100px] -z-10 animate-pulse"></div>
            <div className="fixed bottom-1/4 -left-20 w-80 h-80 bg-purple-200/20 rounded-full blur-[100px] -z-10 animate-pulse" style={{ animationDelay: '1s' }}></div>

            <style>{`
                @keyframes slide-in {
                    from { opacity: 0; transform: translateX(20px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                .animate-slide-in {
                    animation: slide-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                }
                @keyframes price-pop {
                    0% { transform: scale(1); }
                    30% { transform: scale(1.15) translateY(-2px); color: #4f46e5; }
                    100% { transform: scale(1); }
                }
                .animate-price-pop {
                    animation: price-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
            `}</style>
        </div>
    );
}
