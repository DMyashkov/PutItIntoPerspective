import * as THREE from "three";

// Create scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Load grain texture
const textureLoader = new THREE.TextureLoader();
const grainTexture = textureLoader.load("textures/grain.jpg");

// Create a cube geometry
const geometry = new THREE.BoxGeometry();

// Create material with grain texture and tint color
const material = new THREE.MeshStandardMaterial({
  map: grainTexture,
  color: 0x008080, // Tint color (you can change this to any color)
});

// Create the cube
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// Position camera
camera.position.z = 5;

// Lighting (optional for better material shading)
const ambientLight = new THREE.AmbientLight(0xffffff, 1000);
scene.add(ambientLight);
const pointLight = new THREE.PointLight(0xffffff, 1);
pointLight.position.set(10, 10, 10);
scene.add(pointLight);

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;
  renderer.render(scene, camera);
}
animate();
