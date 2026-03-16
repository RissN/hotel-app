import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
    const [usernameField, setUsernameField] = useState('');
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
    const [editUsernameValue, setEditUsernameValue] = useState('');
    const [isActionLoading, setIsActionLoading] = useState(false);

    // Search & Filter state
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('Semua');

    // User Activity state
    const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
    const [activityTargetUser, setActivityTargetUser] = useState(null);
    const [userLogins, setUserLogins] = useState([]);
    const [userTransactions, setUserTransactions] = useState([]);
    const [isActivityLoading, setIsActivityLoading] = useState(false);

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

    // --- MODAL LOGIC (ADD & EDIT) ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add');

    const openAddModal = () => {
        setModalMode('add');
        setEmail('');
        setPassword('');
        setRole('Resepsionis');
        setUsernameField('');
        setError(null);
        setIsModalOpen(true);
    };

    const openEditModal = (user) => {
        setModalMode('edit');
        setEditingUserId(user.user_id);
        setEditEmailValue(user.email || '');
        setEditPasswordValue('');
        setEditRoleValue(user.role);
        setEditUsernameValue(user.username || '');
        setError(null);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingUserId(null);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (modalMode === 'add') {
            setIsCreating(true);
            try {
                const { error: rpcError } = await supabase.rpc('create_user_by_admin', {
                    email: email,
                    password: password,
                    assign_role: role,
                    assign_username: usernameField
                });
                if (rpcError) throw rpcError;
                
                fetchUsers();
                closeModal();
                setAlertConfig({ isOpen: true, title: 'Berhasil!', message: 'Pengguna baru berhasil ditambahkan.', type: 'success' });
            } catch (err) {
                console.error("User creation error:", err);
                setError(err.message || 'Terjadi kesalahan saat membuat pengguna.');
            } finally {
                setIsCreating(false);
            }
        } else {
            setIsActionLoading(true);
            try {
                const { error: rpcError } = await supabase.rpc('update_user_full_by_admin', {
                    target_user_id: editingUserId,
                    new_role: editRoleValue,
                    new_email: editEmailValue || null,
                    new_password: editPasswordValue || null,
                    new_username: editUsernameValue
                });
                if (rpcError) throw rpcError;
                
                fetchUsers();
                closeModal();
                setAlertConfig({ isOpen: true, title: 'Perubahan Disimpan', message: 'Data pengguna berhasil diperbarui.', type: 'success' });
            } catch (err) {
                console.error("Edit user error:", err);
                setError(err.message || 'Terjadi kesalahan saat mengubah data pengguna.');
            } finally {
                setIsActionLoading(false);
            }
        }
    };

    // --- ACTIVITY LOGIC ---
    const openActivityModal = async (user) => {
        setActivityTargetUser(user);
        setIsActivityModalOpen(true);
        setIsActivityLoading(true);
        
        try {
            // 1. Fetch Login History
            const { data: loginsData, error: loginsError } = await supabase
                .from('login_history')
                .select('*')
                .eq('user_id', user.user_id)
                .order('login_time', { ascending: false })
                .limit(10);
                
            if (loginsError) throw loginsError;
            setUserLogins(loginsData || []);

            // 2. Fetch Transaction History based on receptionist name using the user.username or user.email
            // First we determine the receptionist name used by this account
            const receptionistName = user.username || user.email;
            
            const { data: transactionsData, error: transError } = await supabase
                .from('transactions')
                .select('id, booking_no, guest_name, created_at, room_type')
                .or(`receptionist.ilike.%${receptionistName}%,email.ilike.%${user.email}%`)
                .order('created_at', { ascending: false })
                .limit(10);
                
            if (transError) throw transError;
            setUserTransactions(transactionsData || []);

        } catch (err) {
            console.error("Error fetching user activity:", err);
            setAlertConfig({
                isOpen: true,
                title: 'Gagal Memuat',
                message: 'Terjadi kesalahan saat mengambil data aktivitas.',
                type: 'error'
            });
        } finally {
            setIsActivityLoading(false);
        }
    };

    const closeActivityModal = () => {
        setIsActivityModalOpen(false);
        setActivityTargetUser(null);
        setUserLogins([]);
        setUserTransactions([]);
    };

    // Helper func for relative time
    const getRelativeTime = (timestamp) => {
        const rtf = new Intl.RelativeTimeFormat('id', { numeric: 'auto' });
        const daysDifference = Math.round((new Date(timestamp) - new Date()) / (1000 * 60 * 60 * 24));
        const hoursDifference = Math.round((new Date(timestamp) - new Date()) / (1000 * 60 * 60));
        const minDifference = Math.round((new Date(timestamp) - new Date()) / (1000 * 60));

        if (Math.abs(minDifference) < 60) return rtf.format(minDifference, 'minute');
        if (Math.abs(hoursDifference) < 24) return rtf.format(hoursDifference, 'hour');
        return rtf.format(daysDifference, 'day');
    };

    // Role filter options
    const roleOptions = ['Semua', ...Array.from(new Set(
        users.map(u => u.role).filter(Boolean)
    )).sort()];

    // Filter users by search + role
    const filteredUsers = users.filter(u => {
        // Role filter
        if (roleFilter !== 'Semua' && u.role !== roleFilter) return false;
        // Text search
        if (!searchTerm) return true;
        const lowerSearch = searchTerm.toLowerCase();
        const displayEmail = (u.email || '').toLowerCase();
        const displayUsername = (u.username || '').toLowerCase();
        const displayRole = (u.role || '').toLowerCase();
        return displayEmail.includes(lowerSearch) || displayUsername.includes(lowerSearch) || displayRole.includes(lowerSearch);
    });

    const stats = {
        total: users.length,
        admin: users.filter(u => u.role === 'Admin' || u.role === 'Superadmin').length,
        resepsionis: users.filter(u => u.role === 'Resepsionis').length
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
    );

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto min-h-screen animate-page-entrance">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Manajemen Pengguna</h1>
                    <p className="text-slate-500 mt-1">Kelola akses, role, dan informasi akun staf hotel.</p>
                </div>
                <button
                    onClick={openAddModal}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-200 active:scale-95"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Tambah Pengguna
                </button>
            </div>

            {/* ERROR ALERT */}
            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-8 border border-red-100 flex items-center gap-3">
                    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <p>{error}</p>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                    </div>
                    <div>
                        <p className="text-slate-500 text-sm font-medium">Total Akun</p>
                        <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center shrink-0">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    </div>
                    <div>
                        <p className="text-slate-500 text-sm font-medium">Admin & Superadmin</p>
                        <p className="text-2xl font-bold text-slate-800">{stats.admin}</p>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    </div>
                    <div>
                        <p className="text-slate-500 text-sm font-medium">Resepsionis</p>
                        <p className="text-2xl font-bold text-slate-800">{stats.resepsionis}</p>
                    </div>
                </div>
            </div>

            {/* Search & Filter */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="px-6 pt-6 pb-4 border-b border-slate-100">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                        <h3 className="text-lg font-bold text-slate-800">Daftar Akun</h3>
                        <div className="relative w-full sm:w-72">
                            <input
                                type="text"
                                placeholder="Cari email, nama, role..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-slate-700"
                            />
                            <svg className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1">Role:</span>
                        {roleOptions.map((r) => (
                            <button
                                key={r}
                                onClick={() => setRoleFilter(r)}
                                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-all duration-200 ${
                                    roleFilter === r
                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-200'
                                        : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/50'
                                }`}
                            >
                                {r}
                            </button>
                        ))}
                        {(roleFilter !== 'Semua' || searchTerm) && (
                            <span className="text-xs text-slate-400 ml-2">
                                {filteredUsers.length} dari {users.length} akun
                            </span>
                        )}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Pengguna</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role Akses</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Bergabung Sejak</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <svg className="w-12 h-12 text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                            <p className="text-lg font-medium text-slate-700">Tidak ada data pengguna</p>
                                            <p className="text-sm mt-1">{searchTerm || roleFilter !== 'Semua' ? 'Tidak ditemukan pengguna yang cocok dengan filter atau pencarian.' : 'Pastikan fungsi Database telah di-setup.'}</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((u) => {
                                    const displayEmail = u.email || 'Email tidak tersedia';
                                    const initial = displayEmail !== 'Email tidak tersedia' ? displayEmail.charAt(0).toUpperCase() : '?';
                                    return (
                                        <tr key={u.user_id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-700 flex items-center justify-center font-bold text-lg shrink-0 shadow-sm border border-white">
                                                        {initial}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-bold text-slate-800 truncate">{u.username || displayEmail}</p>
                                                        <p className="text-xs text-slate-400 truncate mt-0.5">{displayEmail}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-sm
                                                    ${u.role === 'Superadmin' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                                    u.role === 'Admin' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                                    'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${u.role === 'Superadmin' ? 'bg-purple-500' : u.role === 'Admin' ? 'bg-indigo-500' : 'bg-emerald-500'}`}></span>
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-500 hidden sm:table-cell">
                                                {new Date(u.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2 transition-opacity">
                                                        <button
                                                            onClick={() => openActivityModal(u)}
                                                            className="p-2 rounded-xl border shadow-sm flex items-center gap-2 text-sm font-medium transition-all bg-white text-emerald-600 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50"
                                                            title="Lihat Aktivitas"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                            <span className="hidden lg:inline">Aktivitas</span>
                                                        </button>
                                                        <button
                                                            onClick={() => openEditModal(u)}
                                                        disabled={u.role === 'Superadmin'}
                                                        className={`p-2 rounded-xl border shadow-sm flex items-center gap-2 text-sm font-medium transition-all ${
                                                            u.role === 'Superadmin' 
                                                            ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed' 
                                                            : 'bg-white text-indigo-600 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50'
                                                        }`}
                                                        title={u.role === 'Superadmin' ? 'Superadmin tidak dapat diedit' : 'Edit Pengguna'}
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                        <span className="hidden lg:inline">Edit</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(u)}
                                                        disabled={u.role === 'Superadmin'}
                                                        className={`p-2 rounded-xl border shadow-sm flex items-center gap-2 text-sm font-medium transition-all ${
                                                            u.role === 'Superadmin' 
                                                            ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed' 
                                                            : 'bg-white text-red-600 border-slate-200 hover:border-red-300 hover:bg-red-50'
                                                        }`}
                                                        title={u.role === 'Superadmin' ? 'Superadmin tidak dapat dihapus' : 'Hapus Pengguna'}
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Form (Add & Edit) */}
            {isModalOpen && createPortal(
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeModal} style={{ animation: 'umOverlayIn 0.3s ease-out' }}></div>
                    <div className="relative bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden" style={{ animation: 'umModalIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
                        {/* Modal Header */}
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="text-xl font-bold text-slate-800">
                                {modalMode === 'add' ? 'Tambah Pengguna Baru' : 'Edit Pengguna'}
                            </h3>
                            <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 bg-white hover:bg-slate-100 p-2 rounded-full transition-colors border shadow-sm">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleFormSubmit} className="p-6">
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Akses</label>
                                    <input
                                        type="email"
                                        required={modalMode === 'add'}
                                        value={modalMode === 'add' ? email : editEmailValue}
                                        onChange={(e) => modalMode === 'add' ? setEmail(e.target.value) : setEditEmailValue(e.target.value)}
                                        placeholder="contoh@ppkd.com"
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-800 font-medium"
                                    />
                                    {modalMode === 'edit' && <p className="text-xs text-slate-400 mt-1.5">Ubah email pengguna (opsional).</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                        Kata Sandi {modalMode === 'edit' && <span className="text-slate-400 font-normal">(Opsional)</span>}
                                    </label>
                                    <input
                                        type="password"
                                        required={modalMode === 'add'}
                                        value={modalMode === 'add' ? password : editPasswordValue}
                                        onChange={(e) => modalMode === 'add' ? setPassword(e.target.value) : setEditPasswordValue(e.target.value)}
                                        placeholder={modalMode === 'add' ? "Minimal 6 karakter" : "Isi untuk mengganti kata sandi"}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-800 font-medium"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Role (Hak Akses)</label>
                                    <div className="relative">
                                        <select
                                            value={modalMode === 'add' ? role : editRoleValue}
                                            onChange={(e) => modalMode === 'add' ? setRole(e.target.value) : setEditRoleValue(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all appearance-none font-medium text-slate-700"
                                        >
                                            <option value="Resepsionis">Resepsionis (Front Desk)</option>
                                            <option value="Admin">Admin (Manager)</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Username (Nama Lengkap)</label>
                                    <input
                                        type="text"
                                        value={modalMode === 'add' ? usernameField : editUsernameValue}
                                        onChange={(e) => modalMode === 'add' ? setUsernameField(e.target.value) : setEditUsernameValue(e.target.value)}
                                        placeholder="misal: Azizi Faris"
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-800 font-medium"
                                    />
                                    <p className="text-xs text-slate-400 mt-1.5">Nama ini akan otomatis muncul di kolom Receptionist pada form registrasi.</p>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="mt-8 pt-5 border-t border-slate-100 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-5 py-2.5 text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl font-medium transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={modalMode === 'add' ? isCreating : isActionLoading}
                                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors shadow-sm shadow-indigo-200 flex items-center justify-center min-w-[130px] disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {(modalMode === 'add' ? isCreating : isActionLoading) ? (
                                        <div className="flex items-center gap-2">
                                            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                            <span>Menyimpan...</span>
                                        </div>
                                    ) : (
                                        modalMode === 'add' ? 'Simpan Data' : 'Perbarui'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {/* User Activity Modal */}
            {isActivityModalOpen && createPortal(
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeActivityModal} style={{ animation: 'umOverlayIn 0.3s ease-out' }}></div>
                    <div className="relative bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] shadow-2xl overflow-hidden flex flex-col" style={{ animation: 'umModalIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
                        {/* Header */}
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">Histori & Aktivitas Akun</h3>
                                <p className="text-sm text-slate-500 mt-1">{activityTargetUser?.username || activityTargetUser?.email}</p>
                            </div>
                            <button onClick={closeActivityModal} className="text-slate-400 hover:text-slate-600 bg-white hover:bg-slate-100 p-2 rounded-full transition-colors border shadow-sm">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
                            {isActivityLoading ? (
                                <div className="flex flex-col items-center justify-center h-48 space-y-4">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                                    <p className="text-sm text-slate-500">Memuat data aktivitas...</p>
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    {/* Login History Section */}
                                    <div>
                                        <h4 className="text-sm font-bold uppercase tracking-widest text-indigo-600 mb-4 flex items-center gap-2 border-b border-indigo-100 pb-2">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
                                            Histori Login Terakhir
                                        </h4>
                                        {userLogins.length === 0 ? (
                                            <p className="text-sm text-slate-500 italic px-2">Belum ada catatan login.</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {userLogins.map((lg) => (
                                                    <div key={lg.id} className="bg-white px-4 py-3 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-slate-800">Berhasil Login</p>
                                                                <p className="text-xs text-slate-500">{new Date(lg.login_time).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                                                            </div>
                                                        </div>
                                                        <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
                                                            {getRelativeTime(lg.login_time)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Transaction History Section */}
                                    <div>
                                        <h4 className="text-sm font-bold uppercase tracking-widest text-purple-600 mb-4 flex items-center gap-2 border-b border-purple-100 pb-2">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                                            Aktivitas Reservasi
                                        </h4>
                                        {userTransactions.length === 0 ? (
                                            <p className="text-sm text-slate-500 italic px-2">Belum ada aktivitas reservasi yang dicatat oleh akun ini.</p>
                                        ) : (
                                            <div className="relative border-l-2 border-slate-200 ml-3 space-y-6">
                                                {userTransactions.map((tx) => (
                                                    <div key={tx.id} className="relative pl-6">
                                                        <div className="absolute w-3.5 h-3.5 bg-purple-500 rounded-full border-2 border-white -left-[9px] top-1"></div>
                                                        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                                            <div className="flex justify-between items-start mb-1">
                                                                <p className="text-sm font-bold text-slate-800">Reservasi Kamar {tx.room_type || ''}</p>
                                                                <span className="text-xs font-medium text-slate-400 whitespace-nowrap ml-2">
                                                                    {getRelativeTime(tx.created_at)}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-slate-500">
                                                                Mencatat reservasi untuk tamu <span className="font-semibold text-slate-700">{tx.guest_name}</span> (Ref: <span className="font-mono text-xs">{tx.booking_no}</span>)
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* User Management Animations */}
            <style>{`
                @keyframes umOverlayIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes umModalIn {
                    from {
                        opacity: 0;
                        transform: scale(0.85) translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                }
            `}</style>

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
