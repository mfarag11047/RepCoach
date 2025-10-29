import React from 'react';
import type { Tab } from '../types';
import type { LucideProps } from 'lucide-react';

interface NavItem {
  id: Tab;
  label: string;
  icon: React.ComponentType<LucideProps>;
}

interface BottomNavProps {
  items: NavItem[];
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ items, activeTab, setActiveTab }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-dark-surface/80 backdrop-blur-lg border-t border-gray-200 dark:border-white/10 shadow-lg z-50">
      <div className="flex justify-around max-w-xl mx-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex flex-col items-center justify-center w-full pt-3 pb-2 transition-colors duration-300 ease-in-out group ${
                isActive ? 'text-brand-primary' : 'text-slate-500 dark:text-dark-text-secondary hover:text-slate-900 dark:hover:text-dark-text-primary'
              }`}
            >
              <div className={`absolute top-0 w-12 h-16 rounded-b-xl transition-all duration-300 ${isActive ? 'bg-brand-primary/10' : 'bg-transparent group-hover:bg-black/5 dark:group-hover:bg-white/5'}`}></div>
              <Icon size={24} className="z-10"/>
              <span className="text-xs mt-1 z-10">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;