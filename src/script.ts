import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { Resources } from './Resources'
import * as dat from 'lil-gui'
import {MeshBakedMaterial} from 'mesh-baked-material'
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
const bakeRoughness = Resources.add("roughness.jpg");
const bakeTexture = Resources.add("baked.jpg");
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
  const roughness = bakeRoughness.get();
  roughness.flipY = false;
  const text = bakeTexture.get();
  text.flipY = false;
  text.encoding = THREE.sRGBEncoding;
  const bakeMaterial = new MeshBakedMaterial({ map: text, roughnessMap: roughness})

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
  bgTarget.texture.offset.x = .4;

  // Ambient light:
  const ambientLight = new THREE.AmbientLight(0xffccaa, 0.3);
  scene.add(ambientLight);

  // Add point lights:

  const lights : {color: number, position: [number,number,number]}[] = [
    // Sun light
    { color: 0xff7722, position: [10, 5, -3] },
    // Living room ceiling:
    { color: 0xffffcc, position: [0, 6, -1] },
  ]
  lights.forEach((light) => {
    const pointLight = new THREE.PointLight(light.color, 1, 100);
    pointLight.position.set(...light.position);
    scene.add(pointLight);
  })

  scene.background = bgTarget.texture;
  scene.background.offset.x = .4;
  scene.environment = bgTarget.texture;

  // Add options for tone mapping:
  const toneMapping = {
    None: THREE.NoToneMapping,
    Linear: THREE.LinearToneMapping,
    Reinhard: THREE.ReinhardToneMapping,
    Cineon: THREE.CineonToneMapping,
    ACESFilmic: THREE.ACESFilmicToneMapping,
  };
  gui.add(renderer, "toneMapping", toneMapping).onChange((value : THREE.ToneMapping) => renderer.toneMapping = value);
  gui.add(renderer, "toneMappingExposure", 0, 2, 0.01).onChange((value : number) => renderer.toneMappingExposure = value);
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

camera.position.x = 1
camera.position.y = 4
camera.position.z = 1
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
})
renderer.toneMapping = THREE.CineonToneMapping;
renderer.toneMappingExposure = .8;
renderer.outputEncoding = THREE.sRGBEncoding;
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

