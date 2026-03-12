import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles = [] }) => {
    const { user, role, loading } = useAuth();

    if (loading) {
        console.log("ProtectedRoute: Still loading...");
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
            </div>
        );
    }

    console.log("ProtectedRoute check:", { userEmail: user?.email, role, path: window.location.pathname });

    if (!user) {
        console.log("ProtectedRoute: No user, redirecting to login");
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
        console.log("ProtectedRoute: Role mismatch, redirecting to home");
        return <Navigate to="/" replace />;
    }

    // Role is allowed or no specific role required, render the child routes
    return <Outlet />;
};

export default ProtectedRoute;
