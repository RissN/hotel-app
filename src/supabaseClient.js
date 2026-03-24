import { createClient } from '@supabase/supabase-js'
import { cookieStorage } from './utils/cookieStorage'

const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
        'Supabase environment variables are not set. ' +
        'Please create a .env file with VITE_PUBLIC_SUPABASE_URL and VITE_PUBLIC_SUPABASE_ANON_KEY.'
    )
}

// Inisialisasi hanya jika URL dan Key valid agar tidak error "URL is required" yang menyebabkan blank page
export const supabase = supabaseUrl && supabaseAnonKey 
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            storage: cookieStorage,
        },
    }) 
    : {
        from: () => ({
            insert: () => {
                console.error("Supabase client is not initialized because environment variables are missing.");
                return { error: new Error("Supabase is not configured. Variables missing.") };
            }
        })
    };

// Bersihkan data Supabase auth lama dari localStorage (sisa sebelum migrasi ke cookie)
try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('sb-')) {
            keysToRemove.push(key);
        }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
    if (keysToRemove.length > 0) {
        console.info(`[Auth Cleanup] Removed ${keysToRemove.length} stale key(s) from localStorage.`);
    }
} catch (e) {
    // Abaikan error (misalnya di SSR atau storage tidak tersedia)
}
