import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Coins,
  AlertTriangle,
  CheckCircle2,
  Trophy,
  X,
  Info
} from 'lucide-react';
import { useSound } from './SoundContext';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const { playQuestComplete, playCoin, playLevelUp } = useSound();

  const showToast = useCallback((message, type = 'info', title = '') => {
    const id = Date.now() + Math.random();
    const newToast = { id, message, type, title };

    // Play chime matching toast theme
    if (type === 'gold') {
      playCoin();
    } else if (type === 'levelup') {
      playLevelUp();
    } else if (type === 'success') {
      playQuestComplete();
    }

    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, [playCoin, playLevelUp, playQuestComplete]);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const getToastStyling = (type) => {
    switch (type) {
      case 'gold':
        return {
          icon: Coins,
          border: 'border-rpg-gold',
          glow: 'shadow-glow-gold',
          bg: 'bg-amber-950/90',
          text: 'text-rpg-gold',
          badge: 'bg-rpg-gold text-slate-950'
        };
      case 'success':
        return {
          icon: CheckCircle2,
          border: 'border-emerald-500',
          glow: 'shadow-glow-emerald',
          bg: 'bg-emerald-950/90',
          text: 'text-emerald-300',
          badge: 'bg-emerald-500 text-slate-950'
        };
      case 'levelup':
        return {
          icon: Trophy,
          border: 'border-rpg-purple-light',
          glow: 'shadow-glow-purple',
          bg: 'bg-purple-950/90',
          text: 'text-rpg-purple-light',
          badge: 'bg-purple-500 text-white'
        };
      case 'error':
        return {
          icon: AlertTriangle,
          border: 'border-rose-500',
          glow: 'shadow-glow-ruby',
          bg: 'bg-rose-950/90',
          text: 'text-rose-300',
          badge: 'bg-rose-600 text-white'
        };
      default:
        return {
          icon: Info,
          border: 'border-sky-500',
          glow: 'shadow-sm',
          bg: 'bg-slate-900/90',
          text: 'text-sky-300',
          badge: 'bg-sky-600 text-white'
        };
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Notification Container */}
      <div className="fixed top-20 right-4 z-50 flex flex-col space-y-2.5 max-w-sm w-full pointer-events-none px-2 sm:px-0">
        <AnimatePresence>
          {toasts.map((toast) => {
            const style = getToastStyling(toast.type);
            const Icon = style.icon;

            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, x: 50, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 50, scale: 0.9 }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                className={`pointer-events-auto relative flex items-start space-x-3 p-3.5 rounded-lg border-2 backdrop-blur-md ${style.bg} ${style.border} ${style.glow} shadow-xl`}
              >
                <div className="p-1.5 rounded bg-rpg-panel border border-slate-700 flex-shrink-0">
                  <Icon className={`w-4 h-4 ${style.text}`} />
                </div>

                <div className="flex-1 min-w-0 pr-2">
                  {toast.title && (
                    <h4 className="font-fantasy font-bold text-xs text-white uppercase tracking-wider mb-0.5">
                      {toast.title}
                    </h4>
                  )}
                  <p className="text-xs text-slate-200 font-sans leading-relaxed">
                    {toast.message}
                  </p>
                </div>

                <button
                  onClick={() => removeToast(toast.id)}
                  className="text-slate-400 hover:text-white flex-shrink-0 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
