import { Component, createResource, createSignal, For, Show } from 'solid-js';
import { A } from '@solidjs/router';
import { store, getListsByOwner, type Category } from '../store/data';
import ListCard from '../components/ListCard';

type FilterTab = 'all' | 'food_drink' | 'books';

const Home: Component = () => {
  const [activeTab, setActiveTab] = createSignal<FilterTab>('all');

  const [lists] = createResource(
    () => store.currentUser()?.id,
    (userId) => userId ? getListsByOwner(userId) : Promise.resolve([])
  );

  const filteredLists = () => {
    const all = lists() ?? [];
    const tab = activeTab();
    if (tab === 'all') return all;
    if (tab === 'food_drink') return all.filter((l) => l.category === 'food_drink');
    if (tab === 'books') return all.filter((l) => l.category === 'books' || l.category === 'music');
    return all;
  };

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'food_drink', label: 'Food & Drink' },
    { key: 'books', label: 'Books & Media' },
  ];

  return (
    <div class="px-4 py-6 max-w-2xl mx-auto">
      {/* Header */}
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">My Lists</h1>
          <p class="text-sm text-gray-500 mt-0.5">
            {lists()?.length ?? 0} lists
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div class="flex gap-2 mb-6 overflow-x-auto pb-1">
        <For each={tabs}>
          {(tab) => (
            <button
              onClick={() => setActiveTab(tab.key)}
              class={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab() === tab.key
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          )}
        </For>
      </div>

      {/* Lists */}
      <Show when={!lists.loading} fallback={
        <div class="flex justify-center py-12">
          <div class="w-6 h-6 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
        </div>
      }>
        <div class="grid gap-3 sm:grid-cols-2">
          <For each={filteredLists()} fallback={
            <p class="text-gray-400 text-sm py-8 text-center col-span-2">No lists yet</p>
          }>
            {(list) => <ListCard list={list} />}
          </For>
        </div>
      </Show>

      {/* FAB */}
      <A
        href="/create"
        class="fixed bottom-20 right-4 md:bottom-8 md:right-8 w-14 h-14 bg-black text-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-800 transition-colors z-40"
      >
        <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
      </A>
    </div>
  );
};

export default Home;
