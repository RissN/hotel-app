import { BrowserRouter, Routes, Route } from 'react-router-dom'
import RegistrationForm from './pages/RegistrationForm'
import PaymentPage from './pages/PaymentPage'
import ReservationConfirmation from './pages/ReservationConfirmation'

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<RegistrationForm />} />
                <Route path="/payment" element={<PaymentPage />} />
                <Route path="/confirmation" element={<ReservationConfirmation />} />
            </Routes>
        </BrowserRouter>
    )
}

export default App
