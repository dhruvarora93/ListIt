import { A, useLocation } from '@solidjs/router';
import type { Component } from 'solid-js';

const BottomNav: Component = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:hidden">
      <div class="flex justify-around items-center h-16 max-w-lg mx-auto">
        <A
          href="/"
          class={`flex flex-col items-center justify-center w-full h-full transition-colors ${
            isActive('/') ? 'text-black' : 'text-gray-400'
          }`}
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span class="text-xs mt-1 font-medium">Home</span>
        </A>

        <A
          href="/search"
          class={`flex flex-col items-center justify-center w-full h-full transition-colors ${
            isActive('/search') ? 'text-black' : 'text-gray-400'
          }`}
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span class="text-xs mt-1 font-medium">Search</span>
        </A>

        <A
          href="/profile"
          class={`flex flex-col items-center justify-center w-full h-full transition-colors ${
            isActive('/profile') ? 'text-black' : 'text-gray-400'
          }`}
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span class="text-xs mt-1 font-medium">Profile</span>
        </A>
      </div>
    </nav>
  );
};

export default BottomNav;
