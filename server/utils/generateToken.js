const jwt = require('jsonwebtoken')

// Creates a JWT token for a user
// Takes userId and role as parameters
const generateToken = (id, role) => {
  return jwt.sign(
    {
      id,    // user's MongoDB _id
      role,  // 'admin' or 'member'
      // We store role inside token so middleware
      // can check permissions without hitting database
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '30d',
    }
  )
}

module.exports = generateToken