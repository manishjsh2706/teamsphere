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

    // Which project this task belongs to
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },

    // Who created this task
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Who is assigned to this task
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // Task status — matches board columns
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

    // Target/due date — when task should be completed
    dueDate: {
      type: Date,
      default: null,
    },

    // Position in the column for drag and drop ordering
    position: {
      type: Number,
      default: 0,
    },

    // Labels/tags for the task
    labels: [
      {
        type: String,
        trim: true,
      },
    ],

    // File attachments
    // Each attachment has filename, original name, url, size, type
    attachments: [
      {
        // Unique filename stored on server (uuid generated)
        filename: {
          type: String,
          required: true,
        },
        // Original filename uploaded by user
        originalName: {
          type: String,
          required: true,
        },
        // URL to access the file
        url: {
          type: String,
          required: true,
        },
        // File size in bytes
        size: {
          type: Number,
          default: 0,
        },
        // File MIME type (image/png, application/pdf etc)
        mimetype: {
          type: String,
          default: '',
        },
        // When was this attachment uploaded
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
        // Who uploaded this attachment
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          default: null,
        },
      },
    ],
  },
  {
    timestamps: true,
    // Automatically adds createdAt and updatedAt
  }
)

const Task = mongoose.model('Task', taskSchema)
module.exports = Task