'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Layers,
  FileCode,
  Sliders,
  PlayCircle,
  MoreVertical,
  Sun,
  Moon,
  Laptop,
  RefreshCw,
  ExternalLink,
  Beer,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Network,
} from 'lucide-react';
import { ThemeMode, applyThemeToDom } from '@/lib/theme';

export type StudioTab = 'topology' | 'modelfiles' | 'models' | 'configs' | 'playground';

interface HeaderProps {
  activeTab: StudioTab;
  setActiveTab: (tab: StudioTab) => void;
  status: {
    online: boolean;
    version?: string | null;
    host?: string;
    modelfileCount?: number;
  };
  onRefreshStatus: () => void;
}

export function Header({
  activeTab,
  setActiveTab,
  status,
  onRefreshStatus,
}: HeaderProps) {
  const [themeMode, setThemeMode] = useState<ThemeMode>('auto');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = (localStorage.getItem('theme-mode') as ThemeMode) || 'auto';
    setThemeMode(saved);
    applyThemeToDom(saved);

    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handleMediaChange = () => {
      const current = (localStorage.getItem('theme-mode') as ThemeMode) || 'auto';
      if (current === 'auto') {
        applyThemeToDom('auto');
      }
    };
    mql.addEventListener('change', handleMediaChange);

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      mql.removeEventListener('change', handleMediaChange);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleThemeChange = (mode: ThemeMode) => {
    setThemeMode(mode);
    localStorage.setItem('theme-mode', mode);
    applyThemeToDom(mode);
  };

  const navItems = [
    { id: 'topology' as const, label: 'Ecosystem Map', icon: Network },
    { id: 'modelfiles' as const, label: 'Custom Modelfiles', icon: FileCode, count: status.modelfileCount },
    { id: 'models' as const, label: 'Installed Models', icon: Layers },
    { id: 'configs' as const, label: 'Config Viewer', icon: Sliders },
    { id: 'playground' as const, label: 'Playground', icon: PlayCircle },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-md transition-colors dark:border-slate-800 dark:bg-[#090d16]/90">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand Logo & Title */}
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-indigo-700 shadow-md shadow-indigo-500/20 text-white">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white sm:text-lg">
                Ollama Models Studio
              </span>
              <span className="rounded-md border border-indigo-200 bg-indigo-50 px-1.5 py-0.5 text-[11px] font-medium text-indigo-700 dark:border-indigo-800/60 dark:bg-indigo-950/40 dark:text-indigo-300">
                Hermes Ready
              </span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                {status.online ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    <span>v{status.version || 'running'}</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-3.5 w-3.5 text-rose-500" />
                    <span>Offline</span>
                  </>
                )}
              </span>
              <span>•</span>
              <span className="font-mono text-[11px] opacity-75">11434</span>
            </div>
          </div>
        </div>

        {/* Desktop Navigation Tabs */}
        <nav className="hidden md:flex items-center space-x-1 rounded-xl border border-slate-200 bg-slate-100/80 p-1 dark:border-slate-800 dark:bg-slate-900/60">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-white text-indigo-600 shadow-xs dark:bg-slate-800 dark:text-indigo-400'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
                {typeof item.count === 'number' && item.count > 0 && (
                  <span
                    className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] ${
                      isActive
                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                        : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Header Actions */}
        <div className="flex items-center space-x-2" ref={menuRef}>
          {/* Quick Refresh Button */}
          <button
            onClick={onRefreshStatus}
            title="Refresh Ollama Status"
            className="rounded-lg border border-slate-200 p-2 text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <RefreshCw className="h-4 w-4" />
          </button>

          {/* Context Menu Button (Standard: data-brand-context-menu="true") */}
          <div className="relative">
            <button
              data-brand-context-menu="true"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="More options"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-xl backdrop-blur-lg dark:border-slate-800 dark:bg-slate-900 z-50">
                {/* Theme Selector Section (3-State Standard) */}
                <div className="px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    테마 설정
                  </p>
                  <div className="mt-1.5 grid grid-cols-3 gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-950">
                    <button
                      onClick={() => handleThemeChange('auto')}
                      className={`flex flex-col items-center justify-center rounded-md py-1.5 text-[11px] font-medium transition-all ${
                        themeMode === 'auto'
                          ? 'bg-white text-indigo-600 shadow-xs dark:bg-slate-800 dark:text-indigo-400'
                          : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                      }`}
                    >
                      <Laptop className="mb-0.5 h-3.5 w-3.5" />
                      자동
                    </button>
                    <button
                      onClick={() => handleThemeChange('light')}
                      className={`flex flex-col items-center justify-center rounded-md py-1.5 text-[11px] font-medium transition-all ${
                        themeMode === 'light'
                          ? 'bg-white text-indigo-600 shadow-xs dark:bg-slate-800 dark:text-indigo-400'
                          : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                      }`}
                    >
                      <Sun className="mb-0.5 h-3.5 w-3.5" />
                      라이트
                    </button>
                    <button
                      onClick={() => handleThemeChange('dark')}
                      className={`flex flex-col items-center justify-center rounded-md py-1.5 text-[11px] font-medium transition-all ${
                        themeMode === 'dark'
                          ? 'bg-white text-indigo-600 shadow-xs dark:bg-slate-800 dark:text-indigo-400'
                          : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                      }`}
                    >
                      <Moon className="mb-0.5 h-3.5 w-3.5" />
                      다크
                    </button>
                  </div>
                </div>

                <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                {/* Mobile Navigation fallback */}
                <div className="md:hidden px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                    메뉴 이동
                  </p>
                  <div className="space-y-1">
                    {navItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setMenuOpen(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium ${
                          activeTab === item.id
                            ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400'
                            : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <item.icon className="h-3.5 w-3.5" />
                          <span>{item.label}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                {/* Support & Ecosystem (Mandatory Rule) */}
                <div className="p-1">
                  <p className="px-2 pt-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    서포트 & 생태계
                  </p>
                  <a
                    href="https://brand-ui.on-tap.xyz/donate"
                    target="_blank"
                    rel="noopener noreferrer"
                    data-brand-open-donate="true"
                    onClick={() => {
                      if (typeof window !== 'undefined' && (window as unknown as { BrandUI?: { openDonate?: () => void } }).BrandUI?.openDonate) {
                        (window as unknown as { BrandUI: { openDonate: () => void } }).BrandUI.openDonate();
                      }
                    }}
                    className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium text-amber-600 transition-colors hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/30"
                  >
                    <span className="flex items-center space-x-2">
                      <Beer className="h-4 w-4 text-amber-500" />
                      <span>🍺 Buy me a beer (후원하기)</span>
                    </span>
                    <ExternalLink className="h-3 w-3 opacity-60" />
                  </a>
                  <a
                    href="https://dev.on-tap.xyz"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <span className="flex items-center space-x-2">
                      <span>🚀 개발자 페이지 (On Tap)</span>
                    </span>
                    <ExternalLink className="h-3 w-3 opacity-60" />
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
