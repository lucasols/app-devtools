import { ApiExplorerMenu } from '@src/pages/api-explorer/ApiExplorerMenu'
import { css } from 'solid-styled-components'

const containerStyle = css`
  display: grid;
  grid-template-columns: auto auto 3fr;
`

type ApiExplorerPageProps = {}

export const ApiExplorerPage = (props: ApiExplorerPageProps) => {
  return (
    <div class={containerStyle}>
      <ApiExplorerMenu />
    </div>
  )
}
