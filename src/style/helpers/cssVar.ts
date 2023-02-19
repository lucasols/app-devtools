import { mapArrayToObj } from '@utils/mapArrayToObj';
import { parseUnit } from '@utils/parseUnit';
import React, { useMemo } from 'react';

// IDEA: hash css creation our create
export function createCssVar(name: string) {
  const varName = `--${name}`;

  return {
    name: varName,
    var: `var(${varName})`,
    setStyle: (newValue: string | number) => ({
      [varName]: newValue,
    }),
    setCss: (newValue: string | number) =>
      `${varName}: ${
        typeof newValue === 'number' ? parseUnit(newValue) : newValue
      };`,
  };
}

type CssVar = ReturnType<typeof createCssVar>;

export function createCssVars<T extends ReadonlyArray<string>>(
  scope: string,
  vars: T,
) {
  return mapArrayToObj<T[number], T, CssVar>(vars, (name) => [
    name,
    createCssVar(`${scope}-${name}`),
  ]);
}

export function getCssVarsStyle(vars: [CssVar, string | number][]) {
  return mapArrayToObj(vars, ([{ name }, value]) => [name, value]);
}

// TODO: handle css var with ref ...setProperty... ?
export function useCssVarsStyle(vars: [CssVar, string | number][]) {
  const style = useMemo(() => getCssVarsStyle(vars), [JSON.stringify(vars)]);

  return style;
}
