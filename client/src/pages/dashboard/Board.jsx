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

// Column configuration — defines our 4 board columns
const COLUMNS = [
  { id: 'todo', label: 'Todo', color: '#64748b' },
  { id: 'in_progress', label: 'In Progress', color: '#3b82f6' },
  { id: 'in_review', label: 'In Review', color: '#f59e0b' },
  { id: 'done', label: 'Done', color: '#10b981' },
]

// Priority colors for task cards
const PRIORITY_COLORS = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#ef4444',
  urgent: '#7c3aed',
}

const Board = () => {
  const { id: projectId } = useParams()
  // useParams reads the :id from the URL
  // URL: /projects/abc123 → projectId = "abc123"

  const dispatch = useDispatch()
  const navigate = useNavigate()

  const { tasks, loading: tasksLoading, error: taskError } =
    useSelector((state) => state.tasks)
  const { currentProject, loading: projectLoading, error: projectError } =
    useSelector((state) => state.projects)

  // State for add task form
  const [activeColumn, setActiveColumn] = useState(null)
  // which column's "Add Task" was clicked

  const [newTaskTitle, setNewTaskTitle] = useState('')

  // State for invite member form
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')

  // Fetch project and tasks when page loads
  useEffect(() => {
    dispatch(fetchProjectById(projectId))
    dispatch(fetchTasks(projectId))
  }, [dispatch, projectId])

  // Show errors
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
  // DRAG AND DROP HANDLER
  // This is the most important function in this file
  // ─────────────────────────────────────────
  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result
    // destination = where user dropped the task
    // source      = where task was picked up from
    // draggableId = the task's _id

    // If dropped outside any column → do nothing
    if (!destination) return

    // If dropped in same position → do nothing
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return

    // 1. Update UI immediately (optimistic update)
    // This makes drag and drop feel instant
    // even before backend confirms
    dispatch(
      moveTaskLocally({
        taskId: draggableId,
        sourceStatus: source.droppableId,
        destStatus: destination.droppableId,
        sourceIndex: source.index,
        destIndex: destination.index,
      })
    )

    // 2. Update backend in the background
    dispatch(
      moveTask({
        projectId,
        taskId: draggableId,
        newStatus: destination.droppableId,
        newPosition: destination.index,
      })
    )
  }

  // Add a new task to a column
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
          status: columnId,
          priority: 'medium',
        },
      })
    )

    setNewTaskTitle('')
    setActiveColumn(null)
  }

  // Delete a task
  const handleDeleteTask = (taskId, e) => {
    e.stopPropagation()
    // stopPropagation prevents the click from
    // bubbling up to the card and triggering other events
    if (window.confirm('Delete this task?')) {
      dispatch(deleteTask({ projectId, taskId }))
    }
  }

  // Invite a member
  const handleInvite = (e) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    dispatch(addMember({ projectId, email: inviteEmail, role: 'member' }))
      .unwrap()
      .then(() => {
        toast.success('Member invited successfully!')
        setInviteEmail('')
        setShowInvite(false)
      })
      .catch((err) => toast.error(err))
  }

  if (projectLoading || tasksLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
        <Navbar />
        <div style={{ textAlign: 'center', padding: '80px' }}>
          <p style={{ color: '#64748b' }}>Loading board...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Navbar />

      <div style={{ padding: '24px' }}>

        {/* Board Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: '#64748b',
                fontSize: '20px',
              }}
            >
              ←
            </button>
            <div
              style={{
                width: '16px',
                height: '16px',
                borderRadius: '4px',
                background: currentProject?.color || '#3b82f6',
              }}
            />
            <h1 style={{ margin: 0, fontSize: '22px', color: '#0f172a' }}>
              {currentProject?.name}
            </h1>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {/* Member avatars */}
            <div style={{ display: 'flex' }}>
              {currentProject?.members?.slice(0, 4).map((member, index) => (
                <div
                  key={member._id}
                  title={`${member.user?.name} (${member.role})`}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: currentProject?.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '13px',
                    fontWeight: '600',
                    marginLeft: index > 0 ? '-8px' : '0',
                    border: '2px solid white',
                  }}
                >
                  {member.user?.name?.charAt(0).toUpperCase()}
                </div>
              ))}
            </div>

            {/* Invite button */}
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
          </div>
        </div>

        {/* Invite Member Form */}
        {showInvite && (
          <div style={{
            background: 'white',
            borderRadius: '10px',
            padding: '16px 20px',
            marginBottom: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-end',
          }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500' }}>
                Invite by Email
              </label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@example.com"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
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
              }}
            >
              Invite
            </button>
            <button
              onClick={() => setShowInvite(false)}
              style={{
                padding: '8px 16px',
                background: 'transparent',
                color: '#64748b',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        )}

        {/* Drag and Drop Board */}
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
                  background: '#f1f5f9',
                  borderRadius: '12px',
                  padding: '12px',
                  minHeight: '200px',
                }}
              >
                {/* Column Header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '12px',
                  padding: '0 4px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: column.color,
                    }} />
                    <span style={{
                      fontWeight: '600',
                      fontSize: '13px',
                      color: '#0f172a',
                    }}>
                      {column.label}
                    </span>
                  </div>
                  <span style={{
                    background: 'white',
                    color: '#64748b',
                    fontSize: '11px',
                    fontWeight: '600',
                    padding: '2px 8px',
                    borderRadius: '99px',
                  }}>
                    {tasks[column.id]?.length || 0}
                  </span>
                </div>

                {/* Droppable area — tasks can be dropped here */}
                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      style={{
                        minHeight: '100px',
                        background: snapshot.isDraggingOver
                          ? '#e2e8f0'
                          : 'transparent',
                        // Changes color when dragging over
                        borderRadius: '8px',
                        transition: 'background 0.15s',
                        padding: '4px',
                      }}
                    >
                      {/* Tasks in this column */}
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
                              style={{
                                background: 'white',
                                borderRadius: '8px',
                                padding: '12px',
                                marginBottom: '8px',
                                boxShadow: snapshot.isDragging
                                  ? '0 8px 24px rgba(0,0,0,0.15)'
                                  : '0 1px 3px rgba(0,0,0,0.08)',
                                // Shadow increases when being dragged
                                cursor: 'grab',
                                ...provided.draggableProps.style,
                              }}
                            >
                              {/* Task title */}
                              <p style={{
                                margin: '0 0 8px',
                                fontSize: '13px',
                                fontWeight: '500',
                                color: '#0f172a',
                                lineHeight: '1.4',
                              }}>
                                {task.title}
                              </p>

                              {/* Task footer */}
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                              }}>
                                {/* Priority badge */}
                                <span style={{
                                  fontSize: '10px',
                                  fontWeight: '600',
                                  color: PRIORITY_COLORS[task.priority],
                                  background: `${PRIORITY_COLORS[task.priority]}15`,
                                  padding: '2px 8px',
                                  borderRadius: '99px',
                                  textTransform: 'uppercase',
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
                                      title={task.assignedTo.name}
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
                                      }}
                                    >
                                      {task.assignedTo.name?.charAt(0).toUpperCase()}
                                    </div>
                                  )}

                                  {/* Delete button */}
                                  <button
                                    onClick={(e) => handleDeleteTask(task._id, e)}
                                    style={{
                                      background: 'transparent',
                                      border: 'none',
                                      cursor: 'pointer',
                                      color: '#94a3b8',
                                      fontSize: '14px',
                                      padding: '0',
                                      lineHeight: '1',
                                    }}
                                    title="Delete task"
                                  >
                                    ✕
                                  </button>
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

                {/* Add Task Section */}
                {activeColumn === column.id ? (
                  <div style={{ marginTop: '8px' }}>
                    <input
                      type="text"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      placeholder="Enter task title..."
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddTask(column.id)
                        if (e.key === 'Escape') setActiveColumn(null)
                      }}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        border: '2px solid #3b82f6',
                        borderRadius: '8px',
                        fontSize: '13px',
                        boxSizing: 'border-box',
                        marginBottom: '8px',
                      }}
                    />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleAddTask(column.id)}
                        style={{
                          flex: 1,
                          padding: '6px',
                          background: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px',
                        }}
                      >
                        Add
                      </button>
                      <button
                        onClick={() => setActiveColumn(null)}
                        style={{
                          padding: '6px 10px',
                          background: 'transparent',
                          border: '1px solid #e2e8f0',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          color: '#64748b',
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ) : (
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
                      color: '#94a3b8',
                      fontSize: '13px',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#e2e8f0'
                      e.currentTarget.style.color = '#64748b'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = '#94a3b8'
                    }}
                  >
                    + Add a task
                  </button>
                )}
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>
    </div>
  )
}

export default Board