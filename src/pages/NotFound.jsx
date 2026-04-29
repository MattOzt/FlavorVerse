import { Link } from 'react-router-dom'

function NotFound() {
  return (
    <section className="mx-auto max-w-xl py-16 text-center">
      <div className="fv-card p-10">
        <p className="mb-2 text-sm uppercase tracking-[0.2em] text-accent">404</p>
        <h1 className="mb-3 text-4xl font-bold">Page Not Found</h1>
        <p className="mb-6 text-zinc-300">The page you are looking for does not exist or may have been moved.</p>
        <Link to="/" className="fv-btn-primary inline-flex">
          Go Home
        </Link>
      </div>
    </section>
  )
}

export default NotFound
