import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../shared/lib/auth'

/** Gate for authenticated screens. Redirects to /login, preserving intent. */
export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth()
  const location = useLocation()

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <span className="w-6 h-6 rounded-full border-2 border-line border-t-brand spin" />
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <>{children}</>
}
