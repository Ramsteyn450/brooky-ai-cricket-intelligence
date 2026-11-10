import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SplashLoaderProps {
  visible: boolean;
  onSkip: () => void;
}

export const SplashLoader: React.FC<SplashLoaderProps> = ({ visible, onSkip }) => {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="brooky-splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#102B50] text-white overflow-hidden"
        >
          {/* Subtle England Navy/Red geometric pitch contour backdrop */}
          <svg
            className="absolute inset-0 w-full h-full opacity-20 pointer-events-none"
            viewBox="0 0 1200 800"
            fill="none"
            preserveAspectRatio="xMidYMid slice"
          >
            <circle cx="600" cy="400" r="180" stroke="#D7193F" strokeWidth="1.2" strokeDasharray="6 8" />
            <circle cx="600" cy="400" r="290" stroke="#FFFFFF" strokeWidth="0.8" />
            <circle cx="600" cy="400" r="420" stroke="#173F70" strokeWidth="1.5" />
            <circle cx="600" cy="400" r="560" stroke="#FFFFFF" strokeWidth="0.6" />
          </svg>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="relative z-10 flex flex-col items-center text-center px-6"
          >
            <div className="relative mb-6">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                className="w-24 h-24 rounded-full border-2 border-white/25 border-t-[#D7193F] flex items-center justify-center p-1.5"
              />
              <div className="absolute inset-2 rounded-full overflow-hidden border-2 border-white/90 shadow-xl bg-[#173F70]">
                <img
                  src="/avatars/brooky-idle.jpg"
                  alt="Brooky AI"
                  className="w-full h-full object-cover object-top"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <span className="h-2 w-2 rounded-full bg-[#D7193F] animate-pulse" />
              <span className="text-[11px] font-semibold tracking-[0.26em] uppercase text-blue-100">
                England Cricket Edition
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              BROOKY <span className="text-[#D7193F]">AI</span>
            </h1>
            <p className="mt-1.5 text-sm sm:text-base text-blue-100/85 font-medium">
              Cricket Intelligence Platform
            </p>

            {/* Progress bar */}
            <div className="mt-7 w-56 h-1.5 rounded-full bg-white/15 overflow-hidden">
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: '0%' }}
                transition={{ duration: 1.05, ease: [0.22, 1, 0.36, 1] }}
                className="h-full bg-gradient-to-r from-[#173F70] via-[#FFFFFF] to-[#D7193F] rounded-full"
              />
            </div>

            <button
              type="button"
              onClick={onSkip}
              className="mt-5 text-xs text-blue-200/75 hover:text-white transition-colors cursor-pointer"
            >
              Initializing match intelligence…
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
