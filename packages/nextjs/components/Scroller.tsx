"use client";

import React from 'react';
import './Scroller.css';

interface CryptoIcon {
  name: string;
  src: string;
  alt: string;
}

interface ScrollerProps {
  speed?: number; // Animation duration in seconds (default: 20)
  iconSize?: number; // Icon size in pixels (default: 48)
  spacing?: number; // Spacing between icons in pixels (default: 48)
  className?: string;
}

const Scroller: React.FC<ScrollerProps> = ({
  speed = 20,
  iconSize = 48,
  spacing = 48,
  className = ""
}) => {
  // Crypto icons array
  const cryptoIcons: CryptoIcon[] = [
    { name: 'Bitcoin', src: '/icons/btc.svg', alt: 'Bitcoin' },
    { name: 'Ethereum', src: '/icons/eth.svg', alt: 'Ethereum' },
    { name: 'USDC', src: '/icons/usdc.svg', alt: 'USD Coin' },
    { name: 'Tether', src: '/icons/usdt.svg', alt: 'Tether' },
    { name: 'DAI', src: '/icons/dai.svg', alt: 'DAI Stablecoin' },
    { name: 'BNB', src: '/icons/bnb.svg', alt: 'Binance Coin' },
  ];

  // Duplicate the icons array to create seamless loop
  const duplicatedIcons = [...cryptoIcons, ...cryptoIcons];

  // Dynamic styles
  const containerStyle: React.CSSProperties = {
    '--animation-duration': `${speed}s`,
  } as React.CSSProperties;

  const iconStyle: React.CSSProperties = {
    width: `${iconSize}px`,
    height: `${iconSize}px`,
    marginRight: `${spacing}px`,
  };

  const trackStyle: React.CSSProperties = {
    animationDuration: `${speed}s`,
  };

  return (
    <div className="scroller-wrapper">
      <div
        className={`scroller-container ${className}`}
        style={containerStyle}
      >
        <div
          className="scroller-track"
          style={trackStyle}
        >
          {duplicatedIcons.map((icon, index) => (
            <div
              key={`${icon.name}-${index}`}
              className="scroller-icon"
              style={iconStyle}
              title={icon.name}
            >
              <img
                src={icon.src}
                alt={icon.alt}
                loading="lazy"
                draggable={false}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Scroller;