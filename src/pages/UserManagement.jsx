import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Form state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('Resepsionis');
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        // We typically cannot freely query `auth.users` directly from the client side easily without a secure backend function 
        // due to Supabase security. 
        // However, we CAN query `public.user_roles` if the RLS allows Admin/Superadmin to read it.
        // For a full implementation, Supabase Edge Functions or a custom Postgres function is recommended to list users.
        // Assuming we join `user_roles` with a view or simply show standard info:
        
        try {
            const { data, error } = await supabase
                .from('user_roles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            console.log("Fetched users:", data);
            setUsers(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setIsCreating(true);
        setError(null);

        try {
            // Call the PostgreSQL function we created to securely create user
            const { data, error: rpcError } = await supabase.rpc('create_user_by_admin', {
                email: email,
                password: password,
                assign_role: role
            });

            if (rpcError) {
                throw rpcError;
            }

            // Success, clear form and refresh list
            setEmail('');
            setPassword('');
            setRole('Resepsionis');
            fetchUsers();
            
            alert('Pengguna baru berhasil ditambahkan!');

        } catch (err) {
            console.error("User creation error:", err);
            setError(err.message || 'Terjadi kesalahan saat membuat pengguna.');
        } finally {
            setIsCreating(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Memuat data pengguna...</div>;

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <h1 className="text-3xl font-bold text-slate-900 mb-8">Manajemen Pengguna</h1>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-8 border border-red-100">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Add User */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h2 className="text-xl font-semibold mb-6">Tambah Pengguna Baru</h2>
                    <form onSubmit={handleCreateUser} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Role</label>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="Resepsionis">Resepsionis</option>
                                <option value="Admin">Admin</option>
                                <option value="Superadmin">Superadmin</option>
                            </select>
                        </div>
                        <button
                            type="submit"
                            disabled={isCreating}
                            className="w-full bg-slate-900 text-white py-2 rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50"
                        >
                            {isCreating ? 'Menambahkan...' : 'Tambah Pengguna'}
                        </button>
                    </form>
                </div>

                {/* List Users (Roles) */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                        <h2 className="text-xl font-semibold">Daftar Role Pengguna</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
                                <tr>
                                    <th className="px-6 py-4 text-left font-medium">User ID</th>
                                    <th className="px-6 py-4 text-left font-medium">Role</th>
                                    <th className="px-6 py-4 text-left font-medium">Dibuat Pada</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {users.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" className="px-6 py-8 text-center text-slate-500">
                                            Tidak ada data untuk ditampilkan. Pastikan RLS Supabase dikonfigurasi.
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((u) => (
                                        <tr key={u.user_id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 text-sm font-mono text-slate-600 truncate max-w-[200px]" title={u.user_id}>
                                                {u.user_id}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                                                    u.role === 'Superadmin' ? 'bg-purple-100 text-purple-700' :
                                                    u.role === 'Admin' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-green-100 text-green-700'
                                                }`}>
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-500">
                                                {new Date(u.created_at).toLocaleDateString('id-ID')}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserManagement;
