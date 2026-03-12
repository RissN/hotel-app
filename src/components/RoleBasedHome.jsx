import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RoleBasedHome = () => {
    const { role, loading } = useAuth();
    
    if (loading) return null; // Let ProtectedRoute handle the loading spinner usually, or show brief skeleton here

    if (role === 'Superadmin' || role === 'Admin') {
        return <Navigate to="/users" replace />;
    } else if (role === 'Resepsionis') {
        return <Navigate to="/registration" replace />;
    } else {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="max-w-md w-full p-8 bg-white rounded-2xl shadow-xl text-center border border-red-100">
                    <h2 className="text-2xl font-bold text-red-600 mb-4">Akses Gagal</h2>
                    <p className="text-slate-600 mb-6">
                        Akun Anda tidak memiliki Role yang sah (misal belum ditambahkan di tabel <code className="bg-slate-100 px-1 rounded">user_roles</code>) atau terjadi error database.
                    </p>
                    <p className="text-sm text-slate-500">
                        Pastikan UID akun ini telah didaftarkan sebagai Superadmin melalui database Supabase Anda. Hubungi administrator sistem.
                    </p>
                </div>
            </div>
        );
    }
};

export default RoleBasedHome;
