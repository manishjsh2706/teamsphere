const mongoose = require('mongoose')

// A project has members with different roles
// We define this as a sub-schema (a schema inside a schema)
const memberSchema = new mongoose.Schema({
  // Which user is this member?
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    // ref: 'User' means this is a reference to the User collection
    // Like a foreign key in SQL databases
    required: true,
  },

  // What is their role in THIS project?
  // 'admin'  = can manage project settings and members
  // 'member' = can create and update tasks only
  role: {
    type: String,
    enum: ['admin', 'member'],
    default: 'member',
  },

  // When did they join this project?
  joinedAt: {
    type: Date,
    default: Date.now,
  },
})

const projectSchema = new mongoose.Schema(
  {
    // Project name
    name: {
      type: String,
      required: [true, 'Please add a project name'],
      trim: true,
      maxlength: [100, 'Project name cannot exceed 100 characters'],
    },

    // Project description
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },

    // Who created this project?
    // References the User model
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // List of all members in this project
    // Uses the memberSchema we defined above
    members: [memberSchema],

    // Project status
    status: {
      type: String,
      enum: ['active', 'completed', 'archived'],
      default: 'active',
    },

    // Project color for UI display
    // Like Trello board colors
    color: {
      type: String,
      default: '#3B82F6',
      // Default is blue color
    },

    // Due date for the project
    dueDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
)

const Project = mongoose.model('Project', projectSchema)
module.exports = Project