// Import the necessary Three.js components
import * as THREE from "three";

// Set up the scene
var scene = new THREE.Scene();

// Set up the camera
var camera = new THREE.PerspectiveCamera(
  75, // Field of view
  window.innerWidth / window.innerHeight, // Aspect ratio
  0.1, // Near clipping plane
  1000, // Far clipping plane
);
camera.position.z = 1000;

// Set up the renderer
var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Create an array to store the star positions
var stars = new Array(0);
for (var i = 0; i < 10000; i++) {
  let x = THREE.MathUtils.randFloatSpread(2000);
  let y = THREE.MathUtils.randFloatSpread(2000);
  let z = THREE.MathUtils.randFloatSpread(2000);
  stars.push(x, y, z);
}

// Create the geometry to hold the star positions
var starsGeometry = new THREE.BufferGeometry();
starsGeometry.setAttribute(
  "position",
  new THREE.Float32BufferAttribute(stars, 3),
);

// Create the material for the stars
var starsMaterial = new THREE.PointsMaterial({ color: 0x888888 });

// Create the star field and add it to the scene
var starField = new THREE.Points(starsGeometry, starsMaterial);
scene.add(starField);

// Create the animation loop
function animate() {
  requestAnimationFrame(animate);

  // Rotate the star field for some motion
  starField.rotation.x += 0.001;
  starField.rotation.y += 0.002;

  renderer.render(scene, camera);
}

// Start the animation loop
animate();

// Update the renderer and camera aspect ratio when the window is resized
window.addEventListener("resize", function () {
  var width = window.innerWidth;
  var height = window.innerHeight;
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
});
