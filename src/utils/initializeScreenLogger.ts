if (import.meta.env.DEV) {
  const oslu = await import('oslu')

  oslu.initializeTempLogs({ ignoreErrors: [] })

  oslu.initializePersistentLogs()

  const anyGlobalThis = globalThis as any

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  anyGlobalThis.watchValue = oslu.watchValue
}
