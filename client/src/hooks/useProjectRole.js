import { useSelector } from 'react-redux'

// This hook tells us what role the current user has
// in the currently viewed project
const useProjectRole = () => {

  // Get logged in user from Redux auth state
  const { user } = useSelector((state) => state.auth)

  // Get current project from Redux projects state
  const { currentProject } = useSelector((state) => state.projects)

  // If no project loaded yet return defaults
  if (!user || !currentProject) {
    return {
      isOwner: false,
      isProjectAdmin: false,
      isSystemAdmin: false,
      canManageProject: false,
      canManageMembers: false,
    }
  }

  // Check 1 — Is this user the project OWNER?
  // Owner is the person who created the project
  const isOwner =
    currentProject.owner?._id?.toString() === user._id?.toString()

  // Check 2 — Is this user a PROJECT ADMIN?
  // A member with admin role inside this specific project
  const isProjectAdmin = currentProject.members?.some(
    (member) =>
      member.user?._id?.toString() === user._id?.toString() &&
      member.role === 'admin'
  )

  // Check 3 — Is this user a SYSTEM ADMIN?
  // Admin of the entire TeamSphere platform
  const isSystemAdmin = user.role === 'admin'

  // Combined permissions
  // Can manage project = owner OR project admin OR system admin
  const canManageProject = isOwner || isProjectAdmin || isSystemAdmin

  // Can manage members = same as above
  const canManageMembers = isOwner || isProjectAdmin || isSystemAdmin

  return {
    isOwner,
    isProjectAdmin,
    isSystemAdmin,
    canManageProject,
    canManageMembers,
    currentUserId: user._id,
  }
}

export default useProjectRole