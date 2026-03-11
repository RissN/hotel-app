import { useLocation, useNavigate } from 'react-router-dom';

export default function ReservationConfirmation() {
    const location = useLocation();
    const navigate = useNavigate();
    const reservationData = location.state?.reservationData || {};

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-gray-100 py-8 print:bg-white print:py-0">

            {/* Top action bar - Hidden on print */}
            <div className="max-w-4xl mx-auto mb-4 flex justify-between items-center px-4 print:hidden">
                <button
                    onClick={() => navigate('/')}
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

            <div className="max-w-3xl mx-auto bg-white p-10 md:p-14 shadow-lg print:shadow-none print:p-0">

                {/* Header */}
                <div className="text-center mb-10 border-b-2 border-gray-800 pb-6">
                    <div className="flex justify-center mb-4">
                        {/* Placeholder for Logo matching image */}
                        <div className="w-24 h-24 border-2 border-gray-800 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-gray-800 text-center uppercase">DKI Jakarta<br />Pusat</span>
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold tracking-widest text-gray-900 pb-1">PPKD HOTEL</h1>
                </div>

                <h2 className="text-xl font-bold text-gray-800 mb-8 border-b border-gray-300 inline-block pr-10">Reservation Confirmation</h2>

                {/* Company / Agent Info */}
                <div className="grid grid-cols-2 gap-x-8 gap-y-3 mb-10 text-sm">
                    <div className="flex">
                        <span className="w-36 text-gray-600">To.</span>
                        <span className="font-semibold">: {reservationData.name || '-'}</span>
                    </div>
                    <div className="col-span-2 mt-4 grid grid-cols-2 gap-x-8 gap-y-3">
                        <div className="space-y-3">
                            <div className="flex">
                                <span className="w-36 text-gray-600">Company / Agent</span>
                                <span className="font-medium">: {reservationData.company || '-'}</span>
                            </div>
                            <div className="flex">
                                <span className="w-36 text-gray-600">Booking No.</span>
                                <span className="font-medium">: {Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}</span> {/* Auto generated for demo */}
                            </div>
                            <div className="flex">
                                <span className="w-36 text-gray-600">Book By</span>
                                <span className="font-medium">: {reservationData.receptionist || '-'}</span>
                            </div>
                            <div className="flex">
                                <span className="w-36 text-gray-600">Phone</span>
                                <span className="font-medium">: {reservationData.phone || '-'}</span>
                            </div>
                            <div className="flex">
                                <span className="w-36 text-gray-600">Email</span>
                                <span className="font-medium">: {reservationData.email || '-'}</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex">
                                <span className="w-20 text-gray-600">Telp</span>
                                <span className="font-medium">: {reservationData.phone || '-'}</span>
                            </div>
                            <div className="flex">
                                <span className="w-20 text-gray-600">Fax</span>
                                <span className="font-medium">: -</span>
                            </div>
                            <div className="flex">
                                <span className="w-20 text-gray-600">Email</span>
                                <span className="font-medium">: {reservationData.email || '-'}</span>
                            </div>
                            <div className="flex">
                                <span className="w-20 text-gray-600">Date</span>
                                <span className="font-medium">: {new Date().toLocaleDateString('id-ID')}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <hr className="mb-8 border-gray-300" />

                {/* Guest Info */}
                <div className="space-y-3 mb-10 text-sm">
                    <div className="flex">
                        <span className="w-40 text-gray-600">First Name</span>
                        <span className="font-medium">: {reservationData.name || '-'}</span>
                    </div>
                    <div className="flex">
                        <span className="w-40 text-gray-600">Arrival Date</span>
                        <span className="font-medium">: {reservationData.arrivalDate || '-'}</span>
                    </div>
                    <div className="flex">
                        <span className="w-40 text-gray-600">Departure Date</span>
                        <span className="font-medium">: {reservationData.departureDate || '-'}</span>
                    </div>
                    <div className="flex">
                        <span className="w-40 text-gray-600">Total Night</span>
                        <span className="font-medium">: {/* Calculate diff if possible, else placeholder */ '1'}</span>
                    </div>
                    <div className="flex">
                        <span className="w-40 text-gray-600">Room/Unit Type</span>
                        <span className="font-medium">: {reservationData.roomType || '-'}</span>
                    </div>
                    <div className="flex">
                        <span className="w-40 text-gray-600">Person Pax</span>
                        <span className="font-medium">: {reservationData.numberOfPerson || '-'}</span>
                    </div>
                    <div className="flex">
                        <span className="w-40 text-gray-600">Room Rate Net</span>
                        <span className="font-medium">: IDR </span>
                    </div>
                </div>

                {/* Guarantee Info */}
                <div className="text-sm text-gray-700 leading-relaxed mb-8">
                    <p className="mb-4">
                        Please guarantee this booking with credit card number with clear copy of the card both sides and card holder signature in the column provided the copy of credit card both sides should be faxed to hotel fax number.<br />
                        Please settle your outstanding to or account:
                    </p>

                    <div className="space-y-1 mb-8">
                        <p className="font-medium border-b border-gray-300 inline-block pb-1 mb-2">Bank Transfer</p>
                        <div className="flex"><span className="w-40">Mandiri Account</span><span>: 123-456-789-0</span></div>
                        <div className="flex"><span className="w-40">Mandiri Name Account</span><span>: PPKD HOTEL</span></div>
                    </div>

                    <hr className="mb-8 border-gray-300" />
                    <p className="font-medium mb-4">Reservation guaranteed by the following credit card:</p>

                    <div className="space-y-3 w-2/3">
                        <div className="flex justify-between border-b border-gray-300 pb-1">
                            <span className="text-gray-600">Card Number</span><span>:</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-300 pb-1">
                            <span className="text-gray-600">Card holder name</span><span>:</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-300 pb-1">
                            <span className="text-gray-600">Card Type</span><span>:</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-300 pb-1">
                            <span className="text-gray-600">Or by Bank Transfer to</span><span>:</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-300 pb-1">
                            <span className="text-gray-600">Expired date/month/year</span><span>:</span>
                        </div>
                        <div className="flex justify-between mt-6">
                            <span className="text-gray-600">Card holder signature</span>
                            <div className="w-48 border-b-2 border-gray-400"></div>
                        </div>
                    </div>
                </div>

                <hr className="mb-6 border-gray-300" />

                {/* Cancellation Policy */}
                <div className="text-xs text-gray-600">
                    <p className="font-medium mb-2 underline">Cancellation policy:</p>
                    <ol className="list-decimal pl-4 space-y-1">
                        <li>Please note that check in time is 02.00 pm and check out time 12.00 pm.</li>
                        <li>All non guaranteed reservations will automatically be released on 6 pm.</li>
                        <li>The Hotel will charge 1 night for guaranteed reservations that have not been canceling before the day of arrival. Please carefully note your cancellation number.</li>
                    </ol>
                </div>

                <div className="mt-16 text-right">
                    <div className="inline-block w-48 border-b-2 border-gray-800"></div>
                    <p className="text-xs text-gray-500 mt-2 mr-10">Authorized Signature</p>
                </div>

            </div>
        </div>
    );
}
