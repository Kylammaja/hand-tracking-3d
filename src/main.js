
import * as THREE from 'three';
import { startHandTracking } from './handTracking.js';

// =========================
// DUNIA 3D DAN KAMERA
// =========================

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

camera.position.z = 4;

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true
});

renderer.setClearColor(0x000000, 0);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

document.querySelector('#scene').appendChild(renderer.domElement);

// =========================
// KUBUS 3D
// =========================

const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);

const material = new THREE.MeshStandardMaterial({
  color: 0x168cff,
  emissive: 0x064cff,
  emissiveIntensity: 1.5,
  metalness: 0.5,
  roughness: 0.2
});

const cube = new THREE.Mesh(geometry, material);
cube.scale.setScalar(1);
scene.add(cube);

// Garis neon kubus
const edgesGeometry = new THREE.EdgesGeometry(geometry);

const edgesMaterial = new THREE.LineBasicMaterial({
  color: 0x00eaff,
  transparent: true,
  opacity: 0.9
});

const cubeEdges = new THREE.LineSegments(
  edgesGeometry,
  edgesMaterial
);

cube.add(cubeEdges);

// =========================
// PARTIKEL ORBIT
// =========================

const orbitCount = 100;
const orbitPositions = new Float32Array(orbitCount * 3);

for (let i = 0; i < orbitCount; i++) {
  const angle = Math.random() * Math.PI * 2;
  const radius = 1.4 + Math.random() * 0.8;

  orbitPositions[i * 3] = Math.cos(angle) * radius;
  orbitPositions[i * 3 + 1] = (Math.random() - 0.5) * 2.5;
  orbitPositions[i * 3 + 2] = Math.sin(angle) * radius;
}

const orbitGeometry = new THREE.BufferGeometry();

orbitGeometry.setAttribute(
  'position',
  new THREE.BufferAttribute(orbitPositions, 3)
);

const orbitMaterial = new THREE.PointsMaterial({
  color: 0x00eaff,
  size: 0.035,
  transparent: true,
  opacity: 0.8,
  blending: THREE.AdditiveBlending
});

const orbitParticles = new THREE.Points(
  orbitGeometry,
  orbitMaterial
);

cube.add(orbitParticles);

// =========================
// PARTIKEL EFEK HANCUR
// =========================

const particleCount = 350;
const particlePositions = new Float32Array(particleCount * 3);
const particleVelocities = [];

for (let i = 0; i < particleCount; i++) {
  particleVelocities.push(new THREE.Vector3());
}

const particleGeometry = new THREE.BufferGeometry();

particleGeometry.setAttribute(
  'position',
  new THREE.BufferAttribute(particlePositions, 3)
);

const particleMaterial = new THREE.PointsMaterial({
  color: 0xb8c7d9,
  size: 0.035,
  transparent: true,
  opacity: 0,
  blending: THREE.AdditiveBlending,
  depthWrite: false
});

const particles = new THREE.Points(
  particleGeometry,
  particleMaterial
);

scene.add(particles);
particles.visible = false;

let isExploding = false;
let explosionTime = 0;
let fistFrames = 0;
let wasFist = false;

// =========================
// VARIABEL KONTROL
// =========================

let targetX = 0;
let targetY = 0;
let targetScale = 1;
let targetRotationY = 0;

let floatTime = 0;
let resizeMode = false;
let lastFingerDistance = null;

const handStatus = document.querySelector('#hand-status');

// =========================
// LEDAKAN KUBUS
// =========================

function explodeCube() {
  if (isExploding || !cube.visible) return;

  isExploding = true;
  explosionTime = 1.2;

  const positions = particles.geometry.attributes.position;

  for (let i = 0; i < particleCount; i++) {
    positions.setXYZ(
      i,
      cube.position.x + (Math.random() - 0.5) * 0.4,
      cube.position.y + (Math.random() - 0.5) * 0.4,
      cube.position.z + (Math.random() - 0.5) * 0.4
    );

    particleVelocities[i].set(
      (Math.random() - 0.5) * 5,
      (Math.random() - 0.5) * 5,
      (Math.random() - 0.5) * 3
    );
  }

  positions.needsUpdate = true;
  particleMaterial.opacity = 1;
  particles.visible = true;
  cube.visible = false;
}

// =========================
// KUBUS MUNCUL KEMBALI
// =========================

function restoreCube() {
  isExploding = false;
  explosionTime = 0;

  particles.visible = false;
  particleMaterial.opacity = 0;

  cube.visible = true;

  fistFrames = 0;
  wasFist = false;
  resizeMode = false;
  lastFingerDistance = null;

  handStatus.textContent = 'Kubus muncul kembali';
}

// =========================
// PENCAHAYAAN
// =========================

const light = new THREE.DirectionalLight(0xffffff, 3);
light.position.set(3, 4, 5);
scene.add(light);

scene.add(new THREE.AmbientLight(0xffffff, 1));

// =========================
// TOMBOL RESET
// =========================

const resetButton = document.querySelector('#reset-cube');

resetButton.addEventListener('click', () => {
  targetX = 0;
  targetY = 0;
  targetScale = 1;
  targetRotationY = 0;

  cube.visible = true;
  cube.position.set(0, 0, 0);
  cube.rotation.set(0, 0, 0);
  cube.scale.setScalar(1);

  isExploding = false;
  explosionTime = 0;
  particles.visible = false;
  particleMaterial.opacity = 0;

  fistFrames = 0;
  wasFist = false;
  resizeMode = false;
  lastFingerDistance = null;

  handStatus.textContent = 'Kubus berhasil direset';
});

// =========================
// ANIMASI
// =========================

function animate() {
  requestAnimationFrame(animate);

  orbitParticles.rotation.y += 0.008;
  orbitParticles.rotation.x += 0.002;

  // Animasi ledakan
  if (isExploding) {
    const positions = particles.geometry.attributes.position;

    for (let i = 0; i < particleCount; i++) {
      positions.setXYZ(
        i,
        positions.getX(i) + particleVelocities[i].x * 0.016,
        positions.getY(i) + particleVelocities[i].y * 0.016,
        positions.getZ(i) + particleVelocities[i].z * 0.016
      );

      particleVelocities[i].multiplyScalar(0.98);
    }

    positions.needsUpdate = true;

    explosionTime -= 0.016;

    particleMaterial.opacity = Math.max(
      0,
      explosionTime / 1.2
    );

    // Partikel selesai, kubus tetap tersembunyi
    if (explosionTime <= 0) {
      isExploding = false;
      particles.visible = false;
      particleMaterial.opacity = 0;
    }
  }

  floatTime += 0.03;

  // Garis neon berdenyut
  const pulse = 1 + Math.sin(floatTime * 2) * 0.04;
  cubeEdges.scale.setScalar(pulse);

  cubeEdges.material.color.setHSL(
    (floatTime * 0.08) % 1,
    1,
    0.6
  );

  // Posisi kubus mengikuti tangan
  cube.position.x += (targetX - cube.position.x) * 0.3;
  cube.position.y += (targetY - cube.position.y) * 0.3;

  // Ukuran kubus
  if (!isExploding) {
    cube.scale.x += (targetScale - cube.scale.x) * 0.15;
    cube.scale.y += (targetScale - cube.scale.y) * 0.15;
    cube.scale.z += (targetScale - cube.scale.z) * 0.15;

    cube.position.y += Math.sin(floatTime) * 0.003;
  }

  // Rotasi mengikuti tangan
  cube.rotation.y +=
    (targetRotationY - cube.rotation.y) * 0.08;

  renderer.render(scene, camera);
}

animate();

// =========================
// RESPONSIVE LAYAR
// =========================

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(
    window.innerWidth,
    window.innerHeight
  );

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// =========================
// KAMERA DAN DETEKSI TANGAN
// =========================

const startButton = document.querySelector('#start-camera');

startButton.addEventListener('click', async () => {
  startButton.disabled = true;
  handStatus.textContent = 'Memuat deteksi tangan...';

  try {
    await startHandTracking((result) => {
      const detected =
        result.landmarks && result.landmarks.length > 0;

      if (!detected) {
        handStatus.textContent = 'Belum ada tangan terdeteksi';

        resizeMode = false;
        lastFingerDistance = null;
        fistFrames = 0;
        wasFist = false;

        return;
      }

      handStatus.textContent =
        `Tangan terdeteksi: ${result.landmarks.length}`;

      const hand = result.landmarks[0];

      // =========================
      // KONTROL UKURAN
      // =========================

      const thumbTip = hand[4];
      const indexTip = hand[8];

      const fingerDistance = Math.hypot(
        thumbTip.x - indexTip.x,
        thumbTip.y - indexTip.y
      );

      if (!resizeMode && fingerDistance < 0.12) {
        resizeMode = true;
        lastFingerDistance = fingerDistance;
      }

      if (resizeMode) {
        if (fingerDistance > 0.24) {
          resizeMode = false;
          lastFingerDistance = null;
        } else if (lastFingerDistance !== null) {
          const scaleChange =
            fingerDistance - lastFingerDistance;

          if (Math.abs(scaleChange) > 0.0008) {
            targetScale = Math.max(
              0.4,
              Math.min(
                1.8,
                targetScale + scaleChange * 6
              )
            );

            lastFingerDistance = fingerDistance;
          }
        }
      }

      // =========================
      // DETEKSI GESTUR
      // =========================

      const fingerTips = [8, 12, 16, 20];
      const fingerPips = [6, 10, 14, 18];

      let foldedFingers = 0;

      for (let i = 0; i < fingerTips.length; i++) {
        const tip = hand[fingerTips[i]];
        const pip = hand[fingerPips[i]];

        const tipDistance = Math.hypot(
          tip.x - hand[0].x,
          tip.y - hand[0].y
        );

        const pipDistance = Math.hypot(
          pip.x - hand[0].x,
          pip.y - hand[0].y
        );

        if (tipDistance < pipDistance * 0.7) {
          foldedFingers++;
        }
      }

      const isFist = foldedFingers >= 4;
      const isOpenHand = foldedFingers <= 1;

      // Telapak terbuka memunculkan kubus
      if (isOpenHand && !cube.visible && !isExploding) {
        restoreCube();
      }

      // Kepalan perlu terdeteksi beberapa frame
      if (isFist) {
        fistFrames++;
      } else {
        fistFrames = 0;
        wasFist = false;
      }

      // Ledakan hanya sekali selama satu kepalan
      if (
        fistFrames >= 5 &&
        !wasFist &&
        !isExploding &&
        cube.visible
      ) {
        explodeCube();
        wasFist = true;
      }

      // =========================
      // POSISI TELAPAK TANGAN
      // =========================

      const palmX = (
        hand[0].x +
        hand[5].x +
        hand[9].x +
        hand[13].x +
        hand[17].x
      ) / 5;

      const palmY = (
        hand[0].y +
        hand[5].y +
        hand[9].y +
        hand[13].y +
        hand[17].y
      ) / 5;

      const newTargetX = (0.5 - palmX) * 3.5;

      targetRotationY = (palmX - 0.5) * Math.PI * 2;

      const newTargetY = (0.5 - palmY) * 2.8 + 0.2;

      targetX += (newTargetX - targetX) * 0.35;
      targetY += (newTargetY - targetY) * 0.35;
    });

    handStatus.textContent =
      'Kamera aktif — tunjukkan tanganmu';
  } catch (error) {
    console.error(error);

    handStatus.textContent =
      'Gagal mengaktifkan kamera. Periksa izin kamera dan koneksi internet.';

    startButton.disabled = false;
  }
});
