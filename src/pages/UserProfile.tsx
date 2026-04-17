import { Component, createResource, For, Show } from 'solid-js';
import { useParams } from '@solidjs/router';
import { getProfileByHandle, getPublicListsByOwner, getSavesByUser, store } from '../store/data';
import ListCard from '../components/ListCard';

const UserProfile: Component = () => {
  const params = useParams();

  const [profile] = createResource(() => params.handle, getProfileByHandle);
  const [lists] = createResource(
    () => profile()?.id,
    (id) => getPublicListsByOwner(id)
  );
  // Check how many of their lists the current user has saved
  const [currentUserSaves] = createResource(
    () => store.currentUser()?.id,
    (uid) => getSavesByUser(uid)
  );

  const savedListIds = () => new Set((currentUserSaves() ?? []).map((s) => s.list));

  return (
    <div class="px-4 py-6 max-w-2xl mx-auto">
      <Show when={profile()} fallback={
        <div class="flex justify-center py-12">
          <div class="w-6 h-6 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
        </div>
      }>
        {/* Hero */}
        <div class="flex items-center gap-4 mb-6">
          <img
            src={profile()!.avatar_url}
            alt={profile()!.display_name}
            class="w-20 h-20 rounded-full bg-gray-100"
          />
          <div class="flex-1">
            <h1 class="text-xl font-bold text-gray-900">{profile()!.display_name}</h1>
            <p class="text-sm text-gray-500">@{profile()!.handle}</p>
            <p class="text-sm text-gray-600 mt-1">{profile()!.bio}</p>
          </div>
        </div>

        {/* Stats */}
        <div class="flex gap-6 mb-6 py-3 border-y border-gray-100">
          <div class="text-center">
            <div class="text-lg font-bold text-gray-900">{lists()?.length ?? 0}</div>
            <div class="text-xs text-gray-500">Lists</div>
          </div>
        </div>

        {/* Saved banner */}
        <Show when={currentUserSaves() && lists()}>
          {(() => {
            const count = lists()!.filter((l) => savedListIds().has(l.id)).length;
            return count > 0 ? (
              <div class="bg-blue-50 text-blue-700 text-sm rounded-lg px-4 py-2 mb-4">
                You've saved {count} of their lists
              </div>
            ) : null;
          })()}
        </Show>

        {/* Lists */}
        <h2 class="font-semibold text-gray-900 mb-3">Public Lists</h2>
        <div class="grid gap-3 sm:grid-cols-2">
          <For each={lists()} fallback={
            <p class="text-gray-400 text-sm py-8 text-center col-span-2">No public lists</p>
          }>
            {(list) => (
              <div class="relative">
                <ListCard list={list} />
                <Show when={savedListIds().has(list.id)}>
                  <span class="absolute top-3 right-3 text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                    Saved
                  </span>
                </Show>
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
};

export default UserProfile;
