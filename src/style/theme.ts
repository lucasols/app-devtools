import { createThemeColors } from '@utils/createThemev2'

export const colors = createThemeColors({
  bgPrimary: '#0F172A',
  textPrimary: '#fff',
  primary: '#F472B6',
  secondary: '#7DD3FC',
  warning: '#FDE047',
  error: '#E53558',
  successDarker: '#0d9488',
  success: '#6EE7B7',
  bg: '#EAEFFF',
  white: '#fff',
  black: '#000',
})

export const gradients = {
  primary: `linear-gradient(90deg, #A78BFA, #00D4FF);`,
  secondary: `linear-gradient(90deg, #448cfd , #6ee7b7);`,
  red: `linear-gradient(90deg, #E53558 , #E75590);`,
}

export const shadows = {
  modal: '0px 8px 16px rgba(26, 34, 46, 0.04)',
  button: '0px 1px 8px rgba(26, 34, 46, 0.06)',
  hardShadow: '0px 1px 8px rgba(26, 34, 46, 0.16)',
}

export type ThemeColors = keyof typeof colors

export const fonts = {
  primary: 'Work Sans, sans-serif',
  decorative: '"Fira Code", monospaced',
}
