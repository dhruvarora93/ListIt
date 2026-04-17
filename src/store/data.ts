import PocketBase from 'pocketbase';
import { createSignal, createResource, createRoot } from 'solid-js';

export const pb = new PocketBase('http://127.0.0.1:8090');
pb.autoCancellation(false);

// ── Types ──────────────────────────────────────────────
export type Category = 'food_drink' | 'books' | 'music' | 'travel' | 'shopping' | 'custom';
export type Visibility = 'private' | 'link_only' | 'public';

export interface Profile {
  id: string;
  handle: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  created: string;
  updated: string;
}

export interface List {
  id: string;
  owner: string;
  title: string;
  description: string;
  category: Category;
  visibility: Visibility;
  allow_save: boolean;
  allow_remix: boolean;
  remixed_from: string;
  slug: string;
  created: string;
  updated: string;
  // Expanded relations
  expand?: {
    owner?: Profile;
    remixed_from?: List;
  };
}

export interface Item {
  id: string;
  list: string;
  name: string;
  note: string;
  rating: number;
  position: number;
  place_id: string;
  latitude: number;
  longitude: number;
  created: string;
  updated: string;
}

export interface Save {
  id: string;
  user: string;
  list: string;
  created: string;
}

// ── Category Helpers ───────────────────────────────────
export const CATEGORY_LABELS: Record<Category, string> = {
  food_drink: 'Food & Drink',
  books: 'Books',
  music: 'Music',
  travel: 'Travel',
  shopping: 'Shopping',
  custom: 'Custom',
};

export const CATEGORY_EMOJI: Record<Category, string> = {
  food_drink: '🍽️',
  books: '📚',
  music: '🎵',
  travel: '✈️',
  shopping: '🛒',
  custom: '📋',
};

// ── API Functions ──────────────────────────────────────

// Profiles
export async function getProfiles(): Promise<Profile[]> {
  const records = await pb.collection('profiles').getFullList<Profile>({ sort: 'created' });
  return records;
}

export async function getProfileById(id: string): Promise<Profile> {
  return await pb.collection('profiles').getOne<Profile>(id);
}

export async function getProfileByHandle(handle: string): Promise<Profile> {
  return await pb.collection('profiles').getFirstListItem<Profile>(`handle='${handle}'`);
}

// Lists
export async function getLists(filter?: string): Promise<List[]> {
  const options: any = { sort: '-updated', expand: 'owner,remixed_from' };
  if (filter) options.filter = filter;
  const records = await pb.collection('lists').getFullList<List>(options);
  return records;
}

export async function getListById(id: string): Promise<List> {
  return await pb.collection('lists').getOne<List>(id, { expand: 'owner,remixed_from' });
}

export async function getListsByOwner(ownerId: string): Promise<List[]> {
  return await pb.collection('lists').getFullList<List>({
    filter: `owner='${ownerId}'`,
    sort: '-updated',
    expand: 'owner',
  });
}

export async function getPublicListsByOwner(ownerId: string): Promise<List[]> {
  return await pb.collection('lists').getFullList<List>({
    filter: `owner='${ownerId}' && (visibility='public' || visibility='link_only')`,
    sort: '-updated',
    expand: 'owner',
  });
}

export async function createList(data: {
  owner: string;
  title: string;
  description: string;
  category: Category;
  visibility: Visibility;
  slug: string;
  allow_save?: boolean;
  allow_remix?: boolean;
}): Promise<List> {
  return await pb.collection('lists').create<List>({
    ...data,
    allow_save: data.allow_save ?? true,
    allow_remix: data.allow_remix ?? true,
  });
}

export async function updateList(id: string, data: Partial<List>): Promise<List> {
  return await pb.collection('lists').update<List>(id, data);
}

export async function deleteList(id: string): Promise<boolean> {
  return await pb.collection('lists').delete(id);
}

// Items
export async function getItemsByList(listId: string): Promise<Item[]> {
  return await pb.collection('items').getFullList<Item>({
    filter: `list='${listId}'`,
    sort: 'position',
  });
}

export async function createItem(data: {
  list: string;
  name: string;
  note?: string;
  rating?: number;
  position: number;
  place_id?: string;
  latitude?: number;
  longitude?: number;
}): Promise<Item> {
  return await pb.collection('items').create<Item>(data);
}

export async function updateItem(id: string, data: Partial<Item>): Promise<Item> {
  return await pb.collection('items').update<Item>(id, data);
}

export async function deleteItem(id: string): Promise<boolean> {
  return await pb.collection('items').delete(id);
}

// Saves
export async function getSavesByUser(userId: string): Promise<Save[]> {
  return await pb.collection('saves').getFullList<Save>({
    filter: `user='${userId}'`,
    sort: '-created',
  });
}

export async function getSavesByList(listId: string): Promise<Save[]> {
  return await pb.collection('saves').getFullList<Save>({
    filter: `list='${listId}'`,
  });
}

export async function isListSaved(userId: string, listId: string): Promise<boolean> {
  try {
    await pb.collection('saves').getFirstListItem(`user='${userId}' && list='${listId}'`);
    return true;
  } catch {
    return false;
  }
}

export async function toggleSave(userId: string, listId: string): Promise<boolean> {
  try {
    const existing = await pb.collection('saves').getFirstListItem<Save>(
      `user='${userId}' && list='${listId}'`
    );
    await pb.collection('saves').delete(existing.id);
    return false; // unsaved
  } catch {
    await pb.collection('saves').create({ user: userId, list: listId });
    return true; // saved
  }
}

export async function getSaveCount(listId: string): Promise<number> {
  const result = await pb.collection('saves').getList(1, 1, {
    filter: `list='${listId}'`,
  });
  return result.totalItems;
}

export async function getTotalSavesForUser(userId: string): Promise<number> {
  const lists = await getListsByOwner(userId);
  let total = 0;
  for (const list of lists) {
    total += await getSaveCount(list.id);
  }
  return total;
}

// Search
export async function searchLists(query: string): Promise<List[]> {
  if (!query.trim()) return [];
  const q = query.trim();
  return await pb.collection('lists').getFullList<List>({
    filter: `visibility='public' && (title~'${q}' || description~'${q}' || category~'${q}')`,
    sort: '-updated',
    expand: 'owner',
  });
}

export async function searchUsers(query: string): Promise<Profile[]> {
  if (!query.trim()) return [];
  const q = query.trim();
  return await pb.collection('profiles').getFullList<Profile>({
    filter: `handle~'${q}' || display_name~'${q}'`,
  });
}

// Remix
export async function remixList(
  originalListId: string,
  userId: string,
  newTitle: string,
  selectedItemIds: string[]
): Promise<List> {
  const original = await getListById(originalListId);
  const slug = newTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const newList = await createList({
    owner: userId,
    title: newTitle,
    description: original.description,
    category: original.category,
    visibility: 'private',
    slug,
    allow_save: true,
    allow_remix: true,
  });

  // Update with remixed_from after creation
  await updateList(newList.id, { remixed_from: originalListId } as any);

  const originalItems = await getItemsByList(originalListId);
  const selectedItems = originalItems.filter((i) => selectedItemIds.includes(i.id));

  for (let i = 0; i < selectedItems.length; i++) {
    const item = selectedItems[i];
    await createItem({
      list: newList.id,
      name: item.name,
      note: item.note,
      rating: item.rating,
      position: i + 1,
      place_id: item.place_id,
      latitude: item.latitude,
      longitude: item.longitude,
    });
  }

  return newList;
}

// ── Current User (hardcoded for now, replace with auth later) ──
// We'll use the first profile ("dhruv") as the current user
const CURRENT_USER_HANDLE = 'dhruv';

function createAppStore() {
  const [currentUser, setCurrentUser] = createSignal<Profile | null>(null);
  const [loading, setLoading] = createSignal(true);

  // Initialize current user
  const init = async () => {
    try {
      const user = await getProfileByHandle(CURRENT_USER_HANDLE);
      setCurrentUser(user);
    } catch (e) {
      console.error('Failed to load current user:', e);
    } finally {
      setLoading(false);
    }
  };

  init();

  return {
    currentUser,
    loading,
  };
}

export const store = createRoot(createAppStore);
