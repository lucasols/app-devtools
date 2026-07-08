import { ApiExplorerMenu } from '@src/pages/api-explorer/ApiExplorerMenu'
import { RequestDetails } from '@src/pages/api-explorer/RequestDetails'
import { Timeline } from '@src/pages/api-explorer/Timeline'
import { callsStore } from '@src/stores/callsStore'
import { setUiStore, uiStore } from '@src/stores/uiStore'
import { createEffect } from 'solid-js'
import { css } from 'solid-styled-components'

const containerStyle = css`
  &&& {
    display: grid;
    grid-template-columns: 1fr 1fr 3fr;
  }
`

export const ApiExplorerPage = () => {
  // while there is no manual selection, pin the selection to the last loaded
  // request so the details don't keep jumping to newly received requests
  createEffect(() => {
    if (uiStore.selectedCall) return

    let lastLoaded: {
      callID: string
      requestID: string
      loadedTime: number
    } | null = null

    for (const [callID, call] of Object.entries(callsStore.calls)) {
      for (const request of call.requests) {
        if (request.status === 'pending') continue

        const loadedTime = request.startTime + request.duration

        if (!lastLoaded || loadedTime > lastLoaded.loadedTime) {
          lastLoaded = { callID, requestID: request.id, loadedTime }
        }
      }
    }

    if (lastLoaded) {
      setUiStore({
        selectedCall: lastLoaded.callID,
        selectedRequest: lastLoaded.requestID,
      })
    }
  })

  return (
    <div class={containerStyle}>
      <ApiExplorerMenu />
      <Timeline />
      <RequestDetails />
    </div>
  )
}
