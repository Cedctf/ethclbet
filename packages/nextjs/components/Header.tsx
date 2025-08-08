"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { hardhat } from "viem/chains";
import { HomeIcon, BugAntIcon, Bars3Icon } from "@heroicons/react/24/outline";
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
    name: "Debug Contracts",
    url: "/debug",
    icon: BugAntIcon,
  },
];

export const NavBar = () => {
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
    <div className="fixed bottom-0 sm:top-0 left-1/2 -translate-x-1/2 z-50 mb-6 sm:pt-6">
      <div className="flex items-center gap-3 bg-base-100/5 border border-base-300 backdrop-blur-lg py-1 px-1 rounded-full shadow-lg">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.name;

          return (
            <Link
              key={item.name}
              href={item.url}
              onClick={() => setActiveTab(item.name)}
              className={cn(
                "relative cursor-pointer text-sm font-semibold px-6 py-2 rounded-full transition-colors",
                "text-base-content/80 hover:text-primary",
                isActive && "bg-base-200 text-primary",
              )}
            >
              <span className="hidden md:inline">{item.name}</span>
              <span className="md:hidden">
                <Icon className="h-[18px] w-[18px]" />
              </span>
              {isActive && (
                <motion.div
                  layoutId="lamp"
                  className="absolute inset-0 w-full bg-primary/5 rounded-full -z-10"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  }}
                >
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-t-full">
                    <div className="absolute w-12 h-6 bg-primary/20 rounded-full blur-md -top-2 -left-2" />
                    <div className="absolute w-8 h-6 bg-primary/20 rounded-full blur-md -top-1" />
                    <div className="absolute w-4 h-4 bg-primary/20 rounded-full blur-sm top-0 left-2" />
                  </div>
                </motion.div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Site header with transparent navbar and wallet connection
 */
export const Header = () => {
  const { targetNetwork } = useTargetNetwork();
  const isLocalNetwork = targetNetwork.id === hardhat.id;
  const burgerMenuRef = useRef<HTMLDetailsElement>(null);

  return (
    <div className="sticky lg:static top-0 navbar bg-base-100 min-h-0 shrink-0 justify-between z-20 border-b border-gray-200 dark:border-gray-700 px-0 sm:px-2">
      <div className="navbar-start w-auto lg:w-1/2">
        <details className="dropdown" ref={burgerMenuRef}>
          <summary className="ml-1 btn btn-ghost lg:hidden hover:bg-transparent">
            <Bars3Icon className="h-1/2" />
          </summary>
          <ul
            className="menu menu-compact dropdown-content mt-3 p-2 shadow-sm bg-base-100 rounded-box w-52"
            onClick={() => {
              burgerMenuRef?.current?.removeAttribute("open");
            }}
          >
            <HeaderMenuLinks />
          </ul>
        </details>
        <Link href="/" passHref className="hidden lg:flex items-center gap-2 ml-4 mr-6 shrink-0">
          <div className="flex relative w-10 h-10">
            <Image alt="SE2 logo" className="cursor-pointer" fill src="/logo.svg" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold leading-tight">Scaffold-ETH</span>
            <span className="text-xs">Ethereum dev stack</span>
          </div>
        </Link>
      </div>

      {/* Wallet Connection - Fixed top right */}
      <div className="fixed top-6 right-8 z-50">
        <div className="flex items-center gap-4">
          <RainbowKitCustomConnectButton />
          {isLocalNetwork && <FaucetButton />}
        </div>
      </div>

      {/* Transparent Navigation Bar */}
      <NavBar />
    </>
  );
};
