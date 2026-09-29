import { Routes, Route } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import LandingPage from '../pages/landing/ui/LandingPage'
import LoginPage from '../pages/login/ui/LoginPage'
import SignupPage from '../pages/signup/ui/SignupPage'
import GitHubCallbackPage from '../pages/auth-callback/ui/GitHubCallbackPage'
import OnboardingPage from '../pages/onboarding/ui/OnboardingPage'
import DashboardPage from '../pages/dashboard/ui/DashboardPage'
import ScanPage from '../pages/scan/ui/ScanPage'
import StatusPage from '../pages/scan-status/ui/StatusPage'
import ReportPage from '../pages/report/ui/ReportPage'
import ReportsPage from '../pages/reports/ui/ReportsPage'
import IntegrationsPage from '../pages/integrations/ui/IntegrationsPage'
import MyPage from '../pages/mypage/ui/MyPage'
import SurveyPage from '../pages/survey/ui/SurveyPage'
import SettingsPage from '../pages/settings/ui/SettingsPage'
import TeamPage from '../pages/team/ui/TeamPage'
import PricingPage from '../pages/pricing/ui/PricingPage'
import CheckoutPage from '../pages/checkout/ui/CheckoutPage'
import { ENABLE_PRICING } from '../shared/lib/config'

const Protected = ({ children }: { children: React.ReactNode }) => <ProtectedRoute>{children}</ProtectedRoute>

export default function AppRouter() {
  return (
    <Routes>
      {/* public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/auth/github/callback" element={<GitHubCallbackPage />} />
      {ENABLE_PRICING && <Route path="/pricing" element={<PricingPage />} />}

      {/* authenticated */}
      <Route path="/onboarding" element={<Protected><OnboardingPage /></Protected>} />
      <Route path="/dashboard" element={<Protected><DashboardPage /></Protected>} />
      <Route path="/scan" element={<Protected><ScanPage /></Protected>} />
      <Route path="/scan/:id/status" element={<Protected><StatusPage /></Protected>} />
      <Route path="/report/:id" element={<Protected><ReportPage /></Protected>} />
      <Route path="/reports" element={<Protected><ReportsPage /></Protected>} />
      <Route path="/integrations" element={<Protected><IntegrationsPage /></Protected>} />
      <Route path="/mypage" element={<Protected><MyPage /></Protected>} />
      <Route path="/survey" element={<Protected><SurveyPage /></Protected>} />
      <Route path="/settings" element={<Protected><SettingsPage /></Protected>} />
      <Route path="/team" element={<Protected><TeamPage /></Protected>} />
      {ENABLE_PRICING && <Route path="/checkout/:plan" element={<Protected><CheckoutPage /></Protected>} />}
    </Routes>
  )
}
