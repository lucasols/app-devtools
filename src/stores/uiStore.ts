import { createStore } from 'solid-js/store'

type State = {
  selectedCall: string | null
  selectedRequest: string | null
  selectedTab: string | null
  selectedSubitem: string | null
}

export const [uiStore, setUiStore] = createStore<State>({
  selectedCall: null,
  selectedRequest: null,
  selectedTab: null,
  selectedSubitem: null,
})
