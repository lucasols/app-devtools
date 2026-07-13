import ButtonElement from '@src/components/ButtonElement'
import Icon from '@src/components/Icon'
import { JsonViewer } from '@src/components/JsonViewer/JsonViewer'
import { Section } from '@src/components/Section'
import { TableView } from '@src/components/TableView'
import {
  ApiCall,
  callsStore,
  getDisplayHeaders,
  getDisplayPayload,
  lastAddedCallID,
  RequestWarning,
} from '@src/stores/callsStore'
import { openRequestInCaller, requestCallerStore } from '@src/stores/requestCallerStore'
import {
  setUiStore,
  showSensitiveValues,
  uiStore,
} from '@src/stores/uiStore'
import { copyToClipboard } from '@src/utils/copyToClipboard'
import {
  getUnusedResponseDataMap,
  getUnusedResponseDataSize,
} from '@src/utils/getUnusedResponseData'
import { getRequestAsCurl } from '@src/utils/requestToCurl'
import { ellipsis } from '@src/style/helpers/ellipsis'
import { inline } from '@src/style/helpers/inline'
import { stack } from '@src/style/helpers/stack'
import { colors, fonts } from '@src/style/theme'
import { formatNum } from '@src/utils/formatNum'
import { createMemoRef, createSignalRef } from '@utils/solid'
import dayjs from 'dayjs'
import { css } from 'solid-styled-components'

const containerStyle = css`
  &&& {
    ${stack()};
    padding-left: 10px;

    > h1 {
      margin-top: 12px;
      font-family: ${fonts.decorative};
      ${ellipsis};

      span.separator {
        font-size: 14px;
        font-weight: 300;
        opacity: 0.4;
        margin: 0 4px;
      }

      span.type {
        text-transform: capitalize;
        color: ${colors.secondary.var};
      }
    }

    > h2 {
      margin-top: 4px;
      font-family: ${fonts.decorative};
      font-size: 12px;
      opacity: 0.5;
    }

    .tags {
      ${inline({ gap: 8 })};
      margin-top: 8px;
      padding-right: 10px;

      .method {
        color: ${colors.primary.var};
      }

      .code {
        color: ${colors.success.var};

        &.error {
          color: ${colors.error.var};
        }
      }

      .tag {
        font-size: 11px;
        color: ${colors.warning.var};
        padding: 1px 3px;
        border-radius: 4px;
        border: 1px solid ${colors.warning.alpha(0.6)};

        &.error {
          color: ${colors.error.var};
          font-weight: 600;
          border-color: ${colors.error.alpha(0.6)};
        }

        &.warning {
          ${inline({ gap: 4 })};
          font-weight: 600;
          --icon-size: 12px;
        }

        &.pending {
          color: ${colors.secondary.var};
          border-color: ${colors.secondary.alpha(0.6)};
        }
      }

      .actions {
        margin-left: auto;
        ${inline({ gap: 8 })};

        button.action-button {
          ${inline({ gap: 4 })};
          font-size: 12px;
          color: ${colors.white.alpha(0.7)};
          padding: 2px 6px;
          border-radius: 4px;
          background: ${colors.white.alpha(0.05)};
          --icon-size: 13px;

          &:hover {
            color: ${colors.white.var};
            background: ${colors.white.alpha(0.1)};
          }
        }
      }
    }

    > .details {
      margin-top: 14px;
      padding-right: 10px;
      ${stack({ gap: 8 })};
      flex: 1 1;
      overflow-y: auto;
      padding-bottom: 20px;
    }
  }
`

const warningsListStyle = css`
  &&& {
    ${stack({ align: 'left' })};
    gap: 6px;

    > .warning-item {
      ${inline({ gap: 8 })};
      align-items: flex-start;
      font-size: 13px;
      color: ${colors.warning.var};
      --icon-size: 14px;
      align-self: stretch;

      > .icon {
        flex-shrink: 0;
        margin-top: 2px;
      }

      > .warning-content {
        ${stack({ align: 'left' })};
        gap: 4px;
        flex: 1 1;
      }
    }

    > .show-all {
      font-size: 12px;
      color: ${colors.white.alpha(0.5)};

      &:hover {
        color: ${colors.white.var};
      }
    }
  }
`

const maxVisibleWarnings = 10

const curlMenuStyle = css`
  &&& {
    position: relative;

    > .backdrop {
      position: fixed;
      inset: 0;
      z-index: 19;
    }

    > .menu {
      position: absolute;
      top: calc(100% + 4px);
      right: 0;
      z-index: 20;
      ${stack({ align: 'stretch' })};
      min-width: 170px;
      padding: 4px;
      background: ${colors.bgSecondary.var};
      border: 1px solid ${colors.white.alpha(0.1)};
      border-radius: 4px;

      > button {
        text-align: left;
        font-size: 12px;
        white-space: nowrap;
        color: ${colors.white.alpha(0.8)};
        padding: 6px 8px;
        border-radius: 4px;

        &:hover {
          color: ${colors.white.var};
          background: ${colors.white.alpha(0.08)};
        }
      }
    }
  }
`

// makes the json viewer search toolbar stretch flush to the section edges
const fullTabSectionStyle = css`
  &&& {
    --json-toolbar-bleed: 10px;
  }
`

const tabsStyle = css`
  &&& {
    ${inline({ gap: 20 })};
    color: ${colors.secondary.var};
    margin-top: 20px;

    > button {
      opacity: 0.74;
      padding-bottom: 2px;

      &.selected {
        border-bottom: 2px solid currentColor;
      }

      &.selected,
      &:hover {
        opacity: 1;
      }
    }
  }
`

export const RequestDetails = () => {
  const selectedCallId = $(uiStore.selectedCall)
  const selectedRequestId = $(uiStore.selectedRequest)
  const selectedTab = $(uiStore.selectedTab || 'summary')

  const selectedRequest = createMemoRef(() => {
    let selectedCall: ApiCall | undefined

    if (selectedCallId) {
      selectedCall = callsStore.calls[selectedCallId]
    } else {
      selectedCall = callsStore.calls[lastAddedCallID.value]
    }

    const selectedRequest =
      (selectedRequestId &&
        selectedCall?.requests.find(
          (request) => request.id === selectedRequestId,
        )) ||
      selectedCall?.requests.at(-1)

    if (selectedRequest && selectedCall) {
      return {
        ...selectedRequest,
        callName: selectedCall.name,
        callPath: selectedCall.path,
      }
    }

    return null
  })

  function getTab(tabId: string, label: string) {
    return (
      <ButtonElement
        classList={{
          selected: activeTab.value === tabId,
        }}
        onClick={() => {
          setUiStore('selectedTab', tabId)
        }}
      >
        {label}
      </ButtonElement>
    )
  }

  const displayHeaders = createMemoRef(() => {
    const request = selectedRequest.value

    if (!request) return null

    if (showSensitiveValues.value) return request.headers ?? null

    return getDisplayHeaders(request)
  })

  const displayPayload = createMemoRef(() => {
    const request = selectedRequest.value

    if (!request?.payload) return null

    return getDisplayPayload(request.payload)
  })

  const payloadToShow = createMemoRef(() => {
    return showSensitiveValues.value
      ? selectedRequest.value?.payload
      : displayPayload.value?.value
  })

  const curlMenuIsOpen = createSignalRef(false)

  function copyAsCurl(maskSensitiveData: boolean) {
    const request = selectedRequest.value

    if (request) {
      void copyToClipboard(getRequestAsCurl(request, { maskSensitiveData }))
    }

    curlMenuIsOpen.value = false
  }

  function formatBytes(sizeInBytes: number) {
    return formatNum(sizeInBytes, {
      unit: 'byte',
      style: 'unit',
      notation: 'compact',
      unitDisplay: 'narrow',
    })
  }

  const responseSize = createMemoRef(() => {
    if (!selectedRequest.value?.response) return false

    return formatBytes(JSON.stringify(selectedRequest.value.response).length)
  })

  function copyRequestAsJson() {
    const request = selectedRequest.value

    if (!request) return

    void copyToClipboard({
      call: request.callName,
      path: request.path,
      method: request.method,
      type: request.type,
      subType: request.subType,
      alias: request.alias,
      status: request.status,
      code: request.code,
      isError: request.isError,
      startTime: request.startTime,
      startTimeISO: new Date(request.startTime).toISOString(),
      duration: request.duration,
      tags: request.tags,
      warnings: request.warnings,
      // sensitive header and payload values are masked like in the ui, unless
      // the "show sensitive values" toggle is on
      payload: showSensitiveValues.value
        ? request.payload
        : getDisplayPayload(request.payload).value,
      searchParams: request.searchParams,
      headers:
        (showSensitiveValues.value
          ? request.headers
          : getDisplayHeaders(request)) ?? undefined,
      response: request.response,
      unusedResponseData: request.unusedResponseData,
      metadata: request.metadata,
    })
  }

  // expansion is tracked per request id so it resets when another request
  // is selected
  const warningsExpandedForRequest = createSignalRef<string | null>(null)

  const warningsExpanded = createMemoRef(
    () => warningsExpandedForRequest.value === selectedRequest.value?.id,
  )

  function warningsList(warnings: RequestWarning[]) {
    const hiddenWarnings = createMemoRef(() =>
      warningsExpanded.value ? 0 : warnings.length - maxVisibleWarnings,
    )

    const visibleWarnings = createMemoRef(() =>
      hiddenWarnings.value > 0
        ? warnings.slice(0, maxVisibleWarnings)
        : warnings,
    )

    return (
      <div class={warningsListStyle}>
        <For each={visibleWarnings.value}>
          {(warning) => (
            <div class="warning-item">
              <Icon name="alert-triangle" />
              <div class="warning-content">
                <span>{warning.message}</span>
                {warning.details !== undefined && (
                  <JsonViewer
                    value={warning.details}
                    compact
                  />
                )}
              </div>
            </div>
          )}
        </For>

        {hiddenWarnings.value > 0 && (
          <ButtonElement
            class="show-all"
            onClick={() => {
              warningsExpandedForRequest.value =
                selectedRequest.value?.id ?? null
            }}
          >
            …show all (+{hiddenWarnings.value})
          </ButtonElement>
        )}
      </div>
    )
  }

  const unusedResponseData = createMemoRef(() => {
    const request = selectedRequest.value

    if (!request?.unusedResponseData?.length) return null

    return getUnusedResponseDataMap(request.unusedResponseData)
  })

  const unusedResponseDataSize = createMemoRef(() => {
    const request = selectedRequest.value

    if (!request?.unusedResponseData?.length) return false

    const unusedBytes = getUnusedResponseDataSize(request.unusedResponseData)

    if (unusedBytes === 0) return false

    const serializedResponse = JSON.stringify(request.response)
    const responseBytes = serializedResponse ? serializedResponse.length : 0

    const percent =
      responseBytes > 0 ? Math.round((unusedBytes / responseBytes) * 100) : 0

    return `${formatBytes(unusedBytes)} (${percent}% of response)`
  })

  const requestWarnings = createMemoRef(
    () => selectedRequest.value?.warnings ?? [],
  )

  // falls back to the summary tab when the selected tab is not available for
  // the current request (e.g. a request without headers or warnings)
  const activeTab = createMemoRef(() => {
    const request = selectedRequest.value

    if (!request) return 'summary'

    if (selectedTab === 'payload' && !request.payload) return 'summary'
    if (selectedTab === 'urlParams' && !request.searchParams) return 'summary'
    if (selectedTab === 'unusedData' && !unusedResponseData.value) {
      return 'summary'
    }
    if (selectedTab === 'warnings' && !request.warnings?.length) {
      return 'summary'
    }
    if (selectedTab === 'metadata' && !request.metadata) return 'summary'
    if (selectedTab === 'headers' && !displayHeaders.value) return 'summary'

    return selectedTab
  })

  return (
    <div class={containerStyle}>
      {selectedRequest.value && (
        <>
          <h1>
            <span class="type">
              {selectedRequest.value.type === 'ws'
                ? `WS ${selectedRequest.value.subType}`
                : 'API'}
            </span>
            <span class="separator">{'|'}</span>
            {selectedRequest.value.callName}
            {selectedRequest.value.alias && (
              <span class="separator">{'|'}</span>
            )}
            {selectedRequest.value.alias}
          </h1>

          {selectedRequest.value.callPath !==
            selectedRequest.value.callName && (
            <h2>{selectedRequest.value.callPath}</h2>
          )}

          <div class="tags">
            {selectedRequest.value.method && (
              <div class="method">{selectedRequest.value.method}</div>
            )}

            {selectedRequest.value.code && (
              <div
                class="code"
                classList={{
                  error: selectedRequest.value.code >= 400,
                }}
              >
                {selectedRequest.value.code}
              </div>
            )}

            {selectedRequest.value.isError && (
              <div class="tag error">Has Error</div>
            )}

            {!!requestWarnings.value.length && (
              <div class="tag warning">
                <Icon name="alert-triangle" />
                {requestWarnings.value.length === 1
                  ? 'Has Warning'
                  : `${requestWarnings.value.length} Warnings`}
              </div>
            )}

            {selectedRequest.value.status === 'pending' && (
              <div class="tag pending">Pending</div>
            )}

            <For each={selectedRequest.value.tags}>
              {(tag) => <div class="tag">{tag}</div>}
            </For>

            <div class="actions">
              <ButtonElement
                class="action-button"
                title="Copy the full request info as JSON"
                onClick={copyRequestAsJson}
              >
                <Icon name="copy" />
                JSON
              </ButtonElement>

              {selectedRequest.value.type !== 'ws' && (
                <div class={curlMenuStyle}>
                  <ButtonElement
                    class="action-button"
                    title="Copy request as cURL"
                    onClick={() => {
                      curlMenuIsOpen.value = !curlMenuIsOpen.value
                    }}
                  >
                    <Icon name="terminal" />
                    cURL
                    <Icon name="caret-down" />
                  </ButtonElement>

                  {curlMenuIsOpen.value && (
                    <>
                      <div
                        class="backdrop"
                        onClick={() => {
                          curlMenuIsOpen.value = false
                        }}
                      />

                      <div class="menu">
                        <ButtonElement
                          title="Sensitive header values and payload fields are masked"
                          onClick={() => copyAsCurl(true)}
                        >
                          Copy
                        </ButtonElement>

                        <ButtonElement
                          title="Includes the raw values of sensitive headers and payload fields"
                          onClick={() => copyAsCurl(false)}
                        >
                          Copy with token
                        </ButtonElement>
                      </div>
                    </>
                  )}
                </div>
              )}

              {selectedRequest.value.type !== 'ws' &&
                requestCallerStore.callers.length > 0 && (
                  <ButtonElement
                    class="action-button"
                    title="Modify and resend this request in the caller tab"
                    onClick={() => {
                      const request = selectedRequest.value

                      if (request) {
                        openRequestInCaller(request)
                      }
                    }}
                  >
                    <Icon name="send" />
                    Modify request
                  </ButtonElement>
                )}
            </div>
          </div>

          <div class={tabsStyle}>
            {getTab('summary', 'Summary')}
            {!!selectedRequest.value.payload && getTab('payload', 'Payload')}
            {!!selectedRequest.value.searchParams &&
              getTab('urlParams', 'URL Search Params')}
            {getTab('response', 'Response')}
            {!!unusedResponseData.value && getTab('unusedData', 'Unused Data')}
            {!!requestWarnings.value.length &&
              getTab('warnings', 'Warnings')}
            {!!selectedRequest.value.metadata &&
              getTab('metadata', 'Metadata')}
            {!!displayHeaders.value && getTab('headers', 'Headers')}
          </div>

          <div class="details">
            <Switch>
              <Match when={activeTab.value === 'summary'}>
                {!!requestWarnings.value.length && (
                  <Section title="Warnings">
                    {warningsList(requestWarnings.value)}
                  </Section>
                )}

                {!!selectedRequest.value.payload && (
                  <Section title="Payload">
                    <JsonViewer
                      value={payloadToShow.value}
                      compact
                    />
                  </Section>
                )}

                {!!selectedRequest.value.searchParams && (
                  <Section title="URL Search Params">
                    <JsonViewer
                      value={selectedRequest.value.searchParams}
                      compact
                    />
                  </Section>
                )}

                {!!selectedRequest.value.response && (
                  <Section title="Response">
                    <JsonViewer
                      value={selectedRequest.value.response}
                      compact
                    />
                  </Section>
                )}

                {!!unusedResponseData.value && (
                  <Section title="Unused response data">
                    <JsonViewer
                      value={unusedResponseData.value}
                      compact
                    />
                  </Section>
                )}

                <Section title="Stats">
                  <TableView
                    rows={[
                      selectedRequest.value.type !== 'ws' && {
                        name: 'Duration',
                        value:
                          selectedRequest.value.status === 'pending' ? (
                            <span style={{ color: colors.secondary.var }}>
                              pending…
                            </span>
                          ) : (
                            <span
                              style={{
                                color:
                                  selectedRequest.value.duration < 500
                                    ? colors.success.var
                                    : selectedRequest.value.duration > 1000
                                    ? colors.error.var
                                    : undefined,
                              }}
                            >
                              {formatNum(selectedRequest.value.duration, {
                                maximumFractionDigits: 0,
                              })}{' '}
                              ms
                            </span>
                          ),
                      },
                      {
                        name: 'Start Time',
                        value: (
                          <span
                            title={dayjs(
                              selectedRequest.value.startTime,
                            ).format('YYYY-MM-DD HH:mm:ss.SSS')}
                          >
                            {`${dayjs(selectedRequest.value.startTime).format(
                              'HH:mm:ss',
                            )} (${dayjs(
                              selectedRequest.value.startTime,
                            ).fromNow()})`}
                          </span>
                        ),
                      },
                      !!responseSize.value && {
                        name: 'Avg. Response Size',
                        value: responseSize.value,
                      },
                      !!unusedResponseDataSize.value && {
                        name: 'Unused Data Size',
                        value: (
                          <span style={{ color: colors.warning.var }}>
                            {unusedResponseDataSize.value}
                          </span>
                        ),
                      },
                    ]}
                  />
                </Section>

                <Show when={selectedRequest.value.type !== 'ws'}>
                  <Section title="Metadata">
                    <JsonViewer value={selectedRequest.value.metadata} />
                  </Section>
                </Show>

                {!!displayHeaders.value && (
                  <Section title="Headers">
                    <JsonViewer
                      value={displayHeaders.value}
                      compact
                    />
                  </Section>
                )}
              </Match>

              <Match when={activeTab.value === 'payload'}>
                <Section
                  title={null}
                  class={fullTabSectionStyle}
                >
                  <JsonViewer
                    value={payloadToShow.value}
                    search
                  />
                </Section>
              </Match>

              <Match when={activeTab.value === 'response'}>
                <Section
                  title={null}
                  class={fullTabSectionStyle}
                >
                  <JsonViewer
                    value={selectedRequest.value.response}
                    search
                  />
                </Section>
              </Match>

              <Match when={activeTab.value === 'urlParams'}>
                <Section
                  title={null}
                  class={fullTabSectionStyle}
                >
                  <JsonViewer
                    value={selectedRequest.value.searchParams}
                    search
                  />
                </Section>
              </Match>

              <Match when={activeTab.value === 'unusedData'}>
                <Section
                  title={null}
                  class={fullTabSectionStyle}
                >
                  <JsonViewer
                    value={unusedResponseData.value}
                    search
                  />
                </Section>
              </Match>

              <Match when={activeTab.value === 'warnings'}>
                <Section
                  title={null}
                  class={fullTabSectionStyle}
                >
                  {warningsList(requestWarnings.value)}
                </Section>
              </Match>

              <Match when={activeTab.value === 'metadata'}>
                <Section
                  title={null}
                  class={fullTabSectionStyle}
                >
                  <JsonViewer
                    value={selectedRequest.value.metadata}
                    search
                  />
                </Section>
              </Match>

              <Match when={activeTab.value === 'headers'}>
                <Section
                  title={null}
                  class={fullTabSectionStyle}
                >
                  <JsonViewer
                    value={displayHeaders.value}
                    search
                  />
                </Section>
              </Match>
            </Switch>
          </div>
        </>
      )}
    </div>
  )
}
