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
        // Navigate to confirmation page, passing formData in state
        navigate('/confirmation', { state: { reservationData: formData } });
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto glass-panel rounded-2xl shadow-xl overflow-hidden">

                {/* Header Section */}
                <div className="bg-blue-600 px-6 py-8 text-center text-white">
                    <div className="flex justify-center mb-4">
                        {/* Placeholder for Logo */}
                        <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border-2 border-white/40">
                            <span className="text-2xl font-bold">Logo</span>
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">PPKD HOTEL</h1>
                    <p className="mt-2 text-blue-100 text-lg">Formulir Pendaftaran / Registration</p>
                </div>

                {/* Form Section */}
                <form onSubmit={handleSubmit} className="p-8">

                    {/* Top Section - Room Details */}
                    <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100 mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Room No.</label>
                                <input type="text" name="roomNo" value={formData.roomNo} onChange={handleChange} className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border bg-white" placeholder="e.g. 0601, 0602" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Jumlah Kamar / No. of Room</label>
                                <input type="number" name="numberOfRoom" value={formData.numberOfRoom} onChange={handleChange} className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border bg-white" />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Jumlah Tamu / No. of Person</label>
                                <input type="number" name="numberOfPerson" value={formData.numberOfPerson} onChange={handleChange} className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border bg-white" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Jenis Kamar / Room Type</label>
                                    <select name="roomType" value={formData.roomType} onChange={handleChange} className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border bg-white">
                                        <option value="">Select Type</option>
                                        <option value="Standard">Standard</option>
                                        <option value="Deluxe">Deluxe</option>
                                        <option value="Suite">Suite</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Receptionist</label>
                                    <input type="text" name="receptionist" value={formData.receptionist} onChange={handleChange} className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border bg-white" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="text-center mb-8 pb-4 border-b border-gray-200">
                        <p className="font-medium text-gray-800 text-lg">Check Out Time : 12.00 Noon</p>
                        <p className="text-gray-600">Waktu Lapor Keluar : Jam 12.00 Siang</p>
                        <p className="text-sm text-gray-500 mt-2 italic">Harap tulis dengan huruf cetak — Please print in block letters</p>
                    </div>

                    {/* Guest Details Section */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">

                        {/* Left Column (Span 8) */}
                        <div className="md:col-span-8 space-y-5 border-r md:pr-6 border-transparent md:border-gray-200">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Nama / Name</label>
                                <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border bg-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Pekerjaan / Profession</label>
                                <input type="text" name="profession" value={formData.profession} onChange={handleChange} className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border bg-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Perusahaan / Company</label>
                                <input type="text" name="company" value={formData.company} onChange={handleChange} className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border bg-white" />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Kebangsaan / Nationality</label>
                                    <input type="text" name="nationality" value={formData.nationality} onChange={handleChange} className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border bg-white" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">No. KTP/Passport</label>
                                    <input type="text" name="passportNo" value={formData.passportNo} onChange={handleChange} className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border bg-white" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Tanggal Lahir / Birth Date</label>
                                    <input type="date" name="birthDate" value={formData.birthDate} onChange={handleChange} className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border bg-white" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Alamat / Address</label>
                                    <textarea name="address" value={formData.address} onChange={handleChange} rows="3" className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border bg-white"></textarea>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Telephone / HP</label>
                                        <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border bg-white" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                                        <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border bg-white" />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">No. Member / Member No.</label>
                                <input type="text" name="memberNo" value={formData.memberNo} onChange={handleChange} className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border bg-white" />
                            </div>
                        </div>

                        {/* Right Column (Span 4) */}
                        <div className="md:col-span-4 space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Waktu Kedatangan / Arrival Time</label>
                                <input type="time" name="arrivalTime" value={formData.arrivalTime} onChange={handleChange} className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border bg-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Tanggal Kedatangan / Arrival Date</label>
                                <input type="date" name="arrivalDate" value={formData.arrivalDate} onChange={handleChange} required className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border bg-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-red-600 mb-1">Tgl Keberangkatan / Departure Date</label>
                                <input type="date" name="departureDate" value={formData.departureDate} onChange={handleChange} required className="w-full rounded-lg border-red-300 shadow-sm focus:border-red-500 focus:ring-red-500 px-4 py-2 border bg-red-50" />
                            </div>
                        </div>

                    </div>

                    {/* Bottom Section - Deposit */}
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Nomor Kotak Deposit / Safety Box No.</label>
                            <input type="text" name="safetyDepositBoxNumber" value={formData.safetyDepositBoxNumber} onChange={handleChange} className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border bg-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Dikeluarkan oleh / Issued by</label>
                            <input type="text" name="issuedBy" value={formData.issuedBy} onChange={handleChange} className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border bg-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Tanggal / Date</label>
                            <input type="date" name="issuedDate" value={formData.issuedDate} onChange={handleChange} className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border bg-white" />
                        </div>
                    </div>

                    <div className="flex justify-end pt-6 border-t border-gray-200">
                        <button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:shadow-xl transition duration-200 ease-in-out transform hover:-translate-y-1"
                        >
                            Submit Registration & Generate Invoice
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
