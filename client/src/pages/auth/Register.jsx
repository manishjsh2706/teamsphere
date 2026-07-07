import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { registerUser, clearError } from '../../store/slices/authSlice'
import FormInput from '../../components/FormInput'
import {
  validateRegisterForm,
  isFormValid,
} from '../../utils/validation'

const Register = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const { loading, error, user, success } = useSelector(
    (state) => state.auth
  )

  // Form data state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  })

  // Validation errors state
  // Each key matches a form field
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    password: '',
  })

  // Track if user has touched each field
  // We only show errors after user has interacted with a field
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
  })

  // Redirect to dashboard after successful register
  useEffect(() => {
    if (user && success) {
      toast.success('Account created successfully!')
      navigate('/dashboard')
    }
  }, [user, success, navigate])

  // Show backend error as toast
  useEffect(() => {
    if (error) {
      toast.error(error)
      dispatch(clearError())
    }
  }, [error, dispatch])

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target

    // Update form data
    setFormData({ ...formData, [name]: value })

    // Validate this field in real time
    // but only if user has already touched it
    if (touched[name]) {
      const newErrors = validateRegisterForm({
        ...formData,
        [name]: value,
      })
      setErrors((prev) => ({ ...prev, [name]: newErrors[name] }))
    }
  }

  // Mark field as touched when user leaves it
  // This triggers validation for that field
  const handleBlur = (e) => {
    const { name } = e.target

    // Mark as touched
    setTouched((prev) => ({ ...prev, [name]: true }))

    // Validate this specific field
    const newErrors = validateRegisterForm(formData)
    setErrors((prev) => ({ ...prev, [name]: newErrors[name] }))
  }

  // Handle form submit
  const handleSubmit = (e) => {
    e.preventDefault()

    // Mark all fields as touched so all errors show
    setTouched({ name: true, email: true, password: true })

    // Validate all fields
    const validationErrors = validateRegisterForm(formData)
    setErrors(validationErrors)

    // Stop if any errors exist
    if (!isFormValid(validationErrors)) {
      toast.error('Please fix the errors before submitting')
      return
    }

    // All valid — dispatch register action
    dispatch(registerUser(formData))
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
            Create Account
          </h2>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>
            Only @teamsphere.com emails are allowed
          </p>
        </div>

        {/* Register Form */}
        <form onSubmit={handleSubmit} noValidate>

          {/* Name field */}
          <FormInput
            label="Full Name"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="John Doe"
            error={touched.name ? errors.name : ''}
            required
          />

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
            placeholder="Min 6 characters"
            error={touched.password ? errors.password : ''}
            required
            minLength={6}
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
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        {/* Login link */}
        <p style={{
          textAlign: 'center',
          marginTop: '20px',
          color: 'var(--text-secondary)',
          fontSize: '14px',
        }}>
          Already have an account?{' '}
          <Link
            to="/login"
            style={{ color: '#3b82f6', fontWeight: '500' }}
          >
            Login here
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Register