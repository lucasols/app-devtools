import Loading from '@src/components/Loading'
import App from '@src/pages/app/App'
import Login from '@src/pages/login/login'
import { kpiStore } from '@src/stores/keyPerfIndicatorsStore'
import { authStore } from '@src/stores/auth'
import { goalsStore } from '@src/stores/goalsStore'
import { problemsStore } from '@src/stores/problemsStore'
import { solutionsStore } from '@src/stores/solutionsStore'
import { GlobalStyles } from '@src/style/global'
import { centerContent } from '@src/style/helpers/centerContent'
import { fillContainer } from '@src/style/helpers/fillContainer'
import { allStoresAreLoaded } from '@src/utils/cardUtils/derivatedCardProps'
import { historyIntegration } from '@src/utils/router'
import { Router } from 'solid-app-router'
import { css } from 'solid-styled-components'

const Root = () => {
  const appDataIsLoading = $derefMemo(allStoresAreLoaded)

  return (
    <>
      <GlobalStyles />

      <Router source={historyIntegration}>
        <Switch>
          <Match when={authStore.authState === 'loading'}>
            <div
              class={css`
                ${fillContainer};
                ${centerContent};
              `}
            >
              <Loading />
            </div>
          </Match>

          <Match when={authStore.authState === 'error'}>
            <Login />

            <div
              class={css`
                ${centerContent};
              `}
            >
              {JSON.stringify(authStore.error)}
            </div>
          </Match>

          <Match when={authStore.authState === 'loggedOut'}>
            <Login />
          </Match>

          <Match when={appDataIsLoading}>
            <div
              class={css`
                ${fillContainer};
                ${centerContent};
              `}
            >
              <Loading />
            </div>
          </Match>

          <Match when>
            <App />
          </Match>
        </Switch>
      </Router>
    </>
  )
}

export default Root
