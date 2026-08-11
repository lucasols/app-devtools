import { approxJsonSize } from '@utils/approxJsonSize'
import { klona } from 'klona/json'
import { nanoid } from 'nanoid'
import { createSignal } from 'solid-js'
import { recordingIsPaused } from '@src/stores/recordingStore'

export type LogSeverity = 'error' | 'warning' | 'info'

export type DevtoolsLog = {
  id: string
  severity: LogSeverity
  message: string
  category: string | undefined
  details: unknown
  time: number
  /**
   * approximate stored size (json string length of message/details plus a
   * fixed overhead), used by the size-based eviction budget
   */
  approxSize: number
}

type State = {
  logs: DevtoolsLog[]
}

/** accounts for the fixed log fields (id, severity, category, time) */
const logBaseSize = 100

/** generous default limit to avoid memory issues in long-running sessions */
let maxLogsSizeMb = 10

const logsState: State = { logs: [] }
let storedLogsSize = 0

const [logsStoreRevision, setLogsStoreRevision] = createSignal(0)

/** Reactive top-level view over plain, non-proxied log records. */
export const logsStore: State = {
  get logs() {
    logsStoreRevision()
    return logsState.logs
  },
}

function updateLogsState(update: (state: State) => void) {
  update(logsState)
  setLogsStoreRevision((revision) => revision + 1)
}

export function setMaxLogsSizeMb(limit: number) {
  maxLogsSizeMb = limit
  updateLogsState(evictOldLogsIfNeeded)
}

function evictOldLogsIfNeeded(state: State) {
  const maxTotalSize = maxLogsSizeMb * 1024 * 1024

  let evictCount = 0

  // always keep at least the newest log, even if it alone exceeds the budget
  while (
    storedLogsSize > maxTotalSize &&
    evictCount < state.logs.length - 1
  ) {
    const oldestLog = state.logs[evictCount]

    if (!oldestLog) break

    storedLogsSize -= oldestLog.approxSize
    evictCount++
  }

  if (evictCount > 0) {
    state.logs.splice(0, evictCount)
  }
}

function replaceLogs(logs: DevtoolsLog[]) {
  logsState.logs = logs
  storedLogsSize = logs.reduce((total, log) => total + log.approxSize, 0)
}

export function addLog(log: {
  message: string
  severity?: LogSeverity
  category?: string
  details?: unknown
  time?: number
}) {
  if (recordingIsPaused.value) return

  updateLogsState((state) => {
    const logToAdd: DevtoolsLog = {
      id: nanoid(),
      severity: log.severity || 'info',
      message: log.message,
      category: log.category,
      details: log.details === undefined ? undefined : klona(log.details),
      time: log.time || Date.now(),
      approxSize:
        logBaseSize + log.message.length + approxJsonSize(log.details),
    }

    state.logs.push(logToAdd)
    storedLogsSize += logToAdd.approxSize
    evictOldLogsIfNeeded(state)
  })
}

export function clearLogs() {
  updateLogsState(() => replaceLogs([]))
}

export function clearLogsBefore(time: number) {
  updateLogsState((state) => {
    replaceLogs(state.logs.filter((log) => log.time >= time))
  })
}

export function clearLogsAfter(time: number) {
  updateLogsState((state) => {
    replaceLogs(state.logs.filter((log) => log.time <= time))
  })
}

export function removeLog(id: string) {
  updateLogsState((state) => {
    replaceLogs(state.logs.filter((log) => log.id !== id))
  })
}

export function getLogExportEntry(
  log: DevtoolsLog,
  processDetails: (value: unknown) => unknown = (value) => value,
) {
  return {
    time: log.time,
    timeISO: new Date(log.time).toISOString(),
    severity: log.severity,
    category: log.category,
    message: log.message,
    ...(log.details !== undefined
      ? { details: processDetails(log.details) }
      : {}),
  }
}

if (import.meta.env.DEV) {
  addLog({
    severity: 'info',
    message: 'App initialized',
  })

  addLog({
    severity: 'info',
    message: 'User session refreshed',
    category: 'auth',
    details: { userId: 123, expiresIn: 3600 },
  })

  addLog({
    severity: 'warning',
    message: 'Deprecated api endpoint used: /v2/tabs',
    category: 'api',
  })

  addLog({
    severity: 'warning',
    message: 'Slow render detected on dashboard page',
    category: 'render',
    details: { durationMs: 1240, component: 'Dashboard' },
  })

  addLog({
    severity: 'error',
    message: 'Failed to fetch user settings',
    category: 'api',
    details: {
      status: 500,
      endpoint: '/user/settings',
      response: { error: 'Internal Server Error' },
    },
  })

  addLog({
    severity: 'error',
    message: "Cannot read properties of undefined (reading 'id')",
    category: 'render',
    details: {
      stack:
        "TypeError: Cannot read properties of undefined (reading 'id')\n  at TableView (TableView.tsx:45:12)\n  at renderRow (TableView.tsx:112:8)",
    },
  })

  let devLogIdx = 0

  setInterval(() => {
    devLogIdx++

    const isSlow = devLogIdx % 3 === 0

    addLog({
      severity: isSlow ? 'warning' : 'info',
      message: isSlow
        ? `Background sync took longer than expected (#${devLogIdx})`
        : `Background sync completed (#${devLogIdx})`,
      category: 'sync',
      details: { itemsSynced: 12 + devLogIdx },
    })
  }, 15_000)
}
