import { createSignalRef } from '@utils/solid'
import { createStore } from 'solid-js/store'

/** reveals the raw values of masked headers and sensitive payload fields */
export const showSensitiveValues = createSignalRef(false)

export type DevtoolsPage = 'explorer' | 'timeline' | 'stats' | 'logs' | 'caller'

type State = {
  selectedPage: DevtoolsPage
  selectedCall: string | null
  selectedRequest: string | null
  selectedTab: string | null
  selectedSubitem: string | null
}

export const [uiStore, setUiStore] = createStore<State>({
  selectedPage: 'explorer',
  selectedCall: null,
  selectedRequest: null,
  selectedTab: null,
  selectedSubitem: null,
})
