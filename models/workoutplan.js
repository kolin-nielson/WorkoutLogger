const mongoose = require('mongoose');

const WorkoutDaySchema = new mongoose.Schema({
  dayName: {
    type: String,
    required: true
  },
  exercises: [String]
});

const WorkoutPlanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  splitName: {
    type: String,
    required: true,
    trim: true
  },
  workoutDays: [WorkoutDaySchema]
}, {
  timestamps: true
});

module.exports = mongoose.model('WorkoutPlan', WorkoutPlanSchema);
