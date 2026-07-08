import { ApiRequest } from '@src/stores/callsStore'
import { setUiStore } from '@src/stores/uiStore'
import { createStore } from 'solid-js/store'

export type RequestCallerResult = {
  response: unknown
  status?: number
  isError?: boolean
}

export type RequestCallerSelectOption = string | { value: string; label: string }

/**
 * An input rendered in the caller form. `json` inputs are validated and
 * parsed, `string` and `select` values are passed as plain strings.
 */
export type RequestCallerInput =
  | {
      type: 'json'
      name: string
      label?: string
      placeholder?: string
    }
  | {
      type: 'string'
      name: string
      label?: string
      placeholder?: string
    }
  | {
      type: 'select'
      name: string
      label?: string
      options: RequestCallerSelectOption[]
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
  /**
   * inputs shown in the form, defaults to a single json input named
   * `payload`, whose parsed value is passed directly as the call `payload`.
   * With custom inputs, `payload` is a record with the value of each input
   * keyed by its name (json input values are parsed, empty ones are omitted).
   */
  inputs?: RequestCallerInput[]
  /**
   * maps a request opened from the network history into the form input
   * values, keyed by input name. Defaults to putting the request payload
   * JSON into the `payload` input, which matches the default inputs config.
   * Configure it when using custom `inputs` that don't fit that mapping.
   */
  mapRequestToInputs?: (request: {
    path: string
    method: string
    payload: unknown
  }) => Record<string, string>
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
  inputValues: Record<string, string>
  callerName: string
}

export type CallerResultEntry = {
  id: number
  path: string
  method: string
  inputValues: Record<string, string>
  callerName: string
  startTime: number
  response: unknown
  status: number | undefined
  isError: boolean
  duration: number
  error: string | null
}

type State = {
  callers: RequestCaller[]
  selectedCallerIdx: number
  method: string
  path: string
  /** raw text values of the form inputs, keyed by input name */
  inputValues: Record<string, string>
  isLoading: boolean
  /** error from the last send attempt that failed before calling the caller */
  sendError: string | null
  /** id of the result selected in the results section */
  selectedResultId: number | null
  history: CallHistoryEntry[]
  /** results of past executions, used to show the history of a request */
  resultsHistory: CallerResultEntry[]
}

export const defaultCallerInputs: RequestCallerInput[] = [
  { type: 'json', name: 'payload' },
]

let historyId = 0

const historySessionStorageKey = 'app-devtools-caller-history'

function parsePersistedInputValues(
  item: Record<string, unknown>,
): Record<string, string> | null {
  // entries persisted before the configurable inputs support
  if (typeof item.payloadText === 'string') {
    return item.payloadText === '' ? {} : { payload: item.payloadText }
  }

  if (isRecord(item.inputValues)) {
    const values: Record<string, string> = {}

    for (const [key, value] of Object.entries(item.inputValues)) {
      if (typeof value !== 'string') return null

      values[key] = value
    }

    return values
  }

  return null
}

function getPersistedHistory(): CallHistoryEntry[] {
  try {
    const stored = window.sessionStorage.getItem(historySessionStorageKey)

    if (!stored) return []

    const parsed: unknown = JSON.parse(stored)

    if (!isArray(parsed)) return []

    const entries: CallHistoryEntry[] = []

    for (const item of parsed) {
      if (
        isRecord(item) &&
        typeof item.path === 'string' &&
        typeof item.method === 'string'
      ) {
        const inputValues = parsePersistedInputValues(item)

        if (!inputValues) continue

        historyId += 1

        entries.push({
          id: historyId,
          path: item.path,
          method: item.method,
          inputValues,
          callerName:
            typeof item.callerName === 'string' ? item.callerName : '',
        })
      }
    }

    return entries
  } catch {
    return []
  }
}

function persistHistory(history: CallHistoryEntry[]) {
  try {
    window.sessionStorage.setItem(
      historySessionStorageKey,
      JSON.stringify(
        history
          .slice(0, 5)
          .map(({ path, method, inputValues, callerName }) => ({
            path,
            method,
            inputValues,
            callerName,
          })),
      ),
    )
  } catch {
    // sessionStorage may be unavailable
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value)
}

export const [requestCallerStore, setRequestCallerStore] = createStore<State>({
  callers: [],
  selectedCallerIdx: 0,
  method: 'GET',
  path: '',
  inputValues: {},
  isLoading: false,
  sendError: null,
  selectedResultId: null,
  history: getPersistedHistory(),
  resultsHistory: [],
})

export function setRequestCallers(callers: RequestCaller[]) {
  setRequestCallerStore('callers', callers)
}

export const defaultCallerMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']

const maxHistoryEntries = 30
const maxResultsHistoryEntries = 30

let resultId = 0

/** error message if the input text is not valid JSON */
export function getJsonValidationError(text: string): string | null {
  const trimmed = text.trim()

  if (trimmed === '') return null

  try {
    JSON.parse(trimmed)
    return null
  } catch (error) {
    return `Invalid JSON: ${
      error instanceof Error ? error.message : String(error)
    }`
  }
}

function getSelectOptionValue(
  option: RequestCallerSelectOption | undefined,
): string {
  if (option === undefined) return ''

  return typeof option === 'string' ? option : option.value
}

/**
 * current form values of the given inputs, with json values trimmed and
 * empty select values defaulting to the first option
 */
export function resolveInputValues(
  inputs: RequestCallerInput[],
): Record<string, string> {
  const values: Record<string, string> = {}

  for (const input of inputs) {
    let value = requestCallerStore.inputValues[input.name] ?? ''

    if (input.type === 'json') {
      value = value.trim()
    } else if (input.type === 'select' && value === '') {
      value = getSelectOptionValue(input.options[0])
    }

    values[input.name] = value
  }

  return values
}

export function inputValuesMatch(
  a: Record<string, string>,
  b: Record<string, string>,
): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)])

  for (const key of keys) {
    if ((a[key] ?? '').trim() !== (b[key] ?? '').trim()) return false
  }

  return true
}

export async function sendCallerRequest() {
  if (requestCallerStore.isLoading) return

  const caller = requestCallerStore.callers[requestCallerStore.selectedCallerIdx]

  if (!caller) return

  const path = requestCallerStore.path.trim()
  const method = requestCallerStore.method
  const callerName = caller.name
  const usesDefaultInputs = !caller.inputs
  const inputs = caller.inputs ?? defaultCallerInputs

  if (!path) {
    setRequestCallerStore('sendError', 'The request path is empty')
    return
  }

  const inputValues = resolveInputValues(inputs)

  for (const input of inputs) {
    if (input.type === 'json') {
      const jsonError = getJsonValidationError(inputValues[input.name] ?? '')

      if (jsonError) {
        setRequestCallerStore('sendError', `${input.name}: ${jsonError}`)
        return
      }
    }
  }

  setRequestCallerStore('sendError', null)

  let payload: unknown

  if (usesDefaultInputs) {
    const payloadText = inputValues.payload ?? ''

    payload = payloadText === '' ? undefined : JSON.parse(payloadText)
  } else {
    const payloadRecord: Record<string, unknown> = {}

    for (const input of inputs) {
      const value = inputValues[input.name] ?? ''

      if (input.type === 'json') {
        if (value !== '') {
          payloadRecord[input.name] = JSON.parse(value)
        }
      } else {
        payloadRecord[input.name] = value
      }
    }

    payload = payloadRecord
  }

  const lastHistoryEntry = requestCallerStore.history[0]

  if (
    !lastHistoryEntry ||
    lastHistoryEntry.path !== path ||
    lastHistoryEntry.method !== method ||
    lastHistoryEntry.callerName !== callerName ||
    !inputValuesMatch(lastHistoryEntry.inputValues, inputValues)
  ) {
    historyId += 1

    setRequestCallerStore('history', (history) =>
      [
        { id: historyId, path, method, inputValues, callerName },
        ...history,
      ].slice(0, maxHistoryEntries),
    )

    persistHistory(requestCallerStore.history)
  }

  setRequestCallerStore({ isLoading: true })

  const startTime = Date.now()

  function addResult(
    result: Pick<
      CallerResultEntry,
      'response' | 'status' | 'isError' | 'error'
    >,
  ) {
    resultId += 1

    const resultEntry: CallerResultEntry = {
      id: resultId,
      path,
      method,
      inputValues,
      callerName,
      startTime,
      duration: Date.now() - startTime,
      ...result,
    }

    setRequestCallerStore({
      isLoading: false,
      selectedResultId: resultEntry.id,
    })

    setRequestCallerStore('resultsHistory', (resultsHistory) =>
      [resultEntry, ...resultsHistory].slice(0, maxResultsHistoryEntries),
    )
  }

  try {
    const result = await caller.call({ path, method, payload })

    addResult({
      response: result.response,
      status: result.status,
      isError: result.isError ?? false,
      error: null,
    })
  } catch (error) {
    addResult({
      response: undefined,
      status: undefined,
      isError: true,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

export function selectCallerByName(name: string) {
  const idx = requestCallerStore.callers.findIndex(
    (caller) => caller.name === name,
  )

  if (idx !== -1) {
    setRequestCallerStore('selectedCallerIdx', idx)
  }
}

/** loads a past request back into the form so it can be modified */
export function loadRequestIntoForm(entry: {
  path: string
  method: string
  inputValues: Record<string, string>
  callerName: string
}) {
  setRequestCallerStore({
    path: entry.path,
    method: entry.method,
    inputValues: { ...entry.inputValues },
    sendError: null,
  })

  selectCallerByName(entry.callerName)
}

export function openRequestInCaller(request: ApiRequest) {
  const caller =
    requestCallerStore.callers[requestCallerStore.selectedCallerIdx]

  const method = request.method || 'POST'
  // the stored path already includes the search params
  const path = request.path

  const inputValues = caller?.mapRequestToInputs
    ? caller.mapRequestToInputs({ path, method, payload: request.payload })
    : request.payload === undefined || request.payload === null
      ? {}
      : { payload: JSON.stringify(request.payload, null, 2) }

  setRequestCallerStore({
    method,
    path,
    inputValues,
    sendError: null,
  })

  setUiStore('selectedPage', 'caller')
}
