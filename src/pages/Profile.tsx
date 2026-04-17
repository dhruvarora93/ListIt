import { Component, createResource, createSignal, For, Show } from 'solid-js';
import { store, getListsByOwner, getSavesByUser, getListById, type List } from '../store/data';
import ListCard from '../components/ListCard';

const Profile: Component = () => {
  const [subTab, setSubTab] = createSignal<'my' | 'saved'>('my');

  const userId = () => store.currentUser()?.id;

  const [myLists] = createResource(userId, getListsByOwner);
  const [saves] = createResource(userId, (uid) => getSavesByUser(uid));

  // Load saved lists
  const [savedLists] = createResource(
    () => saves(),
    async (saveRecords) => {
      if (!saveRecords) return [];
      const lists: List[] = [];
      for (const save of saveRecords) {
        try {
          const list = await getListById(save.list);
          lists.push(list);
        } catch {}
      }
      return lists;
    }
  );

  const totalItems = () => {
    // Approximate from list count
    return myLists()?.length ?? 0;
  };

  const user = () => store.currentUser();

  return (
    <div class="px-4 py-6 max-w-2xl mx-auto">
      <Show when={user()} fallback={
        <div class="flex justify-center py-12">
          <div class="w-6 h-6 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
        </div>
      }>
        {/* Hero */}
        <div class="flex items-center gap-4 mb-6">
          <img
            src={user()!.avatar_url}
            alt={user()!.display_name}
            class="w-20 h-20 rounded-full bg-gray-100"
          />
          <div>
            <h1 class="text-xl font-bold text-gray-900">{user()!.display_name}</h1>
            <p class="text-sm text-gray-500">@{user()!.handle}</p>
            <p class="text-sm text-gray-600 mt-1">{user()!.bio}</p>
          </div>
        </div>

        {/* Stats */}
        <div class="flex gap-6 mb-6 py-3 border-y border-gray-100">
          <div class="text-center">
            <div class="text-lg font-bold text-gray-900">{myLists()?.length ?? 0}</div>
            <div class="text-xs text-gray-500">Lists</div>
          </div>
        </div>

        {/* Sub-tabs */}
        <div class="flex gap-4 mb-6 border-b border-gray-200">
          <button
            onClick={() => setSubTab('my')}
            class={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              subTab() === 'my'
                ? 'border-black text-black'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            My Lists
          </button>
          <button
            onClick={() => setSubTab('saved')}
            class={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              subTab() === 'saved'
                ? 'border-black text-black'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            Saved
          </button>
        </div>

        {/* Content */}
        <Show when={subTab() === 'my'}>
          <div class="grid gap-3 sm:grid-cols-2">
            <For each={myLists()} fallback={
              <p class="text-gray-400 text-sm py-8 text-center col-span-2">No lists yet</p>
            }>
              {(list) => <ListCard list={list} />}
            </For>
          </div>
        </Show>

        <Show when={subTab() === 'saved'}>
          <div class="grid gap-3 sm:grid-cols-2">
            <For each={savedLists()} fallback={
              <p class="text-gray-400 text-sm py-8 text-center col-span-2">No saved lists yet</p>
            }>
              {(list) => (
                <ListCard
                  list={list}
                  ownerName={list.expand?.owner?.display_name}
                />
              )}
            </For>
          </div>
        </Show>
      </Show>
    </div>
  );
};

export default Profile;
