import * as THREE from 'three'
import { PARAMETERS, NIGHT_TIME_FACTOR, SUN_DISTANCE, SHADOW_HALF_SIZE } from './config.js'

const DEG2RAD = Math.PI / 180

// Lights, sky color and fog, driven by PARAMETERS every frame.
export function createSky (scene) {
  const ambient = new THREE.AmbientLight()
  scene.add(ambient)

  // The sun and its target follow the player (see update), so the shadow
  // camera always covers a SHADOW_HALF_SIZE square around the player.
  const sun = new THREE.DirectionalLight()
  sun.castShadow = true
  sun.shadow.camera.left = -SHADOW_HALF_SIZE
  sun.shadow.camera.bottom = -SHADOW_HALF_SIZE
  sun.shadow.camera.right = SHADOW_HALF_SIZE
  sun.shadow.camera.top = SHADOW_HALF_SIZE
  sun.shadow.camera.near = 1
  sun.shadow.camera.far = 2 * SUN_DISTANCE
  sun.shadow.camera.updateProjectionMatrix()
  sun.shadow.mapSize.set(2048, 2048)
  sun.shadow.bias = -0.0005
  scene.add(sun, sun.target)

  const moon = new THREE.DirectionalLight(PARAMETERS.directional_light_color)
  moon.position.set(100, 100, 0)
  scene.add(moon)

  scene.background = new THREE.Color()
  scene.fog = new THREE.FogExp2()

  let night = false
  let nightLeft = 0 // seconds
  const dir = new THREE.Vector3()
  const baseSky = new THREE.Color()
  const hsl = { h: 0, s: 0, l: 0 }

  function update (dt, playerPosition) {
    const s = PARAMETERS.day_night_speed
    if (s > 0) {
      if (night) {
        nightLeft -= dt
        if (nightLeft <= 0) night = false
      } else {
        PARAMETERS.directional_light_angle += s * 60 * dt
        if (PARAMETERS.directional_light_angle >= 180) {
          PARAMETERS.directional_light_angle = 0
          night = true
          nightLeft = NIGHT_TIME_FACTOR / s / 1000
        }
      }
    } else {
      night = false
    }

    const a = PARAMETERS.directional_light_angle * DEG2RAD
    dir.set(Math.sin(a), Math.sin(a), -Math.cos(a)).normalize()
    sun.target.position.copy(playerPosition)
    sun.position.copy(playerPosition).addScaledVector(dir, SUN_DISTANCE)

    ambient.color.setHex(PARAMETERS.ambient_light_color)
    ambient.intensity = Math.PI * PARAMETERS.ambient_light_intensity
    sun.color.setHex(PARAMETERS.directional_light_color)
    sun.intensity = night ? 0 : Math.PI * PARAMETERS.directional_light_intensity
    moon.intensity = (night || s === 0) ? Math.PI * PARAMETERS.moon_light_intensity : 0

    // Darken the base sky color as the sun sets (tinycolor darken in 2022)
    const factor = s > 0 ? (1 - Math.sin(a)) * 100 : 0
    baseSky.setHex(PARAMETERS.sky_color).getHSL(hsl)
    hsl.l = Math.min(1, Math.max(0, hsl.l - factor / 100))
    scene.background.setHSL(hsl.h, hsl.s, hsl.l)
    scene.fog.color.copy(scene.background)
    scene.fog.density = PARAMETERS.fog_density
  }

  return { ambient, sun, moon, update }
}
