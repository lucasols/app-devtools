import { createStore, produce } from 'solid-js/store'
import { nanoid } from 'nanoid'
import { batch } from 'solid-js'
import { assertIsNotNullish } from '@utils/assertions'
import { tryExpression } from '@utils/tryExpression'

export type RequestSubTypes = 'delete' | 'update' | 'create' | 'custom'

export type RequestTypes = 'fetch' | 'mutation'

export type ApiRequest = {
  id: string
  alias?: string
  payload: unknown
  response: unknown
  metadata: unknown
  status: number
  isError: boolean
  path: string
  searchParams: Record<string, string> | null
  type: RequestTypes
  subType?: RequestSubTypes
  method?: string
  startTime: number
  duration: number
}

type State = {
  calls: {
    [callID: string]: {
      name: string
      path: string
      type: RequestTypes
      subType?: RequestSubTypes
      lastRequestStartTime: number
      requests: ApiRequest[]
    }
  }
}

export const [callsStore, setCallsStore] = createStore<State>({
  calls: {},
})

function addCall(request: {
  payload: unknown
  response: unknown
  metadata: unknown
  status: number
  isError: boolean
  path: string
  type: RequestTypes
  subType?: RequestSubTypes
  method?: string
  startTime?: number
  duration?: number
}) {
  const startTime = request.startTime || Date.now()

  return () => {
    const duration = request.duration || Date.now() - startTime

    setCallsStore(
      produce((draft) => {
        const callID = `${request.path}|${request.type}${
          request.subType ? `|${request.subType}` : ''
        }`

        if (!draft.calls[callID]) {
          draft.calls[callID] = {
            name: request.path,
            path: request.path,
            lastRequestStartTime: startTime,
            requests: [],
            type: request.type,
            subType: request.subType,
          }
        }

        const call = draft.calls[callID]

        assertIsNotNullish(call)

        const pathURL = tryExpression(
          () => new URL(request.path, 'http://localhost'),
        )

        if (call.requests.length > 100) {
          call.requests.shift()
        }

        call.requests.push({
          id: nanoid(),
          duration,
          isError: request.isError,
          metadata: request.metadata,
          path: request.path,
          payload: request.payload,
          response: request.response,
          searchParams:
            pathURL && Object.fromEntries(pathURL.searchParams.entries()),
          status: request.status,
          startTime,
          type: request.type,
          method: request.method,
          subType: request.subType,
        })
      }),
    )
  }
}

if (import.meta.env.DEV) {
  const mockedCalls = await import('@src/mocks/mockedRequests.json')

  batch(() => {
    mockedCalls.default.forEach((call) => {
      addCall({
        payload: call.request.payload,
        response: call.response.body,
        metadata: call.metadata,
        status: call.response.status,
        isError: call.response.status >= 400,
        path: call.request.path,
        type: 'fetch',
        method: call.request.method,
        startTime: call.stats.startTime,
        duration: call.stats.time,
      })()
    })
  })
}
