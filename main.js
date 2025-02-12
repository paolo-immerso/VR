import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";

// Creazione della scena
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x202020);

// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 2, 5);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping; // Migliora la qualità visiva
renderer.toneMappingExposure = 1; // Regola l'esposizione
document.body.appendChild(renderer.domElement);

// Luci
const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(8, 2, 2);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 4096;
directionalLight.shadow.mapSize.height = 4096;
scene.add(directionalLight);

// Caricamento HDRI per riflessi realistici
const rgbeLoader = new RGBELoader();
rgbeLoader.load("./assets/royal_esplanade_1k.hdr", (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = texture;
    scene.background = texture; // Se vuoi rimuovere lo sfondo, commenta questa riga
});

// Piattaforma
const platformGeometry = new THREE.CylinderGeometry(2, 10, 0.2, 32);
const platformMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
const platform = new THREE.Mesh(platformGeometry, platformMaterial);
platform.position.y = 0;
platform.receiveShadow = true;
scene.add(platform);

// Caricamento modello Pareti.glb
const loader = new GLTFLoader();
loader.load("./assets/Pareti.glb", (gltf) => {
    const model = gltf.scene;
    model.scale.set(1, 1, 1);
    model.position.set(0, 0.2, 0);
    model.traverse((node) => {
        if (node.isMesh) {
            node.castShadow = true;
            node.receiveShadow = true;
        }
    });
    scene.add(model);
}, undefined, (error) => {
    console.error("Errore nel caricamento del modello Pareti.glb:", error);
});

// Caricamento modello Vetri.glb con materiale vetroso avanzato
loader.load("./assets/Vetri.glb", (gltf) => {
    const model = gltf.scene;
    model.scale.set(1, 1, 1);
    model.position.set(0, 0.2, 0);
    model.traverse((node) => {
        if (node.isMesh) {
            node.material = new THREE.MeshPhysicalMaterial({
                color: 0xffffff,
                metalness: 0,
                roughness: 0,
                ior: 1.5, // Indice di rifrazione
                thickness: 0.01, // Spessore del vetro
                transmission: 1, // Attiva la trasparenza realistica
                envMap: scene.environment,
                envMapIntensity: 1,
                specularIntensity: 1,
                specularColor: new THREE.Color(0xffffff),
                side: THREE.DoubleSide,
                transparent: true
            });
            node.castShadow = true;
            node.receiveShadow = true;
        }
    });
    scene.add(model);
}, undefined, (error) => {
    console.error("Errore nel caricamento del modello Vetri.glb:", error);
});

// Raycaster per il movimento
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let targetPosition = new THREE.Vector3();
let isAnimating = false;
let circle = null;

// Variabili per la gestione della rotazione
let isMouseDown = false;
let lastMouseX = 0;
let lastMouseY = 0;
let yaw = 0;
let pitch = 0;
let isRotating = false;
const moveThreshold = 5;

// Angolo iniziale della camera
const euler = new THREE.Euler(0, 0, 0, "YXZ");

// Funzione per gestire il click sulla piattaforma
function onMouseClick(event) {
    if (isRotating) return;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects([platform]);

    if (intersects.length > 0) {
        const point = intersects[0].point;
        targetPosition.copy(point).setY(2);
        isAnimating = true;

        if (!circle) {
            circle = new THREE.Mesh(
                new THREE.CircleGeometry(0.3, 32),
                new THREE.MeshBasicMaterial({ color: 0xff0000 })
            );
            circle.rotation.x = -Math.PI / 2;
            scene.add(circle);
        }
        circle.position.copy(point);
    }
}

// Controllo rotazione della camera con il mouse
function onMouseDown(event) {
    isMouseDown = true;
    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
    isRotating = false;
}

function onMouseMove(event) {
    if (!isMouseDown) return;

    const deltaX = event.clientX - lastMouseX;
    const deltaY = event.clientY - lastMouseY;

    if (Math.abs(deltaX) > moveThreshold || Math.abs(deltaY) > moveThreshold) {
        isRotating = true;
    }

    if (isRotating) {
        yaw -= deltaX * 0.002;
        pitch -= deltaY * 0.002;
        pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));

        euler.set(pitch, yaw, 0);
        camera.quaternion.setFromEuler(euler);
    }

    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
}

function onMouseUp(event) {
    isMouseDown = false;

    if (!isRotating) {
        onMouseClick(event);
    }
}

// Eventi mouse
window.addEventListener("mousedown", onMouseDown);
window.addEventListener("mousemove", onMouseMove);
window.addEventListener("mouseup", onMouseUp);

// Resize
window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Loop di animazione
function animate() {
    requestAnimationFrame(animate);

    if (isAnimating) {
        const step = 0.05;
        camera.position.lerp(targetPosition, step);

        if (camera.position.distanceTo(targetPosition) < 0.1) {
            isAnimating = false;
            if (circle) {
                scene.remove(circle);
                circle = null;
            }
        }
    }

    renderer.render(scene, camera);
}
animate();
