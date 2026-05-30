const User = require('../models/User')
const Attendance = require('../models/Attendance')
const bcrypt = require('bcryptjs')

// ── GET /attendance/admin/stats?branch=hyderabad
const getAdminStats = async (req, res) => {
  try {
    const { branch } = req.query
    const filter = branch ? { role: 'employee', branch } : { role: 'employee' }

    const totalEmployees = await User.countDocuments(filter)

    const today = new Date()
    const startOfDay = new Date(today.setHours(0, 0, 0, 0))
    const endOfDay   = new Date(today.setHours(23, 59, 59, 999))

    const employeeIds = (await User.find(filter).select('_id')).map(u => u._id)

    const todayRecords = await Attendance.find({
      employeeId: { $in: employeeIds },
      date: { $gte: startOfDay, $lt: endOfDay },
    })

    const presentToday = todayRecords.filter(
      r => r.status === 'FULL_DAY' || r.status === 'HALF_DAY'
    ).length

    const absentToday = todayRecords.filter(r => r.status === 'ABSENT').length
    const notMarked   = totalEmployees - todayRecords.length

    res.status(200).json({ totalEmployees, presentToday, absentToday, notMarked })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// ── GET /attendance/admin/calendar?year=&month=&branch=
const getCalendarData = async (req, res) => {
  try {
    const { year, month, branch } = req.query
    const y = parseInt(year)  || new Date().getFullYear()
    const m = parseInt(month) || new Date().getMonth()

    const startDate = new Date(y, m, 1)
    const endDate   = new Date(y, m + 1, 0, 23, 59, 59, 999)

    const empFilter = branch ? { role: 'employee', branch } : { role: 'employee' }
    const employeeIds = (await User.find(empFilter).select('_id')).map(u => u._id)

    const records = await Attendance.find({
      employeeId: { $in: employeeIds },
      date: { $gte: startDate, $lte: endDate },
    })

    const calendarMap = {}
    records.forEach(record => {
      const dateKey = new Date(record.date).toISOString().split('T')[0]
      if (!calendarMap[dateKey]) calendarMap[dateKey] = { present: 0, absent: 0 }
      if (record.status === 'FULL_DAY' || record.status === 'HALF_DAY') {
        calendarMap[dateKey].present += 1
      } else if (record.status === 'ABSENT') {
        calendarMap[dateKey].absent += 1
      }
    })

    res.status(200).json(calendarMap)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// ── GET /attendance/admin/employee-summary?branch=
const getEmployeeSummary = async (req, res) => {
  try {
    const { branch } = req.query
    const filter = branch
      ? { role: 'employee', branch }
      : { role: 'employee' }

    const employees = await User.find(filter).select(
      'firstName lastName username email branch'
    )

    const summaries = await Promise.all(
      employees.map(async emp => {
        const records = await Attendance.find({ employeeId: emp._id })
        const fullDay     = records.filter(r => r.status === 'FULL_DAY').length
        const halfDay     = records.filter(r => r.status === 'HALF_DAY').length
        const absent      = records.filter(r => r.status === 'ABSENT').length
        const totalPresent = fullDay + halfDay
        return {
          _id: emp._id,
          firstName: emp.firstName,
          lastName: emp.lastName,
          username: emp.username,
          email: emp.email,
          branch: emp.branch,
          fullDay, halfDay, absent,
          totalPresent,
          totalMarked: records.length,
        }
      })
    )

    res.status(200).json(summaries)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// ── GET /attendance/admin/employees?branch=
const getAllEmployees = async (req, res) => {
  try {
    const { branch } = req.query
    const filter = branch ? { branch } : {}
    const employees = await User.find(filter)
      .select('-password')
      .sort({ branch: 1, firstName: 1 })
    res.status(200).json(employees)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// ── POST /attendance/admin/employees  (admin creates user)
const createEmployee = async (req, res) => {
  try {
    const { firstName, lastName, email, mobile, username, password, role, branch } = req.body

    const existing = await User.findOne({ $or: [{ email }, { username }] })
    if (existing) {
      return res.status(400).json({ message: 'Email or Username already exists' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await User.create({
      firstName, lastName, email, mobile,
      username, password: hashedPassword, role, branch,
    })

    const { password: _, ...userData } = user.toObject()
    res.status(201).json({ message: 'User created successfully', user: userData })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// ── DELETE /attendance/admin/employees/:id
const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params
    const user = await User.findById(id)
    if (!user) return res.status(404).json({ message: 'User not found' })

    // Prevent deleting yourself
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({ message: 'You cannot delete your own account' })
    }

    await User.findByIdAndDelete(id)
    await Attendance.deleteMany({ employeeId: id })

    res.status(200).json({ message: 'User and their attendance records deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// ── PUT /attendance/admin/employees/:id/password
const changeEmployeePassword = async (req, res) => {
  try {
    const { id } = req.params
    const { newPassword } = req.body

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)
    await User.findByIdAndUpdate(id, { password: hashedPassword })

    res.status(200).json({ message: 'Password updated successfully' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const editEmployee = async (req, res) => {
  try{
    const { id } = req.params
    const { firstName, lastName, email, mobile, username, role, branch } = req.body
    const user = await User.findById(id)
    if (!user) {
      return res.status(404).json({ message: 'Employee not found' })
    }
    const existing = await User.findOne({ _id: { $ne: id }, $or: [{ email }, { username }] })

    if (existing) {
      return res.status(400).json({ message: 'Email or Username already exists' })
    }
    const updatedUser = await User.findByIdAndUpdate(id, {  
      firstName, lastName, email, mobile, username, role, branch
    }, { new: true }).select('-password')
    res.status(200).json({ message: 'Employee updated successfully', user: updatedUser })

  }catch(error){
    res.status(500).json({ message: error.message })
  }
}
const getEmployeeById = async (req, res) => {
  try {
    const employee = await User.findById(req.params.id)
      .select('-password')

    if (!employee) {
      return res.status(404).json({
        message: 'Employee not found',
      })
    }

    res.status(200).json(employee)

  } catch (error) {
    res.status(500).json({
      message: error.message,
    })
  }
}
module.exports = {
  getAdminStats,
  getCalendarData,
  getEmployeeSummary,
  getAllEmployees,
  createEmployee,
  deleteEmployee,
  changeEmployeePassword,
  editEmployee,
  getEmployeeById,
}
