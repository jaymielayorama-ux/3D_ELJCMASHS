import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const MODEL_PATH = "./model/ELJ-MODEL.glb";

const showPageLoader = (message = "Loading...") => {
  if (typeof document === "undefined") return;

  let loader = document.getElementById("siteLoader");
  if (!loader) {
    loader = document.createElement("div");
    loader.id = "siteLoader";
    loader.className = "page-loader";
    loader.innerHTML = `
      <div class="page-loader__card">
        <span class="page-loader__spinner"></span>
        <span class="page-loader__text">${message}</span>
      </div>
    `;
    document.body.appendChild(loader);
  } else {
    const text = loader.querySelector(".page-loader__text");
    if (text) text.textContent = message;
    loader.classList.remove("is-hidden");
  }
};

const hidePageLoader = () => {
  if (typeof document === "undefined") return;
  const loader = document.getElementById("siteLoader");
  if (loader) loader.classList.add("is-hidden");
};

window.addEventListener("DOMContentLoaded", () => {
  showPageLoader("Refreshing page...");
  window.addEventListener("load", () => {
    setTimeout(() => hidePageLoader(), 300);
  }, { once: true });
});

window.addEventListener("beforeunload", () => {
  showPageLoader("Refreshing page...");
});

const canvasWrap = document.getElementById("canvas-wrap");
const loading = document.getElementById("loading");
const resetViewButton = document.getElementById("resetView");
const locationDialog = document.getElementById("locationDialog");
const closeDialog = document.getElementById("closeDialog");
const dialogTitle = document.getElementById("dialogTitle");
const dialogBody = document.getElementById("dialogBody");
const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.getElementById("siteNav");

if (navToggle && siteNav) {
  navToggle.addEventListener("click", () => {
    const isOpen = siteNav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  siteNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      siteNav.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });
}

const creativityEgg = document.getElementById("creativityEgg");
const contributorsDialog = document.getElementById("contributorsDialog");
const closeContributors = document.getElementById("closeContributors");
let creativityClickCount = 0;
let creativityClickTimer = null;

if (creativityEgg) {
  creativityEgg.addEventListener("click", (event) => {
    event.stopPropagation();
    creativityClickCount += 1;
    creativityEgg.classList.add("pulse");
    setTimeout(() => creativityEgg.classList.remove("pulse"), 400);

    clearTimeout(creativityClickTimer);
    creativityClickTimer = setTimeout(() => {
      creativityClickCount = 0;
    }, 3000);

    if (creativityClickCount === 5 && contributorsDialog) {
      creativityClickCount = 0;
      if (typeof contributorsDialog.showModal === "function") {
        contributorsDialog.showModal();
      } else {
        contributorsDialog.setAttribute("open", "open");
      }
    }
  });
}

if (closeContributors && contributorsDialog) {
  closeContributors.addEventListener("click", () => {
    contributorsDialog.close();
  });
}

if (contributorsDialog) {
  contributorsDialog.addEventListener("click", (event) => {
    const rect = contributorsDialog.getBoundingClientRect();
    const inside =
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom;

    if (!inside) {
      contributorsDialog.close();
    }
  });
}

let scene = null;
let camera = null;
let renderer = null;
let controls = null;
let defaultCameraPosition = null;
let defaultTarget = null;

const getCanvasSize = () => {
  if (!canvasWrap) return { width: 0, height: 0 };
  const width = canvasWrap.clientWidth || canvasWrap.parentElement?.clientWidth || 900;
  const height = canvasWrap.clientHeight || canvasWrap.parentElement?.clientHeight || 560;
  return { width, height };
};

if (canvasWrap) {
  const canvasSize = getCanvasSize();
  scene = new THREE.Scene();
  scene.background = new THREE.Color("#f6f8fa");

  camera = new THREE.PerspectiveCamera(
    30,
    canvasSize.width / Math.max(canvasSize.height, 1),
    0.1,
    5000
  );
  camera.position.set(0, 7, 32);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(canvasSize.width, canvasSize.height);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  canvasWrap.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 10;
  controls.maxDistance = 200;
  controls.minPolarAngle = 0.7;
  controls.maxPolarAngle = 1.4;
  controls.target.set(0, 2.2, 0);
  controls.rotateSpeed = 0.75;
  controls.panSpeed = 0.7;

  scene.add(new THREE.HemisphereLight(0xffffff, 0xcbd3da, 2.2));

  const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
  keyLight.position.set(12, 25, 14);
  keyLight.castShadow = true;
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0x9cc8ff, 1.0);
  fillLight.position.set(-15, 10, -10);
  scene.add(fillLight);

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
  defaultCameraPosition = camera.position.clone();
  defaultTarget = controls.target.clone();

  loader.load(
    MODEL_PATH,
    (gltf) => {
      campusModel = gltf.scene;
      campusModel.traverse((object) => {
        if (object.isMesh) {
          object.castShadow = true;
          object.receiveShadow = true;
          if (object.material) object.material.needsUpdate = true;
        }
      });

      // Halimbawa sa Vanilla JavaScript o React fetch
fetch('/api/get-uploaded-images')
  .then(response => response.json())
  .then(result => {
    if (result.success) {
      // Ang result.data ay naglalaman ng array ng mga images!
      console.log("Heto na ang mga ligtas na images mo bhie:", result.data);
      
      // I-loop mo lang ito sa HTML mo, halimbawa:
      // result.data.forEach(img => { 
      //    someDiv.innerHTML += `<img src="${img.url}" />` 
      // });
    }
  })
  .catch(err => console.error("Error fetching images:", err));

      const box = new THREE.Box3().setFromObject(campusModel);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());

      campusModel.position.sub(center);
      campusModel.position.y -= box.min.y - 0.25;
      campusModel.rotation.y = 0;
      scene.add(campusModel);

      const maxDimension = Math.max(size.x, size.y, size.z);
      const distance = Math.max(maxDimension * 0.95, 22);

      camera.position.set(0, 7, distance);
      controls.target.set(0, size.y * 0.18, 0);
      controls.minDistance = Math.max(maxDimension * 0.4, 12);
      controls.maxDistance = Math.max(maxDimension * 6, 160);

      defaultCameraPosition = camera.position.clone();
      defaultTarget = controls.target.clone();

      if (loading) loading.style.display = "none";
    },
    (progress) => {
      if (progress.total && loading) {
        const percent = Math.round((progress.loaded / progress.total) * 100);
        const loadingText = loading.querySelector("p");
        if (loadingText) {
          loadingText.textContent = `Loading ELJ campus… ${percent}%`;
        }
      }
    },
    (error) => {
      console.error("Could not load the GLB model:", error);
      if (loading) {
        loading.innerHTML = `
          <div style="max-width: 360px; padding: 24px;">
            <strong style="display:block; margin-bottom:8px;">3D model not found yet.</strong>
            <p>Put your school model here:<br><code>models/elj-campus.glb</code></p>
            <p style="font-size:.82rem;">The website itself is working. Once the GLB file is added, the model will appear here.</p>
          </div>
        `;
      }
    }
  );

  if (resetViewButton) {
    resetViewButton.addEventListener("click", () => {
      camera.position.copy(defaultCameraPosition);
      controls.target.copy(defaultTarget);
      controls.update();
    });
  }

  function onResize() {
    const { width, height } = getCanvasSize();

    if (!width || !height || !camera || !renderer) return;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  window.addEventListener("resize", onResize);

  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }

  animate();
}

const locations = {
  main: {
    title: "Ground Floor",
    body: `
      <div class="location-banner-wrap"><img class="location-banner" src="images/club/grounds.jpg" alt="Ground Floor banner" /></div>
      <div class="location-details">
        <p>The central area of the ELJ campus. This is where students can actively engage with school activities.</p>
        <ul class="location-facts">
          <li><strong>Purpose:</strong> Campus hub and main access point</li>
          <li><strong>Activities:</strong> Orientation, meetings, and student movement</li>
        </ul>
      </div>
      <div class="tag-row"><span class="tag">Campus</span><span class="tag">Orientation</span></div>
    `
  },
  "media-room": {
    title: "Media Room",
    body: `
      <div class="location-banner-wrap"><img class="location-banner" src="images/club/media.jpg" alt="Media Room banner" /></div>
      <div class="location-details">
        <p>A creative workspace for media production, storytelling, and digital projects. Students use this room for hands-on content creation and collaboration.</p>
        <ul class="location-facts">
          <li><strong>Purpose:</strong> Media-related classroom and workspace</li>
          <li><strong>Activities:</strong> Editing, recording, and creative production</li>
        </ul>
      </div>
      <div class="tag-row"><span class="tag">Media</span><span class="tag">Production</span></div>
    `
  },
  "comp-lab": {
    title: "Computer Laboratory",
    body: `
      <div class="location-banner-wrap"><img class="location-banner" src="https://images.unsplash.com/photo-1516321165247-4aa89a48be28?auto=format&fit=crop&w=1200&q=80" alt="Computer Lab banner" /></div>
      <div class="location-details">
        <p>The computer laboratory where students practice digital skills, conduct research, and complete technology-based learning tasks.</p>
        <ul class="location-facts">
          <li><strong>Purpose:</strong> Technology learning and computing practice</li>
          <li><strong>Activities:</strong> Research, software work, and digital projects</li>
        </ul>
      </div>
      <div class="tag-row"><span class="tag">Technology</span><span class="tag">Learning</span></div>
    `
  },
  "speech-lab": {
    title: "Speech Laboratory",
    body: `
      <div class="location-banner-wrap"><img class="location-banner" src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80" alt="Speech Lab banner" /></div>
      <div class="location-details">
        <p>A space for communication practice, public speaking, and voice development. It helps students build confidence in formal and informal presentations.</p>
        <ul class="location-facts">
          <li><strong>Purpose:</strong> Oral communication and confidence building</li>
          <li><strong>Activities:</strong> Speech drills, presentations, and language practice</li>
        </ul>
      </div>
      <div class="tag-row"><span class="tag">Communication</span><span class="tag">Confidence</span></div>
    `
  },
  "schooladmin-lab": {
    title: "School Administration",
    body: `
      <div class="location-banner-wrap"><img class="location-banner" src="images/club/faculty.jpg" alt="School Administration banner" /></div>
      <div class="location-details">
        <p>A support and administrative space that helps maintain school operations, student concerns, and communication with the campus community.</p>
        <ul class="location-facts">
          <li><strong>Purpose:</strong> Administration and school support</li>
          <li><strong>Activities:</strong> Records, assistance, and campus coordination</li>
        </ul>
      </div>
      <div class="tag-row"><span class="tag">Administration</span><span class="tag">Support</span></div>
    `
  },
  "friendship-lab": {
    title: "Friendship Area",
    body: `
      <div class="location-banner-wrap"><img class="location-banner" src="images/club/friendship.jpg" alt="Friendship area banner" /></div>
      <div class="location-details">
        <p>A welcoming social space where students connect, rest, and build relationships within the campus community.</p>
        <ul class="location-facts">
          <li><strong>Purpose:</strong> Social interaction and community building</li>
          <li><strong>Activities:</strong> Conversations, bonding, and student connection</li>
        </ul>
      </div>
      <div class="tag-row"><span class="tag">Community</span><span class="tag">Friendship</span></div>
    `
  },
  library: {
    title: "Library",
    body: `
      <div class="location-banner-wrap"><img class="location-banner" src="https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1200&q=80" alt="Library banner" /></div>
      <div class="location-details">
        <p>A learning and study space for students. It supports reading, research, and quiet academic work in a supportive environment.</p>
        <ul class="location-facts">
          <li><strong>Purpose:</strong> Learning, reading, and study</li>
          <li><strong>Activities:</strong> Research, reading, and silent study</li>
        </ul>
      </div>
      <div class="tag-row"><span class="tag">Learning</span><span class="tag">Study Space</span></div>
    `
  },
  "theater-room": {
    title: "Theater Room",
    body: `
      <div class="location-banner-wrap"><img class="location-banner" src="images/club/theater.jpg" alt="Theater Room banner" /></div>
      <div class="location-details">
        <p>A performance and creative space where students can present, act, and take part in artistic production and live storytelling.</p>
        <ul class="location-facts">
          <li><strong>Purpose:</strong> Theater performance and staging</li>
          <li><strong>Activities:</strong> Acting, production, and artistic performances</li>
        </ul>
      </div>
      <div class="tag-row"><span class="tag">Performance</span><span class="tag">Arts</span></div>
    `
  },
  canteen: {
    title: "Canteen",
    body: `
      <div class="location-banner-wrap"><img class="location-banner" src="https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80" alt="Canteen banner" /></div>
      <div class="location-details">
        <p>The student dining area where learners take breaks, eat meals, and spend time together outside class.</p>
        <ul class="location-facts">
          <li><strong>Purpose:</strong> Food and rest area for students</li>
          <li><strong>Activities:</strong> Eating, socializing, and breaks</li>
        </ul>
      </div>
      <div class="tag-row"><span class="tag">Dining</span><span class="tag">Break Area</span></div>
    `
  },
  "ecrew-room": {
    title: "E-CREW Room",
    body: `
      <div class="location-banner-wrap"><img class="location-banner" src="images/club/ecrew.jpg" alt="ECREW Room banner" /></div>
      <div class="location-details">
        <p>A collaborative space for student organizations, event support, and campus communication projects that encourage teamwork and leadership.</p>
        <ul class="location-facts">
          <li><strong>Purpose:</strong> Student organization and event support</li>
          <li><strong>Activities:</strong> Planning, collaboration, and communication</li>
        </ul>
      </div>
      <div class="tag-row"><span class="tag">Events</span><span class="tag">Teamwork</span></div>
    `
  },
  "prop-room": {
    title: "Props Room",
    body: `
      <div class="location-banner-wrap"><img class="location-banner" src="https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80" alt="Prop Room banner" /></div>
      <div class="location-details">
        <p>Storage and preparation space for production materials, props, and performance essentials used in school events and presentations.</p>
        <ul class="location-facts">
          <li><strong>Purpose:</strong> Props and production support</li>
          <li><strong>Activities:</strong> Setup, storage, and preparation</li>
        </ul>
      </div>
      <div class="tag-row"><span class="tag">Props</span><span class="tag">Production</span></div>
    `
  },
  "haraya-room": {
    title: "Haraya Room",
    body: `
      <div class="location-banner-wrap"><img class="location-banner" src="images/club/haraya.jpg" alt="Haraya Room banner" /></div>
      <div class="location-details">
        <p>A creative space for imagination, artistic exploration, and expression through design, visual work, and creative thinking.</p>
        <ul class="location-facts">
          <li><strong>Purpose:</strong> Creative and design-focused space</li>
          <li><strong>Activities:</strong> Art-making, brainstorming, and experimentation</li>
        </ul>
      </div>
      <div class="tag-row"><span class="tag">Creativity</span><span class="tag">Arts</span></div>
    `
  },
  "vanguard-room": {
    title: "The VANGUARD Room",
    body: `
      <div class="location-banner-wrap"><img class="location-banner" src="images/club/vanguard.jpg" alt="Vanguard Room banner" /></div>
      <div class="location-details">
        <p>A room used for leadership activities, student initiatives, and program coordination that supports student growth and responsibility.</p>
        <ul class="location-facts">
          <li><strong>Purpose:</strong> Leadership and coordination room</li>
          <li><strong>Activities:</strong> Meetings, planning, and student projects</li>
        </ul>
      </div>
      <div class="tag-row"><span class="tag">Leadership</span><span class="tag">Student Org</span></div>
    `
  },
  "science-lab": {
    title: "Science Laboratory",
    body: `
      <div class="location-banner-wrap"><img class="location-banner" src="https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1200&q=80" alt="Science Laboratory banner" /></div>
      <div class="location-details">
        <p>A laboratory space for scientific exploration, experiments, and discovery-based learning that strengthens analytical thinking.</p>
        <ul class="location-facts">
          <li><strong>Purpose:</strong> Experiments and science learning</li>
          <li><strong>Activities:</strong> Observation, testing, and analysis</li>
        </ul>
      </div>
      <div class="tag-row"><span class="tag">Science</span><span class="tag">Discovery</span></div>
    `
  },
  faculty: {
    title: "Faculty",
    body: `
      <div class="location-banner-wrap"><img class="location-banner" src="images/club/faculty.jpg" alt="Faculty banner" /></div>
      <div class="location-details">
        <p>The faculty area where teachers, mentors, and school staff support academic and administrative functions for the campus community.</p>
        <ul class="location-facts">
          <li><strong>Purpose:</strong> Academic support and administration</li>
          <li><strong>Activities:</strong> Guidance, meetings, and faculty operations</li>
        </ul>
      </div>
      <div class="tag-row"><span class="tag">Teachers</span><span class="tag">Administration</span></div>
    `
  }
};

if (document.querySelectorAll(".location-card").length) {
  document.querySelectorAll(".location-card").forEach((card) => {
    card.addEventListener("click", () => {
      const key = card.dataset.location;
      const location = locations[key] || {
        title: "Campus Location",
        body: `<div class="location-details"><p>This campus space is available for student learning, activities, and school engagement.</p></div>`
      };

      if (dialogTitle) dialogTitle.textContent = location.title;
      if (dialogBody) {
        dialogBody.innerHTML = location.body;

        const detailPanel = dialogBody.querySelector(".location-details");
        const banner = dialogBody.querySelector(".location-banner-wrap");

        if (detailPanel && banner && !detailPanel.contains(banner)) {
          detailPanel.prepend(banner);
        }

        if (detailPanel) {
          const copy = document.createElement("div");
          copy.className = "location-copy";

          const nodesToMove = [...detailPanel.childNodes].filter((node) => {
            return node.nodeType === 1 && (node.matches("p") || node.matches(".location-facts"));
          });

          nodesToMove.forEach((node) => {
            copy.appendChild(node);
          });

          if (copy.children.length > 0) {
            detailPanel.appendChild(copy);
          }
        }
      }

      if (locationDialog && typeof locationDialog.showModal === "function") {
        locationDialog.showModal();
      } else if (locationDialog) {
        locationDialog.setAttribute("open", "open");
      }
    });
  });
}

if (closeDialog && locationDialog) {
  closeDialog.addEventListener("click", () => locationDialog.close());
}

if (locationDialog) {
  locationDialog.addEventListener("click", (event) => {
    const rect = locationDialog.getBoundingClientRect();
    const inside =
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom;
    if (!inside) locationDialog.close();
  });
}
