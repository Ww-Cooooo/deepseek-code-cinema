let starTexture: string | null = null;

const hash2 = (x: number, y: number, seed: number) => {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

const smoothstep = (t: number) => t * t * (3 - 2 * t);
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

const valueNoise = (x: number, y: number, seed: number) => {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = smoothstep(x - x0);
  const fy = smoothstep(y - y0);
  const a = hash2(x0, y0, seed);
  const b = hash2(x0 + 1, y0, seed);
  const c = hash2(x0, y0 + 1, seed);
  const d = hash2(x0 + 1, y0 + 1, seed);
  return mix(mix(a, b, fx), mix(c, d, fx), fy);
};

const fbm = (x: number, y: number, seed: number, octaves = 4) => {
  let value = 0;
  let amp = 0.55;
  let freq = 1;
  let total = 0;
  for (let i = 0; i < octaves; i++) {
    value += valueNoise(x * freq, y * freq, seed + i * 37) * amp;
    total += amp;
    amp *= 0.5;
    freq *= 2.03;
  }
  return value / total;
};

export const getStarTexture = (): string => {
  if (starTexture) return starTexture;
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable for star texture');
  const image = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = (x / size) * 7.3;
      const ny = (y / size) * 7.3;
      const broad = fbm(nx, ny, 937, 4);
      const fine = fbm(nx * 3.2 + 8.2, ny * 3.2 - 3.7, 211, 3);
      const cells = fbm(nx * 7.4 + 2.1, ny * 7.4 + 11.3, 89, 2);
      const t = Math.max(0, Math.min(1, 0.18 + broad * 0.66 + fine * 0.24 + cells * 0.1));
      let r = mix(56, 255, Math.pow(t, 1.05));
      let g = mix(15, 205, Math.pow(t, 1.4));
      let b = mix(5, 126, Math.pow(t, 2.0));
      if (cells > 0.65) {
        const hot = (cells - 0.65) / 0.35;
        r = mix(r, 255, hot * 0.55);
        g = mix(g, 232, hot * 0.45);
        b = mix(b, 177, hot * 0.35);
      }
      if (broad < 0.22) {
        r *= 0.94;
        g *= 0.88;
        b *= 0.86;
      }
      const i = (y * size + x) * 4;
      image.data[i] = r;
      image.data[i + 1] = g;
      image.data[i + 2] = b;
      image.data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  starTexture = canvas.toDataURL('image/png');
  return starTexture;
};
