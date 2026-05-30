const express = require('express')
const router = express.Router()
const protect = require('../middleware/authMiddleware')
const authorize = require('../middleware/roleMiddleware')


console.log('About to require authController...')
const authCtrl = require('../controllers/authController')
// console.log('authCtrl:', authCtrl)

const { loginUser } = authCtrl
// console.log('loginUser:', loginUser)

router.post('/login', loginUser)
// const {registerUser, loginUser} = require('../controllers/authController')

// router.post('/register', registerUser)
// router.post('/login', loginUser)
router.get('/profile', protect, (req, res) => {
  res.status(200).json({
    message: 'Protected Route Accessed',
    user: req.user,
  })
})
router.get(
  '/admin',
  protect,
  authorize('admin'),
  (req, res) => {
    res.status(200).json({
      message: 'Welcome Admin',
    })
  },
)

module.exports = router