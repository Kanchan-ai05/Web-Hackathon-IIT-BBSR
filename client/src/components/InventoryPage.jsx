import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Package,
  Shield,
  Sword,
  Sparkles,
  Moon,
  Cat,
  Award,
  FlaskConical,
  Flame,
  BookOpen,
  Check,
  CheckCircle2,
  ShoppingBag,
  Palette,
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSound } from '../context/SoundContext';
import { SkeletonLoader } from './SkeletonLoader';
import api from '../services/api';

const ICON_MAP = {
  Sword,
  Shield,
  Moon,
  Cat,
  Award,
  FlaskConical,
  Flame,
  BookOpen,
  Sparkles
};

export const InventoryPage = ({ onNavigateToShop }) => {
  const { hero, updateHero } = useAuth();
  const { playClick, playQuestComplete, playCoin } = useSound();

  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [actionMessage, setActionMessage] = useState('');
  const [equippingId, setEquippingId] = useState(null);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await api.get('/shop/inventory');
      if (res.data.success) {
        setInventory(res.data.inventory || []);
      }
    } catch (err) {
      console.error('Failed to fetch inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleToggleEquip = async (item) => {
    setEquippingId(item._id);
    playClick();
    try {
      const res = await api.post(`/shop/inventory/${item._id}/equip`);
      if (res.data.success) {
        if (res.data.inventory) {
          setInventory(res.data.inventory);
        }
        if (res.data.hero || res.data.user) {
          updateHero(res.data.hero || res.data.user);
        }
        setActionMessage(res.data.message);
        setTimeout(() => setActionMessage(''), 3500);
      }
    } catch (err) {
      setActionMessage(err.response?.data?.message || 'Failed to equip item.');
      setTimeout(() => setActionMessage(''), 3000);
    } finally {
      setEquippingId(null);
    }
  };

  const handleRedeemVoucher = async (itemId) => {
    playQuestComplete();
    try {
      const res = await api.post(`/shop/inventory/${itemId}/redeem`);
      if (res.data.success) {
        setInventory((prev) =>
          prev.map((i) => (i._id === itemId ? { ...i, used: true, usedAt: new Date() } : i))
        );
        setActionMessage(res.data.message);
        setTimeout(() => setActionMessage(''), 4000);
      }
    } catch (err) {
      console.error('Failed to redeem voucher:', err);
    }
  };

  const filterTabs = [
    { id: 'all', label: 'All Items' },
    { id: 'gear', label: 'Equipment & Weapons' },
    { id: 'pet', label: 'Pets & Familiars' },
    { id: 'theme', label: 'Themes' },
    { id: 'badge', label: 'Badges' },
    { id: 'custom_reward', label: 'Vouchers & Potions' }
  ];

  const filteredItems = inventory.filter((item) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'gear') return item.category === 'gear';
    if (activeFilter === 'pet') return item.category === 'pet';
    if (activeFilter === 'theme') return item.category === 'theme' || !!item.themeId;
    if (activeFilter === 'badge') return item.category === 'badge';
    if (activeFilter === 'custom_reward') return item.isCustom || item.category === 'potion';
    return true;
  });

  const equippedCount = inventory.filter((i) => i.equipped).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-rpg-panel border-2 border-rpg-border p-5 rounded-xl">
        <div>
          <h1 className="text-xl sm:text-2xl font-fantasy font-black tracking-wide text-white flex items-center">
            <Package className="w-6 h-6 mr-2 text-rpg-purple-light" />
            HERO INVENTORY SATCHEL
          </h1>
          <p className="text-xs text-slate-400 font-sans mt-1">
            Manage your weapons, enchanted hats, familiar companions, badges, and realm themes stored in MongoDB.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="bg-rpg-card border border-purple-500/50 px-3.5 py-1.5 rounded-lg text-center">
            <span className="block text-[9px] font-pixel text-slate-400">TOTAL SATCHEL</span>
            <span className="font-pixel text-sm text-rpg-purple-light font-bold">
              {inventory.length} ITEMS
            </span>
          </div>

          <div className="bg-rpg-card border border-emerald-500/50 px-3.5 py-1.5 rounded-lg text-center">
            <span className="block text-[9px] font-pixel text-slate-400">EQUIPPED</span>
            <span className="font-pixel text-sm text-emerald-400 font-bold">
              {equippedCount} ACTIVE
            </span>
          </div>
        </div>
      </div>

      {/* Action Notification Toast */}
      {actionMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-rpg-panel border-2 border-emerald-500 rounded-lg text-center text-xs font-pixel text-emerald-300 shadow-md"
        >
          {actionMessage}
        </motion.div>
      )}

      {/* Equipped Gear Loadout Rack */}
      <div className="bg-rpg-card border-2 border-rpg-border p-4 sm:p-5 rounded-xl">
        <h3 className="font-fantasy font-bold text-sm text-white tracking-wider flex items-center mb-3">
          <Shield className="w-4 h-4 mr-2 text-rpg-gold" />
          CURRENTLY EQUIPPED GEAR & COMPANIONS
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {/* Weapon Slot */}
          <div className="p-2.5 rounded-lg bg-rpg-panel/80 border border-slate-700">
            <span className="block font-pixel text-[9px] text-slate-400 uppercase">WEAPON</span>
            <div className="flex items-center space-x-1.5 mt-1">
              <Sword className="w-3.5 h-3.5 text-rpg-gold" />
              <span className="font-pixel text-[10px] text-white truncate">
                {hero?.equippedGear?.weapon || 'None'}
              </span>
            </div>
            {hero?.equippedGear?.weapon === 'Golden Sword' && (
              <span className="text-[9px] font-pixel text-rose-400 mt-0.5 block">+5 STR</span>
            )}
          </div>

          {/* Hat Slot */}
          <div className="p-2.5 rounded-lg bg-rpg-panel/80 border border-slate-700">
            <span className="block font-pixel text-[9px] text-slate-400 uppercase">HEADWEAR</span>
            <div className="flex items-center space-x-1.5 mt-1">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span className="font-pixel text-[10px] text-white truncate">
                {hero?.equippedGear?.hat || 'None'}
              </span>
            </div>
            {hero?.equippedGear?.hat === 'Wizard Hat' && (
              <span className="text-[9px] font-pixel text-sky-400 mt-0.5 block">+5 INT</span>
            )}
          </div>

          {/* Pet Slot */}
          <div className="p-2.5 rounded-lg bg-rpg-panel/80 border border-slate-700">
            <span className="block font-pixel text-[9px] text-slate-400 uppercase">PET COMPANION</span>
            <div className="flex items-center space-x-1.5 mt-1">
              <Cat className="w-3.5 h-3.5 text-purple-400" />
              <span className="font-pixel text-[10px] text-white truncate">
                {hero?.equippedGear?.pet || 'None'}
              </span>
            </div>
            {hero?.equippedGear?.pet === 'Crystal Pet' && (
              <span className="text-[9px] font-pixel text-purple-400 mt-0.5 block">+5 CREAT</span>
            )}
          </div>

          {/* Badge Slot */}
          <div className="p-2.5 rounded-lg bg-rpg-panel/80 border border-slate-700">
            <span className="block font-pixel text-[9px] text-slate-400 uppercase">BADGE</span>
            <div className="flex items-center space-x-1.5 mt-1">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-pixel text-[10px] text-white truncate">
                {hero?.equippedGear?.badge || 'None'}
              </span>
            </div>
            {hero?.equippedGear?.badge === 'Achievement Badges' && (
              <span className="text-[9px] font-pixel text-amber-400 mt-0.5 block">+5 DISC</span>
            )}
          </div>

          {/* Active Theme Slot */}
          <div className="col-span-2 sm:col-span-1 p-2.5 rounded-lg bg-rpg-panel/80 border border-slate-700">
            <span className="block font-pixel text-[9px] text-slate-400 uppercase">ACTIVE THEME</span>
            <div className="flex items-center space-x-1.5 mt-1">
              <Palette className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-pixel text-[10px] text-white truncate">
                {hero?.equippedTheme || 'dark-fantasy'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs Toolbar */}
      <div className="flex flex-wrap gap-1.5 border-b border-slate-800 pb-3">
        {filterTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              playClick();
              setActiveFilter(tab.id);
            }}
            className={`px-3 py-1.5 rounded font-pixel text-[10px] transition-all ${
              activeFilter === tab.id
                ? 'bg-rpg-card text-rpg-purple-light border border-rpg-purple shadow-glow-purple'
                : 'text-slate-400 hover:text-white bg-rpg-card/40 border border-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Inventory Items Grid */}
      {loading ? (
        <SkeletonLoader type="shop" count={6} />
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-16 px-4 bg-rpg-card/40 border-2 border-dashed border-slate-800 rounded-lg">
          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-slate-900 flex items-center justify-center border border-slate-700 text-2xl">
            🎒
          </div>
          <h3 className="font-fantasy text-lg font-bold text-slate-300 mb-1">
            Satchel Empty in this Category
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4 font-sans">
            Visit the Guild Armory to acquire Golden Sword, Wizard Hat, Crystal Pet, Realm Themes, or Achievement Badges with your quest Gold!
          </p>
          {onNavigateToShop && (
            <button
              onClick={() => {
                playClick();
                onNavigateToShop();
              }}
              className="btn-pixel btn-pixel-gold text-xs py-2 px-4 flex items-center justify-center mx-auto space-x-1.5"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>VISIT SHOP</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const IconComp = ICON_MAP[item.icon] || Sparkles;
            const isEquipped = item.equipped || (item.themeId && hero?.equippedTheme === item.themeId);
            const canEquip = ['gear', 'pet', 'theme', 'badge'].includes(item.category) || !!item.themeId;

            return (
              <div
                key={item._id}
                className={`flex flex-col justify-between bg-rpg-card border-2 rounded-lg p-4 transition-all ${
                  isEquipped
                    ? 'border-emerald-500/80 bg-rpg-card shadow-glow-emerald/30'
                    : 'border-slate-800 hover:border-slate-600'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`w-10 h-10 rounded bg-rpg-panel border flex items-center justify-center ${
                        isEquipped ? 'border-emerald-400 text-emerald-400' : 'border-slate-700 text-rpg-gold'
                      }`}
                    >
                      <IconComp className="w-5 h-5" />
                    </div>

                    <div className="flex items-center space-x-1.5">
                      {isEquipped && (
                        <span className="font-pixel text-[9px] px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500 text-emerald-300 flex items-center space-x-1">
                          <Check className="w-3 h-3" />
                          <span>EQUIPPED</span>
                        </span>
                      )}
                      <span className="font-pixel text-[9px] uppercase px-1.5 py-0.5 rounded bg-rpg-panel border border-slate-700 text-slate-400">
                        {item.category}
                      </span>
                    </div>
                  </div>

                  <h3 className="font-fantasy font-bold text-base text-white tracking-wide">
                    {item.name}
                  </h3>
                  {item.description && (
                    <p className="text-xs text-slate-400 mt-1 font-sans">
                      {item.description}
                    </p>
                  )}

                  {/* Stat bonus highlight */}
                  {item.statBonus?.amount > 0 && item.statBonus?.stat && (
                    <div className="mt-2.5 p-1.5 rounded bg-rpg-panel/80 border border-slate-800 text-[11px] font-pixel text-rpg-gold flex items-center space-x-1">
                      <TrendingUp className="w-3 h-3" />
                      <span>+{item.statBonus.amount} {item.statBonus.stat.toUpperCase()}</span>
                    </div>
                  )}

                  {item.themeId && (
                    <div className="mt-2.5 p-1.5 rounded bg-rpg-panel/80 border border-slate-800 text-[10px] font-pixel text-purple-300">
                      REALM THEME: {item.themeId}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[9px] font-pixel text-slate-500">
                    ACQUIRED {new Date(item.acquiredAt || item.createdAt).toLocaleDateString()}
                  </span>

                  {canEquip && (
                    <button
                      disabled={equippingId === item._id}
                      onClick={() => handleToggleEquip(item)}
                      className={`btn-pixel py-1.5 px-3 text-[10px] ${
                        isEquipped
                          ? 'btn-pixel-dark text-slate-300'
                          : 'btn-pixel-emerald'
                      }`}
                    >
                      {equippingId === item._id
                        ? 'SAVING...'
                        : isEquipped
                        ? 'UNEQUIP'
                        : 'EQUIP'}
                    </button>
                  )}

                  {item.category === 'custom_reward' && !item.used && (
                    <button
                      onClick={() => handleRedeemVoucher(item._id)}
                      className="btn-pixel btn-pixel-emerald py-1 px-2.5 text-[9px]"
                    >
                      REDEEM
                    </button>
                  )}

                  {item.used && (
                    <span className="font-pixel text-[9px] text-slate-500 uppercase">
                      REDEEMED
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
