const VignetteShader = {
    uniforms: {
        "tDiffuse": { value: null },
        "offset": { value: 1.0 },
        "darkness": { value: 1.5 }
    },
    vertexShader: /* glsl */`
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: /* glsl */`
        uniform sampler2D tDiffuse;
        uniform float offset;
        uniform float darkness;
        varying vec2 vUv;
        void main() {
            vec4 texel = texture2D(tDiffuse, vUv);
            vec2 center = vec2(0.5);
            float dist = distance(vUv, center);
            texel.rgb *= smoothstep(0.8, offset * 0.799, dist * darkness);
            gl_FragColor = texel;
        }
    `
};

export { VignetteShader };