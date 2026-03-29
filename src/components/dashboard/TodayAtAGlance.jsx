import React from 'react';

const TodayAtAGlance = ({ arrivals = [], departures = [] }) => {
    return (
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-slate-50/50 to-transparent pointer-events-none" />
            
            <h3 className="text-slate-400 font-bold text-[11px] uppercase tracking-[0.3em] mb-10 w-full text-center relative z-10">Today at a Glance</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 flex-1 relative z-10">
                {/* Arrivals Small Tile */}
                <div className="flex flex-col items-center justify-center gap-6 p-8 rounded-[3rem] bg-sky-50/40 border border-sky-100/50 group/tile hover:bg-sky-50/80 transition-all duration-500 flex-1 shadow-sm hover:shadow-md">
                    <div className="w-20 h-20 rounded-[2rem] bg-sky-500 text-white flex items-center justify-center shadow-xl shadow-sky-500/30 transform group-hover/tile:scale-110 group-hover/tile:rotate-3 transition-transform duration-500">
                        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                    </div>
                    <div className="text-center">
                        <p className="text-[10px] font-black text-sky-600 uppercase tracking-[0.3em] mb-3">Incoming</p>
                        <div className="flex items-baseline justify-center gap-2">
                            <span className="text-6xl font-black text-slate-800 tracking-tighter tabular-nums">{arrivals.length}</span>
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Tamu</span>
                        </div>
                    </div>
                </div>

                {/* Departures Small Tile */}
                <div className="flex flex-col items-center justify-center gap-6 p-8 rounded-[3rem] bg-amber-50/40 border border-amber-100/50 group/tile hover:bg-amber-50/80 transition-all duration-500 flex-1 shadow-sm hover:shadow-md">
                    <div className="w-20 h-20 rounded-[2rem] bg-amber-500 text-white flex items-center justify-center shadow-xl shadow-amber-500/30 transform group-hover/tile:scale-110 group-hover/tile:-rotate-3 transition-transform duration-500">
                        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                    </div>
                    <div className="text-center">
                        <p className="text-[10px] font-black text-amber-600 uppercase tracking-[0.3em] mb-3">Outgoing</p>
                        <div className="flex items-baseline justify-center gap-2">
                            <span className="text-6xl font-black text-slate-800 tracking-tighter tabular-nums">{departures.length}</span>
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Tamu</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-10 pt-8 border-t border-slate-50 relative z-10">
                <div className="flex items-center justify-center gap-4">
                    <div className="h-1 w-10 rounded-full bg-slate-100" />
                    <p className="text-[11px] font-black text-slate-400 text-center uppercase tracking-[0.4em] leading-tight flex items-center gap-2">
                        Total Pergerakan: <span className="text-indigo-600 font-black text-lg">{arrivals.length + departures.length}</span>
                    </p>
                    <div className="h-1 w-10 rounded-full bg-slate-100" />
                </div>
            </div>
        </div>
    );
};

export default TodayAtAGlance;
