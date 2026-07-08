import { ApiRequest } from '@src/stores/callsStore'
import { setUiStore } from '@src/stores/uiStore'
import { createStore } from 'solid-js/store'

export type RequestCallerResult = {
  response: unknown
  status?: number
  isError?: boolean
}

/**
 * A request caller configured by the lib consumer. It should abstract all
 * app-specific details (auth, base url, headers, etc), receiving only the
 * request path, method and payload.
 */
export type RequestCaller = {
  /** name shown in the caller selector */
  name: string
  /** methods available in the UI, defaults to GET, POST, PUT, PATCH and DELETE */
  methods?: string[]
  call: (request: {
    path: string
    method: string
    payload: unknown
  }) => Promise<RequestCallerResult>
}

type CallHistoryEntry = {
  id: number
  path: string
  method: string
  payloadText: string
}

type State = {
  callers: RequestCaller[]
  selectedCallerIdx: number
  method: string
  path: string
  payloadText: string
  isLoading: boolean
  lastResult: {
    response: unknown
    status: number | undefined
    isError: boolean
    duration: number
    error: string | null
  } | null
  history: CallHistoryEntry[]
}

export const [requestCallerStore, setRequestCallerStore] = createStore<State>({
  callers: [],
  selectedCallerIdx: 0,
  method: 'GET',
  path: '',
  payloadText: '',
  isLoading: false,
  lastResult: null,
  history: [],
})

export function setRequestCallers(callers: RequestCaller[]) {
  setRequestCallerStore('callers', callers)
}

export const defaultCallerMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']

let historyId = 0
const maxHistoryEntries = 30

export async function sendCallerRequest() {
  if (requestCallerStore.isLoading) return

  const caller = requestCallerStore.callers[requestCallerStore.selectedCallerIdx]

  if (!caller) return

  const path = requestCallerStore.path.trim()
  const method = requestCallerStore.method
  const payloadText = requestCallerStore.payloadText.trim()

  if (!path) {
    setRequestCallerStore('lastResult', {
      response: undefined,
      status: undefined,
      isError: true,
      duration: 0,
      error: 'The request path is empty',
    })
    return
  }

  let payload: unknown

  if (payloadText !== '') {
    try {
      payload = JSON.parse(payloadText)
    } catch (error) {
      setRequestCallerStore('lastResult', {
        response: undefined,
        status: undefined,
        isError: true,
        duration: 0,
        error: `Invalid payload JSON: ${
          error instanceof Error ? error.message : String(error)
        }`,
      })
      return
    }
  }

  const lastHistoryEntry = requestCallerStore.history[0]

  if (
    !lastHistoryEntry ||
    lastHistoryEntry.path !== path ||
    lastHistoryEntry.method !== method ||
    lastHistoryEntry.payloadText !== payloadText
  ) {
    historyId += 1

    setRequestCallerStore('history', (history) =>
      [{ id: historyId, path, method, payloadText }, ...history].slice(
        0,
        maxHistoryEntries,
      ),
    )
  }

  setRequestCallerStore({ isLoading: true })

  const startTime = Date.now()

  try {
    const result = await caller.call({ path, method, payload })

    setRequestCallerStore({
      isLoading: false,
      lastResult: {
        response: result.response,
        status: result.status,
        isError: result.isError ?? false,
        duration: Date.now() - startTime,
        error: null,
      },
    })
  } catch (error) {
    setRequestCallerStore({
      isLoading: false,
      lastResult: {
        response: undefined,
        status: undefined,
        isError: true,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      },
    })
  }
}

export function openRequestInCaller(request: ApiRequest) {
  setRequestCallerStore({
    method: request.method || 'POST',
    // the stored path already includes the search params
    path: request.path,
    payloadText:
      request.payload === undefined || request.payload === null
        ? ''
        : JSON.stringify(request.payload, null, 2),
    lastResult: null,
  })

  setUiStore('selectedPage', 'caller')
}
