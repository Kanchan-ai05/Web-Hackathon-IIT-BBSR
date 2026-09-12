import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Coins,
  Sparkles,
  X,
  CheckCircle2,
  Sword,
  Shield,
  Moon,
  Cat,
  Award,
  FlaskConical,
  Flame,
  BookOpen,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSound } from '../context/SoundContext';
import { useQuests } from '../context/QuestContext';
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

export const PurchaseModal = ({ isOpen, onClose, item, onPurchased }) => {
  const { hero, updateHero } = useAuth();
  const { playClick, playCoin, playLevelUp } = useSound();
  const { setLevelUpData } = useQuests();

  const [purchasing, setPurchasing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen || !item) return null;

  const userGold = hero?.gold || 0;
  const canAfford = userGold >= item.cost;
  const remainingGold = userGold - item.cost;

  const IconComp = ICON_MAP[item.icon] || Sparkles;

  const triggerPurchaseParticles = () => {
    const end = Date.now() + 1200;
    const colors = ['#f59e0b', '#fbbf24', '#fde68a', '#10b981', '#38bdf8'];
    const frame = () => {
      confetti({
        particleCount: 6,
        angle: 90,
        spread: 70,
        origin: { x: 0.5, y: 0.55 },
        colors
      });
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  };

  const handleConfirmPurchase = async () => {
    if (!canAfford) {
      setErrorMessage(`Insufficient Gold! You need ${item.cost - userGold} more Gold.`);
      return;
    }

    setPurchasing(true);
    setErrorMessage('');
    playCoin();

    try {
      const res = await api.post('/shop/purchase', { itemId: item._id });
      if (res.data.success) {
        triggerPurchaseParticles();
        setSuccess(true);
        updateHero(res.data.hero || res.data.user);

        if (res.data.levelUpData?.leveledUp) {
          playLevelUp();
          setLevelUpData(res.data.levelUpData);
        }

        if (onPurchased) {
          onPurchased(res.data.item);
        }

        // Close modal after celebratory confirmation
        setTimeout(() => {
          setSuccess(false);
          setPurchasing(false);
          onClose();
        }, 1400);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Transaction rejected by Guild Vault.');
      setPurchasing(false);
    }
  };

  const handleClose = () => {
    if (purchasing) return;
    playClick();
    setSuccess(false);
    setErrorMessage('');
    onClose();
  };

  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !purchasing) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [purchasing]);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="purchase-modal-title"
          initial={{ opacity: 0, scale: 0.9, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 15 }}
          transition={{ type: 'spring', damping: 20, stiffness: 280 }}
          className="relative w-full max-w-md bg-rpg-panel border-4 border-rpg-gold rounded-xl p-6 shadow-glow-gold-lg text-center"
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            disabled={purchasing}
            aria-label="Close purchase modal"
            className="absolute top-3 right-3 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {success ? (
            /* Satisfying Purchase Celebration Screen */
            <div className="py-6 space-y-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.25, 1] }}
                transition={{ duration: 0.5 }}
                className="w-20 h-20 mx-auto rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 shadow-glow-emerald"
              >
                <CheckCircle2 className="w-10 h-10" />
              </motion.div>

              <div>
                <span className="font-pixel text-[11px] text-rpg-gold uppercase tracking-widest block mb-1">
                  TRANSACTION HONORED!
                </span>
                <h3 className="font-fantasy font-black text-2xl text-white tracking-wide">
                  {item.name} ACQUIRED
                </h3>
                <p className="text-xs text-slate-300 font-sans mt-2">
                  Transferred directly into your Hero Inventory & equipped sheet!
                </p>
              </div>

              <div className="inline-flex items-center space-x-2 bg-rpg-card px-4 py-1.5 rounded border border-rpg-gold/60 font-pixel text-xs text-rpg-gold">
                <Coins className="w-4 h-4 text-rpg-gold" />
                <span>-{item.cost} GOLD DEDUCTED</span>
              </div>
            </div>
          ) : (
            /* Purchase Confirmation Dialog */
            <div>
              {/* Header */}
              <div className="relative mx-auto w-20 h-20 mb-3 flex items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0 rounded-full border-2 border-dashed border-rpg-gold/50"
                />
                <div className="w-16 h-16 rounded-xl bg-gradient-to-tr from-amber-600 via-rpg-gold to-yellow-200 flex items-center justify-center text-slate-950 shadow-glow-gold">
                  <IconComp className="w-8 h-8" />
                </div>
              </div>

              <span className="font-pixel text-[10px] text-rpg-gold tracking-widest uppercase block mb-1">
                GUILD ARMORY BAZAAR
              </span>
              <h2 className="text-2xl font-fantasy font-black text-white tracking-wide mb-1">
                {item.name}
              </h2>

              <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-pixel uppercase bg-rpg-card border border-slate-700 text-slate-300 mb-3">
                CATEGORY: {item.category}
              </span>

              <p className="text-xs text-slate-300 font-sans leading-relaxed mb-4 px-2">
                {item.description}
              </p>

              {/* Stat or Theme Perk Highlight */}
              {item.effectDescription && (
                <div className="mb-4 p-2.5 bg-rpg-card/90 rounded border border-rpg-gold/50 text-xs text-rpg-gold font-medium flex items-center justify-center space-x-1.5">
                  <Sparkles className="w-4 h-4 flex-shrink-0" />
                  <span>{item.effectDescription}</span>
                </div>
              )}

              {/* Cost & Gold Balance Calculation */}
              <div className="bg-rpg-card/90 border border-slate-700 rounded-lg p-3.5 mb-5 space-y-2 text-left">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-pixel text-[10px]">VAULT CURRENT GOLD:</span>
                  <span className="font-pixel text-xs text-white font-bold flex items-center">
                    <Coins className="w-3.5 h-3.5 text-rpg-gold mr-1" />
                    {userGold} G
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-pixel text-[10px]">ITEM COST:</span>
                  <span className="font-pixel text-xs text-rose-400 font-bold flex items-center">
                    -{item.cost} G
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-pixel text-[10px]">GOLD REMAINING:</span>
                  <span
                    className={`font-pixel text-xs font-bold flex items-center ${
                      canAfford ? 'text-rpg-gold' : 'text-rose-400'
                    }`}
                  >
                    <Coins className="w-3.5 h-3.5 mr-1" />
                    {canAfford ? remainingGold : 0} G
                  </span>
                </div>
              </div>

              {/* Insufficient gold warning */}
              {!canAfford && (
                <div className="flex items-center space-x-2 text-xs text-rose-400 bg-rose-950/40 p-2.5 rounded border border-rose-900 mb-4 font-sans text-left">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>You need {item.cost - userGold} more Gold. Conquer quests to earn bounties!</span>
                </div>
              )}

              {errorMessage && (
                <div className="p-2.5 bg-rose-950/80 border border-rose-500 rounded text-rose-300 text-xs font-pixel mb-4">
                  {errorMessage}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={purchasing}
                  className="flex-1 btn-pixel btn-pixel-dark py-2.5 text-xs"
                >
                  CANCEL
                </button>

                <button
                  type="button"
                  disabled={!canAfford || purchasing}
                  onClick={handleConfirmPurchase}
                  className={`flex-1 btn-pixel py-2.5 text-xs flex items-center justify-center space-x-1.5 ${
                    canAfford
                      ? 'btn-pixel-gold animate-pulse-gold'
                      : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed shadow-none'
                  }`}
                >
                  <Coins className="w-3.5 h-3.5" />
                  <span>{purchasing ? 'BUYING...' : `CONFIRM (${item.cost} G)`}</span>
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
