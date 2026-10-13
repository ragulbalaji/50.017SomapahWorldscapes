import * as THREE from 'three'

export function createMaterials (textures) {
  const phongMaterial = new THREE.MeshPhongMaterial({
    color: 0xfdfbd3,
    shininess: 10,
    flatShading: true,
    map: textures['Biome Texture']
  })

  phongMaterial.onBeforeCompile = function (shader) {
    shader.vertexShader = shader.vertexShader.replace(
      'varying vec3 vViewPosition;',
      `
    varying vec3 vViewPosition;
    varying vec3 vPosition;
    `
    ).replace(
      '#include <begin_vertex>',
      '#include <begin_vertex>\nvPosition = position;'
    )
    shader.fragmentShader = shader.fragmentShader.replace(
      'uniform float opacity;',
      `
    uniform float opacity;
    varying vec3 vPosition;
    `
    ).replace(
      '#include <map_fragment>',
      `
    if (vMapUv.x > 0.8 && vMapUv.y > 0.8) {
      vec4 sampledDiffuseColor = vec4(0.1, 0.2, 0.7 - vPosition.y, 1.0);
      diffuseColor *= sampledDiffuseColor;
    } else {
      vec4 sampledDiffuseColor = texture2D( map, vec2(vMapUv.x, vPosition.y / 64.0));
      diffuseColor *= sampledDiffuseColor;
    }
    `
    )
  }

  const shaderMaterial = new THREE.ShaderMaterial({
    vertexShader: `varying vec3 vPosition;
    varying vec2 vUV;
    void main() {
      vPosition = position;
      vUV = uv;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
    fragmentShader: `varying vec3 vPosition;
    varying vec2 vUV;
    uniform sampler2D uTexture;
    void main() {
      if (vUV.x > 0.8 && vUV.y > 0.8) {
        gl_FragColor = vec4(0.1, 0.2, 0.7 - vPosition.y, 1.0);
      } else {
        vec3 color = texture2D(uTexture, vUV).rgb;
        gl_FragColor = vec4(color, 1.0);
      }
    }`,
    uniforms: {
      uTexture: {
        value: textures['Grass Texture']
      }
    }
  })

  const normalMaterial = new THREE.MeshNormalMaterial({ flatShading: true })

  const wireframeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000, wireframe: true })

  return {
    'Phong Material': phongMaterial,
    'Shader Material': shaderMaterial,
    'Normal Material': normalMaterial,
    'Wireframe Material': wireframeMaterial
  }
}
