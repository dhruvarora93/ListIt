import { Component, createResource, createSignal, For, Show } from 'solid-js';
import { useParams, useNavigate } from '@solidjs/router';
import { getListById, getItemsByList, getSaveCount, isListSaved, toggleSave, store, type Item } from '../store/data';
import ShareSheet from '../components/ShareSheet';

const ListDetail: Component = () => {
  const params = useParams();
  const navigate = useNavigate();
  const [shareOpen, setShareOpen] = createSignal(false);
  const [viewMode, setViewMode] = createSignal<'list' | 'map'>('list');
  const [saved, setSaved] = createSignal(false);

  const [list, { refetch: refetchList }] = createResource(() => params.id, getListById);
  const [items] = createResource(() => params.id, getItemsByList);
  const [saveCount, { refetch: refetchSaveCount }] = createResource(() => params.id, getSaveCount);

  // Check if current user has saved this list
  createResource(
    () => ({ userId: store.currentUser()?.id ?? '', listId: params.id ?? '' }),
    async ({ userId, listId }) => {
      if (!userId) return;
      const result = await isListSaved(userId, listId);
      setSaved(result);
    }
  );

  const hasPlaceItems = () => items()?.some((i) => i.latitude && i.longitude) ?? false;
  const isOwnList = () => list()?.owner === store.currentUser()?.id;
  const ownerProfile = () => list()?.expand?.owner;
  const remixedFromList = () => list()?.expand?.remixed_from;

  const handleToggleSave = async () => {
    const userId = store.currentUser()?.id;
    if (!userId || !list()) return;
    const result = await toggleSave(userId, list()!.id);
    setSaved(result);
    refetchSaveCount();
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  return (
    <div class="px-4 py-6 max-w-2xl mx-auto">
      <Show when={list()} fallback={
        <div class="flex justify-center py-12">
          <div class="w-6 h-6 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
        </div>
      }>
        {/* Back button */}
        <button onClick={() => navigate(-1)} class="text-gray-500 hover:text-black mb-4 flex items-center gap-1 text-sm">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        {/* Header */}
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-gray-900 mb-2">{list()!.title}</h1>

          {/* Author info */}
          <Show when={ownerProfile()}>
            <button
              onClick={() => navigate(`/user/${ownerProfile()!.handle}`)}
              class="flex items-center gap-2 mb-3 hover:opacity-80 transition-opacity"
            >
              <img src={ownerProfile()!.avatar_url} alt="" class="w-8 h-8 rounded-full bg-gray-100" />
              <div class="text-left">
                <span class="text-sm font-medium text-gray-900">{ownerProfile()!.display_name}</span>
                <span class="text-xs text-gray-500 ml-1">@{ownerProfile()!.handle}</span>
              </div>
            </button>
          </Show>

          <p class="text-xs text-gray-400">Last updated {formatDate(list()!.updated)}</p>

          {/* Remixed from banner */}
          <Show when={remixedFromList()}>
            <div class="mt-3 bg-purple-50 text-purple-700 text-sm rounded-lg px-4 py-2 flex items-center gap-2">
              <span>🔄</span>
              <span>Remixed from <strong>{remixedFromList()!.title}</strong></span>
            </div>
          </Show>
        </div>

        {/* Description */}
        <Show when={list()!.description}>
          <p class="text-gray-600 text-sm mb-6">{list()!.description}</p>
        </Show>

        {/* Action buttons */}
        <div class="flex gap-2 mb-6">
          <Show when={list()!.allow_save && !isOwnList()}>
            <button
              onClick={handleToggleSave}
              class={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                saved()
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {saved() ? '✓ Saved' : 'Save'}
              <span class="ml-1 text-xs opacity-60">{saveCount() ?? 0}</span>
            </button>
          </Show>

          <Show when={list()!.allow_remix && !isOwnList()}>
            <button
              onClick={() => navigate(`/remix/${list()!.id}`)}
              class="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              🔄 Remix
            </button>
          </Show>

          <button
            onClick={() => setShareOpen(true)}
            class="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
          >
            ↗ Share
          </button>
        </div>

        {/* View toggle */}
        <Show when={hasPlaceItems()}>
          <div class="flex bg-gray-100 rounded-lg p-1 mb-6 w-fit">
            <button
              onClick={() => setViewMode('list')}
              class={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode() === 'list' ? 'bg-white text-black shadow-sm' : 'text-gray-500'
              }`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode('map')}
              class={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode() === 'map' ? 'bg-white text-black shadow-sm' : 'text-gray-500'
              }`}
            >
              Map
            </button>
          </div>
        </Show>

        {/* Items — List mode */}
        <Show when={viewMode() === 'list'}>
          <div class="space-y-1">
            <For each={items()} fallback={
              <p class="text-gray-400 text-sm py-8 text-center">No items yet</p>
            }>
              {(item, index) => (
                <div class="flex gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <span class="text-sm font-medium text-gray-400 w-6 text-right shrink-0 pt-0.5">
                    {item.position}
                  </span>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                      <span class="font-medium text-gray-900 text-sm">{item.name}</span>
                      <Show when={item.rating}>
                        <span class="text-xs bg-yellow-50 text-yellow-700 px-1.5 py-0.5 rounded font-medium">
                          {item.rating}/10
                        </span>
                      </Show>
                    </div>
                    <Show when={item.note}>
                      <p class="text-xs text-gray-500 mt-0.5">{item.note}</p>
                    </Show>
                  </div>
                </div>
              )}
            </For>
          </div>
        </Show>

        {/* Items — Map mode */}
        <Show when={viewMode() === 'map'}>
          <div class="bg-gray-100 rounded-xl p-8 text-center">
            <p class="text-gray-500 text-sm mb-4">📍 Map View</p>
            <div class="space-y-2">
              <For each={items()?.filter((i) => i.latitude && i.longitude)}>
                {(item) => (
                  <div class="bg-white rounded-lg p-3 text-left flex items-center gap-3">
                    <span class="text-lg">📍</span>
                    <div>
                      <div class="text-sm font-medium">{item.name}</div>
                      <div class="text-xs text-gray-400">
                        {item.latitude?.toFixed(4)}, {item.longitude?.toFixed(4)}
                      </div>
                    </div>
                    <Show when={item.rating}>
                      <span class="ml-auto text-xs bg-yellow-50 text-yellow-700 px-1.5 py-0.5 rounded font-medium">
                        {item.rating}/10
                      </span>
                    </Show>
                  </div>
                )}
              </For>
            </div>
          </div>
        </Show>

        {/* Share sheet */}
        <ShareSheet
          list={list()!}
          open={shareOpen()}
          onClose={() => setShareOpen(false)}
        />
      </Show>
    </div>
  );
};

export default ListDetail;
