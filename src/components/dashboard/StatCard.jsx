import React from 'react';

const StatCard = ({ title, value, subValue, icon, color = 'indigo', trend, delay = 0 }) => {
    const isPositive = trend > 0;
    const isNegative = trend < 0;

    const colorConfig = {
        indigo: 'text-indigo-600 bg-indigo-50 border-indigo-100 shadow-indigo-500/10',
        rose: 'text-rose-600 bg-rose-50 border-rose-100 shadow-rose-500/10',
        emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100 shadow-emerald-500/10',
        sky: 'text-sky-600 bg-sky-50 border-sky-100 shadow-sky-500/10',
        amber: 'text-amber-600 bg-amber-50 border-amber-100 shadow-amber-500/10',
        red: 'text-red-600 bg-red-50 border-red-100 shadow-red-500/10',
    };

    const iconBg = {
        indigo: 'bg-indigo-600',
        rose: 'bg-rose-500',
        emerald: 'bg-emerald-600',
        sky: 'bg-sky-500',
        amber: 'bg-amber-500',
        red: 'bg-red-500',
    };

    return (
        <div 
            className="group relative overflow-hidden bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            style={{ animation: `statCardIn 0.5s ease-out ${delay}s both` }}
        >
            <div className="absolute inset-x-0 bottom-0 h-1 bg-current opacity-10 group-hover:opacity-20 transition-opacity" />
            
            <div className="relative z-10 flex items-start justify-between">
                <div className="space-y-3">
                    <h3 className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em]">{title}</h3>
                    <div className="flex items-baseline gap-2">
                        <p className="text-3xl font-black text-slate-800 tracking-tight tabular-nums">
                            {value}
                        </p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${colorConfig[color]} tracking-wide whitespace-nowrap`}>
                            {subValue}
                        </span>
                    </div>

                    {/* Trend Indicator */}
                    {trend !== undefined && (
                        <div className="flex items-center gap-1.5 mt-1">
                            <div className={`flex items-center justify-center w-5 h-5 rounded-full ${
                                isPositive ? 'bg-emerald-50 text-emerald-600' : 
                                isNegative ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400'
                            }`}>
                                {isPositive ? (
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
                                ) : isNegative ? (
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                                ) : (
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" /></svg>
                                )}
                            </div>
                            <span className={`text-[10px] font-bold ${
                                isPositive ? 'text-emerald-600' : isNegative ? 'text-rose-600' : 'text-slate-400'
                            }`}>
                                {isPositive ? '+' : ''}{trend}% dibanding kemarin
                            </span>
                        </div>
                    )}
                </div>
                
                <div className={`${iconBg[color]} p-3 rounded-2xl text-white shadow-lg transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shrink-0`}>
                    {icon}
                </div>
            </div>
        </div>
    );
};

export default StatCard;
