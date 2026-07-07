import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import { logout } from '../store/slices/authSlice'
import { useTheme } from '../context/ThemeContext'
import { toast } from 'react-toastify'

const Navbar = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.auth)

  // Get theme state and toggle function from ThemeContext
  const { theme, toggleTheme } = useTheme()

  const handleLogout = () => {
    dispatch(logout())
    toast.success('Logged out successfully')
    navigate('/login')
  }

  return (
    <nav style={{
      background: 'var(--navbar-bg)',
      padding: '0 24px',
      height: '60px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>

        {/* Dark/Light theme toggle button */}
        <button
          onClick={toggleTheme}
          title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.15)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            color: 'white',
          }}
        >
          {/* Show sun icon in dark mode, moon icon in light mode */}
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        {/* User name */}
        <span style={{ color: '#94a3b8', fontSize: '14px' }}>
          {user?.name}
        </span>

        {/* User avatar with first letter */}
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
        </div>

        {/* Logout button */}
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