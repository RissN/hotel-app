import React from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Area, AreaChart
} from 'recharts';

const RevenueChart = ({ data, range, chartSubtitle, ranges, setRange, formatIDR }) => {
    return (
        <div className="bg-white rounded-3xl p-5 md:p-6 shadow-sm border border-slate-100 flex flex-col h-full group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
                <div>
                    <h3 className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mb-0.5">PERFORMA PENDAPATAN</h3>
                    <h2 className="text-lg font-black text-slate-800 tracking-tight">Grafik Revenue</h2>
                </div>
                <div className="flex flex-wrap items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100">
                    {ranges.map((r) => (
                        <button
                            key={r.key}
                            onClick={() => setRange(r.key)}
                            className={`px-2.5 py-1 rounded-lg text-[9px] font-bold transition-all duration-200 ${
                                range === r.key
                                    ? 'bg-white text-indigo-600 shadow-sm border-slate-100 ring-1 ring-slate-100'
                                    : 'text-slate-500 hover:text-indigo-600 hover:bg-white/50'
                            }`}
                        >
                            {r.label}
                        </button>
                    ))}
                </div>
            </div>
            
            <div className="flex-1 w-full min-h-[200px] mt-4">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis
                            dataKey="label"
                            tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }}
                            tickLine={false}
                            axisLine={{ stroke: '#f1f5f9' }}
                            interval={range === '1bulan' ? 6 : range === '1hari' ? 3 : 0}
                        />
                        <YAxis
                            tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(v) => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}jt` : v >= 1_000 ? `${(v / 1_000).toFixed(0)}rb` : v}
                        />
                        <Tooltip
                            contentStyle={{
                                background: '#1e293b', border: 'none', borderRadius: '12px',
                                boxShadow: '0 10px 40px rgba(0,0,0,0.3)', padding: '10px 14px',
                            }}
                            labelStyle={{ color: '#94a3b8', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}
                            itemStyle={{ color: '#fff', fontWeight: 900, fontSize: 12 }}
                            formatter={(value) => [formatIDR(value), 'Income']}
                        />
                        <Area
                            type="monotone"
                            dataKey="total"
                            stroke="#6366f1"
                            strokeWidth={3}
                            fill="url(#revenueGrad)"
                            dot={range !== '1bulan' && range !== '1hari' ? { r: 4, fill: '#fff', stroke: '#6366f1', strokeWidth: 2 } : false}
                            activeDot={{ r: 6, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
                            animationDuration={1000}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default RevenueChart;
