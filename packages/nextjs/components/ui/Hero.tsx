"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { useState, useEffect } from "react";
import { OasisIcon, PolygonIcon, GraphIcon, EthereumIcon } from "./TokenIcons";

interface TokenInfo {
  symbol: string;
  name: string;
  Icon: React.FC<{ className?: string }>;
  color: string;
}

const tokens: TokenInfo[] = [
  { 
    symbol: "ROSE", 
    name: "Oasis", 
    Icon: OasisIcon,
    color: "#0987F4"
  },
  { 
    symbol: "MATIC", 
    name: "Polygon", 
    Icon: PolygonIcon,
    color: "#8247E5"
  },
  { 
    symbol: "GRT", 
    name: "The Graph", 
    Icon: GraphIcon,
    color: "#6747ED"
  },
  { 
    symbol: "ETH", 
    name: "Ethereum", 
    Icon: EthereumIcon,
    color: "#627EEA"
  }
];

interface HeroProps {
  description?: string;
  primaryCTA?: {
    text: string;
    href: string;
  };
  secondaryCTA?: {
    text: string;
    href: string;
  };
}

function useTokenCycle(tokens: TokenInfo[], rotateMs: number) {
  const [index, setIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isTabVisible, setIsTabVisible] = useState(true);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabVisible(!document.hidden);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    const interval = setInterval(() => {
      if (!isHovered && isTabVisible) {
        setIndex((current) => (current + 1) % tokens.length);
      }
    }, rotateMs);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(interval);
    };
  }, [isHovered, isTabVisible, tokens.length, rotateMs]);

  return {
    currentToken: tokens[index],
    isHovered,
    setIsHovered
  };
}

export const Hero = ({
  description = "Explore and analyze prediction markets across multiple platforms. Get insights, compare odds, and make informed decisions.",
  primaryCTA = {
    text: "Start Exploring",
    href: "/EnhancedMarketDashboard",
  },
  secondaryCTA = {
    text: "Learn More",
    href: "/about",
  },
}: HeroProps) => {
  const { currentToken, isHovered, setIsHovered } = useTokenCycle(tokens, 3000);
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches 
    : false;

  return (
    <div className="relative overflow-hidden">
      <div className="relative pt-24 pb-20 sm:pt-32 sm:pb-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">

            {/* Animated Title */}
            <h1 className="text-4xl font-bold tracking-tight text-base-content sm:text-6xl flex flex-col items-center gap-4">
              <div>The Future of</div>
              <span 
                className="relative inline-flex h-[60px] sm:h-[80px] min-w-[300px] overflow-hidden transform-gpu will-change-transform"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                aria-live="polite"
              >
                {prefersReducedMotion ? (
                  <span className="absolute inset-0 flex items-center justify-center gap-4">
                    <currentToken.Icon className="w-12 h-12" />
                    <span className="text-3xl sm:text-5xl" style={{ color: currentToken.color }}>{currentToken.name}</span>
                  </span>
                ) : (
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={currentToken.symbol}
                      className="absolute inset-0 flex items-center justify-center gap-4"
                      initial={{ y: 50, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -50, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                    >
                      <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                      >
                        <currentToken.Icon className="w-12 h-12" />
                      </motion.div>
                      <span className="text-3xl sm:text-5xl" style={{ color: currentToken.color }}>{currentToken.name}</span>
                    </motion.span>
                  </AnimatePresence>
                )}
              </span>
            </h1>

            {/* Description */}
            <p className="mt-6 text-lg leading-8 text-base-content/70">
              {description}
            </p>

            {/* CTAs */}
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <a
                href={primaryCTA.href}
                className="group inline-flex items-center gap-2 rounded-lg bg-primary/80 border border-base-300 backdrop-blur-lg px-6 py-3 text-sm font-semibold text-primary-content transition-all duration-200 hover:bg-primary/60"
              >
                {primaryCTA.text}
                <ArrowRightIcon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </a>
              <a
                href={secondaryCTA.href}
                className="group inline-flex items-center gap-2 rounded-lg bg-black border border-base-300 backdrop-blur-lg px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-black/60"
              >
                {secondaryCTA.text}
                <ArrowRightIcon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};