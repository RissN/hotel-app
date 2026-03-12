/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);

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
    }, []);

    const fetchUserRole = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', userId)
                .maybeSingle();

            console.log("=== DIAGNOSTIC FETCH ===");
            console.log("Fetching for User ID:", userId);
            console.log("Returned Data:", data);
            
            if (error) {
                console.error("=== SUPABASE ERROR ===");
                console.error(error.message, error.details, error.hint, error);
                setRole(null); 
            } else {
                setRole(data?.role || null); 
            }
        } catch (error) {
            console.error("Unexpected error fetching role:", error);
            setRole(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        // Prevent layout checks during login processing
        setLoading(true); 
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        
        if (error) {
            setLoading(false);
            throw error;
        }
        
        // Ensure role is fetched immediately so AuthContext state is ready BEFORE we return to Login.jsx
        if (data?.user) {
            setUser(data.user);
            await fetchUserRole(data.user.id);
        }
        
        return data; // contains user & session
    };

    const logout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    };

    const value = {
        user,
        role,
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
