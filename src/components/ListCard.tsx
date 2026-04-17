import { A } from '@solidjs/router';
import { Component, createResource, Show } from 'solid-js';
import { type List, type Category, CATEGORY_LABELS, CATEGORY_EMOJI, getItemsByList, getSaveCount } from '../store/data';

interface ListCardProps {
  list: List;
  ownerName?: string;
}

const visibilityBadge = (v: string) => {
  switch (v) {
    case 'public': return { label: 'Public', class: 'bg-green-100 text-green-700' };
    case 'link_only': return { label: 'Link only', class: 'bg-yellow-100 text-yellow-700' };
    case 'private': return { label: 'Private', class: 'bg-gray-100 text-gray-600' };
    default: return { label: v, class: 'bg-gray-100 text-gray-600' };
  }
};

const ListCard: Component<ListCardProps> = (props) => {
  const [items] = createResource(() => props.list.id, getItemsByList);
  const [saveCount] = createResource(() => props.list.id, getSaveCount);

  const badge = () => visibilityBadge(props.list.visibility);

  return (
    <A
      href={`/list/${props.list.id}`}
      class="block bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
    >
      <div class="flex items-start justify-between mb-2">
        <h3 class="font-semibold text-gray-900 text-base leading-tight line-clamp-2 flex-1">
          {props.list.title}
        </h3>
        <span class={`ml-2 shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${badge().class}`}>
          {badge().label}
        </span>
      </div>

      <div class="flex items-center gap-2 mb-3">
        <span class="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">
          {CATEGORY_EMOJI[props.list.category as Category]} {CATEGORY_LABELS[props.list.category as Category]}
        </span>
        <Show when={props.ownerName}>
          <span class="text-xs text-gray-400">by {props.ownerName}</span>
        </Show>
      </div>

      <Show when={props.list.description}>
        <p class="text-sm text-gray-500 mb-3 line-clamp-2">{props.list.description}</p>
      </Show>

      <div class="flex items-center gap-3 text-xs text-gray-400">
        <span>{items()?.length ?? '...'} items</span>
        <span>·</span>
        <span>{saveCount() ?? 0} saves</span>

        {/* Preview chips for top items */}
        <Show when={items() && items()!.length > 0}>
          <span class="ml-auto flex gap-1 overflow-hidden">
            {items()!.slice(0, 3).map((item) => (
              <span class="text-xs bg-gray-50 border border-gray-100 rounded px-1.5 py-0.5 truncate max-w-[80px]">
                {item.name}
              </span>
            ))}
          </span>
        </Show>
      </div>
    </A>
  );
};

export default ListCard;
