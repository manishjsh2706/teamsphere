import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import {
  fetchTasks,
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
import CreateTaskModal from '../../components/CreateTaskModal'
import useProjectRole from '../../hooks/useProjectRole'
import { validateEmail } from '../../utils/validation'

// ─────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────
const COLUMNS = [
  { id: 'todo', label: 'Todo', color: '#64748b' },
  { id: 'in_progress', label: 'In Progress', color: '#3b82f6' },
  { id: 'in_review', label: 'In Review', color: '#f59e0b' },
  { id: 'done', label: 'Done', color: '#10b981' },
]

const PRIORITY_COLORS = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#ef4444',
  urgent: '#7c3aed',
}

// ─────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────
const Board = () => {
  const { id: projectId } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()

  // Redux state
  const { tasks, loading: tasksLoading, error: taskError } =
    useSelector((state) => state.tasks)
  const { currentProject, loading: projectLoading, error: projectError } =
    useSelector((state) => state.projects)
  const { user } = useSelector((state) => state.auth)

  // Role based permissions
  const { canManageProject, canManageMembers, currentUserId } =
    useProjectRole()

  // ─────────────────────────────────────────
  // LOCAL STATE
  // ─────────────────────────────────────────

  // Show create task modal
  const [showCreateTask, setShowCreateTask] = useState(false)

  // Show invite member form
  const [showInvite, setShowInvite] = useState(false)

  // Show members panel
  const [showMembers, setShowMembers] = useState(false)

  // Invite email input
  const [inviteEmail, setInviteEmail] = useState('')

  // Selected task for detail/edit modal
  const [selectedTask, setSelectedTask] = useState(null)

  // ─────────────────────────────────────────
  // EFFECTS
  // ─────────────────────────────────────────
  useEffect(() => {
    dispatch(fetchProjectById(projectId))
    dispatch(fetchTasks(projectId))
  }, [dispatch, projectId])

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

  // Drag and drop
  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result
    if (!destination) return
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) return

    dispatch(moveTaskLocally({
      taskId: draggableId,
      sourceStatus: source.droppableId,
      destStatus: destination.droppableId,
      sourceIndex: source.index,
      destIndex: destination.index,
    }))

    dispatch(moveTask({
      projectId,
      taskId: draggableId,
      newStatus: destination.droppableId,
      newPosition: destination.index,
    }))
  }

  // Check if user can delete a task
  const canDeleteTask = (task) => {
    if (!user) return false
    const isTaskCreator =
      task.createdBy?._id?.toString() === currentUserId?.toString()
    return isTaskCreator || canManageProject
  }

  // Delete task
  const handleDeleteTask = (taskId, e) => {
    e.stopPropagation()
    if (window.confirm('Delete this task?')) {
      dispatch(deleteTask({ projectId, taskId }))
    }
  }

  // Invite member
  const handleInvite = (e) => {
    e.preventDefault()
    const emailError = validateEmail(inviteEmail)
    if (emailError) {
      toast.error(emailError)
      return
    }
    dispatch(addMember({ projectId, email: inviteEmail, role: 'member' }))
      .unwrap()
      .then(() => {
        toast.success('Member invited successfully!')
        setInviteEmail('')
        setShowInvite(false)
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
          marginBottom: '20px',
        }}>
          {/* Left — back + project name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => navigate('/dashboard')}
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
            <div style={{
              width: '16px',
              height: '16px',
              borderRadius: '4px',
              background: currentProject?.color || '#3b82f6',
              flexShrink: 0,
            }} />
            <h1 style={{
              margin: 0,
              fontSize: '22px',
              color: 'var(--text-primary)',
              fontWeight: '600',
            }}>
              {currentProject?.name}
            </h1>
          </div>

          {/* Right — member avatars + invite button */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
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

            {/* Invite button — admins only */}
            {canManageMembers && (
              <button
                onClick={() => setShowInvite(!showInvite)}
                style={{
                  padding: '8px 16px',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
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
        {/*    BOARD TOOLBAR (below header)  */}
        {/* ════════════════════════════════ */}
        {/* This is where the Create Task button lives */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          padding: '12px 16px',
          background: 'var(--card-bg)',
          borderRadius: '10px',
          border: '1px solid var(--border-color)',
        }}>
          {/* Left — task counts per column */}
          <div style={{
            display: 'flex',
            gap: '16px',
            alignItems: 'center',
          }}>
            {COLUMNS.map((col) => (
              <div
                key={col.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: col.color,
                  flexShrink: 0,
                }} />
                <span style={{
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                }}>
                  {col.label}:
                </span>
                <span style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                }}>
                  {tasks[col.id]?.length || 0}
                </span>
              </div>
            ))}
          </div>

          {/* Right — Create Task button */}
          <button
            onClick={() => setShowCreateTask(true)}
            style={{
              padding: '8px 18px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            + Create Task
          </button>
        </div>

        {/* ════════════════════════════════ */}
        {/*          MEMBERS PANEL          */}
        {/* ════════════════════════════════ */}
        {showMembers && (
          <MemberList
            projectId={projectId}
            members={currentProject?.members}
          />
        )}

        {/* ════════════════════════════════ */}
        {/*           INVITE FORM           */}
        {/* ════════════════════════════════ */}
        {showInvite && canManageMembers && (
          <div style={{
            background: 'var(--card-bg)',
            borderRadius: '10px',
            padding: '16px 20px',
            marginBottom: '20px',
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
                placeholder="colleague@teamsphere.com"
                onKeyDown={(e) => { if (e.key === 'Enter') handleInvite(e) }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  background: 'var(--input-bg)',
                  color: 'var(--text-primary)',
                  outline: 'none',
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
              onClick={() => { setShowInvite(false); setInviteEmail('') }}
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
            {COLUMNS.map((column) => (
              <div
                key={column.id}
                style={{
                  background: 'var(--column-bg)',
                  borderRadius: '12px',
                  padding: '12px',
                  minHeight: '400px',
                }}
              >
                {/* Column header */}
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
                    <div style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: column.color,
                    }} />
                    <span style={{
                      fontWeight: '600',
                      fontSize: '13px',
                      color: 'var(--text-primary)',
                    }}>
                      {column.label}
                    </span>
                  </div>
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

                {/* Droppable area */}
                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      style={{
                        minHeight: '100px',
                        background: snapshot.isDraggingOver
                          ? 'var(--drag-over-bg)'
                          : 'transparent',
                        borderRadius: '8px',
                        transition: 'background 0.15s',
                        padding: '4px',
                      }}
                    >
                      {/* Task cards */}
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
                              style={{
                                background: 'var(--card-bg)',
                                borderRadius: '8px',
                                padding: '12px',
                                marginBottom: '8px',
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

                              {/* Description preview */}
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
                              {/* Due date on card */}
{task.dueDate && (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    marginBottom: '6px',
  }}>
    <span style={{ fontSize: '11px' }}>📅</span>
    <span style={{
      fontSize: '11px',
      color: new Date(task.dueDate) < new Date()
        ? '#ef4444'
        : 'var(--text-secondary)',
      fontWeight: new Date(task.dueDate) < new Date()
        ? '600'
        : '400',
    }}>
      {new Date(task.dueDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })}
      {new Date(task.dueDate) < new Date() ? ' ⚠' : ''}
    </span>
  </div>
)}

                              {/* Task footer */}
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
                                  {/* Assignee avatar */}
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
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>

        {/* ════════════════════════════════ */}
        {/*       CREATE TASK MODAL         */}
        {/* ════════════════════════════════ */}
        {showCreateTask && (
          <CreateTaskModal
            projectId={projectId}
            onClose={() => setShowCreateTask(false)}
          />
        )}

        {/* ════════════════════════════════ */}
        {/*       TASK DETAIL MODAL         */}
        {/* ════════════════════════════════ */}
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