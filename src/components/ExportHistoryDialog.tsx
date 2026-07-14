import ButtonElement from '@src/components/ButtonElement'
import Icon from '@src/components/Icon'
import { callsStore, getDisplayHeaders } from '@src/stores/callsStore'
import { getLogExportEntry, logsStore } from '@src/stores/logsStore'
import { copyToClipboard } from '@src/utils/copyToClipboard'
import { downloadJson } from '@src/utils/downloadJson'
import { getEnvironmentInfo } from '@src/utils/getEnvironmentInfo'
import { removeSensitiveData } from '@src/utils/removeSensitiveData'
import { showToast } from '@src/utils/toast'
import { inline } from '@src/style/helpers/inline'
import { stack } from '@src/style/helpers/stack'
import { colors, fonts, shadows } from '@src/style/theme'
import { createSignalRef } from '@utils/solid'
import { createStore } from 'solid-js/store'
import { css } from 'solid-styled-components'
import { getTypeTag, typeTagStyle } from '@src/pages/api-explorer/typeTag'

export const exportDialogIsOpen = createSignalRef(false)
export type ExportTimeRange = { start: number; end: number }
export const exportDialogTimeRange = createSignalRef<ExportTimeRange | null>(
  null,
)

export function openExportDialog(timeRange: ExportTimeRange | null = null) {
  exportDialogTimeRange.value = timeRange
  exportDialogIsOpen.value = true
}

const overlayStyle = css`
  &&& {
    position: absolute;
    inset: 0;
    z-index: 50;
    background: ${colors.black.alpha(0.5)};
    ${inline({ justify: 'center' })};
  }
`

const dialogStyle = css`
  &&& {
    ${stack({ align: 'stretch' })};
    width: 480px;
    max-width: calc(100% - 48px);
    max-height: calc(100% - 48px);
    background: ${colors.bgSecondary.var};
    border: 1px solid ${colors.white.alpha(0.1)};
    border-radius: 8px;
    box-shadow: ${shadows.modal};
    padding: 16px;
    gap: 12px;

    > h1 {
      font-size: 16px;
      font-family: ${fonts.decorative};
      color: ${colors.secondary.var};
    }

    > h2 {
      font-size: 12px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: ${colors.primary.var};
    }

    label {
      ${inline({ gap: 8 })};
      font-size: 13px;
      cursor: pointer;

      input {
        accent-color: ${colors.primary.var};
      }

      .count {
        opacity: 0.5;
        font-size: 12px;
      }

      .description {
        opacity: 0.5;
        font-size: 12px;
      }
    }

    > .calls-list {
      ${stack({ align: 'left' })};
      gap: 6px;
      overflow-y: auto;
      max-height: 260px;
      padding: 2px;
    }

    > .select-buttons {
      ${inline({ gap: 8 })};

      button {
        font-size: 12px;
        color: ${colors.secondary.var};

        &:hover {
          text-decoration: underline;
        }
      }
    }

    > .type-filter {
      ${inline({ gap: 6 })};

      button {
        font-size: 12px;
        opacity: 0.5;
        border: 1px solid ${colors.white.alpha(0.12)};
        border-radius: 4px;
        padding: 3px 8px;

        &.active {
          opacity: 1;
          color: ${colors.primary.var};
          border-color: ${colors.primary.alpha(0.5)};
        }
      }
    }

    > .options {
      ${stack({ align: 'left' })};
      gap: 6px;
      border-top: 1px solid ${colors.white.alpha(0.1)};
      padding-top: 12px;
    }

    > .actions {
      ${inline({ gap: 8, justify: 'right' })};
      padding-top: 4px;

      button {
        ${inline({ gap: 6 })};
        font-size: 13px;
        border-radius: 4px;
        padding: 6px 12px;
        background: ${colors.white.alpha(0.06)};
        --icon-size: 15px;

        &:hover {
          background: ${colors.white.alpha(0.12)};
        }

        &.primary {
          background: ${colors.primary.var};
          color: ${colors.bgPrimary.var};
          font-weight: 600;
        }
      }
    }

    > .empty {
      opacity: 0.5;
      font-size: 13px;
    }
  }
`

export const ExportHistoryDialog = () => {
  const initialSelection: Record<string, boolean> = {}

  for (const callID of Object.keys(callsStore.calls)) {
    initialSelection[callID] = true
  }

  const [selectedCalls, setSelectedCalls] = createStore(initialSelection)

  let includeResponses = $signal(true)
  let includeLogs = $signal(true)
  let privacyMode = $signal(false)
  let typeFilter = $signal<'all' | 'api' | 'ws'>('all')

  const timeRange = exportDialogTimeRange.value
  const allCallsEntries = $(
    Object.entries(callsStore.calls)
      .map(([callID, call]) => [
        callID,
        {
          ...call,
          requests: timeRange
            ? call.requests.filter(
                (request) =>
                  request.startTime <= timeRange.end &&
                  (request.status === 'pending'
                    ? Infinity
                    : request.startTime + request.duration) >= timeRange.start,
              )
            : call.requests,
        },
      ] as const)
      .filter(([, call]) => call.requests.length > 0),
  )
  const callsEntries = $(
    allCallsEntries.filter(([, call]) => {
      if (typeFilter === 'api') return call.type !== 'ws'
      if (typeFilter === 'ws') return call.type === 'ws'
      return true
    }),
  )

  function processValue(value: unknown): unknown {
    return privacyMode ? removeSensitiveData(value) : value
  }

  function buildExport(): unknown {
    return {
      exportedAt: new Date().toISOString(),
      environment: getEnvironmentInfo(),
      markers: callsStore.markers
        .filter(
          (marker) =>
            !timeRange ||
            (marker.time >= timeRange.start && marker.time <= timeRange.end),
        )
        .map((marker) => ({
        label: marker.label,
        time: marker.time,
        timeISO: new Date(marker.time).toISOString(),
        })),
      calls: callsEntries
        .filter(([callID]) => selectedCalls[callID])
        .map(([, call]) => ({
          name: call.name,
          path: call.path,
          type: call.type,
          subType: call.subType,
          requests: call.requests.map((request) => ({
            path: request.path,
            method: request.method,
            type: request.type,
            subType: request.subType,
            status: request.status,
            code: request.code,
            isError: request.isError,
            startTime: request.startTime,
            startTimeISO: new Date(request.startTime).toISOString(),
            duration: request.duration,
            tags: request.tags,
            warnings: request.warnings?.map((warning) =>
              warning.details !== undefined
                ? {
                    message: warning.message,
                    details: processValue(warning.details),
                  }
                : warning.message,
            ),
            alias: request.alias,
            payload: processValue(request.payload),
            searchParams: request.searchParams,
            // header values are masked unless explicitly allowed by the
            // visibleRequestHeaders config, they may contain sensitive data
            headers: request.headers
              ? processValue(getDisplayHeaders(request))
              : undefined,
            ...(includeResponses
              ? { response: processValue(request.response) }
              : {}),
          })),
        })),
      ...(includeLogs && logsStore.logs.length > 0
        ? {
            logs: logsStore.logs
              .filter(
                (log) =>
                  !timeRange ||
                  (log.time >= timeRange.start && log.time <= timeRange.end),
              )
              .map((log) => getLogExportEntry(log, processValue)),
          }
        : {}),
    }
  }

  function downloadExport() {
    downloadJson(buildExport(), 'devtools-history')

    showToast('History downloaded')
    exportDialogIsOpen.value = false
  }

  return (
    <div
      class={overlayStyle}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          exportDialogIsOpen.value = false
        }
      }}
    >
      <div class={dialogStyle}>
        <h1>export history</h1>

        {callsEntries.length === 0 ? (
          <div class="empty">no requests to export</div>
        ) : (
          <>
            <h2>Calls to include</h2>

            <div class="type-filter">
              <For each={['all', 'api', 'ws'] as const}>
                {(filter) => (
                  <ButtonElement
                    classList={{ active: typeFilter === filter }}
                    onClick={() => {
                      typeFilter = filter
                    }}
                  >
                    {filter === 'ws' ? 'WebSocket' : filter.toUpperCase()}
                  </ButtonElement>
                )}
              </For>
            </div>

            <div class="select-buttons">
              <ButtonElement
                onClick={() => {
                  for (const [callID] of callsEntries) {
                    setSelectedCalls(callID, true)
                  }
                }}
              >
                select all
              </ButtonElement>
              <ButtonElement
                onClick={() => {
                  for (const [callID] of callsEntries) {
                    setSelectedCalls(callID, false)
                  }
                }}
              >
                select none
              </ButtonElement>
            </div>

            <div class="calls-list">
              <For each={callsEntries}>
                {([callID, call]) => (
                  <label>
                    <input
                      type="checkbox"
                      checked={!!selectedCalls[callID]}
                      onChange={(e) => {
                        setSelectedCalls(callID, e.currentTarget.checked)
                      }}
                    />
                    {(() => {
                      const typeTag = getTypeTag({
                        type: call.type,
                        subType: call.subType,
                        method: call.requests.at(-1)?.method,
                      })

                      return (
                        <div
                          class={`${typeTagStyle} ${typeTag.class}`}
                          title={typeTag.description}
                        >
                          {typeTag.label}
                        </div>
                      )
                    })()}
                    <span>{call.name}</span>
                    <span class="count">
                      {call.requests.length} request
                      {call.requests.length === 1 ? '' : 's'}
                    </span>
                  </label>
                )}
              </For>
            </div>

            <div class="options">
              <label>
                <input
                  type="checkbox"
                  checked={includeResponses}
                  onChange={(e) => {
                    includeResponses = e.currentTarget.checked
                  }}
                />
                <span>Include responses</span>
              </label>

              {logsStore.logs.length > 0 && (
                <label>
                  <input
                    type="checkbox"
                    checked={includeLogs}
                    onChange={(e) => {
                      includeLogs = e.currentTarget.checked
                    }}
                  />
                  <span>Include logs</span>
                  <span class="count">{logsStore.logs.length} logs</span>
                </label>
              )}

              <label>
                <input
                  type="checkbox"
                  checked={privacyMode}
                  onChange={(e) => {
                    privacyMode = e.currentTarget.checked
                  }}
                />
                <span>Privacy mode</span>
                <span class="description">
                  values are replaced by type descriptions
                </span>
              </label>
            </div>

            <div class="actions">
              <ButtonElement
                onClick={() => {
                  exportDialogIsOpen.value = false
                }}
              >
                Cancel
              </ButtonElement>

              <ButtonElement onClick={downloadExport}>
                <Icon name="download" />
                Save .json
              </ButtonElement>

              <ButtonElement
                class="primary"
                onClick={() => {
                  void copyToClipboard(
                    JSON.stringify(buildExport(), null, 2),
                  ).then(() => {
                    exportDialogIsOpen.value = false
                  })
                }}
              >
                <Icon name="copy" />
                Copy JSON
              </ButtonElement>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
