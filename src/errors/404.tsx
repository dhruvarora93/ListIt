import { A } from '@solidjs/router';

export default function NotFound() {
  return (
    <div class="px-4 py-16 max-w-2xl mx-auto text-center">
      <p class="text-5xl mb-4">🤷</p>
      <h1 class="text-2xl font-bold text-gray-900 mb-2">Page not found</h1>
      <p class="text-sm text-gray-500 mb-8">The page you're looking for doesn't exist.</p>
      <A
        href="/"
        class="px-6 py-3 bg-black text-white rounded-xl font-medium text-sm hover:bg-gray-800 transition-colors"
      >
        Go Home
      </A>
    </div>
  );
}
