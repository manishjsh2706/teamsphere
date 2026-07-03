const mongoose = require('mongoose')

const taskSchema = new mongoose.Schema(
  {
    // Task title
    title: {
      type: String,
      required: [true, 'Please add a task title'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },

    // Task description
    description: {
      type: String,
      trim: true,
      default: '',
    },

    // Which project does this task belong to?
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },

    // Who created this task?
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Who is responsible for this task?
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      // null means unassigned
    },

    // Task status — these are the columns on our Trello-like board
    status: {
      type: String,
      enum: ['todo', 'in_progress', 'in_review', 'done'],
      default: 'todo',
    },

    // Task priority
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },

    // Task due date
    dueDate: {
      type: Date,
      default: null,
    },

    // Position of task in the column
    // Used for drag and drop ordering
    // Lower number = higher position
    position: {
      type: Number,
      default: 0,
    },

    // Task labels/tags
    // Example: ['bug', 'feature', 'urgent']
    labels: [
      {
        type: String,
        trim: true,
      },
    ],

    // Attachments (file upload URLs)
    attachments: [
      {
        filename: String,
        url: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
)

const Task = mongoose.model('Task', taskSchema)
module.exports = Task