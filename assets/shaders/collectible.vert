varying vec3 vNormal;
varying vec2 vUv;
uniform float time;

void main() {
    vNormal = normalize(normalMatrix * normal);
    vUv = uv;
    vec3 pos = position;
    float wave = sin(time * 2.0 + position.y * 4.0) * 0.1;
    pos += normal * wave;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}