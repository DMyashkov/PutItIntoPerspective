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
const ISTHEREANIMATION = true;
const GROUND_WIDTH = 50; // Size of each ground piece
const GROUND_HEIGHT = 50; // Size of each ground piece
const GROUND_COUNT = 5; // Number of ground pieces for illusion of infinity
const GROUND_SPACING = GROUND_WIDTH; // Space between ground pieces

const renderer = new THREE.WebGLRenderer({ antialias: true });
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

// Camera
const camera = new THREE.PerspectiveCamera(
  CAMERA_FOV,
  window.innerWidth / window.innerHeight,
  1,
  1000,
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
const groundMaterial = new THREE.MeshPhysicalMaterial({
  color: 0x555555,
  metalness: 0.2,
});

const groundGroup = new THREE.Group();

for (let i = 0; i < GROUND_COUNT; i++) {
  const groundGeometry = new THREE.PlaneGeometry(
    GROUND_WIDTH,
    GROUND_HEIGHT,
    32,
    32,
  );
  groundGeometry.rotateX(-Math.PI / 2);

  const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
  groundMesh.position.set(i * GROUND_SPACING, 0, 0); // Position each plane along the x-axis
  groundGroup.add(groundMesh);
}

scene.add(groundGroup);

// Update function to recycle ground planes
function updateGround() {
  groundGroup.children.forEach((groundMesh, index) => {
    // Move the ground pieces to the left
    groundMesh.position.x -= 0.1; // Adjust this value to change the speed

    // Check if the ground piece is out of view and reposition it
    if (groundMesh.position.x < -GROUND_WIDTH) {
      groundMesh.position.x += GROUND_COUNT * GROUND_SPACING; // Recycle to the end
    }
  });
}

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const spotLight = new THREE.SpotLight(0xffffff, 150, 100, 0.5, 0.2);
spotLight.position.set(0, 10, 0);
scene.add(spotLight);

// GLTF Loader
const loader = new GLTFLoader().setPath("/");
const fontLoader = new FontLoader();

class Model {
  constructor(name, height) {
    this.name = name;
    this.path = "";
    this.x = 0;
    this.y = 0;
    this.z = 0;
    this.height = height;
    this.width = 0;
    this.depth = 0;
    this.scaleFactor = 0;
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
        modelAttribute.y = modelAttribute.height / 2;
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
        console.log(
          "xyz ",
          modelAttribute.x,
          modelAttribute.y,
          modelAttribute.z,
        );

        mesh.position.set(modelAttribute.x, modelAttribute.y, modelAttribute.z);
        scene.add(mesh);

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
            modelAttribute.y +
              modelAttribute.height / 2 +
              textHeight +
              textHeight / 10 +
              textHeight / 2 +
              textHeight / 10, // Adjust Y position
            modelAttribute.z,
          );
          scene.add(textMesh);
        });

        fontLoader.load("/public/roboto/Light_Regular.json", function (font) {
          const textGeometry = new TextGeometry(
            modelAttribute.height.toString() + "kg",
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
            modelAttribute.y +
              modelAttribute.height / 2 +
              textHeight +
              textHeight / 10 -
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
    const modelAttribute = new Model(models[i].name, models[i].height);
    modelAttribute.path = `${modelAttribute.name}/${modelAttribute.name}.gltf`;
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
            SPACE_BETWEEN_MODELS
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
      (7 / 5) *
      (model.depth / 2 +
        Math.max(model.height, model.width) /
          Math.tan((CAMERA_FOV / 0.9) * (Math.PI / 180)));

    cameraHopPositions.push({
      x: model.x,
      y: (5.5 / 5) * model.y,
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
      duration: (ratio * 5) / CAMERA_SPEED,
      x: cameraPos.x,
      y: cameraPos.y,
      z: cameraPos.z,
      // ease: "power2.out",
    });
  }
}

function animate() {
  requestAnimationFrame(animate);
  // cubeCamera.update(renderer, scene);
  updateGround();
  renderer.render(scene, camera);
  // console.log("Camera Position:", camera.position);
}

animate();
createModelAttributes(models);
