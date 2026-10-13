/// ////////////////////////////////////////////////////////////////////////////
// Constants (no DOM or three.js imports: shared with tests and workers)

export const PARAMETERS = {
  world_seed: Math.round(Math.random() * 4206969),
  chunk_size: 96,
  gen_depth: 3,
  chunk_material: 'Phong Material',
  gravity: 70,
  day_night_speed: 0.01,
  sky_color: 0x79a6ff,
  fog_density: 0.001,
  chunk_noise_x_offset: 6969,
  chunk_noise_z_offset: 6969,
  temp_divisor: 512,
  rain_divisor: 256,
  mountain_divisor: 512,
  mountain_threshold: 24,
  troty_multiplier: 123,
  tree_choice_x_multiplier: 4242,
  tree_choice_z_multiplier: 6969,
  tree_a_threshold: 0,
  tree_b_threshold: 0.4,
  ambient_light_color: 0x404040,
  ambient_light_intensity: 0.5,
  directional_light_color: 0xfdfbd3,
  directional_light_intensity: 0.8,
  directional_light_angle: 90,
  moon_light_intensity: 0.15
}

export const MATERIAL_PARAMETERS = {
  'Phong Material': {
    color: 0xfdfbd3,
    shininess: 10,
    map: 'Biome Texture'
  },
  'Wireframe Material': {
    color: 0x000000
  }
}

export const HUD = {
  camera_position: '(0.0, 0.0, 0.0)',
  num_of_loaded_chunks: 0,
  mode: 'CREATIVE'
}

export const STEPS_PER_FRAME = 3
export const POINTER_SPEED = 2
export const PLAYER_INIT_HEIGHT = 64
export const PLAYER_HEIGHT = 2
export const PLAYER_STEP_DOWN = 1 // max drop the player follows while walking
export const PLAYER_SPEED_GROUND = 60
export const PLAYER_SPEED_AIR = 30
export const CREATIVE_SPEED_FACTOR = 20
export const NIGHT_TIME_FACTOR = 2500
export const SUN_DISTANCE = 200 // sun distance from the player
export const [LOWER_Y, UPPER_Y] = [0, 250] // vertical world bounds
export const [LOWER_X, UPPER_X] = [-1e14, 1e14] // x-axis world bounds
export const [LOWER_Z, UPPER_Z] = [-1e14, 1e14] // z-axis world bounds

// Instanced decorations: capacity is the max instance count per model
export const MODELS = {
  TREEA: { url: 'assets/models/gltf/detail_treeA.gltf.glb', capacity: 15000 },
  TREEB: { url: 'assets/models/gltf/detail_treeB.gltf.glb', capacity: 15000 },
  TREEC: { url: 'assets/models/gltf/detail_treeC.gltf.glb', capacity: 15000 },
  WELLS: { url: 'assets/models/gltf/well.gltf.glb', capacity: 2000 },
  HOUSE: { url: 'assets/models/gltf/house.gltf.glb', capacity: 2000 }
}
