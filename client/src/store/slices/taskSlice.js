import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import API from '../../api/axios'

// ─────────────────────────────────────────
// ASYNC THUNKS
// ─────────────────────────────────────────

// Get all tasks for a project (grouped by status)
export const fetchTasks = createAsyncThunk(
  'tasks/fetchAll',
  async (projectId, { rejectWithValue }) => {
    try {
      const { data } = await API.get(`/projects/${projectId}/tasks`)
      return data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch tasks'
      )
    }
  }
)

// Create a new task
export const createTask = createAsyncThunk(
  'tasks/create',
  async ({ projectId, taskData }, { rejectWithValue }) => {
    try {
      const { data } = await API.post(
        `/projects/${projectId}/tasks`,
        taskData
      )
      return data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to create task'
      )
    }
  }
)

// Move task (drag and drop)
export const moveTask = createAsyncThunk(
  'tasks/move',
  async ({ projectId, taskId, newStatus, newPosition }, { rejectWithValue }) => {
    try {
      const { data } = await API.put(
        `/projects/${projectId}/tasks/${taskId}/move`,
        { newStatus, newPosition }
      )
      return { taskId, newStatus, newPosition, task: data.task }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to move task'
      )
    }
  }
)

// Delete a task
export const deleteTask = createAsyncThunk(
  'tasks/delete',
  async ({ projectId, taskId }, { rejectWithValue }) => {
    try {
      await API.delete(`/projects/${projectId}/tasks/${taskId}`)
      return taskId
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete task'
      )
    }
  }
)

// ─────────────────────────────────────────
// INITIAL STATE
// tasks is an object with 4 columns
// each column is an array of tasks
// ─────────────────────────────────────────
const initialState = {
  tasks: {
    todo: [],
    in_progress: [],
    in_review: [],
    done: [],
  },
  loading: false,
  error: null,
  success: false,
}

// ─────────────────────────────────────────
// SLICE
// ─────────────────────────────────────────
const taskSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    clearTaskError: (state) => {
      state.error = null
    },

    // This handles drag and drop INSTANTLY on the UI
    // before the backend confirms — makes it feel fast
    moveTaskLocally: (state, action) => {
      const { taskId, sourceStatus, destStatus, sourceIndex, destIndex } =
        action.payload

      // Find the task in source column
      const sourceColumn = state.tasks[sourceStatus]
      const taskIndex = sourceColumn.findIndex((t) => t._id === taskId)
      if (taskIndex === -1) return

      // Remove from source column
      const [movedTask] = sourceColumn.splice(taskIndex, 1)

      // Update task status
      movedTask.status = destStatus

      // Insert into destination column at new position
      state.tasks[destStatus].splice(destIndex, 0, movedTask)
    },
  },

  extraReducers: (builder) => {
    builder
      // ── FETCH TASKS ──
      .addCase(fetchTasks.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.loading = false
        state.tasks = action.payload
        // action.payload is already grouped:
        // { todo: [...], in_progress: [...], in_review: [...], done: [...] }
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // ── CREATE TASK ──
      .addCase(createTask.pending, (state) => {
        state.loading = true
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.loading = false
        state.success = true
        // New task always goes to todo column
        state.tasks.todo.push(action.payload)
      })
      .addCase(createTask.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // ── DELETE TASK ──
      .addCase(deleteTask.fulfilled, (state, action) => {
        const taskId = action.payload
        // Remove task from whichever column it's in
        Object.keys(state.tasks).forEach((status) => {
          state.tasks[status] = state.tasks[status].filter(
            (t) => t._id !== taskId
          )
        })
      })
  },
})

export const { clearTaskError, moveTaskLocally } = taskSlice.actions
export default taskSlice.reducer