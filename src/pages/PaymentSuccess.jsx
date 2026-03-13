import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const formatIDR = (amount) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);

const PAYMENT_METHOD_LABEL = {
    cash: 'Cash / Tunai',
    transfer: 'Bank Transfer (Mandiri)',
    credit_card: 'Kartu Kredit',
};

export default function PaymentSuccess() {
    const location = useLocation();
    const navigate = useNavigate();
    const reservationData = location.state?.reservationData || {};
    const paymentData = location.state?.paymentData || {};
    const bookingNo = location.state?.bookingNo || '------';

    const totalNights = useMemo(() => {
        if (reservationData.arrivalDate && reservationData.departureDate) {
            const arrival = new Date(reservationData.arrivalDate);
            const departure = new Date(reservationData.departureDate);
            const diff = Math.ceil((departure - arrival) / (1000 * 60 * 60 * 24));
            return diff > 0 ? diff : 0;
        }
        return 0;
    }, [reservationData.arrivalDate, reservationData.departureDate]);

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-100 to-purple-100 animate-gradient print:bg-white print:min-h-0">

            {/* ── Success Banner (hidden on print) ── */}
            <div className="print:hidden py-10 px-4">
                <div className="max-w-2xl mx-auto text-center">
                    {/* Animated checkmark */}
                    <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-5 animate-[bounceIn_0.6s_ease-out]">
                        <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Pembayaran Berhasil! 🎉</h1>
                    <p className="text-gray-500 text-base mb-2">Reservasi Anda telah dikonfirmasi dan pembayaran berhasil diproses.</p>
                    <p className="text-sm text-gray-400">Booking No: <span className="font-bold text-blue-600 text-base">{bookingNo}</span></p>
                </div>

                {/* Quick Summary Cards */}
                <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 mb-6">
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 text-center">
                        <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Tamu</p>
                        <p className="font-bold text-gray-800">{reservationData.name || '-'}</p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 text-center">
                        <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Kamar</p>
                        <p className="font-bold text-gray-800">{reservationData.roomType || '-'} — No. {reservationData.roomNo || '-'}</p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 text-center">
                        <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Total Bayar</p>
                        <p className="font-bold text-blue-700">{formatIDR(paymentData.grandTotal || 0)}</p>
                    </div>
                </div>

                {/* Step Indicator */}
                <div className="max-w-3xl mx-auto mb-6">
                    <div className="flex items-center justify-center gap-0">
                        <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">✓</div>
                            <span className="ml-2 text-sm font-medium text-blue-600">Registrasi</span>
                        </div>
                        <div className="w-16 h-0.5 bg-blue-600 mx-3"></div>
                        <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">✓</div>
                            <span className="ml-2 text-sm font-medium text-blue-600">Pembayaran</span>
                        </div>
                        <div className="w-16 h-0.5 bg-green-500 mx-3"></div>
                        <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-sm font-bold">✓</div>
                            <span className="ml-2 text-sm font-bold text-green-600">Selesai</span>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="max-w-3xl mx-auto flex justify-center gap-4 mb-8">
                    <button
                        onClick={() => navigate('/registration')}
                        className="px-6 py-3 rounded-xl border border-gray-300 text-gray-600 font-medium hover:bg-gray-100 transition-all duration-200 text-sm"
                    >
                        ← Kembali ke Beranda
                    </button>
                    <button
                        onClick={handlePrint}
                        className="px-6 py-3 rounded-xl bg-green-600 hover:bg-green-700 active:scale-95 text-white font-bold shadow-md hover:shadow-lg transition-all duration-200 text-sm flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        Print Confirmation
                    </button>
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════
                 PRINTABLE CONFIRMATION — This section is the print output
                 ══════════════════════════════════════════════════════════════ */}
            <div id="print-area" className="max-w-3xl mx-auto bg-white p-10 md:p-14 shadow-lg print:shadow-none print:p-8 print:max-w-none print:mx-0">

                {/* Header */}
                <div className="text-center mb-8 border-b-2 border-gray-800 pb-5">
                    <div className="flex justify-center mb-3">
                        <img 
                            src="/logo.png" 
                            alt="Logo PPKD Jakarta Pusat" 
                            className="w-24 h-24 object-contain print:w-20 print:h-20"
                        />
                    </div>
                    <h1 className="text-2xl font-bold tracking-widest text-gray-900 pb-1 print:text-xl">PPKD HOTEL</h1>
                    <p className="text-xs text-gray-500">Jl. Contoh Alamat No. 123, Jakarta Pusat</p>
                </div>

                <h2 className="text-lg font-bold text-gray-800 mb-6 border-b border-gray-300 inline-block pr-10 print:text-base">Reservation Confirmation</h2>

                {/* Booking & Contact Info */}
                <div className="grid grid-cols-2 gap-x-8 gap-y-2 mb-8 text-sm print:text-xs">
                    <div className="space-y-2">
                        <div className="flex"><span className="w-32 text-gray-600 shrink-0">To.</span><span className="font-semibold">: {reservationData.name || '-'}</span></div>
                        <div className="flex"><span className="w-32 text-gray-600 shrink-0">Company / Agent</span><span className="font-medium">: {reservationData.company || '-'}</span></div>
                        <div className="flex"><span className="w-32 text-gray-600 shrink-0">Booking No.</span><span className="font-bold text-blue-700 print:text-black">: {bookingNo}</span></div>
                        <div className="flex"><span className="w-32 text-gray-600 shrink-0">Book By</span><span className="font-medium">: {reservationData.receptionist || '-'}</span></div>
                        <div className="flex"><span className="w-32 text-gray-600 shrink-0">Phone</span><span className="font-medium">: {reservationData.phone || '-'}</span></div>
                        <div className="flex"><span className="w-32 text-gray-600 shrink-0">Email</span><span className="font-medium">: {reservationData.email || '-'}</span></div>
                    </div>
                    <div className="space-y-2 text-right">
                        <div className="flex justify-end"><span className="text-gray-600 mr-2">Tanggal:</span><span className="font-medium">{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span></div>
                    </div>
                </div>

                <hr className="mb-6 border-gray-300" />

                {/* Guest & Room Details */}
                <div className="space-y-2 mb-8 text-sm print:text-xs">
                    <div className="flex"><span className="w-40 text-gray-600 shrink-0">Guest Name</span><span className="font-medium">: {reservationData.name || '-'}</span></div>
                    <div className="flex"><span className="w-40 text-gray-600 shrink-0">Nationality</span><span className="font-medium">: {reservationData.nationality || '-'}</span></div>
                    <div className="flex"><span className="w-40 text-gray-600 shrink-0">Arrival Date</span><span className="font-medium">: {formatDate(reservationData.arrivalDate)}</span></div>
                    <div className="flex"><span className="w-40 text-gray-600 shrink-0">Departure Date</span><span className="font-medium">: {formatDate(reservationData.departureDate)}</span></div>
                    <div className="flex"><span className="w-40 text-gray-600 shrink-0">Total Nights</span><span className="font-medium">: {totalNights}</span></div>
                    <div className="flex"><span className="w-40 text-gray-600 shrink-0">Room No.</span><span className="font-medium">: {reservationData.roomNo || '-'}</span></div>
                    <div className="flex"><span className="w-40 text-gray-600 shrink-0">Room Type</span><span className="font-medium">: {reservationData.roomType || '-'}</span></div>
                    <div className="flex"><span className="w-40 text-gray-600 shrink-0">No. of Rooms</span><span className="font-medium">: {reservationData.numberOfRoom || '-'}</span></div>
                    <div className="flex"><span className="w-40 text-gray-600 shrink-0">Person Pax</span><span className="font-medium">: {reservationData.numberOfPerson || '-'}</span></div>
                    <div className="flex"><span className="w-40 text-gray-600 shrink-0">Room Rate / Night</span><span className="font-medium">: {formatIDR(paymentData.roomRate || 0)}</span></div>
                </div>

                {/* ── Pricing Table ── */}
                <div className="mb-6">
                    <table className="w-full text-sm border border-gray-300 print:text-xs">
                        <thead className="bg-gray-100 print:bg-gray-200">
                            <tr>
                                <th className="text-left px-4 py-2 font-semibold text-gray-700" colSpan={2}>Rincian Biaya / Charge Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            <tr>
                                <td className="px-4 py-2 text-gray-600">
                                    {reservationData.roomType} × {paymentData.numRooms || 1} kamar × {paymentData.totalNights || totalNights} malam
                                </td>
                                <td className="px-4 py-2 text-right font-medium">{formatIDR(paymentData.subtotal || 0)}</td>
                            </tr>
                            <tr>
                                <td className="px-4 py-2 text-gray-600">PPN 11%</td>
                                <td className="px-4 py-2 text-right">{formatIDR(paymentData.tax || 0)}</td>
                            </tr>
                            <tr>
                                <td className="px-4 py-2 text-gray-600">Service Charge 5%</td>
                                <td className="px-4 py-2 text-right">{formatIDR(paymentData.serviceCharge || 0)}</td>
                            </tr>
                            <tr className="bg-gray-800 text-white print:bg-gray-900">
                                <td className="px-4 py-2 font-bold">TOTAL</td>
                                <td className="px-4 py-2 text-right font-bold text-base print:text-sm">{formatIDR(paymentData.grandTotal || 0)}</td>
                            </tr>
                        </tbody>
                    </table>
                    <div className="mt-2 text-sm text-gray-600 flex items-center gap-2 print:text-xs">
                        <span className="font-medium">Metode Pembayaran:</span>
                        <span>{PAYMENT_METHOD_LABEL[paymentData.method] || paymentData.method || '-'}</span>
                        {paymentData.method === 'transfer' && paymentData.bankRef && (
                            <span className="text-gray-400">· Ref: {paymentData.bankRef}</span>
                        )}
                        {paymentData.method === 'credit_card' && paymentData.cardHolder && (
                            <span className="text-gray-400">· {paymentData.cardHolder}</span>
                        )}
                    </div>
                </div>

                {/* Guarantee Info */}
                <div className="text-sm text-gray-700 leading-relaxed mb-6 print:text-xs">
                    <p className="mb-3">
                        Please guarantee this booking with credit card number with clear copy of the card both sides and card holder signature in the column provided.<br />
                        Please settle your outstanding to our account:
                    </p>

                    <div className="space-y-1 mb-6">
                        <p className="font-medium border-b border-gray-300 inline-block pb-1 mb-2">Bank Transfer</p>
                        <div className="flex"><span className="w-40">Mandiri Account</span><span>: 123-456-789-0</span></div>
                        <div className="flex"><span className="w-40">Mandiri Name Account</span><span>: PPKD HOTEL</span></div>
                    </div>

                    <hr className="mb-6 border-gray-300" />
                    <p className="font-medium mb-3">Reservation guaranteed by the following credit card:</p>

                    <div className="space-y-2 w-2/3 print:w-full">
                        <div className="flex justify-between border-b border-gray-300 pb-1">
                            <span className="text-gray-600">Card Number</span><span>: {paymentData.method === 'credit_card' && paymentData.cardNumber ? paymentData.cardNumber : '________________'}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-300 pb-1">
                            <span className="text-gray-600">Card Holder Name</span><span>: {paymentData.method === 'credit_card' && paymentData.cardHolder ? paymentData.cardHolder : '________________'}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-300 pb-1">
                            <span className="text-gray-600">Expired Date</span><span>: {paymentData.method === 'credit_card' && paymentData.cardExpiry ? paymentData.cardExpiry : '________________'}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-300 pb-1">
                            <span className="text-gray-600">Or by Bank Transfer to</span><span>:</span>
                        </div>
                        <div className="flex justify-between mt-6">
                            <span className="text-gray-600">Card holder signature</span>
                            <div className="w-48 border-b-2 border-gray-400 print:w-36"></div>
                        </div>
                    </div>
                </div>

                <hr className="mb-4 border-gray-300" />

                {/* Cancellation Policy */}
                <div className="text-xs text-gray-600 print:text-[10px]">
                    <p className="font-medium mb-2 underline">Cancellation policy:</p>
                    <ol className="list-decimal pl-4 space-y-1">
                        <li>Please note that check in time is 02.00 pm and check out time 12.00 pm.</li>
                        <li>All non guaranteed reservations will automatically be released on 6 pm.</li>
                        <li>The Hotel will charge 1 night for guaranteed reservations that have not been cancelled before the day of arrival.</li>
                    </ol>
                </div>

                <div className="mt-14 text-right print:mt-10">
                    <div className="inline-block w-48 border-b-2 border-gray-800"></div>
                    <p className="text-xs text-gray-500 mt-2 mr-10">Authorized Signature</p>
                </div>
            </div>

            {/* Bottom spacer for screen view */}
            <div className="h-10 print:hidden"></div>
        </div>
    );
}
