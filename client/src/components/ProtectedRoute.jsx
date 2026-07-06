import { useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'

// This component wraps pages that require login
// If user is not logged in → redirect to login page
// If user is logged in → show the page normally

const ProtectedRoute = ({ children }) => {
  // useSelector reads data from Redux store
  // state.auth.user is the logged in user
  const { user } = useSelector((state) => state.auth)

  if (!user) {
    // User not logged in → redirect to login
    return <Navigate to="/login" replace />
  }

  // User is logged in → show the page
  return children
}

export default ProtectedRoute