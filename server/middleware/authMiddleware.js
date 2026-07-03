const jwt = require('jsonwebtoken')
const User = require('../models/User')

// MIDDLEWARE 1 — protect
// Checks if user is logged in (has valid JWT token)
// Use this on any route that requires login
const protect = async (req, res, next) => {
  let token

  // 1. Check if token exists in request headers
  // Frontend sends token like this:
  // Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // 2. Extract token from header
      // "Bearer eyJhbG..." → split by space → take second part
      token = req.headers.authorization.split(' ')[1]

      // 3. Verify the token using our secret key
      // If token is fake or expired, this throws an error
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      // decoded = { id: "65f8a3b2...", role: "member", iat: ..., exp: ... }

      // 4. Find the user from database using id from token
      // .select('-password') means get all fields EXCEPT password
      req.user = await User.findById(decoded.id).select('-password')
      // Now req.user is available in all next middleware and controllers

      // 5. Move to the next middleware or controller
      next()

    } catch (error) {
      res.status(401).json({ message: 'Not authorized, token failed' })
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' })
  }
}

// MIDDLEWARE 2 — adminOnly
// Checks if logged in user is an admin
// Always use AFTER protect middleware
const adminOnly = (req, res, next) => {
  // req.user is set by protect middleware above
  if (req.user && req.user.role === 'admin') {
    next() // user is admin — allow through
  } else {
    res.status(403).json({ message: 'Not authorized as admin' })
    // 403 = Forbidden (logged in but not allowed)
  }
}

// MIDDLEWARE 3 — projectAdmin
// Checks if user is admin of a SPECIFIC project
// Regular system members can be admin of their own projects
const projectAdmin = async (req, res, next) => {
  try {
    const Project = require('../models/Project')

    // Get project id from URL params
    // Example: /api/projects/abc123/tasks → req.params.id = "abc123"
    const project = await Project.findById(req.params.id)

    if (!project) {
      return res.status(404).json({ message: 'Project not found' })
    }

    // Check if current user is the project owner
    const isOwner = project.owner.toString() === req.user._id.toString()

    // Check if current user is a project admin member
    const isProjectAdmin = project.members.some(
      (member) =>
        member.user.toString() === req.user._id.toString() &&
        member.role === 'admin'
    )

    // Check if user is system-wide admin
    const isSystemAdmin = req.user.role === 'admin'

    if (isOwner || isProjectAdmin || isSystemAdmin) {
      next() // allow through
    } else {
      res.status(403).json({
        message: 'Not authorized as project admin',
      })
    }
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = { protect, adminOnly, projectAdmin }