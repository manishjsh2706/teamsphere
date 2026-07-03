const express = require('express')
const router = express.Router()
const { body } = require('express-validator')

// Import controller functions
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
} = require('../controllers/authController')

// Import middleware
const { protect } = require('../middleware/authMiddleware')

// VALIDATION RULES
// These run BEFORE the controller function
// If validation fails, controller gets the errors via validationResult()

const registerValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please enter a valid email'),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
]

const loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please enter a valid email'),

  body('password')
    .notEmpty()
    .withMessage('Password is required'),
]

// ROUTES

// POST /api/auth/register
// Public — anyone can register
// registerValidation runs first, then registerUser
router.post('/register', registerValidation, registerUser)

// POST /api/auth/login
// Public — anyone can login
router.post('/login', loginValidation, loginUser)

// GET /api/auth/profile
// Private — must be logged in
// protect middleware runs first, then getUserProfile
router.get('/profile', protect, getUserProfile)

// PUT /api/auth/profile
// Private — must be logged in
router.put('/profile', protect, updateUserProfile)

module.exports = router