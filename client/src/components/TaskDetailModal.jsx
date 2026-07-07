import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import { updateTask } from '../store/slices/taskSlice'

// Status options matching our board columns
const STATUS_OPTIONS = [
  { value: 'todo', label: 'Todo', color: '#64748b' },
  { value: 'in_progress', label: 'In Progress', color: '#3b82f6' },
  { value: 'in_review', label: 'In Review', color: '#f59e0b' },
  { value: 'done', label: 'Done', color: '#10b981' },
]

// Priority options
const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', color: '#10b981' },
  { value: 'medium', label: 'Medium', color: '#f59e0b' },
  { value: 'high', label: 'High', color: '#ef4444' },
  { value: 'urgent', label: 'Urgent', color: '#7c3aed' },
]

const PRIORITY_COLORS = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#ef4444',
  urgent: '#7c3aed',
}

// ─────────────────────────────────────────
// TASK DETAIL MODAL COMPONENT
// ─────────────────────────────────────────
const TaskDetailModal = ({ task, projectId, onClose }) => {
  const dispatch = useDispatch()

  // Get project members for assignee dropdown
  const { currentProject } = useSelector((state) => state.projects)
  const { loading } = useSelector((state) => state.tasks)

  // ─────────────────────────────────────────
  // LOCAL STATE — form fields
  // Pre-filled with existing task data
  // ─────────────────────────────────────────
  const [title, setTitle] = useState(task.title || '')
  const [description, setDescription] = useState(task.description || '')
  const [status, setStatus] = useState(task.status || 'todo')
  const [priority, setPriority] = useState(task.priority || 'medium')
  const [assignedTo, setAssignedTo] = useState(
    task.assignedTo?._id || ''
  )
  // Pre-fill assignedTo with existing assignee's ID

  // Track if any changes were made
  const [isDirty, setIsDirty] = useState(false)

  // ─────────────────────────────────────────
  // EFFECTS
  // ─────────────────────────────────────────

  // Mark form as dirty when any field changes
  // Dirty means "user has made changes that are not saved yet"
  useEffect(() => {
    const hasChanges =
      title !== task.title ||
      description !== (task.description || '') ||
      status !== task.status ||
      priority !== task.priority ||
      assignedTo !== (task.assignedTo?._id || '')

    setIsDirty(hasChanges)
  }, [title, description, status, priority, assignedTo, task])

  // Close modal on Escape key press
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
    // cleanup — remove listener when modal closes
  }, [isDirty])

  // ─────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────

  // Handle closing modal
  const handleClose = () => {
    if (isDirty) {
      // Warn user if they have unsaved changes
      const confirm = window.confirm(
        'You have unsaved changes. Are you sure you want to close?'
      )
      if (!confirm) return
    }
    onClose()
  }

  // Handle saving changes
  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Task title is required')
      return
    }

    dispatch(
      updateTask({
        projectId,
        taskId: task._id,
        taskData: {
          title: title.trim(),
          description: description.trim(),
          status,
          priority,
          assignedTo: assignedTo || null,
          // null means unassigned
        },
      })
    )
      .unwrap()
      .then(() => {
        toast.success('Task updated successfully!')
        onClose()
        // Close modal after successful save
      })
      .catch((err) => {
        toast.error(err || 'Failed to update task')
      })
  }

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return 'Not set'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  // ─────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────
  return (
    <>
      {/* ── BACKDROP ── */}
      {/* Dark overlay behind the modal */}
      <div
        onClick={handleClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 200,
        }}
      />

      {/* ── MODAL PANEL ── */}
      {/* Slides in from the right side like Jira */}
      <div style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: '480px',
        maxWidth: '100vw',
        background: 'var(--card-bg)',
        zIndex: 201,
        boxShadow: '-4px 0 24px rgba(0,0,0,0.2)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>

        {/* ── MODAL HEADER ── */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Task type icon (like Jira) */}
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              background: `${PRIORITY_COLORS[priority]}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
            }}>
              ✓
            </div>
            <span style={{
              fontSize: '12px',
              color: 'var(--text-secondary)',
              fontWeight: '500',
            }}>
              TASK
            </span>
          </div>

          {/* Close button */}
          <button
            onClick={handleClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              fontSize: '20px',
              padding: '4px 8px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            ✕
          </button>
        </div>

        {/* ── MODAL BODY (scrollable) ── */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px',
        }}>

          {/* Task Title Input */}
          <div style={{ marginBottom: '20px' }}>
            <textarea
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title..."
              rows={2}
              style={{
                width: '100%',
                padding: '0',
                border: 'none',
                outline: 'none',
                fontSize: '20px',
                fontWeight: '600',
                color: 'var(--text-primary)',
                background: 'transparent',
                resize: 'none',
                lineHeight: '1.4',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* ── STATUS + PRIORITY ROW ── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
            marginBottom: '20px',
          }}>

            {/* Status dropdown */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: '600',
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '6px',
              }}>
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  fontSize: '13px',
                  background: 'var(--input-bg)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  fontWeight: '500',
                }}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority dropdown */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: '600',
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '6px',
              }}>
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  border: `1px solid ${PRIORITY_COLORS[priority]}`,
                  borderRadius: '8px',
                  fontSize: '13px',
                  background: 'var(--input-bg)',
                  color: PRIORITY_COLORS[priority],
                  cursor: 'pointer',
                  fontWeight: '600',
                }}
              >
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ── ASSIGN TO ── */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: '600',
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '6px',
            }}>
              Assigned To
            </label>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                fontSize: '13px',
                background: 'var(--input-bg)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
              }}
            >
              <option value=''>👤 Unassigned</option>
              {currentProject?.members?.map((member) => (
                <option
                  key={member.user?._id}
                  value={member.user?._id}
                >
                  {member.user?.name}
                </option>
              ))}
            </select>

            {/* Show current assignee info */}
            {assignedTo && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginTop: '8px',
                padding: '8px 10px',
                background: 'var(--bg-tertiary)',
                borderRadius: '8px',
              }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: '#3b82f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: '600',
                  flexShrink: 0,
                }}>
                  {currentProject?.members
                    ?.find((m) => m.user?._id === assignedTo)
                    ?.user?.name?.charAt(0)
                    .toUpperCase()}
                </div>
                <div>
                  <p style={{
                    margin: 0,
                    fontSize: '13px',
                    fontWeight: '500',
                    color: 'var(--text-primary)',
                  }}>
                    {currentProject?.members
                      ?.find((m) => m.user?._id === assignedTo)
                      ?.user?.name}
                  </p>
                  <p style={{
                    margin: 0,
                    fontSize: '11px',
                    color: 'var(--text-secondary)',
                  }}>
                    {currentProject?.members
                      ?.find((m) => m.user?._id === assignedTo)
                      ?.user?.email}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ── DESCRIPTION ── */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: '600',
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '6px',
            }}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description..."
              rows={5}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                fontSize: '13px',
                background: 'var(--input-bg)',
                color: 'var(--text-primary)',
                resize: 'vertical',
                lineHeight: '1.6',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* ── TASK META INFO ── */}
          {/* Shows read-only info like creator and dates */}
          <div style={{
            background: 'var(--bg-tertiary)',
            borderRadius: '10px',
            padding: '14px 16px',
          }}>
            <p style={{
              margin: '0 0 10px',
              fontSize: '11px',
              fontWeight: '600',
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              Details
            </p>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}>
              {/* Created by */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <span style={{
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                }}>
                  Created by
                </span>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: '#3b82f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '9px',
                    fontWeight: '600',
                  }}>
                    {task.createdBy?.name?.charAt(0).toUpperCase()}
                  </div>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: '500',
                    color: 'var(--text-primary)',
                  }}>
                    {task.createdBy?.name}
                  </span>
                </div>
              </div>

              {/* Created date */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <span style={{
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                }}>
                  Created
                </span>
                <span style={{
                  fontSize: '12px',
                  color: 'var(--text-primary)',
                }}>
                  {formatDate(task.createdAt)}
                </span>
              </div>

              {/* Last updated date */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <span style={{
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                }}>
                  Last updated
                </span>
                <span style={{
                  fontSize: '12px',
                  color: 'var(--text-primary)',
                }}>
                  {formatDate(task.updatedAt)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── MODAL FOOTER ── */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          gap: '12px',
          flexShrink: 0,
          background: 'var(--card-bg)',
        }}>
          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={loading || !isDirty}
            style={{
              flex: 1,
              padding: '10px',
              background: isDirty ? '#3b82f6' : 'var(--bg-tertiary)',
              color: isDirty ? 'white' : 'var(--text-secondary)',
              border: 'none',
              borderRadius: '8px',
              cursor: isDirty ? 'pointer' : 'not-allowed',
              fontWeight: '500',
              fontSize: '14px',
              transition: 'all 0.15s',
            }}
          >
            {loading ? 'Saving...' : isDirty ? 'Save Changes' : 'No Changes'}
          </button>

          {/* Cancel button */}
          <button
            onClick={handleClose}
            style={{
              padding: '10px 20px',
              background: 'transparent',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  )
}

export default TaskDetailModal