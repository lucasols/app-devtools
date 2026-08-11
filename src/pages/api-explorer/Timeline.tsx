import ButtonElement from '@src/components/ButtonElement'
import { openMarkerDialog } from '@src/components/AddMarkerDialog'
import {
  ApiRequest,
  NavigationChange,
  TimelineMarker,
  callsStore,
  lastAddedCallID,
} from '@src/stores/callsStore'
import {
  setUiStore,
  showNavigationChanges,
  uiStore,
} from '@src/stores/uiStore'
import { ellipsis } from '@src/style/helpers/ellipsis'
import { inline } from '@src/style/helpers/inline'
import { stack } from '@src/style/helpers/stack'
import { colors, fonts } from '@src/style/theme'
import { formatNum } from '@src/utils/formatNum'
import { reverseCopy } from '@utils/arrayUtils'
import { createSignalRef } from '@utils/solid'
import dayjs from 'dayjs'
import { createMemo, onCleanup, onMount } from 'solid-js'
import { css } from 'solid-styled-components'
import { getRequestPayload } from './getRequestPayload'
import { getTypeTag, typeTagStyle } from './typeTag'

const containerStyle = css`
  &&& {
    ${stack()};
    border-right: 1px solid ${colors.white.alpha(0.1)};

    > .header {
      ${inline({ gap: 8, justify: 'spaceBetween' })};
      width: 100%;
      padding: 10px 12px 16px;

      > h1 {
        font-size: 16px;
        font-family: ${fonts.decorative};
        color: ${colors.secondary.var};
      }

      > button {
        font-size: 11px;
        opacity: 0.5;

        &:hover,
        &.active {
          opacity: 1;
        }

        &.active {
          color: ${colors.primary.var};
        }
      }
    }
  }
`

const itemsContainerStyle = css`
  &&& {
    position: relative;
    flex: 1 1;
    overflow-y: auto;

    > .virtual-content {
      position: relative;
      width: 100%;
    }

    .virtual-window {
      position: absolute;
      inset: 0 0 auto;
      ${stack()};
    }
  }
`

const requestItemStyle = css`
  &&& {
    font-size: 13px;
    ${stack()};
    height: 32px;
    flex-shrink: 0;

    &.warning {
      color: ${colors.warning.var};
    }

    &.error {
      color: ${colors.error.var};
      font-weight: 600;
    }

    &.pending {
      color: ${colors.secondary.var};

      .payload {
        opacity: 0.7;
      }
    }

    > button {
      padding: 4px 12px;
      ${inline({ gap: 8 })};
      opacity: 0.8;

      &.selected {
        opacity: 1;
        background-color: ${colors.secondary.alpha(0.16)};
      }

      > .start-time {
        font-family: ${fonts.decorative};
      }

      > .separator {
        opacity: 0.5;
      }

      > .payload {
        ${ellipsis};
        flex-shrink: 1;
      }

      > .pending-indicator {
        font-size: 11px;
        border: 1px solid ${colors.secondary.alpha(0.6)};
        border-radius: 4px;
        padding: 0 3px;
        flex-shrink: 0;
      }

      > .duration {
        font-family: ${fonts.decorative};
        font-size: 11px;
        color: ${colors.white.alpha(0.5)};
        flex-shrink: 0;
      }
    }
  }
`

const markerItemStyle = css`
  &&& {
    ${inline({ gap: 8 })};
    padding: 2px 12px;
    font-size: 12px;
    color: ${colors.warning.var};
    font-family: ${fonts.decorative};
    height: 32px;
    flex-shrink: 0;

    &::before,
    &::after {
      content: '';
      flex: 1 1;
      border-top: 1px dashed ${colors.warning.alpha(0.5)};
    }

    > span {
      ${ellipsis};
      flex-shrink: 1;
    }
  }
`

const navigationItemStyle = css`
  &&& {
    ${inline({ gap: 8 })};
    padding: 2px 12px;
    font-size: 12px;
    color: ${colors.secondary.var};
    font-family: ${fonts.decorative};
    height: 32px;
    flex-shrink: 0;

    &::before,
    &::after {
      content: '';
      flex: 1 1;
      border-top: 1px dashed ${colors.secondary.alpha(0.5)};
    }

    > span {
      ${ellipsis};
      flex-shrink: 1;
    }
  }
`

const emptyStateStyle = css`
  &&& {
    opacity: 0.4;
    font-size: 14px;
    padding: 12px;
    padding-top: 0;
  }
`

type TimelineItem =
  | { itemType: 'request'; request: ApiRequest; time: number }
  | { itemType: 'marker'; marker: TimelineMarker; time: number }
  | {
      itemType: 'navigation'
      navigation: NavigationChange
      time: number
    }

const timelineItemHeight = 32
const timelineOverscan = 8

export const Timeline = () => {
  const scrollTop = createSignalRef(0)
  const viewportHeight = createSignalRef(0)
  let itemsContainer: HTMLDivElement | undefined

  onMount(() => {
    const container = itemsContainer

    if (!container) return

    const updateViewportHeight = () => {
      viewportHeight.value = container.clientHeight
    }

    const resizeObserver = new window.ResizeObserver(updateViewportHeight)

    resizeObserver.observe(container)
    updateViewportHeight()
    onCleanup(() => resizeObserver.disconnect())
  })

  function getSelectedCall() {
    const selectedCallId = uiStore.selectedCall

    if (!selectedCallId) {
      const callsEntries = callsStore.calls[lastAddedCallID.value]

      return callsEntries || null
    }

    if (selectedCallId) {
      return callsStore.calls[selectedCallId]
    }

    return null
  }

  const requests = createMemo(() => {
    const reversed = reverseCopy(getSelectedCall()?.requests)
    return reversed.length === 0 ? null : reversed
  })

  const filteredRequests = createMemo(() => {
    if (uiStore.selectedSubitem) {
      return requests()?.filter((request) => {
        return request.alias === uiStore.selectedSubitem
      })
    } else {
      return requests()
    }
  })

  const timelineItems = createMemo((): TimelineItem[] | null => {
    const requestsToShow = filteredRequests()

    if (!requestsToShow || requestsToShow.length === 0) return null

    const items: TimelineItem[] = requestsToShow.map((request) => ({
      itemType: 'request',
      request,
      time: request.startTime,
    }))

    for (const marker of callsStore.markers) {
      items.push({ itemType: 'marker', marker, time: marker.time })
    }

    if (showNavigationChanges.value) {
      for (const navigation of callsStore.navigationChanges) {
        items.push({
          itemType: 'navigation',
          navigation,
          time: navigation.time,
        })
      }
    }

    // newest first
    return items.sort((a, b) => b.time - a.time)
  })

  const virtualTimeline = createMemo(() => {
    const items = timelineItems() ?? []
    const visibleCount =
      Math.ceil(viewportHeight.value / timelineItemHeight) +
      timelineOverscan * 2
    const start = Math.min(
      Math.max(
        0,
        Math.floor(scrollTop.value / timelineItemHeight) - timelineOverscan,
      ),
      Math.max(0, items.length - visibleCount),
    )
    const end = Math.min(items.length, start + visibleCount)

    return {
      items: items.slice(start, end),
      offset: start * timelineItemHeight,
      totalHeight: items.length * timelineItemHeight,
    }
  })

  const selectedRequestId = $(
    uiStore.selectedRequest || filteredRequests()?.[0]?.id,
  )

  return (
    <div class={containerStyle}>
      <div class="header">
        <h1>timeline</h1>

        <ButtonElement
          classList={{ active: showNavigationChanges.value }}
          title={
            showNavigationChanges.value
              ? 'Hide navigation changes in timelines'
              : 'Show navigation changes in timelines'
          }
          onClick={() => {
            showNavigationChanges.value = !showNavigationChanges.value
          }}
        >
          navigation
        </ButtonElement>
      </div>

      <div
        class={itemsContainerStyle}
        ref={itemsContainer}
        onScroll={(event) => {
          scrollTop.value = event.currentTarget.scrollTop
        }}
      >
        <div
          class="virtual-content"
          style={{ height: `${virtualTimeline().totalHeight}px` }}
        >
          <div
            class="virtual-window"
            style={{ transform: `translateY(${virtualTimeline().offset}px)` }}
          >
        <For
          each={virtualTimeline().items}
          fallback={<div class={emptyStateStyle}>no requests found</div>}
        >
          {(item) => {
            if (item.itemType === 'marker') {
              return (
                <ButtonElement
                  class={markerItemStyle}
                  title={`${dayjs(item.marker.time).format(
                    'HH:mm:ss.SSS',
                  )} · click for options`}
                  onClick={() => openMarkerDialog(item.marker)}
                >
                  <span>
                    {item.marker.label} ·{' '}
                    {dayjs(item.marker.time).format('HH:mm:ss')}
                  </span>
                </ButtonElement>
              )
            }

            if (item.itemType === 'navigation') {
              return (
                <div
                  class={navigationItemStyle}
                  title={`${item.navigation.from} → ${item.navigation.to} · ${dayjs(
                    item.navigation.time,
                  ).format('HH:mm:ss.SSS')}`}
                >
                  <span>
                    {item.navigation.to} ·{' '}
                    {dayjs(item.navigation.time).format('HH:mm:ss')}
                  </span>
                </div>
              )
            }

            const request = item.request

            const startTime = dayjs(request.startTime)
            const formattedStartTime = startTime.format('HH:mm:ss')
            const relativeStartTime = startTime.fromNow()

            const payload = getRequestPayload(request)
            const typeTag = getTypeTag(request)

            return (
              <div
                class={requestItemStyle}
                classList={{
                  error: request.isError,
                  warning: !request.isError && !!request.warnings?.length,
                  pending: request.status === 'pending',
                }}
              >
                <ButtonElement
                  onClick={() => {
                    setUiStore('selectedRequest', request.id)
                  }}
                  classList={{
                    selected: request.id === selectedRequestId,
                  }}
                >
                  <span
                    class="start-time"
                    title={relativeStartTime}
                  >
                    {formattedStartTime}
                  </span>

                  <span
                    class={`${typeTagStyle} ${typeTag.class}`}
                    title={typeTag.description}
                  >
                    {typeTag.label}
                  </span>

                  {request.status === 'pending' && (
                    <span class="pending-indicator">pending</span>
                  )}

                  {request.status !== 'pending' && (
                    <span class="duration">
                      {formatNum(request.duration, {
                        maximumFractionDigits: 0,
                      })}
                      ms
                    </span>
                  )}

                  {!!payload && (
                    <>
                      <span class="separator">|</span>
                      <span
                        class="payload"
                        title={payload}
                      >
                        {payload}
                      </span>
                    </>
                  )}
                </ButtonElement>
              </div>
            )
          }}
        </For>
          </div>
        </div>
      </div>
    </div>
  )
}
