import * as THREE from 'three';

type Rng = () => number;

function lcg(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

let glowTexture: THREE.CanvasTexture | undefined;
let discTexture: THREE.CanvasTexture | undefined;
let streakTexture: THREE.CanvasTexture | undefined;
let barkTexture: THREE.CanvasTexture | undefined;
let shaftTexture: THREE.CanvasTexture | undefined;
let seedTexture: THREE.CanvasTexture | undefined;

function makeCanvas(size: number) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas unavailable while creating texture');
  return {canvas, ctx};
}

/** Soft optical halo. White RGB with a long alpha falloff. */
export function getGlowTexture() {
  if (glowTexture) return glowTexture;
  const {canvas, ctx} = makeCanvas(256);
  const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.07, 'rgba(255,255,255,0.95)');
  gradient.addColorStop(0.2, 'rgba(255,255,255,0.36)');
  gradient.addColorStop(0.5, 'rgba(255,255,255,0.09)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);
  glowTexture = new THREE.CanvasTexture(canvas);
  glowTexture.colorSpace = THREE.SRGBColorSpace;
  glowTexture.needsUpdate = true;
  return glowTexture;
}

/** Small soft disc for dust motes and out-of-focus particles. */
export function getDiscTexture() {
  if (discTexture) return discTexture;
  const {canvas, ctx} = makeCanvas(128);
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(255,255,255,0.92)');
  gradient.addColorStop(0.32, 'rgba(255,255,255,0.55)');
  gradient.addColorStop(0.72, 'rgba(255,255,255,0.12)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  discTexture = new THREE.CanvasTexture(canvas);
  discTexture.colorSpace = THREE.SRGBColorSpace;
  discTexture.needsUpdate = true;
  return discTexture;
}

/** Horizontal anamorphic streak for the low sun. */
export function getStreakTexture() {
  if (streakTexture) return streakTexture;
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas unavailable while creating streak texture');
  const gradient = ctx.createLinearGradient(0, 0, 512, 0);
  gradient.addColorStop(0, 'rgba(255,255,255,0)');
  gradient.addColorStop(0.28, 'rgba(255,255,255,0.06)');
  gradient.addColorStop(0.5, 'rgba(255,255,255,0.85)');
  gradient.addColorStop(0.72, 'rgba(255,255,255,0.06)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 64);
  const vertical = ctx.createLinearGradient(0, 0, 0, 64);
  vertical.addColorStop(0, 'rgba(0,0,0,0)');
  vertical.addColorStop(0.5, 'rgba(0,0,0,0.3)');
  vertical.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalCompositeOperation = 'destination-out';
  ctx.fillStyle = vertical;
  ctx.fillRect(0, 0, 512, 64);
  streakTexture = new THREE.CanvasTexture(canvas);
  streakTexture.colorSpace = THREE.SRGBColorSpace;
  streakTexture.needsUpdate = true;
  return streakTexture;
}

/** A soft vertical beam with feathered edges. */
export function getShaftTexture() {
  if (shaftTexture) return shaftTexture;
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas unavailable while creating shaft texture');
  const horizontal = ctx.createLinearGradient(0, 0, 128, 0);
  horizontal.addColorStop(0, 'rgba(255,255,255,0)');
  horizontal.addColorStop(0.33, 'rgba(255,255,255,0.45)');
  horizontal.addColorStop(0.5, 'rgba(255,255,255,0.92)');
  horizontal.addColorStop(0.67, 'rgba(255,255,255,0.45)');
  horizontal.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = horizontal;
  ctx.fillRect(0, 0, 128, 512);
  ctx.globalCompositeOperation = 'destination-in';
  const vertical = ctx.createLinearGradient(0, 0, 0, 512);
  vertical.addColorStop(0, 'rgba(0,0,0,0)');
  vertical.addColorStop(0.16, 'rgba(0,0,0,0.8)');
  vertical.addColorStop(0.55, 'rgba(0,0,0,0.5)');
  vertical.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = vertical;
  ctx.fillRect(0, 0, 128, 512);
  shaftTexture = new THREE.CanvasTexture(canvas);
  shaftTexture.colorSpace = THREE.SRGBColorSpace;
  shaftTexture.needsUpdate = true;
  return shaftTexture;
}

/** Mottled amber shell. Small enough to read as surface, not a photographic claim. */
export function getSeedTexture() {
  if (seedTexture) return seedTexture;
  const {canvas, ctx} = makeCanvas(256);
  const rand = lcg(71193);
  const gradient = ctx.createLinearGradient(0, 0, 256, 256);
  gradient.addColorStop(0, '#9b5a27');
  gradient.addColorStop(0.45, '#c58a4d');
  gradient.addColorStop(0.8, '#7a3d15');
  gradient.addColorStop(1, '#4f260d');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 260; i++) {
    const x = rand() * 256;
    const y = rand() * 256;
    const r = 0.4 + rand() * 2.8;
    const light = rand() > 0.55;
    ctx.fillStyle = light
      ? `rgba(243,196,125,${0.03 + rand() * 0.09})`
      : `rgba(55,24,7,${0.04 + rand() * 0.12})`;
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * (0.4 + rand() * 0.8), rand() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let i = 0; i < 18; i++) {
    ctx.strokeStyle = `rgba(66,31,10,${0.09 + rand() * 0.14})`;
    ctx.lineWidth = 0.6 + rand() * 1.4;
    ctx.beginPath();
    ctx.moveTo(rand() * 256, 0);
    ctx.bezierCurveTo(rand() * 256, 85, rand() * 256, 165, rand() * 256, 256);
    ctx.stroke();
  }
  seedTexture = new THREE.CanvasTexture(canvas);
  seedTexture.colorSpace = THREE.SRGBColorSpace;
  seedTexture.wrapS = THREE.RepeatWrapping;
  seedTexture.wrapT = THREE.ClampToEdgeWrapping;
  seedTexture.needsUpdate = true;
  return seedTexture;
}

/** Fibrous, cracked bark used as a bump/roughness input, not as a literal photo. */
export function getBarkTexture() {
  if (barkTexture) return barkTexture;
  const size = 512;
  const {canvas, ctx} = makeCanvas(size);
  const rand = lcg(91377);
  ctx.fillStyle = '#7b7b73';
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 1250; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const length = 12 + rand() * 150;
    const width = 0.6 + rand() * 2.4;
    const shade = 24 + Math.floor(rand() * 175);
    ctx.strokeStyle = `rgba(${shade},${shade},${Math.floor(shade * 0.92)},${0.22 + rand() * 0.4})`;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(
      x + (rand() - 0.5) * 14,
      y + length * 0.35,
      x + (rand() - 0.5) * 18,
      y + length * 0.72,
      x + (rand() - 0.5) * 22,
      y + length,
    );
    ctx.stroke();
  }
  for (let i = 0; i < 55; i++) {
    const x = rand() * size;
    const y = rand() * size;
    ctx.strokeStyle = `rgba(22,20,15,${0.18 + rand() * 0.3})`;
    ctx.lineWidth = 1 + rand() * 1.8;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (rand() - 0.5) * 55, y + (rand() - 0.2) * 14);
    ctx.stroke();
  }
  barkTexture = new THREE.CanvasTexture(canvas);
  barkTexture.colorSpace = THREE.SRGBColorSpace;
  barkTexture.wrapS = THREE.RepeatWrapping;
  barkTexture.wrapT = THREE.RepeatWrapping;
  barkTexture.repeat.set(2.2, 4.5);
  barkTexture.needsUpdate = true;
  return barkTexture;
}

let grainUrl: string | undefined;

let mudTexture: THREE.CanvasTexture | undefined;

/** Wet silt with small embedded stones and hairline drying cracks. */
export function getMudTexture() {
  if (mudTexture) return mudTexture;
  const size = 512;
  const {canvas, ctx} = makeCanvas(size);
  const rand = lcg(60177);
  ctx.fillStyle = '#241b12';
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 900; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 1 + rand() * 16;
    const warm = rand() > 0.55;
    ctx.fillStyle = warm
      ? `rgba(${70 + Math.floor(rand() * 40)},${52 + Math.floor(rand() * 26)},32,${0.04 + rand() * 0.12})`
      : `rgba(${26 + Math.floor(rand() * 22)},${22 + Math.floor(rand() * 16)},16,${0.05 + rand() * 0.16})`;
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * (0.35 + rand() * 0.6), rand() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let i = 0; i < 48; i++) {
    ctx.strokeStyle = `rgba(10,8,6,${0.18 + rand() * 0.24})`;
    ctx.lineWidth = 0.7 + rand() * 1.5;
    ctx.beginPath();
    const x = rand() * size;
    const y = rand() * size;
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(
      x + (rand() - 0.5) * 70,
      y + rand() * 30,
      x + (rand() - 0.5) * 90,
      y + 30 + rand() * 50,
      x + (rand() - 0.5) * 120,
      y + 60 + rand() * 70,
    );
    ctx.stroke();
  }
  for (let i = 0; i < 24; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 1.5 + rand() * 4;
    ctx.fillStyle = `rgba(${90 + Math.floor(rand() * 30)},${85 + Math.floor(rand() * 24)},70,0.35)`;
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.7, rand() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  mudTexture = new THREE.CanvasTexture(canvas);
  mudTexture.colorSpace = THREE.SRGBColorSpace;
  mudTexture.wrapS = THREE.RepeatWrapping;
  mudTexture.wrapT = THREE.RepeatWrapping;
  mudTexture.repeat.set(4, 4);
  mudTexture.needsUpdate = true;
  return mudTexture;
}

let ringTexture: THREE.CanvasTexture | undefined;

/** Concentric growth rings of the old forest floor, read from directly above. */
export function getRingTexture() {
  if (ringTexture) return ringTexture;
  const size = 2048;
  const {canvas, ctx} = makeCanvas(size);
  const rand = lcg(33517);
  const c = size / 2;
  const ground = ctx.createRadialGradient(c, c, 0, c, c, c);
  ground.addColorStop(0, '#3a2c1b');
  ground.addColorStop(0.25, '#2d2417');
  ground.addColorStop(0.62, '#211c13');
  ground.addColorStop(1, '#191811');
  ctx.fillStyle = ground;
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 34; i++) {
    const radius = 34 + Math.pow(i / 34, 0.78) * (c - 44);
    const width = 2.5 + rand() * 13 + (i % 5 === 0 ? 9 : 0);
    const bright = i % 3 === 0 ? 0.22 : 0.11;
    ctx.strokeStyle = `rgba(${150 + Math.floor(rand() * 40)},${112 + Math.floor(rand() * 34)},${72 + Math.floor(rand() * 24)},${bright + rand() * 0.1})`;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.arc(c, c, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = `rgba(12,10,7,${0.18 + rand() * 0.22})`;
    ctx.lineWidth = 1.2 + rand() * 2.4;
    ctx.beginPath();
    ctx.arc(c, c, radius + width * 0.55, 0, Math.PI * 2);
    ctx.stroke();
  }

  for (let i = 0; i < 2200; i++) {
    const a = rand() * Math.PI * 2;
    const r = Math.pow(rand(), 0.5) * c;
    const x = c + Math.cos(a) * r;
    const y = c + Math.sin(a) * r;
    const s = 0.5 + rand() * 3.2;
    ctx.fillStyle = rand() > 0.5
      ? `rgba(120,95,62,${0.02 + rand() * 0.08})`
      : `rgba(8,7,5,${0.03 + rand() * 0.1})`;
    ctx.beginPath();
    ctx.ellipse(x, y, s, s * (0.4 + rand() * 0.7), rand() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < 46; i++) {
    const a = rand() * Math.PI * 2;
    const inner = 30 + rand() * 160;
    ctx.strokeStyle = `rgba(8,7,5,${0.2 + rand() * 0.25})`;
    ctx.lineWidth = 0.8 + rand() * 2.2;
    ctx.beginPath();
    ctx.moveTo(c + Math.cos(a) * inner, c + Math.sin(a) * inner);
    const midA = a + (rand() - 0.5) * 0.25;
    ctx.lineTo(c + Math.cos(midA) * (inner + 80 + rand() * 200), c + Math.sin(midA) * (inner + 80 + rand() * 200));
    ctx.stroke();
  }

  const scar = ctx.createRadialGradient(c, c, 0, c, c, 48);
  scar.addColorStop(0, 'rgba(8,6,4,0.9)');
  scar.addColorStop(0.4, 'rgba(20,15,9,0.55)');
  scar.addColorStop(1, 'rgba(20,15,9,0)');
  ctx.fillStyle = scar;
  ctx.fillRect(c - 60, c - 60, 120, 120);

  ringTexture = new THREE.CanvasTexture(canvas);
  ringTexture.colorSpace = THREE.SRGBColorSpace;
  ringTexture.needsUpdate = true;
  return ringTexture;
}

/** One deterministic grain tile; the overlay shifts it every frame. */
export function getGrainDataUrl() {
  if (grainUrl) return grainUrl;
  const size = 192;
  const {canvas, ctx} = makeCanvas(size);
  const image = ctx.createImageData(size, size);
  const rand = lcg(551219);
  for (let i = 0; i < image.data.length; i += 4) {
    const value = 70 + Math.floor(rand() * 185);
    image.data[i] = value;
    image.data[i + 1] = value;
    image.data[i + 2] = value;
    image.data[i + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
  grainUrl = canvas.toDataURL('image/png');
  return grainUrl;
}
