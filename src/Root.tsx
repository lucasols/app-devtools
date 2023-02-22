import { App } from '@src/pages/app/App'
import { GlobalStyles } from '@src/style/global'
import { historyIntegration } from '@src/utils/router'
import { Router } from 'solid-app-router'

const Root = () => {
  return (
    <>
      <Router source={historyIntegration}>
        <App />
      </Router>
    </>
  )
}

export default Root
