const ShopItem = require('../models/ShopItem');

const DEFAULT_SHOP_ITEMS = [
  {
    name: 'Golden Sword',
    description: 'A radiant blade forged from celestial gold and sunstones. Grants tremendous physical power.',
    cost: 150,
    icon: 'Sword',
    category: 'gear',
    gearSlot: 'weapon',
    statBonus: { stat: 'strength', amount: 5 },
    effectDescription: 'Equipable Weapon: +5 Strength attribute',
    isCustom: false,
    creator: null
  },
  {
    name: 'Wizard Hat',
    description: 'An astral-woven pointed hat embroidered with arcane logic glyphs. Expands the mind.',
    cost: 180,
    icon: 'Sparkles',
    category: 'gear',
    gearSlot: 'hat',
    statBonus: { stat: 'intellect', amount: 5 },
    effectDescription: 'Equipable Headgear: +5 Intellect attribute',
    isCustom: false,
    creator: null
  },
  {
    name: 'Crystal Pet',
    description: 'A sentient familiar composed of floating prismatic crystals. Inspires artistic genius.',
    cost: 250,
    icon: 'Cat',
    category: 'pet',
    gearSlot: 'pet',
    statBonus: { stat: 'creativity', amount: 5 },
    effectDescription: 'Legendary Companion: +5 Creativity attribute',
    isCustom: false,
    creator: null
  },
  {
    name: 'Castle Theme',
    description: 'Decorates the realm in regal stone ramparts, heraldic banners, and gold filigree.',
    cost: 200,
    icon: 'Shield',
    category: 'theme',
    themeId: 'castle-theme',
    effectDescription: 'Realm Theme: Unlocks & equips the Castle Fortress aesthetic',
    isCustom: false,
    creator: null
  },
  {
    name: 'Night Theme',
    description: 'Envelops the realm in midnight indigo skies, glowing constellations, and starry starlight.',
    cost: 200,
    icon: 'Moon',
    category: 'theme',
    themeId: 'night-theme',
    effectDescription: 'Realm Theme: Unlocks & equips the Midnight Cosmic Night aesthetic',
    isCustom: false,
    creator: null
  },
  {
    name: 'Achievement Badges',
    description: 'Prestigious medals struck by the Guild Council to honor disciplined adventurers.',
    cost: 120,
    icon: 'Award',
    category: 'badge',
    gearSlot: 'badge',
    statBonus: { stat: 'discipline', amount: 5 },
    effectDescription: 'Honorary Crest: +5 Discipline attribute & Grandmaster title',
    isCustom: false,
    creator: null
  },
  {
    name: 'Potion of Vitality',
    description: 'A crimson draught brewed from rare mountain herbs. Instantly boosts spirit.',
    cost: 30,
    icon: 'FlaskConical',
    category: 'potion',
    effectDescription: 'Consumable: +25 bonus Hero XP upon drinking',
    isCustom: false,
    creator: null
  },
  {
    name: 'Elixir of Mind Focus',
    description: 'A glowing sapphire tonic that clears mental fog and sharpens intellect.',
    cost: 45,
    icon: 'Sparkles',
    category: 'potion',
    effectDescription: 'Consumable: +40 bonus Hero XP upon drinking',
    isCustom: false,
    creator: null
  },
  {
    name: 'Dragon Draught',
    description: 'A bubbling golden flask distilled from dragon embers. Massive surge of vitality.',
    cost: 100,
    icon: 'Flame',
    category: 'potion',
    effectDescription: 'Consumable: +100 bonus Hero XP upon drinking',
    isCustom: false,
    creator: null
  }
];

const seedDefaultShopItems = async () => {
  try {
    for (const item of DEFAULT_SHOP_ITEMS) {
      await ShopItem.findOneAndUpdate(
        { name: item.name, isCustom: false },
        { $set: item },
        { upsert: true, new: true }
      );
    }
    console.log('⚔️  Guild Armory items initialized successfully.');
  } catch (error) {
    console.error('Failed to seed Guild Armory items:', error.message);
  }
};

module.exports = { seedDefaultShopItems, DEFAULT_SHOP_ITEMS };
