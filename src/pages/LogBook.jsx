import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import CustomAlert from '../components/CustomAlert';

const LogBook = () => {
    const { user, role } = useAuth();
    const [logs, setLogs] = useState([]);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);

    const [alertConfig, setAlertConfig] = useState({ 
        isOpen: false, 
        title: '', 
        message: '', 
        type: 'info' 
    });

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('shift_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(20);
            
            if (error) throw error;
            setLogs(data || []);
        } catch (err) {
            console.error("Fetch logs error:", err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!message.trim()) return;

        setIsSending(true);
        try {
            const { error } = await supabase
                .from('shift_logs')
                .insert([{
                    user_id: user.id,
                    username: user.email.split('@')[0], // Fallback username
                    message: message.trim()
                }]);

            if (error) throw error;

            setMessage('');
            fetchLogs(); // Refresh list

        } catch (err) {
            console.error("Send log error:", err);
            setAlertConfig({
                isOpen: true,
                title: 'Gagal',
                message: 'Gagal mengirim pesan log intern.',
                type: 'error'
            });
        } finally {
            setIsSending(false);
        }
    };

    if (loading && logs.length === 0) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
    );

    return (
        <div className="p-6 md:p-8 w-full min-h-screen animate-page-entrance bg-slate-50/50">
            <header className="mb-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-gradient-to-r from-indigo-800 to-purple-800 rounded-3xl p-8 shadow-lg shadow-indigo-500/20 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-white/5 opacity-50 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(255,255,255,0.1) 0%, transparent 20%)', backgroundSize: '20px 20px' }} />
                
                <div className="relative z-10 w-full lg:w-auto">
                    <h1 className="text-3xl font-extrabold tracking-tight">Log Book Internal</h1>
                    <p className="text-indigo-200 mt-2 text-md">Catatan serah terima shift, pesan antar resepsionis, dan internal staf.</p>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                
                {/* Form Tambah Log (All Roles) */}
                <div className="lg:col-span-1 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm sticky top-24">
                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </div>
                        Tulis Catatan Baru
                    </h2>
                    <form onSubmit={handleSend} className="space-y-4">
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Ketik pesan atau catatan internal di sini..."
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all text-slate-800 font-medium h-32 resize-none text-sm"
                            required
                        />
                        <button
                            type="submit"
                            disabled={isSending || !message.trim()}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm shadow-indigo-200 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isSending ? 'Mengirim...' : 'Kirim Catatan'}
                            <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7m0 0l-7 7m7-7H3" /></svg>
                        </button>
                    </form>
                </div>

                {/* Feed Logs */}
                <div className="lg:col-span-2 space-y-4">
                    {logs.length === 0 ? (
                        <div className="bg-white rounded-2xl p-8 text-center border border-slate-100 shadow-sm">
                            <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.966L3 20l1.326-3.977C3.56 14.71 3 13.435 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                            <p className="font-medium text-slate-700">Belum ada catatan log book.</p>
                            <p className="text-slate-400 text-sm mt-1">Staf dapat mulai menulis catatan koordinasi di panel kiri.</p>
                        </div>
                    ) : (
                        logs.map((lg) => (
                            <div key={lg.id} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-100 to-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-base shrink-0 border border-white shadow-sm uppercase">
                                    {lg.username?.charAt(0) || '?'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                        <p className="text-sm font-bold text-slate-800 truncate">@{lg.username}</p>
                                        <span className="text-[11px] font-medium text-slate-400 whitespace-nowrap bg-slate-50 px-2 py-0.5 rounded-md border">
                                            {new Date(lg.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} • {new Date(lg.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                        </span>
                                    </div>
                                    <p className="text-slate-600 text-sm break-words whitespace-pre-wrap leading-relaxed mt-1.5 bg-slate-50/70 p-3 rounded-xl border border-dotted border-slate-200">
                                        {lg.message}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>

            </div>

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

export default LogBook;
