import * as THREE from 'three'
import {
  PARAMETERS, HUD, POINTER_SPEED,
  PLAYER_INIT_HEIGHT, PLAYER_HEIGHT, PLAYER_STEP_DOWN,
  PLAYER_SPEED_GROUND, PLAYER_SPEED_AIR, CREATIVE_SPEED_FACTOR,
  LOWER_X, UPPER_X, LOWER_Y, UPPER_Y, LOWER_Z, UPPER_Z
} from './config.js'

const _PI_2 = Math.PI / 2

export function createPlayer (camera, chunks) {
  const position = new THREE.Vector3(0, PLAYER_INIT_HEIGHT, 0)
  const velocity = new THREE.Vector3()
  const direction = new THREE.Vector3()
  const eulerAngle = new THREE.Euler(0, 0, 0, 'YXZ')
  const keys = {} // KeyboardEvent.code -> pressed
  const state = { creative: true, onFloor: true }

  function getForwardVector () {
    camera.getWorldDirection(direction)
    direction.y = 0
    direction.normalize()
    return direction
  }

  function getSideVector () {
    camera.getWorldDirection(direction)
    direction.y = 0
    direction.normalize()
    direction.cross(camera.up)
    return direction
  }

  function controls (deltaTime) {
    let speedDelta = deltaTime * (state.onFloor ? PLAYER_SPEED_GROUND : PLAYER_SPEED_AIR)
    speedDelta *= state.creative ? CREATIVE_SPEED_FACTOR : 1
    // if shift is pressed then move at one-third speed
    if (keys.ShiftLeft || keys.ShiftRight) speedDelta /= 3
    // move forward
    if (keys.KeyW || keys.ArrowUp) velocity.add(getForwardVector().multiplyScalar(speedDelta))
    // move backward
    if (keys.KeyS || keys.ArrowDown) velocity.add(getForwardVector().multiplyScalar(-speedDelta))
    // move left
    if (keys.KeyA || keys.ArrowLeft) velocity.add(getSideVector().multiplyScalar(-speedDelta))
    // move right
    if (keys.KeyD || keys.ArrowRight) velocity.add(getSideVector().multiplyScalar(speedDelta))
    // fly up
    if (keys.KeyQ || keys.KeyZ) velocity.y += speedDelta
    // fly down
    if (keys.KeyE || keys.KeyX) velocity.y -= speedDelta
    // jump if player on floor
    if (state.onFloor && keys.Space && !state.creative) velocity.y = 30
  }

  // Survival: stand on the rendered terrain, follow it down small drops.
  function groundRule () {
    const ground = chunks.groundHeightAt(position.x, position.z)
    if (ground === null) {
      state.onFloor = false
      return
    }
    const feet = ground + PLAYER_HEIGHT
    if (position.y <= feet || (state.onFloor && velocity.y <= 0 && position.y - feet < PLAYER_STEP_DOWN)) {
      position.y = feet
      velocity.y = Math.max(0, velocity.y)
      state.onFloor = true
    } else {
      state.onFloor = false
    }
  }

  function step (deltaTime) {
    controls(deltaTime)

    let damping = Math.exp(-4 * deltaTime) - 1
    if (!state.onFloor) {
      velocity.y -= PARAMETERS.gravity * deltaTime
      // small air resistance
      damping *= 0.1
    }
    velocity.addScaledVector(velocity, damping)
    position.addScaledVector(velocity, deltaTime)

    if (!state.creative) groundRule()

    // limit player position to be within world bounds
    position.x = Math.min(Math.max(position.x, LOWER_X), UPPER_X)
    position.y = Math.min(Math.max(position.y, LOWER_Y), UPPER_Y)
    position.z = Math.min(Math.max(position.z, LOWER_Z), UPPER_Z)

    camera.position.copy(position)
  }

  function toggleCreativeMode () {
    if (!state.creative) {
      state.creative = true
      state.onFloor = true
      velocity.y = 0
      HUD.mode = 'CREATIVE'
    } else {
      state.creative = false
      HUD.mode = 'SURVIVAL'
    }
  }

  function onMouseMove (e) {
    eulerAngle.setFromQuaternion(camera.quaternion)
    eulerAngle.y -= (e.movementX || 0) * 0.002 * POINTER_SPEED
    eulerAngle.x -= (e.movementY || 0) * 0.002 * POINTER_SPEED
    eulerAngle.x = Math.max(-_PI_2, Math.min(_PI_2, eulerAngle.x))
    camera.quaternion.setFromEuler(eulerAngle)
  }

  return { position, velocity, keys, state, step, toggleCreativeMode, onMouseMove }
}
