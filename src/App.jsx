import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import RegistrationForm from './pages/RegistrationForm'
import PaymentPage from './pages/PaymentPage'
import PaymentSuccess from './pages/PaymentSuccess'
import ReservationConfirmation from './pages/ReservationConfirmation'
import Login from './pages/Login'
import DashboardLayout from './components/DashboardLayout'
import Dashboard from './pages/Dashboard'
import ProtectedRoute from './components/ProtectedRoute'
import UserManagement from './pages/UserManagement'
import RoleBasedHome from './components/RoleBasedHome'

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Public Route */}
                <Route path="/login" element={<Login />} />

                {/* Protected Routes inside Dashboard Layout */}
                <Route element={<ProtectedRoute />}>
                    <Route element={<DashboardLayout />}>
                        
                        {/* Dynamic Homepage based on role */}
                        <Route path="/" element={<RoleBasedHome />} />
                        
                        {/* New Dashboard for Admins / Superadmins */}
                        <Route element={<ProtectedRoute allowedRoles={['Superadmin', 'Admin']} />}>
                            <Route path="/dashboard" element={<Dashboard />} />
                        </Route>
                        
                        {/* Accessible to all logged-in roles */}
                        <Route path="/registration" element={<RegistrationForm />} />
                        <Route path="/payment" element={<PaymentPage />} />
                        <Route path="/payment-success" element={<PaymentSuccess />} />
                        <Route path="/confirmation" element={<ReservationConfirmation />} />
                        
                        {/* Accessible to Superadmin & Admin for viewing list, but Superadmin can create */}
                        <Route element={<ProtectedRoute allowedRoles={['Superadmin', 'Admin']} />}>
                            <Route path="/users" element={<UserManagement />} />
                        </Route>
                    </Route>
                </Route>
                
                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    )
}

export default App
