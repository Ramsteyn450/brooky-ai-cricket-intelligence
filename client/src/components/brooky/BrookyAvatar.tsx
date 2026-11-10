import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { BrookyAvatarState } from '../../context/BrookyContext';

interface BrookyAvatarProps {
  state: BrookyAvatarState;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showBadge?: boolean;
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<BrookyAvatarProps['size']>, string> = {
  sm: 'w-14 h-14',
  md: 'w-20 h-20',
  lg: 'w-28 h-28',
  xl: 'w-40 h-40',
};

export const BrookyAvatar: React.FC<BrookyAvatarProps> = ({
  state,
  size = 'md',
  showBadge = false,
  className = '',
}) => {
  const [isBlinking, setIsBlinking] = useState(false);
  const [mouthOpen, setMouthOpen] = useState(false);

  useEffect(() => {
    ['/avatars/brooky-idle.jpg', '/avatars/brooky-blink.jpg', '/avatars/brooky-speak.jpg'].forEach(
      (src) => {
        const img = new Image();
        img.src = src;
      },
    );
  }, []);

  useEffect(() => {
    let blinkTimeout: number;
    let closeTimeout: number;

    const scheduleBlink = () => {
      const waitMs = 2800 + Math.random() * 2400;
      blinkTimeout = window.setTimeout(() => {
        setIsBlinking(true);
        closeTimeout = window.setTimeout(() => {
          setIsBlinking(false);
          scheduleBlink();
        }, 145);
      }, waitMs);
    };

    scheduleBlink();
    return () => {
      window.clearTimeout(blinkTimeout);
      window.clearTimeout(closeTimeout);
    };
  }, []);

  useEffect(() => {
    if (state !== 'speaking') {
      setMouthOpen(false);
      return;
    }

    setMouthOpen(true);
    const interval = window.setInterval(() => {
      setMouthOpen((prev) => !prev);
    }, 175);

    return () => window.clearInterval(interval);
  }, [state]);

  const activeFrame =
    state === 'speaking' && mouthOpen
      ? '/avatars/brooky-speak.jpg'
      : isBlinking
        ? '/avatars/brooky-blink.jpg'
        : '/avatars/brooky-idle.jpg';

  const statusConfig: Record<
    BrookyAvatarState,
    { label: string; ringColor: string; dotColor: string }
  > = {
    idle: {
      label: 'Ready',
      ringColor: 'border-white/75',
      dotColor: 'bg-[#173F70]',
    },
    listening: {
      label: 'Listening',
      ringColor: 'border-[#D7193F]',
      dotColor: 'bg-[#D7193F]',
    },
    thinking: {
      label: 'Analyzing',
      ringColor: 'border-[#D7193F]',
      dotColor: 'bg-[#D7193F]',
    },
    speaking: {
      label: 'Speaking',
      ringColor: 'border-[#D7193F]',
      dotColor: 'bg-[#D7193F]',
    },
  };

  const cfg = statusConfig[state];

  return (
    <div className={`relative inline-flex items-center justify-center select-none ${SIZE_CLASSES[size]} ${className}`}>
      {/* Listening Sonar Rings (England Red + Secondary Blue) */}
      {state === 'listening' && (
        <>
          <motion.span
            animate={{ scale: [1, 1.32], opacity: [0.75, 0] }}
            transition={{ duration: 1.25, repeat: Infinity, ease: 'easeOut' }}
            className="absolute inset-0 rounded-full border-2 border-[#D7193F]"
          />
          <motion.span
            animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
            transition={{ duration: 1.25, repeat: Infinity, ease: 'easeOut', delay: 0.35 }}
            className="absolute inset-0 rounded-full border-2 border-[#173F70]"
          />
        </>
      )}

      {/* Thinking Orbital Ring (Red + Blue) */}
      {state === 'thinking' && (
        <motion.span
          animate={{ rotate: 360 }}
          transition={{ duration: 1.3, repeat: Infinity, ease: 'linear' }}
          className="absolute -inset-1 rounded-full border-2 border-transparent border-t-[#D7193F] border-r-white"
        />
      )}

      {/* Speaking Pulse Halo */}
      {state === 'speaking' && (
        <motion.span
          animate={{ scale: [1, 1.12, 1], opacity: [0.7, 0.25, 0.7] }}
          transition={{ duration: 0.65, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -inset-1 rounded-full bg-[#D7193F]/35 blur-[2px]"
        />
      )}

      {/* Floating 3D Portrait Container */}
      <motion.div
        animate={
          state === 'speaking'
            ? { y: [0, -2, 0], scale: [1, 1.02, 1] }
            : { y: [0, -3, 0] }
        }
        transition={{
          duration: state === 'speaking' ? 0.6 : 3.2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className={`relative w-full h-full rounded-full overflow-hidden border-[2.5px] ${cfg.ringColor} bg-[#102B50] shadow-lg`}
      >
        <img
          src={activeFrame}
          alt="Brooky AI Harry Brook 3D Avatar"
          className="w-full h-full object-cover object-top scale-[1.06]"
          draggable={false}
        />
        <div className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-white/25" />
      </motion.div>

      {/* Optional Status Pill */}
      {showBadge && (
        <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#0B1424] text-white text-[10px] font-bold shadow border border-white/20 whitespace-nowrap">
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotColor} ${state !== 'idle' ? 'animate-pulse' : ''}`} />
          {cfg.label}
        </span>
      )}
    </div>
  );
};
