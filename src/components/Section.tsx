import { stack } from '@src/style/helpers/stack'
import { colors, fonts } from '@src/style/theme'
import { cx } from '@utils/cx'
import { JSX } from 'solid-js'
import { css } from 'solid-styled-components'

const containerStyle = css`
  ${stack()};

  > h1 {
    font-size: 14px;
    color: ${colors.secondary.var};
    letter-spacing: 0.08em;
    font-family: ${fonts.decorative};
    font-weight: 300;
    background: ${colors.bgPrimary.var};
    z-index: 1;
    align-self: flex-start;
    position: sticky;
    padding-inline: 4px;
    border-radius: 0 0 4px 0;
    padding-bottom: 2px;
    top: 0;
  }

  > .content {
    --padding-top: 0px;
    margin-top: calc(var(--padding-top) * -1);
    padding-top: calc(var(--padding-top) + 10px);
    padding-inline: 10px;
    padding-bottom: 10px;
    background: ${colors.white.alpha(0.05)};
    border-radius: 4px;
  }

  & + & {
    margin-top: 20px;
  }
`

type SectionProps = {
  title: string | null
  children: JSX.Element
  class?: string
}

export const Section = (props: SectionProps) => {
  return (
    <div class={cx(containerStyle, props.class)}>
      {props.title && <h1>{props.title}</h1>}

      <div class="content">{props.children}</div>
    </div>
  )
}
