"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useWordCycle } from "~~/hooks/useWordCycle";

export type AnimatedHeroProps = {
  titlePrefix?: string;
  words?: string[];
  rotateMs?: number;
  description?: string;
  ctaPrimary?: {
    label: string;
    icon?: React.ElementType;
    onClick?: () => void;
    href?: string;
    variant?: "default" | "outline" | "secondary";
  };
  ctaSecondary?: {
    label: string;
    icon?: React.ElementType;
    onClick?: () => void;
    href?: string;
    variant?: "default" | "outline" | "secondary";
  };
  className?: string;
};

// Memoized animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      when: "beforeChildren",
    },
  },
};

const childVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 20,
    }
  },
};

const wordVariants = {
  enter: { opacity: 0, y: 24 },
  center: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 20,
    }
  },
  exit: { 
    opacity: 0, 
    y: -24,
    transition: {
      duration: 0.2,
    }
  },
};

export function AnimatedHero({
  titlePrefix = "The Future of",
  words = ["Prediction Markets", "Decentralized Betting", "Market Analysis"],
  rotateMs = 3000,
  description = "Explore and analyze prediction markets across multiple platforms. Get insights, compare odds, and make informed decisions.",
  ctaPrimary = {
    label: "Start Exploring",
    href: "#market-section",
  },
  ctaSecondary = {
    label: "Learn More",
    href: "/about",
  },
  className = "",
}: AnimatedHeroProps) {
  const [currentWord, isHovered, setIsHovered] = useWordCycle(words, rotateMs);
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const renderCTA = (cta: AnimatedHeroProps["ctaPrimary"], isPrimary = true) => {
    if (!cta) return null;

    const Icon = cta.icon || (isPrimary ? ArrowRightIcon : undefined);
    const className = isPrimary
      ? "group inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-content shadow-sm transition-all duration-200 hover:bg-primary/90"
      : "text-sm font-semibold leading-6 text-base-content transition-colors hover:text-primary";

    const content = (
      <>
        {cta.label}
        {Icon && (
          <Icon 
            className={`h-4 w-4 ${isPrimary ? "transition-transform duration-200 group-hover:translate-x-1" : ""}`}
            aria-hidden="true"
          />
        )}
      </>
    );

    return cta.href ? (
      <Link
        href={cta.href}
        className={className}
        onClick={cta.onClick}
        aria-label={`${cta.label} - ${isPrimary ? "Primary" : "Secondary"} call to action`}
      >
        {content}
      </Link>
    ) : (
      <button
        className={className}
        onClick={cta.onClick}
        aria-label={`${cta.label} - ${isPrimary ? "Primary" : "Secondary"} call to action`}
      >
        {content}
      </button>
    );
  };

  return (
    <div className={`relative overflow-hidden bg-gradient-to-b from-base-300/20 to-base-100 ${className}`}>
      <motion.div
        className="relative pt-24 pb-20 sm:pt-32 sm:pb-28"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.6 }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            {/* Top Chip */}
            <motion.div 
              variants={childVariants}
              className="mb-8 inline-flex items-center rounded-full bg-primary/10 px-3 py-1"
            >
              <span className="text-sm font-medium text-primary">Beta Version</span>
            </motion.div>

            {/* Animated Title */}
            <motion.h1 
              variants={childVariants}
              className="text-4xl font-bold tracking-tight text-base-content sm:text-6xl"
            >
              {titlePrefix}{" "}
              <span 
                className="relative inline-flex h-[calc(theme(fontSize.4xl)*1.25)] sm:h-[calc(theme(fontSize.6xl)*1.25)] overflow-hidden transform-gpu will-change-transform"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                aria-live="polite"
                aria-atomic="true"
              >
                {prefersReducedMotion ? (
                  <span className="absolute text-primary">{currentWord}</span>
                ) : (
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={currentWord}
                      className="absolute text-primary"
                      variants={wordVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                    >
                      {currentWord}
                    </motion.span>
                  </AnimatePresence>
                )}
              </span>
            </motion.h1>

            {/* Description */}
            <motion.p 
              variants={childVariants}
              className="mt-6 text-lg leading-8 text-base-content/70"
            >
              {description}
            </motion.p>

            {/* CTAs */}
            <motion.div 
              variants={childVariants}
              className="mt-10 flex items-center justify-center gap-x-6"
            >
              {renderCTA(ctaPrimary, true)}
              {renderCTA(ctaSecondary, false)}
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Compatibility export
export { AnimatedHero as Hero };
