import {
  ApiRequest,
  TimelineMarker,
  callsStore,
  removeMarker,
} from '@src/stores/callsStore'
import { setUiStore } from '@src/stores/uiStore'
import { formatNum } from '@src/utils/formatNum'
import { ellipsis } from '@src/style/helpers/ellipsis'
import { inline } from '@src/style/helpers/inline'
import { stack } from '@src/style/helpers/stack'
import { colors, fonts } from '@src/style/theme'
import dayjs from 'dayjs'
import { createMemo, onCleanup } from 'solid-js'
import { css } from 'solid-styled-components'

const labelColumnWidth = 220

const containerStyle = css`
  &&& {
    ${stack({ align: 'stretch' })};
    overflow: hidden;
    padding: 12px 16px 0;
    gap: 8px;

    > h1 {
      font-size: 16px;
      font-family: ${fonts.decorative};
      color: ${colors.secondary.var};
    }

    > .hint {
      font-size: 11px;
      color: ${colors.white.alpha(0.4)};
    }

    > .empty {
      opacity: 0.4;
      font-size: 14px;
      padding-top: 20px;
    }
  }
`

const brushStyle = css`
  &&& {
    position: relative;
    height: 44px;
    flex-shrink: 0;
    background: ${colors.white.alpha(0.04)};
    border: 1px solid ${colors.white.alpha(0.1)};
    border-radius: 4px;
    cursor: crosshair;
    touch-action: none;
    user-select: none;

    .tick {
      position: absolute;
      top: 8px;
      bottom: 8px;
      width: 2px;
      background: ${colors.secondary.alpha(0.6)};
      pointer-events: none;

      &.warning {
        background: ${colors.warning.alpha(0.8)};
      }

      &.error {
        background: ${colors.error.alpha(0.8)};
      }

      &.pending {
        background: ${colors.white.alpha(0.4)};
      }

      &.marker {
        top: 2px;
        bottom: 2px;
        background: ${colors.warning.var};
      }
    }

    .shade {
      position: absolute;
      top: 0;
      bottom: 0;
      background: ${colors.black.alpha(0.5)};
      pointer-events: none;
    }

    .handle {
      position: absolute;
      top: 0;
      bottom: 0;
      width: 12px;
      transform: translateX(-50%);
      cursor: ew-resize;
      ${inline({ justify: 'center' })};

      &::before {
        content: '';
        width: 4px;
        height: 100%;
        border-radius: 2px;
        background: ${colors.primary.var};
      }
    }
  }
`

const timeLabelsStyle = css`
  &&& {
    ${inline()};
    justify-content: space-between;
    font-size: 11px;
    font-family: ${fonts.decorative};
    color: ${colors.white.alpha(0.5)};
    flex-shrink: 0;
  }
`

const waterfallStyle = css`
  &&& {
    flex: 1 1;
    overflow-y: auto;
    margin: 0 -16px;
    padding: 0 16px 24px;

    > .content {
      position: relative;

      > .marker-line {
        position: absolute;
        top: 0;
        bottom: 0;
        width: 0;
        border-left: 1px dashed ${colors.warning.alpha(0.7)};
        z-index: 1;

        > button {
          position: sticky;
          top: 0;
          font-size: 10px;
          font-family: ${fonts.decorative};
          color: ${colors.warning.var};
          background: ${colors.bgPrimary.var};
          border: 1px solid ${colors.warning.alpha(0.5)};
          border-radius: 3px;
          padding: 0 4px;
          margin-left: 2px;
          white-space: nowrap;
          display: block;
        }
      }

      > .row {
        display: grid;
        grid-template-columns: ${String(labelColumnWidth)}px 1fr;
        height: 22px;
        align-items: center;
        border-radius: 3px;
        width: 100%;

        &:hover {
          background: ${colors.white.alpha(0.05)};
        }

        > .label {
          ${inline({ gap: 6 })};
          font-size: 12px;
          padding-right: 10px;
          overflow: hidden;

          > .name {
            ${ellipsis};
            flex-shrink: 1;
          }

          > .alias {
            ${ellipsis};
            flex-shrink: 4;
            opacity: 0.5;
            font-size: 11px;
          }
        }

        > .track {
          position: relative;
          height: 100%;

          > .bar {
            position: absolute;
            top: 5px;
            bottom: 5px;
            border-radius: 2px;
            background: ${colors.success.alpha(0.8)};
            min-width: 3px;

            &.warning {
              background: ${colors.warning.alpha(0.85)};
            }

            &.error {
              background: ${colors.error.alpha(0.9)};
            }

            &.pending {
              background: ${colors.secondary.alpha(0.7)};
              animation: devtoolsPendingPulse 1.2s ease-in-out infinite;
            }

            &.ws {
              background: ${colors.primary.alpha(0.8)};
            }
          }

          > .duration {
            position: absolute;
            top: 0;
            bottom: 0;
            ${inline()};
            font-size: 10px;
            font-family: ${fonts.decorative};
            color: ${colors.white.alpha(0.6)};
            padding-left: 5px;
            pointer-events: none;
          }
        }
      }
    }

    @keyframes devtoolsPendingPulse {
      0%,
      100% {
        opacity: 1;
      }
      50% {
        opacity: 0.4;
      }
    }
  }
`

type TimelineRow = {
  request: ApiRequest
  callID: string
  callName: string
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

const maxVisibleRows = 400

export const TimelineViewPage = () => {
  let now = $signal(Date.now())

  const nowInterval = window.setInterval(() => {
    now = Date.now()
  }, 1000)

  onCleanup(() => window.clearInterval(nowInterval))

  const allRows = createMemo((): TimelineRow[] => {
    const rows: TimelineRow[] = []

    for (const [callID, call] of Object.entries(callsStore.calls)) {
      for (const request of call.requests) {
        rows.push({ request, callID, callName: call.name })
      }
    }

    return rows.sort((a, b) => a.request.startTime - b.request.startTime)
  })

  function requestEndTime(request: ApiRequest): number {
    return request.status === 'pending'
      ? now
      : request.startTime + request.duration
  }

  const domain = createMemo(() => {
    const rows = allRows()
    const markers = callsStore.markers

    let min = Infinity
    let max = -Infinity

    for (const row of rows) {
      min = Math.min(min, row.request.startTime)
      max = Math.max(max, requestEndTime(row.request))
    }

    for (const marker of markers) {
      min = Math.min(min, marker.time)
      max = Math.max(max, marker.time)
    }

    if (min === Infinity) return null

    return { start: min, end: Math.max(max, min + 100) }
  })

  // selection is stored in absolute time so it stays put while the
  // domain keeps growing with new requests
  let selection = $signal<{ start: number; end: number } | null>(null)

  let brushEl: HTMLDivElement | undefined
  let dragMode: 'start' | 'end' | 'new' | null = null
  let dragAnchorTime = 0
  let dragDomain: { start: number; end: number } | null = null

  function fracFromEvent(e: PointerEvent): number {
    if (!brushEl) return 0

    const rect = brushEl.getBoundingClientRect()

    if (rect.width === 0) return 0

    return clamp((e.clientX - rect.left) / rect.width, 0, 1)
  }

  function timeFromEvent(e: PointerEvent): number {
    if (!dragDomain) return 0

    return (
      dragDomain.start + (dragDomain.end - dragDomain.start) * fracFromEvent(e)
    )
  }

  function onBrushPointerDown(e: PointerEvent) {
    dragDomain = domain()

    if (!dragDomain) return

    const time = timeFromEvent(e)

    const handle =
      e.target instanceof HTMLElement
        ? e.target.closest('[data-handle]')
        : null

    if (handle instanceof HTMLElement && handle.dataset.handle === 'start') {
      dragMode = 'start'
    } else if (
      handle instanceof HTMLElement &&
      handle.dataset.handle === 'end'
    ) {
      dragMode = 'end'
    } else {
      dragMode = 'new'
      dragAnchorTime = time
      selection = { start: time, end: time }
    }

    brushEl?.setPointerCapture(e.pointerId)
  }

  function onBrushPointerMove(e: PointerEvent) {
    if (!dragMode) return

    const time = timeFromEvent(e)
    const current = selection

    if (dragMode === 'start') {
      if (current) {
        selection = { start: Math.min(time, current.end), end: current.end }
      }
    } else if (dragMode === 'end') {
      if (current) {
        selection = { start: current.start, end: Math.max(time, current.start) }
      }
    } else {
      selection = {
        start: Math.min(dragAnchorTime, time),
        end: Math.max(dragAnchorTime, time),
      }
    }
  }

  function onBrushPointerUp() {
    if (!dragMode) return

    dragMode = null

    // treat a click without dragging as a filter reset
    const current = selection

    if (current && dragDomain) {
      const minSpan = (dragDomain.end - dragDomain.start) * 0.005

      if (current.end - current.start < minSpan) {
        selection = null
      }
    }

    dragDomain = null
  }

  const visibleRange = createMemo(() => {
    const fullDomain = domain()

    if (!fullDomain) return null

    const current = selection

    if (!current) return fullDomain

    return { start: current.start, end: Math.max(current.end, current.start + 10) }
  })

  const visibleRows = createMemo(() => {
    const range = visibleRange()

    if (!range) return []

    return allRows().filter((row) => {
      return (
        row.request.startTime <= range.end &&
        requestEndTime(row.request) >= range.start
      )
    })
  })

  const rowsToRender = $(visibleRows().slice(-maxVisibleRows))

  const visibleMarkers = createMemo(() => {
    const range = visibleRange()

    if (!range) return []

    return callsStore.markers.filter(
      (marker) => marker.time >= range.start && marker.time <= range.end,
    )
  })

  function fracInRange(time: number): number {
    const range = visibleRange()

    if (!range) return 0

    return clamp((time - range.start) / (range.end - range.start), 0, 1)
  }

  function fracInDomain(time: number): number {
    const fullDomain = domain()

    if (!fullDomain) return 0

    return clamp(
      (time - fullDomain.start) / (fullDomain.end - fullDomain.start),
      0,
      1,
    )
  }

  function markerLeftStyle(marker: TimelineMarker): string {
    return `calc(${String(labelColumnWidth)}px + (100% - ${String(
      labelColumnWidth,
    )}px) * ${fracInRange(marker.time)})`
  }

  return (
    <div class={containerStyle}>
      <h1>timeline</h1>

      {!domain() ? (
        <div class="empty">no requests tracked yet</div>
      ) : (
        <>
          <div
            class={brushStyle}
            ref={brushEl}
            onPointerDown={onBrushPointerDown}
            onPointerMove={onBrushPointerMove}
            onPointerUp={onBrushPointerUp}
            title="Drag to filter a time range, click to reset"
          >
            <For each={allRows()}>
              {(row) => (
                <div
                  class="tick"
                  classList={{
                    error: row.request.isError,
                    warning:
                      !row.request.isError && !!row.request.warnings?.length,
                    pending: row.request.status === 'pending',
                  }}
                  style={{
                    left: `${fracInDomain(row.request.startTime) * 100}%`,
                  }}
                />
              )}
            </For>

            <For each={callsStore.markers}>
              {(marker) => (
                <div
                  class="tick marker"
                  style={{ left: `${fracInDomain(marker.time) * 100}%` }}
                />
              )}
            </For>

            <Show when={selection}>
              {(sel) => (
                <>
                  <div
                    class="shade"
                    style={{
                      left: '0',
                      width: `${fracInDomain(sel().start) * 100}%`,
                    }}
                  />
                  <div
                    class="shade"
                    style={{
                      left: `${fracInDomain(sel().end) * 100}%`,
                      right: '0',
                    }}
                  />

                  <div
                    class="handle"
                    data-handle="start"
                    style={{ left: `${fracInDomain(sel().start) * 100}%` }}
                  />
                  <div
                    class="handle"
                    data-handle="end"
                    style={{ left: `${fracInDomain(sel().end) * 100}%` }}
                  />
                </>
              )}
            </Show>
          </div>

          <div class={timeLabelsStyle}>
            <span>
              {dayjs(visibleRange()?.start).format('HH:mm:ss.SSS')}
            </span>
            <span>
              {visibleRows().length} requests
              {visibleRows().length > maxVisibleRows &&
                ` (showing last ${maxVisibleRows})`}
            </span>
            <span>{dayjs(visibleRange()?.end).format('HH:mm:ss.SSS')}</span>
          </div>

          <div class={waterfallStyle}>
            <div class="content">
              <For each={visibleMarkers()}>
                {(marker) => (
                  <div
                    class="marker-line"
                    style={{ left: markerLeftStyle(marker) }}
                  >
                    <button
                      title={`${marker.label} · ${dayjs(marker.time).format(
                        'HH:mm:ss.SSS',
                      )} · click to remove`}
                      onClick={() => removeMarker(marker.id)}
                    >
                      {marker.label}
                    </button>
                  </div>
                )}
              </For>

              <For each={rowsToRender}>
                {(row) => {
                  const barLeft = $(fracInRange(row.request.startTime) * 100)
                  const barRight = $(
                    fracInRange(requestEndTime(row.request)) * 100,
                  )

                  return (
                    <div
                      class="row"
                      role="button"
                      tabIndex={0}
                      title={`${row.callName} · ${
                        row.request.status === 'pending'
                          ? 'pending'
                          : `${formatNum(row.request.duration, {
                              maximumFractionDigits: 0,
                            })}ms`
                      }`}
                      onClick={() => {
                        setUiStore({
                          selectedPage: 'explorer',
                          selectedCall: row.callID,
                          selectedRequest: row.request.id,
                          selectedSubitem: null,
                        })
                      }}
                    >
                      <div class="label">
                        <span class="name">{row.callName}</span>
                        {!!row.request.alias && (
                          <span class="alias">{row.request.alias}</span>
                        )}
                      </div>

                      <div class="track">
                        <div
                          class="bar"
                          classList={{
                            error: row.request.isError,
                            warning:
                              !row.request.isError &&
                              !!row.request.warnings?.length,
                            pending: row.request.status === 'pending',
                            ws: row.request.type === 'ws',
                          }}
                          style={{
                            left: `${barLeft}%`,
                            width: `${Math.max(barRight - barLeft, 0.2)}%`,
                          }}
                        />

                        <span
                          class="duration"
                          style={{ left: `${Math.min(barRight, 88)}%` }}
                        >
                          {row.request.status === 'pending'
                            ? 'pending…'
                            : `${formatNum(row.request.duration, {
                                maximumFractionDigits: 0,
                              })}ms`}
                        </span>
                      </div>
                    </div>
                  )
                }}
              </For>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
