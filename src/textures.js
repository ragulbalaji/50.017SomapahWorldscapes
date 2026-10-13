import * as THREE from 'three'

const TEXTURE_URLS = {
  'Grass Texture': 'assets/tex/grass.png',
  'Biome Texture': 'assets/tex/biome-lookup-discrete.png',
  'Sky Texture': 'assets/tex/sky.jpg',
  'Reference Test Texture': 'assets/tex/texmap.png'
}

export async function loadTextures () {
  const loader = new THREE.TextureLoader()
  const entries = await Promise.all(
    Object.entries(TEXTURE_URLS).map(async ([name, url]) => [name, await loader.loadAsync(url)])
  )
  return Object.fromEntries(entries)
}
