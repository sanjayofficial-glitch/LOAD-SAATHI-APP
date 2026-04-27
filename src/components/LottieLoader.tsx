"use client";

import React from 'react';
import { DotLottiePlayer } from '@dotlottie/react-player';

interface LottieLoaderProps {
  src: string;
  onComplete: () => void;
  className?: string;
}

const LottieLoader: React.FC<LottieLoaderProps> = ({ 
  src, 
  onComplete,
  className = ''
}) => {
  return (
    <div className={`relative w-full h-screen flex items-center justify-center bg-white ${className}`}>
      <div className="w-full max-w-2xl aspect-square">
        <DotLottiePlayer
          src={src}
          autoplay
          loop={false}
          onEvent={(event) => {
            // Listen for the 'complete' event specifically
            if (event === 'complete') {
              onComplete();
            }
          }}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
      
      {/* Subtle gradient for depth on white background */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-50/50 via-transparent to-gray-50/50 pointer-events-none" />
    </div>
  );
};

export default LottieLoader;