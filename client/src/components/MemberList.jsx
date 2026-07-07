import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { toast } from 'react-toastify'
import API from '../api/axios'
import { fetchProjectById } from '../store/slices/projectSlice'
import useProjectRole from '../hooks/useProjectRole'

const MemberList = ({ projectId, members }) => {
  const dispatch = useDispatch()
  const { canManageMembers, isOwner, currentUserId } = useProjectRole()

  const [loadingMemberId, setLoadingMemberId] = useState(null)
  // tracks which member action is loading

  // Remove a member from the project
  const handleRemoveMember = async (userId, memberName) => {
    if (!window.confirm(`Remove ${memberName} from this project?`)) return

    setLoadingMemberId(userId)
    try {
      await API.delete(`/projects/${projectId}/members/${userId}`)
      toast.success(`${memberName} removed successfully`)
      // Refresh project data to show updated members list
      dispatch(fetchProjectById(projectId))
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove member')
    } finally {
      setLoadingMemberId(null)
    }
  }

  // Change a member's role (admin ↔ member)
  const handleChangeRole = async (userId, currentRole, memberName) => {
    const newRole = currentRole === 'admin' ? 'member' : 'admin'
    // Toggle between admin and member

    setLoadingMemberId(userId)
    try {
      await API.put(`/projects/${projectId}/members/${userId}/role`, {
        role: newRole,
      })
      toast.success(`${memberName} is now a ${newRole}`)
      dispatch(fetchProjectById(projectId))
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change role')
    } finally {
      setLoadingMemberId(null)
    }
  }

  // Role badge colors
  const roleBadgeStyle = (role) => ({
    fontSize: '10px',
    fontWeight: '600',
    padding: '2px 8px',
    borderRadius: '99px',
    background: role === 'admin' ? '#dbeafe' : 'var(--bg-tertiary)',
    color: role === 'admin' ? '#1d4ed8' : 'var(--text-secondary)',
  })

  return (
    <div style={{
      background: 'var(--card-bg)',
      borderRadius: '12px',
      padding: '20px',
      border: '1px solid var(--border-color)',
      marginBottom: '20px',
    }}>
      <h3 style={{
        margin: '0 0 16px',
        fontSize: '15px',
        color: 'var(--text-primary)',
        fontWeight: '600',
      }}>
        Members ({members?.length || 0})
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {members?.map((member) => {
          const isCurrentUser =
            member.user?._id?.toString() === currentUserId?.toString()
          const isProjectOwner =
            member.user?._id?.toString() ===
            members[0]?.user?._id?.toString()

          return (
            <div
              key={member._id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                background: 'var(--bg-tertiary)',
                borderRadius: '8px',
              }}
            >
              {/* Left side — avatar + name + email */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: '#3b82f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: '600',
                  fontSize: '14px',
                  flexShrink: 0,
                }}>
                  {member.user?.name?.charAt(0).toUpperCase()}
                </div>

                <div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}>
                    <span style={{
                      fontSize: '13px',
                      fontWeight: '500',
                      color: 'var(--text-primary)',
                    }}>
                      {member.user?.name}
                      {isCurrentUser && (
                        <span style={{ color: 'var(--text-secondary)', fontWeight: '400' }}>
                          {' '}(you)
                        </span>
                      )}
                    </span>
                    {/* Role badge */}
                    <span style={roleBadgeStyle(member.role)}>
                      {member.role}
                    </span>
                  </div>
                  <span style={{
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                  }}>
                    {member.user?.email}
                  </span>
                </div>
              </div>

              {/* Right side — action buttons (only for admins) */}
              {/* Hide buttons for current user and if no manage permission */}
              {canManageMembers && !isCurrentUser && (
                <div style={{ display: 'flex', gap: '6px' }}>

                  {/* Change role button — only owner can change roles */}
                  {isOwner && (
                    <button
                      onClick={() =>
                        handleChangeRole(
                          member.user._id,
                          member.role,
                          member.user.name
                        )
                      }
                      disabled={loadingMemberId === member.user._id}
                      title={`Change to ${member.role === 'admin' ? 'member' : 'admin'}`}
                      style={{
                        padding: '4px 10px',
                        fontSize: '11px',
                        background: 'transparent',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {loadingMemberId === member.user._id
                        ? '...'
                        : member.role === 'admin'
                        ? 'Make Member'
                        : 'Make Admin'}
                    </button>
                  )}

                  {/* Remove member button */}
                  <button
                    onClick={() =>
                      handleRemoveMember(member.user._id, member.user.name)
                    }
                    disabled={loadingMemberId === member.user._id}
                    title="Remove from project"
                    style={{
                      padding: '4px 10px',
                      fontSize: '11px',
                      background: 'transparent',
                      border: '1px solid #fca5a5',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      color: '#ef4444',
                    }}
                  >
                    {loadingMemberId === member.user._id ? '...' : 'Remove'}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default MemberList