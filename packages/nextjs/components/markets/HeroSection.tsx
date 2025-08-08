

"use client";

import React, { CSSProperties } from 'react';
import Scroller from '../Scroller';
import { FaucetButton, RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import React, { CSSProperties } from 'react';
import Scroller from '../Scroller';
import { FaucetButton, RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";

interface HeroSectionProps {
  className?: string;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ className = "" }) => {
  const heroStyle: CSSProperties = {
    // Pure white background
    backgroundColor: '#ffffff',
    // Simple layout
    padding: '80px 20px',
    // Ensure proper positioning
    position: 'relative',
    // Pure white background
    backgroundColor: '#ffffff',
    // Simple layout
    padding: '80px 20px',
    // Ensure proper positioning
    position: 'relative',
  };

  return (
    <div
      className={`relative w-full h-[800px] flex items-center justify-center ${className}`}
      className={`relative w-full h-[800px] flex items-center justify-center ${className}`}
      style={heroStyle}
    >
      {/* Hero Content - Centered */}
      <div className="text-center text-gray-900 max-w-4xl px-8 w-full">
        <h1
          className="mb-10 tracking-tight text-center leading-tight"
          style={{
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '4.5rem',
            fontWeight: '800',
            color: '#746097',
            lineHeight: '1.1',
            textShadow: 'none'
          }}
        >
          Enhanced Prediction Markets Hub
        </h1>
        <p
          className="text-center leading-relaxed"
          style={{
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '1.5rem',
            fontWeight: '400',
            color: '#4b5563',
            opacity: 1,
            textShadow: 'none'
          }}
        >
          Unified market data with intelligent combination and real volume tracking.
        </p>

        {/* Crypto Icons Scroller */}
        <div className="mt-12 w-full max-w-6xl">
          <Scroller speed={25} iconSize={40} spacing={60} />
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center items-center relative z-10">
          {/* <button
            className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
            style={{ backgroundColor: '#746097' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5d4d7a'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#746097'}
          >
            Connect Wallet
          </button> */}
          <div className="flex items-center gap-4">
            
          </div>
          <button
            className="relative z-10 pointer-events-auto px-8 py-3 bg-transparent border-2 text-gray-700 font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:bg-gray-50"
            style={{ borderColor: '#746097', color: '#746097' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#746097';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#746097';
            }}
            onClick={() => {
              const el = document.getElementById('market-section');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }}
          >
            Explore Market
          </button>
        </div>
      </div>
    </div>
  );
};



