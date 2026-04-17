import { A, useLocation } from '@solidjs/router';
import type { Component } from 'solid-js';

const DesktopNav: Component = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const linkClass = (path: string) =>
    `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive(path) ? 'bg-black text-white' : 'text-gray-600 hover:text-black hover:bg-gray-100'
    }`;

  return (
    <nav class="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
      <div class="max-w-4xl mx-auto px-6 h-14 md:h-16 flex items-center justify-between">
        <A href="/" class="text-xl font-bold text-black tracking-tight">
          Listwell
        </A>
        <div class="hidden md:flex items-center gap-2">
          <A href="/" class={linkClass('/')}>Home</A>
          <A href="/search" class={linkClass('/search')}>Search</A>
          <A href="/profile" class={linkClass('/profile')}>Profile</A>
        </div>
      </div>
    </nav>
  );
};

export default DesktopNav;
