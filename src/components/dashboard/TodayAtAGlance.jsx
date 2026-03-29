import React from 'react';

const TodayAtAGlance = ({ arrivals = [], departures = [] }) => {
    return (
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <h3 className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mb-4">TODAY AT A GLANCE</h3>
            
            <div className="grid grid-cols-2 gap-3">
                {/* Arrivals Small Tile */}
                <div className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-sky-50/50 border border-sky-100/50">
                    <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center shadow-lg shadow-sky-500/20">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                    </div>
                    <div className="text-center">
                        <p className="text-[9px] font-bold text-sky-600 uppercase tracking-[0.1em] leading-none mb-1">Incoming</p>
                        <div className="flex items-baseline justify-center gap-1">
                            <span className="text-xl font-black text-slate-800">{arrivals.length}</span>
                        </div>
                    </div>
                </div>

                {/* Departures Small Tile */}
                <div className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-amber-50/50 border border-amber-100/50">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/20">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                    </div>
                    <div className="text-center">
                        <p className="text-[9px] font-bold text-amber-600 uppercase tracking-[0.1em] leading-none mb-1">Outgoing</p>
                        <div className="flex items-baseline justify-center gap-1">
                            <span className="text-xl font-black text-slate-800">{departures.length}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-50">
                <p className="text-[9px] font-bold text-slate-400 text-center uppercase tracking-widest leading-tight">
                    TOTAL PERGERAKAN: <span className="text-slate-600 font-black">{arrivals.length + departures.length}</span>
                </p>
            </div>
        </div>
    );
};

export default TodayAtAGlance;
