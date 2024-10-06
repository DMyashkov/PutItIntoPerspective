import * as THREE from "three";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";

export function calculateModelDimensions(loader, modelAttribute) {
  if (modelAttribute.path == "cube") {
    modelAttribute.width = modelAttribute.height;
    modelAttribute.depth = modelAttribute.height;
    modelAttribute.scaleFactor = 1;
    modelAttribute.y = modelAttribute.isCenterDown
      ? 0
      : modelAttribute.height / 2;
    modelAttribute.z = 0;
    return Promise.resolve();
  } else {
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
      );
    });
  }
}

export function generateDescription(scene, fontLoader, modelAttribute) {
  console.log(`Generating description for model ${modelAttribute.name}`);
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
    console.log(
      `Position of text for ${modelAttribute.name}: ${textMesh.position.x}, ${textMesh.position.y}, ${textMesh.position.z}`,
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
}

export function createSpotlight(scene, modelAttribute, mesh) {
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
}

export function setPositionAndScale(modelAttribute, mesh) {
  mesh.scale.set(
    modelAttribute.scaleFactor,
    modelAttribute.scaleFactor,
    modelAttribute.scaleFactor,
  );

  mesh.position.set(modelAttribute.x, modelAttribute.y, modelAttribute.z);
}
