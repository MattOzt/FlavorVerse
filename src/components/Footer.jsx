import { Link } from 'react-router-dom'

function Footer() {
  return (
    <footer className="mt-14 border-t border-zinc-800/80 bg-zinc-950/50">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col justify-between gap-6 px-5 py-8 sm:px-8 lg:flex-row lg:items-center lg:px-10">
        <div>
          <p className="text-xl font-semibold tracking-tight text-accent">FlavorVerse</p>
          <p className="mt-2 max-w-md text-sm text-zinc-400">
            Discover globally inspired recipes, save your favorites, and cook with confidence every day.
          </p>
        </div>
        <nav className="flex items-center gap-6 text-sm text-zinc-300">
          <Link to="/" className="transition hover:text-accent">
            Home
          </Link>
          <Link to="/recipes" className="transition hover:text-accent">
            Recipes
          </Link>
          <Link to="/about" className="transition hover:text-accent">
            About
          </Link>
        </nav>
      </div>
    </footer>
  )
}

export default Footer
