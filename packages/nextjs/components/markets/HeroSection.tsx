"use client";

import React, { CSSProperties, useRef, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface HeroSectionProps {
  className?: string;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ className = "" }) => {
  const heroRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Parallax effect - background moves slower than scroll
  const parallaxOffset = scrollY * 0.5;

  const heroStyle: CSSProperties = {
    // Purple background
    backgroundColor: '#746097',
    // Clip path for diagonal edge
    clipPath: 'polygon(0 0, 100% 0, 100% 85%, 0% 100%)',
    // Layout
    padding: '100px 40px',
    zIndex: 1,
    // Transform for parallax
    transform: `translateY(${parallaxOffset}px)`,
  };

  return (
    <div
      ref={heroRef}
      className={`relative w-full h-[700px] overflow-hidden mt-20 sm:mt-24 ${className}`}
      style={heroStyle}
    >
      {/* Hero Content - Centered and Moved Up */}
      <div className="absolute inset-0 z-10 flex items-start justify-center pt-32 sm:pt-40">
        <div className="text-center text-white max-w-4xl px-8 w-full">
          <h1
            className="mb-8 tracking-tight text-center leading-tight"
            style={{
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontSize: '4rem',
              fontWeight: '800',
              color: '#ffffff',
              lineHeight: '1'
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
              color: '#ffffff',
              opacity: 0.9
            }}
          >
            Unified market data with intelligent combination and real volume tracking
          </p>
        </div>
      </div>

      {/* Floating Character Image */}
      <div
        className="absolute bottom-0 left-1/2 transform -translate-x-1/2"
        style={{ zIndex: 2 }}
      >
        <img
          src="/assets/images/character-float.png"
          alt="Floating Character"
          className="max-h-64 object-contain"
        />
      </div>
    </div>
  );
};