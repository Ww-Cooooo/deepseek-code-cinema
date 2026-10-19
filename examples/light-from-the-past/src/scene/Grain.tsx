import React, {useMemo} from 'react';

const seeded = (seed: number) => {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const makeGrain = (seed: number): string => {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  const image = ctx.createImageData(256, 256);
  const rng = seeded(seed);
  for (let i = 0; i < image.data.length; i += 4) {
    const value = 96 + Math.floor(rng() * 135);
    image.data[i] = value;
    image.data[i + 1] = value;
    image.data[i + 2] = value;
    image.data[i + 3] = 26 + Math.floor(rng() * 42);
  }
  ctx.putImageData(image, 0, 0);
  return canvas.toDataURL('image/png');
};

export const Grain: React.FC<{frame: number}> = ({frame}) => {
  const tiles = useMemo(() => [makeGrain(7103), makeGrain(9109), makeGrain(13007)], []);
  const index = Math.abs(Math.floor(frame / 2)) % tiles.length;
  const x = (frame * 83) % 512;
  const y = (frame * 47) % 512;

  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: -70,
        backgroundImage: `url("${tiles[index]}")`,
        backgroundRepeat: 'repeat',
        backgroundSize: '430px 430px',
        backgroundPosition: `${x - 70}px ${y - 70}px`,
        opacity: 0.34,
        mixBlendMode: 'soft-light',
        pointerEvents: 'none',
      }}
    />
  );
};
