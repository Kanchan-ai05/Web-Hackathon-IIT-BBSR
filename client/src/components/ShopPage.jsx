import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ShoppingBag,
  Coins,
  Sparkles,
  Sword,
  Shield,
  Moon,
  Cat,
  Award,
  FlaskConical,
  Flame,
  BookOpen,
  Plus,
  Trash2,
  CheckCircle,
  Tag,
  PackageCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSound } from '../context/SoundContext';
import { PurchaseModal } from './PurchaseModal';
import { CreateRewardModal } from './CreateRewardModal';
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

export const ShopPage = () => {
  const { hero } = useAuth();
  const { playClick } = useSound();

  const [items, setItems] = useState([]);
  const [userInventory, setUserInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedItemForPurchase, setSelectedItemForPurchase] = useState(null);
  const [customRewardModalOpen, setCustomRewardModalOpen] = useState(false);

  const fetchShopData = async () => {
    try {
      setLoading(true);
      const [itemsRes, invRes] = await Promise.all([
        api.get('/shop/items'),
        api.get('/shop/inventory')
      ]);

      if (itemsRes.data.success) {
        setItems(itemsRes.data.items);
      }
      if (invRes.data.success) {
        setUserInventory(invRes.data.inventory);
      }
    } catch (err) {
      console.error('Failed to load Guild Shop data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShopData();
  }, []);

  const handleOpenPurchaseModal = (item) => {
    playClick();
    setSelectedItemForPurchase(item);
  };

  const handlePurchaseComplete = () => {
    fetchShopData();
  };

  const handleDeleteCustomReward = async (id) => {
    playClick();
    if (window.confirm('Dissolve this custom reward scroll?')) {
      try {
        const res = await api.delete(`/shop/rewards/${id}`);
        if (res.data.success) {
          setItems((prev) => prev.filter((it) => it._id !== id));
        }
      } catch (err) {
        console.error('Failed to delete reward:', err);
      }
    }
  };

  // Check if item is already owned (for unique gear/themes/pets)
  const isOwned = (item) => {
    if (item.category === 'potion') return false;
    return userInventory.some((inv) => inv.name === item.name);
  };

  const categories = [
    { id: 'all', label: 'All Items' },
    { id: 'gear', label: 'Equipment & Weapons' },
    { id: 'pet', label: 'Pets & Familiars' },
    { id: 'theme', label: 'Realm Themes' },
    { id: 'badge', label: 'Badges' },
    { id: 'potion', label: 'Potions' },
    { id: 'custom_reward', label: 'Real-World Rewards' }
  ];

  const filteredItems = items.filter((item) => {
    if (activeCategory === 'all') return true;
    if (activeCategory === 'gear') return item.category === 'gear';
    if (activeCategory === 'pet') return item.category === 'pet';
    if (activeCategory === 'theme') return item.category === 'theme' || !!item.themeId;
    if (activeCategory === 'badge') return item.category === 'badge';
    if (activeCategory === 'potion') return item.category === 'potion';
    if (activeCategory === 'custom_reward') return item.isCustom;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Shop Header & Vault Balance */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-rpg-panel border-2 border-rpg-border p-5 rounded-xl">
        <div>
          <h1 className="text-xl sm:text-2xl font-fantasy font-black tracking-wide text-white flex items-center">
            <ShoppingBag className="w-6 h-6 mr-2 text-rpg-gold" />
            GUILD ARMORY & BAZAAR
          </h1>
          <p className="text-xs text-slate-400 font-sans mt-1">
            Exchange your hard-earned quest Gold for legendary weapons, arcane hats, celestial pets, realm themes, and badges!
          </p>
        </div>

        {/* Hero Gold Balance Pill */}
        <motion.div
          key={hero?.gold}
          initial={{ scale: 1.15 }}
          animate={{ scale: 1 }}
          className="flex items-center space-x-2.5 bg-rpg-card border-2 border-rpg-gold px-4 py-2 rounded-lg shadow-glow-gold flex-shrink-0"
        >
          <Coins className="w-5 h-5 text-rpg-gold animate-bounce-subtle" />
          <div>
            <span className="block text-[9px] font-pixel text-slate-400">HERO VAULT</span>
            <span className="font-pixel text-sm text-rpg-gold font-bold">
              {hero?.gold || 0} GOLD
            </span>
          </div>
        </motion.div>
      </div>

      {/* Categories Toolbar & Custom Reward Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                playClick();
                setActiveCategory(cat.id);
              }}
              className={`px-3 py-1.5 rounded font-pixel text-[10px] transition-all ${
                activeCategory === cat.id
                  ? 'bg-rpg-card text-rpg-gold border border-rpg-gold shadow-glow-gold'
                  : 'text-slate-400 hover:text-white bg-rpg-card/40 border border-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            playClick();
            setCustomRewardModalOpen(true);
          }}
          className="btn-pixel btn-pixel-gold flex items-center justify-center space-x-1.5 py-1.5 px-3 text-[10px]"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>FORGE CUSTOM REWARD</span>
        </button>
      </div>

      {/* Products Grid */}
      {loading ? (
        <SkeletonLoader count={6} type="shop" />
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-16 px-4 bg-rpg-card/40 border-2 border-dashed border-slate-800 rounded-lg">
          <p className="font-pixel text-xs text-slate-400">NO ITEMS IN THIS CATEGORY</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.map((item) => {
            const IconComp = ICON_MAP[item.icon] || Sparkles;
            const owned = isOwned(item);
            const canAfford = (hero?.gold || 0) >= item.cost;

            return (
              <motion.div
                key={item._id}
                whileHover={{ y: -3 }}
                transition={{ duration: 0.15 }}
                className={`flex flex-col justify-between bg-rpg-card border-2 rounded-xl p-5 transition-all relative overflow-hidden ${
                  owned
                    ? 'border-emerald-700/60 bg-rpg-card/80'
                    : 'border-rpg-border hover:border-rpg-gold/70 shadow-lg'
                }`}
              >
                <div>
                  {/* Top Bar: Icon & Category */}
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="w-12 h-12 rounded-lg bg-rpg-panel border-2 border-slate-700 flex items-center justify-center text-rpg-gold shadow-md">
                      <IconComp className="w-6 h-6" />
                    </div>

                    <div className="flex items-center space-x-1.5">
                      {owned && (
                        <span className="flex items-center space-x-1 font-pixel text-[9px] px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500 text-emerald-300">
                          <PackageCheck className="w-3 h-3" />
                          <span>OWNED</span>
                        </span>
                      )}
                      <span className="font-pixel text-[9px] uppercase px-2 py-0.5 rounded bg-rpg-panel border border-slate-700 text-slate-300">
                        {item.category}
                      </span>
                      {item.isCustom && (
                        <button
                          onClick={() => handleDeleteCustomReward(item._id)}
                          className="text-slate-500 hover:text-rose-400 p-1 rounded"
                          title="Delete reward"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-fantasy font-black text-lg text-white tracking-wide">
                    {item.name}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 font-sans leading-relaxed">
                    {item.description}
                  </p>

                  {/* Effect Badge */}
                  {item.effectDescription && (
                    <div className="mt-3.5 p-2 bg-rpg-panel/90 rounded border border-rpg-gold/40 text-[11px] text-rpg-gold font-medium flex items-center space-x-1.5">
                      <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{item.effectDescription}</span>
                    </div>
                  )}
                </div>

                {/* Bottom Bar: Price & Purchase Action */}
                <div className="mt-5 pt-3.5 border-t border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 font-pixel text-xs text-rpg-gold font-bold">
                    <Coins className="w-4 h-4 text-rpg-gold" />
                    <span>{item.cost} GOLD</span>
                  </div>

                  <button
                    disabled={owned && item.category !== 'potion'}
                    onClick={() => handleOpenPurchaseModal(item)}
                    className={`btn-pixel py-1.5 px-3.5 text-[10px] ${
                      owned && item.category !== 'potion'
                        ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed shadow-none'
                        : canAfford
                        ? 'btn-pixel-gold'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {owned && item.category !== 'potion' ? 'IN INVENTORY' : 'BUY NOW'}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Purchase Confirmation Modal */}
      <PurchaseModal
        isOpen={!!selectedItemForPurchase}
        onClose={() => setSelectedItemForPurchase(null)}
        item={selectedItemForPurchase}
        onPurchased={handlePurchaseComplete}
      />

      {/* Create Custom Reward Modal */}
      <CreateRewardModal
        isOpen={customRewardModalOpen}
        onClose={() => setCustomRewardModalOpen(false)}
        onCreated={() => fetchShopData()}
      />
    </div>
  );
};
