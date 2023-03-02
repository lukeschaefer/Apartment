import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { Resources } from './Resources'
import * as dat from 'lil-gui'

/**
 * Base
 */
// Debug
const gui = new dat.GUI()

// Canvas
const canvas = document.querySelector('canvas.webgl') as HTMLCanvasElement;

// Scene
const scene = new THREE.Scene()

/**
 * Textures
 */
const bakeTexture = Resources.add("bake.jpg");
const bakeTextures = [
  "Leather",
  "Floor",
  "Walls",
  "Closet",
  "Green Door",
  "Shiny",
  "Marble",
  "Rug",
  "Wallpaper",
]

const background = Resources.add("background.jpg")



// Model:
const apartmentModel = Resources.add("apartment.glb", (gltf) => {
  const text = bakeTexture.get();
  text.flipY = false;
  text.encoding = THREE.LinearEncoding;
  const bakeMaterial = new THREE.MeshBasicMaterial({ map: text })

  gltf.scene.traverse((child) => {
    if (child.name == "sunblock") child.remove();

    if (child instanceof THREE.Mesh && bakeTextures.includes(child.material.name)) {
      child.material = bakeMaterial
    }
  });
  return gltf.scene;
});

Resources.loadAll().then(() => {
  scene.add(apartmentModel.get());

  // Scene background:
  const bgTexture = background.get();
  const bgTarget = new THREE.WebGLCubeRenderTarget(bgTexture.image.height);
  bgTarget.fromEquirectangularTexture(renderer, bgTexture);
  bgTarget.texture.encoding = THREE.sRGBEncoding;
  scene.background = bgTarget.texture;
  return bgTarget;
})


/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
}

window.addEventListener('resize', () => {
  // Update sizes
  sizes.width = window.innerWidth
  sizes.height = window.innerHeight

  // Update camera
  camera.aspect = sizes.width / sizes.height
  camera.updateProjectionMatrix()

  // Update renderer
  renderer.setSize(sizes.width, sizes.height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100);

camera.position.x = 3
camera.position.y = 8
camera.position.z = 10
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () => {
  const elapsedTime = clock.getElapsedTime()

  // Update controls
  controls.update()

  // Render
  renderer.render(scene, camera)

  // Call tick again on the next frame
  window.requestAnimationFrame(tick)
}

tick()

