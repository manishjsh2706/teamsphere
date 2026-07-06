import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import { logout } from '../store/slices/authSlice'
import { toast } from 'react-toastify'

const Navbar = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.auth)

  const handleLogout = () => {
    dispatch(logout())
    toast.success('Logged out successfully')
    navigate('/login')
  }

  return (
    <nav style={{
      background: '#1e293b',
      padding: '0 24px',
      height: '60px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      {/* Logo */}
      <Link
        to="/dashboard"
        style={{
          color: 'white',
          textDecoration: 'none',
          fontSize: '20px',
          fontWeight: '700',
          letterSpacing: '-0.5px',
        }}
      >
        Team<span style={{ color: '#3b82f6' }}>Sphere</span>
      </Link>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span style={{ color: '#94a3b8', fontSize: '14px' }}>
          {user?.name}
        </span>

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
        }}>
          {user?.name?.charAt(0).toUpperCase()}
          {/* Shows first letter of user's name */}
        </div>

        <button
          onClick={handleLogout}
          style={{
            padding: '8px 16px',
            background: 'transparent',
            color: '#94a3b8',
            border: '1px solid #334155',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          Logout
        </button>
      </div>
    </nav>
  )
}

export default Navbar