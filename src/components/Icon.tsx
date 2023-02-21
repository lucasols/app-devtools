import { getIconSvg, Icons } from '@src/config/icons'
import { fillContainer } from '@src/style/helpers/fillContainer'
import { parseUnit } from '@utils/parseUnit'
import { css } from 'solid-styled-components'

export const style = css`
  position: relative;
  color: currentColor;
  height: var(--icon-size, 24px);
  width: var(--icon-size, 24px);

  svg {
    display: block;
    ${fillContainer};
  }
`

type IconProps = {
  name: Icons
  class?: string
  color?: string
  size?: number
}

const Icon = (props: IconProps) => {
  const icon = getIconSvg(props.name)

  return (
    <div
      class={`icon ${props.class || ''} ${style}`}
      style={
        {
          color: props.color,
          '--icon-size': props.size && parseUnit(props.size),
        } as any
      }
      innerHTML={icon}
    />
  )
}

export default Icon
