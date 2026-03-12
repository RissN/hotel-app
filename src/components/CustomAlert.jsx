import { useEffect, useRef } from 'react';

/**
 * CustomAlert - A premium, reusable modal component.
 * 
 * Props:
 * - isOpen (bool): Whether the modal is visible
 * - onClose (fn): Called when dismissed (Cancel / backdrop click)
 * - onConfirm (fn): Called when confirmed (only for 'confirm' type)
 * - title (string): Modal title
 * - message (string): Modal body text
 * - type ('success' | 'error' | 'warning' | 'confirm' | 'info'): Determines icon & color scheme
 * - confirmText (string): Custom text for confirm button (default: 'Ya, Lanjutkan')
 * - cancelText (string): Custom text for cancel button (default: 'Batal')
 */
const CustomAlert = ({
    isOpen,
    onClose,
    onConfirm,
    title = 'Notifikasi',
    message = '',
    type = 'info',
    confirmText = 'Ya, Lanjutkan',
    cancelText = 'Batal',
}) => {
    const overlayRef = useRef(null);
    const confirmBtnRef = useRef(null);

    // Focus the confirm button when opened and handle Escape key
    useEffect(() => {
        if (isOpen) {
            confirmBtnRef.current?.focus();
            const handleKeyDown = (e) => {
                if (e.key === 'Escape') onClose?.();
            };
            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    // Color schemes per type
    const schemes = {
        success: {
            icon: (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
            ),
            iconBg: 'bg-emerald-100',
            iconColor: 'text-emerald-600',
            btnClass: 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-300',
        },
        error: {
            icon: (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            ),
            iconBg: 'bg-red-100',
            iconColor: 'text-red-600',
            btnClass: 'bg-red-600 hover:bg-red-700 focus:ring-red-300',
        },
        warning: {
            icon: (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86l-8.5 14.72A1 1 0 002.64 20h18.72a1 1 0 00.85-1.42l-8.5-14.72a1 1 0 00-1.72 0z" />
                </svg>
            ),
            iconBg: 'bg-amber-100',
            iconColor: 'text-amber-600',
            btnClass: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-300',
        },
        confirm: {
            icon: (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01" />
                    <circle cx="12" cy="12" r="10" strokeWidth={2} />
                </svg>
            ),
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-600',
            btnClass: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-300',
        },
        info: {
            icon: (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
                </svg>
            ),
            iconBg: 'bg-slate-100',
            iconColor: 'text-slate-600',
            btnClass: 'bg-slate-800 hover:bg-slate-900 focus:ring-slate-300',
        },
    };

    const scheme = schemes[type] || schemes.info;
    const isConfirm = type === 'confirm';

    const handleBackdropClick = (e) => {
        if (e.target === overlayRef.current) onClose?.();
    };

    return (
        <div
            ref={overlayRef}
            onClick={handleBackdropClick}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)' }}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
                style={{ animation: 'alertSlideIn 0.25s ease-out' }}
            >
                {/* Header section with icon */}
                <div className="flex flex-col items-center pt-8 pb-2 px-6">
                    <div className={`w-14 h-14 rounded-full ${scheme.iconBg} ${scheme.iconColor} flex items-center justify-center mb-4`}>
                        {scheme.icon}
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 text-center">{title}</h3>
                </div>

                {/* Message */}
                <div className="px-6 pb-6 pt-2">
                    <p className="text-sm text-slate-500 text-center leading-relaxed whitespace-pre-line">{message}</p>
                </div>

                {/* Actions */}
                <div className={`px-6 pb-6 flex gap-3 ${isConfirm ? 'flex-row' : 'flex-col'}`}>
                    {isConfirm && (
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300"
                        >
                            {cancelText}
                        </button>
                    )}
                    <button
                        ref={confirmBtnRef}
                        onClick={isConfirm ? onConfirm : onClose}
                        className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-colors focus:outline-none focus:ring-2 ${scheme.btnClass}`}
                    >
                        {isConfirm ? confirmText : 'OK'}
                    </button>
                </div>
            </div>

            {/* Animation keyframes */}
            <style>{`
                @keyframes alertSlideIn {
                    from {
                        opacity: 0;
                        transform: scale(0.9) translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                }
            `}</style>
        </div>
    );
};

export default CustomAlert;
