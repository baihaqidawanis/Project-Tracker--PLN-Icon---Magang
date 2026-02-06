'use client';

import React, { useState } from 'react';
import { Moon, Sun, Menu, LogOut, User, Loader2 } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';

interface HeaderProps {
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (value: boolean) => void;
  setActiveTab: (tab: string) => void;
}

export default function Header({ darkMode, setDarkMode, sidebarCollapsed, setSidebarCollapsed, setActiveTab }: HeaderProps) {
  const { data: session } = useSession();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut({ callbackUrl: '/login', redirect: true });
    } catch (error) {
      setIsLoggingOut(false);
    }
  };

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

          {/* User Info & Actions */}
          <div className="flex items-center gap-3">
            {/* User Info */}
            {session?.user && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg">
                <User size={16} />
                <span className="text-sm font-medium text-white">{session.user.name}</span>
              </div>
            )}

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              title="Logout"
            >
              {isLoggingOut ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <LogOut size={18} />
              )}
              <span className="hidden sm:inline text-sm font-medium">
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}