import { injectCSS } from '@utils/injectCSS';

export const allowTextSelection = injectCSS`
  user-select: text;

  * {
    user-select: text;
  }
`;
