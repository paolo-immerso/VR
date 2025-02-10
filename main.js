import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

// Creazione della scena
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x202020); // Sfondo grigio scuro

// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 2, 5);

// Renderer con ombre
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// **Luci**
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
directionalLight.position.set(5, 10, 5);
directionalLight.castShadow = true;
scene.add(directionalLight);

// **Piattaforma circolare**
const platformGeometry = new THREE.CylinderGeometry(2, 2, 0.2, 32);
const platformMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
const platform = new THREE.Mesh(platformGeometry, platformMaterial);
platform.position.y = 0;
platform.receiveShadow = true;
scene.add(platform);

// **Caricamento modello GLB con ridimensionamento**
const loader = new GLTFLoader();
loader.load("./assets/sci_fi_turret.glb", (gltf) => {
    const model = gltf.scene;

    // **Ridimensiona il modello per adattarlo alla piattaforma**
    const scaleFactor = 0.01; // 🔥 Riduci la scala, prova a modificarlo se serve
    model.scale.set(scaleFactor, scaleFactor, scaleFactor);

    // **Centra il modello sulla piattaforma**
    model.position.set(0, 0.1, 0);

    model.traverse((node) => {
        if (node.isMesh) {
            node.castShadow = true;
            node.receiveShadow = true;
        }
    });

    scene.add(model);
}, undefined, (error) => {
    console.error("Errore nel caricamento del modello:", error);
});

// **Controlli Orbit**
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// **Gestione Resize**
window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// **Loop di animazione**
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();
