import { normalizeString } from '@utils/normalizeString';

// TODO: implemente fuzzy match
export function searchQueryMatch(query: string, string: string) {
  const queryIndex = normalizeString(String(string)).indexOf(
    normalizeString(String(query)),
  );

  return {
    matched: queryIndex !== -1,
    matchedIndex: queryIndex,
  };
}
