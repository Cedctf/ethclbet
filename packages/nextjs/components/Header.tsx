"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { hardhat } from "viem/chains";
import { Bars3Icon, BugAntIcon } from "@heroicons/react/24/outline";
import { FaucetButton, RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useOutsideClick, useTargetNetwork } from "~~/hooks/scaffold-eth";

type HeaderMenuLink = {
  label: string;
  href: string;
  icon?: React.ReactNode;
};

export const menuLinks: HeaderMenuLink[] = [
  {
    label: "Home",
    href: "/",
  },
  {
    label: "Debug Contracts",
    href: "/debug"
  },
];

export const HeaderMenuLinks = () => {
  const pathname = usePathname();

  return (
    <>
      {menuLinks.map(({ label, href, icon }) => {
        const isActive = pathname === href;
        return (
          <li key={href}>
            <Link
              href={href}
              passHref
              className={`${
                isActive ? "!text-black dark:!text-white font-semibold" : "!text-black/70 dark:!text-white/70"
              } hover:!text-black dark:hover:!text-white py-2 px-4 text-sm font-medium transition-colors duration-200 tracking-wide uppercase`}
            >
              {icon}
              <span>{label}</span>
            </Link>
          </li>
        );
      })}
    </>
  );
};

/**
 * Site header
 */
export const Header = () => {
  const { targetNetwork } = useTargetNetwork();
  const isLocalNetwork = targetNetwork.id === hardhat.id;

  const burgerMenuRef = useRef<HTMLDetailsElement>(null);
  useOutsideClick(burgerMenuRef, () => {
    burgerMenuRef?.current?.removeAttribute("open");
  });

  return (
    <div className="sticky lg:static top-0 navbar bg-white dark:bg-black min-h-0 shrink-0 z-20 px-8 py-6 shadow-sm">
      <div className="navbar-start w-auto lg:w-1/4">
        <Link href="/" passHref className="flex items-center">
          <span className="font-bold text-xl text-base-content tracking-wider uppercase">ETHCLBET</span>
        </Link>
        <div className="lg:hidden ml-4">
          <details className="dropdown" ref={burgerMenuRef}>
            <summary className="btn btn-ghost hover:bg-transparent text-base-content">
              <Bars3Icon className="h-6 w-6" />
            </summary>
            <ul
              className="menu menu-compact dropdown-content mt-3 p-2 shadow-lg bg-white dark:bg-black rounded-lg w-52 border border-gray-300 dark:border-gray-600"
              onClick={() => {
                burgerMenuRef?.current?.removeAttribute("open");
              }}
            >
              <HeaderMenuLinks />
            </ul>
          </details>
        </div>
      </div>
      <div className="navbar-center hidden lg:flex lg:w-1/2 justify-center">
        <ul className="flex items-center justify-center gap-12">
          <HeaderMenuLinks />
        </ul>
      </div>
      <div className="navbar-end w-auto lg:w-1/4 justify-end">
        <div className="flex items-center gap-4">
          <RainbowKitCustomConnectButton />
          {isLocalNetwork && <FaucetButton />}
        </div>
      </div>
    </div>
  );
};
