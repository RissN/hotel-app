import React from 'react';

const OccupancyGauge = ({ totalRooms, occupiedRooms, roomTypeCounts = { Standard: 0, Deluxe: 0, Suite: 0 } }) => {
    const percentage = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
    const radius = 36;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    const breakdown = [
        { label: 'Standard', count: roomTypeCounts.Standard, total: 70, color: 'bg-indigo-500' },
        { label: 'Deluxe', count: roomTypeCounts.Deluxe, total: 20, color: 'bg-rose-500' },
        { label: 'Suite', count: roomTypeCounts.Suite, total: 10, color: 'bg-amber-500' }
    ];

    return (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col items-center justify-center relative overflow-hidden h-full group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/20 to-transparent pointer-events-none" />
            
            <h3 className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mb-4 w-full text-center">TINGKAT HUNIAN</h3>
            
            <div className="relative flex items-center justify-center w-32 h-32">
                <svg className="w-full h-full transform -rotate-90">
                    {/* Background Circle */}
                    <circle
                        cx="64"
                        cy="64"
                        r={radius}
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        className="text-slate-100"
                    />
                    {/* Progress Circle */}
                    <circle
                        cx="64"
                        cy="64"
                        r={radius}
                        stroke="url(#gaugeGrad)"
                        strokeWidth="8"
                        strokeDasharray={circumference}
                        style={{ 
                            strokeDashoffset: offset,
                            transition: 'stroke-dashoffset 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
                        }}
                        strokeLinecap="round"
                        fill="transparent"
                    />
                    <defs>
                        <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#4f46e5" />
                            <stop offset="100%" stopColor="#8b5cf6" />
                        </linearGradient>
                    </defs>
                </svg>
                
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-black text-slate-800 leading-none">{percentage}%</span>
                    <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">Terisi</span>
                </div>
            </div>
            
            <div className="mt-4 flex items-center gap-4 w-full pb-4 border-b border-slate-50">
                <div className="flex-1 text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">Total</p>
                    <p className="text-sm font-black text-slate-800">{totalRooms}</p>
                </div>
                <div className="w-px h-6 bg-slate-100" />
                <div className="flex-1 text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">Sisa</p>
                    <p className="text-sm font-black text-emerald-600">{totalRooms - occupiedRooms}</p>
                </div>
            </div>

            {/* Room Type Breakdown */}
            <div className="w-full mt-4 space-y-3">
                {breakdown.map((item, i) => (
                    <div key={i}>
                        <div className="flex justify-between text-[10px] font-bold mb-1">
                            <span className="uppercase tracking-widest text-slate-400">{item.label}</span>
                            <span className="tabular-nums text-slate-600">{item.count}/{item.total}</span>
                        </div>
                        <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                                className={`${item.color} h-full rounded-full transition-all duration-1000 ease-out`} 
                                style={{ width: `${(item.count / item.total) * 100}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default OccupancyGauge;
