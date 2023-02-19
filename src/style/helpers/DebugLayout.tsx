import { useShortCut } from '@utils/hooks/useShortCut';
import { css } from '@linaria/core';

const debugLayoutStyle = css`
  *:not(g):not(path) {
    color: hsla(210, 100%, 100%, 0.9) !important;
    outline: solid 3px hsla(210, 100%, 100%, 0.5) !important;
    box-shadow: none !important;
    filter: none !important;
    * {
      background-color: rgba(255, 0, 0, 0.2) !important;
    }
    * * {
      background-color: rgba(0, 255, 0, 0.2) !important;
    }
    * * * {
      background-color: rgba(0, 0, 255, 0.2) !important;
    }
    * * * * {
      background-color: rgba(255, 0, 255, 0.2) !important;
    }
    * * * * * {
      background-color: rgba(0, 255, 255, 0.2) !important;
    }
    * * * * * * {
      background-color: rgba(255, 255, 0, 0.2) !important;
    }
    * * * * * * * {
      background-color: rgba(255, 0, 0, 0.2) !important;
    }
    * * * * * * * * {
      background-color: rgba(0, 255, 0, 0.2) !important;
    }
    * * * * * * * * * {
      background-color: rgba(0, 0, 255, 0.2) !important;
    }
  }
`;

export const DebugLayout = () => {
  useShortCut('Shift+D', () => {
    window.document.body.classList.toggle(debugLayoutStyle);
  });

  return null;
};
