// ─────────────────────────────────────────
// VALIDATION UTILITY FUNCTIONS
// These are reusable functions used across
// all forms in the app
// ─────────────────────────────────────────

// Allowed email domain for TeamSphere
const ALLOWED_DOMAIN = '@teamsphere.com'

// Validate name field
export const validateName = (name) => {
  if (!name || !name.trim()) {
    return 'Name is required'
  }
  if (name.trim().length < 2) {
    return 'Name must be at least 2 characters'
  }
  if (name.trim().length > 50) {
    return 'Name cannot exceed 50 characters'
  }
  return ''
  // empty string means no error
}

// Validate email field
// Must be non-empty AND must end with @teamsphere.com
export const validateEmail = (email) => {
  if (!email || !email.trim()) {
    return 'Email is required'
  }

  // Check if it is a valid email format using regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address'
  }

  // Check if email ends with @teamsphere.com
  if (!email.toLowerCase().endsWith(ALLOWED_DOMAIN)) {
    return `Only ${ALLOWED_DOMAIN} email addresses are allowed`
  }

  return ''
}

// Validate password field
export const validatePassword = (password) => {
  if (!password) {
    return 'Password is required'
  }
  if (password.length < 6) {
    return 'Password must be at least 6 characters'
  }
  if (password.length > 50) {
    return 'Password cannot exceed 50 characters'
  }
  return ''
}

// Validate task title
export const validateTaskTitle = (title) => {
  if (!title || !title.trim()) {
    return 'Task title is required'
  }
  if (title.trim().length < 2) {
    return 'Task title must be at least 2 characters'
  }
  if (title.trim().length > 200) {
    return 'Task title cannot exceed 200 characters'
  }
  return ''
}

// Validate project name
export const validateProjectName = (name) => {
  if (!name || !name.trim()) {
    return 'Project name is required'
  }
  if (name.trim().length < 2) {
    return 'Project name must be at least 2 characters'
  }
  if (name.trim().length > 100) {
    return 'Project name cannot exceed 100 characters'
  }
  return ''
}

// Validate entire register form at once
// Returns object with errors for each field
export const validateRegisterForm = (formData) => {
  return {
    name: validateName(formData.name),
    email: validateEmail(formData.email),
    password: validatePassword(formData.password),
  }
}

// Validate entire login form at once
export const validateLoginForm = (formData) => {
  return {
    email: validateEmail(formData.email),
    password: validatePassword(formData.password),
  }
}

// Check if errors object has any errors
// Returns true if form is valid (no errors)
export const isFormValid = (errors) => {
  return Object.values(errors).every((error) => error === '')
  // every() returns true only if ALL errors are empty strings
}