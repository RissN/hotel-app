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
        { name: 'Reservasi Baru', path: '/registration', roles: ['Superadmin', 'Admin', 'Resepsionis'] },
        // Payment, Invoice, etc. don't strictly need sidebar links as they are flow-based
        { name: 'User Management', path: '/users', roles: ['Superadmin'] },
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
            {/* Sidebar */}
            <aside className="w-full md:w-64 bg-slate-900 text-white flex-shrink-0 flex flex-col shadow-xl z-20">
                <div className="p-6 border-b border-slate-800">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        Hotel Admin
                    </h2>
                    <p className="text-slate-400 text-sm mt-1 truncate">{user?.email}</p>
                    <span className="inline-block px-3 py-1 mt-3 bg-white/10 rounded-full text-xs font-medium tracking-wide border border-white/20">
                        {role || 'Unknown Role'}
                    </span>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {navItems.map((item) => {
                        if (!item.roles.includes(role)) return null;
                        
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`block px-4 py-3 rounded-xl transition-all duration-200 ${
                                    isActive 
                                    ? 'bg-blue-600 shadow-md text-white' 
                                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                }`}
                            >
                                {item.name}
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
