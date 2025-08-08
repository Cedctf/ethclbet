"use client";

import React from 'react';
import Scroller from './Scroller';

const ScrollerDemo: React.FC = () => {
  return (
    <div className="w-full py-8 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-2xl font-bold text-center mb-8 text-gray-800">
          Crypto Scroller Conveyor Belt 🍣
        </h2>

        {/* Default speed */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">Default Speed (20s)</h3>
          <Scroller />
        </div>

        {/* Fast speed */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">Fast Speed (10s)</h3>
          <Scroller speed={10} />
        </div>

        {/* Slow speed with larger icons */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">Slow & Large (30s, 64px icons)</h3>
          <Scroller speed={30} iconSize={64} spacing={64} />
        </div>

        {/* Compact version */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">Compact Version (15s, 32px icons)</h3>
          <Scroller speed={15} iconSize={32} spacing={32} />
        </div>
      </div>
    </div>
  );
};

export default ScrollerDemo;