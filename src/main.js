import * as THREE from "three";
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

const video = document.getElementById("webcam");
const infoText = document.getElementById("info");
const badgeText = document.getElementById("badge");

// ==========================================
// 1. Setup Scene, Kamera, dan Renderer
// ==========================================
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.z = 6.2;

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

function createGlowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");

  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(255, 255, 255, 1)");
  grad.addColorStop(0.32, "rgba(255, 235, 255, 0.92)");
  grad.addColorStop(0.68, "rgba(255, 255, 255, 0.35)");
  grad.addColorStop(1, "rgba(255, 255, 255, 0)");

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(canvas);
}

// ==========================================
// 2. Generator Bentuk Partikel Megah (15.000 partikel)
// ==========================================
const COUNT = 15000;

function generateScatter() {
  const arr = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i++) {
    const r = 2.4 + Math.random() * 5.8;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    arr[i * 3] = r * Math.sin(phi) * Math.cos(theta) * 1.45;
    arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    arr[i * 3 + 2] = r * Math.cos(phi);
  }
  return arr;
}

// Planet Saturnus Mewah: Bola Inti Kuning + Cincin Berlapis & Celah Cassini Division
function generateSaturn() {
  const arr = new Float32Array(COUNT * 3);
  const planetCount = Math.floor(COUNT * 0.36);

  for (let i = 0; i < COUNT; i++) {
    if (i < planetCount) {
      // Bola planet dengan lapisan kulit luar lebih padat agar bentuknya tegas
      const isShell = i < planetCount * 0.72;
      const r = isShell
        ? 1.16 * (0.9 + Math.random() * 0.1)
        : 1.12 * Math.cbrt(Math.random());
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      // Sedikit pipih di kutub seperti Saturnus asli (oblate spheroid)
      arr[i * 3 + 1] = r * Math.cos(phi) * 0.92;
      arr[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    } else {
      // Cincin berlapis realistis dengan celah Cassini Division
      const bandRoll = Math.random();
      let ringR;

      if (bandRoll < 0.14) {
        // Cincin C (dalam tipis)
        ringR = 1.48 + Math.random() * 0.34;
      } else if (bandRoll < 0.68) {
        // Cincin B (tengah sangat padat & mewah)
        ringR = 1.84 + Math.random() * 0.86;
      } else if (bandRoll < 0.94) {
        // Celah Cassini Division kosong di radius 2.70 - 2.86, lalu Cincin A (luar)
        ringR = 2.86 + Math.random() * 0.62;
      } else {
        // Pita tepi luar tipis (F-Ring)
        ringR = 3.55 + Math.random() * 0.08;
      }

      const angle = Math.random() * Math.PI * 2;
      const thickness = (Math.random() - 0.5) * 0.055;
      const x = ringR * Math.cos(angle);
      const y = thickness;
      const z = ringR * Math.sin(angle);

      const tilt = 0.38;
      arr[i * 3] = x;
      arr[i * 3 + 1] = y * Math.cos(tilt) - z * Math.sin(tilt);
      arr[i * 3 + 2] = y * Math.sin(tilt) + z * Math.cos(tilt);
    }
  }
  return arr;
}

function generateGalaxy() {
  const arr = new Float32Array(COUNT * 3);
  const arms = 5;
  const coreLimit = Math.floor(COUNT * 0.22);
  const armLimit = Math.floor(COUNT * 0.88);

  for (let i = 0; i < COUNT; i++) {
    let x, y, z;

    if (i < coreLimit) {
      const r = Math.pow(Math.random(), 1.6) * 0.95;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      x = r * Math.sin(phi) * Math.cos(theta);
      y = r * Math.sin(phi) * Math.sin(theta) * 0.42;
      z = r * Math.cos(phi);
    } else if (i < armLimit) {
      const r = 0.35 + Math.pow(Math.random(), 0.78) * 3.45;
      const armAngle = ((i % arms) / arms) * Math.PI * 2;
      const spinAngle = r * 1.65;
      const armWidth = (0.38 - r * 0.06) * (Math.random() + Math.random() - 1);
      const angle = armAngle + spinAngle + armWidth;

      x = Math.cos(angle) * r + (Math.random() - 0.5) * 0.12;
      y = (Math.random() - 0.5) * 0.22 * (1 - r / 4.2);
      z = Math.sin(angle) * r + (Math.random() - 0.5) * 0.12;
    } else {
      const r = 0.8 + Math.random() * 3.1;
      const angle = Math.random() * Math.PI * 2;

      x = Math.cos(angle) * r;
      y = (Math.random() - 0.5) * 0.85 * (1 - r / 4.5);
      z = Math.sin(angle) * r;
    }

    const tiltX = 0.55;
    const tiltZ = -0.25;
    const y1 = y * Math.cos(tiltX) - z * Math.sin(tiltX);
    const z1 = y * Math.sin(tiltX) + z * Math.cos(tiltX);
    const x2 = x * Math.cos(tiltZ) - y1 * Math.sin(tiltZ);
    const y2 = x * Math.sin(tiltZ) + y1 * Math.cos(tiltZ);

    arr[i * 3] = x2;
    arr[i * 3 + 1] = y2;
    arr[i * 3 + 2] = z1;
  }
  return arr;
}

function generateButterfly() {
  const arr = new Float32Array(COUNT * 3);
  const bodyLimit = Math.floor(COUNT * 0.08);
  const borderLimit = Math.floor(COUNT * 0.42);

  for (let i = 0; i < COUNT; i++) {
    let x, y, z;

    if (i < bodyLimit) {
      if (i < bodyLimit * 0.7) {
        const t = (Math.random() - 0.5) * 2.1;
        const bodyRadius = 0.11 * (1 - Math.pow(t / 1.15, 2));
        const angle = Math.random() * Math.PI * 2;

        x = Math.cos(angle) * Math.max(0.02, bodyRadius);
        y = t - 0.15;
        z = Math.sin(angle) * Math.max(0.02, bodyRadius);
      } else {
        const side = i % 2 === 0 ? 1 : -1;
        const u = Math.random();

        x = side * (0.04 + Math.pow(u, 1.3) * 0.45);
        y = 0.82 + u * 0.65;
        z = u * 0.12;
      }
    } else {
      const t = Math.random() * Math.PI * 12;
      const rBase =
        Math.exp(Math.sin(t)) -
        2 * Math.cos(4 * t) +
        Math.pow(Math.sin((2 * t - Math.PI) / 24), 5);

      let fillFactor;
      if (i < borderLimit) {
        fillFactor =
          Math.random() < 0.65
            ? 0.94 + Math.random() * 0.07
            : 0.52 + Math.random() * 0.08;
      } else {
        fillFactor = 0.12 + 0.84 * Math.pow(Math.random(), 0.42);
      }

      const scale = 0.78 * fillFactor;
      x = Math.sin(t) * rBase * scale;
      y = Math.cos(t) * rBase * scale - 0.15;
      z =
        Math.abs(x) * 0.25 -
        Math.pow(Math.abs(x), 2) * 0.04 +
        (Math.random() - 0.5) * 0.06;
    }

    arr[i * 3] = x;
    arr[i * 3 + 1] = y;
    arr[i * 3 + 2] = z;
  }
  return arr;
}

function generateHeart3D() {
  const arr = new Float32Array(COUNT * 3);
  const shellLimit = Math.floor(COUNT * 0.45);

  for (let i = 0; i < COUNT; i++) {
    const t = Math.random() * Math.PI * 2;
    const fill =
      i < shellLimit
        ? 0.86 + Math.random() * 0.14
        : Math.pow(Math.random(), 0.38) * 0.88;
    const size = 0.175;

    const x = 16 * Math.pow(Math.sin(t), 3) * size * fill;
    const y =
      (13 * Math.cos(t) -
        5 * Math.cos(2 * t) -
        2 * Math.cos(3 * t) -
        Math.cos(4 * t)) *
        size *
        fill +
      0.32;

    const zThickness = Math.sqrt(Math.max(0, 1 - fill * fill * 0.82)) * 1.15;
    const z = (Math.random() - 0.5) * 2 * zThickness;

    arr[i * 3] = x;
    arr[i * 3 + 1] = y;
    arr[i * 3 + 2] = z;
  }
  return arr;
}

function generateLoveText() {
  const canvas = document.createElement("canvas");
  canvas.width = 1350;
  canvas.height = 420;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#fff";
  ctx.font = "italic bold 195px Georgia, 'Times New Roman', serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("I Love You", canvas.width / 2, canvas.height * 0.48);

  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(canvas.width * 0.2, canvas.height * 0.78);
  ctx.quadraticCurveTo(
    canvas.width * 0.5,
    canvas.height * 0.89,
    canvas.width * 0.8,
    canvas.height * 0.78
  );
  ctx.stroke();

  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  const textPoints = [];

  for (let y = 0; y < canvas.height; y += 3) {
    for (let x = 0; x < canvas.width; x += 3) {
      const idx = (y * canvas.width + x) * 4;
      if (imgData[idx] > 120) {
        textPoints.push({
          x: (x - canvas.width / 2) * 0.0085,
          y: (canvas.height / 2 - y) * 0.0085,
        });
      }
    }
  }

  const arr = new Float32Array(COUNT * 3);
  const textLimit = Math.floor(COUNT * 0.92);

  for (let i = 0; i < COUNT; i++) {
    if (i < textLimit && textPoints.length > 0) {
      const pt = textPoints[i % textPoints.length];
      arr[i * 3] = pt.x + (Math.random() - 0.5) * 0.025;
      arr[i * 3 + 1] = pt.y + (Math.random() - 0.5) * 0.025;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 0.58;
    } else {
      arr[i * 3] = (Math.random() - 0.5) * 10.5;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 4.2;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 2.4;
    }
  }
  return arr;
}

const shapes = {
  scatter: { data: generateScatter(), label: "Ledakan Debu (Mengepal)" },
  saturn: { data: generateSaturn(), label: "Planet Saturnus Emas (1 Jari)" },
  galaxy: { data: generateGalaxy(), label: "Galaksi Spiral (2 Jari)" },
  butterfly: {
    data: generateButterfly(),
    label: "Kupu-Kupu Ungu-Pink (3 Jari)",
  },
  love: { data: generateLoveText(), label: "I Love You 3D (4-5 Jari)" },
  saranghaeyo: { data: generateHeart3D(), label: "Saranghaeyo Love Merah ❤️" },
};

let currentShapeKey = "saturn";
let targetPositions = shapes.saturn.data;

let currentTextSpread = 1.0;
let targetTextSpread = 1.0;

// ==========================================
// 3. Palet Warna Khusus Tiap Bentuk
// ==========================================
const geometry = new THREE.BufferGeometry();
const currentPositions = new Float32Array(shapes.saturn.data);
const velocities = new Float32Array(COUNT * 3);
const phases = new Float32Array(COUNT);

const purpleColors = new Float32Array(COUNT * 3);
const saturnColors = new Float32Array(COUNT * 3);
const butterflyColors = new Float32Array(COUNT * 3);
const redColors = new Float32Array(COUNT * 3);
const activeColors = new Float32Array(COUNT * 3);

// Palet Ungu Cerah (Galaksi, Ledakan, & Teks I Love You)
const cBrightLavender = new THREE.Color(0xfae8ff);
const cVibrantPurple = new THREE.Color(0xc084fc);
const cDeepViolet = new THREE.Color(0x9333ea);

// Palet Planet Saturnus: Bola Kuning Terang & Cincin Oranye Keemasan
const cPlanetBrightYellow = new THREE.Color(0xfef08a); // Kuning cahaya terang
const cPlanetRichYellow = new THREE.Color(0xfacc15); // Kuning keemasan hangat
const cRingBrightOrange = new THREE.Color(0xfb923c); // Oranye terang berkilau
const cRingDeepOrange = new THREE.Color(0xea580c); // Oranye tembaga dalam

// Palet Gradasi Ungu ke Pink (Khusus Kupu-Kupu)
const cButterflyCenterPurple = new THREE.Color(0x9333ea);
const cButterflyMidOrchid = new THREE.Color(0xd946ef);
const cButterflyEdgePink = new THREE.Color(0xff5ca8);
const cButterflyHighlightPink = new THREE.Color(0xffb3d9);

// Palet Merah Cerah (Khusus Saranghaeyo)
const cBrightPinkRed = new THREE.Color(0xffccd5);
const cVibrantRed = new THREE.Color(0xff1e42);
const cDeepCrimson = new THREE.Color(0xd90429);

const saturnData = shapes.saturn.data;
const butterflyData = shapes.butterfly.data;
const planetCount = Math.floor(COUNT * 0.36);

for (let i = 0; i < COUNT; i++) {
  phases[i] = Math.random() * Math.PI * 2;

  // 1. Warna Ungu Standar
  const mixP = Math.random();
  const cp =
    mixP < 0.45
      ? cBrightLavender.clone().lerp(cVibrantPurple, Math.random())
      : cVibrantPurple.clone().lerp(cDeepViolet, Math.random());

  purpleColors[i * 3] = cp.r;
  purpleColors[i * 3 + 1] = cp.g;
  purpleColors[i * 3 + 2] = cp.b;

  // 2. Warna Saturnus (Bola Kuning dengan pita atmosfer + Cincin Oranye berlapis)
  let cs;
  if (i < planetCount) {
    const sy = saturnData[i * 3 + 1];
    // Efek pita garis awan tipis pada bola planet kuning
    const bandWave = 0.5 + 0.5 * Math.sin(sy * 12);
    cs = cPlanetBrightYellow.clone().lerp(cPlanetRichYellow, bandWave * 0.85);
  } else {
    const sx = saturnData[i * 3];
    const sy = saturnData[i * 3 + 1];
    const sz = saturnData[i * 3 + 2];
    const ringRadius = Math.hypot(sx, sy, sz);
    const ringRatio = THREE.MathUtils.clamp((ringRadius - 1.5) / 2.1, 0, 1);
    cs = cRingBrightOrange
      .clone()
      .lerp(cRingDeepOrange, ringRatio * 0.8 + Math.random() * 0.2);
  }

  saturnColors[i * 3] = cs.r;
  saturnColors[i * 3 + 1] = cs.g;
  saturnColors[i * 3 + 2] = cs.b;

  // 3. Gradasi Kupu-Kupu (Ungu ke Pink)
  const bx = butterflyData[i * 3];
  const by = butterflyData[i * 3 + 1];
  const wingDist = THREE.MathUtils.clamp(Math.hypot(bx, by) / 2.6, 0, 1);

  let cButt;
  if (wingDist < 0.45) {
    cButt = cButterflyCenterPurple
      .clone()
      .lerp(cButterflyMidOrchid, wingDist / 0.45);
  } else {
    cButt = cButterflyMidOrchid
      .clone()
      .lerp(cButterflyEdgePink, (wingDist - 0.45) / 0.55);
  }

  if (Math.random() < 0.25) {
    cButt.lerp(cButterflyHighlightPink, 0.5);
  }

  butterflyColors[i * 3] = cButt.r;
  butterflyColors[i * 3 + 1] = cButt.g;
  butterflyColors[i * 3 + 2] = cButt.b;

  // 4. Warna Merah Saranghaeyo
  const mixR = Math.random();
  const cr =
    mixR < 0.35
      ? cBrightPinkRed.clone().lerp(cVibrantRed, Math.random())
      : cVibrantRed.clone().lerp(cDeepCrimson, Math.random());

  redColors[i * 3] = cr.r;
  redColors[i * 3 + 1] = cr.g;
  redColors[i * 3 + 2] = cr.b;

  // Warna awal mengikuti Planet Saturnus (Kuning + Oranye)
  activeColors[i * 3] = cs.r;
  activeColors[i * 3 + 1] = cs.g;
  activeColors[i * 3 + 2] = cs.b;
}

geometry.setAttribute("position", new THREE.BufferAttribute(currentPositions, 3));
geometry.setAttribute("color", new THREE.BufferAttribute(activeColors, 3));

const material = new THREE.PointsMaterial({
  size: 0.064,
  map: createGlowTexture(),
  vertexColors: true,
  transparent: true,
  opacity: 0.95,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});

const particleSystem = new THREE.Points(geometry, material);
scene.add(particleSystem);

function setShape(key) {
  if (currentShapeKey === key) return;

  currentShapeKey = key;
  targetPositions = shapes[key].data;
  badgeText.textContent = "Bentuk: " + shapes[key].label;

  if (key === "saranghaeyo") {
    particleSystem.rotation.y = particleSystem.rotation.y % (Math.PI * 2);
    targetRotX = 0;
    targetRotY = 0;
  }

  const burstForce = key === "scatter" ? 0.16 : 0.045;
  for (let i = 0; i < COUNT * 3; i++) {
    velocities[i] += (Math.random() - 0.5) * burstForce;
  }
}

// ==========================================
// 4. Deteksi Gestur Tangan + Tingkat Mekar/Kuncup Jari untuk Teks
// ==========================================
function detectHandGesture(hand) {
  const wrist = hand.at(0);
  const thumbTip = hand.at(4);
  const indexTip = hand.at(8);
  const middleMcp = hand.at(9);
  const middleTip = hand.at(12);
  const middlePip = hand.at(10);
  const ringTip = hand.at(16);
  const ringPip = hand.at(14);
  const pinkyTip = hand.at(20);
  const pinkyPip = hand.at(18);

  const handSize =
    Math.hypot(middleMcp.x - wrist.x, middleMcp.y - wrist.y) || 0.15;

  const middleFolded = middleTip.y > middlePip.y;
  const ringFolded = ringTip.y > ringPip.y;
  const pinkyFolded = pinkyTip.y > pinkyPip.y;
  const pinchDist = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);
  const indexUp = indexTip.y < hand.at(6).y;

  if (
    middleFolded &&
    ringFolded &&
    pinkyFolded &&
    indexUp &&
    pinchDist < handSize * 0.42
  ) {
    return { shape: "saranghaeyo", spread: 1.0 };
  }

  let count = 0;
  const tipIds = [8, 12, 16, 20];
  const pipIds = [6, 10, 14, 18];

  for (let i = 0; i < 4; i++) {
    if (hand.at(tipIds[i]).y < hand.at(pipIds[i]).y) count++;
  }

  const thumbIp = hand.at(3);
  const pinkyBase = hand.at(17);
  const thumbDist = Math.hypot(
    thumbTip.x - pinkyBase.x,
    thumbTip.y - pinkyBase.y
  );
  const jointDist = Math.hypot(
    thumbIp.x - pinkyBase.x,
    thumbIp.y - pinkyBase.y
  );

  if (thumbDist > jointDist * 1.15) count++;

  if (count === 0) return { shape: "scatter", spread: 1.0 };
  if (count === 1) return { shape: "saturn", spread: 1.0 };
  if (count === 2) return { shape: "galaxy", spread: 1.0 };
  if (count === 3) return { shape: "butterfly", spread: 1.0 };

  let opennessSum = 0;
  const allTips = [4, 8, 12, 16, 20];

  for (let i = 0; i < 5; i++) {
    const tip = hand.at(allTips[i]);
    opennessSum += Math.hypot(tip.x - middleMcp.x, tip.y - middleMcp.y);
  }

  const avgOpenness = opennessSum / (5 * handSize);
  const spread =
    count === 4
      ? THREE.MathUtils.clamp(avgOpenness * 0.55, 0.45, 0.72)
      : THREE.MathUtils.clamp(avgOpenness * 1.18, 0.75, 1.32);

  return { shape: "love", spread };
}

// ==========================================
// 5. Loop Animasi Fisika Spring, Transisi Warna Dinamis, & Rotasi
// ==========================================
let targetRotX = 0.25;
let targetRotY = 0;
let handLandmarker = null;
let lastVideoTime = -1;
let isVideoReady = false;
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const elapsed = clock.getElapsedTime();

  if (handLandmarker && isVideoReady && video.currentTime !== lastVideoTime) {
    lastVideoTime = video.currentTime;
    const results = handLandmarker.detectForVideo(video, performance.now());

    if (results.landmarks && results.landmarks.length > 0) {
      const hand = results.landmarks.at(0);
      const palm = hand.at(9);
      const detected = detectHandGesture(hand);

      setShape(detected.shape);
      targetTextSpread = detected.spread;

      if (currentShapeKey === "saranghaeyo") {
        targetRotX = (palm.y - 0.5) * 0.25;
        targetRotY = (0.5 - palm.x) * 0.35;
      } else {
        targetRotY = (0.5 - palm.x) * Math.PI * 2.2;
        targetRotX = (palm.y - 0.5) * Math.PI * 1.6;
      }
    } else {
      if (currentShapeKey === "saranghaeyo") {
        targetRotX = 0;
        targetRotY = 0;
      } else {
        targetRotY += 0.006;
        targetRotX += (0.12 - targetRotX) * 0.02;
      }
      targetTextSpread = 1.05;
    }
  } else if (currentShapeKey === "saranghaeyo") {
    targetRotX = 0;
    targetRotY = 0;
  } else {
    targetRotY += 0.006;
  }

  currentTextSpread += (targetTextSpread - currentTextSpread) * 0.1;

  const posAttr = geometry.attributes.position;
  const posArr = posAttr.array;
  const colAttr = geometry.attributes.color;
  const colArr = colAttr.array;

  let targetPalette = purpleColors;
  if (currentShapeKey === "saturn") targetPalette = saturnColors;
  else if (currentShapeKey === "butterfly") targetPalette = butterflyColors;
  else if (currentShapeKey === "saranghaeyo") targetPalette = redColors;

  const spring = currentShapeKey === "scatter" ? 0.012 : 0.025;
  const damping = currentShapeKey === "scatter" ? 0.88 : 0.82;
  const driftAmp = currentShapeKey === "scatter" ? 0.015 : 0.0022;

  const isRed = currentShapeKey === "saranghaeyo";
  const heartBeat = isRed ? 1 + Math.sin(elapsed * 5.2) * 0.055 : 1;
  const activeScale =
    currentShapeKey === "love" ? currentTextSpread : heartBeat;

  for (let i = 0; i < COUNT; i++) {
    const idx = i * 3;
    const phase = phases[i];

    let tx = targetPositions[idx] * activeScale;
    let ty = targetPositions[idx + 1] * activeScale;
    let tz = targetPositions[idx + 2] * activeScale;

    if (currentShapeKey === "butterfly") {
      const flap = Math.sin(elapsed * 4.2) * 0.42;
      tz += Math.abs(tx) * flap;
    }

    if (currentShapeKey === "love") {
      tz += Math.sin(elapsed * 2.5 + tx * 0.8) * 0.09;
    }

    velocities[idx] = (velocities[idx] + (tx - posArr[idx]) * spring) * damping;
    velocities[idx + 1] =
      (velocities[idx + 1] + (ty - posArr[idx + 1]) * spring) * damping;
    velocities[idx + 2] =
      (velocities[idx + 2] + (tz - posArr[idx + 2]) * spring) * damping;

    posArr[idx] += velocities[idx] + Math.sin(elapsed * 2.2 + phase) * driftAmp;
    posArr[idx + 1] +=
      velocities[idx + 1] + Math.cos(elapsed * 1.9 + phase) * driftAmp;
    posArr[idx + 2] +=
      velocities[idx + 2] + Math.sin(elapsed * 2.5 + phase) * driftAmp;

    colArr[idx] += (targetPalette[idx] - colArr[idx]) * 0.08;
    colArr[idx + 1] += (targetPalette[idx + 1] - colArr[idx + 1]) * 0.08;
    colArr[idx + 2] += (targetPalette[idx + 2] - colArr[idx + 2]) * 0.08;
  }

  posAttr.needsUpdate = true;
  colAttr.needsUpdate = true;

  particleSystem.rotation.x += (targetRotX - particleSystem.rotation.x) * 0.08;
  particleSystem.rotation.y += (targetRotY - particleSystem.rotation.y) * 0.08;

  renderer.render(scene, camera);
}

animate();

// ==========================================
// 6. Inisialisasi Kamera & Hand Tracking AI
// ==========================================
async function initHandTracking() {
  try {
    infoText.textContent = "Menyalakan kamera...";
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;

    await new Promise((resolve) => {
      video.onloadeddata = () => {
        isVideoReady = true;
        resolve();
      };
    });

    infoText.textContent = "Memuat AI deteksi tangan...";
    const vision = await FilesetResolver.forVisionTasks("/wasm");
    const modelResponse = await fetch("/hand_landmarker.task");

    if (!modelResponse.ok) {
      throw new Error(
        "File hand_landmarker.task tidak ditemukan di folder public!"
      );
    }

    const modelBuffer = new Uint8Array(await modelResponse.arrayBuffer());
    handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetBuffer: modelBuffer,
        delegate: "GPU",
      },
      runningMode: "VIDEO",
      numHands: 1,
    });

    infoText.textContent =
      "Kepal: Hancur | 1: Planet Emas | 2: Galaksi | 3: Kupu Ungu-Pink | 4-5: I Love You | Saranghaeyo: ❤️";
  } catch (err) {
    console.error("Detail error:", err);
    const detail = err?.message || err?.name || "Gagal memuat model AI";
    infoText.textContent =
      "Info: " + detail + " (Tekan tombol 0-6 di keyboard untuk ganti gaya)";
  }
}

initHandTracking();

// ==========================================
// 7. Kontrol Keyboard & Event Resize Window
// ==========================================
window.addEventListener("keydown", (e) => {
  if (e.key === "0") setShape("scatter");
  if (e.key === "1") setShape("saturn");
  if (e.key === "2") setShape("galaxy");
  if (e.key === "3") setShape("butterfly");
  if (e.key === "4") {
    setShape("love");
    targetTextSpread = 0.55;
  }
  if (e.key === "5") {
    setShape("love");
    targetTextSpread = 1.25;
  }
  if (e.key === "6") setShape("saranghaeyo");
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});