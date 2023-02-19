import { parseUnit } from '@utils/parseUnit';
import { injectCSS } from '@utils/injectCSS';

const autoFill = 'repeat(auto-fill, auto)';

type Unit = string | number;

export function gridStack(
  rows: Unit[] = [autoFill],
  align?: 'stretch' | 'center' | 'left' | 'right',
) {
  return injectCSS`
    display: grid;
    justify-items: ${align};
    grid-template-columns: 1fr;
    grid-template-rows: ${rows.map((row) => parseUnit(row)).join(' ')};

    > * {
      min-height: 0;
    }
  `;
}

export function gridInline(
  columns: Unit[] = [autoFill],
  align?: 'stretch' | 'center' | 'top' | 'bottom',
) {
  return injectCSS`
    display: grid;
    align-items: ${align};
    grid-template-rows: 1fr;
    grid-template-columns: ${columns
      .map((column) => parseUnit(column))
      .join(' ')};

    > * {
      min-width: 0;
    }
  `;
}
