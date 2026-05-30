const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const connectDB = require('./config/db')
const authRoutes = require('./routes/authRoutes')
const attendanceRoutes =
  require('./routes/attendanceRoutes')

dotenv.config()

connectDB()

const app = express()

app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://your-frontend.vercel.app"
  ],
  credentials:true
}))


app.use(cors())
app.use(express.json())
app.use('/api/auth', authRoutes)
app.use('/api/attendance', attendanceRoutes)

app.get('/', (req, res) => {
  res.send('Attendance API Working Successfully')
})

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`)
  console.log(`API Endpoint: http://localhost:${PORT}/`)
})