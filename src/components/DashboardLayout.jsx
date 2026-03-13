import { useState } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CustomAlert from './CustomAlert';

const DashboardLayout = () => {
    const { user, role, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const handleLogout = async () => {
        setShowLogoutConfirm(false);
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const navItems = [
        { 
            name: 'Dashboard', 
            path: '/dashboard', 
            roles: ['Superadmin', 'Admin'],
            icon: (
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            )
        },
        { 
            name: 'Reservasi Baru', 
            path: '/registration', 
            roles: ['Superadmin', 'Admin', 'Resepsionis'],
            icon: (
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            )
        },
        { 
            name: 'User Management', 
            path: '/users', 
            roles: ['Superadmin'],
            icon: (
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            )
        },
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row print:bg-white">
            {/* Sidebar */}
            <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex-shrink-0 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.1)] z-20 print:hidden transition-all duration-300">
                <div className="p-6 border-b border-slate-800/50 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                        </div>
                        <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                            PPKD Hotel
                        </h2>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
                        <p className="text-slate-300 text-sm font-medium truncate">{user?.email}</p>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                                {role || 'Unknown'}
                            </span>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto custom-scrollbar">
                    {navItems.map((item) => {
                        if (!item.roles.includes(role)) return null;
                        
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center px-4 py-3 rounded-xl transition-all duration-300 group ${
                                    isActive 
                                    ? 'bg-indigo-500/10 text-indigo-400 font-semibold' 
                                    : 'hover:bg-slate-800/50 hover:text-white text-slate-400'
                                }`}
                            >
                                <span className={`${isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'} transition-colors duration-300`}>
                                    {item.icon}
                                </span>
                                {item.name}
                                {isActive && (
                                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]"></span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-800 mt-auto">
                    <button
                        onClick={() => setShowLogoutConfirm(true)}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl text-slate-300 hover:bg-red-500/10 hover:text-red-400 transition-colors border border-transparent hover:border-red-500/20"
                    >
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-x-hidden min-h-screen relative">
                <Outlet />
            </main>

            {/* Logout Confirmation Modal */}
            <CustomAlert
                isOpen={showLogoutConfirm}
                onClose={() => setShowLogoutConfirm(false)}
                onConfirm={handleLogout}
                type="confirm"
                title="Konfirmasi Logout"
                message="Apakah Anda yakin ingin keluar dari sistem?"
                confirmText="Ya, Logout"
                cancelText="Batal"
            />
        </div>
    );
};

export default DashboardLayout;
