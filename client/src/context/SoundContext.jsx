import React, { createContext, useContext, useState, useCallback } from 'react';
import { soundService } from '../services/sound';

const SoundContext = createContext(null);

export const SoundProvider = ({ children }) => {
  const [isMuted, setIsMuted] = useState(soundService.isMuted());

  const toggleSound = useCallback(() => {
    const updated = soundService.toggleMute();
    setIsMuted(updated);
  }, []);

  const playClick = useCallback(() => soundService.playClick(), []);
  const playCoin = useCallback(() => soundService.playCoin(), []);
  const playQuestComplete = useCallback(() => soundService.playQuestComplete(), []);
  const playLevelUp = useCallback(() => soundService.playLevelUp(), []);
  const playBossHit = useCallback(() => soundService.playBossHit(), []);

  return (
    <SoundContext.Provider
      value={{
        isMuted,
        toggleSound,
        playClick,
        playCoin,
        playQuestComplete,
        playLevelUp,
        playBossHit
      }}
    >
      {children}
    </SoundContext.Provider>
  );
};

export const useSound = () => {
  const context = useContext(SoundContext);
  if (!context) {
    throw new Error('useSound must be used within a SoundProvider');
  }
  return context;
};
