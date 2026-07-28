import { Routes, Route } from 'react-router-dom'
import Layout from '@/components/layout/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import Login from '@/pages/Login'
import ForgotPassword from '@/pages/ForgotPassword'
import ResetPassword from '@/pages/ResetPassword'
import Account from '@/pages/Account'
import Dashboard from '@/pages/Dashboard'
import Customers from '@/pages/Customers'
import Vehicles from '@/pages/Vehicles'
import JobCards from '@/pages/JobCards'
import ServiceHistory from '@/pages/ServiceHistory'
import Billing from '@/pages/Billing'
import Reports from '@/pages/Reports'
import Plans from '@/pages/Plans'
import NotFound from '@/pages/NotFound'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      {/* Landing page for the emailed link: /reset-password?token=… */}
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="customers" element={<Customers />} />
        <Route path="vehicles" element={<Vehicles />} />
        <Route path="job-cards" element={<JobCards />} />
        <Route path="service-history" element={<ServiceHistory />} />
        <Route path="billing" element={<Billing />} />
        <Route path="reports" element={<Reports />} />
        <Route path="account" element={<Account />} />
        <Route path="plans" element={<Plans />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
