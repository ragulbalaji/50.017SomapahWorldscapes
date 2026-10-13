import GUI from 'lil-gui'
import { PARAMETERS, MATERIAL_PARAMETERS, HUD } from './config.js'

export function createGui ({ chunks, materials, textures }) {
  const gui = new GUI({ width: 390 })

  gui.title('Somapah Worldscapes Debug Menu')
  gui.close() // Default closed to save screen space

  const reset = () => chunks.reset()

  const controlsFolder = gui.addFolder('Controls')

  let materialSpecificParamsFolder

  function handleMaterialSpecificControllers (materialName) {
    materialSpecificParamsFolder = gui.addFolder('Material Parameters')
    for (const materialParams in MATERIAL_PARAMETERS[materialName]) {
      if (materialParams === 'color') {
        materialSpecificParamsFolder
          .addColor(MATERIAL_PARAMETERS[materialName], materialParams)
          .name('Color')
          .onChange(function (value) {
            materials[materialName].color.setHex(value)
          })
      } else if (materialParams === 'shininess') {
        materialSpecificParamsFolder
          .add(MATERIAL_PARAMETERS[materialName], materialParams, 0, 100, 0.1)
          .name('Shininess')
          .onChange(function (value) {
            materials[materialName].shininess = value
          })
      } else if (materialParams === 'map') {
        materialSpecificParamsFolder
          .add(MATERIAL_PARAMETERS[materialName], materialParams, Object.keys(textures))
          .name('Texture Map')
          .onChange(function (value) {
            materials[materialName].map = textures[value]
          })
      }
    }
  }

  controlsFolder
    .add(PARAMETERS, 'world_seed', Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, 1)
    .name('World Seed')
    .onFinishChange(reset)
  controlsFolder
    .add(PARAMETERS, 'chunk_size', 16, 256, 1)
    .name('Chunk Size')
    .onFinishChange(reset)
  controlsFolder
    .add(PARAMETERS, 'gen_depth', 1, 4, 1)
    .name('Generation Depth')
  controlsFolder
    .add(PARAMETERS, 'chunk_material', Object.keys(materials))
    .name('Chunk Material')
    .onFinishChange(function (materialName) {
      chunks.setMaterial(materials[materialName])
      materialSpecificParamsFolder.destroy()
      handleMaterialSpecificControllers(materialName)
    })
  controlsFolder.add(PARAMETERS, 'gravity', 1, 100, 1).name('Gravity')
  controlsFolder
    .add(PARAMETERS, 'day_night_speed', 0, 1, 0.01)
    .name('Day-Night Cycle Speed')
  controlsFolder
    .addColor(PARAMETERS, 'sky_color')
    .name('Base Sky Color')
  controlsFolder
    .add(PARAMETERS, 'fog_density', 0, 0.1, 0.0001)
    .name('Fog Density')

  const noiseFolder = gui.addFolder('Noise')

  noiseFolder
    .add(PARAMETERS, 'chunk_noise_x_offset', Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, 1)
    .name('Chunk X Offset')
    .onFinishChange(reset)
  noiseFolder
    .add(PARAMETERS, 'chunk_noise_z_offset', Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, 1)
    .name('Chunk Z Offset')
    .onFinishChange(reset)
  noiseFolder
    .add(PARAMETERS, 'temp_divisor', 1, 1024, 1)
    .name('Temperature Divisor')
    .onFinishChange(reset)
  noiseFolder
    .add(PARAMETERS, 'rain_divisor', 1, 1024, 1)
    .name('Rain Divisor')
    .onFinishChange(reset)
  noiseFolder
    .add(PARAMETERS, 'mountain_divisor', 1, 1024, 1)
    .name('Mountain Divisor')
    .onFinishChange(reset)
  noiseFolder
    .add(PARAMETERS, 'mountain_threshold', 1, 1024, 1)
    .name('Mountain Threshold')
    .onFinishChange(reset)
  noiseFolder
    .add(PARAMETERS, 'troty_multiplier', 1, Number.MAX_SAFE_INTEGER, 1)
    .name('Troty Multiplier')
    .onFinishChange(reset)
  noiseFolder
    .add(PARAMETERS, 'tree_choice_x_multiplier', 1, Number.MAX_SAFE_INTEGER, 1)
    .name('Tree Choice X Multiplier')
    .onFinishChange(reset)
  noiseFolder
    .add(PARAMETERS, 'tree_choice_z_multiplier', 1, Number.MAX_SAFE_INTEGER, 1)
    .name('Tree Choice Z Multiplier')
    .onFinishChange(reset)
  noiseFolder
    .add(PARAMETERS, 'tree_a_threshold', 0, 0.4, 0.01)
    .name('Tree A Threshold')
    .onFinishChange(reset)
  noiseFolder
    .add(PARAMETERS, 'tree_b_threshold', 0.4, 1, 0.01)
    .name('Tree B Threshold')
    .onFinishChange(reset)

  // Lights, sky and fog are applied every frame by sky.update()
  const lightsFolder = gui.addFolder('Lights')

  lightsFolder
    .addColor(PARAMETERS, 'ambient_light_color')
    .name('Ambient Color')
  lightsFolder
    .add(PARAMETERS, 'ambient_light_intensity', 0, 1, 0.01)
    .name('Ambient Intensity')
  lightsFolder
    .addColor(PARAMETERS, 'directional_light_color')
    .name('Directional Color')
  lightsFolder
    .add(PARAMETERS, 'directional_light_intensity', 0, 1, 0.01)
    .name('Directional Intensity')
  lightsFolder
    .add(PARAMETERS, 'directional_light_angle', 0, 180, 0.01)
    .name('Directional Angle')
    .listen()
  lightsFolder
    .add(PARAMETERS, 'moon_light_intensity', 0, 1, 0.01)
    .name('Moon Intensity')

  const hudFolder = gui.addFolder('HUD')

  hudFolder
    .add(HUD, 'camera_position')
    .name('Camera Position')
    .listen()
    .disable()
  hudFolder
    .add(HUD, 'num_of_loaded_chunks')
    .name('Number of Loaded Chunks')
    .listen()
    .disable()
  hudFolder.add(HUD, 'mode').name('Mode').listen().disable()

  handleMaterialSpecificControllers(PARAMETERS.chunk_material)

  return {
    // Fold the parameter folders away while playing; HUD stays as it is.
    setFoldersOpen (open) {
      if (gui._closed) return
      for (const folder of gui.folders) {
        if (folder === hudFolder) continue
        if (open) folder.open()
        else folder.close()
      }
    }
  }
}
