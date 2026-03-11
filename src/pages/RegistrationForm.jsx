import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function RegistrationForm() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        roomNo: '',
        numberOfPerson: '',
        numberOfRoom: '',
        roomType: '',
        receptionist: '',
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
        issuedBy: '',
        issuedDate: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        navigate('/payment', { state: { reservationData: formData } });
    };

    const inputClass = "w-full rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 px-3 py-2 bg-white text-sm transition";
    const labelClass = "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1";

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-100 py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto rounded-2xl shadow-2xl overflow-hidden border border-gray-200 bg-white">

                {/* Header */}
                <div className="bg-gradient-to-r from-blue-700 to-blue-500 px-8 py-8 text-center text-white">
                    <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border-2 border-white/40">
                            <span className="text-lg font-bold tracking-tight">LOGO</span>
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">PPKD HOTEL</h1>
                    <p className="mt-1 text-blue-100 text-base">Formulir Pendaftaran / Registration Form</p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-8">

                    {/* ── Section 1: Room Details ── */}
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
                        <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-4">Informasi Kamar / Room Details</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                                    <option value="Standard">Standard</option>
                                    <option value="Deluxe">Deluxe</option>
                                    <option value="Suite">Suite</option>
                                </select>
                            </div>
                            <div className="col-span-2 md:col-span-2">
                                <label className={labelClass}>Receptionist</label>
                                <input type="text" name="receptionist" value={formData.receptionist} onChange={handleChange}
                                    className={inputClass} />
                            </div>
                            <div className="col-span-2 md:col-span-2 flex items-end">
                                <div className="w-full bg-white border border-blue-200 rounded-lg px-4 py-2 text-center">
                                    <p className="text-xs text-gray-500 uppercase tracking-wide">Check-Out Time</p>
                                    <p className="text-sm font-bold text-blue-700">12.00 Noon / Jam 12.00 Siang</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Instruction note */}
                    <p className="text-center text-xs text-gray-400 italic -mt-4">
                        Harap tulis dengan huruf cetak — Please print in block letters
                    </p>

                    {/* ── Section 2: Guest Details ── */}
                    <div>
                        <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-4">Data Tamu / Guest Information</h2>

                        {/* Row 1: Name */}
                        <div className="mb-4">
                            <label className={labelClass}>Nama / Name</label>
                            <input type="text" name="name" value={formData.name} onChange={handleChange}
                                required className={inputClass} />
                        </div>

                        {/* Row 2: Profession + Company */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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

                        {/* Row 3: Nationality + Passport + Birth Date */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
                            <div>
                                <label className={labelClass}>Tanggal Lahir / Birth Date</label>
                                <input type="date" name="birthDate" value={formData.birthDate} onChange={handleChange}
                                    className={inputClass} />
                            </div>
                        </div>

                        {/* Row 4: Address + Phone + Email */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="md:col-span-1">
                                <label className={labelClass}>Alamat / Address</label>
                                <textarea name="address" value={formData.address} onChange={handleChange}
                                    rows="3" className={inputClass}></textarea>
                            </div>
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

                        {/* Row 5: Member No. */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                                <label className={labelClass}>No. Member / Member No.</label>
                                <input type="text" name="memberNo" value={formData.memberNo} onChange={handleChange}
                                    className={inputClass} />
                            </div>
                        </div>
                    </div>

                    {/* ── Section 3: Dates ── */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                        <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-4">Tanggal Menginap / Stay Dates</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                            <div>
                                <label className={labelClass}>Arrival Time</label>
                                <input type="time" name="arrivalTime" value={formData.arrivalTime} onChange={handleChange}
                                    className={inputClass} />
                            </div>
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

                    {/* ── Section 4: Safety Deposit Box ── */}
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                        <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-4">Kotak Deposit / Safety Deposit Box</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className={labelClass}>Nomor Kotak / Box No.</label>
                                <input type="text" name="safetyDepositBoxNumber" value={formData.safetyDepositBoxNumber}
                                    onChange={handleChange} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Dikeluarkan Oleh / Issued By</label>
                                <input type="text" name="issuedBy" value={formData.issuedBy} onChange={handleChange}
                                    className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Tanggal / Date</label>
                                <input type="date" name="issuedDate" value={formData.issuedDate} onChange={handleChange}
                                    className={inputClass} />
                            </div>
                        </div>
                    </div>

                    {/* ── Submit ── */}
                    <div className="flex justify-end pt-4 border-t border-gray-100">
                        <button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold py-3 px-10 rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
                        >
                            Submit &amp; Generate Invoice →
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
