import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import {
  fetchProjects,
  createProject,
  clearProjectError,
  clearProjectSuccess,
} from '../../store/slices/projectSlice'
import Navbar from '../../components/Navbar'

const Dashboard = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const { projects, loading, error, success } =
    useSelector((state) => state.projects)

  // State for create project form
  const [showForm, setShowForm] = useState(false)
  const [projectData, setProjectData] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
  })

  // Fetch projects when page loads
  useEffect(() => {
    dispatch(fetchProjects())
  }, [dispatch])

  // Show error toast
  useEffect(() => {
    if (error) {
      toast.error(error)
      dispatch(clearProjectError())
    }
  }, [error, dispatch])

  // Show success toast and hide form
  useEffect(() => {
    if (success) {
      toast.success('Project created!')
      setShowForm(false)
      setProjectData({ name: '', description: '', color: '#3B82F6' })
      dispatch(clearProjectSuccess())
    }
  }, [success, dispatch])

  const handleChange = (e) => {
    setProjectData({ ...projectData, [e.target.name]: e.target.value })
  }

  const handleCreateProject = (e) => {
    e.preventDefault()
    if (!projectData.name.trim()) {
      toast.error('Project name is required')
      return
    }
    dispatch(createProject(projectData))
  }

  // Color options for project cards
  const colors = [
    '#3B82F6', '#10B981', '#F59E0B',
    '#EF4444', '#8B5CF6', '#EC4899',
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Navbar />

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>

        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px',
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '28px', color: '#0f172a' }}>
              My Projects
            </h1>
            <p style={{ margin: '4px 0 0', color: '#64748b' }}>
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

        {/* Create Project Form */}
        {showForm && (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}>
            <h3 style={{ margin: '0 0 16px', color: '#0f172a' }}>
              Create New Project
            </h3>
            <form onSubmit={handleCreateProject}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px' }}>
                  Project Name *
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
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px' }}>
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
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
                  Project Color
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {colors.map((color) => (
                    <div
                      key={color}
                      onClick={() => setProjectData({ ...projectData, color })}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: color,
                        cursor: 'pointer',
                        border: projectData.color === color
                          ? '3px solid #0f172a'
                          : '3px solid transparent',
                      }}
                    />
                  ))}
                </div>
              </div>

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
                  }}
                >
                  {loading ? 'Creating...' : 'Create Project'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={{
                    padding: '10px 24px',
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
            </form>
          </div>
        )}

        {/* Projects Grid */}
        {loading && !showForm ? (
          <p style={{ color: '#64748b', textAlign: 'center' }}>
            Loading projects...
          </p>
        ) : projects.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '80px 20px',
            background: 'white',
            borderRadius: '12px',
          }}>
            <p style={{ fontSize: '48px', margin: '0 0 16px' }}>📋</p>
            <h3 style={{ color: '#0f172a', margin: '0 0 8px' }}>
              No projects yet
            </h3>
            <p style={{ color: '#64748b', margin: '0 0 24px' }}>
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
              }}
            >
              Create Project
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '20px',
          }}>
            {projects.map((project) => (
              <div
                key={project._id}
                onClick={() => navigate(`/projects/${project._id}`)}
                style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '20px',
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  borderTop: `4px solid ${project.color}`,
                  transition: 'transform 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'
                }}
              >
                <h3 style={{
                  margin: '0 0 8px',
                  fontSize: '16px',
                  color: '#0f172a',
                }}>
                  {project.name}
                </h3>
                <p style={{
                  margin: '0 0 16px',
                  fontSize: '13px',
                  color: '#64748b',
                  lineHeight: '1.5',
                }}>
                  {project.description || 'No description'}
                </p>

                {/* Member avatars */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex' }}>
                    {project.members?.slice(0, 3).map((member, index) => (
                      <div
                        key={member._id}
                        title={member.user?.name}
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: project.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '11px',
                          fontWeight: '600',
                          marginLeft: index > 0 ? '-8px' : '0',
                          border: '2px solid white',
                        }}
                      >
                        {member.user?.name?.charAt(0).toUpperCase()}
                      </div>
                    ))}
                    {project.members?.length > 3 && (
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: '#e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        color: '#64748b',
                        marginLeft: '-8px',
                        border: '2px solid white',
                      }}>
                        +{project.members.length - 3}
                      </div>
                    )}
                  </div>

                  <span style={{
                    fontSize: '11px',
                    color: '#64748b',
                    background: '#f1f5f9',
                    padding: '2px 8px',
                    borderRadius: '99px',
                  }}>
                    {project.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard