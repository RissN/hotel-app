import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const formatIDR = (amount) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);

const PAYMENT_METHOD_LABEL = {
    cash: 'Cash / Tunai',
    transfer: 'Bank Transfer (Mandiri)',
    credit_card: 'Kartu Kredit',
    ewallet: 'E-Wallet',
};

const parsePaymentRef = (refStr, method) => {
    if (!refStr) return { code: '-' };
    if (refStr.startsWith('JSON:')) {
        try { 
            const parsed = JSON.parse(refStr.substring(5)); 
            parsed.code = parsed.paymentCode || '-';
            return parsed;
        } catch (e) { return { code: refStr }; }
    }
    // Backward compatibility for old print layouts
    if (method === 'credit_card' && refStr.startsWith('CC|')) {
        const parts = refStr.split('|');
        return { code: '-', cardNumber: parts[1], cardHolder: parts[2], cardExpiry: parts[3] };
    }
    if (method === 'ewallet' && refStr.includes(' - ')) {
        const parts = refStr.split(' - ');
        return { code: '-', ewalletProvider: parts[0], ewalletPhone: parts[1] };
    }
    return { code: refStr, bankRef: refStr }; // old transfer
};

const maskCardNumber = (cardNumber) => {
    if (!cardNumber) return '-';
    const cleanNum = cardNumber.replace(/\s|-/g, '');
    if (cleanNum.length <= 4) return cardNumber;
    const last4 = cleanNum.slice(-4);
    const masked = cleanNum.slice(0, -4).replace(/./g, '*') + last4;
    return masked.replace(/(.{4})/g, '$1 ').trim();
};

const maskPhoneNumber = (phone) => {
    if (!phone) return '-';
    const cleanNum = phone.replace(/\s|-/g, '');
    if (cleanNum.length <= 4) return phone;
    const first4 = cleanNum.slice(0, 4);
    const last2 = cleanNum.slice(-2);
    const middleLength = cleanNum.length - 6;
    return `${first4}${'*'.repeat(middleLength > 0 ? middleLength : 4)}${last2}`;
};

export default function PaymentSuccess() {
    const location = useLocation();
    const navigate = useNavigate();
    const successData = location.state || JSON.parse(sessionStorage.getItem('paymentSuccessData') || '{}');
    const reservationData = successData.reservationData || {};
    const paymentData = successData.paymentData || {};
    const bookingNo = successData.bookingNo || '------';

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

    const pData = useMemo(() => {
        // Fallback for PaymentSuccess if the user navigated immediately:
        // Inside PaymentPage, `paymentData` is passed directly in location.state
        // If there's `paymentCode` already there, use it directly alongside the data.
        if (paymentData?.paymentCode) {
            return {
                code: paymentData.paymentCode,
                cardNumber: paymentData.cardNumber,
                cardHolder: paymentData.cardHolder,
                cardExpiry: paymentData.cardExpiry,
                bankRef: paymentData.bankRef,
                ewalletProvider: paymentData.ewalletProvider,
                ewalletPhone: paymentData.ewalletPhone,
            };
        }
        return parsePaymentRef(paymentData?.paymentRef, paymentData?.method);
    }, [paymentData]);

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
                        onClick={() => window.location.href = '/rooms'}
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
            <div id="print-area" className="max-w-3xl mx-auto bg-white p-10 md:p-14 shadow-lg print:shadow-none print:p-0 print:max-w-none print:mx-0">

                {/* Header */}
                <div className="text-center mb-4 border-b-2 border-gray-800 pb-3">
                    <div className="flex justify-center mb-1">
                        <img 
                            src="/logo.png" 
                            alt="Logo PPKD Jakarta Pusat" 
                            className="w-16 h-16 object-contain print:w-14 print:h-14"
                        />
                    </div>
                    <h1 className="text-xl font-bold tracking-widest text-gray-900 pb-0.5 print:text-[16px]">PPKD HOTEL</h1>
                    <p className="text-[10px] text-gray-500">Jl. Contoh Alamat No. 123, Jakarta Pusat</p>
                </div>

                <h2 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-300 inline-block pr-10 print:text-[14px]">Reservation Confirmation</h2>

                {/* Booking & Contact Info */}
                <div className="grid grid-cols-2 gap-x-8 gap-y-1 mb-4 text-[11px] print:text-[10px]">
                    <div className="space-y-1">
                        <div className="flex"><span className="w-28 text-gray-800 shrink-0">To.</span><span className="font-bold">: {reservationData.name || '-'}</span></div>
                        <div className="flex"><span className="w-28 text-gray-800 shrink-0">Company / Agent</span><span className="font-medium">: {reservationData.company || 'PPKD JP'}</span></div>
                        <div className="flex"><span className="w-28 text-gray-800 shrink-0">Booking No.</span><span className="font-medium">: {bookingNo}</span></div>
                        <div className="flex"><span className="w-28 text-gray-800 shrink-0">Book By</span><span className="font-medium">: {reservationData.receptionist || 'Resepsionis'} (Hotel)</span></div>
                        <div className="flex"><span className="w-28 text-gray-800 shrink-0">Phone</span><span className="font-medium">: {reservationData.phone || '-'}</span></div>
                        <div className="flex flex-wrap"><span className="w-28 text-gray-800 shrink-0">Email</span><span className="text-blue-600 underline">: {reservationData.email || '-'}</span></div>
                    </div>
                    <div className="space-y-1">
                        <div className="flex"><span className="w-20 text-gray-800 shrink-0">Telp</span><span className="font-medium">: (021) 1234567</span></div>
                        <div className="flex"><span className="w-20 text-gray-800 shrink-0">Fax</span><span className="font-medium">: (021) 7654321</span></div>
                        <div className="flex flex-wrap"><span className="w-20 text-gray-800 shrink-0">Email</span><span className="text-blue-600 underline">: info@ppkdhotel.com</span></div>
                        <div className="flex"><span className="w-20 text-gray-800 shrink-0">Date</span><span className="font-medium">: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span></div>
                    </div>
                </div>

                <div className="border-b border-gray-900 w-full mb-4" />

                {/* Guest & Room Details */}
                <div className="space-y-1.5 text-[11px] mb-4 print:text-[10px]">
                    <div className="flex"><span className="w-32 text-gray-800 shrink-0">First Name</span><span className="font-bold uppercase">: {reservationData.name || '-'}</span></div>
                    <div className="flex"><span className="w-32 text-gray-800 shrink-0">Arrival Date</span><span className="font-bold">: {reservationData.arrivalDate ? new Date(reservationData.arrivalDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</span></div>
                    <div className="flex"><span className="w-32 text-gray-800 shrink-0">Departure Date</span><span className="font-bold">: {reservationData.departureDate ? new Date(reservationData.departureDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</span></div>
                    <div className="flex"><span className="w-32 text-gray-800 shrink-0">Total Night</span><span className="font-medium">: {totalNights} Malam (Nights)</span></div>
                    <div className="flex"><span className="w-32 text-gray-800 shrink-0">Room/Unit Type</span><span className="font-medium">: {reservationData.roomNo ? `Kamar ${reservationData.roomNo}` : ''} ({reservationData.roomType || '-'})</span></div>
                    <div className="flex"><span className="w-32 text-gray-800 shrink-0">Person Pax</span><span className="font-medium">: {reservationData.numberOfPerson || '-'} Orang (Person)</span></div>
                    <div className="flex mt-1.5"><span className="w-32 text-red-600 shrink-0">Room Rate Net</span><span className="font-bold text-red-600">: {paymentData ? formatIDR(paymentData.roomRate || 0) : 'Rp -'} / Malam</span></div>
                </div>

                {/* Guarantee Info Box */}
                <div className="border border-gray-400 bg-[#fafafa] px-3 py-2.5 text-[10px] print:text-[9px] text-gray-800 leading-relaxed mb-4 rounded-sm">
                    <p className="mb-2">
                        Please guarantee this booking with credit card number with clear copy of the card both sides and card holder signature in the column provided the copy of credit card both sides should be faxed to hotel fax number.
                    </p>
                    <p className="font-bold text-red-700 mb-3">Please settle your outstanding to or account:</p>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="border-l-[3px] border-blue-400 pl-2">
                            <p className="font-bold text-gray-900 mb-0.5">Bank Transfer</p>
                            <p className="mb-2">Bank Mandiri (Cab. Jakarta)</p>
                            
                            <p className="font-bold text-gray-900 mb-0.5">Mandiri Name Account</p>
                            <p>PPKD HOTEL JAKARTA PUSAT</p>
                        </div>
                        <div>
                            <p className="font-bold text-gray-900 mb-0.5">Mandiri Account</p>
                            <p className="font-mono text-[10px]">123-00-9876543-2</p>
                        </div>
                    </div>
                </div>

                {/* Dynamic Payment Method Section */}
                {paymentData?.method === 'credit_card' && (
                    <div className="border border-gray-300 bg-[#f9fafb] px-3 py-2.5 text-[10px] mb-4 rounded-sm print:text-[9px]">
                        <p className="font-bold text-[11px] text-gray-900 mb-2 print:text-[10px]">💳 Pembayaran via Kartu Kredit</p>
                        <div className="space-y-1">
                            <div className="flex"><span className="w-36 text-gray-500 shrink-0">Ref. Pembayaran</span><span className="font-bold text-gray-900">: {pData.code || '-'}</span></div>
                            <div className="flex"><span className="w-36 text-gray-500 shrink-0">Card Number</span><span className="font-semibold">: {maskCardNumber(pData.cardNumber)}</span></div>
                            <div className="flex"><span className="w-36 text-gray-500 shrink-0">Card Holder</span><span className="font-semibold">: {pData.cardHolder || '-'}</span></div>
                            <div className="flex"><span className="w-36 text-gray-500 shrink-0">Expired</span><span className="font-semibold">: {pData.cardExpiry || '-'}</span></div>
                            <div className="flex"><span className="w-36 text-gray-500 shrink-0">Jumlah Pembayaran</span><span className="font-bold text-red-600">: {formatIDR(paymentData.grandTotal || 0)}</span></div>
                        </div>
                    </div>
                )}

                {paymentData?.method === 'transfer' && (
                    <div className="border border-gray-300 bg-[#f9fafb] px-3 py-2.5 text-[10px] mb-4 rounded-sm print:text-[9px]">
                        <p className="font-bold text-[11px] text-gray-900 mb-2 print:text-[10px]">🏦 Pembayaran via Bank Transfer</p>
                        <div className="space-y-1">
                            <div className="flex"><span className="w-36 text-gray-500 shrink-0">Ref. Pembayaran</span><span className="font-bold text-gray-900">: {pData.code || '-'}</span></div>
                            <div className="flex"><span className="w-36 text-gray-500 shrink-0">Bank</span><span className="font-semibold">: Bank Mandiri (Cab. Jakarta)</span></div>
                            <div className="flex"><span className="w-36 text-gray-500 shrink-0">No. Rekening</span><span className="font-semibold">: 123-00-9876543-2</span></div>
                            <div className="flex"><span className="w-36 text-gray-500 shrink-0">Atas Nama</span><span className="font-semibold">: PPKD HOTEL JAKARTA PUSAT</span></div>
                            <div className="flex"><span className="w-36 text-gray-500 shrink-0">Jumlah Transfer</span><span className="font-bold text-red-600">: {formatIDR(paymentData.grandTotal || 0)}</span></div>
                            {pData.bankRef && pData.bankRef !== pData.code && (
                                <div className="flex"><span className="w-36 text-gray-500 shrink-0">Berita Acara</span><span className="font-semibold">: {pData.bankRef}</span></div>
                            )}
                        </div>
                    </div>
                )}

                {paymentData?.method === 'ewallet' && (
                    <div className="border border-gray-300 bg-[#f9fafb] px-3 py-2.5 text-[10px] mb-4 rounded-sm print:text-[9px]">
                        <p className="font-bold text-[11px] text-gray-900 mb-2 print:text-[10px]">📱 Pembayaran via E-Wallet</p>
                        <div className="space-y-1">
                            <div className="flex"><span className="w-36 text-gray-500 shrink-0">Ref. Pembayaran</span><span className="font-bold text-gray-900">: {pData.code || '-'}</span></div>
                            <div className="flex"><span className="w-36 text-gray-500 shrink-0">Provider</span><span className="font-semibold">: {(pData.ewalletProvider || '-').toUpperCase()}</span></div>
                            <div className="flex"><span className="w-36 text-gray-500 shrink-0">No. HP / E-Wallet</span><span className="font-semibold">: {maskPhoneNumber(pData.ewalletPhone)}</span></div>
                            <div className="flex"><span className="w-36 text-gray-500 shrink-0">Jumlah Pembayaran</span><span className="font-bold text-red-600">: {formatIDR(paymentData.grandTotal || 0)}</span></div>
                        </div>
                    </div>
                )}

                {paymentData?.method === 'cash' && (
                    <div className="border border-gray-300 bg-[#f9fafb] px-3 py-2.5 text-[10px] mb-4 rounded-sm print:text-[9px]">
                        <p className="font-bold text-[11px] text-gray-900 mb-2 print:text-[10px]">💵 Pembayaran Tunai (Cash)</p>
                        <div className="space-y-1">
                            <div className="flex"><span className="w-36 text-gray-500 shrink-0">Metode</span><span className="font-semibold">: Dibayar tunai saat check-in</span></div>
                            <div className="flex"><span className="w-36 text-gray-500 shrink-0">Jumlah Pembayaran</span><span className="font-bold text-red-600">: {formatIDR(paymentData.grandTotal || 0)}</span></div>
                        </div>
                    </div>
                )}

                {!paymentData?.method && (
                    <div className="text-[11px] mb-4 print:text-[10px]">
                        <p className="mb-2 text-gray-800">Reservation guaranteed by the following credit card:</p>
                        <div className="space-y-2 w-3/4">
                            <div className="flex items-center">
                                <span className="w-40 text-gray-800 shrink-0 whitespace-nowrap">Card Number</span>
                                <span className="mr-2">:</span>
                                <div className="flex-1 border-b border-gray-500 min-w-0" />
                            </div>
                            <div className="flex items-center">
                                <span className="w-40 text-gray-800 shrink-0 whitespace-nowrap">Card Holder name</span>
                                <span className="mr-2">:</span>
                                <div className="flex-1 border-b border-gray-500 min-w-0" />
                            </div>
                        </div>
                        <div className="flex items-end mt-4 w-3/4">
                            <span className="w-40 text-gray-800 shrink-0 whitespace-nowrap">Card holder signature</span>
                            <span className="mr-2">:</span>
                            <div className="flex-1 border-b border-gray-500 min-w-0" />
                        </div>
                    </div>
                )}

                {/* Cancellation Policy */}
                <div className="bg-[#f2f2f2] px-3 py-2 text-[9px] print:text-[8px] text-gray-700">
                    <p className="font-bold mb-0.5 underline text-gray-900">Cancellation policy:</p>
                    <ol className="list-decimal pl-3 space-y-0.5">
                        <li>Please note that check in time is 02.00 pm and check out time 12.00 pm.</li>
                        <li>All non guaranteed reservations will automatically be released on 6 pm.</li>
                        <li>The Hotel will charge 1 night for guaranteed reservations that have not been canceling before the day of arrival. Please carefully note your cancellation number.</li>
                    </ol>
                </div>
            </div>

            {/* Global Print Styles (Same as Reservation Confirmation) */}
            <style dangerouslySetInnerHTML={{__html: `
                @media print {
                    @page { margin: 0; size: A4 portrait; }
                    body { margin: 0; padding: 0.5cm; }
                }
            `}} />

            {/* Bottom spacer for screen view */}
            <div className="h-10 print:hidden"></div>
        </div>
    );
}
