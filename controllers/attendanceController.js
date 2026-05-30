const Attendance = require('../models/Attendance')

const markAttendance = async (req, res) => {
  try {
    const {status} = req.body

    const today = new Date()

    const existingAttendance =
      await Attendance.findOne({
        employeeId: req.user.id,
        date: {
          $gte: new Date(today.setHours(0, 0, 0, 0)),
          $lt: new Date(today.setHours(23, 59, 59, 999)),
        },
      })

    if (existingAttendance) {
      return res.status(400).json({
        message:
          'Attendance already marked for today',
      })
    }

    const attendance = await Attendance.create({
      employeeId: req.user.id,
      date: new Date(),
      status,
    })

    res.status(201).json({
      message: 'Attendance Marked Successfully',
      attendance,
    })
  } catch (error) {
    res.status(500).json({
      message: error.message,
    })
  }
}

const getMyAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.find({
      employeeId: req.user.id,
    }).sort({date: -1})

    res.status(200).json(attendance)
  } catch (error) {
    res.status(500).json({
      message: error.message,
    })
  }
}
const getAttendanceSummary = async (req, res) => {
  try {
    const attendance = await Attendance.find({
      employeeId: req.user.id,
    })

    const summary = {
      fullDay: 0,
      halfDay: 0,
      absent: 0,
    }

    attendance.forEach(item => {
      if (item.status === 'FULL_DAY') {
        summary.fullDay += 1
      } else if (item.status === 'HALF_DAY') {
        summary.halfDay += 1
      } else if (item.status === 'ABSENT') {
        summary.absent += 1
      }
    })

    res.status(200).json(summary)
  } catch (error) {
    res.status(500).json({
      message: error.message,
    })
  }
}

const getAllAttendance = async (req, res) => {
  try {
    const attendance =
      await Attendance.find()
        .populate(
          'employeeId',
          'firstName lastName username role',
        )
        .sort({date: -1})

    res.status(200).json(attendance)
  } catch (error) {
    res.status(500).json({
      message: error.message,
    })
  }
}
const updateAttendance = async (req, res) => {
  try {
    const {id} = req.params
    const {status} = req.body

    const attendance = await Attendance.findById(id)

    if (!attendance) {
      return res
        .status(404)
        .json({message: 'Attendance not found'})
    }

    attendance.status = status
    await attendance.save()

    res.status(200).json({
      message: 'Attendance updated successfully',
      attendance,
    })
  } catch (error) {
    res.status(500).json({
      message: error.message,
    })
  }
}
module.exports = {
  markAttendance,
  getMyAttendance,
  getAttendanceSummary,
  getAllAttendance,
  updateAttendance,
}