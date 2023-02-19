import { mq } from '@src/style/mediaQueries'
import { colors } from '@src/style/theme'

export const scrollBarStyle = `
  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;

  }

  ${mq.mobile} {
    *::-webkit-scrollbar {
      width: 0;
      height: 0;
    }
  }

  ::-webkit-scrollbar-track,
  ::-webkit-scrollbar-corner {
    background-color: transparent;
  }

  ::-webkit-scrollbar-thumb {
    border-radius: 4px;
    margin: 2px;
    background-color: ${colors.bg.alpha(0.5)};

    &:hover {
      background-color: ${colors.bg.lighter(6)};
    }

    &:active {
      background-color: ${colors.bg.lighter(11)};
    }
  }

`
