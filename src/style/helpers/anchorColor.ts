import { injectCSS } from '@utils/injectCSS';

export function anchorTextColor(color: string) {
  return injectCSS`
    color: ${color};

    &:visited {
      color: ${color};
    }
  `;
}
