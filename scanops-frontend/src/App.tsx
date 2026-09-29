import { BrowserRouter } from 'react-router-dom'
import AppRouter from './app/router'
import { AuthProvider } from './shared/lib/auth'
import { ToastProvider } from './shared/ui/Toast'
import { TourProvider } from './shared/lib/tour'
import TourOverlay from './shared/ui/TourOverlay'
import ErrorReportWidget from './widgets/error-report/ui/ErrorReportWidget'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <TourProvider>
            <AppRouter />
            <TourOverlay />
          </TourProvider>
          <ErrorReportWidget />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
