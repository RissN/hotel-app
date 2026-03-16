import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [loginSuccess, setLoginSuccess] = useState(false);
    const [shakeError, setShakeError] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setShakeError(false);
        setLoading(true);

        try {
            await login(email, password);
            // Show success animation before navigating
            setLoading(false);
            setLoginSuccess(true);
            setTimeout(() => {
                navigate('/');
            }, 1600);
        } catch (err) {
            // Map Supabase error to user-friendly Indonesian message
            const msg = err.message?.toLowerCase().includes('invalid login credentials')
                ? 'Password atau email salah'
                : err.message || 'Gagal login, silakan coba lagi';
            setError(msg);
            setShakeError(true);
            // Remove shake class after animation completes
            setTimeout(() => setShakeError(false), 600);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900">
            {/* Success Overlay */}
            {loginSuccess && (
                <div
                    className="fixed inset-0 z-50 flex flex-col items-center justify-center"
                    style={{
                        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
                        animation: 'successFadeIn 0.4s ease-out',
                    }}
                >
                    {/* Animated checkmark circle */}
                    <div
                        className="relative"
                        style={{ animation: 'successBounceIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s both' }}
                    >
                        <div
                            className="w-28 h-28 rounded-full flex items-center justify-center"
                            style={{
                                background: 'linear-gradient(135deg, #10b981, #059669)',
                                boxShadow: '0 0 60px rgba(16, 185, 129, 0.4), 0 0 120px rgba(16, 185, 129, 0.15)',
                            }}
                        >
                            <svg
                                className="w-14 h-14 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                style={{ animation: 'checkmarkDraw 0.5s ease-out 0.6s both' }}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2.5}
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                        </div>
                        {/* Pulse ring */}
                        <div
                            className="absolute inset-0 rounded-full"
                            style={{
                                border: '3px solid rgba(16, 185, 129, 0.3)',
                                animation: 'successPulseRing 1.2s ease-out 0.4s both',
                            }}
                        />
                    </div>
                    {/* Text */}
                    <h2
                        className="text-white text-2xl font-bold mt-8 tracking-wide"
                        style={{ animation: 'successTextIn 0.5s ease-out 0.8s both' }}
                    >
                        Login Berhasil!
                    </h2>
                    <p
                        className="text-slate-400 mt-2 text-sm"
                        style={{ animation: 'successTextIn 0.5s ease-out 1s both' }}
                    >
                        Mengalihkan ke dashboard...
                    </p>
                </div>
            )}

            <div
                className="max-w-md w-full my-10 mx-auto px-6 py-8 bg-white shadow-2xl rounded-3xl border border-slate-700 transform transition-all duration-300"
                style={loginSuccess ? { animation: 'loginCardFadeOut 0.4s ease-in forwards' } : {}}
            >
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-6">
                        <img 
                            src="/logo.png" 
                            alt="Hotel Logo" 
                            className="h-20 w-auto object-contain drop-shadow-md hover:scale-105 transition-transform duration-300"
                        />
                    </div>
                    <h2 className="text-3xl font-extrabold text-slate-900 drop-shadow-sm">
                        Hotel Staff Login
                    </h2>
                    <p className="text-slate-500 mt-2 font-medium">Masuk ke sistem reservasi hotel</p>
                </div>

                {error && (
                    <div
                        className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm text-center border border-red-200 flex items-center justify-center gap-2"
                        style={shakeError ? { animation: 'shakeError 0.5s ease-in-out' } : {}}
                    >
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86l-8.5 14.72A1 1 0 002.64 20h18.72a1 1 0 00.85-1.42l-8.5-14.72a1 1 0 00-1.72 0z" />
                        </svg>
                        <span className="font-medium">{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Email
                        </label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => { setEmail(e.target.value); setError(''); }}
                            className={`w-full px-4 py-3 rounded-xl border transition-all outline-none bg-white/50 ${
                                error ? 'border-red-300 focus:ring-2 focus:ring-red-400' : 'border-slate-200 focus:ring-2 focus:ring-slate-900'
                            } focus:border-transparent`}
                            placeholder="example@ppkd.com"
                            disabled={loginSuccess}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Password
                        </label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); setError(''); }}
                            className={`w-full px-4 py-3 rounded-xl border transition-all outline-none bg-white/50 ${
                                error ? 'border-red-300 focus:ring-2 focus:ring-red-400' : 'border-slate-200 focus:ring-2 focus:ring-slate-900'
                            } focus:border-transparent`}
                            placeholder="••••••••"
                            disabled={loginSuccess}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || loginSuccess}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 rounded-xl transition-all duration-300 transform active:scale-[0.98] shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Memproses...' : 'Login'}
                    </button>
                </form>

                <div className="mt-8 text-center text-sm text-slate-500">
                    <p>Hanya untuk staf yang berwenang.</p>
                </div>
            </div>

            {/* Animations */}
            <style>{`
                @keyframes shakeError {
                    0%, 100% { transform: translateX(0); }
                    10%, 50%, 90% { transform: translateX(-6px); }
                    30%, 70% { transform: translateX(6px); }
                }
                @keyframes successFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes successBounceIn {
                    from {
                        opacity: 0;
                        transform: scale(0.3);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
                @keyframes checkmarkDraw {
                    from {
                        opacity: 0;
                        stroke-dasharray: 30;
                        stroke-dashoffset: 30;
                    }
                    to {
                        opacity: 1;
                        stroke-dasharray: 30;
                        stroke-dashoffset: 0;
                    }
                }
                @keyframes successPulseRing {
                    0% {
                        transform: scale(1);
                        opacity: 0.6;
                    }
                    100% {
                        transform: scale(1.8);
                        opacity: 0;
                    }
                }
                @keyframes successTextIn {
                    from {
                        opacity: 0;
                        transform: translateY(12px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                @keyframes loginCardFadeOut {
                    to {
                        opacity: 0;
                        transform: scale(0.95) translateY(10px);
                    }
                }
            `}</style>
        </div>
    );
};

export default Login;
