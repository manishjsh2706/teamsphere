const Project = require('../models/Project')
const User = require('../models/User')

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private
const createProject = async (req, res) => {
  try {
    const { name, description, color, dueDate } = req.body

    // Validate required fields
    if (!name) {
      return res.status(400).json({ message: 'Project name is required' })
    }

    // Create project
    // req.user._id comes from protect middleware
    const project = await Project.create({
      name,
      description,
      color: color || '#3B82F6',
      dueDate: dueDate || null,
      owner: req.user._id,
      // Owner is automatically added as admin member
      members: [
        {
          user: req.user._id,
          role: 'admin',
        },
      ],
    })

    // Populate owner details before sending response
    // Instead of just sending owner id, send full owner object
    await project.populate('owner', 'name email avatar')
    await project.populate('members.user', 'name email avatar')

    res.status(201).json(project)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Get all projects for logged in user
// @route   GET /api/projects
// @access  Private
const getProjects = async (req, res) => {
  try {
    // Find all projects where current user is a member
    // This covers both projects they own AND projects they were invited to
    const projects = await Project.find({
      'members.user': req.user._id,
    })
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar')
      .sort({ createdAt: -1 })
    // sort by newest first

    res.json(projects)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Get single project by ID
// @route   GET /api/projects/:id
// @access  Private (must be project member)
const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar')

    if (!project) {
      return res.status(404).json({ message: 'Project not found' })
    }

    // Check if current user is a member of this project
    const isMember = project.members.some(
      (member) => member.user._id.toString() === req.user._id.toString()
    )

    if (!isMember) {
      return res.status(403).json({
        message: 'Not authorized to view this project',
      })
    }

    res.json(project)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private (project admin only)
const updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)

    if (!project) {
      return res.status(404).json({ message: 'Project not found' })
    }

    // Check if user is project owner or system admin
    const isOwner = project.owner.toString() === req.user._id.toString()
    const isSystemAdmin = req.user.role === 'admin'

    if (!isOwner && !isSystemAdmin) {
      return res.status(403).json({
        message: 'Not authorized to update this project',
      })
    }

    // Update only fields that were sent
    const { name, description, color, dueDate, status } = req.body

    project.name = name || project.name
    project.description = description ?? project.description
    project.color = color || project.color
    project.dueDate = dueDate || project.dueDate
    project.status = status || project.status

    const updatedProject = await project.save()
    await updatedProject.populate('owner', 'name email avatar')
    await updatedProject.populate('members.user', 'name email avatar')

    res.json(updatedProject)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (project owner or system admin)
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)

    if (!project) {
      return res.status(404).json({ message: 'Project not found' })
    }

    // Only owner or system admin can delete
    const isOwner = project.owner.toString() === req.user._id.toString()
    const isSystemAdmin = req.user.role === 'admin'

    if (!isOwner && !isSystemAdmin) {
      return res.status(403).json({
        message: 'Not authorized to delete this project',
      })
    }

    // Delete all tasks belonging to this project first
    const Task = require('../models/Task')
    await Task.deleteMany({ project: req.params.id })

    // Then delete the project
    await project.deleteOne()

    res.json({ message: 'Project and all its tasks deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Add member to project
// @route   POST /api/projects/:id/members
// @access  Private (project admin only)
const addMember = async (req, res) => {
  try {
    const { email, role } = req.body

    if (!email) {
      return res.status(400).json({ message: 'Email is required' })
    }

    // Find project
    const project = await Project.findById(req.params.id)
    if (!project) {
      return res.status(404).json({ message: 'Project not found' })
    }

    // Check if current user is project admin
    const isOwner = project.owner.toString() === req.user._id.toString()
    const isProjectAdmin = project.members.some(
      (m) =>
        m.user.toString() === req.user._id.toString() &&
        m.role === 'admin'
    )

    if (!isOwner && !isProjectAdmin) {
      return res.status(403).json({
        message: 'Not authorized to add members',
      })
    }

    // Find the user to add by their email
    const userToAdd = await User.findOne({ email })
    if (!userToAdd) {
      return res.status(404).json({
        message: 'No user found with this email. They must register first.',
      })
    }

    // Check if user is already a member
    const alreadyMember = project.members.some(
      (m) => m.user.toString() === userToAdd._id.toString()
    )

    if (alreadyMember) {
      return res.status(400).json({
        message: 'User is already a member of this project',
      })
    }

    // Add user to project members
    project.members.push({
      user: userToAdd._id,
      role: role || 'member',
    })

    await project.save()
    await project.populate('owner', 'name email avatar')
    await project.populate('members.user', 'name email avatar')

    res.json(project)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Remove member from project
// @route   DELETE /api/projects/:id/members/:userId
// @access  Private (project admin only)
const removeMember = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)

    if (!project) {
      return res.status(404).json({ message: 'Project not found' })
    }

    // Cannot remove the project owner
    if (project.owner.toString() === req.params.userId) {
      return res.status(400).json({
        message: 'Cannot remove project owner',
      })
    }

    // Check if current user is project admin
    const isOwner = project.owner.toString() === req.user._id.toString()
    const isProjectAdmin = project.members.some(
      (m) =>
        m.user.toString() === req.user._id.toString() &&
        m.role === 'admin'
    )

    if (!isOwner && !isProjectAdmin) {
      return res.status(403).json({
        message: 'Not authorized to remove members',
      })
    }

    // Remove member from array
    project.members = project.members.filter(
      (m) => m.user.toString() !== req.params.userId
    )

    await project.save()

    res.json({ message: 'Member removed successfully' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
}