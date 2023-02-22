export const resetStyle = `
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  min-height: 0;
  min-width: 0;
  flex-shrink: 0;

  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Remove default padding */
ul[class],
ol[class] {
  padding: 0;
}

/* Remove default margin */
body,
h1,
h2,
h3,
h4,
p,
ul[class],
ol[class],
li,
figure,
figcaption,
blockquote,
dl,
dd {
  margin: 0;
}

/* Set core body defaults */
body {
  scroll-behavior: smooth;
}

/* Natural flow and rhythm in articles by default */
article > * + * {
  margin-top: 1em;
}

/* Inherit fonts for inputs and buttons */
input,
button,
textarea,
select {
  font: inherit;
}

a {
  color: inherit;
  text-decoration: inherit;
  cursor: pointer;
}

a:visited {
  color: inherit;
}

button {
  background: transparent;
  border: 0;
  outline: none;
  cursor: pointer;
  -webkit-appearance: none;
}
`
