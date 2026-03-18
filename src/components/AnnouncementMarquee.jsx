import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

const AnnouncementMarquee = () => {
    const { role } = useAuth();
    const [announcement, setAnnouncement] = useState(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isExiting, setIsExiting] = useState(false);

    // Only show for Admin and Resepsionis
    if (role !== 'Admin' && role !== 'Resepsionis') return null;

    useEffect(() => {
        // Check if already shown in this session
        const hasBeenShown = sessionStorage.getItem('announcement_shown');
        
        if (!hasBeenShown) {
            setIsVisible(true);
            sessionStorage.setItem('announcement_shown', 'true');

            // Start exit animation after 19 seconds
            const exitTimer = setTimeout(() => {
                setIsExiting(true);
            }, 19000);

            // Auto-hide after 20 seconds (allowing 1s for animation)
            const hideTimer = setTimeout(() => {
                setIsVisible(false);
            }, 20000);

            return () => {
                clearTimeout(exitTimer);
                clearTimeout(hideTimer);
            };
        }
    }, []);

    useEffect(() => {
        const fetchAnnouncement = async () => {
            const { data, error } = await supabase
                .from('announcements')
                .select('content')
                .eq('is_active', true)
                .order('created_at', { ascending: false })
                .limit(1);

            if (data && data[0]) {
                setAnnouncement(data[0].content);
            }
        };

        fetchAnnouncement();

        // Optional: Real-time update
        const channel = supabase
            .channel('public:announcements')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, fetchAnnouncement)
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    if (!announcement || !isVisible) return null;

    return (
        <div className={`bg-red-600 text-white py-2 overflow-hidden sticky top-0 z-[40] transition-all duration-1000 ease-in-out ${isExiting ? 'opacity-0 -translate-y-full max-h-0 py-0' : 'max-h-20'}`}>
            <div className="flex gap-4">
                <div className="animate-marquee whitespace-nowrap font-bold flex gap-10 items-center">
                    <span>⚠️ PENGUMUMAN: {announcement}</span>
                    <span>⚠️ PENGUMUMAN: {announcement}</span>
                    <span>⚠️ PENGUMUMAN: {announcement}</span>
                    <span>⚠️ PENGUMUMAN: {announcement}</span>
                </div>
            </div>
            <style>{`
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-marquee {
                    animation: marquee 20s linear infinite;
                }
            `}</style>
        </div>
    );
};

export default AnnouncementMarquee;
