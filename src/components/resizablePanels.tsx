import { colors } from '@src/style/theme'
import { createSignalRef } from '@utils/solid'
import { JSX } from 'solid-js'
import { css } from 'solid-styled-components'

const handleStyle = css`
  &&& {
    position: relative;
    z-index: 10;
    width: 9px;
    margin: 0 -4.5px;
    cursor: col-resize;
    touch-action: none;

    &::before {
      content: '';
      position: absolute;
      inset: 0 3.5px;
      background: transparent;
      transition: background 160ms;
    }

    &:hover::before,
    &.dragging::before {
      background: ${colors.secondary.alpha(0.5)};
    }
  }
`

function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value)
}

function isNumberArray(value: unknown): value is number[] {
  return (
    isArray(value) &&
    value.every((item) => typeof item === 'number' && Number.isFinite(item))
  )
}

/**
 * Manages the column sizes of a grid of horizontally resizable panels. Render
 * a `Handle` between each pair of panels and set the container
 * `grid-template-columns` to `gridTemplateColumns()`. Sizes are persisted in
 * local storage, and double-clicking a handle resets them.
 */
export function createResizablePanels({
  storageKey,
  initialSizes,
  minSizePct = 10,
}: {
  storageKey: string
  /** relative weights of each panel, e.g. [1, 1, 3] */
  initialSizes: number[]
  minSizePct?: number
}): {
  gridTemplateColumns: () => string
  Handle: (props: { index: number }) => JSX.Element
} {
  const fullStorageKey = `app-devtools-panels-${storageKey}`

  function normalize(weights: number[]): number[] {
    const total = weights.reduce((sum, weight) => sum + weight, 0)

    return weights.map((weight) => (weight / total) * 100)
  }

  function getPersistedSizes(): number[] | null {
    try {
      const stored = window.localStorage.getItem(fullStorageKey)

      if (!stored) return null

      const parsed: unknown = JSON.parse(stored)

      if (!isNumberArray(parsed) || parsed.length !== initialSizes.length) {
        return null
      }

      return normalize(parsed)
    } catch {
      return null
    }
  }

  function persistSizes(current: number[]) {
    try {
      window.localStorage.setItem(fullStorageKey, JSON.stringify(current))
    } catch {
      // localStorage may be unavailable
    }
  }

  const sizes = createSignalRef(getPersistedSizes() ?? normalize(initialSizes))

  function gridTemplateColumns(): string {
    // handles are rendered inside 0px columns, overflowing them, so they
    // don't affect the layout
    return sizes.value.map((size) => `minmax(0, ${size}fr)`).join(' 0px ')
  }

  function Handle(props: { index: number }) {
    const dragging = createSignalRef(false)

    return (
      <div
        class={handleStyle}
        classList={{ dragging: dragging.value }}
        onDblClick={() => {
          sizes.value = normalize(initialSizes)
          persistSizes(sizes.value)
        }}
        onPointerDown={(e) => {
          const container = e.currentTarget.parentElement

          if (!container) return

          e.preventDefault()

          const handleElement = e.currentTarget

          handleElement.setPointerCapture(e.pointerId)
          dragging.value = true

          const startX = e.clientX
          const containerWidth = container.getBoundingClientRect().width
          const startSizes = [...sizes.value]

          function onMove(moveEvent: PointerEvent) {
            const startLeft = startSizes[props.index]
            const startRight = startSizes[props.index + 1]

            if (
              startLeft === undefined ||
              startRight === undefined ||
              containerWidth === 0
            ) {
              return
            }

            const deltaPct =
              ((moveEvent.clientX - startX) / containerWidth) * 100

            const pairTotal = startLeft + startRight

            const newLeft = Math.min(
              Math.max(startLeft + deltaPct, minSizePct),
              pairTotal - minSizePct,
            )

            const newSizes = [...startSizes]

            newSizes[props.index] = newLeft
            newSizes[props.index + 1] = pairTotal - newLeft

            sizes.value = newSizes
          }

          function onUp() {
            dragging.value = false
            handleElement.removeEventListener('pointermove', onMove)
            handleElement.removeEventListener('pointerup', onUp)
            handleElement.removeEventListener('pointercancel', onUp)
            persistSizes(sizes.value)
          }

          handleElement.addEventListener('pointermove', onMove)
          handleElement.addEventListener('pointerup', onUp)
          handleElement.addEventListener('pointercancel', onUp)
        }}
      />
    )
  }

  return { gridTemplateColumns, Handle }
}
