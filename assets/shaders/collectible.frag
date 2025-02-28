uniform vec3 glowColor;
uniform float time;
varying vec3 vNormal;
varying vec2 vUv;

void main() {
    float intensity = pow(0.6 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 4.0);
    vec3 color = glowColor * intensity;
    float pulse = sin(time * 3.0) * 0.5 + 0.5;
    color *= 0.8 + pulse * 0.4;
    gl_FragColor = vec4(color, intensity);
}