import { colors } from '@src/style/theme'
import {
  filterFalseElements,
  filterNonNullableElements,
} from '@utils/arrayUtils'
import { JSXElement } from 'solid-js'
import { css } from 'solid-styled-components'

const containerStyle = css`
  &&& {
    display: grid;
    grid-template-columns: auto 1fr;
    font-size: 14px;
    margin-block: -4px;

    .row {
      display: contents;
    }

    .row > div {
      padding-block: 8px;
    }

    .row:not(:last-child) > div {
      border-bottom: 1px solid ${colors.white.alpha(0.1)};
    }

    .value {
      padding-left: 16px;
      color: ${colors.white.var};
    }

    .name {
      opacity: 0.7;
    }
  }
`

type TableViewProps = {
  rows: (
    | {
        name: string
        value: JSXElement
      }
    | false
  )[]
}

export const TableView = (props: TableViewProps) => {
  return (
    <div class={containerStyle}>
      <Index each={filterFalseElements(props.rows)}>
        {(row) => (
          <div class="row">
            <div class="name">{row().name}</div>
            <div class="value">{row().value}</div>
          </div>
        )}
      </Index>
    </div>
  )
}
