import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import CustomAlert from '../components/CustomAlert';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Form state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('Resepsionis');
    const [isCreating, setIsCreating] = useState(false);

    // Custom alert state
    const [alertConfig, setAlertConfig] = useState({ 
        isOpen: false, 
        title: '', 
        message: '', 
        type: 'info',
        onConfirm: null 
    });

    // Edit state
    const [editingUserId, setEditingUserId] = useState(null);
    const [editRoleValue, setEditRoleValue] = useState('');
    const [editEmailValue, setEditEmailValue] = useState('');
    const [editPasswordValue, setEditPasswordValue] = useState('');
    const [isActionLoading, setIsActionLoading] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        
        try {
            // Coba fetch menggunakan RPC baru yang meng-join auth.users untuk mendapatkan email
            const { data: detailedData, error: rpcError } = await supabase.rpc('get_users_detailed_by_admin');
            
            if (!rpcError && detailedData) {
                console.log("Fetched detailed users:", detailedData);
                setUsers(detailedData);
            } else {
                // Jika error (misal fungsi RPC belum dibuat di Supabase), fallback ke query user_roles biasa
                console.warn("Mencoba fallback karena get_users_detailed_by_admin mungkin belum ada:", rpcError?.message);
                const { data: fallbackData, error: fallbackError } = await supabase
                    .from('user_roles')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (fallbackError) throw fallbackError;
                console.log("Fetched user roles (fallback):", fallbackData);
                setUsers(fallbackData || []);
            }
        } catch (err) {
            console.error("Fetch users error:", err);
            setError("Gagal memuat daftar pengguna. Pastikan RLS Supabase dikonfigurasi.");
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
            
            setAlertConfig({
                isOpen: true,
                title: 'Berhasil!',
                message: 'Pengguna baru berhasil ditambahkan ke sistem.',
                type: 'success',
            });

        } catch (err) {
            console.error("User creation error:", err);
            setError(err.message || 'Terjadi kesalahan saat membuat pengguna.');
        } finally {
            setIsCreating(false);
        }
    };

    // --- DELETE LOGIC ---
    const handleDeleteClick = (user) => {
        setAlertConfig({
            isOpen: true,
            title: 'Konfirmasi Hapus',
            message: `Apakah Anda yakin ingin menghapus pengguna dengan ID: \n${user.user_id}?\n\nTindakan ini permanen dan tidak dapat dibatalkan.`,
            type: 'confirm',
            onConfirm: () => confirmDeleteUser(user.user_id)
        });
    };

    const confirmDeleteUser = async (userId) => {
        setAlertConfig(prev => ({ ...prev, isOpen: false }));
        setIsActionLoading(true);
        try {
            const { error: rpcError } = await supabase.rpc('delete_user_by_admin', {
                target_user_id: userId
            });

            if (rpcError) throw rpcError;

            fetchUsers();
            
            // Show short success notification
            setTimeout(() => {
                setAlertConfig({
                    isOpen: true,
                    title: 'Berhasil Dihapus',
                    message: 'Pengguna telah dihapus dari sistem.',
                    type: 'success',
                    onConfirm: null
                });
            }, 300);

        } catch (err) {
            console.error("Delete user error:", err);
            setTimeout(() => {
                setAlertConfig({
                    isOpen: true,
                    title: 'Akses Ditolak',
                    message: err.message || 'Gagal menghapus pengguna. Pastikan Anda memiliki izin Superadmin.',
                    type: 'error',
                    onConfirm: null
                });
            }, 300);
        } finally {
            setIsActionLoading(false);
        }
    };

    // --- EDIT LOGIC ---
    const handleEditClick = (user) => {
        setEditingUserId(user.user_id);
        setEditRoleValue(user.role);
        setEditEmailValue(user.email || ''); // Assuming user object has email joined, if not it will be blank
        setEditPasswordValue(''); // Keep blank for security, only update if typed
    };

    const handleCancelEdit = () => {
        setEditingUserId(null);
        setEditRoleValue('');
        setEditEmailValue('');
        setEditPasswordValue('');
    };

    const handleSaveEdit = async (userId) => {
        setIsActionLoading(true);
        try {
            // Note: A new RPC `update_user_full_by_admin` needs to be added in Supabase to update email/password:
            /*
            CREATE OR REPLACE FUNCTION update_user_full_by_admin(target_user_id uuid, new_role text, new_email text, new_password text)
            RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
            BEGIN
              IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('Admin', 'Superadmin')) THEN RAISE EXCEPTION 'Unauthorized'; END IF;
              UPDATE user_roles SET role = new_role WHERE user_id = target_user_id;
              IF new_email IS NOT NULL AND new_email != '' THEN
                 UPDATE auth.users SET email = new_email WHERE id = target_user_id;
                 UPDATE auth.identities SET identity_data = jsonb_set(identity_data, '{email}', to_jsonb(new_email)) WHERE user_id = target_user_id;
              END IF;
              IF new_password IS NOT NULL AND new_password != '' THEN
                 UPDATE auth.users SET encrypted_password = crypt(new_password, gen_salt('bf')) WHERE id = target_user_id;
              END IF;
            END; $$;
            */
            const { error: rpcError } = await supabase.rpc('update_user_full_by_admin', {
                target_user_id: userId,
                new_role: editRoleValue,
                new_email: editEmailValue || null,
                new_password: editPasswordValue || null
            });

            if (rpcError) throw rpcError;

            fetchUsers();
            setEditingUserId(null);
            
            setAlertConfig({
                isOpen: true,
                title: 'Perubahan Disimpan',
                message: 'Role pengguna berhasil diperbarui.',
                type: 'success',
                onConfirm: null
            });
        } catch (err) {
            console.error("Edit user error:", err);
            setAlertConfig({
                isOpen: true,
                title: 'Gagal Memperbarui',
                message: err.message || 'Terjadi kesalahan saat mengubah role pengguna.',
                type: 'error',
                onConfirm: null
            });
        } finally {
            setIsActionLoading(false);
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
                                    <th className="px-6 py-4 text-left font-medium">Data Pengguna</th>
                                    <th className="px-6 py-4 text-left font-medium">Role</th>
                                    <th className="px-6 py-4 text-left font-medium">Dibuat Pada</th>
                                    <th className="px-6 py-4 text-right font-medium">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {users.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-8 text-center text-slate-500">
                                            Tidak ada data untuk ditampilkan. Pastikan RLS Supabase dikonfigurasi.
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((u) => (
                                        <tr key={u.user_id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 text-sm font-mono text-slate-600 truncate max-w-[200px]" title={u.user_id}>
                                                {editingUserId === u.user_id ? (
                                                    <div className="space-y-2">
                                                        <input 
                                                            type="email" 
                                                            placeholder="Email" 
                                                            value={editEmailValue} 
                                                            onChange={(e) => setEditEmailValue(e.target.value)} 
                                                            className="w-full px-3 py-1 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-sans" 
                                                        />
                                                        <input 
                                                            type="password" 
                                                            placeholder="Password Baru (Kosongkan jika tidak diubah)" 
                                                            value={editPasswordValue} 
                                                            onChange={(e) => setEditPasswordValue(e.target.value)} 
                                                            className="w-full px-3 py-1 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-sans" 
                                                        />
                                                    </div>
                                                ) : (
                                                    <span>{u.email || u.user_id}</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {editingUserId === u.user_id ? (
                                                    <select
                                                        value={editRoleValue}
                                                        onChange={(e) => setEditRoleValue(e.target.value)}
                                                        className="px-3 py-1 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm w-32"
                                                    >
                                                        <option value="Resepsionis">Resepsionis</option>
                                                        <option value="Admin">Admin</option>
                                                    </select>
                                                ) : (
                                                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                                                        u.role === 'Superadmin' ? 'bg-purple-100 text-purple-700' :
                                                        u.role === 'Admin' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-green-100 text-green-700'
                                                    }`}>
                                                        {u.role}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-500">
                                                {new Date(u.created_at).toLocaleDateString('id-ID')}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {editingUserId === u.user_id ? (
                                                        <>
                                                            <button
                                                                onClick={handleCancelEdit}
                                                                className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-lg transition-colors"
                                                                title="Batal"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                </svg>
                                                            </button>
                                                            <button
                                                                onClick={() => handleSaveEdit(u.user_id)}
                                                                disabled={isActionLoading}
                                                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50"
                                                                title="Simpan"
                                                            >
                                                                {isActionLoading ? (
                                                                    <svg className="animate-spin w-4 h-4 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                                                ) : (
                                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                    </svg>
                                                                )}
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button
                                                                onClick={() => handleEditClick(u)}
                                                                disabled={isActionLoading || u.role === 'Superadmin'}
                                                                className={`p-2 rounded-lg transition-colors flex items-center justify-center ${u.role === 'Superadmin' ? 'text-slate-300 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-50'}`}
                                                                title={u.role === 'Superadmin' ? 'Superadmin tidak dapat diedit' : 'Edit Role'}
                                                            >
                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                </svg>
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteClick(u)}
                                                                disabled={isActionLoading || u.role === 'Superadmin'}
                                                                className={`p-2 rounded-lg transition-colors flex items-center justify-center ${u.role === 'Superadmin' ? 'text-slate-300 cursor-not-allowed' : 'text-red-600 hover:bg-red-50'}`}
                                                                title={u.role === 'Superadmin' ? 'Superadmin tidak dapat dihapus' : 'Hapus Pengguna'}
                                                            >
                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Custom Alert Modal */}
            <CustomAlert
                isOpen={alertConfig.isOpen}
                onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
                onConfirm={alertConfig.onConfirm}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
            />
        </div>
    );
};

export default UserManagement;
