import { createClient } from '@supabase/supabase-js'

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
    ? createClient(supabaseUrl, supabaseAnonKey) 
    : {
        from: () => ({
            insert: () => {
                console.error("Supabase client is not initialized because environment variables are missing.");
                return { error: new Error("Supabase is not configured. Variables missing.") };
            }
        })
    };

