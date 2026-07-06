import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { logout } from '../../store/slices/authSlice'
import { toast } from 'react-toastify'

const Dashboard = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  // Get user from Redux store
  const { user } = useSelector((state) => state.auth)

  const handleLogout = () => {
    dispatch(logout())
    // logout action clears user from store and localStorage
    toast.success('Logged out successfully')
    navigate('/login')
  }

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '40px'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '28px' }}>
            Welcome, {user?.name}! 👋
          </h1>
          <p style={{ color: '#6b7280', margin: '4px 0 0' }}>
            {user?.email} · {user?.role}
          </p>
        </div>

        <button
          onClick={handleLogout}
          style={{
            padding: '10px 20px',
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          Logout
        </button>
      </div>

      <div style={{
        background: '#f0fdf4',
        border: '1px solid #86efac',
        borderRadius: '12px',
        padding: '24px',
        textAlign: 'center'
      }}>
        <h2 style={{ color: '#16a34a' }}>
          ✅ Auth is working!
        </h2>
        <p style={{ color: '#15803d' }}>
          Project boards coming in Phase 6
        </p>
      </div>
    </div>
  )
}

export default Dashboard