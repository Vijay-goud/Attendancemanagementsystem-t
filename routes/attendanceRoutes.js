const express = require('express')
const router  = express.Router()

const protect   = require('../middleware/authMiddleware')
const authorize = require('../middleware/roleMiddleware')

const {
  markAttendance,
  getMyAttendance,
  getAttendanceSummary,
  getAllAttendance,
  updateAttendance,
} = require('../controllers/attendanceController')

const {
  getAdminStats,
  getCalendarData,
  getEmployeeSummary,
  getAllEmployees,
  createEmployee,
  deleteEmployee,
  changeEmployeePassword,
  editEmployee,
  getEmployeeById
} = require('../controllers/adminController')

// ── Employee routes
router.post('/',        protect, markAttendance)
router.get('/my',       protect, getMyAttendance)
router.get('/summary',  protect, getAttendanceSummary)

// ── Admin: stats & reporting (branch-aware via ?branch=)
router.get('/all',                    protect, authorize('admin'), getAllAttendance)
router.get('/admin/stats',            protect, authorize('admin'), getAdminStats)
router.get('/admin/calendar',         protect, authorize('admin'), getCalendarData)
router.get('/admin/employee-summary', protect, authorize('admin'), getEmployeeSummary)
router.put('/:id',                    protect, authorize('admin'), updateAttendance)

// ── Admin: employee management
router.get   ('/admin/employees',              protect, authorize('admin'), getAllEmployees)
router.post  ('/admin/employees',              protect, authorize('admin'), createEmployee)
router.delete('/admin/employees/:id',          protect, authorize('admin'), deleteEmployee)
router.put   ('/admin/employees/:id/password', protect, authorize('admin'), changeEmployeePassword)
router.put   ('/admin/employees/:id',          protect, authorize('admin'), editEmployee)
router.get   ('/admin/employees/:id',          protect, authorize('admin'), getEmployeeById)

module.exports = router
