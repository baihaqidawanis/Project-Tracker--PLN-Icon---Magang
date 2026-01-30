'use client';

import React from 'react';
import { Moon, Sun, Menu } from 'lucide-react';

interface HeaderProps {
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (value: boolean) => void;
  setActiveTab: (tab: string) => void;
}

export default function Header({ darkMode, setDarkMode, sidebarCollapsed, setSidebarCollapsed, setActiveTab }: HeaderProps) {
  return (
    <div className="bg-[#00A3E0] dark:bg-[#0082B8] text-white shadow-lg fixed top-0 left-0 right-0 z-50">
      <div className="px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              aria-label="Toggle sidebar"
            >
              <Menu size={20} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white leading-tight">PLN Icon Plus</h1>
              <p
                className="text-xs text-white/90 cursor-pointer hover:text-white hover:underline transition-all"
                onClick={() => setActiveTab('partnership')}
                title="Click to go to Partnership tab"
              >
                Partnership Project Tracker
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}