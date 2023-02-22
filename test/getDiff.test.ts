import { getDiff } from '@utils/getDiff'
import { describe, expect, test } from 'vitest'

test('string value diff', () => {
  expect(getDiff('foo', 'foo')).toEqual('values are equal')

  expect(getDiff('foo', 'bar')).toEqual({
    valueChanged: {
      old: 'foo',
      new: 'bar',
    },
  })
})

test('string value diff', () => {
  expect(getDiff('foo', 'foo')).toEqual('values are equal')

  expect(getDiff('foo', 'bar')).toEqual({
    valueChanged: {
      old: 'foo',
      new: 'bar',
    },
  })
})

describe('array diff', () => {
  test('add items', () => {
    expect(getDiff([1, 2], [1, 2, 3])).toEqual({
      added: [
        {
          toIndex: 2,
          value: 3,
        },
      ],
    })

    expect(getDiff([1, 2], [1, 2, 2])).toEqual({
      added: [
        {
          toIndex: 2,
          value: 2,
        },
      ],
    })

    expect(getDiff([1, 2], [1, 3, 2])).toEqual({
      added: [
        {
          toIndex: 1,
          value: 3,
        },
      ],
    })

    expect(getDiff([1, 2], [1, 3, 3, 2])).toEqual({
      added: [
        {
          toIndex: 1,
          value: 3,
        },
        {
          toIndex: 2,
          value: 3,
        },
      ],
    })
  })

  test('remove items', () => {
    expect(getDiff([1, 2, 3], [1, 2])).toEqual({
      removed: [
        {
          fromIndex: 2,
          value: 3,
        },
      ],
    })

    expect(getDiff([1, 2, 2], [1, 2])).toEqual({
      removed: [
        {
          fromIndex: 2,
          value: 2,
        },
      ],
    })

    expect(getDiff([1, 3, 2], [1, 2])).toEqual({
      removed: [
        {
          fromIndex: 1,
          value: 3,
        },
      ],
    })

    expect(getDiff([1, 3, 3, 2], [1, 2])).toEqual({
      removed: [
        {
          fromIndex: 1,
          value: 3,
        },
        {
          fromIndex: 2,
          value: 3,
        },
      ],
    })
  })

  test('remove and add items', () => {
    expect(getDiff([1, 2, 3], [2, 3, 5])).toEqual({
      removed: [
        {
          fromIndex: 0,
          value: 1,
        },
      ],
    })
  })
})
