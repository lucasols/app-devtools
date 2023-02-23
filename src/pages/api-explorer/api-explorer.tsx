import { ApiExplorerMenu } from '@src/pages/api-explorer/ApiExplorerMenu'
import { RequestDetails } from '@src/pages/api-explorer/RequestDetails'
import { Timeline } from '@src/pages/api-explorer/Timeline'
import { css } from 'solid-styled-components'

const containerStyle = css`
  &&& {
    display: grid;
    grid-template-columns: 1fr 1fr 3fr;
  }
`

export const ApiExplorerPage = () => {
  return (
    <div class={containerStyle}>
      <ApiExplorerMenu />
      <Timeline />
      <RequestDetails />
    </div>
  )
}
