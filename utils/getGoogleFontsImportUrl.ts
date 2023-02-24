type Fonts = {
  family: string;
  weights: [start: number, range: '..', end: number] | number[];
  italics?: number[];
}[];

export function getGoogleFontsImportUrl(fonts: Fonts): string {
  let url = '';

  fonts.forEach(({ family, weights, italics }) => {
    url += `${url ? '&' : ''}family=${family}:`;

    if (weights[1] === '..') {
      url += `wght@${weights[0]}..${weights[2]}`;
    } else {
      url += 'ital,wght@';

      weights.forEach((value, i) => {
        if (i !== 0) {
          url += ';';
        }

        url += `0,${value}`;
      });

      italics?.forEach((value) => {
        url += `;1,${value}`;
      });
    }
  });

  return `https://fonts.googleapis.com/css2?${url}&display=swap`;
}
