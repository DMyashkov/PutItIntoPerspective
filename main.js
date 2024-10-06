import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js"; // For loading HDR environments

import models from "/lineup.json";
import { gsap } from "gsap";

function sleep(milliseconds) {
  const start = Date.now();
  while (Date.now() - start < milliseconds) {
    // Block the thread for the specified duration
  }
}

const SPACE_BETWEEN_MODELS = 3;
const CAMERA_FOV = 45;
const CAMERA_SPEED = 5;
const ISTHEREANIMATION = false;
const GROUND_WIDTH = 50; // Size of each ground piece
const GROUND_HEIGHT = 50; // Size of each ground piece

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true,
  logarithmicDepthBuffer: true,
});
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000);
renderer.setPixelRatio(window.devicePixelRatio);

// renderer.setPixelRatio(window.devicePixelRatio);
// renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping; // Tone mapping for better lighting

document.body.appendChild(renderer.domElement);

// Scene
const scene = new THREE.Scene();

// Ground Plane
const groundGeometry = new THREE.PlaneGeometry(
  GROUND_WIDTH * 1000,
  GROUND_HEIGHT * 1000,
); // Increase the size by a factor of 10
const groundMaterial = new THREE.MeshStandardMaterial({
  color: 0xa9a9a9,
  roughness: 1,
});
const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
groundMesh.rotation.x = -Math.PI / 2; // Rotate the plane to be horizontal
groundMesh.position.y = 0; // Set the position of the ground
scene.add(groundMesh);

// Camera
const camera = new THREE.PerspectiveCamera(
  CAMERA_FOV,
  window.innerWidth / window.innerHeight,
  1,
  100000,
);

// Resize handling
window.addEventListener("resize", () => {
  onWindowResize();
});

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Ground plane

// Update function to recycle ground planes

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

// GLTF Loader
const loader = new GLTFLoader().setPath("/");
const fontLoader = new FontLoader();
// Load grain texture
const textureLoader = new THREE.TextureLoader();
const grainTexture = textureLoader.load("textures/grain2.jpg");

// Create a cube geometry

class Model {
  constructor(name, fileName, height, characteristic, isCenterDown) {
    this.name = name;
    this.fileName = fileName;
    this.path = "";
    this.characteristic = characteristic;
    this.x = 0;
    this.y = 0;
    this.z = 0;
    this.height = height;
    this.width = 0;
    this.depth = 0;
    this.scaleFactor = 0;
    this.isCenterDown = isCenterDown;
  }
}

function calculateModelDimensions(modelAttribute) {
  return new Promise((resolve, reject) => {
    loader.load(
      modelAttribute.path,
      (gltf) => {
        const mesh = gltf.scene;
        const box = new THREE.Box3().setFromObject(mesh);
        const originalHeight = box.max.y - box.min.y;
        const originalWidth = box.max.x - box.min.x;
        const originalDepth = box.max.z - box.min.z;
        const scaleFactor = (1 / originalHeight) * modelAttribute.height;

        modelAttribute.width = originalWidth * scaleFactor;
        modelAttribute.depth = originalDepth * scaleFactor;
        modelAttribute.scaleFactor = scaleFactor;
        modelAttribute.y = modelAttribute.isCenterDown
          ? 0
          : modelAttribute.height / 2;
        modelAttribute.z = 0;
        resolve();
      },
      undefined,
      reject,
    );
  });
}

function loadModel(modelAttribute, previousModelAttribute) {
  return new Promise((resolve, reject) => {
    loader.load(
      modelAttribute.path,
      (gltf) => {
        const mesh = gltf.scene;
        mesh.scale.set(
          modelAttribute.scaleFactor,
          modelAttribute.scaleFactor,
          modelAttribute.scaleFactor,
        );

        // mesh.traverse((node) => {
        //   if (node.isMesh) {
        //     // If the material is MeshStandardMaterial, adjust its properties
        //     if (node.material && node.material.isMeshStandardMaterial) {
        //       // Reduce reflectiveness
        //       node.material.roughness = 0.6; // Increase this value to make it rougher (less shiny)
        //       node.material.metalness = 0.1; // Decrease this value to make it less metallic (lower reflections)
        //       node.material.needsUpdate = true; // Apply the changes to the material
        //     }
        //   }
        // });

        mesh.position.set(modelAttribute.x, modelAttribute.y, modelAttribute.z);

        scene.add(mesh);

        const spotlight = new THREE.SpotLight(0xffffff);
        spotlight.target = mesh; // Point the spotlight at the model

        // Set spotlight position above and slightly in front of the model
        spotlight.position.set(
          modelAttribute.x,
          modelAttribute.height * 2, // Set higher above the model
          modelAttribute.z, // Slightly in front
        );

        // Calculate the angle to uniformly cover the model's base
        spotlight.angle = Math.atan(
          modelAttribute.height / (modelAttribute.width / 2),
        );

        // Set constant intensity to ensure uniform brightness
        spotlight.intensity = modelAttribute.height ** 2 * 5; // Fixed intensity value

        // Set a large distance so that the light doesn’t dim too soon
        spotlight.distance = modelAttribute.height * 3; // Based on model size

        spotlight.penumbra = 0.3; // Slightly soft edges for natural light falloff

        // Ensure the spotlight doesn't fade out too early
        spotlight.decay = 2; // Control how fast the light dims (2 is typical for realistic lighting)
        // Optional: Add spotlight helper to visualize the light in the scene (for debugging)
        scene.add(spotlight);

        fontLoader.load("/public/roboto/Medium_Regular.json", function (font) {
          const textGeometry = new TextGeometry(modelAttribute.name, {
            font: font,
            size: modelAttribute.height / 12,
            depth: 0.03,
          });
          const boundingBox = new THREE.Box3().setFromObject(
            new THREE.Mesh(textGeometry),
          );
          const textWidth = boundingBox.max.x - boundingBox.min.x; // Width of the text
          const textHeight = boundingBox.max.y - boundingBox.min.y; // Height of the text
          const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
          const textMesh = new THREE.Mesh(textGeometry, textMaterial);
          textMesh.position.set(
            modelAttribute.x - textWidth / 2, // Center the text
            modelAttribute.height +
              +modelAttribute.height / 6 +
              textHeight / 2 +
              textHeight / 10, // Adjust Y position
            modelAttribute.z,
          );
          scene.add(textMesh);
        });

        fontLoader.load("/public/roboto/Light_Regular.json", function (font) {
          const textGeometry = new TextGeometry(
            modelAttribute.characteristic.toString(),
            {
              font: font,
              size: modelAttribute.height / 15,
              depth: 0.01,
            },
          );
          const boundingBox = new THREE.Box3().setFromObject(
            new THREE.Mesh(textGeometry),
          );
          const textWidth = boundingBox.max.x - boundingBox.min.x; // Width of the text
          const textHeight = boundingBox.max.y - boundingBox.min.y; // Height of the text
          const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
          const textMesh = new THREE.Mesh(textGeometry, textMaterial);
          textMesh.position.set(
            modelAttribute.x - textWidth / 2, // Center the text
            modelAttribute.height +
              modelAttribute.height / 6 -
              textHeight / 2 -
              textHeight / 10, // Adjust Y position
            modelAttribute.z,
          );
          scene.add(textMesh);
        });

        resolve(); // Resolve the promise when the model is loaded
      },
      undefined,
      reject,
    );
  });
}

let modelAttributes = [];

function createModelAttributes(models) {
  modelAttributes = [];

  for (let i = 0; i < models.length; i++) {
    const modelAttribute = new Model(
      models[i].name,
      models[i].fileName,
      models[i].height,
      models[i].characteristic,
      models[i].isCenterDown,
    );
    modelAttribute.path = `${modelAttribute.fileName}/${modelAttribute.fileName}.gltf`;
    modelAttributes.push(modelAttribute);
  }

  const dimensionPromises = [];
  for (let i = 0; i < modelAttributes.length; i++) {
    dimensionPromises.push(calculateModelDimensions(modelAttributes[i]));
  }

  Promise.all(dimensionPromises).then(() => {
    const modelPromises = [];
    for (let i = 0; i < modelAttributes.length; i++) {
      modelAttributes[i].x =
        i > 0
          ? modelAttributes[i - 1].x +
            modelAttributes[i - 1].width / 2 +
            modelAttributes[i].width / 2 +
            (modelAttributes[i].width + modelAttributes[i - 1].width) / 2 / 4
          : 0;
    }
    for (let i = 0; i < modelAttributes.length; i++) {
      modelPromises.push(
        loadModel(modelAttributes[i], i != 0 ? modelAttributes[i - 1] : null),
      );
    }

    // Use Promise.all to wait for all models to be loaded
    Promise.all(modelPromises)
      .then(() => {
        console.log("All models are loaded");
        console.log("Model Attributes:", modelAttributes);
        // Now create camera positions and start the animation
        const cameraHopPositions = createCameraHopPositions(modelAttributes);
        camera.position.set(
          cameraHopPositions[0].x,
          cameraHopPositions[0].y,
          cameraHopPositions[0].z,
        );
        if (ISTHEREANIMATION) {
          startWalking(modelAttributes, cameraHopPositions);
        }
      })
      .catch((error) => {
        console.error("Error loading models:", error);
      });
  });
}

function createCameraHopPositions(modelAttributes) {
  const cameraHopPositions = [];
  modelAttributes.forEach((model) => {
    const calculatedZ =
      (12 / 5) *
      (Math.max(model.height, model.width) /
        Math.tan((CAMERA_FOV / 0.9) * (Math.PI / 180)));

    cameraHopPositions.push({
      x: model.x,
      y: ((5.5 / 5) * model.height) / 2,
      z: calculatedZ,
    });
  });
  return cameraHopPositions;
}

function startWalking(modelAttributes, cameraHopPositions) {
  const tl = gsap.timeline();
  for (let i = 0; i < cameraHopPositions.length; i++) {
    const cameraPos = cameraHopPositions[i];
    const modelAttribute = modelAttributes[i];

    const ratio =
      i > 0 ? modelAttribute.height / modelAttributes[i - 1].height : 1;

    tl.to(camera.position, {
      duration: 0.2 * ((ratio * 5) / CAMERA_SPEED) + 0.8 * 2,
      x: cameraPos.x,
      y: cameraPos.y,
      z: cameraPos.z,
    });
  }
}

function animate() {
  requestAnimationFrame(animate);
  // cubeCamera.update(renderer, scene);
  renderer.render(scene, camera);
  // console.log("Camera Position:", camera.position);
}

animate();
createModelAttributes(models);
