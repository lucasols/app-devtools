import { anyObj } from '@utils/typings';
import { CSSProperties, injectCSS } from '@utils/injectCSS';

export function variants(
  name: string,
  variantsObj: anyObj<string | CSSProperties>,
) {
  let generatedCss = '';

  Object.entries(variantsObj).forEach(([variant, style]) => {
    generatedCss += injectCSS({
      [`&.${variant}`]: `{${injectCSS(style as string)}}`,
    });
  });

  return generatedCss;
}
