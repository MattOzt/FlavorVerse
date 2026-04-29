import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function RecipeShowcaseCard({ recipe }) {
  return (
    <Link to={`/recipes/${recipe.id}`} className="fv-card overflow-hidden transition hover:-translate-y-0.5 hover:border-accent/50">
      <img
        src={recipe.image_url || 'https://images.unsplash.com/photo-1543352634-a1c51d9f1fa7?w=1200&q=80'}
        alt={recipe.title}
        className="h-72 w-full object-cover"
      />
      <div className="space-y-4 p-6">
        <h3 className="line-clamp-2 text-2xl font-semibold tracking-tight">{recipe.title}</h3>
        <p className="line-clamp-2 text-sm leading-relaxed text-zinc-300">
          {recipe.description || 'A delicious dish from our FlavorVerse community.'}
        </p>
        <p className="text-sm text-zinc-300">By {recipe.authorName}</p>
        <p className="text-base text-accent">⭐ {recipe.averageRating ? recipe.averageRating.toFixed(1) : 'No ratings'}</p>
        <div className="flex flex-wrap gap-2">
          {recipe.tagNames.length ? (
            recipe.tagNames.map((tag) => (
              <span key={`${recipe.id}-${tag}`} className="rounded-full border border-accent/40 bg-accent/10 px-2 py-1 text-xs text-accent">
                {tag}
              </span>
            ))
          ) : (
            <span className="text-xs text-zinc-500">No dietary tags</span>
          )}
        </div>
      </div>
    </Link>
  )
}

function Home() {
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadHomeRecipes = async () => {
      const { data } = await supabase
        .from('recipes')
        .select(
          `
          id,
          title,
          description,
          image_url,
          created_at,
          users!recipes_user_id_fkey ( username ),
          ratings ( score ),
          recipe_tags (
            dietary_tags!recipe_tags_tag_id_fkey ( name )
          )
        `,
        )

      const normalized = (data || []).map((recipe) => {
        const ratingValues = (recipe.ratings || []).map((r) => r.score).filter((score) => typeof score === 'number')
        const averageRating = ratingValues.length
          ? ratingValues.reduce((sum, score) => sum + score, 0) / ratingValues.length
          : 0
        return {
          ...recipe,
          authorName: recipe.users?.username || 'Unknown chef',
          averageRating,
          tagNames: (recipe.recipe_tags || []).map((row) => row.dietary_tags?.name).filter(Boolean),
        }
      })
      setRecipes(normalized)
      setLoading(false)
    }
    loadHomeRecipes()
  }, [])

  const featuredRecipes = useMemo(
    () => [...recipes].sort((a, b) => b.averageRating - a.averageRating).slice(0, 3),
    [recipes],
  )
  const recentRecipes = useMemo(
    () =>
      [...recipes]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 6),
    [recipes],
  )

  return (
    <section className="space-y-16">
      <div className="relative -mx-4 overflow-hidden md:-mx-6 lg:-mx-8">
        <img
          src="https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1800&q=80"
          alt="Fresh pasta dish with herbs and cheese"
          className="h-[70vh] w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/35" />
        <div className="absolute inset-0 flex items-center">
          <div className="mx-auto w-full max-w-6xl px-6">
            <p className="mb-4 text-sm uppercase tracking-[0.3em] text-accent">FlavorVerse</p>
            <h1 className="max-w-3xl text-4xl font-bold leading-tight sm:text-5xl md:text-6xl">
              Discover & Share Recipes
            </h1>
            <p className="mt-4 max-w-2xl text-base text-zinc-200 sm:text-lg">
              Cook smarter with globally inspired recipes from home chefs. Save favorites, rate dishes, and build
              your shopping list in one place.
            </p>
            <Link to="/recipes" className="fv-btn-primary mt-8 inline-flex px-6 py-3">
              Browse Recipes
            </Link>
          </div>
        </div>
      </div>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Featured Recipes</h2>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="fv-card h-[30rem] animate-pulse bg-zinc-900/40" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {featuredRecipes.map((recipe) => (
              <RecipeShowcaseCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        )}
        <Link to="/recipes" className="fv-btn-secondary inline-flex">
          View All Recipes
        </Link>
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Recently Added</h2>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="fv-card h-[30rem] animate-pulse bg-zinc-900/40" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {recentRecipes.map((recipe) => (
              <RecipeShowcaseCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        )}
        <Link to="/recipes" className="fv-btn-secondary inline-flex">
          View All Recipes
        </Link>
      </section>
    </section>
  )
}

export default Home
