import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ShoppingBag,
  Coins,
  Sparkles,
  Plus,
  Trash2,
  Check,
  FlaskConical,
  Flame,
  Shield,
  BookOpen,
  Footprints,
  Award,
  Crown,
  Gamepad2,
  Coffee,
  Utensils,
  Tv,
  Music,
  Scroll
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSound } from '../context/SoundContext';
import { useQuests } from '../context/QuestContext';
import { CreateRewardModal } from './CreateRewardModal';
import api from '../services/api';

const ICON_MAP = {
  FlaskConical,
  Sparkles,
  Flame,
  Shield,
  BookOpen,
  Footprints,
  Award,
  Crown,
  Gamepad2,
  Coffee,
  Utensils,
  Tv,
  Music,
  Scroll
};

export const ArmoryShop = () => {
  const { hero, updateHero } = useAuth();
  const { playClick, playCoin, playLevelUp } = useSound();
  const { setLevelUpData } = useQuests();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('relics'); // 'relics' | 'custom'
  const [modalOpen, setModalOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [purchasingId, setPurchasingId] = useState(null);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await api.get('/shop/items');
      if (res.data.success) {
        setItems(res.data.items);
      }
    } catch (err) {
      console.error('Failed to load shop items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handlePurchase = async (item) => {
    if (hero.gold < item.cost) {
      setStatusMessage(`Insufficient Gold! You need ${item.cost - hero.gold} more Gold.`);
      setTimeout(() => setStatusMessage(''), 3000);
      return;
    }

    setPurchasingId(item._id);
    playCoin();

    try {
      const res = await api.post('/shop/purchase', { itemId: item._id });
      if (res.data.success) {
        updateHero(res.data.hero);
        setStatusMessage(res.data.message);
        setTimeout(() => setStatusMessage(''), 4000);

        if (res.data.levelUpData && res.data.levelUpData.leveledUp) {
          playLevelUp();
          setLevelUpData(res.data.levelUpData);
        }
      }
    } catch (err) {
      setStatusMessage(err.response?.data?.message || 'Transaction failed at Guild Vault.');
      setTimeout(() => setStatusMessage(''), 3000);
    } finally {
      setPurchasingId(null);
    }
  };

  const handleDeleteCustomReward = async (id) => {
    playClick();
    if (window.confirm('Dissolve this reward scroll?')) {
      try {
        const res = await api.delete(`/shop/rewards/${id}`);
        if (res.data.success) {
          setItems(items.filter((it) => it._id !== id));
        }
      } catch (err) {
        console.error('Failed to delete reward:', err);
      }
    }
  };

  const guildRelics = items.filter((it) => !it.isCustom);
  const customRewards = items.filter((it) => it.isCustom);

  return (
    <div className="space-y-6">
      {/* Header & Gold Vault */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-fantasy font-black tracking-wide text-white flex items-center">
            <ShoppingBag className="w-6 h-6 mr-2 text-rpg-gold" />
            GUILD ARMORY & BAZAAR
          </h2>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Exchange your hard-earned Gold for stat-boosting relics or custom real-world reward scrolls.
          </p>
        </div>

        {/* Hero Gold Balance Pill */}
        <div className="flex items-center space-x-2 bg-rpg-card border-2 border-rpg-gold px-4 py-2 rounded-lg shadow-glow-gold">
          <Coins className="w-5 h-5 text-rpg-gold animate-bounce-subtle" />
          <div>
            <span className="block text-[9px] font-pixel text-slate-400">HERO VAULT</span>
            <span className="font-pixel text-sm text-rpg-gold font-bold">
              {hero?.gold || 0} GOLD
            </span>
          </div>
        </div>
      </div>

      {/* Feedback Toast */}
      {statusMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-rpg-panel border-2 border-rpg-gold/70 rounded-md text-center text-xs font-pixel text-rpg-gold shadow-md"
        >
          {statusMessage}
        </motion.div>
      )}

      {/* Tabs Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex space-x-2">
          <button
            onClick={() => {
              playClick();
              setActiveTab('relics');
            }}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded font-pixel text-xs transition-all ${
              activeTab === 'relics'
                ? 'bg-rpg-card text-rpg-gold border border-rpg-gold shadow-glow-gold'
                : 'text-slate-400 hover:text-white bg-rpg-card/40'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-rpg-gold" />
            <span>GUILD RELICS & POTIONS ({guildRelics.length})</span>
          </button>

          <button
            onClick={() => {
              playClick();
              setActiveTab('custom');
            }}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded font-pixel text-xs transition-all ${
              activeTab === 'custom'
                ? 'bg-rpg-card text-rpg-gold border border-rpg-gold shadow-glow-gold'
                : 'text-slate-400 hover:text-white bg-rpg-card/40'
            }`}
          >
            <Scroll className="w-3.5 h-3.5 text-rpg-purple-light" />
            <span>REAL-LIFE REWARDS ({customRewards.length})</span>
          </button>
        </div>

        {activeTab === 'custom' && (
          <button
            onClick={() => {
              playClick();
              setModalOpen(true);
            }}
            className="btn-pixel btn-pixel-gold flex items-center justify-center space-x-2 py-2 px-3 text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>FORGE REWARD</span>
          </button>
        )}
      </div>

      {/* Shop Items Grid */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 font-pixel text-xs">
          OPENING ARMORY VAULT...
        </div>
      ) : activeTab === 'relics' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {guildRelics.map((item) => {
            const IconComp = ICON_MAP[item.icon] || Sparkles;
            const canAfford = hero?.gold >= item.cost;
            return (
              <div
                key={item._id}
                className="flex flex-col justify-between bg-rpg-card border-2 border-rpg-border hover:border-rpg-gold/60 rounded-lg p-4 transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded bg-rpg-panel border border-slate-700 flex items-center justify-center text-rpg-gold group-hover:scale-105 transition-transform">
                      <IconComp className="w-5 h-5" />
                    </div>
                    <span className="font-pixel text-[9px] uppercase px-1.5 py-0.5 rounded bg-rpg-panel border border-slate-700 text-slate-400">
                      {item.category}
                    </span>
                  </div>

                  <h3 className="font-fantasy font-bold text-base text-white tracking-wide">
                    {item.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 font-sans line-clamp-2">
                    {item.description}
                  </p>

                  <div className="mt-3 p-2 bg-rpg-panel/80 rounded border border-slate-800 text-[11px] text-rpg-emerald font-medium">
                    ⚡ {item.effectDescription}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-1 font-pixel text-xs text-rpg-gold font-bold">
                    <Coins className="w-4 h-4 text-rpg-gold" />
                    <span>{item.cost} G</span>
                  </div>

                  <button
                    disabled={!canAfford || purchasingId === item._id}
                    onClick={() => handlePurchase(item)}
                    className={`btn-pixel py-1.5 px-3 text-[10px] ${
                      canAfford
                        ? 'btn-pixel-gold'
                        : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed shadow-none'
                    }`}
                  >
                    {purchasingId === item._id ? 'BUYING...' : canAfford ? 'PURCHASE' : 'NEED GOLD'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : customRewards.length === 0 ? (
        <div className="text-center py-16 px-4 bg-rpg-card/40 border-2 border-dashed border-slate-800 rounded-lg">
          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-slate-900 flex items-center justify-center border border-slate-700 text-2xl">
            📜
          </div>
          <h3 className="font-fantasy text-lg font-bold text-slate-300 mb-1">
            No Custom Rewards Forged
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4 font-sans">
            Reward your real-world efforts! Forge custom vouchers like "1 Hour Video Games", "Order Favorite Pizza", or "Watch Netflix".
          </p>
          <button
            onClick={() => {
              playClick();
              setModalOpen(true);
            }}
            className="btn-pixel btn-pixel-gold text-xs py-2 px-4"
          >
            FORGE FIRST REWARD
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customRewards.map((item) => {
            const IconComp = ICON_MAP[item.icon] || Scroll;
            const canAfford = hero?.gold >= item.cost;
            return (
              <div
                key={item._id}
                className="flex flex-col justify-between bg-rpg-card border-2 border-rpg-border hover:border-rpg-purple-light/60 rounded-lg p-4 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded bg-rpg-panel border border-rpg-purple-light/40 flex items-center justify-center text-rpg-purple-light">
                      <IconComp className="w-5 h-5" />
                    </div>
                    <button
                      onClick={() => handleDeleteCustomReward(item._id)}
                      className="text-slate-500 hover:text-rose-400 p-1 rounded"
                      title="Dissolve reward"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="font-fantasy font-bold text-base text-white tracking-wide">
                    {item.name}
                  </h3>
                  {item.description && (
                    <p className="text-xs text-slate-400 mt-1 font-sans">
                      {item.description}
                    </p>
                  )}
                  <span className="inline-block mt-2 font-pixel text-[9px] text-rpg-purple-light bg-purple-950/50 px-2 py-0.5 rounded border border-purple-800">
                    REAL-WORLD VOUCHER
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-1 font-pixel text-xs text-rpg-gold font-bold">
                    <Coins className="w-4 h-4 text-rpg-gold" />
                    <span>{item.cost} G</span>
                  </div>

                  <button
                    disabled={!canAfford || purchasingId === item._id}
                    onClick={() => handlePurchase(item)}
                    className={`btn-pixel py-1.5 px-3 text-[10px] ${
                      canAfford
                        ? 'btn-pixel-purple'
                        : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed shadow-none'
                    }`}
                  >
                    {purchasingId === item._id ? 'BUYING...' : canAfford ? 'REDEEM' : 'NEED GOLD'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Custom Reward Modal */}
      <CreateRewardModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={(newReward) => setItems((prev) => [...prev, newReward])}
      />
    </div>
  );
};
