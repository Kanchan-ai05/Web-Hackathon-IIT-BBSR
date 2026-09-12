import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Coins, Shield, Sparkles } from 'lucide-react';
import { SkeletonLoader } from './SkeletonLoader';
import api from '../services/api';

export const HallOfFame = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await api.get('/stats/leaderboard');
        if (res.data.success) {
          setLeaderboard(res.data.leaderboard);
        }
      } catch (err) {
        console.error('Failed to load leaderboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  const getRankBadge = (rank) => {
    if (rank === 0) return { label: '1ST', color: 'text-amber-400', bg: 'bg-amber-950/80 border-amber-500' };
    if (rank === 1) return { label: '2ND', color: 'text-slate-300', bg: 'bg-slate-900 border-slate-500' };
    if (rank === 2) return { label: '3RD', color: 'text-amber-700', bg: 'bg-amber-950/40 border-amber-700' };
    return { label: `${rank + 1}TH`, color: 'text-slate-500', bg: 'bg-rpg-panel border-slate-800' };
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-fantasy font-black tracking-wide text-white flex items-center">
          <Trophy className="w-6 h-6 mr-2 text-rpg-gold" />
          GUILD HALL OF FAME
        </h2>
        <p className="text-xs text-slate-400 font-sans mt-0.5">
          The most celebrated champions of the realm, ranked by Hero Level and accumulated Gold bounties.
        </p>
      </div>

      {loading ? (
        <SkeletonLoader count={5} />
      ) : leaderboard.length === 0 ? (
        <div className="text-center py-12 text-slate-500 font-sans text-xs">
          No records found in the Guild archives.
        </div>
      ) : (
        <div className="bg-rpg-card border-2 border-rpg-border rounded-lg overflow-hidden">
          <div className="divide-y divide-slate-800">
            {leaderboard.map((hero, idx) => {
              const rankInfo = getRankBadge(idx);
              return (
                <div
                  key={hero._id}
                  className="p-4 flex items-center justify-between gap-4 hover:bg-rpg-panel/40 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    {/* Rank Badge */}
                    <div
                      className={`w-10 h-10 rounded flex items-center justify-center font-pixel text-xs font-bold border ${rankInfo.bg} ${rankInfo.color}`}
                    >
                      {rankInfo.label}
                    </div>

                    {/* Hero Info */}
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-fantasy font-bold text-base text-white">
                          {hero.username}
                        </span>
                        <span className="font-pixel text-[9px] uppercase px-1.5 py-0.5 rounded bg-rpg-panel border border-slate-700 text-slate-400">
                          {hero.heroClass}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 font-sans">
                        "{hero.title || 'Novice Adventurer'}"
                      </span>
                    </div>
                  </div>

                  {/* Level & Gold */}
                  <div className="flex items-center space-x-6 text-right">
                    <div>
                      <span className="block text-[9px] font-pixel text-slate-400">LEVEL</span>
                      <span className="font-pixel text-xs text-rpg-purple-light font-bold">
                        LVL {hero.level}
                      </span>
                    </div>

                    <div>
                      <span className="block text-[9px] font-pixel text-slate-400">BOUNTY</span>
                      <span className="font-pixel text-xs text-rpg-gold font-bold flex items-center justify-end">
                        <Coins className="w-3 h-3 mr-1 text-rpg-gold" />
                        {hero.gold} G
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
