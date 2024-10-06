import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import {
  createSpotlight,
  setPositionAndScale,
  calculateModelDimensions,
  generateDescription,
} from "./loadingSpecifics";

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

function loadModel(modelAttribute) {
  return new Promise((resolve, reject) => {
    if (modelAttribute.path == "cube") {
      const cube = new THREE.Mesh(
        new THREE.BoxGeometry(
          modelAttribute.width,
          modelAttribute.height,
          modelAttribute.depth,
        ),
        new THREE.MeshStandardMaterial({
          map: grainTexture,
          color: 0xade8f4,
        }),
      );
      cube.position.set(modelAttribute.x, modelAttribute.y, modelAttribute.z);
      scene.add(cube);
      createSpotlight(scene, modelAttribute, cube);
      generateDescription(scene, fontLoader, modelAttribute);
      resolve();
      return;
    } else {
      loader.load(
        modelAttribute.path,
        (gltf) => {
          const mesh = gltf.scene;
          setPositionAndScale(modelAttribute, mesh);
          scene.add(mesh);
          createSpotlight(scene, modelAttribute, mesh);
          generateDescription(scene, fontLoader, modelAttribute);

          resolve(); // Resolve the promise when the model is loaded
        },
        undefined,
        reject,
      );
    }
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
    if (models[i].fileName == "cube") {
      modelAttribute.path = "cube";
    } else {
      modelAttribute.path = `${modelAttribute.fileName}/${modelAttribute.fileName}.gltf`;
    }
    modelAttributes.push(modelAttribute);
  }

  const dimensionPromises = [];
  for (let i = 0; i < modelAttributes.length; i++) {
    dimensionPromises.push(
      calculateModelDimensions(loader, modelAttributes[i]),
    );
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
