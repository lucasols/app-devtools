import { stack } from '@src/style/helpers/stack'
import { colors } from '@src/style/theme'
import { autoIncrementId } from '@utils/autoIncrementId'
import { cx } from '@utils/cx'
import { css } from 'solid-styled-components'

const containerStyle = css`
  &&& {
    ${stack({ align: 'left' })};
    width: 100%;
    position: relative;

    label {
      color: ${colors.primary.var};
      z-index: 1;
      font-size: 13px;
      letter-spacing: 0.08em;
      margin-left: 6px;
    }

    .inputContainer {
      background: ${colors.white.alpha(0.05)};
      border-radius: 4px;
      margin-top: 0px;
      position: relative;
      width: 100%;
      overflow: hidden;
      ${stack({ align: 'left' })};
    }

    select {
      height: 32px;
      border: 0;
      width: 100%;
      padding-top: 2px;
      padding-left: 10px;
      font-size: 14px;
      background: transparent;
      color: ${colors.white.var};

      &:focus {
        outline: 0;
      }

      option {
        font-size: 18px;
      }
    }

    .label-background {
      position: absolute;
      left: 0;
      right: 8px;
      height: 17px;
      background: ${colors.white.var};
    }
  }
`

interface SelectProps<T> {
  class?: string
  value: T | null
  label?: string
  options: {
    value: T
    label: string
  }[]
  onChange: (value: T) => any
}

const Select = <T extends string>(props: SelectProps<T>) => {
  const inputId = `input${autoIncrementId()}`

  return (
    <div class={cx(containerStyle, props.class)}>
      <Show when={props.label}>
        <label for={inputId}>{props.label}</label>
      </Show>

      <div class="inputContainer">
        <select
          id={inputId}
          value={props.value ?? ''}
          onChange={(e) => {
            if (e.currentTarget.value) {
              props.onChange(e.currentTarget.value as T)
            }
          }}
        >
          {!props.value && <option value="">-- select an option --</option>}

          <For each={props.options}>
            {(option) => <option value={option.value}>{option.label}</option>}
          </For>
        </select>
      </div>
    </div>
  )
}

export default Select
