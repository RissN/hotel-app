import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import CustomAlert from '../components/CustomAlert';
import { useAuth } from '../context/AuthContext';

const HotelProfile = () => {
    const { role: myRole } = useAuth();
    const [profile, setProfile] = useState({
        id: null,
        name: '',
        address: '',
        phone: '',
        email: '',
        logo_url: '',
        terms: ''
    });
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [rates, setRates] = useState([]);

    const [alertConfig, setAlertConfig] = useState({ 
        isOpen: false, 
        title: '', 
        message: '', 
        type: 'info' 
    });

    useEffect(() => {
        fetchProfile();
        fetchRates();
    }, []);

    const fetchRates = async () => {
        try {
            const { data } = await supabase.from('room_rates').select('*').order('room_type');
            if (data) setRates(data);
        } catch (err) {
            console.error("Fetch rates error:", err);
        }
    };

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('hotel_profile')
                .select('*')
                .limit(1)
                .single();
            
            if (data) {
                setProfile(data);
            }
        } catch (err) {
            console.error("Fetch profile error:", err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const { error } = await supabase
                .from('hotel_profile')
                .update({
                    name: profile.name,
                    address: profile.address,
                    phone: profile.phone,
                    email: profile.email,
                    terms: profile.terms,
                    updated_at: new Date()
                })
                .eq('id', profile.id);

            if (error) throw error;

            // Update Room Rates
            for (const rate of rates) {
                await supabase
                    .from('room_rates')
                    .update({
                        base_price: rate.base_price,
                        seasonal_price: rate.seasonal_price || null,
                        updated_at: new Date()
                    })
                    .eq('id', rate.id);
            }

            setAlertConfig({
                isOpen: true,
                title: 'Berhasil',
                message: 'Profil hotel telah diperbarui.',
                type: 'success'
            });

        } catch (err) {
            console.error("Save profile error:", err);
            setAlertConfig({
                isOpen: true,
                title: 'Gagal',
                message: err.message || 'Gagal menyimpan profil hotel.',
                type: 'error'
            });
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
    );

    return (
        <div className="p-6 md:p-8 w-full min-h-screen animate-page-entrance">
            <header className="mb-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-gradient-to-r from-indigo-800 to-purple-800 rounded-3xl p-8 shadow-lg shadow-indigo-500/20 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-white/5 opacity-50 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(255,255,255,0.1) 0%, transparent 20%)', backgroundSize: '20px 20px' }} />
                
                <div className="relative z-10 w-full lg:w-auto">
                    <h1 className="text-3xl font-extrabold tracking-tight">Pengaturan Profil Hotel</h1>
                    <p className="text-indigo-200 mt-2 text-md">Kelola informasi dasar hotel yang akan digunakan di sistem dan cetak nota.</p>
                </div>
            </header>

            <form onSubmit={handleSave} className="space-y-6 w-full">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
                    {/* ===== KOLOM KIRI ===== */}
                    <div className="space-y-6">
                        {/* Informasi Umum */}
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-5 pb-3 border-b border-slate-100">
                        <div className="w-9 h-9 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                        </div>
                        <h2 className="text-lg font-bold text-slate-800">Informasi Umum</h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nama Hotel</label>
                            <input
                                type="text"
                                required
                                value={profile.name}
                                onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-800 font-medium"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Alamat Lengkap</label>
                            <textarea
                                required
                                value={profile.address}
                                onChange={(e) => setProfile(prev => ({ ...prev, address: e.target.value }))}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-800 font-medium h-20 resize-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Informasi Kontak */}
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-5 pb-3 border-b border-slate-100">
                        <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.7l.39 1.54a1 1 0 01-.57 1.21L8.03 8.35a16.04 16.04 0 006.51 6.51l1.17-1.17a1 1 0 011.21-.57l1.54.39a1 1 0 01.7.94V19a2 2 0 01-2 2h-1c-10.49 0-19-8.51-19-19v-1z" /></svg>
                        </div>
                        <h2 className="text-lg font-bold text-slate-800">Kontak</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nomor Telepon</label>
                            <input
                                type="text"
                                value={profile.phone}
                                onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-800 font-medium"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Hotel</label>
                            <input
                                type="email"
                                value={profile.email}
                                onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-800 font-medium"
                            />
                        </div>
                    </div>
                    </div>
                    </div> {/* End Kolom Kiri */}

                    {/* ===== KOLOM KANAN ===== */}
                    <div className="space-y-6">
                        {/* Syarat & Kebijakan */}
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-5 pb-3 border-b border-slate-100">
                        <div className="w-9 h-9 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        </div>
                        <h2 className="text-lg font-bold text-slate-800">Kwitansi Notes / Kebijakan</h2>
                    </div>

                    <div>
                        <textarea
                            value={profile.terms}
                            onChange={(e) => setProfile(prev => ({ ...prev, terms: e.target.value }))}
                            placeholder="Tuliskan syarat, ketentuan, atau catatan kaki yang akan dicetak pada nota/kwitansi..."
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-800 font-medium h-24 resize-none"
                        />
                    </div>
                </div>

                {/* Manajemen Harga Kamar */}
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-5 pb-3 border-b border-slate-100">
                        <div className="w-9 h-9 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <h2 className="text-lg font-bold text-slate-800">Manajemen Harga Kamar</h2>
                    </div>

                    <div className="space-y-4">
                        {rates.length === 0 && (
                            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm flex gap-2 items-start">
                                <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.268 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                <div>
                                    <p className="font-bold">Tarif Kamar Tidak Ditemukan</p>
                                    <p className="mt-0.5 text-xs text-amber-600">Pastikan Anda telah menjalankan script SQL file `hotel_profile_setup.sql` di Supabase Anda untuk membuat tabel `room_rates`.</p>
                                </div>
                            </div>
                        )}
                        {rates.map((rate, idx) => (
                            <div key={rate.id} className="p-4 bg-slate-50/50 rounded-xl border border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                                <div>
                                    <p className="font-bold text-slate-800 uppercase tracking-wide text-sm">{rate.room_type} Room</p>
                                    <p className="text-xs text-slate-400 mt-0.5">Atur tarif dasar & musiman</p>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Harga Dasar (IDR)</label>
                                    <input
                                        type="number"
                                        value={rate.base_price}
                                        onChange={(e) => {
                                            const newRates = [...rates];
                                            newRates[idx].base_price = Number(e.target.value);
                                            setRates(newRates);
                                        }}
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/30 outline-none text-sm font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Harga Musiman (IDR)</label>
                                    <input
                                        type="number"
                                        placeholder="Optional (kosongkan jika normal)"
                                        value={rate.seasonal_price || ''}
                                        onChange={(e) => {
                                            const newRates = [...rates];
                                            newRates[idx].seasonal_price = e.target.value === '' ? null : Number(e.target.value);
                                            setRates(newRates);
                                        }}
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/30 outline-none text-sm font-medium"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                </div> {/* End Kolom Kanan */}
                </div> {/* End Grid */}

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-sm shadow-indigo-200 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSaving ? (
                            <div className="flex items-center gap-2">
                                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                <span>Menyimpan...</span>
                            </div>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 8" /></svg>
                                Simpan Perubahan
                            </>
                        )}
                    </button>
                </div>
            </form>

            <CustomAlert
                isOpen={alertConfig.isOpen}
                onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
            />
        </div>
    );
};

export default HotelProfile;
