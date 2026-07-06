const Task = require('../models/Task')
const Project = require('../models/Project')

// Helper function — checks if user is member of a project
// We use this in multiple task functions
const checkProjectMember = async (projectId, userId) => {
  const project = await Project.findById(projectId)
  if (!project) return { error: 'Project not found', status: 404 }

  const isMember = project.members.some(
    (m) => m.user.toString() === userId.toString()
  )
  if (!isMember) return { error: 'Not a member of this project', status: 403 }

  return { project }
}

// @desc    Create a task in a project
// @route   POST /api/projects/:id/tasks
// @access  Private (project members only)
const createTask = async (req, res) => {
  try {
    // Check if user is project member
    const { error, status, project } = await checkProjectMember(
      req.params.id,
      req.user._id
    )
    if (error) return res.status(status).json({ message: error })

    const { title, description, assignedTo, priority, dueDate, labels } =
      req.body

    if (!title) {
      return res.status(400).json({ message: 'Task title is required' })
    }

    // Get position — new task goes to bottom of todo column
    // Count existing tasks in todo status for this project
    const taskCount = await Task.countDocuments({
      project: req.params.id,
      status: 'todo',
    })

    const task = await Task.create({
      title,
      description,
      project: req.params.id,
      createdBy: req.user._id,
      assignedTo: assignedTo || null,
      priority: priority || 'medium',
      dueDate: dueDate || null,
      labels: labels || [],
      status: 'todo',
      position: taskCount,
      // New task position = total existing tasks in todo
      // So it goes to the bottom
    })

    // Populate user details
    await task.populate('createdBy', 'name email avatar')
    await task.populate('assignedTo', 'name email avatar')

    res.status(201).json(task)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Get all tasks in a project
// @route   GET /api/projects/:id/tasks
// @access  Private (project members only)
const getTasks = async (req, res) => {
  try {
    // Check membership
    const { error, status } = await checkProjectMember(
      req.params.id,
      req.user._id
    )
    if (error) return res.status(status).json({ message: error })

    // Get all tasks for this project
    // sorted by status and position
    // This gives us tasks grouped by their board column
    const tasks = await Task.find({ project: req.params.id })
      .populate('createdBy', 'name email avatar')
      .populate('assignedTo', 'name email avatar')
      .sort({ status: 1, position: 1 })

    // Group tasks by status for the board view
    // Frontend can use this directly for columns
    const groupedTasks = {
      todo: tasks.filter((t) => t.status === 'todo'),
      in_progress: tasks.filter((t) => t.status === 'in_progress'),
      in_review: tasks.filter((t) => t.status === 'in_review'),
      done: tasks.filter((t) => t.status === 'done'),
    }

    res.json(groupedTasks)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Update a task
// @route   PUT /api/projects/:id/tasks/:taskId
// @access  Private (project members only)
const updateTask = async (req, res) => {
  try {
    // Check membership
    const { error, status } = await checkProjectMember(
      req.params.id,
      req.user._id
    )
    if (error) return res.status(status).json({ message: error })

    const task = await Task.findById(req.params.taskId)

    if (!task) {
      return res.status(404).json({ message: 'Task not found' })
    }

    // Make sure task belongs to this project
    if (task.project.toString() !== req.params.id) {
      return res.status(400).json({
        message: 'Task does not belong to this project',
      })
    }

    // Update fields
    const {
      title,
      description,
      assignedTo,
      priority,
      dueDate,
      labels,
      status: taskStatus,
    } = req.body

    task.title = title || task.title
    task.description = description ?? task.description
    task.assignedTo = assignedTo ?? task.assignedTo
    task.priority = priority || task.priority
    task.dueDate = dueDate ?? task.dueDate
    task.labels = labels || task.labels
    task.status = taskStatus || task.status

    const updatedTask = await task.save()
    await updatedTask.populate('createdBy', 'name email avatar')
    await updatedTask.populate('assignedTo', 'name email avatar')

    res.json(updatedTask)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Move task (drag and drop)
// @route   PUT /api/projects/:id/tasks/:taskId/move
// @access  Private (project members only)
const moveTask = async (req, res) => {
  try {
    // Check membership
    const { error, status } = await checkProjectMember(
      req.params.id,
      req.user._id
    )
    if (error) return res.status(status).json({ message: error })

    const { newStatus, newPosition } = req.body
    // newStatus   = which column task moved to ('todo', 'in_progress' etc)
    // newPosition = position within that column

    const task = await Task.findById(req.params.taskId)
    if (!task) {
      return res.status(404).json({ message: 'Task not found' })
    }

    const oldStatus = task.status

    // Update the moved task
    task.status = newStatus
    task.position = newPosition
    await task.save()

    // Reorder other tasks in the destination column
    // to make room for the moved task
    await Task.updateMany(
      {
        project: req.params.id,
        status: newStatus,
        _id: { $ne: task._id },
        // $ne means "not equal" — exclude the moved task itself
        position: { $gte: newPosition },
        // $gte means "greater than or equal"
        // shift all tasks at or below newPosition down by 1
      },
      { $inc: { position: 1 } }
      // $inc: { position: 1 } means increase position by 1
    )

    res.json({
      message: 'Task moved successfully',
      task,
      oldStatus,
      newStatus,
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Delete a task
// @route   DELETE /api/projects/:id/tasks/:taskId
// @access  Private (project members only)
const deleteTask = async (req, res) => {
  try {
    // Check membership
    const { error, status } = await checkProjectMember(
      req.params.id,
      req.user._id
    )
    if (error) return res.status(status).json({ message: error })

    const task = await Task.findById(req.params.taskId)

    if (!task) {
      return res.status(404).json({ message: 'Task not found' })
    }

    // Only task creator, project admin, or system admin can delete
    const isCreator = task.createdBy.toString() === req.user._id.toString()
    const isSystemAdmin = req.user.role === 'admin'

    if (!isCreator && !isSystemAdmin) {
      return res.status(403).json({
        message: 'Not authorized to delete this task',
      })
    }

    await task.deleteOne()

    res.json({ message: 'Task deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = {
  createTask,
  getTasks,
  updateTask,
  moveTask,
  deleteTask,
}