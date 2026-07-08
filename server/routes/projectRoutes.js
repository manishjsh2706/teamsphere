const express = require('express')
const router = express.Router()
const {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
  changeMemberRole, // ✅ ADD THIS
} = require('../controllers/projectController')
const {
  createTask,
  getTasks,
  updateTask,
  moveTask,
  deleteTask,
  uploadAttachment,
  deleteAttachment,
} = require('../controllers/taskController')
const { protect } = require('../middleware/authMiddleware')

// Import multer config
const upload = require('../config/multer')

// All routes below require login
// protect middleware runs on all routes in this file
router.use(protect)

// Project routes
router.route('/')
  .post(createProject)   // POST /api/projects
  .get(getProjects)      // GET  /api/projects

router.route('/:id')
  .get(getProjectById)   // GET    /api/projects/:id
  .put(updateProject)    // PUT    /api/projects/:id
  .delete(deleteProject) // DELETE /api/projects/:id

// Member routes
router.route('/:id/members')
  .post(addMember)       // POST /api/projects/:id/members

router.route('/:id/members/:userId')
  .delete(removeMember)  // DELETE /api/projects/:id/members/:userId

// Change member role
router.route('/:id/members/:userId/role')
  .put(changeMemberRole)  // PUT /api/projects/:id/members/:userId/role

// Task routes (nested under projects)
router.route('/:id/tasks')
  .post(createTask)      // POST /api/projects/:id/tasks
  .get(getTasks)         // GET  /api/projects/:id/tasks

router.route('/:id/tasks/:taskId')
  .put(updateTask)       // PUT    /api/projects/:id/tasks/:taskId
  .delete(deleteTask)    // DELETE /api/projects/:id/tasks/:taskId

router.route('/:id/tasks/:taskId/move')
  .put(moveTask)         // PUT /api/projects/:id/tasks/:taskId/move

// Attachment routes
router.route('/:id/tasks/:taskId/attachments')
  .post(
    upload.single('attachment'),
    // 'attachment' is the field name expected in the form
    uploadAttachment
  )

router.route('/:id/tasks/:taskId/attachments/:attachmentId')
  .delete(deleteAttachment)


module.exports = router