
import * as THREE from 'three';
import { startHandTracking } from './handTracking.js';
// Membuat dunia 3D
const scene = new THREE.Scene();


// Membuat kamera
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

camera.position.z = 4;

// Membuat renderer
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true
});

renderer.setClearColor(0x000000, 0);

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

document.querySelector('#scene').appendChild(renderer.domElement);

// Membuat kubus
const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);

const material = new THREE.MeshStandardMaterial({
  color: 0x4f8cff,
  metalness: 0.3,
  roughness: 0.25
});

const cube = new THREE.Mesh(geometry, material);
cube.scale.set(0.7, 0.7, 0.7);
scene.add(cube);


const particleCount = 350;
const particlePositions = new Float32Array(particleCount * 3);
const particleVelocities = [];

for (let i = 0; i < particleCount; i++) {
  particlePositions[i * 3] = 0;
  particlePositions[i * 3 + 1] = 0;
  particlePositions[i * 3 + 2] = 0;

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
let wasFist = false;

function explodeCube() {
  if (isExploding) return;

  isExploding = true;
  explosionTime = 1.2;

  const positions = particles.geometry.attributes.position;

  for (let i = 0; i < particleCount; i++) {
    // Mulai dari posisi kubus
    positions.setXYZ(
      i,
      cube.position.x + (Math.random() - 0.5) * 0.4,
      cube.position.y + (Math.random() - 0.5) * 0.4,
      cube.position.z + (Math.random() - 0.5) * 0.4
    );

    // Arah partikel menyebar secara acak
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


// Memberi pencahayaan
const light = new THREE.DirectionalLight(0xffffff, 3);
light.position.set(3, 4, 5);
scene.add(light);

scene.add(new THREE.AmbientLight(0xffffff, 1));

// Animasi kubus


let targetX = 0;
let targetY = 0;
let floatTime = 0;

// Animasi kubus
function animate() {
  requestAnimationFrame(animate);
  
  // Animasi partikel saat kubus hancur
  if (isExploding) {
    const positions = particles.geometry.attributes.position;

    for (let i = 0; i < particleCount; i++) {
      positions.setXYZ(
        i,
        positions.getX(i) + particleVelocities[i].x * 0.016,
        positions.getY(i) + particleVelocities[i].y * 0.016,
        positions.getZ(i) + particleVelocities[i].z * 0.016
      );

      // Perlahan memperlambat partikel
      particleVelocities[i].multiplyScalar(0.98);
    }

    positions.needsUpdate = true;

    // Partikel memudar
    explosionTime -= 0.016;
    particleMaterial.opacity = Math.max(0, explosionTime / 1.2);

    // Tampilkan kubus kembali setelah efek selesai
    if (explosionTime <= 0) {
      isExploding = false;
      particles.visible = false;
      particleMaterial.opacity = 0;
      cube.visible = true;
    }
  }


  // Gerakan kubus menjadi lebih halus
 floatTime += 0.03;

// Gerakan mengikuti tangan dengan halus
cube.position.x += (targetX - cube.position.x) * 0.15;
cube.position.y += (targetY - cube.position.y) * 0.15;

// Efek melayang naik-turun
if (!isExploding) {
  cube.position.y += Math.sin(floatTime) * 0.003;
}

  cube.rotation.x += 0.005;
  cube.rotation.y += 0.01;

  renderer.render(scene, camera);
}
animate();


// Kubus mengikuti posisi mouse
window.addEventListener('pointermove', (event) => {
  const x = (event.clientX / window.innerWidth) * 2 - 1;
  const y = (event.clientY / window.innerHeight) * 2 - 1;

  cube.position.x = x * 1.5;
  cube.position.y = -y * 1.5;
});
const startButton = document.querySelector('#start-camera');
const handStatus = document.querySelector('#hand-status');

startButton.addEventListener('click', async () => {
  startButton.disabled = true;
  handStatus.textContent = 'Memuat deteksi tangan...';

  try {
   
await startHandTracking((result) => {
  const detected =
    result.landmarks && result.landmarks.length > 0;

  handStatus.textContent = detected
    ? `Tangan terdeteksi: ${result.landmarks.length}`
    : 'Belum ada tangan terdeteksi';

  if (detected) {
    // Titik tengah telapak tangan
   const hand = result.landmarks[0];
   
    // Cek apakah jari-jari terlipat
   
const fingerTips = [8, 12, 16, 20];
const fingerPips = [6, 10, 14, 18];

let foldedFingers = 0;

// Gunakan jarak ujung jari terhadap pangkalnya
for (let i = 0; i < fingerTips.length; i++) {
  const tip = hand[fingerTips[i]];
  const pip = hand[fingerPips[i]];

  const distance = Math.hypot(
    tip.x - hand[0].x,
    tip.y - hand[0].y
  );

  const pipDistance = Math.hypot(
    pip.x - hand[0].x,
    pip.y - hand[0].y
  );

  if (distance < pipDistance * 0.85) {
    foldedFingers++;
  }
}

// Minimal 4 jari harus terlipat
const isFist = foldedFingers >= 4;

if (isFist && !wasFist && !isExploding) {
  explodeCube();
}

wasFist = isFist;


// Perkirakan titik tengah telapak tangan
const palmX = (hand[0].x + hand[9].x) / 2;
const palmY = (hand[0].y + hand[9].y) / 2;

// Ikuti posisi tangan dan naikkan kubus sedikit
targetX = (0.5 - palmX) * 4.5;
targetY = (0.5 - palmY) * 3.5 + 0.2;
  }
});


    handStatus.textContent = 'Kamera aktif — tunjukkan tanganmu';
  } catch (error) {
    console.error(error);
    handStatus.textContent =
      'Gagal mengaktifkan kamera. Periksa izin kamera dan koneksi internet.';
    startButton.disabled = false;
  }
});
