import { Component, createSignal, For, Show } from 'solid-js';
import { A } from '@solidjs/router';
import { searchLists, searchUsers, type List, type Profile } from '../store/data';
import ListCard from '../components/ListCard';

const Search: Component = () => {
  const [query, setQuery] = createSignal('');
  const [listResults, setListResults] = createSignal<List[]>([]);
  const [userResults, setUserResults] = createSignal<Profile[]>([]);
  const [searching, setSearching] = createSignal(false);
  const [hasSearched, setHasSearched] = createSignal(false);

  let debounceTimer: number;

  const handleSearch = (value: string) => {
    setQuery(value);
    clearTimeout(debounceTimer);

    if (!value.trim()) {
      setListResults([]);
      setUserResults([]);
      setHasSearched(false);
      return;
    }

    debounceTimer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const [lists, users] = await Promise.all([
          searchLists(value),
          searchUsers(value),
        ]);
        setListResults(lists);
        setUserResults(users);
        setHasSearched(true);
      } catch (e) {
        console.error('Search failed:', e);
      } finally {
        setSearching(false);
      }
    }, 300);
  };

  return (
    <div class="px-4 py-6 max-w-2xl mx-auto">
      <h1 class="text-2xl font-bold text-gray-900 mb-6">Search</h1>

      {/* Search input */}
      <div class="relative mb-6">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search lists, users, or categories..."
          value={query()}
          onInput={(e) => handleSearch(e.currentTarget.value)}
          class="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/10"
        />
      </div>

      {/* Loading */}
      <Show when={searching()}>
        <div class="flex justify-center py-8">
          <div class="w-6 h-6 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
        </div>
      </Show>

      {/* Results */}
      <Show when={!searching() && hasSearched()}>
        {/* Users */}
        <Show when={userResults().length > 0}>
          <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">People</h2>
          <div class="space-y-2 mb-6">
            <For each={userResults()}>
              {(user) => (
                <A
                  href={`/user/${user.handle}`}
                  class="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <img src={user.avatar_url} alt="" class="w-10 h-10 rounded-full bg-gray-100" />
                  <div>
                    <div class="font-medium text-sm text-gray-900">{user.display_name}</div>
                    <div class="text-xs text-gray-500">@{user.handle}</div>
                  </div>
                </A>
              )}
            </For>
          </div>
        </Show>

        {/* Lists */}
        <Show when={listResults().length > 0}>
          <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Lists</h2>
          <div class="grid gap-3 sm:grid-cols-2">
            <For each={listResults()}>
              {(list) => (
                <ListCard
                  list={list}
                  ownerName={list.expand?.owner?.display_name}
                />
              )}
            </For>
          </div>
        </Show>

        {/* No results */}
        <Show when={listResults().length === 0 && userResults().length === 0}>
          <div class="text-center py-12">
            <p class="text-gray-400 text-sm">No results for "{query()}"</p>
          </div>
        </Show>
      </Show>

      {/* Empty state */}
      <Show when={!hasSearched() && !searching()}>
        <div class="text-center py-12">
          <p class="text-4xl mb-3">🔍</p>
          <p class="text-gray-500 text-sm">Search by user handle, list name, or category</p>
        </div>
      </Show>
    </div>
  );
};

export default Search;
