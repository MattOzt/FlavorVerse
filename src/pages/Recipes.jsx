import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const DIETARY_OPTIONS = ['Halal', 'Vegan', 'Keto', 'Gluten-Free']

function SkeletonCard() {
  return (
    <div className="fv-card overflow-hidden">
      <div className="h-48 animate-pulse bg-zinc-800" />
      <div className="space-y-3 p-4">
        <div className="h-5 w-3/4 animate-pulse rounded bg-zinc-800" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-zinc-800" />
        <div className="h-4 w-1/3 animate-pulse rounded bg-zinc-800" />
        <div className="flex gap-2">
          <div className="h-6 w-16 animate-pulse rounded-full bg-zinc-800" />
          <div className="h-6 w-16 animate-pulse rounded-full bg-zinc-800" />
        </div>
      </div>
    </div>
  )
}

function Recipes() {
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [selectedTags, setSelectedTags] = useState([])
  const [mealType, setMealType] = useState('All')
  const [sortBy, setSortBy] = useState('newest')

  useEffect(() => {
    const fetchRecipes = async () => {
      setLoading(true)
      setError('')

      const { data, error: fetchError } = await supabase
        .from('recipes')
        .select(
          `
          id,
          title,
          image_url,
          meal_type,
          created_at,
          users!recipes_user_id_fkey ( username ),
          ratings ( score ),
          recipe_tags (
            dietary_tags!recipe_tags_tag_id_fkey ( name )
          )
        `,
        )

      if (fetchError) {
        setError(fetchError.message)
        setLoading(false)
        return
      }

      const normalized = (data ?? []).map((recipe) => {
        const ratingValues = (recipe.ratings ?? [])
          .map((rating) => rating.score)
          .filter((score) => typeof score === 'number')

        const averageRating = ratingValues.length
          ? ratingValues.reduce((sum, score) => sum + score, 0) / ratingValues.length
          : 0

        const tagNames = (recipe.recipe_tags ?? [])
          .map((recipeTag) => recipeTag?.dietary_tags?.name)
          .filter(Boolean)

        return {
          ...recipe,
          authorName: recipe.users?.username ?? 'Unknown chef',
          averageRating,
          ratingCount: ratingValues.length,
          tagNames,
        }
      })

      setRecipes(normalized)
      setLoading(false)
    }

    fetchRecipes()
  }, [])

  const mealTypeOptions = useMemo(() => {
    const dynamicOptions = Array.from(
      new Set(recipes.map((recipe) => recipe.meal_type).filter((value) => value && value.trim() !== '')),
    )
    return ['All', ...dynamicOptions]
  }, [recipes])

  const visibleRecipes = useMemo(() => {
    const loweredSearch = search.trim().toLowerCase()
    let filtered = recipes.filter((recipe) => {
      const matchesSearch = recipe.title?.toLowerCase().includes(loweredSearch)
      const matchesMealType = mealType === 'All' || recipe.meal_type === mealType
      const matchesTags =
        selectedTags.length === 0 || selectedTags.every((tag) => recipe.tagNames.includes(tag))
      return matchesSearch && matchesMealType && matchesTags
    })

    filtered = [...filtered].sort((a, b) => {
      if (sortBy === 'top-rated') {
        return b.averageRating - a.averageRating || b.ratingCount - a.ratingCount
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    return filtered
  }, [recipes, search, selectedTags, mealType, sortBy])

  const toggleTag = (tag) => {
    setSelectedTags((current) =>
      current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag],
    )
  }

  return (
    <section className="space-y-8">
      <div className="mb-2">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Recipes</h1>
        <p className="mt-3 text-base text-gray-300">Find your next favorite meal on FlavorVerse.</p>
      </div>

      <div className="fv-card mb-6 grid gap-4 p-5 md:grid-cols-3">
        <div className="md:col-span-3">
          <label htmlFor="recipe-search" className="mb-1 block text-sm text-gray-300">
            Search by title
          </label>
          <input
            id="recipe-search"
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search recipes..."
            className="fv-input"
          />
        </div>

        <div>
          <p className="mb-2 text-sm text-gray-300">Dietary tags</p>
          <div className="space-y-2">
            {DIETARY_OPTIONS.map((tag) => (
              <label key={tag} className="flex cursor-pointer items-center gap-2 text-sm text-gray-200">
                <input
                  type="checkbox"
                  checked={selectedTags.includes(tag)}
                  onChange={() => toggleTag(tag)}
                  className="h-4 w-4 accent-accent"
                />
                {tag}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="meal-type" className="mb-1 block text-sm text-gray-300">
            Meal type
          </label>
          <select
            id="meal-type"
            value={mealType}
            onChange={(event) => setMealType(event.target.value)}
            className="fv-input"
          >
            {mealTypeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="sort-by" className="mb-1 block text-sm text-gray-300">
            Sort by
          </label>
          <select
            id="sort-by"
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
            className="fv-input"
          >
            <option value="newest">Newest</option>
            <option value="top-rated">Top Rated</option>
          </select>
        </div>
      </div>

      {error && <p className="mb-4 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-red-300">{error}</p>}

      {loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      ) : visibleRecipes.length === 0 ? (
        <div className="fv-card p-8 text-center text-gray-300">
          No recipes match your current filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visibleRecipes.map((recipe) => (
            <Link
              key={recipe.id}
              to={`/recipes/${recipe.id}`}
              className="fv-card overflow-hidden transition hover:-translate-y-0.5 hover:border-accent/50"
            >
              <img
                src={recipe.image_url || 'https://images.unsplash.com/photo-1543352634-a1c51d9f1fa7?w=1200&q=80'}
                alt={recipe.title}
                className="h-64 w-full object-cover"
              />
              <div className="space-y-3 p-5">
                <h2 className="line-clamp-2 text-2xl font-semibold tracking-tight text-white">{recipe.title}</h2>
                <p className="text-sm text-gray-300">By {recipe.authorName}</p>
                <p className="text-sm text-accent">
                  ⭐ {recipe.averageRating ? recipe.averageRating.toFixed(1) : 'No ratings'}
                </p>
                <div className="flex flex-wrap gap-2">
                  {recipe.tagNames.length ? (
                    recipe.tagNames.map((tag) => (
                      <span
                        key={`${recipe.id}-${tag}`}
                        className="rounded-full border border-accent/40 bg-accent/10 px-2 py-1 text-xs text-accent"
                      >
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-500">No dietary tags</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}

export default Recipes
