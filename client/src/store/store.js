import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'

// The store is the single source of truth
// It holds all the state of our application
const store = configureStore({
  reducer: {
    // Each key here is a "slice" of the global state
    auth: authReducer,
    // We will add more slices here later:
    // projects: projectsReducer,
    // tasks: tasksReducer,
  },
})

export default store