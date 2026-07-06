import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import API from '../../api/axios'

// ─────────────────────────────────────────
// ASYNC THUNKS
// These are functions that make API calls
// Redux Toolkit handles the async logic for us
// ─────────────────────────────────────────

// Register user thunk
export const registerUser = createAsyncThunk(
  'auth/register',
  // 'auth/register' is just a unique name for this action
  async (formData, { rejectWithValue }) => {
    try {
      const { data } = await API.post('/auth/register', formData)
      // Save user to localStorage so they stay logged in after refresh
      localStorage.setItem('user', JSON.stringify(data))
      return data
    } catch (error) {
      // rejectWithValue sends error to rejected case below
      return rejectWithValue(
        error.response?.data?.message || 'Registration failed'
      )
    }
  }
)

// Login user thunk
export const loginUser = createAsyncThunk(
  'auth/login',
  async (formData, { rejectWithValue }) => {
    try {
      const { data } = await API.post('/auth/login', formData)
      localStorage.setItem('user', JSON.stringify(data))
      return data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Login failed'
      )
    }
  }
)

// Get user profile thunk
export const getUserProfile = createAsyncThunk(
  'auth/profile',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await API.get('/auth/profile')
      return data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to get profile'
      )
    }
  }
)

// ─────────────────────────────────────────
// INITIAL STATE
// What the auth state looks like at the start
// ─────────────────────────────────────────
const initialState = {
  // Try to load user from localStorage on app start
  // This keeps user logged in after page refresh
  user: JSON.parse(localStorage.getItem('user')) || null,
  loading: false,
  error: null,
  success: false,
}

// ─────────────────────────────────────────
// SLICE
// A slice combines actions + reducer in one place
// This is the modern Redux Toolkit way
// ─────────────────────────────────────────
const authSlice = createSlice({
  name: 'auth',
  initialState,

  // Regular synchronous actions
  reducers: {
    // Logout action — clears user from state and localStorage
    logout: (state) => {
      state.user = null
      state.error = null
      state.success = false
      localStorage.removeItem('user')
    },

    // Clear any error messages
    clearError: (state) => {
      state.error = null
    },

    // Clear success flag
    clearSuccess: (state) => {
      state.success = false
    },
  },

  // Extra reducers handle async thunk states
  // Every async thunk has 3 states: pending, fulfilled, rejected
  extraReducers: (builder) => {
    builder

      // ── REGISTER ──
      .addCase(registerUser.pending, (state) => {
        // Request is in progress
        state.loading = true
        state.error = null
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        // Request succeeded
        state.loading = false
        state.user = action.payload
        // action.payload = the data returned from our thunk
        state.success = true
      })
      .addCase(registerUser.rejected, (state, action) => {
        // Request failed
        state.loading = false
        state.error = action.payload
        // action.payload = the error message from rejectWithValue
      })

      // ── LOGIN ──
      .addCase(loginUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload
        state.success = true
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // ── GET PROFILE ──
      .addCase(getUserProfile.pending, (state) => {
        state.loading = true
      })
      .addCase(getUserProfile.fulfilled, (state, action) => {
        state.loading = false
        state.user = { ...state.user, ...action.payload }
        // Merge existing user (with token) with fresh profile data
      })
      .addCase(getUserProfile.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

// Export actions
export const { logout, clearError, clearSuccess } = authSlice.actions

// Export reducer
export default authSlice.reducer