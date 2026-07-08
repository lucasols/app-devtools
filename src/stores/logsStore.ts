import { approxJsonSize } from '@utils/approxJsonSize'
import { klona } from 'klona/json'
import { nanoid } from 'nanoid'
import { createStore, produce } from 'solid-js/store'

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

export function setMaxLogsSizeMb(limit: number) {
  maxLogsSizeMb = limit

  setLogsStore(produce(evictOldLogsIfNeeded))
}

function evictOldLogsIfNeeded(draft: State) {
  const maxTotalSize = maxLogsSizeMb * 1024 * 1024

  let totalSize = 0

  for (const log of draft.logs) {
    totalSize += log.approxSize
  }

  let evictCount = 0

  // always keep at least the newest log, even if it alone exceeds the budget
  while (totalSize > maxTotalSize && evictCount < draft.logs.length - 1) {
    const oldestLog = draft.logs[evictCount]

    if (!oldestLog) break

    totalSize -= oldestLog.approxSize
    evictCount++
  }

  if (evictCount > 0) {
    draft.logs.splice(0, evictCount)
  }
}

export const [logsStore, setLogsStore] = createStore<State>({
  logs: [],
})

export function addLog(log: {
  message: string
  severity?: LogSeverity
  category?: string
  details?: unknown
  time?: number
}) {
  setLogsStore(
    produce((draft) => {
      draft.logs.push({
        id: nanoid(),
        severity: log.severity || 'info',
        message: log.message,
        category: log.category,
        details: log.details === undefined ? undefined : klona(log.details),
        time: log.time || Date.now(),
        approxSize:
          logBaseSize + log.message.length + approxJsonSize(log.details),
      })

      evictOldLogsIfNeeded(draft)
    }),
  )
}

export function clearLogs() {
  setLogsStore({ logs: [] })
}

export function removeLog(id: string) {
  setLogsStore('logs', (logs) => logs.filter((log) => log.id !== id))
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
