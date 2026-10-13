import * as THREE from 'three'
import Stats from 'three/addons/libs/stats.module.js'
import './looks.css'
import { PARAMETERS, HUD, STEPS_PER_FRAME, PLAYER_INIT_HEIGHT } from './config.js'
import { loadTextures } from './textures.js'
import { createMaterials } from './materials.js'
import { loadDecorations } from './decorations.js'
import { ChunkManager } from './chunks.js'
import { createSky } from './sky.js'
import { createPlayer } from './player.js'
import { createGui } from './gui.js'

// Raw colors + sRGB output, as in three r134: keeps the 2022 palette
THREE.ColorManagement.enabled = false

/// ////////////////////////////////////////////////////////////////////////////
// Set up renderer, scene and camera

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setPixelRatio(window.devicePixelRatio || 1)
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFShadowMap

const scene = new THREE.Scene()

const camera = new THREE.PerspectiveCamera(
  90,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
)
camera.rotation.order = 'YXZ'
camera.position.set(0, PLAYER_INIT_HEIGHT, 0)
camera.lookAt(128, 0, 0)

const stats = new Stats()
stats.showPanel(0) // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.dom)
document.body.appendChild(renderer.domElement)

const title = document.getElementById('title')

/// ////////////////////////////////////////////////////////////////////////////
// Load assets, then start

let assets
try {
  assets = await Promise.all([loadTextures(), loadDecorations(scene)])
} catch (err) {
  console.error(err)
  title.textContent = 'Failed to load assets. See console.'
  title.classList.remove('blink_me')
}
if (assets) start(...assets)

function start (textures, decorations) {
  const materials = createMaterials(textures)
  const chunks = new ChunkManager(scene, materials[PARAMETERS.chunk_material], decorations)
  const sky = createSky(scene)
  const player = createPlayer(camera, chunks)
  const gui = createGui({ chunks, materials, textures })

  title.textContent = 'Click to Focus!'

  const blocker = document.getElementById('blocker')
  const instructions = document.getElementById('instructions')
  let pointerLocked = false

  window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
  })

  instructions.addEventListener('click', function () {
    document.body.requestPointerLock()
  })

  document.addEventListener('pointerlockchange', function () {
    pointerLocked = document.pointerLockElement === document.body
    blocker.style.display = pointerLocked ? 'none' : 'block'
    instructions.style.display = pointerLocked ? 'none' : ''
    gui.setFoldersOpen(!pointerLocked)
  })

  document.body.addEventListener('mousemove', function (e) {
    if (pointerLocked) player.onMouseMove(e)
  })

  document.addEventListener('keydown', function (e) {
    player.keys[e.code] = true
    if (e.code === 'KeyC') player.toggleCreativeMode()
  })
  document.addEventListener('keyup', function (e) {
    player.keys[e.code] = false
  })

  /// //////////////////////////////////////////////////////////////////////////
  // Animate

  const timer = new THREE.Timer()
  timer.connect(document)

  renderer.setAnimationLoop(function animate (time) {
    timer.update(time)
    const deltaTime = Math.min(0.05, timer.getDelta())

    sky.update(deltaTime, player.position)

    // Prevent user from moving when the pointer is not locked
    if (pointerLocked) {
      for (let i = 0; i < STEPS_PER_FRAME; i++) player.step(deltaTime / STEPS_PER_FRAME)
      const { x, y, z } = player.position
      HUD.camera_position = `(${x.toFixed(1)}, ${y.toFixed(1)}, ${z.toFixed(1)})`
      HUD.num_of_loaded_chunks = chunks.size
    }

    chunks.update(player.position)

    renderer.render(scene, camera)

    stats.update()
  })

  // Dev-only console handle for manual checks; stripped from production builds
  if (import.meta.env.DEV) window.worldscapes = { PARAMETERS, player, chunks, sky }
}
