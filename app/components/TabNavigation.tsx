'use client';

import React from 'react';
import { Home, FileText, Users, FileStack, Settings, DollarSign } from 'lucide-react';

interface TabNavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  collapsed: boolean;
}

const tabs = [
  { id: 'pivot', label: 'Pivot', icon: Home },
  { id: 'report', label: 'Report', icon: FileText },
  { id: 'partnership', label: 'Partnership', icon: Users },
  { id: 'page', label: 'Page', icon: FileStack },
  { id: 'master', label: 'Master', icon: Settings },
  { id: 'pkr-opex', label: 'PKR Opex', icon: DollarSign },
];

export default function TabNavigation({ activeTab, setActiveTab, collapsed }: TabNavigationProps) {
  return (
    <div
      className={`fixed left-0 top-[104px] bottom-0 bg-gray-900 dark:bg-gray-950 border-r border-gray-700 dark:border-gray-800 transition-all duration-300 z-40 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      <nav className="flex flex-col py-4">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-3 transition-colors relative group ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 dark:hover:bg-gray-900'
              }`}
              title={collapsed ? tab.label : undefined}
            >
              <Icon size={20} className="flex-shrink-0" />
              {!collapsed && <span className="font-medium">{tab.label}</span>}
              
              {/* Tooltip for collapsed state */}
              {collapsed && (
                <span className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  {tab.label}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}