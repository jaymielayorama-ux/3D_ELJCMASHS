import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

/*
  ELJ 3D CAMPUS — JAVASCRIPT

  IMPORTANT:
  1. Put your model in: models/elj-campus.glb
  2. Keep the filename exactly "elj-campus.glb"
  3. If your model has separate objects named Main_Building, Library,
     Theater, and Media_Laboratory, we can later make the actual buildings
     clickable. For now, the location cards open information panels.
*/

const MODEL_PATH = "./models/elj-campus.glb";

const canvasWrap = document.getElementById("canvas-wrap");
const loading = document.getElementById("loading");
const resetViewButton = document.getElementById("resetView");
const locationDialog = document.getElementById("locationDialog");
const closeDialog = document.getElementById("closeDialog");
const dialogTitle = document.getElementById("dialogTitle");
const dialogBody = document.getElementById("dialogBody");

const scene = new THREE.Scene();
scene.background = new THREE.Color("#f6f8fa");

const camera = new THREE.PerspectiveCamera(
  45,
  canvasWrap.clientWidth / canvasWrap.clientHeight,
  0.1,
  5000
);

camera.position.set(18, 14, 22);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: false
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(canvasWrap.clientWidth, canvasWrap.clientHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
canvasWrap.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.minDistance = 2;
controls.maxDistance = 200;
controls.target.set(0, 0, 0);

/* Lighting */
scene.add(new THREE.HemisphereLight(0xffffff, 0xcbd3da, 2.2));

const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
keyLight.position.set(12, 25, 14);
keyLight.castShadow = true;
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0x9cc8ff, 1.0);
fillLight.position.set(-15, 10, -10);
scene.add(fillLight);

/* Ground plane to help the model feel grounded */
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(300, 300),
  new THREE.MeshStandardMaterial({
    color: 0xf0f3f5,
    roughness: 1,
    metalness: 0
  })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.02;
ground.receiveShadow = true;
scene.add(ground);

/* Optional presentation accents: three subtle colored rings */
function addAccentRing(radius, color, x, z) {
  const geometry = new THREE.RingGeometry(radius - 0.04, radius, 64);
  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.75,
    side: THREE.DoubleSide
  });
  const ring = new THREE.Mesh(geometry, material);
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(x, 0.01, z);
  scene.add(ring);
}

addAccentRing(1.6, 0xc81e2b, -4, -2);
addAccentRing(1.3, 0x138a54, 3, 2);
addAccentRing(1.0, 0x1e5aa8, 6, -4);

const loader = new GLTFLoader();
let campusModel = null;
let defaultCameraPosition = camera.position.clone();
let defaultTarget = controls.target.clone();

/* Load the actual school model */
loader.load(
  MODEL_PATH,
  (gltf) => {
    campusModel = gltf.scene;

    campusModel.traverse((object) => {
      if (object.isMesh) {
        object.castShadow = true;
        object.receiveShadow = true;

        if (object.material) {
          object.material.needsUpdate = true;
        }
      }
    });

    /*
      Automatically frame any size model.
      This means you don't need to know the model's dimensions.
    */
    const box = new THREE.Box3().setFromObject(campusModel);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    campusModel.position.sub(center);
    campusModel.position.y -= box.min.y - 0.05;

    scene.add(campusModel);

    const maxDimension = Math.max(size.x, size.y, size.z);
    const distance = Math.max(maxDimension * 1.35, 8);

    camera.position.set(distance, distance * 0.72, distance);
    controls.target.set(0, size.y * 0.30, 0);
    controls.minDistance = Math.max(maxDimension * 0.12, 1);
    controls.maxDistance = Math.max(maxDimension * 6, 80);

    defaultCameraPosition = camera.position.clone();
    defaultTarget = controls.target.clone();

    loading.style.display = "none";
  },
  (progress) => {
    if (progress.total) {
      const percent = Math.round((progress.loaded / progress.total) * 100);
      loading.querySelector("p").textContent = `Loading ELJ campus… ${percent}%`;
    }
  },
  (error) => {
    console.error("Could not load the GLB model:", error);

    loading.innerHTML = `
      <div style="max-width: 360px; padding: 24px;">
        <strong style="display:block; margin-bottom:8px;">3D model not found yet.</strong>
        <p>
          Put your school model here:
          <br><code>models/elj-campus.glb</code>
        </p>
        <p style="font-size:.82rem;">
          The website itself is working. Once the GLB file is added,
          the model will appear here.
        </p>
      </div>
    `;
  }
);

/* Reset camera */
resetViewButton.addEventListener("click", () => {
  camera.position.copy(defaultCameraPosition);
  controls.target.copy(defaultTarget);
  controls.update();
});

/* Campus location content — replace this with your researched information */
const locations = {
  main: {
    title: "Main Building",
    body: `
      <p>The central area of the ELJ campus. Replace this paragraph with your verified description of the building, its functions, and notable spaces.</p>
      <div class="tag-row">
        <span class="tag">Campus</span>
        <span class="tag">Orientation</span>
      </div>
    `
  },
  library: {
    title: "Library",
    body: `
      <p>A learning and study space for students. Add your own photographs, historical information, room details, or student stories here.</p>
      <div class="tag-row">
        <span class="tag">Learning</span>
        <span class="tag">Study Space</span>
      </div>
    `
  },
  theater: {
    title: "Theater",
    body: `
      <p>A space for performance, production, and collaborative creative work. Replace this with accurate information about the ELJ theater and its activities.</p>
      <div class="tag-row">
        <span class="tag">Performance</span>
        <span class="tag">Arts</span>
      </div>
    `
  },
  media: {
    title: "Media Laboratory",
    body: `
      <p>A production-oriented space for media arts activities. Add details about the equipment, classes, and student projects connected to this location.</p>
      <div class="tag-row">
        <span class="tag">Media Arts</span>
        <span class="tag">Production</span>
      </div>
    `
  }
};

document.querySelectorAll(".location-card").forEach((card) => {
  card.addEventListener("click", () => {
    const key = card.dataset.location;
    const location = locations[key];

    if (!location) return;

    dialogTitle.textContent = location.title;
    dialogBody.innerHTML = location.body;

    if (typeof locationDialog.showModal === "function") {
      locationDialog.showModal();
    } else {
      locationDialog.setAttribute("open", "");
    }
  });
});

closeDialog.addEventListener("click", () => {
  locationDialog.close();
});

locationDialog.addEventListener("click", (event) => {
  const rect = locationDialog.getBoundingClientRect();

  const inside =
    event.clientX >= rect.left &&
    event.clientX <= rect.right &&
    event.clientY >= rect.top &&
    event.clientY <= rect.bottom;

  if (!inside) {
    locationDialog.close();
  }
});

/* Responsive renderer */
function onResize() {
  const width = canvasWrap.clientWidth;
  const height = canvasWrap.clientHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

window.addEventListener("resize", onResize);

/* Render loop */
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

animate();
