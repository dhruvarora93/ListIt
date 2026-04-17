import { Component, createSignal, Show } from 'solid-js';
import type { List } from '../store/data';

interface ShareSheetProps {
  list: List;
  open: boolean;
  onClose: () => void;
}

const ShareSheet: Component<ShareSheetProps> = (props) => {
  const [copied, setCopied] = createSignal(false);

  const shareUrl = () => `${window.location.origin}/list/${props.list.id}`;

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareTargets = [
    { name: 'WhatsApp', icon: '💬', url: () => `https://wa.me/?text=${encodeURIComponent(props.list.title + ' ' + shareUrl())}` },
    { name: 'Messages', icon: '💭', url: () => `sms:?body=${encodeURIComponent(props.list.title + ' ' + shareUrl())}` },
    { name: 'Email', icon: '📧', url: () => `mailto:?subject=${encodeURIComponent(props.list.title)}&body=${encodeURIComponent(shareUrl())}` },
    { name: 'Twitter', icon: '🐦', url: () => `https://twitter.com/intent/tweet?text=${encodeURIComponent(props.list.title)}&url=${encodeURIComponent(shareUrl())}` },
  ];

  return (
    <Show when={props.open}>
      {/* Backdrop */}
      <div
        class="fixed inset-0 bg-black/40 z-50 transition-opacity"
        onClick={props.onClose}
      />

      {/* Sheet */}
      <div class="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl p-6 max-w-lg mx-auto animate-slide-up">
        <div class="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />

        <h3 class="font-semibold text-lg mb-4">Share this list</h3>

        {/* URL */}
        <div class="flex items-center gap-2 bg-gray-50 rounded-lg p-3 mb-4">
          <span class="text-sm text-gray-600 truncate flex-1">{shareUrl()}</span>
          <button
            onClick={copyLink}
            class="shrink-0 px-3 py-1.5 bg-black text-white text-sm rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            {copied() ? '✓ Copied' : 'Copy'}
          </button>
        </div>

        {/* Share targets */}
        <div class="grid grid-cols-4 gap-3 mb-6">
          {shareTargets.map((target) => (
            <a
              href={target.url()}
              target="_blank"
              rel="noopener"
              class="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <span class="text-2xl">{target.icon}</span>
              <span class="text-xs text-gray-600">{target.name}</span>
            </a>
          ))}
        </div>

        <button
          onClick={props.onClose}
          class="w-full py-3 text-gray-500 text-sm font-medium"
        >
          Cancel
        </button>
      </div>
    </Show>
  );
};

export default ShareSheet;
