const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema(
  {
    // Basic user info
    name: {
      type: String,
      required: [true, 'Please add a name'],
      trim: true,
    },

    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      // Not required because Cognito users won't have password
      // They login through AWS Cognito instead
      minlength: [6, 'Password must be at least 6 characters'],
    },

    // Role in the entire system
    // 'admin'  = can manage everything
    // 'member' = regular user
    role: {
      type: String,
      enum: ['admin', 'member'],
      // enum means only these two values are allowed
      default: 'member',
    },

    // Profile picture URL
    avatar: {
      type: String,
      default: '',
    },

    // AWS Cognito user ID
    // This will be filled when user logs in via Cognito
    // Empty for regular JWT users
    cognitoId: {
      type: String,
      default: '',
    },

    // Is this user's account active?
    // Admin can deactivate users
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    // automatically adds createdAt and updatedAt
  }
)

// Encrypt password before saving
// Same pattern as e-commerce project
userSchema.pre('save', async function () {
  // Skip if password not changed OR if no password (Cognito user)
  if (!this.isModified('password') || !this.password) {
    return
  }

  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
})

// Method to check password during login
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password)
}

const User = mongoose.model('User', userSchema)
module.exports = User