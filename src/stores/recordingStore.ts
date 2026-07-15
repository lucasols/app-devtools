import { createSignalRef } from '@utils/solid'

export const recordingIsPaused = createSignalRef(false)

export function setRecordingPaused(paused: boolean) {
  recordingIsPaused.value = paused
}

export function toggleRecordingPaused() {
  recordingIsPaused.value = !recordingIsPaused.value
}
