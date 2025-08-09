"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { hardhat } from "viem/chains";
import { HomeIcon, Bars3Icon, UserIcon } from "@heroicons/react/24/outline";
import { FaucetButton, RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth";
import { cn } from "~~/lib/utils";

interface NavItem {
  name: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  {
    name: "Home",
    url: "/",
    icon: HomeIcon,
  },
  {
    name: "Profile",
    url: "/profile",
    icon: UserIcon,
  },
];

/**
 * Site header with white navbar containing navigation and wallet connection
 */
export const Header = () => {
  const { targetNetwork } = useTargetNetwork();
  const isLocalNetwork = targetNetwork.id === hardhat.id;
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState(() => {
    const currentItem = navItems.find(item => item.url === pathname);
    return currentItem ? currentItem.name : navItems[0].name;
  });

  useEffect(() => {
    const currentItem = navItems.find(item => item.url === pathname);
    if (currentItem) {
      setActiveTab(currentItem.name);
    }
  }, [pathname]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="w-full pl-16 pr-4">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo - Far Left */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <span className="font-bold text-xl text-gray-900 dark:text-white tracking-wider uppercase">ETHCLBET</span>
            </Link>
          </div>

          {/* Navigation Items - Absolute Center */}
          <div className="absolute left-1/2 transform -translate-x-1/2 hidden sm:flex items-center space-x-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.name;

              return (
                <Link
                  key={item.name}
                  href={item.url}
                  onClick={() => setActiveTab(item.name)}
                  className={cn(
                    "relative flex items-center gap-2 px-4 h-16 text-base font-semibold transition-colors duration-200",
                    isActive 
                      ? "text-primary" 
                      : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                  )}
                >
                  <span>{item.name}</span>
                  {isActive && (
                    <motion.div
                      layoutId="navbar-indicator"
                      className="absolute bottom-0 left-0 right-0 h-1 bg-primary"
                      initial={false}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                      }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Mobile Navigation Items - Center on mobile */}
          <div className="absolute left-1/2 transform -translate-x-1/2 flex sm:hidden items-center space-x-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.name;

              return (
                <Link
                  key={item.name}
                  href={item.url}
                  onClick={() => setActiveTab(item.name)}
                  className={cn(
                    "relative px-3 h-16 flex items-center text-base font-semibold transition-colors duration-200",
                    isActive 
                      ? "text-primary" 
                      : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                  )}
                >
                  <span>{item.name}</span>
                  {isActive && (
                    <motion.div
                      layoutId="navbar-indicator-mobile"
                      className="absolute bottom-0 left-0 right-0 h-1 bg-primary"
                      initial={false}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                      }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Wallet Connection - Far Right */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <RainbowKitCustomConnectButton />
            {isLocalNetwork && <FaucetButton />}
          </div>
        </div>
      </div>
    </nav>
  );
};
