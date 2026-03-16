import { useMemo, useState } from 'react';
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

export default function ReservationConfirmation() {
    const location = useLocation();
    const navigate = useNavigate();
    const reservationData = location.state?.reservationData || {};
    const paymentData = location.state?.paymentData || null;

    const [bookingNo] = useState(() => 
        Math.floor(Math.random() * 1000000).toString().padStart(6, '0')
    );

    // Calculate total nights automatically
    const totalNights = useMemo(() => {
        if (reservationData.arrivalDate && reservationData.departureDate) {
            const arrival = new Date(reservationData.arrivalDate);
            const departure = new Date(reservationData.departureDate);
            const diffTime = departure - arrival;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays > 0 ? diffDays : '-';
        }
        return '-';
    }, [reservationData.arrivalDate, reservationData.departureDate]);

    const handlePrint = () => {
        window.print();
    };

    const numRooms = parseInt(reservationData.numberOfRoom) || 1;
    const roomRate = parseInt(reservationData.roomRate) || (reservationData.roomType === 'Deluxe Room' ? 2500000 : 1500000);
    const subtotal = roomRate * numRooms * (totalNights === '-' ? 1 : totalNights);
    const tax = Math.round(subtotal * 0.11);
    const serviceCharge = Math.round(subtotal * 0.05);
    const calculatedGrandTotal = subtotal + tax + serviceCharge;

    const pData = useMemo(() => {
        return parsePaymentRef(paymentData?.paymentRef, paymentData?.method);
    }, [paymentData]);

    return (
        <div className="min-h-screen bg-gray-100 py-8 print:bg-white print:py-0">

            {/* Top action bar - Hidden on print */}
            <div className="max-w-4xl mx-auto mb-4 flex justify-between items-center px-4 print:hidden">
                <button
                    onClick={() => navigate('/registration')}
                    className="text-blue-600 hover:text-blue-800 font-medium flex items-center"
                >
                    ← Back to Registration
                </button>
                <button
                    onClick={handlePrint}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium shadow-md transition-colors"
                >
                    Print Confirmation
                </button>
            </div>

            <div id="print-area" className="max-w-3xl mx-auto bg-white p-10 md:p-14 shadow-lg print:shadow-none print:p-0">

                {/* Header */}
                <div className="text-center mb-4">
                    <div className="flex justify-center mb-1">
                        <img 
                            src="/logo.png" 
                            alt="Logo PPKD Jakarta Pusat" 
                            className="w-14 h-14 object-contain"
                        />
                    </div>
                    <h1 className="text-[16px] font-bold tracking-widest text-gray-900 uppercase">PPKD HOTEL</h1>
                </div>

                <div className="mb-3">
                    <h2 className="text-[14px] font-bold text-gray-800 mb-1">Reservation Confirmation</h2>
                    <div className="border-b-2 border-gray-900 w-full mb-0.5" />
                    <div className="border-b border-gray-900 w-full" />
                </div>

                {/* Company / Agent Info */}
                <div className="grid grid-cols-2 gap-x-8 text-[10px] mb-4">
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
                <div className="space-y-1.5 text-[10px] mb-4">
                    <div className="flex"><span className="w-32 text-gray-800 shrink-0">First Name</span><span className="font-bold uppercase">: {reservationData.name || '-'}</span></div>
                    <div className="flex"><span className="w-32 text-gray-800 shrink-0">Arrival Date</span><span className="font-bold">: {reservationData.arrivalDate ? new Date(reservationData.arrivalDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</span></div>
                    <div className="flex"><span className="w-32 text-gray-800 shrink-0">Departure Date</span><span className="font-bold">: {reservationData.departureDate ? new Date(reservationData.departureDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</span></div>
                    <div className="flex"><span className="w-32 text-gray-800 shrink-0">Total Night</span><span className="font-medium">: {totalNights} Malam (Nights)</span></div>
                    <div className="flex"><span className="w-32 text-gray-800 shrink-0">Room/Unit Type</span><span className="font-medium">: {reservationData.roomNo ? `Kamar ${reservationData.roomNo}` : ''} ({reservationData.roomType || '-'})</span></div>
                    <div className="flex"><span className="w-32 text-gray-800 shrink-0">Person Pax</span><span className="font-medium">: {reservationData.numberOfPerson || '-'} Orang (Person)</span></div>
                    <div className="flex mt-2"><span className="w-32 text-red-600 shrink-0">Room Rate Net</span><span className="font-bold text-red-600">: {paymentData ? formatIDR(paymentData.roomRate || 0) : 'Rp -'} / Malam</span></div>
                </div>

                {/* Guarantee Info Box */}
                <div className="border border-gray-400 bg-[#fafafa] px-3 py-2.5 text-[9px] text-gray-800 leading-relaxed mb-4 rounded-sm">
                    <p className="mb-2">
                        Please guarantee this booking with credit card number with clear copy of the card both sides and card holder signature in the column provided the copy of credit card both sides should be faxed to hotel fax number.
                    </p>
                    <p className="font-bold text-red-700 mb-2">Please settle your outstanding to or account:</p>

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
                    <div className="border border-gray-300 bg-[#f9fafb] px-3 py-2.5 text-[10px] mb-4 rounded-sm">
                        <p className="font-bold text-[11px] text-gray-900 mb-2">💳 Pembayaran via Kartu Kredit</p>
                        <div className="space-y-1">
                            <div className="flex"><span className="w-36 text-gray-500 shrink-0">Ref. Pembayaran</span><span className="font-bold text-gray-900">: {pData.code || '-'}</span></div>
                            <div className="flex"><span className="w-36 text-gray-500 shrink-0">Card Number</span><span className="font-semibold">: {maskCardNumber(pData.cardNumber)}</span></div>
                            <div className="flex"><span className="w-36 text-gray-500 shrink-0">Card Holder</span><span className="font-semibold">: {pData.cardHolder || '-'}</span></div>
                            <div className="flex"><span className="w-36 text-gray-500 shrink-0">Expired</span><span className="font-semibold">: {pData.cardExpiry || '-'}</span></div>
                            <div className="flex"><span className="w-36 text-gray-500 shrink-0">Jumlah Pembayaran</span><span className="font-bold text-red-600">: {formatIDR(paymentData.grandTotal || calculatedGrandTotal)}</span></div>
                        </div>
                    </div>
                )}

                {paymentData?.method === 'transfer' && (
                    <div className="border border-gray-300 bg-[#f9fafb] px-3 py-2.5 text-[10px] mb-4 rounded-sm">
                        <p className="font-bold text-[11px] text-gray-900 mb-2">🏦 Pembayaran via Bank Transfer</p>
                        <div className="space-y-1">
                            <div className="flex"><span className="w-36 text-gray-500 shrink-0">Ref. Pembayaran</span><span className="font-bold text-gray-900">: {pData.code || '-'}</span></div>
                            <div className="flex"><span className="w-36 text-gray-500 shrink-0">Bank</span><span className="font-semibold">: Bank Mandiri (Cab. Jakarta)</span></div>
                            <div className="flex"><span className="w-36 text-gray-500 shrink-0">No. Rekening</span><span className="font-semibold">: 123-00-9876543-2</span></div>
                            <div className="flex"><span className="w-36 text-gray-500 shrink-0">Atas Nama</span><span className="font-semibold">: PPKD HOTEL JAKARTA PUSAT</span></div>
                            <div className="flex"><span className="w-36 text-gray-500 shrink-0">Jumlah Transfer</span><span className="font-bold text-red-600">: {formatIDR(paymentData.grandTotal || calculatedGrandTotal)}</span></div>
                            {pData.bankRef && pData.bankRef !== pData.code && (
                                <div className="flex"><span className="w-36 text-gray-500 shrink-0">Berita Acara</span><span className="font-semibold">: {pData.bankRef}</span></div>
                            )}
                        </div>
                    </div>
                )}

                {paymentData?.method === 'ewallet' && (
                    <div className="border border-gray-300 bg-[#f9fafb] px-3 py-2.5 text-[10px] mb-4 rounded-sm">
                        <p className="font-bold text-[11px] text-gray-900 mb-2">📱 Pembayaran via E-Wallet</p>
                        <div className="space-y-1">
                            <div className="flex"><span className="w-36 text-gray-500 shrink-0">Ref. Pembayaran</span><span className="font-bold text-gray-900">: {pData.code || '-'}</span></div>
                            <div className="flex"><span className="w-36 text-gray-500 shrink-0">Provider</span><span className="font-semibold">: {(pData.ewalletProvider || '-').toUpperCase()}</span></div>
                            <div className="flex"><span className="w-36 text-gray-500 shrink-0">No. HP / E-Wallet</span><span className="font-semibold">: {maskPhoneNumber(pData.ewalletPhone)}</span></div>
                            <div className="flex"><span className="w-36 text-gray-500 shrink-0">Jumlah Pembayaran</span><span className="font-bold text-red-600">: {formatIDR(paymentData.grandTotal || calculatedGrandTotal)}</span></div>
                        </div>
                    </div>
                )}

                {paymentData?.method === 'cash' && (
                    <div className="border border-gray-300 bg-[#f9fafb] px-3 py-2.5 text-[10px] mb-4 rounded-sm">
                        <p className="font-bold text-[11px] text-gray-900 mb-2">💵 Pembayaran Tunai (Cash)</p>
                        <div className="space-y-1">
                            <div className="flex"><span className="w-36 text-gray-500 shrink-0">Metode</span><span className="font-semibold">: Dibayar tunai saat check-in</span></div>
                            <div className="flex"><span className="w-36 text-gray-500 shrink-0">Jumlah Pembayaran</span><span className="font-bold text-red-600">: {formatIDR(paymentData.grandTotal || 0)}</span></div>
                        </div>
                    </div>
                )}

                {!paymentData && (
                    <div className="text-[10px] mb-4">
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
                <div className="bg-[#f2f2f2] px-3 py-2 text-[8px] text-gray-700">
                    <p className="font-bold mb-0.5 underline text-gray-900">Cancellation policy:</p>
                    <ol className="list-decimal pl-3 space-y-0.5">
                        <li>Please note that check in time is 02.00 pm and check out time 12.00 pm.</li>
                        <li>All non guaranteed reservations will automatically be released on 6 pm.</li>
                        <li>The Hotel will charge 1 night for guaranteed reservations that have not been canceling before the day of arrival. Please carefully note your cancellation number.</li>
                    </ol>
                </div>

                {/* Add standard global print styles directly inline to ensure scaling and no extra margin pages */}
                <style dangerouslySetInnerHTML={{__html: `
                    @media print {
                        @page { margin: 0; size: A4 portrait; }
                        body { margin: 0; padding: 0.5cm; }
                    }
                `}} />

            </div>
        </div>
    );
}
