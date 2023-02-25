import ButtonElement from '@src/components/ButtonElement'
import { Section } from '@src/components/Section'
import { TableView } from '@src/components/TableView'
import { ValueVisualizer } from '@src/components/ValueVisualizer'
import { Diff } from '@src/pages/api-explorer/Diff'
import { ApiCall, callsStore, lastAddedCallID } from '@src/stores/callsStore'
import { setUiStore, uiStore } from '@src/stores/uiStore'
import { ellipsis } from '@src/style/helpers/ellipsis'
import { inline } from '@src/style/helpers/inline'
import { stack } from '@src/style/helpers/stack'
import { colors, fonts } from '@src/style/theme'
import { formatNum } from '@src/utils/formatNum'
import dayjs from 'dayjs'
import { createMemo } from 'solid-js'
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

  const selectedRequest = createMemo(() => {
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
          selected: selectedTab === tabId,
        }}
        onClick={() => {
          setUiStore('selectedTab', tabId)
        }}
      >
        {label}
      </ButtonElement>
    )
  }

  return (
    <div class={containerStyle}>
      <Show
        when={selectedRequest()}
        keyed
      >
        {(request) => (
          <>
            <h1>
              <span class="type">
                {request.type === 'ws' ? `WS ${request.subType}` : 'API'}
              </span>
              <span>{'|'}</span>
              {request.callName}
              {request.alias && <span class="separator">{'|'}</span>}
              {request.alias}
            </h1>

            {request.callPath !== request.callName && (
              <h2>{request.callPath}</h2>
            )}

            <div class="tags">
              {request.method && <div class="method">{request.method}</div>}

              {request.code && (
                <div
                  class="code"
                  classList={{
                    error: request.code >= 400,
                  }}
                >
                  {request.code}
                </div>
              )}

              {request.isError && <div class="tag error">Has Error</div>}

              <For each={request.tags}>
                {(tag) => <div class="tag">{tag}</div>}
              </For>
            </div>

            <div class={tabsStyle}>
              {getTab('summary', 'Summary')}
              {!!request.payload && getTab('payload', 'Payload')}
              {!!request.searchParams && getTab('urlParams', 'URL Params')}
              {getTab('response', 'Response')}
              {getTab('diff', 'Diff')}
            </div>

            <div class="details">
              <Switch>
                <Match when={selectedTab === 'summary'}>
                  {!!request.payload && (
                    <Section title="Payload">
                      <ValueVisualizer
                        value={request.payload}
                        compact
                      />
                    </Section>
                  )}

                  {!!request.searchParams && (
                    <Section title="URL Params">
                      <ValueVisualizer
                        value={request.searchParams}
                        compact
                      />
                    </Section>
                  )}

                  {!!request.response && (
                    <Section title="Response">
                      <ValueVisualizer
                        value={request.response}
                        compact
                      />
                    </Section>
                  )}

                  <Section title="Stats">
                    <TableView
                      rows={[
                        request.type !== 'ws' && {
                          name: 'Duration',
                          value: (
                            <span
                              style={{
                                color:
                                  request.duration < 500
                                    ? colors.success.var
                                    : request.duration > 1000
                                    ? colors.error.var
                                    : undefined,
                              }}
                            >
                              {formatNum(request.duration, 0)} ms
                            </span>
                          ),
                        },
                        {
                          name: 'Start Time',
                          value: (
                            <span
                              title={dayjs(request.startTime).format(
                                'YYYY-MM-DD HH:mm:ss.SSS',
                              )}
                            >
                              {`${dayjs(request.startTime).format(
                                'HH:mm:ss',
                              )} (${dayjs(request.startTime).fromNow()})`}
                            </span>
                          ),
                        },
                      ]}
                    />
                  </Section>

                  <Show when={request.type !== 'ws'}>
                    <Section title="Metadata">
                      <ValueVisualizer value={request.metadata} />
                    </Section>
                  </Show>
                </Match>

                <Match when={selectedTab === 'payload'}>
                  <Section title={null}>
                    <ValueVisualizer value={request.payload} />
                  </Section>
                </Match>

                <Match when={selectedTab === 'response'}>
                  <Section title={null}>
                    <ValueVisualizer value={request.response} />
                  </Section>
                </Match>

                <Match when={selectedTab === 'urlParams'}>
                  <Section title={null}>
                    <ValueVisualizer value={request.searchParams} />
                  </Section>
                </Match>

                <Match when={selectedTab === 'diff'}>
                  <Diff />
                </Match>
              </Switch>
            </div>
          </>
        )}
      </Show>
    </div>
  )
}
