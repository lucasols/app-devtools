import { activeToast } from '@src/utils/toast'
import { colors, fonts, shadows } from '@src/style/theme'
import { css } from 'solid-styled-components'

const toastStyle = css`
  &&& {
    position: absolute;
    bottom: 16px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 100;
    background: ${colors.bgSecondary.var};
    color: ${colors.white.var};
    border: 1px solid ${colors.secondary.alpha(0.4)};
    border-radius: 6px;
    padding: 8px 16px;
    font-size: 13px;
    font-family: ${fonts.decorative};
    box-shadow: ${shadows.hardShadow};
    pointer-events: none;
  }
`

export const Toast = () => {
  return (
    <Show when={activeToast.value}>
      <div class={toastStyle}>{activeToast.value}</div>
    </Show>
  )
}
