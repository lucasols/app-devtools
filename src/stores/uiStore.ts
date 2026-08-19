import { createSignalRef } from '@utils/solid'
import { createStore } from 'solid-js/store'

/** reveals the raw values of masked headers and sensitive payload fields */
export const showSensitiveValues = createSignalRef(false)

/** shows captured browser route changes in request timelines */
export const showNavigationChanges = createSignalRef(true)

export type DevtoolsPage = 'explorer' | 'timeline' | 'stats' | 'logs' | 'caller'
export type ApiExplorerMenuTab = 'api' | 'ws' | 'all'

type State = {
  selectedPage: DevtoolsPage
  selectedCall: string | null
  selectedCallIds: string[]
  selectedRequest: string | null
  selectedTab: string | null
  selectedSubitem: string | null
  apiExplorerMenuTab: ApiExplorerMenuTab
}

export const [uiStore, setUiStore] = createStore<State>({
  selectedPage: 'explorer',
  selectedCall: null,
  selectedCallIds: [],
  selectedRequest: null,
  selectedTab: null,
  selectedSubitem: null,
  apiExplorerMenuTab: 'api',
})
