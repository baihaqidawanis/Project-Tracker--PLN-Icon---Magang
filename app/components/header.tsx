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
    <div className="bg-gradient-to-r from-cyan-400 to-blue-500 dark:bg-gradient-to-r dark:from-cyan-600 dark:to-blue-700 text-white shadow-lg fixed top-0 left-0 right-0 z-50">
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              aria-label="Toggle sidebar"
            >
              <Menu size={24} />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white">PLN Icon Plus</h1>
              <p
                className="text-white/90 mt-1 cursor-pointer hover:text-white hover:underline transition-all"
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