let fontsWereAdded = false

export function addGoogleFonts() {
  if (fontsWereAdded) return

  fontsWereAdded = true

  const googleFontsURL =
    'https://fonts.googleapis.com/css2?family=Fira+Code:wght@300..700&family=Work+Sans:ital,wght@0,100..900;1,100..900&display=swap'

  const headID = document.getElementsByTagName('head')[0]
  const link = document.createElement('link')
  link.type = 'text/css'
  link.rel = 'stylesheet'
  link.href = googleFontsURL

  headID?.appendChild(link)
}
