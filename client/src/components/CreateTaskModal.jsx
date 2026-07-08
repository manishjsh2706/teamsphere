import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import { createTask } from '../store/slices/taskSlice'
import { validateTaskTitle } from '../utils/validation'

const STATUS_OPTIONS = [
  { value: 'todo', label: 'Todo', color: '#64748b' },
  { value: 'in_progress', label: 'In Progress', color: '#3b82f6' },
  { value: 'in_review', label: 'In Review', color: '#f59e0b' },
  { value: 'done', label: 'Done', color: '#10b981' },
]

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', color: '#10b981' },
  { value: 'medium', label: 'Medium', color: '#f59e0b' },
  { value: 'high', label: 'High', color: '#ef4444' },
  { value: 'urgent', label: 'Urgent', color: '#7c3aed' },
]

const CreateTaskModal = ({ projectId, onClose }) => {
  const dispatch = useDispatch()
  const { currentProject } = useSelector((state) => state.projects)
  const { loading } = useSelector((state) => state.tasks)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    assignedTo: '',
    dueDate: '',
  })

  const [errors, setErrors] = useState({ title: '' })

  const today = new Date().toISOString().split('T')[0]

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
    if (name === 'title') setErrors({ title: '' })
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    const titleError = validateTaskTitle(formData.title)
    if (titleError) {
      setErrors({ title: titleError })
      return
    }

    dispatch(
      createTask({
        projectId,
        taskData: {
          title: formData.title.trim(),
          description: formData.description.trim(),
          status: formData.status,
          priority: formData.priority,
          assignedTo: formData.assignedTo || null,
          dueDate: formData.dueDate || null,
        },
      })
    )
      .unwrap()
      .then(() => {
        toast.success('Task created! Click on it to add attachments.')
        // ↑ Hint user where to find attachments
        onClose()
      })
      .catch((err) => toast.error(err))
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        style={{
          background: 'var(--card-bg)',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '520px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          overflow: 'hidden',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* ── HEADER ── */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: '600',
              color: 'var(--text-primary)',
            }}
          >
            Create New Task
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              fontSize: '20px',
              padding: '4px 8px',
              borderRadius: '6px',
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        {/* ── BODY ── */}
        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>

            {/* Task Title */}
            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontWeight: '500',
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                }}
              >
                Task Title <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="What needs to be done?"
                autoFocus
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: errors.title
                    ? '1.5px solid #ef4444'
                    : '1px solid var(--border-color)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  background: 'var(--input-bg)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
              />
              {errors.title && (
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#ef4444' }}>
                  ⚠ {errors.title}
                </p>
              )}
            </div>

            {/* Description */}
            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontWeight: '500',
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                }}
              >
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Add more details..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  background: 'var(--input-bg)',
                  color: 'var(--text-primary)',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  outline: 'none',
                }}
              />
            </div>

            {/* Status + Priority */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '14px',
                marginBottom: '16px',
              }}
            >
              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '6px',
                    fontWeight: '500',
                    fontSize: '13px',
                    color: 'var(--text-primary)',
                  }}
                >
                  Column (Status)
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '9px 10px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    fontSize: '13px',
                    background: 'var(--input-bg)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '6px',
                    fontWeight: '500',
                    fontSize: '13px',
                    color: 'var(--text-primary)',
                  }}
                >
                  Priority
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '9px 10px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    fontSize: '13px',
                    background: 'var(--input-bg)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    outline: 'none',
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

            {/* Target Date + Assign To */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '14px',
                marginBottom: '16px',
              }}
            >
              {/* Target Date */}
              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '6px',
                    fontWeight: '500',
                    fontSize: '13px',
                    color: 'var(--text-primary)',
                  }}
                >
                  Target Date
                </label>
                <input
                  type="date"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleChange}
                  min={today}
                  style={{
                    width: '100%',
                    padding: '9px 10px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    fontSize: '13px',
                    background: 'var(--input-bg)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    boxSizing: 'border-box',
                    cursor: 'pointer',
                  }}
                />
              </div>

              {/* Assign To */}
              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '6px',
                    fontWeight: '500',
                    fontSize: '13px',
                    color: 'var(--text-primary)',
                  }}
                >
                  Assign To
                </label>
                <select
                  name="assignedTo"
                  value={formData.assignedTo}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '9px 10px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    fontSize: '13px',
                    background: 'var(--input-bg)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  <option value="">👤 Unassigned</option>
                  {currentProject?.members?.map((member) => (
                    <option key={member.user?._id} value={member.user?._id}>
                      {member.user?.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* ── ATTACHMENT NOTE ── */}
            {/* Cannot upload during creation because task has no ID yet */}
            <div
              style={{
                padding: '12px 14px',
                background: 'var(--bg-tertiary)',
                borderRadius: '8px',
                border: '1px dashed var(--border-color)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
              }}
            >
              <span style={{ fontSize: '20px', flexShrink: 0 }}>📎</span>
              <div>
                <p
                  style={{
                    margin: '0 0 3px',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: 'var(--text-primary)',
                  }}
                >
                  Attachments
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    lineHeight: '1.5',
                  }}
                >
                  You can add attachments after creating the task.
                  Click on the task card to open it and upload files.
                </p>
              </div>
            </div>

          </div>

          {/* ── FOOTER ── */}
          <div
            style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
              flexShrink: 0,
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 20px',
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
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '9px 24px',
                background: loading ? '#93c5fd' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: '500',
                fontSize: '14px',
              }}
            >
              {loading ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateTaskModal