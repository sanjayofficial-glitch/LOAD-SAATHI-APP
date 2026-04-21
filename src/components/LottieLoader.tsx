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
    <div className={`relative w-full h-screen flex items-center justify-center bg-black ${className}`}>
      <div className="w-full max-w-2xl aspect-square">
        <DotLottiePlayer
          src={src}
          autoplay
          onEvent={(event) => {
            if (event === 'complete') {
              onComplete();
            }
          }}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
      
      {/* Overlay to ensure text readability if needed */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 pointer-events-none" />
    </div>
  );
};

export default LottieLoader;