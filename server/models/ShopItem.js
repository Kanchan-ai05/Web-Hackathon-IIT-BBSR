const mongoose = require('mongoose');

const ShopItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
      maxlength: 80
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: 250
    },
    cost: {
      type: Number,
      required: true,
      min: 1
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
    effectDescription: {
      type: String,
      default: ''
    },
    statBonus: {
      stat: {
        type: String,
        enum: ['strength', 'intellect', 'discipline', 'creativity', null],
        default: null
      },
      amount: {
        type: Number,
        default: 0
      }
    },
    themeId: {
      type: String,
      default: null
    },
    gearSlot: {
      type: String,
      enum: ['weapon', 'hat', 'pet', 'badge', null],
      default: null
    },
    isCustom: {
      type: Boolean,
      default: false
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null // null indicates system default item available to all heroes
    }
  },
  {
    timestamps: true
  }
);

ShopItemSchema.index({ creator: 1, isCustom: 1 });

module.exports = mongoose.model('ShopItem', ShopItemSchema);
