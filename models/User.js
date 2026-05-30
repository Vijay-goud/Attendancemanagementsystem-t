const mongoose = require('mongoose')

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName:  { type: String, required: true, trim: true },
    email:     { type: String, required: true, unique: true },
    mobile:    { type: String, required: true },
    username:  { type: String, required: true, unique: true },
    password:  { type: String, required: true },
    role: {
      type: String,
      enum: ['employee', 'admin'],
      required: true,
    },
    branch: {
      type: String,
      enum: ['hyderabad', 'Bowenpally'],
      required: true,
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model('User', userSchema)
