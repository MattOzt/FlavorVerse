import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert']
const DIETARY_OPTIONS = ['Halal', 'Vegan', 'Keto', 'Gluten-Free']

const emptyIngredient = { name: '', quantity: '', unit: '' }

function CreateRecipe() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [tagRows, setTagRows] = useState([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    cuisine_type: '',
    meal_type: 'Dinner',
    video_url: '',
  })
  const [selectedTags, setSelectedTags] = useState([])
  const [ingredients, setIngredients] = useState([{ ...emptyIngredient }])
  const [steps, setSteps] = useState([''])
  const [imageFile, setImageFile] = useState(null)

  useEffect(() => {
    const loadTags = async () => {
      const { data } = await supabase.from('dietary_tags').select('id,name').in('name', DIETARY_OPTIONS)
      setTagRows(data || [])
    }
    loadTags()
  }, [])

  const validate = () => {
    if (!formData.title.trim()) return 'Title is required.'
    if (!formData.description.trim()) return 'Description is required.'
    if (!formData.cuisine_type.trim()) return 'Cuisine type is required.'
    if (!formData.meal_type) return 'Meal type is required.'
    if (!steps.some((step) => step.trim())) return 'At least one step is required.'
    const validIngredients = ingredients.filter((item) => item.name.trim())
    if (validIngredients.length === 0) return 'At least one ingredient is required.'
    return ''
  }

  const updateIngredient = (index, key, value) => {
    setIngredients((prev) => prev.map((item, i) => (i === index ? { ...item, [key]: value } : item)))
  }

  const updateStep = (index, value) => {
    setSteps((prev) => prev.map((item, i) => (i === index ? value : item)))
  }

  const toggleTag = (tag) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag]))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }
    if (!user) {
      setError('You must be logged in to create a recipe.')
      return
    }

    setSubmitting(true)

    let imageUrl = null
    if (imageFile) {
      const filePath = `${user.id}/${Date.now()}-${imageFile.name}`
      const { error: uploadError } = await supabase.storage.from('recipe-images').upload(filePath, imageFile)
      if (uploadError) {
        setError(uploadError.message)
        setSubmitting(false)
        return
      }
      const { data: publicUrlData } = supabase.storage.from('recipe-images').getPublicUrl(filePath)
      imageUrl = publicUrlData.publicUrl
    }

    const cleanSteps = steps
      .map((step) => step.trim())
      .filter(Boolean)
      .map((step, index) => `${index + 1}. ${step}`)
      .join('\n')

    const { data: recipeRow, error: recipeError } = await supabase
      .from('recipes')
      .insert({
        user_id: user.id,
        title: formData.title.trim(),
        description: formData.description.trim(),
        cuisine_type: formData.cuisine_type.trim(),
        meal_type: formData.meal_type,
        video_url: formData.video_url.trim() || null,
        image_url: imageUrl,
        steps: cleanSteps,
      })
      .select('id')
      .single()

    if (recipeError) {
      setError(recipeError.message)
      setSubmitting(false)
      return
    }

    const validIngredients = ingredients.filter((item) => item.name.trim())
    for (const ingredient of validIngredients) {
      const ingredientName = ingredient.name.trim()
      const ingredientUnit = ingredient.unit.trim() || null
      let ingredientId = null

      const { data: existingIngredient, error: existingError } = await supabase
        .from('ingredients')
        .select('id')
        .eq('name', ingredientName)
        .maybeSingle()

      if (existingError) {
        setError(existingError.message)
        setSubmitting(false)
        return
      }

      if (existingIngredient) {
        ingredientId = existingIngredient.id
      } else {
        const { data: insertedIngredient, error: insertIngredientError } = await supabase
          .from('ingredients')
          .insert({
            name: ingredientName,
            unit: ingredientUnit,
          })
          .select('id')
          .single()

        if (insertIngredientError) {
          setError(insertIngredientError.message)
          setSubmitting(false)
          return
        }
        ingredientId = insertedIngredient.id
      }

      const { error: recipeIngredientError } = await supabase.from('recipe_ingredients').insert({
        recipe_id: recipeRow.id,
        ingredient_id: ingredientId,
        quantity: ingredient.quantity.trim() || null,
      })

      if (recipeIngredientError) {
        setError(recipeIngredientError.message)
        setSubmitting(false)
        return
      }
    }

    const selectedTagIds = tagRows.filter((tag) => selectedTags.includes(tag.name)).map((tag) => tag.id)
    if (selectedTagIds.length > 0) {
      const { error: tagInsertError } = await supabase.from('recipe_tags').insert(
        selectedTagIds.map((tagId) => ({
          recipe_id: recipeRow.id,
          tag_id: tagId,
        })),
      )
      if (tagInsertError) {
        setError(tagInsertError.message)
        setSubmitting(false)
        return
      }
    }

    setSubmitting(false)
    navigate(`/recipes/${recipeRow.id}`)
  }

  return (
    <section className="fv-card mx-auto max-w-4xl p-6">
      <h1 className="mb-6 text-3xl font-bold">Create Recipe</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="mb-1 block text-sm text-gray-300">Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={(event) => setFormData((prev) => ({ ...prev, title: event.target.value }))}
            className="fv-input"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-300">Description</label>
          <textarea
            rows={4}
            value={formData.description}
            onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))}
            className="fv-input"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-gray-300">Cuisine type</label>
            <input
              type="text"
              value={formData.cuisine_type}
              onChange={(event) => setFormData((prev) => ({ ...prev, cuisine_type: event.target.value }))}
              className="fv-input"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-300">Meal type</label>
            <select
              value={formData.meal_type}
              onChange={(event) => setFormData((prev) => ({ ...prev, meal_type: event.target.value }))}
              className="fv-input"
            >
              {MEAL_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm text-gray-300">Dietary tags</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {DIETARY_OPTIONS.map((tag) => (
              <label key={tag} className="flex items-center gap-2 text-sm text-gray-200">
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
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm text-gray-300">Ingredients</p>
            <button
              type="button"
              onClick={() => setIngredients((prev) => [...prev, { ...emptyIngredient }])}
              className="fv-btn-secondary px-3 py-1 text-sm"
            >
              + Add
            </button>
          </div>
          <div className="space-y-3">
            {ingredients.map((item, index) => (
              <div key={index} className="grid gap-2 md:grid-cols-12">
                <input
                  type="text"
                  placeholder="Ingredient name"
                  value={item.name}
                  onChange={(event) => updateIngredient(index, 'name', event.target.value)}
                  className="fv-input md:col-span-5"
                />
                <input
                  type="text"
                  placeholder="Quantity"
                  value={item.quantity}
                  onChange={(event) => updateIngredient(index, 'quantity', event.target.value)}
                  className="fv-input md:col-span-3"
                />
                <input
                  type="text"
                  placeholder="Unit"
                  value={item.unit}
                  onChange={(event) => updateIngredient(index, 'unit', event.target.value)}
                  className="fv-input md:col-span-3"
                />
                <button
                  type="button"
                  disabled={ingredients.length === 1}
                  onClick={() => setIngredients((prev) => prev.filter((_, i) => i !== index))}
                  className="rounded-md border border-red-500/40 px-3 py-2 text-red-300 disabled:opacity-40 md:col-span-1"
                >
                  x
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm text-gray-300">Steps</p>
            <button
              type="button"
              onClick={() => setSteps((prev) => [...prev, ''])}
              className="fv-btn-secondary px-3 py-1 text-sm"
            >
              + Add
            </button>
          </div>
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div key={index} className="flex gap-2">
                <textarea
                  rows={2}
                  placeholder={`Step ${index + 1}`}
                  value={step}
                  onChange={(event) => updateStep(index, event.target.value)}
                  className="fv-input"
                />
                <button
                  type="button"
                  disabled={steps.length === 1}
                  onClick={() => setSteps((prev) => prev.filter((_, i) => i !== index))}
                  className="h-fit rounded-md border border-red-500/40 px-3 py-2 text-red-300 disabled:opacity-40"
                >
                  x
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-gray-300">Recipe image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => setImageFile(event.target.files?.[0] || null)}
              className="fv-input text-gray-300"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-300">Video URL (optional)</label>
            <input
              type="url"
              value={formData.video_url}
              onChange={(event) => setFormData((prev) => ({ ...prev, video_url: event.target.value }))}
              className="fv-input"
            />
          </div>
        </div>

        {error && <p className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="fv-btn-primary px-5 py-2"
        >
          {submitting ? 'Creating...' : 'Create Recipe'}
        </button>
      </form>
    </section>
  )
}

export default CreateRecipe
