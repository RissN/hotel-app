import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles = [] }) => {
    const { user, role, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
            </div>
        );
    }

    if (!user) {
        // User not logged in, redirect to login
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
        // Logged in user doesn't have the required role, redirect to a safe page like home/dashboard
        return <Navigate to="/" replace />;
    }

    // Role is allowed or no specific role required, render the child routes
    return <Outlet />;
};

export default ProtectedRoute;
