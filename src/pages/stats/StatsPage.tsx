import ButtonElement from '@src/components/ButtonElement'
import {
  ApiRequest,
  callsStore,
} from '@src/stores/callsStore'
import { setUiStore } from '@src/stores/uiStore'
import { formatNum } from '@src/utils/formatNum'
import { getUnusedResponseDataSize } from '@src/utils/getUnusedResponseData'
import { ellipsis } from '@src/style/helpers/ellipsis'
import { inline } from '@src/style/helpers/inline'
import { stack } from '@src/style/helpers/stack'
import { colors, fonts } from '@src/style/theme'
import { tryExpression } from '@utils/tryExpression'
import { createMemo } from 'solid-js'
import { css } from 'solid-styled-components'

const containerStyle = css`
  &&& {
    ${stack({ align: 'stretch' })};
    overflow-y: auto;
    padding: 12px 16px 24px;
    gap: 20px;

    > h1 {
      font-size: 16px;
      font-family: ${fonts.decorative};
      color: ${colors.secondary.var};
      padding-bottom: 4px;
    }
  }
`

const overviewStyle = css`
  &&& {
    ${inline({ gap: 12 })};
    flex-wrap: wrap;

    > div {
      ${stack({ align: 'left' })};
      background: ${colors.white.alpha(0.04)};
      border: 1px solid ${colors.white.alpha(0.08)};
      border-radius: 6px;
      padding: 10px 14px;
      min-width: 120px;
      gap: 2px;

      > .label {
        font-size: 11px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: ${colors.white.alpha(0.5)};
      }

      > .value {
        font-size: 20px;
        font-family: ${fonts.decorative};

        &.error {
          color: ${colors.error.var};
        }

        &.warning {
          color: ${colors.warning.var};
        }

        &.pending {
          color: ${colors.secondary.var};
        }
      }
    }
  }
`

const sectionStyle = css`
  &&& {
    ${stack({ align: 'stretch' })};
    gap: 6px;

    > h2 {
      font-size: 13px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: ${colors.primary.var};
    }

    > .empty {
      opacity: 0.4;
      font-size: 13px;
    }

    > .hint {
      font-size: 11px;
      color: ${colors.white.alpha(0.4)};
      margin-top: -4px;
    }
  }
`

const statItemStyle = css`
  &&& {
    ${stack({ align: 'stretch' })};
    position: relative;
    padding: 5px 10px;
    border-radius: 4px;
    overflow: hidden;
    gap: 2px;

    &:hover {
      background: ${colors.white.alpha(0.06)};
    }

    > .bar {
      position: absolute;
      inset: 0 auto 0 0;
      background: ${colors.secondary.alpha(0.12)};
      pointer-events: none;

      &.error {
        background: ${colors.error.alpha(0.15)};
      }

      &.warning {
        background: ${colors.warning.alpha(0.12)};
      }
    }

    > .row {
      ${inline({ gap: 8 })};
      position: relative;
      font-size: 13px;
      max-width: 100%;

      > .name {
        ${ellipsis};
        flex-shrink: 1;
      }

      > .detail {
        ${ellipsis};
        flex-shrink: 4;
        opacity: 0.55;
        font-size: 12px;
      }

      > .metric {
        margin-left: auto;
        font-family: ${fonts.decorative};
        flex-shrink: 0;
        color: ${colors.secondary.var};

        &.error {
          color: ${colors.error.var};
        }

        &.warning {
          color: ${colors.warning.var};
        }
      }
    }
  }
`

type FlatRequest = {
  request: ApiRequest
  callID: string
  callName: string
}

const duplicatedWindowMs = 10_000

function getResponseSize(request: ApiRequest): number {
  return (
    tryExpression(() =>
      request.response === undefined
        ? 0
        : JSON.stringify(request.response).length,
    ) || 0
  )
}

function formatBytes(bytes: number): string {
  return formatNum(bytes, {
    unit: 'byte',
    style: 'unit',
    notation: 'compact',
    unitDisplay: 'narrow',
  })
}

function requestLabel(item: FlatRequest): string {
  return (
    item.request.alias ||
    (item.request.payload ? JSON.stringify(item.request.payload) : '')
  )
}

function openInExplorer(item: FlatRequest) {
  setUiStore({
    selectedPage: 'explorer',
    selectedCall: item.callID,
    selectedRequest: item.request.id,
    selectedSubitem: null,
  })
}

export const StatsPage = () => {
  const allRequests = createMemo((): FlatRequest[] => {
    const result: FlatRequest[] = []

    for (const [callID, call] of Object.entries(callsStore.calls)) {
      for (const request of call.requests) {
        result.push({ request, callID, callName: call.name })
      }
    }

    return result
  })

  const apiRequests = $(
    allRequests().filter((item) => item.request.type !== 'ws'),
  )

  const overview = createMemo(() => {
    const requests = apiRequests

    let errors = 0
    let warnings = 0
    let pending = 0
    let totalDuration = 0
    let completed = 0

    for (const { request } of requests) {
      if (request.warnings?.length) warnings++

      if (request.status === 'pending') pending++
      else {
        completed++
        totalDuration += request.duration

        if (request.isError) errors++
      }
    }

    return {
      total: requests.length,
      errors,
      warnings,
      pending,
      avgDuration: completed === 0 ? 0 : totalDuration / completed,
    }
  })

  const slowestRequests = createMemo(() => {
    return apiRequests
      .filter((item) => item.request.status !== 'pending')
      .sort((a, b) => b.request.duration - a.request.duration)
      .slice(0, 10)
  })

  const heaviestRequests = createMemo(() => {
    return apiRequests
      .map((item) => ({ ...item, size: getResponseSize(item.request) }))
      .filter((item) => item.size > 0)
      .sort((a, b) => b.size - a.size)
      .slice(0, 10)
  })

  const duplicatedRequests = createMemo(() => {
    const groups = new Map<string, FlatRequest[]>()

    for (const item of apiRequests) {
      const key = `${item.callID}|${
        tryExpression(() => JSON.stringify(item.request.payload)) || ''
      }`

      const group = groups.get(key)

      if (group) group.push(item)
      else groups.set(key, [item])
    }

    const duplicated: {
      item: FlatRequest
      count: number
      windowMs: number
      sameResponse: boolean
    }[] = []

    for (const group of groups.values()) {
      if (group.length < 2) continue

      const sorted = [...group].sort(
        (a, b) => a.request.startTime - b.request.startTime,
      )

      // find the largest cluster of requests within the duplicated window
      let bestStart = 0
      let bestEnd = 0
      let start = 0

      for (let end = 1; end < sorted.length; end++) {
        const endItem = sorted[end]
        let startItem = sorted[start]

        while (
          endItem &&
          startItem &&
          endItem.request.startTime - startItem.request.startTime >
            duplicatedWindowMs
        ) {
          start++
          startItem = sorted[start]
        }

        if (end - start > bestEnd - bestStart) {
          bestStart = start
          bestEnd = end
        }
      }

      const clusterSize = bestEnd - bestStart + 1

      if (clusterSize < 2) continue

      const cluster = sorted.slice(bestStart, bestEnd + 1)
      const firstItem = cluster[0]
      const lastItem = cluster[cluster.length - 1]

      if (!firstItem || !lastItem) continue

      const responses = new Set(
        cluster.map(
          (item) =>
            tryExpression(() => JSON.stringify(item.request.response)) || '',
        ),
      )

      duplicated.push({
        item: lastItem,
        count: clusterSize,
        windowMs:
          lastItem.request.startTime - firstItem.request.startTime,
        sameResponse: responses.size === 1,
      })
    }

    return duplicated.sort((a, b) => b.count - a.count).slice(0, 10)
  })

  const unusedDataByCall = createMemo(() => {
    const byCall = new Map<
      string,
      {
        item: FlatRequest
        fields: Set<string>
        requestsCount: number
        unusedBytes: number
      }
    >()

    for (const item of allRequests()) {
      if (
        !item.request.unusedResponseData ||
        item.request.unusedResponseData.length === 0
      ) {
        continue
      }

      const unusedBytes = getUnusedResponseDataSize(
        item.request.response,
        item.request.unusedResponseData,
      )

      const existing = byCall.get(item.callID)

      if (existing) {
        existing.requestsCount++
        existing.item = item
        existing.unusedBytes += unusedBytes

        for (const field of item.request.unusedResponseData) {
          existing.fields.add(field)
        }
      } else {
        byCall.set(item.callID, {
          item,
          fields: new Set(item.request.unusedResponseData),
          requestsCount: 1,
          unusedBytes,
        })
      }
    }

    return [...byCall.values()].sort(
      (a, b) =>
        b.unusedBytes - a.unusedBytes || b.fields.size - a.fields.size,
    )
  })

  const maxSlowDuration = $(slowestRequests()[0]?.request.duration || 1)
  const maxHeavySize = $(heaviestRequests()[0]?.size || 1)

  return (
    <div class={containerStyle}>
      <h1>api stats</h1>

      <div class={overviewStyle}>
        <div>
          <span class="label">requests</span>
          <span class="value">{formatNum(overview().total)}</span>
        </div>
        <div>
          <span class="label">errors</span>
          <span
            class="value"
            classList={{ error: overview().errors > 0 }}
          >
            {formatNum(overview().errors)}
          </span>
        </div>
        <div>
          <span class="label">warnings</span>
          <span
            class="value"
            classList={{ warning: overview().warnings > 0 }}
          >
            {formatNum(overview().warnings)}
          </span>
        </div>
        <div>
          <span class="label">pending</span>
          <span
            class="value"
            classList={{ pending: overview().pending > 0 }}
          >
            {formatNum(overview().pending)}
          </span>
        </div>
        <div>
          <span class="label">avg duration</span>
          <span class="value">
            {formatNum(overview().avgDuration, { maximumFractionDigits: 0 })}{' '}
            ms
          </span>
        </div>
      </div>

      <div class={sectionStyle}>
        <h2>Slowest requests</h2>

        <For
          each={slowestRequests()}
          fallback={<div class="empty">no completed requests</div>}
        >
          {(item) => (
            <ButtonElement
              class={statItemStyle}
              onClick={() => openInExplorer(item)}
            >
              <div
                class="bar"
                classList={{ error: item.request.duration > 1000 }}
                style={{
                  width: `${(item.request.duration / maxSlowDuration) * 100}%`,
                }}
              />
              <div class="row">
                <span class="name">{item.callName}</span>
                <span class="detail">{requestLabel(item)}</span>
                <span
                  class="metric"
                  classList={{ error: item.request.duration > 1000 }}
                >
                  {formatNum(item.request.duration, {
                    maximumFractionDigits: 0,
                  })}{' '}
                  ms
                </span>
              </div>
            </ButtonElement>
          )}
        </For>
      </div>

      <div class={sectionStyle}>
        <h2>Heaviest responses</h2>

        <For
          each={heaviestRequests()}
          fallback={<div class="empty">no responses received</div>}
        >
          {(item) => (
            <ButtonElement
              class={statItemStyle}
              onClick={() => openInExplorer(item)}
            >
              <div
                class="bar"
                style={{ width: `${(item.size / maxHeavySize) * 100}%` }}
              />
              <div class="row">
                <span class="name">{item.callName}</span>
                <span class="detail">{requestLabel(item)}</span>
                <span class="metric">{formatBytes(item.size)}</span>
              </div>
            </ButtonElement>
          )}
        </For>
      </div>

      <div class={sectionStyle}>
        <h2>Duplicated requests</h2>
        <div class="hint">
          requests with the same payload repeated within{' '}
          {duplicatedWindowMs / 1000}s
        </div>

        <For
          each={duplicatedRequests()}
          fallback={<div class="empty">no duplicated requests detected</div>}
        >
          {(duplicate) => (
            <ButtonElement
              class={statItemStyle}
              onClick={() => openInExplorer(duplicate.item)}
            >
              <div
                class="bar warning"
                style={{
                  width: `${Math.min(duplicate.count * 10, 100)}%`,
                }}
              />
              <div class="row">
                <span class="name">{duplicate.item.callName}</span>
                <span class="detail">{requestLabel(duplicate.item)}</span>
                {duplicate.sameResponse && (
                  <span class="detail">same response</span>
                )}
                <span class="metric warning">
                  {duplicate.count}x in{' '}
                  {formatNum(duplicate.windowMs / 1000, {
                    maximumFractionDigits: 1,
                  })}
                  s
                </span>
              </div>
            </ButtonElement>
          )}
        </For>
      </div>

      <div class={sectionStyle}>
        <h2>Unused response data</h2>
        <div class="hint">
          response fields reported as not used by the app, an opportunity to
          reduce payload sizes
        </div>

        <For
          each={unusedDataByCall()}
          fallback={<div class="empty">no unused response data reported</div>}
        >
          {(unused) => (
            <ButtonElement
              class={statItemStyle}
              onClick={() => openInExplorer(unused.item)}
            >
              <div
                class="bar warning"
                style={{
                  width: `${Math.min(unused.fields.size * 10, 100)}%`,
                }}
              />
              <div class="row">
                <span class="name">{unused.item.callName}</span>
                <span class="detail">{[...unused.fields].join(', ')}</span>
                <span class="metric warning">
                  {unused.fields.size} field
                  {unused.fields.size === 1 ? '' : 's'}
                  {unused.unusedBytes > 0 &&
                    ` · ${formatNum(unused.unusedBytes, {
                      unit: 'byte',
                      style: 'unit',
                      notation: 'compact',
                      unitDisplay: 'narrow',
                    })} unused`}
                </span>
              </div>
            </ButtonElement>
          )}
        </For>
      </div>
    </div>
  )
}
