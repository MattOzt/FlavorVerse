import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { supabase } from '../lib/supabase'

function Register() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ email: '', password: '', username: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    const { error: signUpError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          username: formData.username,
        },
      },
    })

    if (signUpError) {
      setSubmitting(false)
      setError(signUpError.message)
      return
    }

    setSubmitting(false)
    navigate('/', { replace: true })
  }

  return (
    <section className="fv-card mx-auto max-w-md p-6">
      <h1 className="mb-6 text-3xl font-bold">Register</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm text-gray-300" htmlFor="username">
            Username
          </label>
          <input
            id="username"
            name="username"
            type="text"
            required
            value={formData.username}
            onChange={handleChange}
            className="fv-input"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-300" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={formData.email}
            onChange={handleChange}
            className="fv-input"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-300" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            value={formData.password}
            onChange={handleChange}
            className="fv-input"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="fv-btn-primary w-full"
        >
          {submitting ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      <p className="mt-4 text-sm text-gray-300">
        Already have an account?{' '}
        <Link className="text-accent" to="/login">
          Login here
        </Link>
      </p>
    </section>
  )
}

export default Register
