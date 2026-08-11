import type { LearningItemRow } from "./items";

export type ItemFilters = { search: string; type: string; status: string };

export function filterLearningItems(items: LearningItemRow[], filters: ItemFilters) {
  const search = filters.search.trim().toLocaleLowerCase();
  return items.filter((item) => {
    const matchesSearch = !search || item.text.toLocaleLowerCase().includes(search) || item.meaning.toLocaleLowerCase().includes(search);
    const matchesType = filters.type === "all" || item.type === filters.type;
    const matchesStatus = filters.status === "all" || item.status === filters.status;
    return matchesSearch && matchesType && matchesStatus;
  });
}
