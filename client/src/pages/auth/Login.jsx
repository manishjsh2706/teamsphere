import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { loginUser, clearError } from '../../store/slices/authSlice'
import FormInput from '../../components/FormInput'
import {
  validateLoginForm,
  isFormValid,
} from '../../utils/validation'

const Login = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const { loading, error, user, success } = useSelector(
    (state) => state.auth
  )

  // Form data
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  // Validation errors
  const [errors, setErrors] = useState({
    email: '',
    password: '',
  })

  // Track touched fields
  const [touched, setTouched] = useState({
    email: false,
    password: false,
  })

  // Redirect after successful login
  useEffect(() => {
    if (user && success) {
      toast.success('Welcome back!')
      navigate('/dashboard')
    }
  }, [user, success, navigate])

  // Show backend errors
  useEffect(() => {
    if (error) {
      toast.error(error)
      dispatch(clearError())
    }
  }, [error, dispatch])

  // Handle input change with real time validation
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })

    if (touched[name]) {
      const newErrors = validateLoginForm({ ...formData, [name]: value })
      setErrors((prev) => ({ ...prev, [name]: newErrors[name] }))
    }
  }

  // Validate on blur (when user leaves field)
  const handleBlur = (e) => {
    const { name } = e.target
    setTouched((prev) => ({ ...prev, [name]: true }))
    const newErrors = validateLoginForm(formData)
    setErrors((prev) => ({ ...prev, [name]: newErrors[name] }))
  }

  // Handle form submit
  const handleSubmit = (e) => {
    e.preventDefault()

    // Touch all fields to show all errors
    setTouched({ email: true, password: true })

    // Validate all fields
    const validationErrors = validateLoginForm(formData)
    setErrors(validationErrors)

    if (!isFormValid(validationErrors)) {
      toast.error('Please fix the errors before submitting')
      return
    }

    dispatch(loginUser(formData))
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)',
    }}>
      <div style={{
        background: 'var(--card-bg)',
        padding: '40px',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '420px',
        boxShadow: 'var(--shadow)',
        border: '1px solid var(--border-color)',
      }}>

        {/* Header */}
        <div style={{ marginBottom: '28px', textAlign: 'center' }}>
          <h1 style={{
            margin: '0 0 4px',
            fontSize: '26px',
            fontWeight: '700',
            color: 'var(--text-primary)',
          }}>
            Team<span style={{ color: '#3b82f6' }}>Sphere</span>
          </h1>
          <h2 style={{
            margin: '0 0 4px',
            fontSize: '20px',
            color: 'var(--text-primary)',
            fontWeight: '600',
          }}>
            Welcome Back
          </h2>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>
            Login with your @teamsphere.com account
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} noValidate>

          {/* Email field */}
          <FormInput
            label="Email Address"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="john@teamsphere.com"
            error={touched.email ? errors.email : ''}
            required
          />

          {/* Password field */}
          <FormInput
            label="Password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Enter your password"
            error={touched.password ? errors.password : ''}
            required
          />

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              background: loading ? '#93c5fd' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '8px',
            }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {/* Register link */}
        <p style={{
          textAlign: 'center',
          marginTop: '20px',
          color: 'var(--text-secondary)',
          fontSize: '14px',
        }}>
          Don't have an account?{' '}
          <Link
            to="/register"
            style={{ color: '#3b82f6', fontWeight: '500' }}
          >
            Register here
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Login