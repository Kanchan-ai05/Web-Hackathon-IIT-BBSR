import React from 'react';

export const SkeletonLoader = ({ count = 3, type = 'quest' }) => {
  if (type === 'shop') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: count }).map((_, idx) => (
          <div
            key={idx}
            className="relative overflow-hidden bg-rpg-card/70 border-2 border-slate-800 rounded-xl p-5 space-y-4 shadow-lg"
          >
            <div className="absolute inset-0 -translate-x-full animate-beamShine bg-gradient-to-r from-transparent via-rpg-gold/10 to-transparent pointer-events-none" />
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-lg bg-slate-800 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 bg-slate-800 rounded animate-pulse" />
                <div className="h-3 w-1/3 bg-slate-800/80 rounded animate-pulse" />
              </div>
            </div>
            <div className="h-3 w-full bg-slate-800/60 rounded animate-pulse" />
            <div className="h-3 w-4/5 bg-slate-800/60 rounded animate-pulse" />
            <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
              <div className="h-4 w-20 bg-slate-800 rounded animate-pulse" />
              <div className="h-8 w-24 bg-slate-800 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="relative overflow-hidden bg-rpg-card/70 border-2 border-slate-800/80 rounded-lg p-4 shadow-lg"
        >
          {/* Shimmer sweep */}
          <div className="absolute inset-0 -translate-x-full animate-beamShine bg-gradient-to-r from-transparent via-rpg-gold/10 to-transparent pointer-events-none" />

          <div className="flex items-start space-x-3.5">
            <div className="w-6 h-6 rounded bg-slate-800 flex-shrink-0 animate-pulse" />
            <div className="flex-1 space-y-2.5">
              <div className="flex space-x-2">
                <div className="h-4 w-20 bg-slate-800 rounded animate-pulse" />
                <div className="h-4 w-16 bg-slate-800 rounded animate-pulse" />
              </div>
              <div className="h-5 w-3/4 bg-slate-700/80 rounded animate-pulse" />
              <div className="h-3 w-1/2 bg-slate-800 rounded animate-pulse" />
              <div className="flex space-x-4 pt-2 border-t border-slate-800/60">
                <div className="h-3.5 w-16 bg-slate-800 rounded animate-pulse" />
                <div className="h-3.5 w-16 bg-slate-800 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
