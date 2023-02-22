import { typedObjectEntries } from '@utils/typed'
import history from 'history/browser'
import { createIntegration } from 'solid-app-router'

export const historyIntegration = createIntegration(
  () => ({
    value:
      window.location.pathname + window.location.search + window.location.hash,
  }),
  ({ value, replace, scroll, state }) => {
    if (replace) {
      history.replace(value, state)
    } else {
      history.push(value, state)
    }
    if (scroll) {
      window.scrollTo(0, 0)
    }
  },
  (notify) =>
    history.listen(({ location }) => {
      notify(location.pathname + location.search + location.hash)
    }),
  {
    go: (delta) => history.go(delta),
  },
)

export function setSearchQuery(query: Record<string, string | undefined>) {
  const searchParams = new URLSearchParams(window.location.search)

  for (const [key, value] of typedObjectEntries(query)) {
    if (value) {
      searchParams.set(key, value)
    } else {
      searchParams.delete(key)
    }
  }

  history.push(`${window.location.pathname}?${searchParams.toString()}`)
}
