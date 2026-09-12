const ShopItem = require('../models/ShopItem');
const User = require('../models/User');
const Inventory = require('../models/Inventory');
const { processXpGain } = require('../utils/rpgEngine');

/**
 * Fetch Guild Armory items and User custom rewards
 */
const getShopItems = async (req, res, next) => {
  try {
    const items = await ShopItem.find({
      $or: [{ isCustom: false }, { isCustom: true, creator: req.user._id }]
    }).sort({ isCustom: 1, cost: 1 });

    res.status(200).json({
      success: true,
      items
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Purchase item from Armory
 * Deducts gold, grants item / stats / theme, and persists in MongoDB
 */
const purchaseItem = async (req, res, next) => {
  try {
    const { itemId } = req.body;
    const user = await User.findById(req.user._id);

    const item = await ShopItem.findById(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in Guild Armory.'
      });
    }

    if (user.gold < item.cost) {
      return res.status(400).json({
        success: false,
        message: `Insufficient Gold! Requires ${item.cost} Gold, but you have ${user.gold} Gold.`
      });
    }

    // Deduct Gold immediately
    user.gold -= item.cost;

    let levelUpData = null;
    let extraMessage = '';
    let shouldEquip = false;

    // 1. Potions (Consumables)
    if (item.category === 'potion') {
      let bonusXp = 25;
      if (item.name.includes('Vitality')) bonusXp = 25;
      else if (item.name.includes('Mind')) bonusXp = 40;
      else if (item.name.includes('Dragon')) bonusXp = 100;

      const levelResult = processXpGain(user, bonusXp, 0);
      user.level = levelResult.newLevel;
      user.xp = levelResult.xp;
      user.maxXp = levelResult.maxXp;
      user.stats = levelResult.stats;
      user.titles = levelResult.titles;

      extraMessage = ` Consumed potion for +${bonusXp} XP!`;
      levelUpData = {
        leveledUp: levelResult.leveledUp,
        levelsGained: levelResult.levelsGained,
        newLevel: levelResult.newLevel,
        bonusGold: levelResult.totalBonusGold,
        newlyUnlockedTitles: levelResult.newlyUnlockedTitles
      };
    }
    // 2. Realm Themes (Castle Theme, Night Theme)
    else if (item.category === 'theme' || item.themeId) {
      const themeId = item.themeId || (item.name.includes('Castle') ? 'castle-theme' : 'night-theme');
      user.equippedTheme = themeId;
      shouldEquip = true;
      extraMessage = ` Equipped realm theme: ${item.name}!`;

      // Mark any other themes in user inventory as unequipped
      await Inventory.updateMany(
        { user: user._id, category: 'theme' },
        { $set: { equipped: false } }
      );
    }
    // 3. Gear / Pets / Badges (Golden Sword, Wizard Hat, Crystal Pet, Achievement Badges)
    else if (item.category === 'gear' || item.category === 'pet' || item.category === 'badge') {
      shouldEquip = true;
      user.equippedGear = user.equippedGear || {};

      // Determine slot
      let slot = item.gearSlot;
      if (!slot) {
        if (item.name.includes('Sword')) slot = 'weapon';
        else if (item.name.includes('Hat')) slot = 'hat';
        else if (item.name.includes('Pet')) slot = 'pet';
        else if (item.name.includes('Badge')) slot = 'badge';
        else slot = item.category;
      }

      // Unequip existing item in that slot if any
      if (slot && user.equippedGear[slot]) {
        const prevEquipped = await Inventory.findOne({
          user: user._id,
          name: user.equippedGear[slot],
          equipped: true
        });
        if (prevEquipped && prevEquipped.statBonus?.stat) {
          user.stats[prevEquipped.statBonus.stat] = Math.max(
            10,
            (user.stats[prevEquipped.statBonus.stat] || 10) - (prevEquipped.statBonus.amount || 0)
          );
          prevEquipped.equipped = false;
          await prevEquipped.save();
        }
      }

      // Determine stat bonuses
      const statBonus = item.statBonus || {};
      if (item.name.includes('Sword') && !statBonus.stat) {
        statBonus.stat = 'strength';
        statBonus.amount = 5;
      } else if (item.name.includes('Hat') && !statBonus.stat) {
        statBonus.stat = 'intellect';
        statBonus.amount = 5;
      } else if (item.name.includes('Pet') && !statBonus.stat) {
        statBonus.stat = 'creativity';
        statBonus.amount = 5;
      } else if (item.name.includes('Badge') && !statBonus.stat) {
        statBonus.stat = 'discipline';
        statBonus.amount = 5;
      }

      if (statBonus.stat && statBonus.amount) {
        user.stats[statBonus.stat] = Number(
          ((user.stats[statBonus.stat] || 10) + statBonus.amount).toFixed(1)
        );
      }

      if (slot) {
        user.equippedGear[slot] = item.name;
      }

      if (item.name.includes('Badge')) {
        const titleName = 'Grandmaster Achiever';
        if (!user.titles.includes(titleName)) {
          user.titles.push(titleName);
          user.title = titleName;
        }
      }

      extraMessage = ` Equipped to your hero! (+${statBonus.amount || 0} ${statBonus.stat?.toUpperCase() || ''})`;
    }

    // Persist in standalone Inventory collection in MongoDB
    const inventoryRecord = await Inventory.create({
      user: user._id,
      name: item.name,
      description: item.description,
      icon: item.icon,
      category: item.category,
      cost: item.cost,
      gearSlot: item.gearSlot || (item.name.includes('Sword') ? 'weapon' : item.name.includes('Hat') ? 'hat' : item.name.includes('Pet') ? 'pet' : item.name.includes('Badge') ? 'badge' : null),
      statBonus: item.statBonus || (item.name.includes('Sword') ? { stat: 'strength', amount: 5 } : item.name.includes('Hat') ? { stat: 'intellect', amount: 5 } : item.name.includes('Pet') ? { stat: 'creativity', amount: 5 } : item.name.includes('Badge') ? { stat: 'discipline', amount: 5 } : { stat: null, amount: 0 }),
      themeId: item.themeId || (item.name.includes('Castle') ? 'castle-theme' : item.name.includes('Night') ? 'night-theme' : null),
      equipped: shouldEquip,
      isCustom: item.isCustom,
      acquiredAt: new Date(),
      used: item.category === 'potion',
      usedAt: item.category === 'potion' ? new Date() : null
    });

    await user.save();

    res.status(200).json({
      success: true,
      message: `Purchased "${item.name}" for ${item.cost} Gold!${extraMessage}`,
      user: user.toSafeJSON(),
      hero: user.toSafeJSON(),
      item: inventoryRecord,
      levelUpData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Forge custom real-world reward scroll
 */
const createCustomReward = async (req, res, next) => {
  try {
    const { name, description = '', cost, icon = 'Sparkles' } = req.body;

    if (!name || !cost) {
      return res.status(400).json({
        success: false,
        message: 'Reward name and gold cost are required.'
      });
    }

    const reward = await ShopItem.create({
      name: name.trim(),
      description: description.trim(),
      cost: Number(cost),
      icon,
      category: 'custom_reward',
      effectDescription: 'Real-world reward voucher.',
      isCustom: true,
      creator: req.user._id
    });

    res.status(201).json({
      success: true,
      message: `Custom reward "${reward.name}" added to your Armory!`,
      reward
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete custom reward
 */
const deleteCustomReward = async (req, res, next) => {
  try {
    const { id } = req.params;
    const reward = await ShopItem.findOneAndDelete({
      _id: id,
      isCustom: true,
      creator: req.user._id
    });

    if (!reward) {
      return res.status(404).json({ success: false, message: 'Reward not found.' });
    }

    res.status(200).json({ success: true, message: 'Reward removed.' });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's inventory
 */
const getUserInventory = async (req, res, next) => {
  try {
    const items = await Inventory.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, inventory: items });
  } catch (error) {
    next(error);
  }
};

/**
 * Redeem inventory voucher
 */
const redeemInventoryItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const invItem = await Inventory.findOne({ _id: itemId, user: req.user._id });

    if (!invItem) {
      return res.status(404).json({ success: false, message: 'Inventory item not found.' });
    }

    if (invItem.used) {
      return res.status(400).json({
        success: false,
        message: 'This reward scroll has already been redeemed!'
      });
    }

    invItem.used = true;
    invItem.usedAt = new Date();
    await invItem.save();

    res.status(200).json({
      success: true,
      message: `🎉 Enjoy your reward: "${invItem.name}"! Well earned, Hero!`,
      item: invItem
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Equip / Unequip item in Inventory
 */
const equipInventoryItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const user = await User.findById(req.user._id);
    const item = await Inventory.findOne({ _id: itemId, user: user._id });

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found in inventory.' });
    }

    user.equippedGear = user.equippedGear || {};

    // 1. Theme items (Castle Theme, Night Theme, etc.)
    if (item.category === 'theme' || item.themeId) {
      const targetTheme = item.themeId || (item.name.includes('Castle') ? 'castle-theme' : 'night-theme');
      user.equippedTheme = targetTheme;
      item.equipped = true;

      // Unequip any other themes in inventory
      await Inventory.updateMany(
        { user: user._id, category: 'theme', _id: { $ne: item._id } },
        { $set: { equipped: false } }
      );
      await item.save();
      await user.save();

      const allItems = await Inventory.find({ user: user._id }).sort({ createdAt: -1 });
      return res.status(200).json({
        success: true,
        message: `Equipped ${item.name}! Realm transformed.`,
        user: user.toSafeJSON(),
        hero: user.toSafeJSON(),
        inventory: allItems
      });
    }

    // 2. Gear, Pet, Badge items
    const slot = item.gearSlot || (item.name.includes('Sword') ? 'weapon' : item.name.includes('Hat') ? 'hat' : item.name.includes('Pet') ? 'pet' : item.name.includes('Badge') ? 'badge' : item.category);

    if (item.equipped) {
      // Unequip item
      item.equipped = false;
      if (slot && user.equippedGear[slot] === item.name) {
        user.equippedGear[slot] = null;
      }
      // Deduct stat bonus
      if (item.statBonus?.stat && item.statBonus?.amount) {
        user.stats[item.statBonus.stat] = Math.max(
          10,
          Number(((user.stats[item.statBonus.stat] || 10) - item.statBonus.amount).toFixed(1))
        );
      }
    } else {
      // Equip item
      // If another item is equipped in this slot, unequip it first
      if (slot) {
        const prevEquipped = await Inventory.findOne({
          user: user._id,
          gearSlot: slot,
          equipped: true,
          _id: { $ne: item._id }
        });
        if (prevEquipped) {
          prevEquipped.equipped = false;
          if (prevEquipped.statBonus?.stat && prevEquipped.statBonus?.amount) {
            user.stats[prevEquipped.statBonus.stat] = Math.max(
              10,
              Number(((user.stats[prevEquipped.statBonus.stat] || 10) - prevEquipped.statBonus.amount).toFixed(1))
            );
          }
          await prevEquipped.save();
        }
        user.equippedGear[slot] = item.name;
      }

      item.equipped = true;
      if (item.statBonus?.stat && item.statBonus?.amount) {
        user.stats[item.statBonus.stat] = Number(
          ((user.stats[item.statBonus.stat] || 10) + item.statBonus.amount).toFixed(1)
        );
      }
    }

    await item.save();
    await user.save();

    const allItems = await Inventory.find({ user: user._id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: item.equipped ? `Equipped ${item.name}!` : `Unequipped ${item.name}.`,
      user: user.toSafeJSON(),
      hero: user.toSafeJSON(),
      inventory: allItems
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getShopItems,
  purchaseItem,
  equipInventoryItem,
  createCustomReward,
  deleteCustomReward,
  getUserInventory,
  redeemInventoryItem
};
