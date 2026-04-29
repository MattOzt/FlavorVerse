import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

function RecipeCard({ recipe, isSaved, onToggleSave }) {
  return (
    <Link to={`/recipes/${recipe.id}`} className="fv-card overflow-hidden transition hover:-translate-y-0.5 hover:border-accent/50">
      <img
        src={recipe.image_url || 'https://images.unsplash.com/photo-1543352634-a1c51d9f1fa7?w=1200&q=80'}
        alt={recipe.title}
        className="h-44 w-full object-cover"
      />
      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-lg font-semibold">{recipe.title}</h3>
          <button
            onClick={(event) => {
              event.preventDefault()
              onToggleSave(recipe.id, isSaved)
            }}
            className={`text-xl ${isSaved ? 'text-accent' : 'text-zinc-500 hover:text-accent'}`}
            aria-label={isSaved ? 'Unsave recipe' : 'Save recipe'}
          >
            {isSaved ? '★' : '☆'}
          </button>
        </div>
        <p className="text-sm text-zinc-300">{recipe.meal_type || 'Meal'}</p>
      </div>
    </Link>
  )
}

function Profile() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('my')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [profile, setProfile] = useState(null)
  const [myRecipes, setMyRecipes] = useState([])
  const [savedRecipes, setSavedRecipes] = useState([])
  const [savedIds, setSavedIds] = useState(new Set())

  useEffect(() => {
    if (!user) return
    const loadProfileData = async () => {
      setLoading(true)
      setError('')

      const [profileRes, myRes, savedRes] = await Promise.all([
        supabase.from('users').select('username, profile_image_url, created_at').eq('id', user.id).maybeSingle(),
        supabase
          .from('recipes')
          .select('id,title,image_url,meal_type,created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('saved_recipes')
          .select('recipe_id, recipes!saved_recipes_recipe_id_fkey(id,title,image_url,meal_type,created_at)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
      ])

      if (profileRes.error || myRes.error || savedRes.error) {
        setError(profileRes.error?.message || myRes.error?.message || savedRes.error?.message || 'Failed to load profile.')
        setLoading(false)
        return
      }

      setProfile(profileRes.data)
      setMyRecipes(myRes.data || [])
      const savedRows = savedRes.data || []
      setSavedRecipes(savedRows.map((row) => row.recipes).filter(Boolean))
      setSavedIds(new Set(savedRows.map((row) => row.recipe_id)))
      setLoading(false)
    }

    loadProfileData()
  }, [user])

  const username = profile?.username || user?.email?.split('@')[0] || 'Chef'
  const memberSince = useMemo(() => {
    if (!profile?.created_at) return ''
    return new Date(profile.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })
  }, [profile])

  const toggleSave = async (recipeId, currentlySaved) => {
    if (!user) return
    setError('')
    if (currentlySaved) {
      const { error: deleteError } = await supabase
        .from('saved_recipes')
        .delete()
        .eq('user_id', user.id)
        .eq('recipe_id', recipeId)
      if (deleteError) {
        setError(deleteError.message)
        return
      }
      setSavedIds((prev) => {
        const next = new Set(prev)
        next.delete(recipeId)
        return next
      })
      setSavedRecipes((prev) => prev.filter((recipe) => recipe.id !== recipeId))
    } else {
      const { error: insertError } = await supabase.from('saved_recipes').insert({ user_id: user.id, recipe_id: recipeId })
      if (insertError) {
        setError(insertError.message)
        return
      }
      setSavedIds((prev) => new Set(prev).add(recipeId))
      const fromMine = myRecipes.find((recipe) => recipe.id === recipeId)
      if (fromMine) {
        setSavedRecipes((prev) => (prev.some((recipe) => recipe.id === recipeId) ? prev : [fromMine, ...prev]))
      }
    }
  }

  return (
    <section className="space-y-6">
      <div className="fv-card p-6">
        <div className="flex items-center gap-4">
          {profile?.profile_image_url ? (
            <img src={profile.profile_image_url} alt={username} className="h-20 w-20 rounded-full object-cover" />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent/20 text-2xl font-bold text-accent">
              {username.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold">{username}</h1>
            <p className="text-zinc-300">Member since {memberSince || 'recently'}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setActiveTab('my')} className={activeTab === 'my' ? 'fv-btn-primary' : 'fv-btn-secondary'}>
          My Recipes
        </button>
        <button onClick={() => setActiveTab('saved')} className={activeTab === 'saved' ? 'fv-btn-primary' : 'fv-btn-secondary'}>
          Saved Recipes
        </button>
      </div>

      {error && <p className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}

      {loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="fv-card h-72 animate-pulse bg-zinc-900/40" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {(activeTab === 'my' ? myRecipes : savedRecipes).map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} isSaved={savedIds.has(recipe.id)} onToggleSave={toggleSave} />
          ))}
        </div>
      )}

      {!loading && (activeTab === 'my' ? myRecipes : savedRecipes).length === 0 && (
        <div className="fv-card p-8 text-center text-zinc-300">
          {activeTab === 'my' ? 'You have not posted any recipes yet.' : 'No saved recipes yet.'}
        </div>
      )}
    </section>
  )
}

export default Profile
