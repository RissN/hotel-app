import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const ROOM_PRICES = {
    Standard: 1500000,
    Deluxe: 2500000,
    Suite: 4000000,
};

const PAYMENT_METHODS = [
    { id: 'cash', label: 'Cash', icon: '💵' },
    { id: 'transfer', label: 'Bank Transfer', icon: '🏦' },
    { id: 'credit_card', label: 'Kartu Kredit', icon: '💳' },
];

const formatIDR = (amount) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);

export default function PaymentPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const reservationData = location.state?.reservationData || {};

    const [selectedMethod, setSelectedMethod] = useState('cash');
    const [cardNumber, setCardNumber] = useState('');
    const [cardHolder, setCardHolder] = useState('');
    const [cardExpiry, setCardExpiry] = useState('');
    const [bankRef, setBankRef] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const roomRate = ROOM_PRICES[reservationData.roomType] || 0;

    const totalNights = useMemo(() => {
        if (reservationData.arrivalDate && reservationData.departureDate) {
            const arrival = new Date(reservationData.arrivalDate);
            const departure = new Date(reservationData.departureDate);
            const diff = Math.ceil((departure - arrival) / (1000 * 60 * 60 * 24));
            return diff > 0 ? diff : 0;
        }
        return 0;
    }, [reservationData.arrivalDate, reservationData.departureDate]);

    const numRooms = parseInt(reservationData.numberOfRoom) || 1;
    const subtotal = roomRate * numRooms * totalNights;
    const tax = Math.round(subtotal * 0.11);
    const serviceCharge = Math.round(subtotal * 0.05);
    const grandTotal = subtotal + tax + serviceCharge;

    const handleConfirm = async () => {
        setIsProcessing(true);
        const bookingNo = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');

        const paymentData = {
            method: selectedMethod,
            roomRate,
            totalNights,
            numRooms,
            subtotal,
            tax,
            serviceCharge,
            grandTotal,
            cardNumber: selectedMethod === 'credit_card' ? cardNumber : '',
            cardHolder: selectedMethod === 'credit_card' ? cardHolder : '',
            cardExpiry: selectedMethod === 'credit_card' ? cardExpiry : '',
            bankRef: selectedMethod === 'transfer' ? bankRef : '',
        };

        try {
            // Mapping for Supabase insertion
            const transactionRecord = {
                booking_no: bookingNo,
                guest_name: reservationData.name,
                email: reservationData.email,
                phone: reservationData.phone,
                room_no: reservationData.roomNo,
                room_type: reservationData.roomType,
                number_of_rooms: numRooms,
                number_of_persons: parseInt(reservationData.numberOfPerson) || 1,
                arrival_date: reservationData.arrivalDate,
                departure_date: reservationData.departureDate,
                total_nights: totalNights,
                room_rate: roomRate,
                subtotal: subtotal,
                tax: tax,
                service_charge: serviceCharge,
                grand_total: grandTotal,
                payment_method: selectedMethod,
                payment_ref: selectedMethod === 'transfer' ? bankRef : (selectedMethod === 'credit_card' ? 'CREDIT_CARD' : ''),
                nationality: reservationData.nationality,
                company: reservationData.company,
                receptionist: reservationData.receptionist
            };

            const { error } = await supabase
                .from('transactions')
                .insert([transactionRecord]);

            if (error) {
                console.error('Error inserting to Supabase:', error);
                alert(`Gagal menyimpan transaksi: ${error.message}\nPastikan tabel "transactions" sudah dibuat di Supabase sesuai dengan schema yang diperlukan.`);
                setIsProcessing(false);
                return;
            }

            // Navigate to success page with data
            navigate('/payment-success', { state: { reservationData, paymentData, bookingNo } });

        } catch (err) {
            console.error('Unexpected error:', err);
            alert('Terjadi kesalahan yang tidak terduga saat memproses pembayaran.');
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-100 py-10 px-4">

            {/* Step Indicator */}
            <div className="max-w-3xl mx-auto mb-8">
                <div className="flex items-center justify-center gap-0">
                    {/* Step 1 */}
                    <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">✓</div>
                        <span className="ml-2 text-sm font-medium text-blue-600">Registrasi</span>
                    </div>
                    <div className="w-16 h-0.5 bg-blue-600 mx-3"></div>
                    {/* Step 2 */}
                    <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">2</div>
                        <span className="ml-2 text-sm font-bold text-blue-700">Pembayaran</span>
                    </div>
                    <div className="w-16 h-0.5 bg-gray-300 mx-3"></div>
                    {/* Step 3 */}
                    <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm font-bold">3</div>
                        <span className="ml-2 text-sm font-medium text-gray-400">Konfirmasi</span>
                    </div>
                </div>
            </div>

            <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-6">

                {/* ── Left: Payment Method ── */}
                <div className="md:col-span-3 space-y-5">

                    {/* Metode Pembayaran */}
                    <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-blue-600 mb-4">Metode Pembayaran</h2>
                        <div className="grid grid-cols-3 gap-3 mb-6">
                            {PAYMENT_METHODS.map((m) => (
                                <button
                                    key={m.id}
                                    type="button"
                                    onClick={() => setSelectedMethod(m.id)}
                                    className={`flex flex-col items-center justify-center py-4 px-3 rounded-xl border-2 transition-all duration-150 text-sm font-semibold gap-2 ${
                                        selectedMethod === m.id
                                            ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                                            : 'border-gray-200 bg-white text-gray-500 hover:border-blue-300 hover:text-blue-600'
                                    }`}
                                >
                                    <span className="text-2xl">{m.icon}</span>
                                    <span>{m.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Cash */}
                        {selectedMethod === 'cash' && (
                            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800">
                                <p className="font-semibold mb-1">💵 Pembayaran Tunai</p>
                                <p>Harap siapkan uang tunai sebesar <strong>{formatIDR(grandTotal)}</strong> saat check-in.</p>
                            </div>
                        )}

                        {/* Bank Transfer */}
                        {selectedMethod === 'transfer' && (
                            <div className="space-y-4">
                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm">
                                    <p className="font-semibold text-blue-800 mb-2">🏦 Informasi Rekening</p>
                                    <div className="space-y-1 text-gray-700">
                                        <div className="flex justify-between"><span>Bank</span><span className="font-medium">Bank Mandiri</span></div>
                                        <div className="flex justify-between"><span>No. Rekening</span><span className="font-medium">123-456-789-0</span></div>
                                        <div className="flex justify-between"><span>Atas Nama</span><span className="font-medium">PPKD Hotel</span></div>
                                        <div className="flex justify-between"><span>Jumlah Transfer</span><span className="font-bold text-blue-700">{formatIDR(grandTotal)}</span></div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">No. Referensi Transfer (Opsional)</label>
                                    <input
                                        type="text"
                                        value={bankRef}
                                        onChange={(e) => setBankRef(e.target.value)}
                                        placeholder="Contoh: TRF20260311"
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Credit Card */}
                        {selectedMethod === 'credit_card' && (
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Nomor Kartu</label>
                                    <input
                                        type="text"
                                        value={cardNumber}
                                        onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim())}
                                        placeholder="0000 0000 0000 0000"
                                        maxLength={19}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono tracking-widest focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Nama Pemegang Kartu</label>
                                    <input
                                        type="text"
                                        value={cardHolder}
                                        onChange={(e) => setCardHolder(e.target.value)}
                                        placeholder="Sesuai nama di kartu"
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Expired Date (MM/YY)</label>
                                    <input
                                        type="text"
                                        value={cardExpiry}
                                        onChange={(e) => {
                                            let val = e.target.value.replace(/\D/g, '').slice(0, 4);
                                            if (val.length > 2) val = val.slice(0, 2) + '/' + val.slice(2);
                                            setCardExpiry(val);
                                        }}
                                        placeholder="MM/YY"
                                        maxLength={5}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-between items-center">
                        <button
                            type="button"
                            onClick={() => navigate('/', { state: { reservationData } })}
                            disabled={isProcessing}
                            className={`text-sm font-medium flex items-center gap-1 transition ${isProcessing ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:text-blue-800'}`}
                        >
                            ← Kembali ke Form
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirm}
                            disabled={isProcessing}
                            className={`font-bold py-3 px-8 rounded-xl shadow-md transition-all duration-150 ${
                                isProcessing 
                                ? 'bg-blue-400 cursor-not-allowed justify-center flex items-center gap-2 text-white' 
                                : 'bg-blue-600 hover:bg-blue-700 active:scale-95 text-white hover:shadow-lg'
                            }`}
                        >
                            {isProcessing ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Memproses...
                                </>
                            ) : (
                                "Konfirmasi Pembayaran →"
                            )}
                        </button>
                    </div>
                </div>

                {/* ── Right: Order Summary ── */}
                <div className="md:col-span-2">
                    <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 sticky top-6">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-blue-600 mb-4">Ringkasan Booking</h2>

                        {/* Guest & Room Info */}
                        <div className="space-y-2 text-sm text-gray-700 mb-5 pb-5 border-b border-gray-100">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Tamu</span>
                                <span className="font-semibold text-right max-w-[60%] truncate">{reservationData.name || '—'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Kamar</span>
                                <span className="font-medium">{reservationData.roomNo || '—'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Tipe</span>
                                <span className="font-medium">{reservationData.roomType || '—'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Check-in</span>
                                <span className="font-medium">{reservationData.arrivalDate || '—'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Check-out</span>
                                <span className="font-medium">{reservationData.departureDate || '—'}</span>
                            </div>
                        </div>

                        {/* Price Breakdown */}
                        <div className="space-y-2 text-sm mb-4">
                            <div className="flex justify-between text-gray-600">
                                <span>Harga per malam</span>
                                <span>{roomRate ? formatIDR(roomRate) : '—'}</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>{numRooms} kamar × {totalNights} malam</span>
                                <span>{roomRate ? formatIDR(subtotal) : '—'}</span>
                            </div>
                            <div className="flex justify-between text-gray-500 text-xs">
                                <span>PPN 11%</span>
                                <span>{formatIDR(tax)}</span>
                            </div>
                            <div className="flex justify-between text-gray-500 text-xs">
                                <span>Service Charge 5%</span>
                                <span>{formatIDR(serviceCharge)}</span>
                            </div>
                        </div>

                        {/* Total */}
                        <div className="bg-blue-600 rounded-xl px-4 py-3 flex justify-between items-center">
                            <span className="text-white font-semibold text-sm">Total</span>
                            <span className="text-white font-bold text-base">{formatIDR(grandTotal)}</span>
                        </div>

                        {!reservationData.roomType && (
                            <p className="text-xs text-amber-600 mt-3 text-center">⚠ Tipe kamar belum dipilih di form</p>
                        )}
                        {totalNights === 0 && (
                            <p className="text-xs text-amber-600 mt-1 text-center">⚠ Tanggal menginap belum valid</p>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
