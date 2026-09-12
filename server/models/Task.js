const mongoose = require('mongoose');

const SubTaskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  completed: { type: Boolean, default: false },
  completedAt: { type: Date, default: null }
});

const TaskSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: [true, 'Quest title is required'],
      trim: true,
      maxlength: [140, 'Title cannot exceed 140 characters']
    },
    category: {
      type: String,
      trim: true,
      default: 'Gym' // 'Coding' | 'Gym' | 'Study' | 'Art'
    },
    difficulty: {
      type: String,
      enum: ['trivial', 'easy', 'medium', 'hard', 'epic'],
      default: 'medium'
    },
    attribute: {
      type: String,
      enum: ['strength', 'intellect', 'discipline', 'creativity', 'intelligence', 'vitality', 'agility'],
      default: 'strength'
    },
    xpReward: {
      type: Number,
      required: true,
      min: 5
    },
    goldReward: {
      type: Number,
      required: true,
      min: 1
    },
    completed: {
      type: Boolean,
      default: false,
      index: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    completedAt: {
      type: Date,
      default: null
    },
    questType: {
      type: String,
      enum: ['todo', 'daily', 'boss'],
      default: 'todo'
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    streak: {
      type: Number,
      default: 0
    },
    completedDates: [{ type: Date }],
    bossName: {
      type: String,
      default: 'Dungeon Fiend'
    },
    bossHp: {
      type: Number,
      default: 100
    },
    bossMaxHp: {
      type: Number,
      default: 100
    },
    subTasks: [SubTaskSchema],
    dueDate: {
      type: Date
    }
  }
);

TaskSchema.virtual('hero')
  .get(function () {
    return this.user;
  })
  .set(function (val) {
    this.user = val;
  });

TaskSchema.set('toJSON', { virtuals: true });
TaskSchema.set('toObject', { virtuals: true });

TaskSchema.index({ user: 1, completed: 1, questType: 1 });

module.exports = mongoose.model('Task', TaskSchema);
