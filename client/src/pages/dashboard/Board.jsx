import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import {
  fetchTasks,
  createTask,
  moveTask,
  deleteTask,
  moveTaskLocally,
  clearTaskError,
} from '../../store/slices/taskSlice'
import {
  fetchProjectById,
  addMember,
  clearProjectError,
} from '../../store/slices/projectSlice'
import Navbar from '../../components/Navbar'
import MemberList from '../../components/MemberList'
import TaskDetailModal from '../../components/TaskDetailModal'
import useProjectRole from '../../hooks/useProjectRole'

// ─────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────

// Our 4 board columns — matches backend status values
const COLUMNS = [
  { id: 'todo', label: 'Todo', color: '#64748b' },
  { id: 'in_progress', label: 'In Progress', color: '#3b82f6' },
  { id: 'in_review', label: 'In Review', color: '#f59e0b' },
  { id: 'done', label: 'Done', color: '#10b981' },
]

// Colors for priority badges on task cards
const PRIORITY_COLORS = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#ef4444',
  urgent: '#7c3aed',
}

// Priority buttons in the add task form
const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', color: '#10b981' },
  { value: 'medium', label: 'Medium', color: '#f59e0b' },
  { value: 'high', label: 'High', color: '#ef4444' },
  { value: 'urgent', label: 'Urgent', color: '#7c3aed' },
]

// ─────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────
const Board = () => {

  // Get project ID from URL
  // Example: /projects/abc123 → projectId = "abc123"
  const { id: projectId } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()

  // ─────────────────────────────────────────
  // REDUX STATE
  // ─────────────────────────────────────────

  // Tasks grouped by status from Redux
  const { tasks, loading: tasksLoading, error: taskError } =
    useSelector((state) => state.tasks)

  // Current project details from Redux
  const { currentProject, loading: projectLoading, error: projectError } =
    useSelector((state) => state.projects)

  // Logged in user from Redux
  const { user } = useSelector((state) => state.auth)

  // Role based permissions from custom hook
  const { canManageProject, canManageMembers, currentUserId } =
    useProjectRole()

  // ─────────────────────────────────────────
  // LOCAL STATE
  // ─────────────────────────────────────────

  // Which column's add task form is open
  // null means all forms are closed
  const [activeColumn, setActiveColumn] = useState(null)

  // New task form fields
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskPriority, setNewTaskPriority] = useState('medium')
  const [newTaskAssignee, setNewTaskAssignee] = useState('')

  // Show or hide invite member form
  const [showInvite, setShowInvite] = useState(false)

  // Show or hide members panel
  const [showMembers, setShowMembers] = useState(false)

  // Email input for invite form
  const [inviteEmail, setInviteEmail] = useState('')

  // Selected task for detail modal
  // null = modal closed, task object = modal open
  const [selectedTask, setSelectedTask] = useState(null)

  // ─────────────────────────────────────────
  // EFFECTS
  // ─────────────────────────────────────────

  // Fetch project details and tasks when page loads
  useEffect(() => {
    dispatch(fetchProjectById(projectId))
    dispatch(fetchTasks(projectId))
  }, [dispatch, projectId])

  // Show error messages as toast notifications
  useEffect(() => {
    if (taskError) {
      toast.error(taskError)
      dispatch(clearTaskError())
    }
    if (projectError) {
      toast.error(projectError)
      dispatch(clearProjectError())
    }
  }, [taskError, projectError, dispatch])

  // ─────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────

  // Handle drag and drop between columns
  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result

    // Dropped outside any column — do nothing
    if (!destination) return

    // Dropped in same position — do nothing
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) return

    // Step 1 — Update UI instantly before backend confirms
    // This makes drag and drop feel smooth and immediate
    dispatch(
      moveTaskLocally({
        taskId: draggableId,
        sourceStatus: source.droppableId,
        destStatus: destination.droppableId,
        sourceIndex: source.index,
        destIndex: destination.index,
      })
    )

    // Step 2 — Update backend in the background
    dispatch(
      moveTask({
        projectId,
        taskId: draggableId,
        newStatus: destination.droppableId,
        newPosition: destination.index,
      })
    )
  }

  // Reset all new task form fields to default
  const resetTaskForm = () => {
    setNewTaskTitle('')
    setNewTaskPriority('medium')
    setNewTaskAssignee('')
    setActiveColumn(null)
  }

  // Handle creating a new task
  const handleAddTask = (columnId) => {
    if (!newTaskTitle.trim()) {
      toast.error('Task title is required')
      return
    }

    dispatch(
      createTask({
        projectId,
        taskData: {
          title: newTaskTitle,
          priority: newTaskPriority,
          assignedTo: newTaskAssignee || null,
          // null means unassigned
        },
      })
    )

    resetTaskForm()
  }

  // Check if current user can delete a specific task
  // Task creator, project admin, or system admin can delete
  const canDeleteTask = (task) => {
    if (!user) return false
    const isTaskCreator =
      task.createdBy?._id?.toString() === currentUserId?.toString()
    return isTaskCreator || canManageProject
  }

  // Handle deleting a task
  const handleDeleteTask = (taskId, e) => {
    // stopPropagation prevents the click from
    // also triggering the card click (which opens modal)
    e.stopPropagation()
    if (window.confirm('Delete this task?')) {
      dispatch(deleteTask({ projectId, taskId }))
    }
  }

  // Handle inviting a member to project
  const handleInvite = (e) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return

    dispatch(addMember({
      projectId,
      email: inviteEmail,
      role: 'member',
    }))
      .unwrap()
      .then(() => {
        toast.success('Member invited successfully!')
        setInviteEmail('')
        setShowInvite(false)
        // Refresh project to show new member avatar
        dispatch(fetchProjectById(projectId))
      })
      .catch((err) => toast.error(err))
  }

  // ─────────────────────────────────────────
  // LOADING STATE
  // ─────────────────────────────────────────
  if (projectLoading || tasksLoading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <Navbar />
        <div style={{ textAlign: 'center', padding: '80px' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>
            Loading board...
          </p>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Navbar />

      <div style={{ padding: '24px' }}>

        {/* ════════════════════════════════ */}
        {/*           BOARD HEADER          */}
        {/* ════════════════════════════════ */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
        }}>

          {/* Left side — back button + project color + project name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => navigate('/dashboard')}
              title="Back to dashboard"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                fontSize: '20px',
                padding: '4px 8px',
                borderRadius: '6px',
              }}
            >
              ←
            </button>

            {/* Project color dot */}
            <div style={{
              width: '16px',
              height: '16px',
              borderRadius: '4px',
              background: currentProject?.color || '#3b82f6',
              flexShrink: 0,
            }} />

            {/* Project name */}
            <h1 style={{
              margin: 0,
              fontSize: '22px',
              color: 'var(--text-primary)',
              fontWeight: '600',
            }}>
              {currentProject?.name}
            </h1>
          </div>

          {/* Right side — member avatars + invite button */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>

            {/* Clickable member avatars — opens members panel */}
            <div
              style={{ display: 'flex', cursor: 'pointer' }}
              onClick={() => setShowMembers(!showMembers)}
              title="Click to view members"
            >
              {currentProject?.members?.slice(0, 4).map((member, index) => (
                <div
                  key={member._id}
                  title={`${member.user?.name} (${member.role})`}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: currentProject?.color || '#3b82f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '13px',
                    fontWeight: '600',
                    marginLeft: index > 0 ? '-8px' : '0',
                    border: '2px solid var(--bg-primary)',
                    zIndex: 4 - index,
                    position: 'relative',
                  }}
                >
                  {member.user?.name?.charAt(0).toUpperCase()}
                </div>
              ))}

              {/* Show +N badge if more than 4 members */}
              {currentProject?.members?.length > 4 && (
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'var(--bg-tertiary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-secondary)',
                  fontSize: '11px',
                  fontWeight: '600',
                  marginLeft: '-8px',
                  border: '2px solid var(--bg-primary)',
                }}>
                  +{currentProject.members.length - 4}
                </div>
              )}
            </div>

            {/* Invite Member button */}
            {/* Only visible to project admins and owners */}
            {canManageMembers && (
              <button
                onClick={() => setShowInvite(!showInvite)}
                style={{
                  padding: '8px 16px',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500',
                }}
              >
                + Invite Member
              </button>
            )}
          </div>
        </div>

        {/* ════════════════════════════════ */}
        {/*          MEMBERS PANEL          */}
        {/* ════════════════════════════════ */}
        {/* Shown when member avatars are clicked */}
        {showMembers && (
          <MemberList
            projectId={projectId}
            members={currentProject?.members}
          />
        )}

        {/* ════════════════════════════════ */}
        {/*           INVITE FORM           */}
        {/* ════════════════════════════════ */}
        {/* Only shown to project admins */}
        {showInvite && canManageMembers && (
          <div style={{
            background: 'var(--card-bg)',
            borderRadius: '10px',
            padding: '16px 20px',
            marginBottom: '20px',
            boxShadow: 'var(--shadow)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-end',
          }}>
            <div style={{ flex: 1 }}>
              <label style={{
                display: 'block',
                marginBottom: '6px',
                fontSize: '13px',
                fontWeight: '500',
                color: 'var(--text-primary)',
              }}>
                Invite member by email
              </label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@example.com"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleInvite(e)
                }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  background: 'var(--input-bg)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
            <button
              onClick={handleInvite}
              style={{
                padding: '8px 20px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '14px',
                whiteSpace: 'nowrap',
              }}
            >
              Send Invite
            </button>
            <button
              onClick={() => {
                setShowInvite(false)
                setInviteEmail('')
              }}
              style={{
                padding: '8px 16px',
                background: 'transparent',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              Cancel
            </button>
          </div>
        )}

        {/* ════════════════════════════════ */}
        {/*       DRAG AND DROP BOARD       */}
        {/* ════════════════════════════════ */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '16px',
            alignItems: 'start',
          }}>

            {/* Render each of the 4 columns */}
            {COLUMNS.map((column) => (
              <div
                key={column.id}
                style={{
                  background: 'var(--column-bg)',
                  borderRadius: '12px',
                  padding: '12px',
                  minHeight: '300px',
                }}
              >
                {/* ── COLUMN HEADER ── */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '12px',
                  padding: '0 4px',
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}>
                    {/* Column status color dot */}
                    <div style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: column.color,
                    }} />
                    {/* Column name */}
                    <span style={{
                      fontWeight: '600',
                      fontSize: '13px',
                      color: 'var(--text-primary)',
                    }}>
                      {column.label}
                    </span>
                  </div>

                  {/* Task count badge */}
                  <span style={{
                    background: 'var(--card-bg)',
                    color: 'var(--text-secondary)',
                    fontSize: '11px',
                    fontWeight: '600',
                    padding: '2px 8px',
                    borderRadius: '99px',
                  }}>
                    {tasks[column.id]?.length || 0}
                  </span>
                </div>

                {/* ── DROPPABLE AREA ── */}
                {/* This area accepts dragged tasks */}
                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      style={{
                        minHeight: '100px',
                        // Highlight column when dragging a task over it
                        background: snapshot.isDraggingOver
                          ? 'var(--drag-over-bg)'
                          : 'transparent',
                        borderRadius: '8px',
                        transition: 'background 0.15s',
                        padding: '4px',
                      }}
                    >
                      {/* ── TASK CARDS ── */}
                      {tasks[column.id]?.map((task, index) => (
                        <Draggable
                          key={task._id}
                          draggableId={task._id}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() => setSelectedTask(task)}
                              // ↑ Click opens the task detail modal
                              style={{
                                background: 'var(--card-bg)',
                                borderRadius: '8px',
                                padding: '12px',
                                marginBottom: '8px',
                                // Bigger shadow while being dragged
                                boxShadow: snapshot.isDragging
                                  ? '0 8px 24px rgba(0,0,0,0.2)'
                                  : 'var(--shadow)',
                                cursor: 'pointer',
                                border: '1px solid var(--border-color)',
                                ...provided.draggableProps.style,
                              }}
                            >
                              {/* Task title */}
                              <p style={{
                                margin: '0 0 6px',
                                fontSize: '13px',
                                fontWeight: '500',
                                color: 'var(--text-primary)',
                                lineHeight: '1.4',
                              }}>
                                {task.title}
                              </p>

                              {/* Task description preview */}
                              {task.description && (
                                <p style={{
                                  margin: '0 0 8px',
                                  fontSize: '11px',
                                  color: 'var(--text-secondary)',
                                  lineHeight: '1.4',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}>
                                  {task.description}
                                </p>
                              )}

                              {/* ── TASK CARD FOOTER ── */}
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginTop: '8px',
                              }}>

                                {/* Priority badge */}
                                <span style={{
                                  fontSize: '10px',
                                  fontWeight: '600',
                                  color: PRIORITY_COLORS[task.priority],
                                  background: `${PRIORITY_COLORS[task.priority]}20`,
                                  padding: '2px 8px',
                                  borderRadius: '99px',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.3px',
                                }}>
                                  {task.priority}
                                </span>

                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                }}>

                                  {/* Assigned user avatar */}
                                  {task.assignedTo && (
                                    <div
                                      title={`Assigned to: ${task.assignedTo.name}`}
                                      style={{
                                        width: '22px',
                                        height: '22px',
                                        borderRadius: '50%',
                                        background: column.color,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontSize: '10px',
                                        fontWeight: '600',
                                        flexShrink: 0,
                                      }}
                                    >
                                      {task.assignedTo.name
                                        ?.charAt(0)
                                        .toUpperCase()}
                                    </div>
                                  )}

                                  {/* Delete button */}
                                  {/* Only shown if user has permission */}
                                  {canDeleteTask(task) && (
                                    <button
                                      onClick={(e) =>
                                        handleDeleteTask(task._id, e)
                                      }
                                      title="Delete task"
                                      style={{
                                        background: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: 'var(--text-tertiary)',
                                        fontSize: '14px',
                                        padding: '0',
                                        lineHeight: '1',
                                        display: 'flex',
                                        alignItems: 'center',
                                      }}
                                    >
                                      ✕
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}

                      {/* Placeholder keeps column height while dragging */}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>

                {/* ── ADD TASK SECTION ── */}
                {activeColumn === column.id ? (
                  // Form is open for this column
                  <div style={{ marginTop: '8px' }}>

                    {/* Task title input */}
                    <input
                      type="text"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      placeholder="Enter task title..."
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') resetTaskForm()
                      }}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        border: '2px solid #3b82f6',
                        borderRadius: '8px',
                        fontSize: '13px',
                        boxSizing: 'border-box',
                        marginBottom: '8px',
                        background: 'var(--input-bg)',
                        color: 'var(--text-primary)',
                      }}
                    />

                    {/* Priority selector buttons */}
                    <div style={{ marginBottom: '8px' }}>
                      <label style={{
                        display: 'block',
                        fontSize: '11px',
                        fontWeight: '500',
                        color: 'var(--text-secondary)',
                        marginBottom: '5px',
                      }}>
                        Priority
                      </label>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        {PRIORITY_OPTIONS.map((p) => (
                          <button
                            key={p.value}
                            onClick={() => setNewTaskPriority(p.value)}
                            style={{
                              flex: 1,
                              padding: '5px 4px',
                              fontSize: '11px',
                              fontWeight: '500',
                              border: `1.5px solid ${p.color}`,
                              borderRadius: '6px',
                              cursor: 'pointer',
                              // Filled when selected, transparent when not
                              background: newTaskPriority === p.value
                                ? p.color
                                : 'transparent',
                              color: newTaskPriority === p.value
                                ? 'white'
                                : p.color,
                              transition: 'all 0.15s',
                            }}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Assign To dropdown */}
                    <div style={{ marginBottom: '8px' }}>
                      <label style={{
                        display: 'block',
                        fontSize: '11px',
                        fontWeight: '500',
                        color: 'var(--text-secondary)',
                        marginBottom: '5px',
                      }}>
                        Assign To
                      </label>
                      <select
                        value={newTaskAssignee}
                        onChange={(e) => setNewTaskAssignee(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '7px 10px',
                          border: '1px solid var(--border-color)',
                          borderRadius: '8px',
                          fontSize: '12px',
                          background: 'var(--input-bg)',
                          color: 'var(--text-primary)',
                          cursor: 'pointer',
                          boxSizing: 'border-box',
                        }}
                      >
                        {/* Default option */}
                        <option value=''>👤 Unassigned</option>

                        {/* All project members as options */}
                        {currentProject?.members?.map((member) => (
                          <option
                            key={member.user?._id}
                            value={member.user?._id}
                          >
                            {member.user?.name}
                            {member.user?._id === currentUserId
                              ? ' (you)'
                              : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Add Task and Cancel buttons */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleAddTask(column.id)}
                        style={{
                          flex: 1,
                          padding: '7px',
                          background: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: '500',
                        }}
                      >
                        Add Task
                      </button>
                      <button
                        onClick={resetTaskForm}
                        style={{
                          padding: '7px 10px',
                          background: 'transparent',
                          border: '1px solid var(--border-color)',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ) : (
                  // Add task button — shown when form is closed
                  <button
                    onClick={() => setActiveColumn(column.id)}
                    style={{
                      width: '100%',
                      marginTop: '8px',
                      padding: '8px',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      color: 'var(--text-tertiary)',
                      fontSize: '13px',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        'var(--drag-over-bg)'
                      e.currentTarget.style.color =
                        'var(--text-secondary)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = 'var(--text-tertiary)'
                    }}
                  >
                    + Add a task
                  </button>
                )}
              </div>
            ))}
          </div>
        </DragDropContext>

        {/* ════════════════════════════════ */}
        {/*       TASK DETAIL MODAL         */}
        {/* ════════════════════════════════ */}
        {/* Opens when user clicks any task card */}
        {selectedTask && (
          <TaskDetailModal
            task={selectedTask}
            projectId={projectId}
            onClose={() => setSelectedTask(null)}
          />
        )}

      </div>
    </div>
  )
}

export default Board