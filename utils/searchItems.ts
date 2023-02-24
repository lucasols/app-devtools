import { searchQueryMatch } from '@utils/searchQueryMatch'
import { sortBy } from '@utils/sortBy'

export function searchItems<T>({
  items,
  searchQuery,
  getStringToMatch,
}: {
  items: T[]
  getStringToMatch: (item: T) => string
  searchQuery: string
}) {
  const searchedItems: { item: T; matchedIndex: number }[] = []

  for (const item of items) {
    const search = searchQueryMatch(searchQuery, getStringToMatch(item))

    if (search.matched) {
      searchedItems.push({ item, matchedIndex: search.matchedIndex })
    }
  }

  return sortBy(searchedItems, (item) => item.matchedIndex, {
    lowerFirst: true,
  }).map(({ item }) => item)
}
