const User = require('../models/User')
const generateToken = require('../utils/generateToken')
const { validationResult } = require('express-validator')

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public (anyone can register)
const registerUser = async (req, res) => {
  try {
    // 1. Check validation errors from express-validator
    // We will set up validation rules in the routes file
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: errors.array()[0].msg,
        // Send first error message only
      })
    }

    // 2. Get data from request body
    const { name, email, password } = req.body

    // 3. Check if user already exists
    const userExists = await User.findOne({ email })
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' })
    }

    // 4. Create new user
    // Password gets auto-encrypted by pre('save') hook in User model
    const user = await User.create({
      name,
      email,
      password,
      role: 'member', // all new users are members by default
    })

    // 5. Send response with user info and token
    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        token: generateToken(user._id, user.role),
      })
    }
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    // 1. Check validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: errors.array()[0].msg,
      })
    }

    const { email, password } = req.body

    // 2. Find user by email
    const user = await User.findOne({ email })

    // 3. Check user exists and password matches
    if (user && (await user.matchPassword(password))) {

      // 4. Check if account is active
      if (!user.isActive) {
        return res.status(401).json({
          message: 'Your account has been deactivated. Contact admin.',
        })
      }

      // 5. Send response
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        token: generateToken(user._id, user.role),
      })
    } else {
      res.status(401).json({ message: 'Invalid email or password' })
    }
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Get current logged in user profile
// @route   GET /api/auth/profile
// @access  Private (requires token)
const getUserProfile = async (req, res) => {
  try {
    // req.user is set by protect middleware
    // We already have user from middleware — no need to hit DB again
    const user = await User.findById(req.user._id).select('-password')

    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        createdAt: user.createdAt,
      })
    } else {
      res.status(404).json({ message: 'User not found' })
    }
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    // Find user by id from token
    const user = await User.findById(req.user._id)

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Update only fields that were sent
    // If field not sent, keep existing value
    user.name = req.body.name || user.name
    user.avatar = req.body.avatar || user.avatar

    // Only update password if new password was sent
    if (req.body.password) {
      user.password = req.body.password
      // pre('save') hook will auto-encrypt new password
    }

    // Save updated user
    const updatedUser = await user.save()

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      avatar: updatedUser.avatar,
      token: generateToken(updatedUser._id, updatedUser.role),
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
}