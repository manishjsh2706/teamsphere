import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import {
  fetchProjects,
  createProject,
  clearProjectError,
  clearProjectSuccess,
} from '../../store/slices/projectSlice'
import Navbar from '../../components/Navbar'
import ProjectCard from '../../components/ProjectCard'
import { validateProjectName } from '../../utils/validation'

const Dashboard = () => {
  const dispatch = useDispatch()

  const { projects, loading, error, success } =
    useSelector((state) => state.projects)

  // Show or hide create project form
  const [showForm, setShowForm] = useState(false)

  // Create project form data
  const [projectData, setProjectData] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
  })

  // Create project form errors
  const [formErrors, setFormErrors] = useState({
    name: '',
  })

  // Color options
  const colors = [
    '#3B82F6', '#10B981', '#F59E0B',
    '#EF4444', '#8B5CF6', '#EC4899',
  ]

  // ─────────────────────────────────────────
  // EFFECTS
  // ─────────────────────────────────────────

  // Fetch projects when page loads
  useEffect(() => {
    dispatch(fetchProjects())
  }, [dispatch])

  // Show errors
  useEffect(() => {
    if (error) {
      toast.error(error)
      dispatch(clearProjectError())
    }
  }, [error, dispatch])

  // Hide form after successful project creation
  useEffect(() => {
    if (success && showForm) {
      toast.success('Project created!')
      setShowForm(false)
      setProjectData({ name: '', description: '', color: '#3B82F6' })
      setFormErrors({ name: '' })
      dispatch(clearProjectSuccess())
    }
  }, [success, showForm, dispatch])

  // ─────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────

  const handleChange = (e) => {
    const { name, value } = e.target
    setProjectData({ ...projectData, [name]: value })
    if (name === 'name') {
      setFormErrors({ name: '' })
    }
  }

  const handleCreateProject = (e) => {
    e.preventDefault()

    // Validate project name
    const nameError = validateProjectName(projectData.name)
    if (nameError) {
      setFormErrors({ name: nameError })
      return
    }

    dispatch(createProject(projectData))
  }

  // ─────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Navbar />

      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '32px 24px',
      }}>

        {/* ── HEADER ── */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px',
        }}>
          <div>
            <h1 style={{
              margin: 0,
              fontSize: '28px',
              color: 'var(--text-primary)',
              fontWeight: '700',
            }}>
              My Projects
            </h1>
            <p style={{
              margin: '4px 0 0',
              color: 'var(--text-secondary)',
              fontSize: '14px',
            }}>
              {projects.length} project{projects.length !== 1 ? 's' : ''}
            </p>
          </div>

          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              padding: '10px 20px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '14px',
            }}
          >
            + New Project
          </button>
        </div>

        {/* ── CREATE PROJECT FORM ── */}
        {showForm && (
          <div style={{
            background: 'var(--card-bg)',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
            boxShadow: 'var(--shadow)',
            border: '1px solid var(--border-color)',
          }}>
            <h3 style={{
              margin: '0 0 16px',
              color: 'var(--text-primary)',
              fontSize: '16px',
              fontWeight: '600',
            }}>
              Create New Project
            </h3>

            <form onSubmit={handleCreateProject}>

              {/* Project name */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontWeight: '500',
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                }}>
                  Project Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={projectData.name}
                  onChange={handleChange}
                  placeholder="e.g. TeamSphere App"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: formErrors.name
                      ? '1.5px solid #ef4444'
                      : '1px solid var(--border-color)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    background: 'var(--input-bg)',
                    color: 'var(--text-primary)',
                  }}
                />
                {formErrors.name && (
                  <p style={{
                    margin: '4px 0 0',
                    fontSize: '12px',
                    color: '#ef4444',
                  }}>
                    ⚠ {formErrors.name}
                  </p>
                )}
              </div>

              {/* Description */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontWeight: '500',
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                }}>
                  Description
                </label>
                <textarea
                  name="description"
                  value={projectData.description}
                  onChange={handleChange}
                  placeholder="What is this project about?"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                    background: 'var(--input-bg)',
                    color: 'var(--text-primary)',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              {/* Color picker */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '500',
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                }}>
                  Project Color
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {colors.map((color) => (
                    <div
                      key={color}
                      onClick={() =>
                        setProjectData({ ...projectData, color })
                      }
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: color,
                        cursor: 'pointer',
                        border: projectData.color === color
                          ? '3px solid var(--text-primary)'
                          : '3px solid transparent',
                        flexShrink: 0,
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '10px 24px',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '500',
                    fontSize: '14px',
                  }}
                >
                  {loading ? 'Creating...' : 'Create Project'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setFormErrors({ name: '' })
                    setProjectData({
                      name: '',
                      description: '',
                      color: '#3B82F6',
                    })
                  }}
                  style={{
                    padding: '10px 24px',
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
            </form>
          </div>
        )}

        {/* ── PROJECTS GRID ── */}
        {loading && projects.length === 0 ? (
          <p style={{
            color: 'var(--text-secondary)',
            textAlign: 'center',
            padding: '40px',
          }}>
            Loading projects...
          </p>
        ) : projects.length === 0 ? (
          // Empty state
          <div style={{
            textAlign: 'center',
            padding: '80px 20px',
            background: 'var(--card-bg)',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
          }}>
            <p style={{ fontSize: '48px', margin: '0 0 16px' }}>📋</p>
            <h3 style={{
              color: 'var(--text-primary)',
              margin: '0 0 8px',
              fontSize: '18px',
            }}>
              No projects yet
            </h3>
            <p style={{
              color: 'var(--text-secondary)',
              margin: '0 0 24px',
              fontSize: '14px',
            }}>
              Create your first project to get started
            </p>
            <button
              onClick={() => setShowForm(true)}
              style={{
                padding: '10px 24px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '14px',
              }}
            >
              Create Project
            </button>
          </div>
        ) : (
          // Projects grid
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '20px',
          }}>
            {projects.map((project) => (
              <ProjectCard
                key={project._id}
                project={project}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard