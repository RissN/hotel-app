import { BrowserRouter, Routes, Route } from 'react-router-dom'
import RegistrationForm from './pages/RegistrationForm'
import PaymentPage from './pages/PaymentPage'
import PaymentSuccess from './pages/PaymentSuccess'
import ReservationConfirmation from './pages/ReservationConfirmation'

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<RegistrationForm />} />
                <Route path="/payment" element={<PaymentPage />} />
                <Route path="/payment-success" element={<PaymentSuccess />} />
                <Route path="/confirmation" element={<ReservationConfirmation />} />
            </Routes>
        </BrowserRouter>
    )
}

export default App
