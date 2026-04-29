import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

function formatDate(value) {
  if (!value) return ''
  return new Date(value).toLocaleString()
}

function getYoutubeEmbedUrl(rawUrl) {
  try {
    const url = new URL(rawUrl)
    if (!url.hostname.includes('youtube.com') && !url.hostname.includes('youtu.be')) return null
    if (url.hostname.includes('youtu.be')) {
      const id = url.pathname.replace('/', '')
      return id ? `https://www.youtube.com/embed/${id}` : null
    }
    const id = url.searchParams.get('v')
    return id ? `https://www.youtube.com/embed/${id}` : null
  } catch {
    return null
  }
}

function RecipeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [recipe, setRecipe] = useState(null)
  const [ingredients, setIngredients] = useState([])
  const [tags, setTags] = useState([])
  const [comments, setComments] = useState([])
  const [averageRating, setAverageRating] = useState(0)
  const [userRating, setUserRating] = useState(0)
  const [ratingBusy, setRatingBusy] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [commentBusy, setCommentBusy] = useState(false)
  const [shoppingBusy, setShoppingBusy] = useState(false)
  const [actionMessage, setActionMessage] = useState('')

  const isAuthor = user && recipe && user.id === recipe.user_id
  const stepItems = useMemo(
    () =>
      (recipe?.steps || '')
        .split('\n')
        .map((step) => step.trim())
        .filter(Boolean),
    [recipe],
  )

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true)
      setError('')

      const { data: recipeData, error: recipeError } = await supabase
        .from('recipes')
        .select(
          `
          id,
          user_id,
          title,
          description,
          steps,
          image_url,
          video_url,
          created_at,
          users!recipes_user_id_fkey ( username )
        `,
        )
        .eq('id', id)
        .single()

      if (recipeError) {
        setError(recipeError.message)
        setLoading(false)
        return
      }

      const [
        ingredientsRes,
        tagsRes,
        ratingsRes,
        commentsRes,
        currentUserRatingRes,
      ] = await Promise.all([
        supabase
          .from('recipe_ingredients')
          .select('quantity, ingredients!recipe_ingredients_ingredient_id_fkey(name, unit)')
          .eq('recipe_id', id),
        supabase
          .from('recipe_tags')
          .select('dietary_tags!recipe_tags_tag_id_fkey(name)')
          .eq('recipe_id', id),
        supabase.from('ratings').select('score').eq('recipe_id', id),
        supabase
          .from('comments')
          .select(
            `
            id,
            content,
            created_at,
            user_id,
            users!comments_user_id_fkey(username)
          `,
          )
          .eq('recipe_id', id)
          .order('created_at', { ascending: false }),
        user
          ? supabase
              .from('ratings')
              .select('score')
              .eq('recipe_id', id)
              .eq('user_id', user.id)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
      ])

      if (ingredientsRes.error || tagsRes.error || ratingsRes.error || commentsRes.error || currentUserRatingRes.error) {
        setError(
          ingredientsRes.error?.message ||
            tagsRes.error?.message ||
            ratingsRes.error?.message ||
            commentsRes.error?.message ||
            currentUserRatingRes.error?.message ||
            'Failed to load recipe details.',
        )
        setLoading(false)
        return
      }

      const ratings = ratingsRes.data || []
      const avg = ratings.length ? ratings.reduce((sum, item) => sum + item.score, 0) / ratings.length : 0

      setRecipe({
        ...recipeData,
        authorName: recipeData.users?.username || 'Unknown chef',
      })
      setIngredients(
        (ingredientsRes.data || []).map((item) => ({
          name: item.ingredients?.name || '',
          unit: item.ingredients?.unit || '',
          quantity: item.quantity || '',
        })),
      )
      setTags((tagsRes.data || []).map((item) => item.dietary_tags?.name).filter(Boolean))
      setComments(
        (commentsRes.data || []).map((item) => ({
          ...item,
          authorName: item.users?.username || 'Unknown user',
        })),
      )
      setAverageRating(avg)
      setUserRating(currentUserRatingRes.data?.score || 0)
      setLoading(false)
    }

    fetchDetail()
  }, [id, user])

  const submitRating = async (score) => {
    if (!user || !recipe) return
    setRatingBusy(true)
    setActionMessage('')
    const { error: upsertError } = await supabase.from('ratings').upsert(
      {
        user_id: user.id,
        recipe_id: recipe.id,
        score,
      },
      { onConflict: 'user_id,recipe_id' },
    )

    if (upsertError) {
      setActionMessage(upsertError.message)
      setRatingBusy(false)
      return
    }

    const { data: ratingsData } = await supabase.from('ratings').select('score').eq('recipe_id', recipe.id)
    const ratings = ratingsData || []
    const avg = ratings.length ? ratings.reduce((sum, item) => sum + item.score, 0) / ratings.length : 0
    setUserRating(score)
    setAverageRating(avg)
    setRatingBusy(false)
  }

  const addIngredientsToShoppingList = async () => {
    if (!user || !recipe || ingredients.length === 0) return
    setShoppingBusy(true)
    setActionMessage('')
    const payload = ingredients
      .filter((item) => item.name && item.name.trim())
      .map((item) => ({
        user_id: user.id,
        ingredient_name: item.name.trim(),
        quantity: [item.quantity, item.unit].filter(Boolean).join(' ').trim() || null,
        recipe_id: recipe.id,
      }))
    if (payload.length === 0) {
      setShoppingBusy(false)
      setActionMessage('No valid ingredients found for this recipe.')
      return
    }
    const { error: insertError } = await supabase.from('shopping_list_items').insert(payload)
    if (insertError) {
      setActionMessage(insertError.message)
      setShoppingBusy(false)
      return
    }
    setActionMessage('Added all ingredients to your shopping list.')
    setShoppingBusy(false)
  }

  const submitComment = async (event) => {
    event.preventDefault()
    if (!user || !commentText.trim() || !recipe) return
    setCommentBusy(true)
    setActionMessage('')
    const { data: inserted, error: insertError } = await supabase
      .from('comments')
      .insert({
        user_id: user.id,
        recipe_id: recipe.id,
        content: commentText.trim(),
      })
      .select(
        `
        id,
        content,
        created_at,
        user_id,
        users!comments_user_id_fkey(username)
      `,
      )
      .single()

    if (insertError) {
      setActionMessage(insertError.message)
      setCommentBusy(false)
      return
    }

    setComments((prev) => [
      { ...inserted, authorName: inserted.users?.username || 'Unknown user' },
      ...prev,
    ])
    setCommentText('')
    setCommentBusy(false)
  }

  const deleteRecipe = async () => {
    if (!recipe || !isAuthor) return
    const confirmed = window.confirm('Are you sure you want to delete this recipe? This cannot be undone.')
    if (!confirmed) return
    const { error: deleteError } = await supabase.from('recipes').delete().eq('id', recipe.id)
    if (deleteError) {
      setActionMessage(deleteError.message)
      return
    }
    navigate('/recipes', { replace: true })
  }

  if (loading) {
    return <div className="text-gray-300">Loading recipe...</div>
  }

  if (error) {
    return <div className="rounded-md border border-red-500/30 bg-red-500/10 p-4 text-red-300">{error}</div>
  }

  if (!recipe) {
    return <div className="text-gray-300">Recipe not found.</div>
  }

  const youtubeEmbed = recipe.video_url?.toLowerCase().includes('youtube')
    ? getYoutubeEmbedUrl(recipe.video_url)
    : null

  return (
    <section className="space-y-8">
      <div className="fv-card overflow-hidden">
        <img
          src={recipe.image_url || 'https://images.unsplash.com/photo-1543352634-a1c51d9f1fa7?w=1200&q=80'}
          alt={recipe.title}
          className="h-80 w-full object-cover"
        />
        <div className="space-y-4 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold">{recipe.title}</h1>
              <p className="mt-1 text-sm text-gray-300">By {recipe.authorName}</p>
            </div>
            {isAuthor && (
              <div className="flex gap-2">
                <Link to={`/create?edit=${recipe.id}`} className="fv-btn-secondary px-4 py-2 text-sm">
                  Edit
                </Link>
                <button
                  onClick={deleteRecipe}
                  className="rounded-md border border-red-500/40 px-4 py-2 text-sm text-red-300"
                >
                  Delete
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {tags.length ? (
              tags.map((tag) => (
                <span key={tag} className="rounded-full border border-accent/50 bg-accent/10 px-3 py-1 text-xs text-accent">
                  {tag}
                </span>
              ))
            ) : (
              <span className="text-sm text-gray-500">No dietary tags</span>
            )}
          </div>

          <p className="text-accent">⭐ {averageRating ? averageRating.toFixed(1) : 'No ratings yet'}</p>
          <p className="text-gray-200">{recipe.description || 'No description provided.'}</p>
        </div>
      </div>

      {recipe.video_url && (
        <div className="fv-card overflow-hidden p-4">
          <h2 className="mb-3 text-xl font-semibold">Video</h2>
          {youtubeEmbed ? (
            <iframe
              className="h-72 w-full rounded-md"
              src={youtubeEmbed}
              title="Recipe video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video controls className="h-72 w-full rounded-md bg-black">
              <source src={recipe.video_url} />
              Your browser does not support the video tag.
            </video>
          )}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="fv-card p-5">
          <h2 className="mb-4 text-xl font-semibold">Ingredients</h2>
          <ul className="space-y-2 text-gray-200">
            {ingredients.map((item, index) => (
              <li key={`${item.name}-${index}`} className="rounded-md bg-zinc-950/70 px-3 py-2">
                {[item.quantity, item.name].filter(Boolean).join(' ').trim()}
              </li>
            ))}
          </ul>
          {user && (
            <button
              onClick={addIngredientsToShoppingList}
              disabled={shoppingBusy || ingredients.length === 0}
              className="fv-btn-primary mt-4 text-sm"
            >
              {shoppingBusy ? 'Adding...' : 'Add all ingredients to Shopping List'}
            </button>
          )}
        </div>

        <div className="fv-card p-5">
          <h2 className="mb-4 text-xl font-semibold">Steps</h2>
          <ol className="list-decimal space-y-3 pl-5 text-gray-200">
            {stepItems.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ol>
        </div>
      </div>

      <div className="fv-card p-5">
        <h2 className="mb-4 text-xl font-semibold">Rate this recipe</h2>
        {user ? (
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                disabled={ratingBusy}
                onClick={() => submitRating(star)}
                className={`text-2xl ${star <= userRating ? 'text-accent' : 'text-zinc-600'}`}
                aria-label={`Rate ${star} stars`}
              >
                ★
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-300">Log in to rate this recipe.</p>
        )}
      </div>

      <div className="fv-card p-5">
        <h2 className="mb-4 text-xl font-semibold">Comments</h2>
        {user ? (
          <form onSubmit={submitComment} className="mb-5 space-y-3">
            <textarea
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              rows={4}
              className="fv-input"
              placeholder="Share your thoughts..."
            />
            <button
              type="submit"
              disabled={commentBusy || !commentText.trim()}
              className="fv-btn-primary text-sm"
            >
              {commentBusy ? 'Posting...' : 'Post Comment'}
            </button>
          </form>
        ) : (
          <p className="mb-4 text-sm text-gray-300">Log in to leave a comment.</p>
        )}

        <div className="space-y-3">
          {comments.length ? (
            comments.map((comment) => (
              <article key={comment.id} className="rounded-md border border-zinc-800 bg-zinc-950/50 p-3">
                <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                  <span className="font-semibold text-gray-200">{comment.authorName}</span>
                  <span className="text-gray-500">{formatDate(comment.created_at)}</span>
                </div>
                <p className="text-gray-300">{comment.content}</p>
              </article>
            ))
          ) : (
            <p className="text-gray-400">No comments yet.</p>
          )}
        </div>
      </div>

      {actionMessage && (
        <p className="rounded-md border border-zinc-700 bg-zinc-900/70 p-3 text-sm text-gray-200">{actionMessage}</p>
      )}
    </section>
  )
}

export default RecipeDetail
