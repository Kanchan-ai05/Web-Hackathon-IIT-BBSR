import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

export const AmbientParticles = () => {
  // Generate random stable particles
  const particles = useMemo(() => {
    return Array.from({ length: 24 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100, // % width
      y: Math.random() * 100, // % height
      size: Math.random() * 3 + 1.5, // px
      duration: Math.random() * 12 + 10, // seconds
      delay: Math.random() * 5,
      opacity: Math.random() * 0.4 + 0.15,
      color: i % 3 === 0 ? '#f59e0b' : i % 3 === 1 ? '#8b5cf6' : '#38bdf8'
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            opacity: 0,
            scale: 0.5
          }}
          animate={{
            top: [`${p.y}%`, `${(p.y - 30 + 100) % 100}%`],
            opacity: [0, p.opacity, p.opacity, 0],
            scale: [0.5, 1.2, 0.8]
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          style={{
            position: 'absolute',
            width: `${p.size}px`,
            height: `${p.size}px`,
            borderRadius: '50%',
            backgroundColor: p.color,
            boxShadow: `0 0 ${p.size * 3}px ${p.color}`
          }}
        />
      ))}
    </div>
  );
};
