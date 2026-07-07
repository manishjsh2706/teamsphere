import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import {
  deleteProject,
  updateProject,
  clearProjectError,
  clearProjectSuccess,
} from '../store/slices/projectSlice'
import { validateProjectName } from '../utils/validation'

const ProjectCard = ({ project }) => {
  const navigate = useNavigate()
  const dispatch = useDispatch()

  // Get logged in user to check if they are owner
  const { user } = useSelector((state) => state.auth)
  const { loading, error, success } = useSelector(
    (state) => state.projects
  )

  // Show or hide the 3 dots dropdown menu
  const [showMenu, setShowMenu] = useState(false)

  // Show or hide edit form
  const [showEdit, setShowEdit] = useState(false)

  // Edit form data
  const [editData, setEditData] = useState({
    name: project.name,
    description: project.description || '',
    color: project.color,
  })

  // Edit form errors
  const [editErrors, setEditErrors] = useState({
    name: '',
  })

  // Ref for the dropdown menu
  // Used to close menu when clicking outside
  const menuRef = useRef(null)

  // Color options for edit form
  const colors = [
    '#3B82F6', '#10B981', '#F59E0B',
    '#EF4444', '#8B5CF6', '#EC4899',
  ]

  // Check if current user is the project owner
  const isOwner =
    project.owner?._id?.toString() === user?._id?.toString() ||
    project.owner?.toString() === user?._id?.toString()

  // ─────────────────────────────────────────
  // EFFECTS
  // ─────────────────────────────────────────

  // Close menu when clicking outside of it
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Show errors from Redux
  useEffect(() => {
    if (error) {
      toast.error(error)
      dispatch(clearProjectError())
    }
  }, [error, dispatch])

  // Close edit form on success
  useEffect(() => {
    if (success && showEdit) {
      toast.success('Project updated successfully!')
      setShowEdit(false)
      dispatch(clearProjectSuccess())
    }
  }, [success, showEdit, dispatch])

  // ─────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────

  // Handle delete project
  const handleDelete = (e) => {
    // stopPropagation prevents card click from opening board
    e.stopPropagation()
    setShowMenu(false)

    // Confirmation popup before deleting
    const confirmed = window.confirm(
      `Are you sure you want to delete "${project.name}"?\n\nThis will also delete ALL tasks in this project. This action cannot be undone.`
    )

    if (confirmed) {
      dispatch(deleteProject(project._id))
        .unwrap()
        .then(() => {
          toast.success(`"${project.name}" deleted successfully`)
        })
        .catch((err) => toast.error(err))
    }
  }

  // Handle edit button click
  const handleEditClick = (e) => {
    e.stopPropagation()
    setShowMenu(false)
    setShowEdit(true)
    // Reset form with current project data
    setEditData({
      name: project.name,
      description: project.description || '',
      color: project.color,
    })
  }

  // Handle edit form submit
  const handleEditSubmit = (e) => {
    e.stopPropagation()
    e.preventDefault()

    // Validate project name
    const nameError = validateProjectName(editData.name)
    if (nameError) {
      setEditErrors({ name: nameError })
      return
    }

    dispatch(updateProject({
      projectId: project._id,
      projectData: editData,
    }))
  }

  // Handle edit form field change
  const handleEditChange = (e) => {
    const { name, value } = e.target
    setEditData({ ...editData, [name]: value })

    // Clear error when user types
    if (name === 'name') {
      setEditErrors({ name: '' })
    }
  }

  // ─────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────
  return (
    <>
      {/* ── PROJECT CARD ── */}
      <div
        onClick={() => !showEdit && navigate(`/projects/${project._id}`)}
        style={{
          background: 'var(--card-bg)',
          borderRadius: '12px',
          padding: '20px',
          cursor: showEdit ? 'default' : 'pointer',
          boxShadow: 'var(--shadow)',
          border: '1px solid var(--border-color)',
          borderTop: `4px solid ${project.color}`,
          position: 'relative',
          transition: 'transform 0.15s, box-shadow 0.15s',
        }}
        onMouseEnter={(e) => {
          if (!showEdit) {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = 'var(--shadow-hover)'
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = 'var(--shadow)'
        }}
      >

        {/* ── CARD HEADER ── */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '8px',
        }}>
          {/* Project name */}
          <h3 style={{
            margin: 0,
            fontSize: '15px',
            fontWeight: '600',
            color: 'var(--text-primary)',
            flex: 1,
            paddingRight: '8px',
            lineHeight: '1.3',
          }}>
            {project.name}
          </h3>

          {/* 3 dots menu button — only for project owner */}
          {isOwner && (
            <div ref={menuRef} style={{ position: 'relative' }}>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowMenu(!showMenu)
                }}
                title="Project options"
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  fontSize: '18px',
                  padding: '2px 6px',
                  borderRadius: '6px',
                  lineHeight: '1',
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--bg-tertiary)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                ⋮
              </button>

              {/* ── DROPDOWN MENU ── */}
              {showMenu && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                  zIndex: 50,
                  minWidth: '150px',
                  overflow: 'hidden',
                }}>

                  {/* Edit option */}
                  <button
                    onClick={handleEditClick}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--bg-tertiary)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    ✏️ Edit Project
                  </button>

                  {/* Divider */}
                  <div style={{
                    height: '1px',
                    background: 'var(--border-color)',
                  }} />

                  {/* Delete option */}
                  <button
                    onClick={handleDelete}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#ef4444',
                      fontSize: '13px',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#fef2f2'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    🗑️ Delete Project
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Project description */}
        <p style={{
          margin: '0 0 16px',
          fontSize: '13px',
          color: 'var(--text-secondary)',
          lineHeight: '1.5',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {project.description || 'No description'}
        </p>

        {/* ── EDIT FORM ── */}
        {/* Inline edit form inside the card */}
        {showEdit && (
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-tertiary)',
              borderRadius: '8px',
              padding: '14px',
              marginBottom: '12px',
              border: '1px solid var(--border-color)',
            }}
          >
            <p style={{
              margin: '0 0 10px',
              fontSize: '12px',
              fontWeight: '600',
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              Edit Project
            </p>

            {/* Project name input */}
            <div style={{ marginBottom: '10px' }}>
              <input
                type="text"
                name="name"
                value={editData.name}
                onChange={handleEditChange}
                placeholder="Project name"
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  border: editErrors.name
                    ? '1.5px solid #ef4444'
                    : '1px solid var(--border-color)',
                  borderRadius: '6px',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                  background: 'var(--input-bg)',
                  color: 'var(--text-primary)',
                }}
              />
              {editErrors.name && (
                <p style={{
                  margin: '3px 0 0',
                  fontSize: '11px',
                  color: '#ef4444',
                }}>
                  ⚠ {editErrors.name}
                </p>
              )}
            </div>

            {/* Description input */}
            <div style={{ marginBottom: '10px' }}>
              <textarea
                name="description"
                value={editData.description}
                onChange={handleEditChange}
                placeholder="Description (optional)"
                rows={2}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                  background: 'var(--input-bg)',
                  color: 'var(--text-primary)',
                  resize: 'none',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            {/* Color picker */}
            <div style={{ marginBottom: '12px' }}>
              <p style={{
                margin: '0 0 6px',
                fontSize: '11px',
                color: 'var(--text-secondary)',
                fontWeight: '500',
              }}>
                Color
              </p>
              <div style={{ display: 'flex', gap: '6px' }}>
                {colors.map((color) => (
                  <div
                    key={color}
                    onClick={() => setEditData({ ...editData, color })}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: color,
                      cursor: 'pointer',
                      border: editData.color === color
                        ? '3px solid var(--text-primary)'
                        : '3px solid transparent',
                      flexShrink: 0,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Save and Cancel buttons */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleEditSubmit}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '7px',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '500',
                }}
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowEdit(false)
                  setEditErrors({ name: '' })
                }}
                style={{
                  padding: '7px 12px',
                  background: 'transparent',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ── CARD FOOTER ── */}
        {/* Member avatars + status badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          {/* Member avatars */}
          <div style={{ display: 'flex' }}>
            {project.members?.slice(0, 3).map((member, index) => (
              <div
                key={member._id}
                title={member.user?.name}
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: project.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '10px',
                  fontWeight: '600',
                  marginLeft: index > 0 ? '-6px' : '0',
                  border: '2px solid var(--card-bg)',
                  position: 'relative',
                }}
              >
                {member.user?.name?.charAt(0).toUpperCase()}
              </div>
            ))}
            {project.members?.length > 3 && (
              <div style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                background: 'var(--bg-tertiary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                color: 'var(--text-secondary)',
                marginLeft: '-6px',
                border: '2px solid var(--card-bg)',
                fontWeight: '600',
              }}>
                +{project.members.length - 3}
              </div>
            )}
          </div>

          {/* Status badge */}
          <span style={{
            fontSize: '11px',
            color: 'var(--text-secondary)',
            background: 'var(--bg-tertiary)',
            padding: '2px 8px',
            borderRadius: '99px',
            textTransform: 'capitalize',
          }}>
            {project.status}
          </span>
        </div>
      </div>
    </>
  )
}

export default ProjectCard