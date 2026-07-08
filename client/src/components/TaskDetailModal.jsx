import { useState, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import axios from 'axios'
import { updateTask } from '../store/slices/taskSlice'

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

const PRIORITY_COLORS = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#ef4444',
  urgent: '#7c3aed',
}

// ─────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────

const formatDate = (dateString) => {
  if (!dateString) return 'Not set'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const formatDateForInput = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toISOString().split('T')[0]
}

const formatFileSize = (bytes) => {
  if (!bytes) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const getFileIcon = (mimetype) => {
  if (!mimetype) return '📎'
  if (mimetype.startsWith('image/')) return '🖼️'
  if (mimetype === 'application/pdf') return '📄'
  if (mimetype.includes('word')) return '📝'
  if (mimetype.includes('excel') || mimetype.includes('spreadsheet')) return '📊'
  if (mimetype.startsWith('text/')) return '📃'
  return '📎'
}

const isOverdue = (dueDate) => {
  if (!dueDate) return false
  return new Date(dueDate) < new Date()
}

// ─────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────
const TaskDetailModal = ({ task, projectId, onClose }) => {
  const dispatch = useDispatch()
  const fileInputRef = useRef(null)

  const { currentProject } = useSelector((state) => state.projects)
  const { loading } = useSelector((state) => state.tasks)
  const { user } = useSelector((state) => state.auth)

  // ─────────────────────────────────────────
  // FORM STATE
  // ─────────────────────────────────────────
  const [title, setTitle] = useState(task.title || '')
  const [description, setDescription] = useState(task.description || '')
  const [status, setStatus] = useState(task.status || 'todo')
  const [priority, setPriority] = useState(task.priority || 'medium')
  const [assignedTo, setAssignedTo] = useState(task.assignedTo?._id || '')
  const [dueDate, setDueDate] = useState(formatDateForInput(task.dueDate))
  const [attachments, setAttachments] = useState(task.attachments || [])
  const [isDirty, setIsDirty] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [deletingAttachmentId, setDeletingAttachmentId] = useState(null)

  // ─────────────────────────────────────────
  // EFFECTS
  // ─────────────────────────────────────────

  // Check if form has unsaved changes
  // Check if form has unsaved changes
// Also checks if attachments changed
useEffect(() => {
  const hasChanges =
    title !== task.title ||
    description !== (task.description || '') ||
    status !== task.status ||
    priority !== task.priority ||
    assignedTo !== (task.assignedTo?._id || '') ||
    dueDate !== formatDateForInput(task.dueDate) ||
    attachments.length !== (task.attachments?.length || 0)
    // ↑ NEW — if attachment count changed, form is dirty

  setIsDirty(hasChanges)
}, [title, description, status, priority, assignedTo, dueDate, task, attachments])
//                                                                   ↑ ADD attachments here

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isDirty])

  // ─────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────

  const handleClose = () => {
    if (isDirty) {
      const confirm = window.confirm(
        'You have unsaved changes. Are you sure you want to close?'
      )
      if (!confirm) return
    }
    onClose()
  }

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
          dueDate: dueDate || null,
        },
      })
    )
      .unwrap()
      .then(() => {
        toast.success('Task updated successfully!')
        onClose()
      })
      .catch((err) => toast.error(err || 'Failed to update task'))
  }

  const handleFileUpload = async (e) => {
  const file = e.target.files[0]
  if (!file) return

  if (file.size > 10 * 1024 * 1024) {
    toast.error('File size cannot exceed 10MB')
    return
  }

  const formData = new FormData()
  formData.append('attachment', file)
  setUploading(true)

  try {
    const userData = JSON.parse(localStorage.getItem('user'))
    const token = userData?.token

    const { data } = await axios.post(
      `http://localhost:5000/api/projects/${projectId}/tasks/${task._id}/attachments`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      }
    )

    // Update local attachments list with response
    setAttachments(data.task.attachments)
    toast.success('File uploaded successfully!')
    e.target.value = ''

    // ✅ NEW — also save any pending field changes if any exist
    // This keeps everything in sync
    if (isDirty) {
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
            dueDate: dueDate || null,
          },
        })
      )
    }

  } catch (error) {
    toast.error(error.response?.data?.message || 'Failed to upload file')
  } finally {
    setUploading(false)
  }
}

  const handleDownload = async (attachment) => {
    try {
      const userData = JSON.parse(localStorage.getItem('user'))
      const token = userData?.token

      const response = await axios.get(
        `http://localhost:5000${attachment.url}`,
        {
          responseType: 'blob',
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', attachment.originalName)
      document.body.appendChild(link)
      link.click()
      link.parentNode.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success(`Downloading ${attachment.originalName}`)
    } catch (error) {
      toast.error('Failed to download file')
    }
  }

  const handleDeleteAttachment = async (attachmentId) => {
    if (!window.confirm('Delete this attachment?')) return

    setDeletingAttachmentId(attachmentId)
    try {
      const userData = JSON.parse(localStorage.getItem('user'))
      const token = userData?.token

      await axios.delete(
        `http://localhost:5000/api/projects/${projectId}/tasks/${task._id}/attachments/${attachmentId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      setAttachments((prev) => prev.filter((a) => a._id !== attachmentId))
      toast.success('Attachment deleted')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete attachment')
    } finally {
      setDeletingAttachmentId(null)
    }
  }

  // ─────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────
  return (
    <>
      {/* ── BACKDROP ── */}
      <div
        onClick={handleClose}
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 200,
        }}
      />

      {/* ── MODAL PANEL ── */}
      <div
        style={{
          position: 'fixed',
          top: 0, right: 0, bottom: 0,
          width: '520px',
          maxWidth: '100vw',
          background: 'var(--card-bg)',
          zIndex: 201,
          boxShadow: '-4px 0 24px rgba(0,0,0,0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* ── MODAL HEADER ── */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                background: `${PRIORITY_COLORS[priority]}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
              }}
            >
              ✓
            </div>
            <span
              style={{
                fontSize: '12px',
                color: 'var(--text-secondary)',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Task Detail
            </span>
          </div>
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
            }}
          >
            ✕
          </button>
        </div>

        {/* ── MODAL BODY (scrollable) ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>

          {/* Task Title */}
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

          {/* ── STATUS + PRIORITY ── */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              marginBottom: '16px',
            }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: '600',
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '6px',
                }}
              >
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
                  fontSize: '11px',
                  fontWeight: '600',
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '6px',
                }}
              >
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

          {/* ── TARGET DATE + ASSIGN TO ── */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              marginBottom: '16px',
            }}
          >
            {/* Target Date */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: '600',
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '6px',
                }}
              >
                Target Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  border:
                    dueDate && isOverdue(dueDate)
                      ? '1px solid #ef4444'
                      : '1px solid var(--border-color)',
                  borderRadius: '8px',
                  fontSize: '13px',
                  background: 'var(--input-bg)',
                  color:
                    dueDate && isOverdue(dueDate)
                      ? '#ef4444'
                      : 'var(--text-primary)',
                  cursor: 'pointer',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              {dueDate && isOverdue(dueDate) && (
                <p style={{ margin: '3px 0 0', fontSize: '11px', color: '#ef4444' }}>
                  ⚠ This task is overdue
                </p>
              )}
            </div>

            {/* Assign To */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: '600',
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '6px',
                }}
              >
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

              {/* Current assignee info */}
              {assignedTo && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginTop: '6px',
                    padding: '6px 10px',
                    background: 'var(--bg-tertiary)',
                    borderRadius: '8px',
                  }}
                >
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: '#3b82f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '11px',
                      fontWeight: '600',
                      flexShrink: 0,
                    }}
                  >
                    {currentProject?.members
                      ?.find((m) => m.user?._id === assignedTo)
                      ?.user?.name?.charAt(0)
                      .toUpperCase()}
                  </div>
                  <span
                    style={{
                      fontSize: '12px',
                      color: 'var(--text-primary)',
                      fontWeight: '500',
                    }}
                  >
                    {currentProject?.members
                      ?.find((m) => m.user?._id === assignedTo)
                      ?.user?.name}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ── DESCRIPTION ── */}
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: '600',
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '6px',
              }}
            >
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description..."
              rows={4}
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
                outline: 'none',
              }}
            />
          </div>

          {/* ── ATTACHMENTS SECTION ── */}
          <div style={{ marginBottom: '20px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '10px',
              }}
            >
              <div>
                <label
                  style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Attachments ({attachments.length})
                </label>
                <p
                  style={{
                    margin: '2px 0 0',
                    fontSize: '11px',
                    color: '#10b981',
                    fontWeight: '500',
                  }}
                >
                  ✓ Attachments are saved automatically
                </p>
              </div>

              {/* Upload button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                style={{
                  padding: '6px 12px',
                  background: uploading ? 'var(--bg-tertiary)' : '#3b82f6',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  fontSize: '12px',
                  color: uploading ? 'var(--text-secondary)' : 'white',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontWeight: '500',
                }}
              >
                {uploading ? '⏳ Uploading...' : '📎 Attach File'}
              </button>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
              />
            </div>

            {/* Attachment list */}
            {attachments.length === 0 ? (
              <div
                style={{
                  padding: '20px',
                  background: 'var(--bg-tertiary)',
                  borderRadius: '8px',
                  textAlign: 'center',
                  border: '2px dashed var(--border-color)',
                }}
              >
                <p
                  style={{
                    margin: '0 0 4px',
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                  }}
                >
                  📎 No attachments yet
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: '11px',
                    color: 'var(--text-tertiary)',
                  }}
                >
                  Click "Attach File" to upload
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {attachments.map((attachment) => (
                  <div
                    key={attachment._id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      background: 'var(--bg-tertiary)',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    {/* File icon */}
                    <span style={{ fontSize: '20px', flexShrink: 0 }}>
                      {getFileIcon(attachment.mimetype)}
                    </span>

                    {/* File info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          margin: 0,
                          fontSize: '13px',
                          fontWeight: '500',
                          color: 'var(--text-primary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {attachment.originalName}
                      </p>
                      <p
                        style={{
                          margin: '2px 0 0',
                          fontSize: '11px',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {formatFileSize(attachment.size)} •{' '}
                        {formatDate(attachment.uploadedAt)}
                      </p>
                    </div>

                    {/* Download button */}
                    <button
                      onClick={() => handleDownload(attachment)}
                      title="Download file"
                      style={{
                        background: 'transparent',
                        border: '1px solid #3b82f6',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        padding: '5px 10px',
                        fontSize: '12px',
                        color: '#3b82f6',
                        flexShrink: 0,
                        fontWeight: '500',
                      }}
                    >
                      ⬇ Download
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => handleDeleteAttachment(attachment._id)}
                      disabled={deletingAttachmentId === attachment._id}
                      title="Delete attachment"
                      style={{
                        background: 'transparent',
                        border: '1px solid #fca5a5',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        padding: '5px 8px',
                        fontSize: '12px',
                        color: '#ef4444',
                        flexShrink: 0,
                      }}
                    >
                      {deletingAttachmentId === attachment._id ? '...' : '🗑'}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* File type hint */}
            <p
              style={{
                margin: '6px 0 0',
                fontSize: '11px',
                color: 'var(--text-tertiary)',
              }}
            >
              Allowed: Images, PDF, Word, Excel, Text • Max 10MB
            </p>
          </div>

          {/* ── TASK META INFO ── */}
          <div
            style={{
              background: 'var(--bg-tertiary)',
              borderRadius: '10px',
              padding: '14px 16px',
            }}
          >
            <p
              style={{
                margin: '0 0 10px',
                fontSize: '11px',
                fontWeight: '600',
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Details
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>

              {/* Created by */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Created by
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div
                    style={{
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
                    }}
                  >
                    {task.createdBy?.name?.charAt(0).toUpperCase()}
                  </div>
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: '500',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {task.createdBy?.name}
                  </span>
                </div>
              </div>

              {/* Created on */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Created on
                </span>
                <span
                  style={{
                    fontSize: '12px',
                    color: 'var(--text-primary)',
                    fontWeight: '500',
                  }}
                >
                  {formatDate(task.createdAt)}
                </span>
              </div>

              {/* Target date */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Target date
                </span>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: '500',
                    color:
                      task.dueDate && isOverdue(task.dueDate)
                        ? '#ef4444'
                        : 'var(--text-primary)',
                  }}
                >
                  {task.dueDate
                    ? `${formatDate(task.dueDate)}${isOverdue(task.dueDate) ? ' ⚠ Overdue' : ''}`
                    : 'Not set'}
                </span>
              </div>

              {/* Last updated */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Last updated
                </span>
                <span
                  style={{
                    fontSize: '12px',
                    color: 'var(--text-primary)',
                    fontWeight: '500',
                  }}
                >
                  {formatDate(task.updatedAt)}
                </span>
              </div>
            </div>
          </div>

        </div>
        {/* END MODAL BODY */}

        {/* ── MODAL FOOTER ── */}
<div
  style={{
    padding: '16px 20px',
    borderTop: '1px solid var(--border-color)',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    flexShrink: 0,
    background: 'var(--card-bg)',
  }}
>
  {/* Info message */}
  <p
    style={{
      margin: 0,
      fontSize: '11px',
      color: isDirty ? '#f59e0b' : '#10b981',
      textAlign: 'center',
      fontWeight: '500',
    }}
  >
    {isDirty
      ? '⚠ You have unsaved changes — click Save Changes'
      : '✓ All changes are saved'}
  </p>

  <div style={{ display: 'flex', gap: '12px' }}>
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
      {loading ? 'Saving...' : isDirty ? 'Save Changes' : 'All Saved ✓'}
    </button>

    {/* Close button */}
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
      Close
    </button>
  </div>
</div>
        {/* END MODAL FOOTER */}

      </div>
      {/* END MODAL PANEL */}
    </>
  )
}

export default TaskDetailModal