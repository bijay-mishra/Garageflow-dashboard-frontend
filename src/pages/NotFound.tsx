import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-6xl font-bold text-brand-600">404</p>
      <h1 className="mt-4 text-xl font-bold text-ink-900">Page not found</h1>
      <p className="mt-1 text-sm text-ink-500">The page you're looking for doesn't exist or was moved.</p>
      <Link to="/" className="btn-primary mt-6">
        Back to dashboard
      </Link>
    </div>
  )
}
