/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(true);
    
    // Ref to track when an explicit login is in progress.
    // This prevents onAuthStateChange from racing with the login() function.
    const isLoggingIn = useRef(false);

    useEffect(() => {
        // Initial session fetch
        const initializeAuth = async () => {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) {
                console.error("Error fetching session:", error);
            }
            if (session?.user) {
                setUser(session.user);
                await fetchUserRole(session.user.id);
            } else {
                setLoading(false);
            }
            
            // Listen for auth changes
            const { data: { subscription } } = supabase.auth.onAuthStateChange(
                async (_event, session) => {
                    // If an explicit login() call is in progress, skip this handler.
                    // The login() function will handle setting user, role, and loading itself.
                    if (isLoggingIn.current) {
                        return;
                    }

                    setUser(session?.user ?? null);
                    if (session?.user) {
                        await fetchUserRole(session.user.id);
                    } else {
                        setRole(null);
                        setLoading(false);
                    }
                }
            );

            return () => {
                subscription?.unsubscribe();
            };
        };

        initializeAuth();

        // Re-fetch role when window regains focus (catches admin role changes in real-time)
        const handleFocus = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                await fetchUserRole(session.user.id);
            }
        };
        window.addEventListener('focus', handleFocus);

        return () => {
            window.removeEventListener('focus', handleFocus);
        };
    }, []);

    const fetchUserRole = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('user_roles')
                .select('role, username')
                .eq('user_id', userId)
                .maybeSingle();
            
            if (error) {
                console.error("Error fetching user role:", error.message);
                setRole(null);
                setUsername('');
            } else {
                setRole(data?.role || null);
                setUsername(data?.username || '');
            }
        } catch (error) {
            console.error("Unexpected error fetching role:", error);
            setRole(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        // Mark that an explicit login is in progress.
        // This prevents onAuthStateChange from interfering.
        isLoggingIn.current = true;

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            
            if (error) {
                throw error;
            }
            
            // Set user and fetch role synchronously before returning.
            // Because isLoggingIn is true, onAuthStateChange won't race with us.
            if (data?.user) {
                setUser(data.user);
                await fetchUserRole(data.user.id);
                
                // Track login history
                try {
                    await supabase.from('login_history').insert([
                        { user_id: data.user.id }
                    ]);
                } catch (logErr) {
                    console.error("Failed to log login history:", logErr);
                }
            }
            
            return data;
        } finally {
            // Always release the lock, even if an error was thrown.
            isLoggingIn.current = false;
        }
    };

    const logout = async () => {
        sessionStorage.removeItem('announcement_shown');
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    };

    const value = {
        user,
        role,
        username,
        loading,
        login,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
