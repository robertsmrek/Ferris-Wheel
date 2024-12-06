import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";

import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPixelatedPass } from "three/examples/jsm/Addons.js";
import { OutputPass } from "three/examples/jsm/Addons.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { OutlinePass } from "three/examples/jsm/postprocessing/OutlinePass.js";

import setupLights from "./src/scene/lights";
import createWheel from "./src/scene/wheel";

import debugGUI from "./src/gui/debugGUI";

import githubBanner from "./src/components/githubBanner";
import controlsBanner from "./src/components/controls";
// import GLTFwheel from "./src/scene/GLTFwheel";

import resize from "./src/utils/resize";
import { Tree } from "./src/scene/tree";

//sizes
const sizes = {
	width: window.innerWidth,
	height: window.innerHeight,
};

//create scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000); // Dark blue color

//create camera
const camera = new THREE.PerspectiveCamera(
	50,
	sizes.width / sizes.height,
	0.1,
	1000
);
camera.position.z = 20;

//create renderer
const canvas = document.querySelector(".webgl");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
renderer.setSize(sizes.width, sizes.height);

// composer
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

// Pixelated post-processing effect
const renderPixelatedPass = new RenderPixelatedPass(4, scene, camera);
composer.addPass(renderPixelatedPass);

const outputPass = new OutputPass();
composer.addPass(outputPass);

// shadows
renderer.shadowMap.enabled = true; // Enable shadow maps
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Optional: Choose shadow map type

// Variables for physics
var physics = {
	swingAmplitude: 0.04,
	swingSpeed: 0.03,
	rotationSpeed: 0.005,
	wheelAnimationSpeed: 1.5,
};

// Wheel
const { wheel, cabins, radius } = createWheel(scene);

//create ground
const ground = new THREE.Mesh(
	new THREE.CylinderGeometry(20, 20, 1, 16),
	new THREE.MeshStandardMaterial({ color: 0x00ff00 }) // Grass green color
);
// Load texture
const textureLoader = new THREE.TextureLoader();
const groundTexture = textureLoader.load("./assets/grass.jpg");
groundTexture.wrapS = THREE.RepeatWrapping;
groundTexture.wrapT = THREE.RepeatWrapping;
groundTexture.repeat.set(5, 5);

// Apply texture to ground material
ground.material.map = groundTexture;
ground.material.needsUpdate = true;

ground.position.y = -6.2;
ground.receiveShadow = true; // Enable shadows for the ground
scene.add(ground);

// Create trees in two circles around the wheel
const createTreeRing = (count, distance) => {
	for (let i = 0; i < count; i++) {
		const angle = (i / count) * Math.PI * 2;
		const random = Math.random();
		const randomTree =
			random < 0.33
				? Tree.createTree()
				: random < 0.66
				? Tree.createPine()
				: Tree.createOak();
		randomTree.position.set(
			Math.cos(angle) * distance,
			-6,
			Math.sin(angle) * distance
		);

		if (random < 0.33) {
			randomTree.scale.y = random + 0.6;
		} else if (random < 0.66) {
			randomTree.scale.y = random + 0.5;
		} else {
			randomTree.scale.y = random;
		}
		scene.add(randomTree);
	}
};
// Create two rings of trees
createTreeRing(10, radius + 6);
createTreeRing(10, radius + 12);

// skybox
const skyboxGeometry = new THREE.SphereGeometry(100, 32, 32);
const skyboxMaterial = new THREE.MeshBasicMaterial({
	color: 0x87ceeb,
	side: THREE.BackSide,
});
const skybox = new THREE.Mesh(skyboxGeometry, skyboxMaterial);
skybox.position.y = -5;

// Load skybox texture
const skyboxTexture = textureLoader.load("./assets/skybox_2.png");
skyboxMaterial.map = skyboxTexture;
skyboxMaterial.needsUpdate = true;
scene.add(skybox);

//point camera at the sphere
camera.lookAt(wheel.position);

//controls
const controls = new OrbitControls(camera, canvas);
controls.target.set(wheel.position.x, wheel.position.y, wheel.position.z);
controls.update();

// Setup lights
const { light, light2, light3, lightMarkersGroup } = setupLights(scene);

// Create axes
const axes = new THREE.AxesHelper(5);
scene.add(axes);

// Setup GUI
debugGUI({
	physics,
	lights: { light, light2, light3 },
	lightMarkersGroup,
	scene,
	axes,
	renderPixelatedPass,
});

//Github Link Banner
githubBanner();

// Controls banner
controlsBanner();

// Raycasting for selecting cabins
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Right-click to enter cabin
window.addEventListener("contextmenu", (event) => {
	event.preventDefault();
	mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
	mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

	raycaster.setFromCamera(mouse, camera);
	const intersects = raycaster.intersectObjects(cabins);

	if (intersects.length > 0) {
		selectedCabin = intersects[0].object;
		controls.enabled = false; // Disable orbit controls
		pointerLockControls.lock(); // Enable pointer lock controls
		console.log("Cabin right-clicked:", selectedCabin);
	}
});

let selectedCabin = null;

// Pointer lock controls
const pointerLockControls = new PointerLockControls(camera, document.body);

// Outline effect
const outlinePass = new OutlinePass(
	new THREE.Vector2(window.innerWidth, window.innerHeight),
	scene,
	camera
);

// Set outline parameters
outlinePass.edgeStrength = 5.0; // Edge strength
outlinePass.edgeGlow = 1; // Edge glow
outlinePass.edgeThickness = 1.0; // Edge thickness
outlinePass.pulsePeriod = 1; // Pulse period
outlinePass.visibleEdgeColor.set("#ffffff"); // Edge color when visible

composer.addPass(outlinePass);

// Update outline effect on mouse move
window.addEventListener("mousemove", (event) => {
	mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
	mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

	raycaster.setFromCamera(mouse, camera);
	const intersects = raycaster.intersectObjects(cabins);

	if (intersects.length > 0) {
		outlinePass.selectedObjects = [intersects[0].object];
	} else {
		outlinePass.selectedObjects = [];
	}
});

//resize
resize(sizes, camera, renderer, composer);

window.addEventListener("click", (event) => {
	mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
	mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

	raycaster.setFromCamera(mouse, camera);
	const intersects = raycaster.intersectObjects(cabins);

	if (intersects.length > 0) {
		selectedCabin = intersects[0].object;
		controls.enabled = false; // Disable orbit controls
		pointerLockControls.lock(); // Enable pointer lock controls
		console.log("Cabin clicked:", selectedCabin);
	}
});

function resetCameraPosition() {
	camera.position.set(0, 0, 20); // Adjust these values to your base position
	camera.lookAt(wheel.position);
}

// Reset camera position when pressing 'x'
window.addEventListener("keydown", (event) => {
	if (event.key === "x") {
		selectedCabin = null;
		controls.enabled = true; // Enable orbit controls
		pointerLockControls.unlock(); // Disable pointer lock controls
		resetCameraPosition();
	}
});

// Clock for animation timing
const clock = new THREE.Clock();

//render
function animate() {
	requestAnimationFrame(animate);

	// Animate tree leaves
	scene.traverse((object) => {
		if (object.isMesh && object.userData.isTree) {
			const time = clock.getElapsedTime();
			object.rotation.y = Math.sin(time * 0.5) * 0.1; // Swaying effect
		}
	});

	if (!selectedCabin) {
		controls.update();
	} else {
		pointerLockControls.update();
	}
	// Rotate the Ferris wheel
	wheel.rotation.z += physics.rotationSpeed;

	// Rotate the cabins around the wheel without spinning
	cabins.forEach((cabin, index) => {
		const angle = cabin.userData.angle + wheel.rotation.z;

		// Calculate the cabin's position along the wheel
		cabin.position.set(
			Math.cos(angle) * radius,
			Math.sin(angle) * radius,
			0
		);

		// Apply simple physics for swinging effect
		const swingOffset =
			Math.sin(cabin.userData.swing) * physics.swingAmplitude;
		cabin.userData.swing += physics.swingSpeed; // Increment swing angle over time

		// Keep the cabin upright (no spinning)
		cabin.rotation.z = swingOffset; // Swinging effect without spinning
	});

	// camera look at selected cabin
	if (selectedCabin) {
		camera.position.copy(selectedCabin.position);
		camera.position.z += 1;

		// camera in the cabin movement
		const direction = new THREE.Vector3();
		camera.getWorldDirection(direction);
		camera.lookAt(camera.position.clone().add(direction));
	}

	composer.render();
}

animate();
