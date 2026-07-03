// 1. Import all libraries
const express = require('express')
const dotenv = require('dotenv')
const cors = require('cors')
const morgan = require('morgan')
const path = require('path')
const connectDB = require('./config/db')

// 2. Load environment variables
dotenv.config()

// 3. Connect to MongoDB
connectDB()

// 4. Create express app
const app = express()

// 5. Middlewares
app.use(cors())
app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// 6. Test route
app.get('/', (req, res) => {
  res.json({ message: 'TeamSphere API is running!' })
})

// 7. Start server
const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`TeamSphere server running on port ${PORT}`)
})