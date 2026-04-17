import { Component, createSignal, For, Show } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { store, createList, createItem, type Category, type Visibility, CATEGORY_LABELS } from '../store/data';

interface DraftItem {
  id: number;
  name: string;
  note: string;
  rating: number | null;
  latitude: number | null;
  longitude: number | null;
}

const CreateList: Component = () => {
  const navigate = useNavigate();
  const [step, setStep] = createSignal(1);

  // Step 1 — Basics
  const [title, setTitle] = createSignal('');
  const [description, setDescription] = createSignal('');
  const [category, setCategory] = createSignal<Category>('food_drink');
  const [visibility, setVisibility] = createSignal<Visibility>('public');

  // Step 2 — Items
  const [items, setItems] = createSignal<DraftItem[]>([]);
  const [newItemName, setNewItemName] = createSignal('');
  const [newItemNote, setNewItemNote] = createSignal('');
  const [newItemRating, setNewItemRating] = createSignal('');

  let nextItemId = 1;

  const addItem = () => {
    if (!newItemName().trim()) return;
    setItems((prev) => [
      ...prev,
      {
        id: nextItemId++,
        name: newItemName().trim(),
        note: newItemNote().trim(),
        rating: newItemRating() ? parseFloat(newItemRating()) : null,
        latitude: null,
        longitude: null,
      },
    ]);
    setNewItemName('');
    setNewItemNote('');
    setNewItemRating('');
  };

  const removeItem = (id: number) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    const arr = [...items()];
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= arr.length) return;
    [arr[index], arr[newIndex]] = [arr[newIndex], arr[index]];
    setItems(arr);
  };

  // Step 3 — Publish
  const [publishing, setPublishing] = createSignal(false);

  const handlePublish = async () => {
    const user = store.currentUser();
    if (!user) return;

    setPublishing(true);
    try {
      const slug = title().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      const newList = await createList({
        owner: user.id,
        title: title(),
        description: description(),
        category: category(),
        visibility: visibility(),
        slug,
      });

      // Create items
      for (let i = 0; i < items().length; i++) {
        const item = items()[i];
        await createItem({
          list: newList.id,
          name: item.name,
          note: item.note,
          rating: item.rating ?? undefined,
          position: i + 1,
          latitude: item.latitude ?? undefined,
          longitude: item.longitude ?? undefined,
        });
      }

      navigate(`/list/${newList.id}`);
    } catch (e) {
      console.error('Failed to create list:', e);
      alert('Failed to create list. Please try again.');
    } finally {
      setPublishing(false);
    }
  };

  const categories: Category[] = ['food_drink', 'books', 'music', 'travel', 'shopping', 'custom'];
  const visibilityOptions: { value: Visibility; label: string; desc: string }[] = [
    { value: 'private', label: 'Private', desc: 'Only you' },
    { value: 'link_only', label: 'Link only', desc: 'Anyone with the link' },
    { value: 'public', label: 'Public', desc: 'Visible to everyone' },
  ];

  return (
    <div class="px-4 py-6 max-w-2xl mx-auto">
      {/* Back */}
      <button onClick={() => step() === 1 ? navigate(-1) : setStep(step() - 1)} class="text-gray-500 hover:text-black mb-4 flex items-center gap-1 text-sm">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        {step() === 1 ? 'Cancel' : 'Back'}
      </button>

      {/* Progress */}
      <div class="flex gap-2 mb-6">
        {[1, 2, 3].map((s) => (
          <div class={`h-1 flex-1 rounded-full transition-colors ${s <= step() ? 'bg-black' : 'bg-gray-200'}`} />
        ))}
      </div>

      {/* Step 1: Basics */}
      <Show when={step() === 1}>
        <h1 class="text-2xl font-bold text-gray-900 mb-6">Create a new list</h1>

        <div class="space-y-5">
          {/* Title */}
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={title()}
              onInput={(e) => setTitle(e.currentTarget.value)}
              placeholder="e.g. Best Coffee Shops in NYC"
              class="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
            />
          </div>

          {/* Description */}
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description()}
              onInput={(e) => setDescription(e.currentTarget.value)}
              placeholder="What's this list about?"
              rows={3}
              class="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/10 resize-none"
            />
          </div>

          {/* Category */}
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <div class="flex flex-wrap gap-2">
              <For each={categories}>
                {(cat) => (
                  <button
                    onClick={() => setCategory(cat)}
                    class={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      category() === cat
                        ? 'bg-black text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {CATEGORY_LABELS[cat]}
                  </button>
                )}
              </For>
            </div>
          </div>

          {/* Visibility */}
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Visibility</label>
            <div class="space-y-2">
              <For each={visibilityOptions}>
                {(opt) => (
                  <button
                    onClick={() => setVisibility(opt.value)}
                    class={`w-full text-left px-4 py-3 rounded-xl transition-colors flex items-center justify-between ${
                      visibility() === opt.value
                        ? 'bg-black text-white'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span class="text-sm font-medium">{opt.label}</span>
                    <span class={`text-xs ${visibility() === opt.value ? 'text-gray-300' : 'text-gray-400'}`}>
                      {opt.desc}
                    </span>
                  </button>
                )}
              </For>
            </div>
          </div>
        </div>

        <button
          onClick={() => setStep(2)}
          disabled={!title().trim()}
          class="w-full mt-8 py-3 bg-black text-white rounded-xl font-medium text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
        >
          Next — Add Items
        </button>
      </Show>

      {/* Step 2: Add Items */}
      <Show when={step() === 2}>
        <h1 class="text-2xl font-bold text-gray-900 mb-2">Add items</h1>
        <p class="text-sm text-gray-500 mb-6">{items().length} items added</p>

        {/* Add item form */}
        <div class="bg-gray-50 rounded-xl p-4 mb-6">
          <input
            type="text"
            value={newItemName()}
            onInput={(e) => setNewItemName(e.currentTarget.value)}
            placeholder="Item name"
            class="w-full px-3 py-2 bg-white rounded-lg text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-black/10"
            onKeyDown={(e) => e.key === 'Enter' && addItem()}
          />
          <div class="flex gap-2">
            <input
              type="text"
              value={newItemNote()}
              onInput={(e) => setNewItemNote(e.currentTarget.value)}
              placeholder="Note (optional)"
              class="flex-1 px-3 py-2 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
            />
            <input
              type="number"
              value={newItemRating()}
              onInput={(e) => setNewItemRating(e.currentTarget.value)}
              placeholder="Rating"
              min="0"
              max="10"
              step="0.5"
              class="w-20 px-3 py-2 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
            />
          </div>
          <button
            onClick={addItem}
            disabled={!newItemName().trim()}
            class="mt-2 w-full py-2 bg-black text-white rounded-lg text-sm font-medium disabled:opacity-30 hover:bg-gray-800 transition-colors"
          >
            + Add Item
          </button>
        </div>

        {/* Item list */}
        <div class="space-y-1">
          <For each={items()}>
            {(item, index) => (
              <div class="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-100">
                <div class="flex flex-col gap-0.5">
                  <button onClick={() => moveItem(index(), -1)} class="text-gray-400 hover:text-black text-xs leading-none">▲</button>
                  <button onClick={() => moveItem(index(), 1)} class="text-gray-400 hover:text-black text-xs leading-none">▼</button>
                </div>
                <span class="text-xs text-gray-400 w-5 text-right">{index() + 1}</span>
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-medium truncate">{item.name}</div>
                  <Show when={item.note}>
                    <div class="text-xs text-gray-500 truncate">{item.note}</div>
                  </Show>
                </div>
                <Show when={item.rating !== null}>
                  <span class="text-xs bg-yellow-50 text-yellow-700 px-1.5 py-0.5 rounded">{item.rating}/10</span>
                </Show>
                <button onClick={() => removeItem(item.id)} class="text-gray-400 hover:text-red-500 transition-colors">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </For>
        </div>

        <button
          onClick={() => setStep(3)}
          class="w-full mt-8 py-3 bg-black text-white rounded-xl font-medium text-sm hover:bg-gray-800 transition-colors"
        >
          Next — Review
        </button>
      </Show>

      {/* Step 3: Review */}
      <Show when={step() === 3}>
        <h1 class="text-2xl font-bold text-gray-900 mb-6">Review your list</h1>

        <div class="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-1">{title()}</h2>
          <Show when={description()}>
            <p class="text-sm text-gray-500 mb-3">{description()}</p>
          </Show>
          <div class="flex gap-2 mb-4">
            <span class="text-xs px-2 py-0.5 bg-gray-100 rounded-full">{CATEGORY_LABELS[category()]}</span>
            <span class="text-xs px-2 py-0.5 bg-gray-100 rounded-full capitalize">{visibility()}</span>
          </div>

          <div class="border-t border-gray-100 pt-3">
            <p class="text-xs text-gray-400 mb-2">{items().length} items</p>
            <For each={items()}>
              {(item, index) => (
                <div class="flex items-center gap-2 py-1.5">
                  <span class="text-xs text-gray-400 w-5 text-right">{index() + 1}</span>
                  <span class="text-sm text-gray-900">{item.name}</span>
                  <Show when={item.rating !== null}>
                    <span class="text-xs text-yellow-600 ml-auto">{item.rating}/10</span>
                  </Show>
                </div>
              )}
            </For>
          </div>
        </div>

        <button
          onClick={handlePublish}
          disabled={publishing()}
          class="w-full py-3 bg-black text-white rounded-xl font-medium text-sm disabled:opacity-50 hover:bg-gray-800 transition-colors"
        >
          {publishing() ? 'Publishing...' : 'Publish List'}
        </button>
      </Show>
    </div>
  );
};

export default CreateList;
