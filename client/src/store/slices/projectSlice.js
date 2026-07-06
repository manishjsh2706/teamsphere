import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import API from '../../api/axios'

// ─────────────────────────────────────────
// ASYNC THUNKS
// ─────────────────────────────────────────

// Get all projects for logged in user
export const fetchProjects = createAsyncThunk(
  'projects/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await API.get('/projects')
      return data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch projects'
      )
    }
  }
)

// Create a new project
export const createProject = createAsyncThunk(
  'projects/create',
  async (projectData, { rejectWithValue }) => {
    try {
      const { data } = await API.post('/projects', projectData)
      return data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to create project'
      )
    }
  }
)

// Get single project by ID
export const fetchProjectById = createAsyncThunk(
  'projects/fetchById',
  async (projectId, { rejectWithValue }) => {
    try {
      const { data } = await API.get(`/projects/${projectId}`)
      return data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch project'
      )
    }
  }
)

// Add member to project
export const addMember = createAsyncThunk(
  'projects/addMember',
  async ({ projectId, email, role }, { rejectWithValue }) => {
    try {
      const { data } = await API.post(
        `/projects/${projectId}/members`,
        { email, role }
      )
      return data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to add member'
      )
    }
  }
)

// ─────────────────────────────────────────
// INITIAL STATE
// ─────────────────────────────────────────
const initialState = {
  projects: [],          // list of all projects
  currentProject: null,  // project currently being viewed
  loading: false,
  error: null,
  success: false,
}

// ─────────────────────────────────────────
// SLICE
// ─────────────────────────────────────────
const projectSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    clearProjectError: (state) => {
      state.error = null
    },
    clearProjectSuccess: (state) => {
      state.success = false
    },
    clearCurrentProject: (state) => {
      state.currentProject = null
    },
  },
  extraReducers: (builder) => {
    builder
      // ── FETCH ALL PROJECTS ──
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading = false
        state.projects = action.payload
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // ── CREATE PROJECT ──
      .addCase(createProject.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.loading = false
        state.success = true
        // Add new project to the beginning of the list
        state.projects.unshift(action.payload)
      })
      .addCase(createProject.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // ── FETCH PROJECT BY ID ──
      .addCase(fetchProjectById.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchProjectById.fulfilled, (state, action) => {
        state.loading = false
        state.currentProject = action.payload
      })
      .addCase(fetchProjectById.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // ── ADD MEMBER ──
      .addCase(addMember.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(addMember.fulfilled, (state, action) => {
        state.loading = false
        state.success = true
        state.currentProject = action.payload
      })
      .addCase(addMember.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export const {
  clearProjectError,
  clearProjectSuccess,
  clearCurrentProject,
} = projectSlice.actions

export default projectSlice.reducer