import { isObject } from './src/utils/isObject';

function formatArray(
  type: 'all' | { firstNItems: number } | 'length',
  array: any[],
): string {
  if (type === 'length') {
    return `Array(${array.length})`;
  }

  const normalizedItems: string[] = [];

  for (const item of array) {
    if (isObject(item)) {
      normalizedItems.push(`{${formatObject(item)}}`);
    } else {
      normalizedItems.push(String(item));
    }

    if (
      typeof type === 'object' &&
      normalizedItems.length >= type.firstNItems
    ) {
      normalizedItems.push(`...(${array.length - type.firstNItems} more)`);
      break;
    }
  }

  return `[${normalizedItems.join(', ')}]`;
}

function formatObject(obj: Record<string, any>): string {
  return Object.keys(obj)
    .map((key) => {
      let value = obj[key];

      if (isObject(value)) {
        value = JSON.stringify(value)
          .replace(/"/g, '')
          .replace(/,/g, ', ')
          .replace(/:/g, ': ');
      }

      return `${key}: ${value}`;
    })
    .join(', ');
}

function simplifyArraySnapshot(
  array: any[],
  arrayType: 'all' | { firstNItems: number } | 'length' = { firstNItems: 4 },
) {
  return array
    .map((item) => {
      if (isObject(item)) {
        return formatObject(item);
      }

      if (Array.isArray(item)) {
        return formatArray(arrayType, item);
      }

      return String(item);
    })
    .join('\n');
}

simplifyArraySnapshot([
  null,
  [1, 2, 3],
  [
    { a: 1, b: 2 },
    { a: 3, b: 4 },
    { a: 3, b: 4 },
    { a: 3, b: 4 },
    { a: 3, b: 4 },
    { a: 3, b: 4 },
    { a: 3, b: 4 },
  ],
  {
    data: {
      id: 1,
      name: 'User 1',
    },
    id: 'users||1',
  },
  {
    data: {
      id: 2,
      name: 'User 2',
    },
    id: 'users||2',
  },
  {
    data: {
      id: 3,
      name: 'modified',
    },
    id: 'users||3',
  },
  {
    data: {
      id: 4,
      name: 'modified',
    },
    id: 'users||4',
  },
  {
    data: {
      id: 5,
      name: 'modified',
    },
    id: 'users||5',
  },
]); //?
