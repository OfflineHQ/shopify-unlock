export function hexToHsla(hex: string) {
  if (!hex) hex = "#00000000";
  let r = parseInt(hex.substring(1, 3), 16) / 255;
  let g = parseInt(hex.substring(3, 5), 16) / 255;
  let b = parseInt(hex.substring(5, 7), 16) / 255;
  let a = 1;

  if (hex.length === 9) {
    a = parseInt(hex.substring(7, 9), 16) / 255;
  }

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);

  let h,
    s,
    l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }

    h = h ?? 0; // Ensure h is defined
    h /= 6;
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(
    l * 100,
  )}% / ${a}`;
}

export function hexToHsl(hex: string) {
  const hsla = hexToHsla(hex);
  return hsla.substring(0, hsla.lastIndexOf("/"));
}
