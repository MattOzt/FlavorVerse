import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

function ShoppingList() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return
    const loadItems = async () => {
      setLoading(true)
      const { data, error: loadError } = await supabase
        .from('shopping_list_items')
        .select(
          `
          id,
          ingredient_name,
          quantity,
          checked,
          recipe_id,
          created_at,
          recipes!shopping_list_items_recipe_id_fkey ( title )
        `,
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (loadError) {
        setError(loadError.message)
        setLoading(false)
        return
      }
      setItems(data || [])
      setLoading(false)
    }
    loadItems()
  }, [user])

  const toggleChecked = async (item) => {
    const { error: updateError } = await supabase
      .from('shopping_list_items')
      .update({ checked: !item.checked })
      .eq('id', item.id)
      .eq('user_id', user.id)
    if (updateError) {
      setError(updateError.message)
      return
    }
    setItems((prev) => prev.map((row) => (row.id === item.id ? { ...row, checked: !row.checked } : row)))
  }

  const deleteItem = async (id) => {
    const { error: deleteError } = await supabase.from('shopping_list_items').delete().eq('id', id).eq('user_id', user.id)
    if (deleteError) {
      setError(deleteError.message)
      return
    }
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  const clearChecked = async () => {
    const { error: clearError } = await supabase
      .from('shopping_list_items')
      .delete()
      .eq('user_id', user.id)
      .eq('checked', true)
    if (clearError) {
      setError(clearError.message)
      return
    }
    setItems((prev) => prev.filter((item) => !item.checked))
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Shopping List</h1>
        <button onClick={clearChecked} className="fv-btn-secondary">
          Clear checked items
        </button>
      </div>

      {error && <p className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}

      {loading ? (
        <div className="fv-card p-6 text-zinc-300">Loading your shopping list...</div>
      ) : items.length === 0 ? (
        <div className="fv-card p-10 text-center text-zinc-300">
          Your shopping list is empty. Add ingredients from a recipe!
        </div>
      ) : (
        <div className="fv-card divide-y divide-zinc-800">
          {items.map((item) => (
            <div key={item.id} className="flex items-start justify-between gap-4 p-4">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={() => toggleChecked(item)}
                  className="mt-1 h-4 w-4 accent-accent"
                />
                <div>
                  <p className={`${item.checked ? 'text-zinc-500 line-through' : 'text-zinc-100'}`}>
                    {[item.quantity, item.ingredient_name].filter(Boolean).join(' ').trim()}
                  </p>
                  {item.recipe_id && item.recipes?.title && (
                    <Link to={`/recipes/${item.recipe_id}`} className="text-xs text-zinc-400 hover:text-accent">
                      From: {item.recipes.title}
                    </Link>
                  )}
                </div>
              </div>
              <button onClick={() => deleteItem(item.id)} className="rounded-md px-2 py-1 text-sm text-red-300 hover:bg-red-500/10">
                X
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export default ShoppingList
