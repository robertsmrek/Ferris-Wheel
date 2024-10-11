import * as THREE from "three";

const setupLights = (scene) => {
	// Create a group for light markers
	const lightMarkersGroup = new THREE.Group();
	scene.add(lightMarkersGroup);

	// Function to create light markers
	function createLightMarker(position) {
		const marker = new THREE.Mesh(
			new THREE.SphereGeometry(0.5, 16, 16),
			new THREE.MeshBasicMaterial({ color: 0xffff00 })
		);
		marker.position.copy(position);
		lightMarkersGroup.add(marker);
	}

	// Light 1
	const light = new THREE.PointLight(0xffffff, 60, 100);
	light.position.set(0, 10, 10);
	scene.add(light);
	createLightMarker(light.position);

	// Light 2
	const light2 = new THREE.PointLight(0xffffff, 30, 100);
	light2.position.set(0, 15, 0);
	scene.add(light2);
	createLightMarker(light2.position);

	// Light 3
	const light3 = new THREE.PointLight(0xffffff, 30, 100);
	light3.position.set(0, -10, 20);
	scene.add(light3);
	createLightMarker(light3.position);

	return { light, light2, light3, lightMarkersGroup };
};

export default setupLights;
