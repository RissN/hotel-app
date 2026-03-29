import React from 'react';

const LoadingScreen = ({ message = 'Memuat Data...', className = 'min-h-[75vh]' }) => {
    return (
        <div className={`flex flex-col items-center justify-center h-full w-full text-slate-500 gap-6 ${className} animate-page-entrance`}>
            <div className="relative w-20 h-20">
                {/* Outer Ring */}
                <div className="absolute inset-0 rounded-full border-[6px] border-slate-100 shadow-inner"></div>
                
                {/* Spinning Progress Ring */}
                <div 
                    className="absolute inset-0 rounded-full border-[6px] border-transparent border-t-indigo-600 animate-spin"
                    style={{ animationDuration: '0.8s' }}
                ></div>
                
                {/* Inner Pulse Ring */}
                <div className="absolute inset-4 rounded-full border-2 border-indigo-100 animate-pulse opacity-50"></div>
                
                {/* Center Glow */}
                <div className="absolute inset-0 rounded-full bg-indigo-500/5 blur-xl animate-pulse"></div>
            </div>
            
            <div className="flex flex-col items-center gap-2">
                <p className="text-sm font-black text-slate-800 uppercase tracking-[0.3em] pl-1 animate-pulse">
                    {message}
                </p>
                <div className="flex gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0s' }}></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
            </div>
        </div>
    );
};

export default LoadingScreen;
