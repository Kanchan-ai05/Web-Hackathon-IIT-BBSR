const mongoose = require('mongoose');

const InventorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    icon: {
      type: String,
      default: 'Sparkles'
    },
    category: {
      type: String,
      enum: ['potion', 'gear', 'pet', 'theme', 'badge', 'scroll', 'custom_reward'],
      default: 'custom_reward'
    },
    cost: {
      type: Number,
      default: 0
    },
    statBonus: {
      stat: { type: String, default: null },
      amount: { type: Number, default: 0 }
    },
    themeId: {
      type: String,
      default: null
    },
    gearSlot: {
      type: String,
      default: null
    },
    equipped: {
      type: Boolean,
      default: false
    },
    isCustom: {
      type: Boolean,
      default: false
    },
    acquiredAt: {
      type: Date,
      default: Date.now
    },
    used: {
      type: Boolean,
      default: false
    },
    usedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

InventorySchema.index({ user: 1, used: 1 });
InventorySchema.index({ user: 1, equipped: 1 });

module.exports = mongoose.model('Inventory', InventorySchema);
