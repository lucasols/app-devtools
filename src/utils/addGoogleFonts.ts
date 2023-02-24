import { getGoogleFontsImportUrl } from '@utils/getGoogleFontsImportUrl'

let fontsWereAdded = false

export function addGoogleFonts() {
  if (fontsWereAdded) return

  fontsWereAdded = true

  const googleFonts = getGoogleFontsImportUrl([
    {
      family: 'Work+Sans',
      weights: [300, '..', 700],
    },
  ])

  const headID = document.getElementsByTagName('head')[0]
  const link = document.createElement('link')
  link.type = 'text/css'
  link.rel = 'stylesheet'
  link.href = googleFonts

  headID?.appendChild(link)
}
