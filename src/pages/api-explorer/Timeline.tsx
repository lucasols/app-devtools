import ButtonElement from '@src/components/ButtonElement'
import { callsStore, lastAddedCallID } from '@src/stores/callsStore'
import { setUiStore, uiStore } from '@src/stores/uiStore'
import { ellipsis } from '@src/style/helpers/ellipsis'
import { inline } from '@src/style/helpers/inline'
import { stack } from '@src/style/helpers/stack'
import { colors, fonts } from '@src/style/theme'
import { reverseCopy } from '@utils/arrayUtils'
import dayjs from 'dayjs'
import { createMemo } from 'solid-js'
import { css } from 'solid-styled-components'
import { getRequestPayload } from './getRequestPayload'

const containerStyle = css`
  &&& {
    ${stack()};
    border-right: 1px solid ${colors.white.alpha(0.1)};

    > h1 {
      font-size: 16px;
      padding-left: 12px;
      padding-top: 10px;
      font-family: ${fonts.decorative};
      color: ${colors.secondary.var};
      padding-bottom: 16px;
    }
  }
`

const itemsContainerStyle = css`
  &&& {
    ${stack()};
    flex: 1 1;
    overflow-y: auto;
  }
`

const requestItemStyle = css`
  &&& {
    font-size: 13px;
    ${stack()};

    &.error {
      color: ${colors.error.var};
      font-weight: 600;
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

export const Timeline = () => {
  const selectedCall = createMemo(() => {
    const selectedCallId = uiStore.selectedCall

    if (!selectedCallId) {
      const callsEntries = callsStore.calls[lastAddedCallID.value]

      return callsEntries || null
    }

    if (selectedCallId) {
      return callsStore.calls[selectedCallId]
    }

    return null
  })

  const requests = createMemo(() => {
    const reversed = reverseCopy(selectedCall()?.requests)
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

  const selectedRequestId = $(
    uiStore.selectedRequest || filteredRequests()?.[0]?.id,
  )

  return (
    <div class={containerStyle}>
      <h1>timeline</h1>

      <div class={itemsContainerStyle}>
        <For
          each={filteredRequests()}
          fallback={<div class={emptyStateStyle}>no requests found</div>}
        >
          {(request) => {
            const startTime = dayjs(request.startTime)
            const formattedStartTime = startTime.format('HH:mm:ss')
            const relativeStartTime = startTime.fromNow()

            const payload = getRequestPayload(request)

            return (
              <div
                class={requestItemStyle}
                classList={{ error: request.isError }}
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
  )
}
