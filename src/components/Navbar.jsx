import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'Recipes', to: '/recipes' },
  { label: 'Shopping List', to: '/shopping-list' },
]

function Navbar() {
  const { user, signOut } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const username = user?.user_metadata?.username || user?.email?.split('@')[0] || 'Chef'
  const centerNavItems = user ? [...navItems, { label: 'Create Recipe', to: '/create' }] : navItems

  const linkClasses = ({ isActive }) =>
    `text-sm font-medium transition-colors ${isActive ? 'text-accent' : 'text-zinc-200 hover:text-accent'}`

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-bg/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-[1400px] items-center justify-between px-5 sm:px-8 lg:px-10">
        <Link to="/" className="text-xl font-semibold tracking-tight text-accent">
          FlavorVerse
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {centerNavItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={linkClasses}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <Link to="/profile" className="text-sm text-zinc-200 transition hover:text-accent">
                Profile
              </Link>
              <span className="text-sm text-gray-300">{username}</span>
              <button
                onClick={signOut}
                className="fv-btn-secondary px-3 py-1.5 text-sm"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="rounded-md px-3 py-1.5 text-sm text-zinc-200 transition hover:text-accent">
                Login
              </Link>
              <Link to="/register" className="fv-btn-primary px-3 py-1.5 text-sm">
                Register
              </Link>
            </>
          )}
        </div>

        <button
          className="rounded-lg border border-zinc-800 p-2 text-zinc-200 md:hidden"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label="Toggle navigation menu"
        >
          <span className="block h-0.5 w-5 bg-current" />
          <span className="mt-1.5 block h-0.5 w-5 bg-current" />
          <span className="mt-1.5 block h-0.5 w-5 bg-current" />
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-zinc-800 px-4 pb-4 md:hidden">
          <nav className="mt-3 flex flex-col gap-3">
            {centerNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={linkClasses}
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-4 flex flex-col gap-2">
            {user ? (
              <>
                <Link to="/profile" onClick={() => setMobileOpen(false)} className="text-sm text-zinc-200 hover:text-accent">
                  Profile
                </Link>
                <span className="text-sm text-gray-300">{username}</span>
                <button
                  onClick={async () => {
                    await signOut()
                    setMobileOpen(false)
                  }}
                  className="fv-btn-secondary px-3 py-2 text-left text-sm"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileOpen(false)} className="text-gray-200 hover:text-accent">
                  Login
                </Link>
                <Link to="/register" onClick={() => setMobileOpen(false)} className="fv-btn-primary px-3 py-2 text-sm">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}

export default Navbar
