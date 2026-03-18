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

        if (!email.trim() || !password.trim()) {
            setError('Harap isi email dan password Anda untuk masuk');
            setShakeError(true);
            setTimeout(() => setShakeError(false), 600);
            return;
        }

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
        <div className="relative min-h-screen flex items-center justify-center bg-[#0a0b10] overflow-hidden">
            {/* Animated Gradient Background */}
            <div 
                className="absolute inset-0 bg-gradient-to-br from-[#0c0f24] via-[#05050a] to-[#041a12]"
                style={{ 
                    backgroundSize: '400% 400%',
                    animation: 'gradientAnimation 15s ease infinite'
                }}
            ></div>

            {/* Glowing Blobs */}
            <div 
                className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/20 rounded-full filter blur-[100px]"
                style={{ animation: 'blob 12s infinite alternate ease-in-out' }}
            ></div>
            <div 
                className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full filter blur-[100px]"
                style={{ animation: 'blob 15s infinite alternate-reverse ease-in-out', animationDelay: '2s' }}
            ></div>
            <div 
                className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-purple-500/10 rounded-full filter blur-[80px]"
                style={{ animation: 'blob 18s infinite alternate ease-in-out', animationDelay: '4s' }}
            ></div>

            {/* Success Overlay */}
            {loginSuccess && (
                <div
                    className="fixed inset-0 z-50 flex flex-col items-center justify-center backdrop-blur-2xl bg-slate-950/80"
                    style={{
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
                className="relative z-10 max-w-md w-full my-10 mx-auto px-8 py-10 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl transition-all duration-500 hover:border-white/20"
                style={loginSuccess ? { animation: 'loginCardFadeOut 0.4s ease-in forwards' } : {}}
            >
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-6">
                        <img 
                            src="/logo.png" 
                            alt="Hotel Logo" 
                            className="h-20 w-auto object-contain drop-shadow-emerald filter brightness-110 hover:scale-105 transition-transform duration-300"
                        />
                    </div>
                    <h2 className="text-3xl font-extrabold text-white tracking-wide">
                        Hotel Staff Login
                    </h2>
                    <p className="text-slate-400 mt-2 font-medium">Masuk ke sistem reservasi hotel</p>
                </div>

                {error && (
                    <div
                        className="bg-red-500/10 text-red-400 p-4 rounded-xl mb-6 text-sm text-center border border-red-500/20 flex items-center justify-center gap-2 backdrop-blur-sm"
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
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => { setEmail(e.target.value); setError(''); }}
                            className={`w-full px-4 py-3 rounded-xl border transition-all outline-none bg-white/5 text-white placeholder-slate-500 ${
                                error ? 'border-red-500 focus:ring-4 focus:ring-red-500/20' : 'border-white/10 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20'
                            }`}
                            placeholder="example@ppkd.com"
                            disabled={loginSuccess}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); setError(''); }}
                            className={`w-full px-4 py-3 rounded-xl border transition-all outline-none bg-white/5 text-white placeholder-slate-500 ${
                                error ? 'border-red-500 focus:ring-4 focus:ring-red-500/20' : 'border-white/10 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20'
                            }`}
                            placeholder="••••••••"
                            disabled={loginSuccess}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || loginSuccess}
                        className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-medium py-3 rounded-xl transition-all duration-300 transform active:scale-[0.98] shadow-lg hover:shadow-indigo-500/25 hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed text-base tracking-wide"
                    >
                        {loading ? 'Memproses...' : 'Login'}
                    </button>
                </form>

                <div className="mt-8 text-center text-sm text-slate-400">
                    <p>Hanya untuk staf yang berwenang.</p>
                </div>
            </div>

            {/* Animations */}
            <style>{`
                @keyframes gradientAnimation {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                @keyframes blob {
                    0% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.05); }
                    66% { transform: translate(-20px, 20px) scale(0.95); }
                    100% { transform: translate(0, 0) scale(1); }
                }
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
