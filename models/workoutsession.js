const mongoose = require('mongoose');

const ExerciseDetailSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  sets: { type: Number, required: true, min: 1 },
  reps: { type: Number, required: true, min: 1 },
  weight: { type: Number, required: true, min: 0 },
});

const WorkoutSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: { type: Date, default: Date.now, required: true },
  totalTime: { type: Number, required: true, min: 0 },
  workoutDayName: { type: String, required: true, trim: true },
  exercises: [ExerciseDetailSchema],
}, {
  timestamps: true,
});

module.exports = mongoose.model('WorkoutSession', WorkoutSessionSchema);
