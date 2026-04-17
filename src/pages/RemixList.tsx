import { Component, createResource, createSignal, For, Show } from 'solid-js';
import { useParams, useNavigate } from '@solidjs/router';
import { getListById, getItemsByList, remixList, store } from '../store/data';

const RemixList: Component = () => {
  const params = useParams();
  const navigate = useNavigate();

  const [list] = createResource(() => params.id, getListById);
  const [items] = createResource(() => params.id, getItemsByList);

  const [newTitle, setNewTitle] = createSignal('');
  const [selectedIds, setSelectedIds] = createSignal<Set<string>>(new Set());
  const [remixing, setRemixing] = createSignal(false);
  const [done, setDone] = createSignal(false);
  const [newListId, setNewListId] = createSignal('');

  // Initialize: select all items when loaded
  createResource(
    () => items(),
    (loadedItems) => {
      if (loadedItems) {
        setSelectedIds(new Set(loadedItems.map((i) => i.id)));
      }
    }
  );

  // Initialize title
  createResource(
    () => list(),
    (loadedList) => {
      if (loadedList) {
        setNewTitle(`${loadedList.title} (remix)`);
      }
    }
  );

  const toggleItem = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleRemix = async () => {
    const user = store.currentUser();
    if (!user || !list()) return;

    setRemixing(true);
    try {
      const newList = await remixList(
        list()!.id,
        user.id,
        newTitle(),
        [...selectedIds()]
      );
      setNewListId(newList.id);
      setDone(true);
    } catch (e) {
      console.error('Remix failed:', e);
      alert('Failed to remix. Please try again.');
    } finally {
      setRemixing(false);
    }
  };

  const ownerProfile = () => list()?.expand?.owner;

  return (
    <div class="px-4 py-6 max-w-2xl mx-auto">
      <Show when={!done()}>
        {/* Back */}
        <button onClick={() => navigate(-1)} class="text-gray-500 hover:text-black mb-4 flex items-center gap-1 text-sm">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Cancel
        </button>

        <h1 class="text-2xl font-bold text-gray-900 mb-2">Remix this list</h1>

        <Show when={list() && ownerProfile()}>
          {/* Attribution banner */}
          <div class="bg-purple-50 text-purple-700 rounded-xl p-4 mb-6 flex items-center gap-3">
            <img src={ownerProfile()!.avatar_url} alt="" class="w-10 h-10 rounded-full" />
            <div>
              <p class="text-sm font-medium">Remixing from {ownerProfile()!.display_name}</p>
              <p class="text-xs opacity-70">Original: {list()!.title}</p>
            </div>
          </div>

          {/* New title */}
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-1">Name your remix</label>
            <input
              type="text"
              value={newTitle()}
              onInput={(e) => setNewTitle(e.currentTarget.value)}
              class="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
            />
          </div>

          {/* Item selection */}
          <div class="mb-6">
            <div class="flex items-center justify-between mb-3">
              <label class="text-sm font-medium text-gray-700">
                Select items ({selectedIds().size}/{items()?.length ?? 0})
              </label>
              <button
                onClick={() => {
                  if (selectedIds().size === (items()?.length ?? 0)) {
                    setSelectedIds(new Set<string>());
                  } else {
                    setSelectedIds(new Set<string>(items()?.map((i) => i.id) ?? []));
                  }
                }}
                class="text-xs text-gray-500 hover:text-black"
              >
                {selectedIds().size === (items()?.length ?? 0) ? 'Deselect all' : 'Select all'}
              </button>
            </div>

            <div class="space-y-1">
              <For each={items()}>
                {(item) => (
                  <button
                    onClick={() => toggleItem(item.id)}
                    class={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                      selectedIds().has(item.id) ? 'bg-purple-50' : 'bg-gray-50 opacity-60'
                    }`}
                  >
                    <div class={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                      selectedIds().has(item.id) ? 'bg-purple-600 border-purple-600' : 'border-gray-300'
                    }`}>
                      <Show when={selectedIds().has(item.id)}>
                        <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                        </svg>
                      </Show>
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="text-sm font-medium truncate">{item.name}</div>
                      <Show when={item.note}>
                        <div class="text-xs text-gray-500 truncate">{item.note}</div>
                      </Show>
                    </div>
                    <Show when={item.rating}>
                      <span class="text-xs bg-yellow-50 text-yellow-700 px-1.5 py-0.5 rounded">{item.rating}/10</span>
                    </Show>
                  </button>
                )}
              </For>
            </div>
          </div>

          {/* Add your own items button (placeholder) */}
          <button class="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 mb-6 hover:border-gray-300 hover:text-gray-500 transition-colors">
            + Add your own items after remixing
          </button>

          {/* Save */}
          <button
            onClick={handleRemix}
            disabled={remixing() || !newTitle().trim() || selectedIds().size === 0}
            class="w-full py-3 bg-black text-white rounded-xl font-medium text-sm disabled:opacity-30 hover:bg-gray-800 transition-colors"
          >
            {remixing() ? 'Creating remix...' : `Save Remix (${selectedIds().size} items)`}
          </button>
        </Show>
      </Show>

      {/* Confirmation */}
      <Show when={done()}>
        <div class="text-center py-12">
          <p class="text-5xl mb-4">🎉</p>
          <h1 class="text-2xl font-bold text-gray-900 mb-2">Remix created!</h1>
          <p class="text-sm text-gray-500 mb-8">
            Your remix of <strong>{list()?.title}</strong> by {ownerProfile()?.display_name} is ready.
          </p>
          <div class="flex flex-col gap-3 max-w-xs mx-auto">
            <button
              onClick={() => navigate(`/list/${newListId()}`)}
              class="w-full py-3 bg-black text-white rounded-xl font-medium text-sm hover:bg-gray-800 transition-colors"
            >
              View your remix
            </button>
            <button
              onClick={() => navigate('/')}
              class="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-200 transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </Show>
    </div>
  );
};

export default RemixList;
