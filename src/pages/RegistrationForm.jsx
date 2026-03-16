import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROOM_PRICES = {
    Standard: 1500000,
    Deluxe: 2500000,
    Suite: 4000000,
};

const formatIDR = (amount) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);

export default function RegistrationForm() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { username } = useAuth();
    const [showConfirm, setShowConfirm] = useState(false);
    const [navigating, setNavigating] = useState(false);
    const [formData, setFormData] = useState({
        roomNo: '',
        roomType: '',
        receptionist: username || '',
        checkOutTime: '12.00 Noon',
        name: '',
        arrivalTime: '',
        profession: '',
        arrivalDate: '',
        company: '',
        nationality: '',
        passportNo: '',
        birthDate: '',
        address: '',
        phone: '',
        departureDate: '',
        email: '',
        memberNo: '',
        safetyDepositBoxNumber: '',
        issuedBy: username || '',
        issuedDate: ''
    });

    // Capture search params for room number and type
    useEffect(() => {
        const room = searchParams.get('room');
        const type = searchParams.get('type');
        
        if (room || type) {
            setFormData(prev => ({
                ...prev,
                roomNo: room || prev.roomNo,
                roomType: type || prev.roomType
            }));
        }
    }, [searchParams]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setShowConfirm(true);
    };

    const handleConfirm = () => {
        setShowConfirm(false);
        setNavigating(true);
        setTimeout(() => {
            navigate('/payment', { state: { reservationData: formData } });
        }, 1200);
    };

    const handleCancel = () => {
        setShowConfirm(false);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    const inputClass = "w-full rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 px-3 py-2 bg-white text-sm transition";
    const labelClass = "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1";

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-100 to-purple-100 animate-gradient py-10 px-4 sm:px-6 lg:px-8">
            {/* Page Transition Overlay */}
            {navigating && (
                <div
                    className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
                    style={{
                        background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 50%, #1e40af 100%)',
                        animation: 'pageTransIn 0.5s ease-out',
                    }}
                >
                    <div style={{ animation: 'pageTransBounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s both' }}>
                        <div
                            className="w-24 h-24 rounded-full flex items-center justify-center"
                            style={{
                                background: 'rgba(255,255,255,0.15)',
                                backdropFilter: 'blur(10px)',
                                boxShadow: '0 0 40px rgba(59, 130, 246, 0.3)',
                            }}
                        >
                            <svg className="w-12 h-12 text-white" style={{ animation: 'pageTransSpin 1.2s linear infinite' }} fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                        </div>
                    </div>
                    <h2 className="text-white text-xl font-bold mt-6" style={{ animation: 'pageTransTextIn 0.5s ease-out 0.5s both' }}>
                        Menuju Halaman Pembayaran
                    </h2>
                    <div className="flex items-center gap-3 mt-4" style={{ animation: 'pageTransTextIn 0.5s ease-out 0.7s both' }}>
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-blue-600 text-xs font-bold">✓</div>
                            <span className="text-white/80 text-sm">Registrasi</span>
                        </div>
                        <div className="w-8 h-0.5 bg-white/40" />
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-white/30 flex items-center justify-center text-white text-xs font-bold" style={{ animation: 'pageTransPulse 1s ease-in-out infinite' }}>2</div>
                            <span className="text-white font-semibold text-sm">Pembayaran</span>
                        </div>
                        <div className="w-8 h-0.5 bg-white/20" />
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-white/50 text-xs font-bold">3</div>
                            <span className="text-white/40 text-sm">Konfirmasi</span>
                        </div>
                    </div>
                </div>
            )}

            <div
                className="max-w-7xl mx-auto rounded-2xl shadow-2xl overflow-hidden border border-gray-200 bg-white animate-page-entrance"
                style={navigating ? { animation: 'pageTransContentOut 0.4s ease-in forwards' } : {}}
            >

                {/* Header */}
                <div className="bg-gradient-to-r from-blue-700 to-blue-500 px-8 py-6 text-white">
                    <div className="flex items-center justify-center gap-5">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center border-4 border-white overflow-hidden shadow-lg flex-shrink-0">
                            <img src="/logo.png" alt="PPKD Jakarta Pusat Logo" className="w-full h-full object-cover" />
                        </div>
                        <div className="text-center sm:text-left">
                            <h1 className="text-3xl font-bold tracking-tight">PPKD HOTEL</h1>
                            <p className="mt-0.5 text-blue-100 text-base">Formulir Pendaftaran / Registration Form</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 lg:p-8">
                    {/* ── Two-Column Layout ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">

                        {/* ═══ LEFT COLUMN ═══ */}
                        <div className="space-y-6">
                            {/* ── Section 1: Room Details ── */}
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
                                <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-4">Informasi Kamar / Room Details</h2>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className={labelClass}>Room No.</label>
                                        <input type="text" name="roomNo" value={formData.roomNo} onChange={handleChange}
                                            className={inputClass} placeholder="e.g. 0601" />
                                    </div>
                                    <div>
                                        <label className={labelClass}>No. of Room</label>
                                        <input type="number" name="numberOfRoom" value={formData.numberOfRoom} onChange={handleChange}
                                            className={inputClass} min="1" />
                                    </div>
                                    <div>
                                        <label className={labelClass}>No. of Person</label>
                                        <input type="number" name="numberOfPerson" value={formData.numberOfPerson} onChange={handleChange}
                                            className={inputClass} min="1" />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Room Type</label>
                                        <select name="roomType" value={formData.roomType} onChange={handleChange} className={inputClass}>
                                            <option value="">Select…</option>
                                            {Object.entries(ROOM_PRICES).map(([type, price]) => (
                                                <option key={type} value={type}>
                                                    {type} - {formatIDR(price)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-span-2">
                                        <label className={labelClass}>Receptionist</label>
                                        <input type="text" name="receptionist" value={formData.receptionist} onChange={handleChange}
                                            readOnly={!!username}
                                            className={`${inputClass} ${username ? 'bg-slate-100 text-slate-600 cursor-not-allowed' : ''}`} />
                                    </div>
                                    <div className="col-span-2">
                                        <div className="bg-white border border-blue-200 rounded-lg px-4 py-2 text-center">
                                            <p className="text-xs text-gray-500 uppercase tracking-wide">Check-Out Time</p>
                                            <p className="text-sm font-bold text-blue-700">12.00 Noon / Jam 12.00 Siang</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ── Section 2: Guest Details ── */}
                            <div className="bg-white border border-gray-100 rounded-xl p-5">
                                <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-4">Data Tamu / Guest Information</h2>
                                <p className="text-xs text-gray-400 italic mb-4">Harap tulis dengan huruf cetak — Please print in block letters</p>

                                <div className="space-y-3">
                                    {/* Name */}
                                    <div>
                                        <label className={labelClass}>Nama / Name</label>
                                        <input type="text" name="name" value={formData.name} onChange={handleChange}
                                            required className={inputClass} />
                                    </div>

                                    {/* Profession + Company */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className={labelClass}>Pekerjaan / Profession</label>
                                            <input type="text" name="profession" value={formData.profession} onChange={handleChange}
                                                className={inputClass} />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Perusahaan / Company</label>
                                            <input type="text" name="company" value={formData.company} onChange={handleChange}
                                                className={inputClass} />
                                        </div>
                                    </div>

                                    {/* Nationality + Passport */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className={labelClass}>Kebangsaan / Nationality</label>
                                            <input type="text" name="nationality" value={formData.nationality} onChange={handleChange}
                                                className={inputClass} />
                                        </div>
                                        <div>
                                            <label className={labelClass}>No. KTP / Passport</label>
                                            <input type="text" name="passportNo" value={formData.passportNo} onChange={handleChange}
                                                className={inputClass} />
                                        </div>
                                    </div>

                                    {/* Birth Date */}
                                    <div>
                                        <label className={labelClass}>Tanggal Lahir / Birth Date</label>
                                        <input type="date" name="birthDate" value={formData.birthDate} onChange={handleChange}
                                            className={inputClass} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ═══ RIGHT COLUMN ═══ */}
                        <div className="space-y-6">
                            {/* ── Guest Details (continued): Contact ── */}
                            <div className="bg-white border border-gray-100 rounded-xl p-5">
                                <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-4">Kontak / Contact Details</h2>
                                <div className="space-y-3">
                                    <div>
                                        <label className={labelClass}>Alamat / Address</label>
                                        <textarea name="address" value={formData.address} onChange={handleChange}
                                            rows="3" className={inputClass}></textarea>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className={labelClass}>Telepon / HP</label>
                                            <input type="tel" name="phone" value={formData.phone} onChange={handleChange}
                                                className={inputClass} />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Email</label>
                                            <input type="email" name="email" value={formData.email} onChange={handleChange}
                                                className={inputClass} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelClass}>No. Member / Member No.</label>
                                        <input type="text" name="memberNo" value={formData.memberNo} onChange={handleChange}
                                            className={inputClass} />
                                    </div>
                                </div>
                            </div>

                            {/* ── Section 3: Dates ── */}
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                                <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-4">Tanggal Menginap / Stay Dates</h2>
                                <div className="space-y-3">
                                    <div>
                                        <label className={labelClass}>Arrival Time</label>
                                        <input type="time" name="arrivalTime" value={formData.arrivalTime} onChange={handleChange}
                                            className={inputClass} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className={labelClass}>Arrival Date</label>
                                            <input type="date" name="arrivalDate" value={formData.arrivalDate} onChange={handleChange}
                                                required className={inputClass} />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Departure Date</label>
                                            <input type="date" name="departureDate" value={formData.departureDate} onChange={handleChange}
                                                required className={inputClass} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ── Section 4: Safety Deposit Box ── */}
                            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                                <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-4">Kotak Deposit / Safety Deposit Box</h2>
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className={labelClass}>Nomor Kotak / Box No.</label>
                                            <input type="text" name="safetyDepositBoxNumber" value={formData.safetyDepositBoxNumber}
                                                onChange={handleChange} className={inputClass} />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Dikeluarkan Oleh / Issued By</label>
                                            <input type="text" name="issuedBy" value={formData.issuedBy} onChange={handleChange}
                                                readOnly={!!username}
                                                className={`${inputClass} ${username ? 'bg-slate-100 text-slate-600 cursor-not-allowed' : ''}`} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Tanggal / Date</label>
                                        <input type="date" name="issuedDate" value={formData.issuedDate} onChange={handleChange}
                                            className={inputClass} />
                                    </div>
                                </div>
                            </div>

                            {/* ── Submit ── */}
                            <div className="flex justify-end pt-2">
                                <button
                                    type="submit"
                                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold py-3 px-10 rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
                                >
                                    Submit &amp; Generate Invoice →
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>

            {/* ── Confirmation Modal ── */}
            {showConfirm && createPortal(
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center px-4"
                    onClick={(e) => { if (e.target === e.currentTarget) handleCancel(); }}
                    style={{
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        backdropFilter: 'blur(6px)',
                        animation: 'confirmOverlayIn 0.3s ease-out',
                    }}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
                        style={{ animation: 'confirmModalIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                    >
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-blue-700 to-blue-500 px-6 py-5 text-white">
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"
                                    style={{ animation: 'confirmIconPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s both' }}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold">Konfirmasi Data</h3>
                                    <p className="text-blue-100 text-sm">Pastikan data sudah benar sebelum melanjutkan</p>
                                </div>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
                            {/* Guest */}
                            <div
                                className="bg-blue-50 rounded-lg p-4"
                                style={{ animation: 'confirmSectionIn 0.4s ease-out 0.15s both' }}
                            >
                                <h4 className="text-xs font-bold uppercase tracking-wide text-blue-600 mb-2">Data Tamu</h4>
                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between"><span className="text-gray-500">Nama</span><span className="font-medium text-gray-800">{formData.name || '-'}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-500">Email</span><span className="font-medium text-gray-800">{formData.email || '-'}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-500">Telepon</span><span className="font-medium text-gray-800">{formData.phone || '-'}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-500">Kebangsaan</span><span className="font-medium text-gray-800">{formData.nationality || '-'}</span></div>
                                </div>
                            </div>

                            {/* Room */}
                            <div
                                className="bg-slate-50 rounded-lg p-4"
                                style={{ animation: 'confirmSectionIn 0.4s ease-out 0.25s both' }}
                            >
                                <h4 className="text-xs font-bold uppercase tracking-wide text-blue-600 mb-2">Informasi Kamar</h4>
                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between"><span className="text-gray-500">No. Kamar</span><span className="font-medium text-gray-800">{formData.roomNo || '-'}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-500">Tipe Kamar</span><span className="font-medium text-gray-800">{formData.roomType || '-'}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-500">Jumlah Kamar</span><span className="font-medium text-gray-800">{formData.numberOfRoom || '-'}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-500">Jumlah Tamu</span><span className="font-medium text-gray-800">{formData.numberOfPerson || '-'}</span></div>
                                </div>
                            </div>

                            {/* Dates */}
                            <div
                                className="bg-green-50 rounded-lg p-4"
                                style={{ animation: 'confirmSectionIn 0.4s ease-out 0.35s both' }}
                            >
                                <h4 className="text-xs font-bold uppercase tracking-wide text-green-600 mb-2">Tanggal Menginap</h4>
                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between"><span className="text-gray-500">Check-in</span><span className="font-medium text-gray-800">{formatDate(formData.arrivalDate)}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-500">Check-out</span><span className="font-medium text-gray-800">{formatDate(formData.departureDate)}</span></div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div
                            className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50"
                            style={{ animation: 'confirmSectionIn 0.4s ease-out 0.4s both' }}
                        >
                            <button
                                onClick={handleCancel}
                                className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-600 font-medium hover:bg-gray-100 transition-all duration-200 text-sm"
                            >
                                ← Kembali
                            </button>
                            <button
                                onClick={handleConfirm}
                                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold shadow-md hover:shadow-lg transition-all duration-200 text-sm"
                            >
                                Konfirmasi & Lanjutkan →
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Page Transition & Confirmation Modal Animations */}
            <style>{`
                @keyframes pageTransIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes pageTransBounce {
                    from { opacity: 0; transform: scale(0.3); }
                    to { opacity: 1; transform: scale(1); }
                }
                @keyframes pageTransSpin {
                    to { transform: rotate(360deg); }
                }
                @keyframes pageTransTextIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes pageTransPulse {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.15); opacity: 0.8; }
                }
                @keyframes pageTransContentOut {
                    to { opacity: 0; transform: scale(0.96) translateY(10px); }
                }
                @keyframes confirmOverlayIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes confirmModalIn {
                    from { opacity: 0; transform: scale(0.85) translateY(30px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                @keyframes confirmIconPop {
                    from { opacity: 0; transform: scale(0); }
                    to { opacity: 1; transform: scale(1); }
                }
                @keyframes confirmSectionIn {
                    from { opacity: 0; transform: translateY(14px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
