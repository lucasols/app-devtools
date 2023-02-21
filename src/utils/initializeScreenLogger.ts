import { initializePersistentLogs, initializeTempLogs } from 'oslu'

if (import.meta.env.DEV) {
  initializeTempLogs({ ignoreErrors: [] })

  initializePersistentLogs()
}
